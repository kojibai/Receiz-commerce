import { NextRequest, NextResponse } from "next/server";
import { createTwinAssistDraft, type TwinAssistInput } from "@/lib/content/twin-assist";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { receizLoginRequired } from "@/lib/receiz/session";
import { platform } from "@/lib/platform";

export const runtime = "nodejs";

const CONTENT_ASSIST_SCHEMA = "receiz.app.content_assist.v1";

function isTwinAssistInput(value: unknown): value is TwinAssistInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  const brand = input.brand;
  return (
    (input.kind === "page" || input.kind === "blog" || input.kind === "product") &&
    Boolean(brand) &&
    typeof brand === "object" &&
    !Array.isArray(brand)
  );
}

function returnToFromRequest(request: NextRequest) {
  const referer = request.headers.get("referer");
  if (!referer) return "/admin";

  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}`;
  } catch {
    return "/admin";
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!isTwinAssistInput(body)) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_twin_assist_request",
        message: "Send kind, brand, and the current page/blog/product draft."
      },
      { status: 400 }
    );
  }

  const hostContext = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  const accessToken = request.cookies.get("receiz_access_token")?.value;
  const sessionScope = request.cookies.get("receiz_session_scope")?.value;
  const requireReceiz = process.env.NEXT_PUBLIC_AUTH_MODE === "receiz_id";
  const hasScopedSession = Boolean(accessToken && sessionScope === hostContext.storageKey);

  if (requireReceiz && !hasScopedSession) {
    return NextResponse.json(receizLoginRequired(returnToFromRequest(request)), { status: 401 });
  }

  const draft = createTwinAssistDraft(body);

  if (!hasScopedSession || !accessToken) {
    return NextResponse.json({
      ok: true,
      mode: "local_preview",
      note: "Connect Receiz ID to record this content assist through Receiz rails.",
      draft
    });
  }

  try {
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });
    const userinfo = await receiz.client.identity.userinfo().catch(() => ({}));
    const record = await receiz.connectRecord({
      schema: CONTENT_ASSIST_SCHEMA,
      platform: platform.productName,
      hostScope: hostContext.storageKey,
      tenantHost: hostContext.tenantHost,
      kind: body.kind,
      requestedAt: new Date().toISOString(),
      prompt: body.topic ?? body.page?.title ?? body.post?.title ?? body.product?.name ?? "",
      brand: body.brand,
      userinfo,
      draft
    });

    return NextResponse.json({
      ok: true,
      mode: "receiz_twin_recorded",
      draft: {
        ...draft,
        source: "receiz_twin",
        rail: "receiz_connect_record"
      },
      record
    });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      mode: "local_preview",
      warning: error instanceof Error ? error.message : "Receiz Twin assist was generated locally.",
      draft
    });
  }
}
