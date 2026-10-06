import { createReceizIdentityKeyFile, serializeReceizIdentityArtifact, receizBase64UrlEncode } from "@receiz/sdk";
import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter";
import { retainBrowserReserveAttempt } from "../src/lib/checkout/browser-reserve-attempt";
import type { NativeReserveExecutionTransport } from "../src/lib/checkout/browser-reserve-payment";
import type { NativeReserveQuote } from "../src/lib/checkout/native-reserve-execution";
import type { EmbeddedPaymentSession } from "../src/types/embedded-payment";

const quote: NativeReserveQuote = { applicationId: "receiz-commerce-kit", tenantHost: "merchant.receiz.app",
  buyerUserId: "buyer-account", buyerReceizId: "buyer", merchantUsername: "merchant", recipientUserId: "merchant-account",
  referenceId: "order-original", idempotencyKey: "payment-original", funding: {
    totalUsdCents: 1800, walletBalanceUsdCents: 900, walletAppliedUsdCents: 900, cardDeltaUsdCents: 900 } };
let input: NativeReserveExecutionTransport;
before(async () => {
  const buyer = await createReceizIdentityKeyFile({ owner: { uid: quote.buyerUserId, username: "buyer" },
    portableState: { snapshot: {} }, passphrase: "fixture-only-buyer-passphrase" });
  const merchant = await createReceizIdentityKeyFile({ owner: { uid: quote.recipientUserId, username: "merchant" },
    portableState: { snapshot: {} }, passphrase: "fixture-only-merchant-passphrase" });
  const buyerBytes = receizBase64UrlEncode(new TextEncoder().encode(serializeReceizIdentityArtifact(buyer.keyFile)));
  const merchantBytes = receizBase64UrlEncode(new TextEncoder().encode(serializeReceizIdentityArtifact(merchant.keyFile)));
  const priceBasis = { schema: "fixture.price-basis.v1", kai: "14000000" };
  const adapter = createReceizCommerceAdapter({ fetchImpl: async () => { throw new Error("unexpected_network"); } });
  const planned = await adapter.v125.value.edge.planReserve({ applicationId: quote.applicationId, amountPhiMicro: "9000000",
    sourceProofObjectId: "fixture:source", sourceValueHead: "11".repeat(32), destinationSubjectId: "merchant-subject",
    expectedDestinationHead: "22".repeat(32), usdPerPhiMicrocents: "100000000", priceBasis,
    idempotencyKey: `${quote.idempotencyKey}:reserve`, attemptId: "attempt-original" });
  // These bytes test retained transport and the real SDK plan inspector. They
  // deliberately do not claim sealed transition admission or a paid outcome.
  input = { preparation: { priceBasis, transitionSet: { applicationId: quote.applicationId,
    exactPlanDigest: planned.plan.exactPlanDigest, members: [
      { participantId: planned.sourceParticipantId, operationPlan: planned.plan, identityArtifact: { exactBytesB64u: buyerBytes } },
      { participantId: planned.destinationParticipantId, operationPlan: planned.plan, identityArtifact: { exactBytesB64u: merchantBytes } }
    ] } as unknown as NativeReserveExecutionTransport["preparation"]["transitionSet"] },
    authority: { proofArtifactB64u: buyerBytes, actorSubjectId: "buyer-subject", subjectSourceArtifact: {},
      requiredNamespaces: [], requestedRails: ["reserve"] } };
});

function pending(): EmbeddedPaymentSession {
  return { purpose: "storefront_checkout", title: "Pay", continuationToken: "fixture-continuation", reserveRequest: structuredClone(quote) };
}

describe("browser original Reserve attempt custody", () => {
  it("saves the complete encrypted source transport before submission and restores it after reload without signing or uploading", async () => {
    let serialized = "";
    const sent = await retainBrowserReserveAttempt(pending(), input, payment => { serialized = JSON.stringify(payment); return true; });
    assert.deepEqual(sent, { ...input, recoverOnly: false });
    const reloaded = JSON.parse(serialized) as EmbeddedPaymentSession;
    assert.equal(reloaded.reserveResolutionRequired, true);
    assert.deepEqual(reloaded.reserveAttempt?.preparation, input.preparation);
    const recovered = await retainBrowserReserveAttempt(reloaded, undefined, () => { throw new Error("unexpected_write"); });
    assert.deepEqual(recovered, { ...input, recoverOnly: true });
  });

  it("stops before submission when complete original source persistence fails", async () => {
    await assert.rejects(retainBrowserReserveAttempt(pending(), input, () => false), /Save the original payment/);
  });

  it("does not replace an unresolved attempt with another transfer", async () => {
    let saved = pending();
    await retainBrowserReserveAttempt(saved, input, payment => { saved = payment; return true; });
    const changed = { ...structuredClone(input), preparation: { ...input.preparation, priceBasis: { changed: true } } };
    await assert.rejects(retainBrowserReserveAttempt(saved, changed, () => { throw new Error("unexpected_write"); }), /original_attempt_required/);
  });

  it("rejects changed Reserve amount and buyer before saving an attempt", async () => {
    for (const change of [{ buyerUserId: "another-buyer" }, { funding: { ...quote.funding, walletAppliedUsdCents: 899, cardDeltaUsdCents: 901 } }]) {
      await assert.rejects(retainBrowserReserveAttempt({ ...pending(), reserveRequest: { ...quote, ...change } }, input,
        () => { throw new Error("unexpected_write"); }), /buyer|quote_mismatch/);
    }
  });

  it("leaves card sessions and first-time source requests alone", async () => {
    assert.equal(await retainBrowserReserveAttempt(pending(), undefined, () => { throw new Error("unexpected_write"); }), undefined);
    assert.equal(await retainBrowserReserveAttempt({ purpose: "hosting_plan", title: "Card" }, undefined,
      () => { throw new Error("unexpected_write"); }), undefined);
  });
});
