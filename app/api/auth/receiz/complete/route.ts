import { NextRequest, NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/url";
import { oauthFlowNonceMatches, unpackReceizSessionTicket } from "@/lib/receiz/oauth-state";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const ticket = request.nextUrl.searchParams.get("ticket");

  if (!ticket) {
    return NextResponse.redirect(new URL("/?receiz_error=missing_ticket", origin));
  }

  try {
    const session = unpackReceizSessionTicket(ticket);
    if (session.startOrigin !== origin || !oauthFlowNonceMatches(request.cookies.get("receiz_oauth_flow")?.value, session.flowNonce)) {
      throw new Error("invalid_ticket_binding");
    }
    const target = new URL(session.returnTo.startsWith("/") ? session.returnTo : "/", origin);
    target.searchParams.set("receiz", "connected");

    const response = NextResponse.redirect(target);
    response.cookies.delete("receiz_oauth_flow");
    const secure = origin.startsWith("https://");
    const accessMaxAge = Math.max(60, session.expiresIn || 3600);

    response.cookies.set("receiz_access_token", session.accessToken, {
      httpOnly: true,
      maxAge: accessMaxAge,
      path: "/",
      sameSite: "lax",
      secure
    });
    response.cookies.set("receiz_session_scope", session.sessionScope, {
      httpOnly: true,
      maxAge: accessMaxAge,
      path: "/",
      sameSite: "lax",
      secure
    });

    if (session.refreshToken) {
      response.cookies.set("receiz_refresh_token", session.refreshToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/api/auth/receiz",
        sameSite: "lax",
        secure
      });
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/?receiz_error=invalid_ticket", origin));
  }
}
