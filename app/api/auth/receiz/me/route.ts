import { NextRequest, NextResponse } from "next/server";
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

function normalizeHandle(value: string) {
  const handle = value.trim().replace(/^@/, "");
  if (!handle) return "";
  return handle.includes(".") ? handle : `${handle}.receiz.id`;
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("receiz_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ ok: true, connected: false });
  }

  try {
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });
    const userinfo = asRecord(await receiz.client.identity.userinfo());
    const handle = normalizeHandle(
      stringField(userinfo, ["receiz_id", "receizId", "preferred_username", "username", "handle"])
    );

    return NextResponse.json({
      ok: true,
      connected: true,
      profile: {
        id: stringField(userinfo, ["sub", "user_id", "uid", "id"]),
        name: stringField(userinfo, ["name", "display_name", "displayName"]),
        email: stringField(userinfo, ["email"]),
        handle
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
