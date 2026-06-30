import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";

export const runtime = "nodejs";

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
    const profile = await loadReceizConnectProfile(accessToken);

    return NextResponse.json({
      ok: true,
      connected: true,
      scope: hostContext.storageKey,
      surface: hostContext.surface,
      profile
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
