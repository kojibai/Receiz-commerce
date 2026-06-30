import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { receizCommerceAdapter } from "@/lib/receiz/adapter";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { getReceizRedirectUri, getRequestOrigin } from "@/lib/url";

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
  "receiz:notes.read"
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

  if (!clientId) {
    return NextResponse.redirect(new URL("/admin?receiz_error=missing_client_id", origin));
  }

  const verifier = base64Url(randomBytes(48));
  const state = base64Url(randomBytes(24));
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/admin";
  const redirectUri = process.env.RECEIZ_ID_CALLBACK_URL ?? getReceizRedirectUri(origin);
  const hostContext = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  const authorizeUrl = receizCommerceAdapter.buildReceizIdAuthorizeUrl({
    clientId,
    redirectUri,
    codeChallenge: codeChallenge(verifier),
    scopes: RECEIZ_SCOPES,
    state
  });

  const response = NextResponse.redirect(authorizeUrl);
  const secure = origin.startsWith("https://");

  response.cookies.set("receiz_pkce_verifier", verifier, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/api/auth/receiz",
    sameSite: "lax",
    secure
  });
  response.cookies.set("receiz_oauth_state", state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/api/auth/receiz",
    sameSite: "lax",
    secure
  });
  response.cookies.set("receiz_oauth_return_to", returnTo, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/api/auth/receiz",
    sameSite: "lax",
    secure
  });
  response.cookies.set("receiz_oauth_scope", hostContext.storageKey, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/api/auth/receiz",
    sameSite: "lax",
    secure
  });

  return response;
}
