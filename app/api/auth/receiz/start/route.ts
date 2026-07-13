import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { receizCommerceAdapter } from "@/lib/receiz/adapter";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { getReceizRedirectUri, getRequestOrigin } from "@/lib/url";
import { buildReceizConnectEntryUrl } from "@/lib/receiz/connect-url";
import { packReceizOAuthState } from "@/lib/receiz/oauth-state";
import { receizOidcScopesFromEnv } from "@/lib/receiz/oauth-scopes";

export const runtime = "nodejs";

function base64Url(bytes: Buffer) {
  return bytes.toString("base64url");
}

function codeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const clientId = process.env.RECEIZ_CLIENT_ID;
  const hostContext = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));

  if (!clientId) {
    return NextResponse.redirect(new URL(`${hostContext.surface === "tenant" ? "/account" : "/admin"}?receiz_error=missing_client_id`, origin));
  }

  const verifier = base64Url(randomBytes(48));
  const flowNonce = base64Url(randomBytes(32));
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/admin";
  const redirectUri = process.env.RECEIZ_ID_CALLBACK_URL ?? getReceizRedirectUri(origin);
  const state = packReceizOAuthState({
    flowNonce,
    verifier,
    returnTo,
    sessionScope: hostContext.storageKey,
    startOrigin: origin
  });
  const authorizeUrl = receizCommerceAdapter.buildReceizIdAuthorizeUrl({
    clientId,
    redirectUri,
    codeChallenge: codeChallenge(verifier),
    scopes: receizOidcScopesFromEnv(process.env),
    state
  });

  const response = NextResponse.redirect(buildReceizConnectEntryUrl(authorizeUrl));
  response.cookies.set("receiz_oauth_flow", flowNonce, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/api/auth/receiz",
    sameSite: "lax",
    secure: origin.startsWith("https://")
  });
  return response;
}
