import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { receizRequestSession } from "@/lib/receiz/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = receizRequestSession(request);
  const hostContext = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  const cookieScopeMismatch =
    session.source === "cookie" &&
    Boolean(session.sessionScope) &&
    session.sessionScope !== hostContext.storageKey;

  if (!session.accessToken) {
    return NextResponse.json({ ok: true, connected: false });
  }

  if (cookieScopeMismatch && !session.delegatedAccessToken) {
    return NextResponse.json({
      ok: true,
      connected: false,
      scope: hostContext.storageKey
    });
  }

  try {
    const accessToken = cookieScopeMismatch && session.delegatedAccessToken
      ? session.delegatedAccessToken
      : session.accessToken;
    const profile = await loadReceizConnectProfile(accessToken);

    return NextResponse.json({
      ok: true,
      connected: true,
      scope: hostContext.storageKey,
      sessionSource: cookieScopeMismatch ? "delegated" : session.source,
      surface: hostContext.surface,
      profile
    });
  } catch (error) {
    console.warn("[receiz-auth] profile unavailable for active token", {
      error: error instanceof Error ? error.message : "Unable to load Receiz profile",
      source: cookieScopeMismatch ? "delegated" : session.source
    });

    return NextResponse.json({
      ok: true,
      connected: true,
      scope: hostContext.storageKey,
      sessionSource: cookieScopeMismatch ? "delegated" : session.source,
      surface: hostContext.surface,
      profile: null,
      profileError: "receiz_profile_unavailable"
    });
  }
}
