import assert from "node:assert/strict";
import { it } from "node:test";
import { issuePaymentContinuation, readPaymentContinuation } from "../src/lib/checkout/payment-continuation.js";
import { platformOperationFromContinuation, type PlatformOperationIntent } from "../src/lib/hosting/platform-operation.js";

const secret = "test-platform-operation-continuation-secret";
const operation: PlatformOperationIntent = {
  id: "upgrade_original", kind: "hosting_plan", merchantReceizId: "seller.receiz.id", tenantHost: "seller.receiz.app",
  plan: "pro", amountUsd: "49.00", recipientUserId: "original_platform_account"
};
const quote = {
  purpose: "hosting_plan" as const, tenantHost: operation.tenantHost, actorReceizId: operation.merchantReceizId,
  merchantUsername: "bjklock", referenceId: operation.id, checkoutSessionId: "cs_original", amountUsd: operation.amountUsd,
  funding: { totalUsdCents: 4900, walletBalanceUsdCents: 0, walletAppliedUsdCents: 0, cardDeltaUsdCents: 4900 }, context: { operation }
};
function read() {
  return readPaymentContinuation(issuePaymentContinuation(quote, secret), {
    purpose: quote.purpose, tenantHost: quote.tenantHost, actorReceizId: quote.actorReceizId
  }, secret);
}

it("restores the original price and receiver when a platform payment is resumed", () => {
  const expected = { id: operation.id, kind: operation.kind, merchantReceizId: operation.merchantReceizId, tenantHost: operation.tenantHost, plan: operation.plan };
  const restored = platformOperationFromContinuation(read(), expected);
  assert.deepEqual(restored, operation);
  assert.equal(restored.amountUsd, "49.00");
  assert.equal(restored.recipientUserId, "original_platform_account");
});

it("cannot swap a paid operation to another plan, domain, merchant, or tenant even when prices match", () => {
  for (const changed of [
    { plan: "scale" as const }, { domain: "other.example" }, { tenantHost: "other.receiz.app" },
    { merchantReceizId: "other.receiz.id" }, { id: "upgrade_other" }, { kind: "custom_domain" as const }
  ]) assert.throws(() => platformOperationFromContinuation(read(), { ...operation, ...changed }), /platform_payment_continuation_mismatch/);
});

it("rejects a signed continuation that does not carry its original operation", () => {
  assert.throws(() => platformOperationFromContinuation({ ...read(), context: {} }, operation), /platform_payment_continuation_mismatch/);
  assert.throws(() => platformOperationFromContinuation({ ...read(), context: { operation: { ...operation, amountUsd: "0.00" } } }, operation), /platform_payment_continuation_mismatch/);
});
