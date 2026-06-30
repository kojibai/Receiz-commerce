import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";

export const runtime = "nodejs";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function nestedRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return {};
}

function normalizeHandle(value: string) {
  const handle = value.trim().replace(/^@/, "");
  if (!handle) return "";
  return handle.includes(".") ? handle : `${handle}.receiz.id`;
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("receiz_access_token")?.value;
  const sessionScope = request.cookies.get("receiz_session_scope")?.value;
  const hostContext = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));

  if (!accessToken) {
    return NextResponse.json({ ok: true, connected: false });
  }

  if (sessionScope && sessionScope !== hostContext.storageKey) {
    return NextResponse.json({
      ok: true,
      connected: false,
      scope: hostContext.storageKey
    });
  }

  try {
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });
    const userinfo = asRecord(await receiz.client.identity.userinfo());
    const appProfile = nestedRecord(userinfo, ["receiz_app", "commerce", "store", "app_metadata", "profile"]);
    const profileSource = { ...userinfo, ...appProfile };
    const handle = normalizeHandle(
      stringField(profileSource, ["receiz_id", "receizId", "preferred_username", "username", "handle"])
    );

    return NextResponse.json({
      ok: true,
      connected: true,
      scope: hostContext.storageKey,
      surface: hostContext.surface,
      profile: {
        id: stringField(profileSource, ["sub", "user_id", "uid", "id"]),
        name: stringField(profileSource, ["name", "display_name", "displayName"]),
        email: stringField(profileSource, ["email"]),
        handle,
        subdomain: stringField(profileSource, ["receiz_app_subdomain", "store_subdomain", "subdomain", "tenantSlug"]),
        customDomain: stringField(profileSource, ["receiz_app_custom_domain", "store_custom_domain", "customDomain", "custom_domain", "domain"])
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        error: "receiz_profile_unavailable",
        message: error instanceof Error ? error.message : "Unable to load Receiz profile"
      },
      { status: 502 }
    );
  }
}
