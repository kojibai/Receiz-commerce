import {
  canonicalizeReceizV122,
  normalizeReceizProofAuthorityScopesV123,
  proofAuthorityChallengeBasisV123,
  readReceizIdentityArtifact,
  receizBase64UrlEncode,
  sha256ReceizBytes,
  signReceizIdentityLoginProof,
  type ReceizProofAuthorityChallengeUnsignedV123,
  type ReceizProofAuthorityChallengeV123,
} from "@receiz/sdk";

const SHA256 = /^[0-9a-f]{64}$/;

function bytes(input: Blob | ArrayBuffer | Uint8Array | string): Promise<Uint8Array> | Uint8Array {
  if (typeof input === "string") return new TextEncoder().encode(input);
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return input.arrayBuffer().then((value) => new Uint8Array(value));
}

export function parseReceizProofAuthorityChallengeUnsignedV123(
  value: unknown,
  applicationId: string,
): ReceizProofAuthorityChallengeUnsignedV123 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("V123_PROOF_AUTHORITY_CHALLENGE_INVALID");
  const challenge = value as Record<string, unknown>;
  const consent = challenge.consent as Record<string, unknown> | undefined;
  if (Object.keys(challenge).some((key) => !["schema", "audience", "nonce", "issuedAtKai", "expiresAtKai", "consent"].includes(key))
    || challenge.schema !== "receiz.identity.proof-authority-challenge.v123"
    || challenge.audience !== applicationId
    || typeof challenge.nonce !== "string"
    || !challenge.nonce.trim()
    || !Number.isSafeInteger(challenge.issuedAtKai)
    || !Number.isSafeInteger(challenge.expiresAtKai)
    || Number(challenge.expiresAtKai) <= Number(challenge.issuedAtKai)
    || !consent
    || typeof consent.statementDigest !== "string"
    || !SHA256.test(consent.statementDigest)) {
    throw new TypeError("V123_PROOF_AUTHORITY_CHALLENGE_INVALID");
  }
  return Object.freeze({
    schema: "receiz.identity.proof-authority-challenge.v123",
    audience: applicationId,
    nonce: challenge.nonce,
    issuedAtKai: Number(challenge.issuedAtKai),
    expiresAtKai: Number(challenge.expiresAtKai),
    consent: Object.freeze({ approved: false, statementDigest: consent.statementDigest }),
  });
}

export async function signReceizProofAuthorityChallengeAtEdgeV123(input: Readonly<{
  artifact: Blob | ArrayBuffer | Uint8Array | string;
  challenge: ReceizProofAuthorityChallengeUnsignedV123;
  applicationId: string;
  scopes: readonly string[];
  passphrase?: string;
}>): Promise<ReceizProofAuthorityChallengeV123> {
  const exactBytes = await bytes(input.artifact);
  const keyFile = await readReceizIdentityArtifact(exactBytes);
  const artifactDigest = await sha256ReceizBytes(exactBytes);
  const scopes = normalizeReceizProofAuthorityScopesV123(input.scopes);
  const approved = Object.freeze({
    ...input.challenge,
    consent: Object.freeze({ ...input.challenge.consent, approved: true }),
  });
  const basis = proofAuthorityChallengeBasisV123({
    challenge: approved,
    applicationId: input.applicationId,
    artifactDigest,
    scopes,
  });
  const proof = await signReceizIdentityLoginProof({
    keyFile,
    challengeB64Url: receizBase64UrlEncode(new TextEncoder().encode(canonicalizeReceizV122(basis))),
    ...(input.passphrase ? { passphrase: input.passphrase } : {}),
  });
  return Object.freeze({ ...approved, proof });
}
