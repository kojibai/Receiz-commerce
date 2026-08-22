import type {
  ReceizIdentityLoginProof,
  ReceizProofAuthorityChallengeV123,
  ReceizProofAuthorityV123,
  ReceizValueExecutionOutcomeV123,
  ReceizWorldValueIntentV122,
} from "@receiz/sdk";
import { planReceizSettlementV122 } from "@receiz/sdk";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createReceizProofAuthoritySessionV123,
  type ReceizProofAuthorityEdgeRuntimeV123,
} from "../src/lib/receiz/v123/proof-authority";
import { persistReceizExactValueIntentV123 } from "../src/lib/receiz/v123/value-execution";

const digest = (character: string) => character.repeat(64);
const artifact = new Uint8Array([1, 2, 3]);
const proof: ReceizIdentityLoginProof = {
  schema: "receiz.identity.login_proof.v1",
  keyId: digest("a"),
  alg: "Ed25519",
  challengeB64Url: "challenge",
  signatureB64Url: "signature",
};
const challenge = (approved = true, audience = "receiz-commerce-kit"): ReceizProofAuthorityChallengeV123 => ({
  schema: "receiz.identity.proof-authority-challenge.v123",
  audience,
  nonce: "nonce-123",
  issuedAtKai: 100,
  expiresAtKai: 200,
  consent: { approved, statementDigest: digest("b") },
  proof,
});
const authority: ReceizProofAuthorityV123 = {
  schema: "receiz.identity.proof-authority.v123",
  applicationId: "receiz-commerce-kit",
  keyId: digest("a"),
  artifactDigest: digest("c"),
  grantedScopes: ["receiz:settlement.read", "receiz:settlement.write"],
  issuedAtKai: 100,
  expiresAtKai: 200,
  nonce: "nonce-123",
  revocationHead: digest("d"),
  tokenType: "Bearer",
  expiresIn: 100,
  refreshable: false,
  authority: { grantIsIdentityAuthority: false, strongerTruth: "receiz-identity-artifact" },
  authorityDigest: digest("e"),
  accessToken: "secret-bearer",
};
const intent: ReceizWorldValueIntentV122 = {
  schema: "receiz.world.value-intent.v122",
  rail: "settlement",
  amountPhiMicro: "1000",
  usdPerPhiMicrocents: "2",
  quotedUsdCents: "2",
  priceBasisDigest: digest("f"),
  sourceProofObjectId: "source",
  sourceValueHead: digest("1"),
  destinationSubjectId: "destination",
  expectedDestinationHead: digest("2"),
  idempotencyKey: "value-1",
  valueIntentDigest: digest("3"),
};

function runtime(overrides: Partial<ReceizProofAuthorityEdgeRuntimeV123> = {}) {
  const calls = { reads: 0, exchanges: 0, granted: [] as string[], executions: 0, recoveries: 0 };
  const committed = { status: "unknown" } as ReceizValueExecutionOutcomeV123;
  const value: ReceizProofAuthorityEdgeRuntimeV123 = {
    async readIdentityArtifact() {
      calls.reads += 1;
      return { keyId: digest("a") };
    },
    scopesForRail(rail) {
      return [`receiz:${rail}.read`, `receiz:${rail}.write`];
    },
    async exchangeProofAuthority() {
      calls.exchanges += 1;
      return authority;
    },
    async grantedScopes(accessToken) {
      assert.equal(accessToken, "secret-bearer");
      calls.granted.push(accessToken);
      return authority.grantedScopes;
    },
    async executeSettlement(_intent, received) {
      assert.equal(received, authority);
      calls.executions += 1;
      return committed;
    },
    async executeReserve() {
      throw new Error("unexpected reserve execution");
    },
    async executionByIdempotencyKey(key, received) {
      assert.equal(key, "value-1");
      assert.equal(received, authority);
      calls.recoveries += 1;
      return committed;
    },
    ...overrides,
  };
  return { value, calls };
}

describe("Receiz v123 edge proof authority", () => {
  it("refuses absent consent before reading or exchanging the object", async () => {
    const fake = runtime();
    const session = createReceizProofAuthoritySessionV123(fake.value);
    await assert.rejects(() => session.authorize({ artifact, challenge: challenge(false), applicationId: "receiz-commerce-kit", rail: "settlement" }), /CONSENT_REQUIRED/);
    assert.deepEqual(fake.calls, { reads: 0, exchanges: 0, granted: [], executions: 0, recoveries: 0 });
  });

  it("refuses an application/audience mismatch before exchange", async () => {
    const fake = runtime();
    const session = createReceizProofAuthoritySessionV123(fake.value);
    await assert.rejects(() => session.authorize({ artifact, challenge: challenge(true, "another-app"), applicationId: "receiz-commerce-kit", rail: "settlement" }), /APPLICATION_BINDING_INVALID/);
    assert.equal(fake.calls.exchanges, 0);
  });

  it("derives minimum scopes, verifies locally first, and never exposes the bearer", async () => {
    const fake = runtime();
    const session = createReceizProofAuthoritySessionV123(fake.value);
    const summary = await session.authorize({ artifact, challenge: challenge(), applicationId: "receiz-commerce-kit", rail: "settlement" });
    assert.equal(fake.calls.reads, 1);
    assert.equal(fake.calls.exchanges, 1);
    assert.equal(fake.calls.granted.length, 1);
    assert.deepEqual(summary.grantedScopes, authority.grantedScopes);
    assert.equal("accessToken" in summary, false);
    assert.equal(JSON.stringify(session).includes("secret-bearer"), false);
    assert.equal(JSON.stringify(summary).includes("secret-bearer"), false);
  });

  it("refuses scope inflation returned by introspection", async () => {
    const fake = runtime({
      async grantedScopes() {
        return [...authority.grantedScopes, "receiz:reserve.write"];
      },
    });
    const session = createReceizProofAuthoritySessionV123(fake.value);
    await assert.rejects(() => session.authorize({ artifact, challenge: challenge(), applicationId: "receiz-commerce-kit", rail: "settlement" }), /SCOPE_MISMATCH/);
    assert.equal(session.summary(), null);
  });

  it("executes and recovers only through its closure-held authority", async () => {
    const fake = runtime();
    const session = createReceizProofAuthoritySessionV123(fake.value);
    await assert.rejects(() => session.execute(intent as never), /AUTHORITY_REQUIRED/);
    await session.authorize({ artifact, challenge: challenge(), applicationId: "receiz-commerce-kit", rail: "settlement" });
    await assert.rejects(() => session.execute(intent as never), /PERSISTED_INTENT_REQUIRED/);
    const planned = await planReceizSettlementV122({
      amountPhiMicro: "1000",
      sourceProofObjectId: "source",
      sourceValueHead: digest("1"),
      destinationSubjectId: "destination",
      expectedDestinationHead: digest("2"),
      usdPerPhiMicrocents: "2",
      priceBasis: { source: "canonical", atKai: 100 },
      idempotencyKey: "value-1",
    });
    const persisted = await persistReceizExactValueIntentV123({
      async put() {},
      async get() { return null; },
    }, planned);
    await session.execute(persisted);
    await session.recover("value-1");
    assert.equal(fake.calls.executions, 1);
    assert.equal(fake.calls.recoveries, 1);
    session.clear();
    assert.equal(session.summary(), null);
  });
});
