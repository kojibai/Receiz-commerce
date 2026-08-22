import type {
  ReceizClientOptions,
  ReceizProofAuthorityChallengeV123,
  ReceizProofAuthorityExchangeInputV123,
  ReceizProofAuthorityV123,
  ReceizValueExecutionOutcomeV123,
  ReceizValueRailV122,
  ReceizWorldValueIntentV122,
} from "@receiz/sdk";
import { createReceizCommerceAdapter } from "../adapter";
import {
  unwrapReceizPersistedValueIntentV123,
  type ReceizPersistedValueIntentV123,
} from "./value-execution";

export type ReceizProofAuthorityEdgeRuntimeV123 = Readonly<{
  readIdentityArtifact(artifact: ReceizProofAuthorityExchangeInputV123["artifact"]): Promise<Readonly<{ keyId: string }>>;
  scopesForRail(rail: ReceizValueRailV122): readonly string[];
  exchangeProofAuthority(input: ReceizProofAuthorityExchangeInputV123): Promise<ReceizProofAuthorityV123>;
  grantedScopes(accessToken: string): Promise<readonly string[]>;
  executeSettlement(intent: ReceizWorldValueIntentV122, authority: ReceizProofAuthorityV123): Promise<ReceizValueExecutionOutcomeV123>;
  executeReserve(intent: ReceizWorldValueIntentV122, authority: ReceizProofAuthorityV123): Promise<ReceizValueExecutionOutcomeV123>;
  executionByIdempotencyKey(idempotencyKey: string, authority: ReceizProofAuthorityV123): Promise<ReceizValueExecutionOutcomeV123>;
}>;

export type ReceizProofAuthoritySummaryV123 = Readonly<{
  schema: "receiz.identity.proof-authority-summary.v123";
  applicationId: string;
  keyId: string;
  artifactDigest: string;
  grantedScopes: readonly string[];
  issuedAtKai: number;
  expiresAtKai: number;
  nonce: string;
  revocationHead: string;
  authorityDigest: string;
  authority: Readonly<{
    summaryIsIdentityAuthority: false;
    strongerTruth: "receiz-identity-artifact";
  }>;
}>;

export type ReceizProofAuthorityRequestV123 = Readonly<{
  artifact: ReceizProofAuthorityExchangeInputV123["artifact"];
  challenge: ReceizProofAuthorityChallengeV123;
  applicationId: string;
  rail: ReceizValueRailV122;
}>;

