import { createReceizIdentityKeyFile, serializeReceizIdentityArtifact, receizBase64UrlEncode,
  type ReceizPortableExecutionTransitionSetV124, type ReceizPortableExecutionTransitionRecoveryV124 } from "@receiz/sdk";
import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

import { createReceizCommerceAdapter, type ReceizCommerceAdapter } from "../src/lib/receiz/adapter";
import { createNativeReserveExecution, type NativeReserveQuote, type NativeReservePreparation } from "../src/lib/checkout/native-reserve-execution";
import { nativeReserveConsentDigest, nativeReserveScopes } from "../src/lib/checkout/native-reserve-consent";
import { encodeNativeReserveCoordinates, readNativeReserveCoordinates, MAX_NATIVE_RESERVE_TOKEN_LENGTH } from "../src/lib/checkout/native-reserve-coordinates";
import { createWalletFirstReceizSettlement, NativeReserveRequiredError } from "../src/lib/checkout/receiz-settlement";
import { recoverOriginalOrder, type OrderRecoveryCoordinates } from "../src/lib/checkout/order-recovery";

const quote: NativeReserveQuote = { applicationId: "receiz-commerce-kit", tenantHost: "seller.receiz.app",
  buyerUserId: "fixture-buyer", buyerReceizId: "buyer", merchantUsername: "seller", recipientUserId: "fixture-seller",
  referenceId: "fixture-order", idempotencyKey: "fixture-payment", funding: {
    totalUsdCents: 1800, walletBalanceUsdCents: 900, walletAppliedUsdCents: 900, cardDeltaUsdCents: 900 } };
const priceBasis = { schema: "fixture.price-basis.v1", kai: "14000000" };
let buyerBytes: string, sellerBytes: string, buyerKeyId: string;
before(async () => {
  process.env.RECEIZ_CLIENT_SECRET = "fixture-only-reserve-custody-secret";
  const buyer = await createReceizIdentityKeyFile({ owner: { uid: quote.buyerUserId, username: "buyer" }, portableState: { snapshot: {} } });
  const seller = await createReceizIdentityKeyFile({ owner: { uid: quote.recipientUserId, username: "seller" }, portableState: { snapshot: {} } });
  buyerBytes = receizBase64UrlEncode(new TextEncoder().encode(serializeReceizIdentityArtifact(buyer.keyFile)));
  sellerBytes = receizBase64UrlEncode(new TextEncoder().encode(serializeReceizIdentityArtifact(seller.keyFile)));
  buyerKeyId = buyer.keyId;
});

