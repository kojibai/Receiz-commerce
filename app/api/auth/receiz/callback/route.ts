import { NextRequest, NextResponse } from "next/server";
import { receizCommerceAdapter } from "@/lib/receiz/adapter";
import { getReceizRedirectUri, getRequestOrigin } from "@/lib/url";
import { oauthFlowNonceMatches, packReceizSessionTicket, unpackReceizOAuthState } from "@/lib/receiz/oauth-state";

export const runtime = "nodejs";

function redirectWithError(origin: string, error: string) {
  return NextResponse.redirect(new URL(`/admin?receiz_error=${encodeURIComponent(error)}`, origin));
}

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const clientId = process.env.RECEIZ_CLIENT_ID;
  let oauthState: ReturnType<typeof unpackReceizOAuthState>;

  if (error) return redirectWithError(origin, error);
  if (!code) return redirectWithError(origin, "missing_code");
  if (!clientId) return redirectWithError(origin, "missing_client_id");

  try {
    if (!state) throw new Error("missing_state");
    oauthState = unpackReceizOAuthState(state);
  } catch {
    return redirectWithError(origin, "invalid_state");
  }
  if (oauthState.startOrigin === origin && !oauthFlowNonceMatches(request.cookies.get("receiz_oauth_flow")?.value, oauthState.flowNonce)) {
    return redirectWithError(origin, "invalid_state");
  }

  const redirectUri = process.env.RECEIZ_ID_CALLBACK_URL ?? getReceizRedirectUri(origin);
  const token = await receizCommerceAdapter.exchangeReceizIdToken({
    grant_type: "authorization_code",
    code,
    code_verifier: oauthState.verifier,
    client_id: clientId,
    client_secret: process.env.RECEIZ_CLIENT_SECRET || undefined,
    redirect_uri: redirectUri
  });

  if (oauthState.startOrigin !== origin) {
    const ticket = packReceizSessionTicket({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      returnTo: oauthState.returnTo,
      sessionScope: oauthState.sessionScope,
      flowNonce: oauthState.flowNonce,
      startOrigin: oauthState.startOrigin
    });
    const tenantTarget = new URL("/api/auth/receiz/complete", oauthState.startOrigin);
    tenantTarget.searchParams.set("ticket", ticket);
    return NextResponse.redirect(tenantTarget);
  }

  const target = new URL(oauthState.returnTo.startsWith("/") ? oauthState.returnTo : "/", origin);
  target.searchParams.set("receiz", "connected");

  const response = NextResponse.redirect(target);
  response.cookies.delete("receiz_oauth_flow");
  const secure = origin.startsWith("https://");
  const accessMaxAge = Math.max(60, token.expires_in || 3600);

  response.cookies.set("receiz_access_token", token.access_token, {
    httpOnly: true,
    maxAge: accessMaxAge,
    path: "/",
    sameSite: "lax",
    secure
  });
  response.cookies.set("receiz_session_scope", oauthState.sessionScope, {
    httpOnly: true,
    maxAge: accessMaxAge,
    path: "/",
    sameSite: "lax",
    secure
  });

  if (token.refresh_token) {
    response.cookies.set("receiz_refresh_token", token.refresh_token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/api/auth/receiz",
      sameSite: "lax",
      secure
    });
  }

  return response;
}
