import { createReceizProofAuthorityChallenge, digestReceizCanonicalV122, readReceizIdentityArtifact,
  verifyReceizIdentityPortableStateProof, receizOidcScopesForRails, type ReceizProofAuthorityChallengeV123 } from "@receiz/sdk";

export type InAppPermissionPurpose = "wallet_checkout" | "platform_billing" | "store_manage";
export function isInAppPermissionPurpose(value: unknown): value is InAppPermissionPurpose {
  return value === "wallet_checkout" || value === "platform_billing" || value === "store_manage";
}
export function inAppPermissionEntryPurpose(requested: unknown, surface: "platform" | "tenant"): InAppPermissionPurpose {
  return isInAppPermissionPurpose(requested) ? requested : surface === "tenant" ? "wallet_checkout" : "store_manage";
}
export function inAppPermissionEntryPath(purpose: InAppPermissionPurpose): string {
  const path = purpose === "wallet_checkout" ? "/account" : "/admin";
  return `${path}?${new URLSearchParams({ receiz_identity: "required", receiz_purpose: purpose })}`;
}
export function inAppPermissionScopes(purpose: InAppPermissionPurpose): readonly string[] {
  return Object.freeze(["openid", "profile", "email", ...(purpose === "store_manage" ? ["receiz:record"]
    : ["receiz:wallet.read", ...receizOidcScopesForRails("reserve", "domains")])].sort());
}

export async function readInAppPermissionIdentity(artifact: Uint8Array) {
  const keyFile = await readReceizIdentityArtifact(artifact);
  if (await verifyReceizIdentityPortableStateProof(keyFile) !== "verified") throw new Error("verified_identity_seal_required");
  // Exchange sends the exact artifact. A seal carrying a clear signing key
  // belongs in local custody and must never be posted to the permission host.
  if (keyFile.crypto.privateKeyPkcs8B64u || !keyFile.crypto.privateKeyPkcs8CiphertextB64u) {
    throw new Error("encrypted_identity_seal_required");
  }
  return keyFile;
}
export async function inAppPermissionChallenge(input: { applicationId: string; artifactDigest: string; purpose: InAppPermissionPurpose; tenantHost: string }) {
  if (!input.applicationId || !/^[0-9a-f]{64}$/.test(input.artifactDigest) || !input.tenantHost) throw new Error("proof_permission_binding_required");
  const scopes = inAppPermissionScopes(input.purpose);
  const statement = { schema: "receiz.app.permission-consent.v1", ...input, scopes,
    statement: "Connect this verified Identity Seal to this application for a short-lived permission. Confirm each purchase separately." };
  const consentStatementDigest = await digestReceizCanonicalV122(statement);
  const { challenge } = createReceizProofAuthorityChallenge({
    applicationId: input.applicationId, artifactDigest: input.artifactDigest, scopes, consentStatementDigest, ttlPulses: 30
  });
  return { applicationId: input.applicationId, scopes, statement, challenge };
}

export async function requireInAppPermissionConsent(input: {
  applicationId: string;
  artifactDigest: string;
  purpose: InAppPermissionPurpose;
  tenantHost: string;
  challenge: ReceizProofAuthorityChallengeV123;
}) {
  const expected = await inAppPermissionChallenge({ applicationId: input.applicationId, artifactDigest: input.artifactDigest,
    purpose: input.purpose, tenantHost: input.tenantHost });
  if (input.challenge?.consent?.approved !== true || input.challenge.audience !== input.applicationId ||
    input.challenge.consent.statementDigest !== expected.challenge.consent.statementDigest) {
    throw new Error("explicit_permission_consent_required");
  }
  return expected.scopes;
}
