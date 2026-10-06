import {
  createReceizIdentityKeyFile, digestReceizCanonicalV122, receizBase64UrlEncode,
  serializeReceizIdentityArtifact, sha256ReceizBytes, type ReceizProofAuthorityV123
} from "@receiz/sdk";
import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { NextRequest } from "next/server.js";
import { GET, POST } from "../app/api/auth/receiz/proof/route";
import { GET as startPermission } from "../app/api/auth/receiz/start/route";
import { inAppPermissionChallenge, inAppPermissionScopes, readInAppPermissionIdentity, requireInAppPermissionConsent } from "../src/lib/receiz/in-app-permission";
import { receizAuthorityRequired } from "../src/lib/receiz/session";
import { signReceizProofAuthorityChallengeAtEdgeV123 } from "../src/lib/receiz/v123/consent";

const applicationId = "test-receiz-app";
const passphrase = "fixture-passphrase-only";
let artifact: Uint8Array;
let keyId: string;
before(async () => {
  const identity = await createReceizIdentityKeyFile({ passphrase, owner: { uid: "fixture-user", username: "fixture" },
    portableState: { snapshot: { profile: { name: "Fixture" } } } });
  keyId = identity.keyId;
  artifact = new TextEncoder().encode(serializeReceizIdentityArtifact(identity.keyFile));
});

async function permission(purpose = "platform_billing" as const) {
  return inAppPermissionChallenge({ applicationId, artifactDigest: await sha256ReceizBytes(artifact), purpose, tenantHost: "localhost" });
}