// These test doubles exercise orchestration only. The real SDK creates and
// inspects the canonical plan and reads cryptographic identities; the fake
// admission/commit boundary does NOT prove a spendable source or live payment.
async function fixture(options: { unknown?: boolean; loseExecute?: boolean; failCard?: boolean; walletOnly?: boolean; expiredCard?: boolean; destinationSubjectId?: string } = {}) {
  const calls: string[] = [], cardBodies: Record<string, unknown>[] = [];
  const actual = createReceizCommerceAdapter({ fetchImpl: async () => { throw new Error("unexpected_network"); } });
  const planned = await actual.v125.value.edge.planReserve({ applicationId: quote.applicationId,
    amountPhiMicro: options.walletOnly ? "18000000" : "9000000", sourceProofObjectId: "fixture:reserve:source", sourceValueHead: "11".repeat(32),
    destinationSubjectId: options.destinationSubjectId ?? quote.recipientUserId, expectedDestinationHead: "22".repeat(32), usdPerPhiMicrocents: "100000000",
    priceBasis, idempotencyKey: `${quote.idempotencyKey}:reserve`, attemptId: "fixture-attempt" });
  const transitionSet = { applicationId: quote.applicationId, exactPlanDigest: planned.plan.exactPlanDigest,
    members: [{ participantId: planned.sourceParticipantId, operationPlan: planned.plan, identityArtifact: { exactBytesB64u: buyerBytes } },
      { participantId: planned.destinationParticipantId, operationPlan: planned.plan, identityArtifact: { exactBytesB64u: sellerBytes } }] } as unknown as ReceizPortableExecutionTransitionSetV124;
  const preparation: NativeReservePreparation = { transitionSet, priceBasis };
  const recovery = { transitionSet } as ReceizPortableExecutionTransitionRecoveryV124;
  let status = "open";
  const outcome = (unknown = false) => ({ applicationId: quote.applicationId, exactPlanDigest: planned.plan.exactPlanDigest,
    semanticIdempotencyKey: `${quote.idempotencyKey}:reserve`, status: unknown ? "unknown" : "committed" });
  const adapter = { ...actual,
    v125: { value: { edge: { ...actual.v125.value.edge,
      async verifyTransitionSet() { calls.push("verify"); return { operationPlan: planned.plan, members: transitionSet.members }; },
      async prepareCommitSet() { calls.push("prepare"); },
      async confirmReserveSend() { calls.push("confirm-sender"); return { intent: planned.intent, participantId: planned.sourceParticipantId }; },
      async receiveReserve() { calls.push("receive-merchant"); return { intent: planned.intent, participantId: planned.destinationParticipantId }; },
    } } },
    v124: { ...actual.v124, runtime: { ...actual.v124.runtime,
      async qualifyV124(input: { operations: string[] }) { calls.push("qualify"); return { applicationId: quote.applicationId,
        results: input.operations.map(operation => ({ operation, status: "available", dependencyHealth: "healthy", evidence: { runtime: "ready" } })) }; },
      async openAuthoritySessionV124() { calls.push("open"); return { identityKeyId: buyerKeyId, applicationId: quote.applicationId,
        audience: quote.applicationId, grantedScopes: nativeReserveScopes() }; },
    }, execution: { ...actual.v124.execution,
      async stagePrepared() { calls.push("stage"); return { fixture: "process-local-handle" }; },
      async execute() { calls.push("execute"); if (options.loseExecute) throw new Error("response_lost"); return outcome(options.unknown); },
      async resolveByIdempotencyKey(input: unknown) { calls.push("resolve"); assert.deepEqual(input, { applicationId: quote.applicationId,
        domainId: planned.plan.domainId, operationKind: planned.plan.operationKind, semanticIdempotencyKey: `${quote.idempotencyKey}:reserve` }); return outcome(); },
    } }, client: { ...actual.client, execution: { ...actual.client.execution, exportCommittedRecovery() { calls.push("export"); return recovery; } } },
    async connectWallet() { calls.push("wallet"); return { ok: true, userId: quote.buyerUserId, balanceUsdCents: "900" }; },
    async checkout(body: Record<string, unknown>) { calls.push("card-create"); cardBodies.push(body); if (options.failCard) throw new Error("card_response_lost");
      return { ok: true, checkoutSessionId: "fixture-card", clientSecret: "fixture-not-a-real-secret", status, amountUsdCents: "900", merchantUsername: quote.merchantUsername }; },
    async merchantCheckoutSession(input: { checkoutSessionId: string }) { calls.push("card-status"); return { ok: true, checkoutSessionId: input.checkoutSessionId,
      amountUsdCents: "900", merchantUsername: quote.merchantUsername, referenceId: quote.referenceId,
      status: options.expiredCard && input.checkoutSessionId === "expired-fixture-card" ? "expired" : status }; },
  } as unknown as ReceizCommerceAdapter;
  const authority = { actorSubjectId: quote.buyerUserId, requestedRails: ["reserve"], requiredNamespaces: [], subjectSourceArtifact: {}, proofArtifact: "fixture",
    signedChallenge: { audience: quote.applicationId, consent: { approved: true, statementDigest: await nativeReserveConsentDigest(quote, planned.plan.exactPlanDigest) } } } as unknown as NonNullable<Parameters<typeof createWalletFirstReceizSettlement>[0]["nativeReserveExecution"]>["authority"];
  return { calls, cardBodies, adapter, preparation, recovery, authority, paid: () => { status = "paid"; } };
}
function settlementInput(adapter: ReceizCommerceAdapter) {
  return { receiz: adapter, amountUsd: "18.00", tenantHost: quote.tenantHost, recipientUserId: quote.recipientUserId,
    merchantUsername: quote.merchantUsername, buyerAuthenticated: true, buyerUserId: quote.buyerUserId,
    buyerReceizId: quote.buyerReceizId, originalReserveQuote: quote, idempotencyKey: quote.idempotencyKey, orderId: quote.referenceId, note: "Fixture purchase" };
}

