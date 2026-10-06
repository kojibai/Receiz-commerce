import assert from "node:assert/strict";
import { it } from "node:test";
import { issuePaymentContinuation, readPaymentContinuation, readPaymentStatusContinuation } from "../src/lib/checkout/payment-continuation.js";

const secret = "test-continuation-secret-32-characters-long";
const quote = { purpose: "storefront_checkout" as const, tenantHost: "seller.receiz.app", actorReceizId: "buyer.receiz.id", merchantUsername: "seller", referenceId: "order_1", checkoutSessionId: "cs_123", amountUsd: "18.00", context: { itemCount: 1 }, funding: { totalUsdCents: 1800, walletBalanceUsdCents: 900, walletAppliedUsdCents: 900, cardDeltaUsdCents: 900 } };

it("preserves the original quote and rejects altered or cross-tenant continuations", () => {
  const token = issuePaymentContinuation(quote, secret);
  const resumed = readPaymentContinuation(token, { purpose: "storefront_checkout", tenantHost: "seller.receiz.app", actorReceizId: "buyer.receiz.id" }, secret);
  assert.equal(resumed.funding.cardDeltaUsdCents, 900);
  assert.equal(resumed.checkoutSessionId, "cs_123");
  assert.throws(() => readPaymentContinuation(`${token}x`, { purpose: "storefront_checkout", tenantHost: "seller.receiz.app" }, secret));
  assert.throws(() => readPaymentContinuation(token, { purpose: "storefront_checkout", tenantHost: "other.receiz.app" }, secret));
  assert.throws(() => readPaymentContinuation(token, { purpose: "hosting_plan", tenantHost: "seller.receiz.app" }, secret));
  assert.throws(() => readPaymentContinuation(token, { purpose: "storefront_checkout", tenantHost: "seller.receiz.app", actorReceizId: "other.receiz.id" }, secret));
});

it("allows only status inspection when the original buyer's short permission has expired", () => {
  const token = issuePaymentContinuation(quote, secret);
  assert.equal(readPaymentStatusContinuation(token, { purpose: quote.purpose, tenantHost: quote.tenantHost }, secret).checkoutSessionId, quote.checkoutSessionId);
  assert.throws(() => readPaymentContinuation(token, { purpose: quote.purpose, tenantHost: quote.tenantHost }, secret), /checkout_continuation_mismatch/);
  assert.throws(() => readPaymentStatusContinuation(token, { purpose: quote.purpose, tenantHost: quote.tenantHost, actorReceizId: "other.receiz.id" }, secret), /checkout_continuation_mismatch/);
  assert.throws(() => readPaymentStatusContinuation(token, { purpose: "hosting_plan" }, secret), /checkout_continuation_mismatch/);
  assert.throws(() => readPaymentStatusContinuation(`${token}x`, { purpose: quote.purpose }, secret));
});

it("rejects signed but inconsistent funding instead of treating it as a paid card delta", () => {
  for (const funding of [
    { ...quote.funding, cardDeltaUsdCents: 1800 }, { ...quote.funding, totalUsdCents: 900 },
    { ...quote.funding, walletBalanceUsdCents: -1 }, { ...quote.funding, cardDeltaUsdCents: 0 }
  ]) {
    const token = issuePaymentContinuation({ ...quote, funding }, secret);
    assert.throws(() => readPaymentStatusContinuation(token, { purpose: quote.purpose }, secret), /checkout_continuation_invalid/);
  }
});