const normalizedScopes = (scopes: readonly string[]) => Object.freeze(
  [...new Set(scopes.map((scope) => scope.trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right)),
);

const sameScopes = (left: readonly string[], right: readonly string[]) =>
  JSON.stringify(normalizedScopes(left)) === JSON.stringify(normalizedScopes(right));

function summarize(authority: ReceizProofAuthorityV123): ReceizProofAuthoritySummaryV123 {
  return Object.freeze({
    schema: "receiz.identity.proof-authority-summary.v123",
    applicationId: authority.applicationId,
    keyId: authority.keyId,
    artifactDigest: authority.artifactDigest,
    grantedScopes: normalizedScopes(authority.grantedScopes),
    issuedAtKai: authority.issuedAtKai,
    expiresAtKai: authority.expiresAtKai,
    nonce: authority.nonce,
    revocationHead: authority.revocationHead,
    authorityDigest: authority.authorityDigest,
    authority: Object.freeze({
      summaryIsIdentityAuthority: false,
      strongerTruth: "receiz-identity-artifact",
    }),
  });
}

export function createReceizProofAuthoritySessionV123(runtime: ReceizProofAuthorityEdgeRuntimeV123) {
  let heldAuthority: ReceizProofAuthorityV123 | null = null;
  const submittedValueKeys = new Set<string>();

  const requireAuthority = () => {
    if (!heldAuthority) throw new TypeError("V123_EDGE_PROOF_AUTHORITY_REQUIRED");
    return heldAuthority;
  };

  return Object.freeze({
    async authorize(input: ReceizProofAuthorityRequestV123): Promise<ReceizProofAuthoritySummaryV123> {
      if (input.challenge.consent.approved !== true) throw new TypeError("V123_EDGE_EXPLICIT_CONSENT_REQUIRED");
      if (!input.applicationId.trim() || input.challenge.audience !== input.applicationId) {
        throw new TypeError("V123_EDGE_APPLICATION_BINDING_INVALID");
      }
      const minimumScopes = normalizedScopes(runtime.scopesForRail(input.rail));
      if (minimumScopes.length === 0) throw new TypeError("V123_EDGE_MINIMUM_SCOPES_REQUIRED");

      // This read is the independent edge verification boundary. The SDK exchange
      // repeats verification before remote admission but cannot replace this step.
      const identity = await runtime.readIdentityArtifact(input.artifact);
      if (!identity.keyId || input.challenge.proof.keyId !== identity.keyId) {
        throw new TypeError("V123_EDGE_PROOF_OBJECT_KEY_MISMATCH");
      }

      const authority = await runtime.exchangeProofAuthority({
        artifact: input.artifact,
        challenge: input.challenge,
        applicationId: input.applicationId,
        scopes: minimumScopes,
      });
      if (authority.applicationId !== input.applicationId
        || authority.keyId !== identity.keyId
        || authority.nonce !== input.challenge.nonce
        || authority.refreshable !== false
        || authority.authority.grantIsIdentityAuthority !== false
        || authority.authority.strongerTruth !== "receiz-identity-artifact"
        || !sameScopes(authority.grantedScopes, minimumScopes)) {
        throw new TypeError("V123_EDGE_PROOF_AUTHORITY_INVALID");
      }

      const introspected = await runtime.grantedScopes(authority.accessToken);
      if (!sameScopes(introspected, minimumScopes)) throw new TypeError("V123_EDGE_PROOF_AUTHORITY_SCOPE_MISMATCH");
      heldAuthority = authority;
      return summarize(authority);
    },

    summary(): ReceizProofAuthoritySummaryV123 | null {
      return heldAuthority ? summarize(heldAuthority) : null;
    },

    clear(): void {
      heldAuthority = null;
      submittedValueKeys.clear();
    },

    async execute(persisted: ReceizPersistedValueIntentV123): Promise<ReceizValueExecutionOutcomeV123> {
      const authority = requireAuthority();
      const intent = unwrapReceizPersistedValueIntentV123(persisted);
      if (!intent.idempotencyKey) throw new TypeError("V123_EDGE_VALUE_IDEMPOTENCY_KEY_REQUIRED");
      if (submittedValueKeys.has(intent.idempotencyKey)) throw new TypeError("V123_EDGE_VALUE_RETRY_REQUIRES_RECOVERY");
      if (!authority.grantedScopes.includes(`receiz:${intent.rail}.write`)) {
        throw new TypeError("V123_EDGE_VALUE_SCOPE_NOT_GRANTED");
      }
      submittedValueKeys.add(intent.idempotencyKey);
      return intent.rail === "settlement"
        ? runtime.executeSettlement(intent, authority)
        : runtime.executeReserve(intent, authority);
    },

    async recover(idempotencyKey: string): Promise<ReceizValueExecutionOutcomeV123> {
      if (!idempotencyKey.trim()) throw new TypeError("V123_EDGE_VALUE_IDEMPOTENCY_KEY_REQUIRED");
      return runtime.executionByIdempotencyKey(idempotencyKey, requireAuthority());
    },
  });
}

export function createReceizProofAuthorityEdgeRuntimeV123(
  options: ReceizClientOptions = {},
): ReceizProofAuthorityEdgeRuntimeV123 {
  const edgeOptions = { ...options, accessToken: undefined };
  const edge = createReceizCommerceAdapter(edgeOptions);
  return Object.freeze({
    async readIdentityArtifact(artifact) {
      const restored = await edge.restoreIdentityArtifact(artifact);
      return Object.freeze({ keyId: restored.keyFile.keyId });
    },
    scopesForRail(rail) {
      return edge.v123.auth.scopesForRails(rail);
    },
    exchangeProofAuthority(input) {
      return edge.v123.identity.exchangeProofAuthority(input);
    },
    grantedScopes(accessToken) {
      return createReceizCommerceAdapter({ ...edgeOptions, accessToken }).v123.auth.grantedScopes();
    },
    executeSettlement(intent, authority) {
      return edge.v123.value.executeSettlement(intent, authority);
    },
    executeReserve(intent, authority) {
      return edge.v123.value.executeReserve(intent, authority);
    },
    executionByIdempotencyKey(idempotencyKey, authority) {
      return edge.v123.value.executionByIdempotencyKey(idempotencyKey, authority);
    },
  });
}