describe("in-app Receiz proof permission", () => {
  it("keeps merchant publishing, billing and customer permission entries inside the requesting app", async () => {
    for (const [origin, purpose, path] of [
      ["http://localhost:3000", "store_manage", "/admin"],
      ["https://seller.example", "wallet_checkout", "/account"]
    ]) {
      const response = await startPermission(new NextRequest(`${origin}/api/auth/receiz/start?returnTo=https://receiz.com`, {
        headers: { host: new URL(origin).host }
      }));
      const location = new URL(response.headers.get("location")!);
      assert.equal(location.origin, origin);
      assert.equal(location.pathname, path);
      assert.equal(location.searchParams.get("receiz_purpose"), purpose);
      const challenge = await inAppPermissionChallenge({ applicationId, artifactDigest: await sha256ReceizBytes(artifact),
        purpose: purpose as "store_manage" | "wallet_checkout", tenantHost: new URL(origin).hostname });
      assert.equal(challenge.scopes.includes("receiz:record"), purpose === "store_manage");
      assert.equal(challenge.scopes.includes("receiz:wallet.read"), purpose === "wallet_checkout");
    }
    const billing = await startPermission(new NextRequest("http://localhost:3000/api/auth/receiz/start?purpose=platform_billing", { headers: { host: "localhost:3000" } }));
    assert.equal(new URL(billing.headers.get("location")!).searchParams.get("receiz_purpose"), "platform_billing");
    assert.equal(receizAuthorityRequired("/admin", "wallet_checkout").permissionPurpose, "wallet_checkout");
    assert.equal(new URL(receizAuthorityRequired("/admin", "platform_billing").connectUrl, "http://localhost:3000").searchParams.get("receiz_purpose"), "platform_billing");
  });

  it("requires a verified carried account proof and keeps clear signing keys on the device", async () => {
    assert.equal((await readInAppPermissionIdentity(artifact)).keyId, keyId);
    const clear = await createReceizIdentityKeyFile({ owner: { uid: "fixture-clear" }, portableState: { snapshot: {} } });
    await assert.rejects(readInAppPermissionIdentity(new TextEncoder().encode(serializeReceizIdentityArtifact(clear.keyFile))), /encrypted_identity_seal_required/);
    const tampered = JSON.parse(new TextDecoder().decode(artifact));
    tampered.portableState.proof.digestSha256Hex = "0".repeat(64);
    await assert.rejects(readInAppPermissionIdentity(new TextEncoder().encode(JSON.stringify(tampered))), /verified_identity_seal_required/);
  });

  it("binds consent to the exact artifact, application, tenant, purpose and minimum scopes", async () => {
    const prepared = await permission();
    const challenge = await signReceizProofAuthorityChallengeAtEdgeV123({ artifact, passphrase, ...prepared });
    const input = { applicationId, artifactDigest: await sha256ReceizBytes(artifact), purpose: "platform_billing" as const,
      tenantHost: "localhost", challenge };
    assert.deepEqual(await requireInAppPermissionConsent(input), inAppPermissionScopes("platform_billing"));
    for (const change of [{ artifactDigest: "b".repeat(64) }, { applicationId: "another-app" },
      { tenantHost: "other.receiz.app" }, { purpose: "wallet_checkout" as const }, { purpose: "store_manage" as const },
      { challenge: { ...challenge, consent: { ...challenge.consent, approved: false } } }]) {
      await assert.rejects(requireInAppPermissionConsent({ ...input, ...change }), /explicit_permission_consent_required/);
    }
    assert.equal(inAppPermissionScopes("platform_billing").includes("receiz:reserve.write"), true);
    assert.equal(inAppPermissionScopes("platform_billing").includes("receiz:domains.read"), true);
    assert.equal(inAppPermissionScopes("platform_billing").includes("receiz:domains.write"), true);
    assert.equal(inAppPermissionScopes("platform_billing").includes("receiz:wallet.transfer"), false);
    assert.equal(inAppPermissionScopes("store_manage").includes("receiz:reserve.write"), false);
  });

  it("rejects cross-origin permission exchange before reading any artifact", async () => {
    const response = await POST(new NextRequest("https://app.test/api/auth/receiz/proof", {
      method: "POST", headers: { origin: "https://other.test" }, body: "{}"
    }));
    assert.equal(response.status, 403);
    assert.equal(response.headers.has("set-cookie"), false);
  });

  it("uses the actual SDK exchange and scope introspection while keeping the bearer out of browser JSON", async () => {
    const originalFetch = globalThis.fetch;
    const originalClientId = process.env.RECEIZ_CLIENT_ID;
    const originalBaseUrl = process.env.RECEIZ_BASE_URL;
    const requests: string[] = [];
    process.env.RECEIZ_CLIENT_ID = applicationId;
    process.env.RECEIZ_BASE_URL = "https://receiz.test";
    const prepared = await permission();
    const challenge = await signReceizProofAuthorityChallengeAtEdgeV123({ artifact, passphrase, ...prepared });
    const basis: Omit<ReceizProofAuthorityV123, "accessToken" | "authorityDigest"> = {
      schema: "receiz.identity.proof-authority.v123", applicationId, keyId, artifactDigest: await sha256ReceizBytes(artifact),
      grantedScopes: prepared.scopes, issuedAtKai: challenge.issuedAtKai, expiresAtKai: challenge.expiresAtKai,
      nonce: challenge.nonce, revocationHead: "d".repeat(64), tokenType: "Bearer", expiresIn: 120, refreshable: false,
      authority: { grantIsIdentityAuthority: false, strongerTruth: "receiz-identity-artifact" }
    };
    const grant = { ...basis, accessToken: "fixture-private-bearer", authorityDigest: await digestReceizCanonicalV122(basis) };
    let inflatedScopes = false;
    globalThis.fetch = (async (url, init) => {
      const path = new URL(String(url)).pathname;
      requests.push(path);
      if (path.endsWith("/identity/proof-authority/exchange")) {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.artifact.exactBytesB64u, receizBase64UrlEncode(artifact));
        assert.equal(body.challenge.proof.keyId, keyId);
        assert.deepEqual(body.scopes, prepared.scopes);
        assert.equal(String(init?.body).includes(passphrase), false);
        return Response.json(grant);
      }
      if (path.endsWith("/auth/granted-scopes")) {
        assert.equal(new Headers(init?.headers).get("authorization"), "Bearer fixture-private-bearer");
        return Response.json({ schema: "receiz.auth.granted-scopes.v123",
          grantedScopes: inflatedScopes ? [...prepared.scopes, "receiz:wallet.transfer"] : prepared.scopes });
      }
      throw new Error(`Unexpected request: ${path}`);
    }) as typeof fetch;
    const request = (signed = challenge) => new NextRequest("http://localhost:3000/api/auth/receiz/proof", {
      method: "POST", headers: { origin: "http://localhost:3000", host: "localhost:3000" },
      body: JSON.stringify({ applicationId, purpose: "platform_billing", artifactB64u: receizBase64UrlEncode(artifact), challenge: signed })
    });
    try {
      const challengeResponse = await GET(new NextRequest(`http://localhost:3000/api/auth/receiz/proof?purpose=platform_billing&artifactDigest=${basis.artifactDigest}`, { headers: { host: "localhost:3000" } }));
      assert.equal(challengeResponse.status, 200);
      assert.equal(challengeResponse.headers.get("cache-control"), "no-store");
      const response = await POST(request());
      assert.equal(response.status, 200, await response.clone().text());
      const result = await response.json();
      assert.equal(result.connected, true);
      assert.equal(JSON.stringify(result).includes("fixture-private-bearer"), false);
      assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/i);
      assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=120/i);
      assert.match(response.headers.get("set-cookie") ?? "", /SameSite=strict/i);
      assert.deepEqual(requests, ["/api/sdk/v1/identity/proof-authority/exchange", "/api/sdk/v1/auth/granted-scopes"]);

      inflatedScopes = true;
      const inflated = await POST(request());
      assert.equal(inflated.status, 409);
      assert.equal(inflated.headers.has("set-cookie"), false);

      const count = requests.length;
      const altered = await POST(request({ ...challenge, proof: { ...challenge.proof, signatureB64Url: "altered" } }));
      assert.equal(altered.status, 409);
      assert.equal(altered.headers.has("set-cookie"), false);
      assert.equal(requests.length, count, "the SDK must reject an altered signature before sending a request");
    } finally {
      globalThis.fetch = originalFetch;
      if (originalClientId === undefined) delete process.env.RECEIZ_CLIENT_ID; else process.env.RECEIZ_CLIENT_ID = originalClientId;
      if (originalBaseUrl === undefined) delete process.env.RECEIZ_BASE_URL; else process.env.RECEIZ_BASE_URL = originalBaseUrl;
    }
  });
});
