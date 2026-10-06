import assert from "node:assert/strict";
import { it } from "node:test";
import { normalizeCheckoutSession, reserveBalanceUsdCents, embeddedCheckoutFrame, acceptsPaymentMessage } from "../src/lib/checkout/payment-contract.js";

it("normalizes the real merchant embedded checkout and verified payment response", () => {
  const created = normalizeCheckoutSession({ ok: true, checkout: { sessionId: "cs_123", clientSecret: "cs_123_secret", mode: "embedded" } });
  assert.equal(created.checkoutSessionId, "cs_123");
  assert.equal(created.clientSecret, "cs_123_secret");
  const paid = normalizeCheckoutSession({ ok: true, session: { sessionId: "cs_123", state: "paid", isPaid: true, stripePaymentStatus: "paid", amountUsdCents: "1800", referenceId: "order_1" }, settlement: { userId: "seller", amountUsdCents: "1800" } });
  assert.equal(paid.status, "paid");
  assert.equal(paid.amountUsdCents, "1800");
  assert.equal(paid.recipientUserId, "seller");
  const flat = normalizeCheckoutSession({ ok: true, checkoutSessionId: "cs_flat", status: "paid", amountUsdCents: "1800", recipientUserId: "seller", proofBundle: { kind: "held_receipt" } });
  assert.equal(flat.recipientUserId, "seller");
  assert.deepEqual(flat.proofBundle, { kind: "held_receipt" });
  assert.equal(normalizeCheckoutSession({ ok: true, session: { state: "complete_unpaid", isPaid: false } }).status, "complete_unpaid");
  assert.equal(normalizeCheckoutSession({ ok: true, session: { state: "paid", isPaid: false } }).status, "unpaid");
});

it("uses funded Reserve instead of ecosystem or display value", () => {
  assert.equal(reserveBalanceUsdCents({ ok: true, wallet: { balanceUsd: "950.00", valueStates: { settledBalanceUsdCents: "900" } } }), 900);
  assert.equal(reserveBalanceUsdCents({ ok: true, wallet: { balanceUsd: "950.00" } }), null);
  assert.equal(reserveBalanceUsdCents({ ok: false, balanceUsdCents: "1800" }), null);
  for (const invalid of ["invalid", "", "1.2", "-1", -1, Number.MAX_SAFE_INTEGER + 1, null]) {
    assert.equal(reserveBalanceUsdCents({ ok: true, wallet: { valueStates: { settledBalanceUsdCents: invalid } } }), null);
  }
  assert.equal(reserveBalanceUsdCents({ ok: true, wallet: { valueStates: { settledBalanceUsdCents: "0" } } }), 0);
});

it("keeps checkout in the configured embedded form and rejects redirect or secret-bearing fallback URLs", () => {
  const session = { checkoutSessionId: "cs_123", paymentOrigin: "https://receiz.test", merchantUsername: "seller" };
  assert.equal(embeddedCheckoutFrame({ ...session, checkoutUrl: "https://receiz.test/payments/embed/checkout?session_id=cs_123&merchant=seller" })?.name, "");
  for (const checkoutUrl of [
    "https://checkout.example/pay/cs_123",
    "https://receiz.test/pay/cs_123",
    "https://receiz.test/payments/embed/checkout?session_id=cs_other&merchant=seller",
    "https://receiz.test/payments/embed/checkout?session_id=cs_123&merchant=other",
    "https://receiz.test/payments/embed/checkout?session_id=cs_123&merchant=seller&client_secret=private",
    "javascript:alert(1)"
  ]) assert.equal(embeddedCheckoutFrame({ ...session, checkoutUrl }), null);
  assert.equal(embeddedCheckoutFrame({ ...session, clientSecret: "private", paymentOrigin: "not-a-url" }), null);
  assert.equal(embeddedCheckoutFrame({ ...session, clientSecret: "private", paymentOrigin: "http://receiz.test" }), null);
});

it("bootstraps the real embedded form and rejects unrelated completion messages", () => {
  const frame = embeddedCheckoutFrame({ checkoutSessionId: "cs_123", clientSecret: "cs_123_secret", paymentOrigin: "https://receiz.test", merchantUsername: "seller" });
  assert.equal(new URL(frame!.url).pathname, "/payments/embed/checkout");
  assert.equal(new URL(frame!.url).searchParams.has("client_secret"), false);
  assert.equal(JSON.parse(frame!.name).clientSecret, "cs_123_secret");
  const data = { source: "receiz-pay-embed", type: "checkout-complete", sessionId: "cs_123" };
  assert.equal(acceptsPaymentMessage(data, "https://receiz.test", "https://receiz.test", "cs_123"), true);
  assert.equal(acceptsPaymentMessage(data, "https://evil.test", "https://receiz.test", "cs_123"), false);
  assert.equal(acceptsPaymentMessage({ ...data, sessionId: "cs_other" }, "https://receiz.test", "https://receiz.test", "cs_123"), false);
});
