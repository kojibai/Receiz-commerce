import { receizBase64UrlDecode } from "@receiz/sdk";
import { NextRequest, NextResponse } from "next/server.js";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { inAppPermissionChallenge, isInAppPermissionPurpose } from "@/lib/receiz/in-app-permission";
import { admitReceizInAppPermissionV123 } from "@/lib/receiz/v123/proof-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "no-store" };
function host(request: NextRequest) {
  return hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
}
export async function GET(request: NextRequest) {
  const purpose = request.nextUrl.searchParams.get("purpose");
  if (!isInAppPermissionPurpose(purpose)) return NextResponse.json({ ok: false, error: "permission_purpose_required" }, { status: 400, headers });
  try {
    const permission = await inAppPermissionChallenge({
      applicationId: process.env.RECEIZ_CLIENT_ID ?? "", artifactDigest: request.nextUrl.searchParams.get("artifactDigest") ?? "",
      purpose, tenantHost: host(request).host
    });
    return NextResponse.json({ ok: true, ...permission }, { headers });
  } catch { return NextResponse.json({ ok: false, error: "proof_permission_unavailable" }, { status: 409, headers }); }
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ ok: false, error: "permission_origin_mismatch" }, { status: 403, headers });
  try {
    const raw = await request.text();
    if (raw.length > 2_800_000) return NextResponse.json({ ok: false, error: "identity_artifact_too_large" }, { status: 413, headers });
    const input = JSON.parse(raw);
    if (!isInAppPermissionPurpose(input.purpose) || input.applicationId !== process.env.RECEIZ_CLIENT_ID || typeof input.artifactB64u !== "string") {
      return NextResponse.json({ ok: false, error: "proof_permission_binding_invalid" }, { status: 400, headers });
    }
    const artifact = receizBase64UrlDecode(input.artifactB64u);
    let response: NextResponse | undefined;
    await admitReceizInAppPermissionV123({ artifact, applicationId: input.applicationId,
      purpose: input.purpose, tenantHost: host(request).host, challenge: input.challenge },
    { baseUrl: process.env.RECEIZ_BASE_URL }, (capability) => {
      response = NextResponse.json({ ok: true, connected: true, expiresIn: capability.expiresIn,
        permissionSource: "verified_identity_seal" }, { headers });
      const cookie = { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "strict" as const, path: "/", maxAge: capability.expiresIn };
      response.cookies.set("receiz_access_token", capability.accessToken, cookie);
      response.cookies.set("receiz_session_scope", host(request).storageKey, cookie);
    });
    if (!response) throw new Error("proof_permission_not_admitted");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "proof_permission_failed";
    return NextResponse.json({ ok: false, error: "proof_permission_failed", message: message.slice(0, 250) }, { status: 409, headers });
  }
}