describe("Reserve checkout orchestration", () => {
  it("binds the verified receiving account without substituting its UID for the SDK destination subject", async () => {
    const f = await fixture({ destinationSubjectId: "receiz:subject:merchant-value" });
    const execution = createNativeReserveExecution(f.adapter, quote);
    const prepared = await execution.prepare(f.preparation);
    assert.equal(prepared.destinationParticipantId, f.preparation.transitionSet.members[1].participantId);
    assert.deepEqual(f.calls, ["verify", "verify", "prepare"]);
    assert.equal(f.calls.includes("stage"), false);
  });

  it("rejects a different receiving account UID even when its merchant handle matches", async () => {
    const f = await fixture();
    const execution = createNativeReserveExecution(f.adapter, { ...quote, recipientUserId: "another-account-uid" });
    await assert.rejects(execution.prepare(f.preparation), /receiver_mismatch/);
    assert.deepEqual(f.calls, ["verify"]);
  });

  it("completes Reserve-only payment without creating or checking a card session", async () => {
    const f = await fixture({ walletOnly: true });
    const fullQuote = { ...quote, funding: { totalUsdCents: 1800, walletBalanceUsdCents: 5000, walletAppliedUsdCents: 1800, cardDeltaUsdCents: 0 } };
    const authority = { ...f.authority, signedChallenge: { ...f.authority.signedChallenge, consent: { approved: true,
      statementDigest: await nativeReserveConsentDigest(fullQuote, f.preparation.transitionSet.exactPlanDigest) } } };
    const result = await createWalletFirstReceizSettlement({ ...settlementInput(f.adapter), originalReserveQuote: fullQuote,
      nativeReserveExecution: { preparation: f.preparation, authority } });
    assert.equal(result.paid, true); assert.equal(result.paymentRail, "receiz_wallet");
    assert.equal(result.checkoutSession, null); assert.ok(result.reservePaymentToken);
    f.calls.length = 0;
    const recovered = await createWalletFirstReceizSettlement({ ...settlementInput(f.adapter), originalReserveQuote: fullQuote,
      reservePaymentToken: result.reservePaymentToken, resume: { checkoutSessionId: "reserve-settled:fixture-order", funding: fullQuote.funding } });
    assert.equal(recovered.paid, true);
    assert.deepEqual(f.calls, ["verify", "confirm-sender", "receive-merchant"]);
  });

  it("executes Reserve through SDK custody, independently confirms both participants, and creates only the card delta", async () => {
    const f = await fixture();
    const result = await createWalletFirstReceizSettlement({ ...settlementInput(f.adapter), nativeReserveExecution: { preparation: f.preparation, authority: f.authority } });
    assert.equal(result.paid, false);
    assert.equal(result.funding.cardDeltaUsdCents, 900);
    assert.equal(f.cardBodies[0].amountUsd, "9.00");
    assert.equal(f.cardBodies[0].username, "seller");
    assert.equal(f.cardBodies[0].idempotencyKey, "fixture-payment:card");
    assert.ok(f.calls.indexOf("confirm-sender") < f.calls.indexOf("card-create"));
    assert.ok(f.calls.indexOf("receive-merchant") < f.calls.indexOf("card-create"));
    assert.equal(f.calls.includes("wallet"), false, "original funding is pinned before submission");
    assert.ok(result.reservePaymentToken);
    f.paid(); f.calls.length = 0;
    const recovered = await createWalletFirstReceizSettlement({ ...settlementInput(f.adapter), reservePaymentToken: result.reservePaymentToken,
      resume: { checkoutSessionId: "fixture-card", funding: quote.funding } });
    assert.equal(recovered.paid, true);
    assert.deepEqual(f.calls, ["verify", "confirm-sender", "receive-merchant", "card-status"]);
  });

  it("retains complete Reserve recovery after a lost card response and retries only the original card key", async () => {
    const f = await fixture({ failCard: true });
    const result = await createWalletFirstReceizSettlement({ ...settlementInput(f.adapter), nativeReserveExecution: { preparation: f.preparation, authority: f.authority } });
    assert.equal(result.paid, false); assert.equal(result.cardError, "checkout_card_session_recovery_required");
    assert.ok(result.reservePaymentToken);
    f.calls.length = 0;
    await createWalletFirstReceizSettlement({ ...settlementInput(f.adapter), reservePaymentToken: result.reservePaymentToken });
    assert.deepEqual(f.calls, ["verify", "confirm-sender", "receive-merchant", "card-create"]);
    assert.equal(f.cardBodies.length, 2);
    assert.equal(f.cardBodies[1].idempotencyKey, f.cardBodies[0].idempotencyKey);
    assert.equal(f.cardBodies[1].amountUsd, "9.00");
  });

  it("reopens only the original card remainder after a verified expiry, preserving Reserve and one replacement key", async () => {
    const f = await fixture({ expiredCard: true });
    const token = encodeNativeReserveCoordinates({ schema: "receiz.app.native_reserve_coordinates.v1", quote, recovery: f.recovery });
    for (let attempt = 0; attempt < 2; attempt++) {
      f.calls.length = 0;
      const result = await createWalletFirstReceizSettlement({ ...settlementInput(f.adapter), reservePaymentToken: token,
        reopenExpiredCard: true,
        resume: { checkoutSessionId: "expired-fixture-card", funding: quote.funding } });
      assert.equal(result.paid, false);
      assert.equal(result.reservePaymentToken, token);
      assert.equal(result.checkoutSession?.checkoutSessionId, "fixture-card");
      assert.deepEqual(f.calls, ["verify", "confirm-sender", "receive-merchant", "card-status", "card-create"]);
    }
    assert.equal(f.cardBodies[0].amountUsd, "9.00");
    assert.equal(f.cardBodies[0].referenceId, quote.referenceId);
    assert.equal(f.cardBodies[0].idempotencyKey, "fixture-payment:card:expired:expired-fixture-card");
    assert.equal(f.cardBodies[1].idempotencyKey, f.cardBodies[0].idempotencyKey);
  });

  it("does not replace an expired card session with missing original quote evidence", async () => {
    const f = await fixture({ expiredCard: true });
    const token = encodeNativeReserveCoordinates({ schema: "receiz.app.native_reserve_coordinates.v1", quote, recovery: f.recovery });
    f.adapter.merchantCheckoutSession = async input => ({ ok: true, checkoutSessionId: input.checkoutSessionId, status: "expired" });
    await assert.rejects(createWalletFirstReceizSettlement({ ...settlementInput(f.adapter), reservePaymentToken: token,
      reopenExpiredCard: true,
      resume: { checkoutSessionId: "expired-fixture-card", funding: quote.funding } }), /expired_session_unverified/);
    assert.equal(f.cardBodies.length, 0);
  });

  it("keeps expired-session status recovery read-only", async () => {
    const f = await fixture({ expiredCard: true });
    const token = encodeNativeReserveCoordinates({ schema: "receiz.app.native_reserve_coordinates.v1", quote, recovery: f.recovery });
    const result = await createWalletFirstReceizSettlement({ ...settlementInput(f.adapter), reservePaymentToken: token,
      resume: { checkoutSessionId: "expired-fixture-card", funding: quote.funding } });
    assert.equal(result.paid, false);
    assert.equal(result.checkoutSession?.status, "expired");
    assert.equal(f.cardBodies.length, 0);
  });

  it("recovers the complete original order when the Reserve key differs from its order reference", async () => {
    const f = await fixture();
    f.paid();
    const token = encodeNativeReserveCoordinates({ schema: "receiz.app.native_reserve_coordinates.v1", quote, recovery: f.recovery });
    const coordinates: OrderRecoveryCoordinates = { schema: "receiz.app.order_recovery_coordinates.v1", payerUserId: quote.buyerUserId,
      createdAt: "2026-10-06T14:00:00.000Z", payment: { purpose: "storefront_checkout", tenantHost: quote.tenantHost,
        merchantUsername: quote.merchantUsername, actorReceizId: quote.buyerReceizId, referenceId: quote.referenceId,
        checkoutSessionId: "fixture-card", amountUsd: "18.00", funding: quote.funding,
        context: { nativeReserveQuote: quote, reservePaymentToken: token,
          quote: { amountUsd: "18.00", totalUsdCents: 1800, itemCount: 1, merchantReceizId: "seller.receiz.id",
            recipientUserId: quote.recipientUserId, wildsAssets: [], items: [{ id: "fixture-product", title: "Fixture product",
              quantity: 1, unitPriceUsd: "18.00", amountUsd: "18.00" }] },
          customer: { fulfillment: { kind: "digital_delivery" } } } } };
    const result = await recoverOriginalOrder({ receiz: f.adapter, coordinates, reader: { handle: quote.buyerReceizId, userId: quote.buyerUserId } });
    assert.equal(result.order?.id, quote.referenceId);
    assert.equal(result.settlement.paid, true);
    assert.deepEqual(f.calls, ["verify", "confirm-sender", "receive-merchant", "card-status"]);
    assert.equal(f.cardBodies.length, 0);
  });

  for (const options of [{ unknown: true }, { loseExecute: true }]) {
    it(`resolves the original possible commit without restaging after ${options.unknown ? "an unknown outcome" : "a lost response"}`, async () => {
      const f = await fixture(options), execution = createNativeReserveExecution(f.adapter, quote);
      await execution.prepare(f.preparation);
      if (options.unknown) assert.equal((await execution.execute(f.authority)).status, "unknown");
      else await assert.rejects(execution.execute(f.authority), /response_lost/);
      await assert.rejects(execution.execute(f.authority), /resolution_required/);
      f.calls.length = 0;
      assert.equal((await execution.resolve()).status, "committed");
      assert.deepEqual(f.calls, ["resolve", "export", "verify", "confirm-sender", "receive-merchant"]);
      const reloaded = createNativeReserveExecution(f.adapter, quote);
      f.calls.length = 0;
      await reloaded.restoreForResolution(f.preparation);
      assert.equal((await reloaded.resolve()).status, "committed");
      assert.equal(f.calls.includes("prepare"), false); assert.equal(f.calls.includes("stage"), false);
      assert.equal(f.calls[0], "resolve", "lookup happens before reopening the committed sources");
    });
  }

  it("requires this purchase's explicit signed consent before opening authority or staging", async () => {
    const f = await fixture(), execution = createNativeReserveExecution(f.adapter, quote);
    await execution.prepare(f.preparation); f.calls.length = 0;
    const swapped = { ...f.authority, signedChallenge: { ...f.authority.signedChallenge,
      consent: { approved: true, statementDigest: "a".repeat(64) } } };
    await assert.rejects(execution.execute(swapped), /explicit_consent_required/);
    assert.deepEqual(f.calls, ["verify"]);
  });

  it("rejects payer, receiver, tenant, reference and idempotency changes before any rail request", async () => {
    const f = await fixture();
    for (const change of [{ buyerUserId: "other" }, { buyerReceizId: "other" }, { recipientUserId: "other" },
      { merchantUsername: "bjklock" }, { tenantHost: "other.test" }, { orderId: "other" }, { idempotencyKey: "other" }]) {
      await assert.rejects(createWalletFirstReceizSettlement({ ...settlementInput(f.adapter), ...change }), /original_quote_mismatch/);
    }
    assert.deepEqual(f.calls, []);
  });

  it("never recalculates a submitted Reserve attempt into a full card charge", async () => {
    const f = await fixture();
    f.adapter.connectWallet = async () => ({ ok: true, userId: quote.buyerUserId, balanceUsdCents: "0" });
    await assert.rejects(createWalletFirstReceizSettlement({ ...settlementInput(f.adapter), originalReserveQuote: undefined,
      nativeReserveExecution: { preparation: f.preparation, authority: f.authority } }), /original_quote_required/);
    assert.deepEqual(f.calls, []);
  });

  it("opens a bound Reserve request before any debit or card when complete sources are absent", async () => {
    const f = await fixture();
    await assert.rejects(createWalletFirstReceizSettlement(settlementInput(f.adapter)), error => error instanceof NativeReserveRequiredError &&
      error.quote.merchantUsername === "seller" && error.quote.buyerUserId === quote.buyerUserId && error.quote.funding.cardDeltaUsdCents === 900);
    assert.deepEqual(f.calls, []);
  });

  it("the unchanged SDK rejects caller-created proof/paid flags without creating any financial request", async () => {
    let requests = 0;
    const actual = createReceizCommerceAdapter({ fetchImpl: async () => { requests++; throw new Error("unexpected_http"); } });
    const f = await fixture();
    await assert.rejects(createWalletFirstReceizSettlement({ ...settlementInput(actual), nativeReserveExecution: {
      preparation: f.preparation, authority: f.authority } }));
    assert.equal(requests, 0);
  });
});

