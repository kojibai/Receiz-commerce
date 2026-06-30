import { NextResponse } from "next/server";
import { mockAuth } from "@/lib/auth/mock-auth";
import { receizCommerceAdapter } from "@/lib/receiz/adapter";
import { getRequestOrigin } from "@/lib/url";

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);

  return NextResponse.json({
    ok: true,
    receizId: mockAuth.getReceizIdState(),
    authorizeUrl: mockAuth.getReceizIdAuthorizeUrl(origin)
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "sign_in");

  if (action === "create") {
    const account = await mockAuth.createReceizId();
    return NextResponse.json({
      ok: true,
      action,
      account: {
        identity: {
          schema: account.identity.schema,
          createdAt: account.identity.createdAt,
          updatedAt: account.identity.updatedAt,
          localUid: account.identity.localUid,
          username: account.identity.username,
          displayName: account.identity.displayName,
          deviceName: account.identity.deviceName,
          keyId: account.projection.keyId
        },
        continueRequest: account.continueRequest,
        projection: account.projection
      }
    });
  }

  if (action === "restore") {
    const artifact = String(body.artifact ?? "");
    if (!artifact) {
      return NextResponse.json({ ok: false, error: "missing_receiz_identity_artifact" }, { status: 400 });
    }

    const restored = await receizCommerceAdapter.restoreIdentityArtifact(artifact);
    const proof = await receizCommerceAdapter.signIdentityLoginProof({
      keyFile: restored.keyFile,
      challengeText: String(body.challengeText ?? "RECEIZ_APP_LOGIN_V1")
    });
    const verified = await receizCommerceAdapter.verifyIdentityLoginProof({
      keyFile: restored.keyFile,
      challengeB64Url: proof.challengeB64Url,
      signatureB64Url: proof.signatureB64Url
    });

    return NextResponse.json({
      ok: true,
      action,
      verified,
      account: restored.projection,
      proof
    });
  }

  return NextResponse.json({
    ok: true,
    action,
    account: mockAuth.signInWithReceizId()
  });
}
