import { NextRequest, NextResponse } from "next/server";
import { receizCommerceAdapter } from "@/lib/receiz/adapter";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { getReceizRedirectUri, getRequestOrigin } from "@/lib/url";

export const runtime = "nodejs";

function redirectWithError(origin: string, error: string) {
  return NextResponse.redirect(new URL(`/admin?receiz_error=${encodeURIComponent(error)}`, origin));
}

function clearOauthCookies(response: NextResponse) {
  for (const name of ["receiz_pkce_verifier", "receiz_oauth_state", "receiz_oauth_return_to", "receiz_oauth_scope"]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/api/auth/receiz",
      sameSite: "lax"
    });
  }
}

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("receiz_oauth_state")?.value;
  const verifier = request.cookies.get("receiz_pkce_verifier")?.value;
  const returnTo = request.cookies.get("receiz_oauth_return_to")?.value ?? "/admin";
  const oauthScope = request.cookies.get("receiz_oauth_scope")?.value;
  const clientId = process.env.RECEIZ_CLIENT_ID;

  if (error) return redirectWithError(origin, error);
  if (!code) return redirectWithError(origin, "missing_code");
  if (!clientId) return redirectWithError(origin, "missing_client_id");
  if (!expectedState || state !== expectedState) return redirectWithError(origin, "invalid_state");
  if (!verifier) return redirectWithError(origin, "missing_pkce_verifier");

  const redirectUri = process.env.RECEIZ_ID_CALLBACK_URL ?? getReceizRedirectUri(origin);
  const token = await receizCommerceAdapter.client.identity.token({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    client_id: clientId,
    client_secret: process.env.RECEIZ_CLIENT_SECRET || undefined,
    redirect_uri: redirectUri
  });

  const target = new URL(returnTo.startsWith("/") ? returnTo : "/admin", origin);
  target.searchParams.set("receiz", "connected");

  const response = NextResponse.redirect(target);
  const secure = origin.startsWith("https://");
  const accessMaxAge = Math.max(60, token.expires_in || 3600);
  const hostContext = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));

  response.cookies.set("receiz_access_token", token.access_token, {
    httpOnly: true,
    maxAge: accessMaxAge,
    path: "/",
    sameSite: "lax",
    secure
  });
  response.cookies.set("receiz_session_scope", oauthScope || hostContext.storageKey, {
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

  clearOauthCookies(response);

  return response;
}