describe("Complete Reserve recovery transport", () => {
  it("encrypts all original recovery bytes and rejects alteration, different keys and oversized material", async () => {
    const f = await fixture(), value = { schema: "receiz.app.native_reserve_coordinates.v1" as const, quote, recovery: f.recovery };
    const token = encodeNativeReserveCoordinates(value, "fixture-secret");
    assert.deepEqual(readNativeReserveCoordinates(token, "fixture-secret"), value);
    assert.equal(token.includes(quote.buyerUserId), false);
    const pieces = token.split("."); pieces[2] = (pieces[2][0] === "A" ? "B" : "A") + pieces[2].slice(1);
    assert.throws(() => readNativeReserveCoordinates(pieces.join("."), "fixture-secret"), /recovery_invalid/);
    assert.throws(() => readNativeReserveCoordinates(token, "another-secret"), /recovery_invalid/);
    assert.throws(() => readNativeReserveCoordinates("a".repeat(MAX_NATIVE_RESERVE_TOKEN_LENGTH + 1), "fixture-secret"), /recovery_invalid/);
    assert.throws(() => encodeNativeReserveCoordinates({ ...value, recovery: { padding: "x".repeat(550_000) } as unknown as typeof value.recovery }, "fixture-secret"), /recovery_too_large/);
  });
});
