import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { receizCommerceAdapter } from "@/lib/receiz/adapter";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { getReceizRedirectUri, getRequestOrigin } from "@/lib/url";
import { packReceizOAuthState } from "@/lib/receiz/oauth-state";

export const runtime = "nodejs";

const RECEIZ_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "receiz:record",
  "receiz:seal",
  "receiz:verify",
  "receiz:wallet.read",
  "receiz:wallet.transfer",
  "receiz:payments.create",
  "receiz:payments.read",
  "receiz:notes.mint",
  "receiz:notes.claim",
  "receiz:notes.read",
  "receiz:twin.read",
  "receiz:twin.write"
];

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
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/admin";
  const redirectUri = process.env.RECEIZ_ID_CALLBACK_URL ?? getReceizRedirectUri(origin);
  const state = packReceizOAuthState({
    verifier,
    returnTo,
    sessionScope: hostContext.storageKey,
    startOrigin: origin
  });
  const authorizeUrl = receizCommerceAdapter.buildReceizIdAuthorizeUrl({
    clientId,
    redirectUri,
    codeChallenge: codeChallenge(verifier),
    scopes: RECEIZ_SCOPES,
    state
  });

  return NextResponse.redirect(authorizeUrl);
}
