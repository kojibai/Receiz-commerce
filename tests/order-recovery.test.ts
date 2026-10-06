import assert from "node:assert/strict";
import { it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter.js";
import { encodeOrderRecoveryCoordinates, readOrderRecoveryCoordinates, recoverOriginalOrder, type OrderRecoveryCoordinates } from "../src/lib/checkout/order-recovery.js";

const secret = "test-only-store-order-recovery-coordinate-secret";
const receiver = "20000000-0000-4000-8000-000000000002";
function coordinates(): OrderRecoveryCoordinates {
  return { schema: "receiz.app.order_recovery_coordinates.v1", payerUserId: "original_buyer_id", createdAt: "2026-01-01T14:00:00.000Z",
    payment: { purpose: "storefront_checkout", tenantHost: "shop.receiz.app", actorReceizId: "buyer.receiz.id", merchantUsername: "shop",
      referenceId: "order_original", checkoutSessionId: "cs_original", amountUsd: "18.00", issuedAt: 1,
      funding: { totalUsdCents: 1800, walletBalanceUsdCents: 0, walletAppliedUsdCents: 0, cardDeltaUsdCents: 1800 },
      context: { quote: { amountUsd: "18.00", totalUsdCents: 1800, itemCount: 2, merchantReceizId: "shop.receiz.id", recipientUserId: receiver,
        wildsAssets: [], items: [{ id: "original_product", title: "Original product", quantity: 2, unitPriceUsd: "9.00", amountUsd: "18.00" }] },
        customer: { customerEmail: "original_buyer@example.test", fulfillment: { kind: "digital_delivery" } } } } };
}
const buyer = { handle: "buyer.receiz.id", userId: "original_buyer_id" };
function transport(overrides: Record<string, unknown> = {}) {
  const requests: URL[] = [];
  const receiz = createReceizCommerceAdapter({ baseUrl: "https://receiz.test", fetchImpl: (async (url, init) => {
    const parsed = new URL(String(url)); requests.push(parsed);
    assert.equal(init?.method ?? "GET", "GET", "recovery is read-only on the payment rail");
    assert.equal(parsed.pathname, "/api/payments/embed/checkout/session", "must not create a checkout or transfer");
    assert.equal(parsed.searchParams.get("session_id"), "cs_original");
    assert.equal(parsed.searchParams.get("merchant"), "shop");
    return Response.json({ ok: true, checkoutSessionId: "cs_original", status: "paid", amountUsdCents: "1800",
      referenceId: "order_original", merchantUsername: "shop", recipientUserId: receiver, receiptId: "original_receipt", ...overrides });
  }) as typeof fetch });
  return { receiz, requests };
}

it("holds private order coordinates without a plaintext shipping or customer record", () => {
  const value = coordinates(), token = encodeOrderRecoveryCoordinates(value, secret);
  assert.ok(!token.includes("original_buyer"));
  assert.deepEqual(readOrderRecoveryCoordinates(token, "shop.receiz.app", secret), value);
  assert.throws(() => readOrderRecoveryCoordinates(token, "another.receiz.app", secret), /order_recovery_tenant_mismatch/);
  const parts = token.split("."); parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
  assert.throws(() => readOrderRecoveryCoordinates(parts.join("."), "shop.receiz.app", secret), /order_recovery_invalid/);
  assert.throws(() => readOrderRecoveryCoordinates(token, "shop.receiz.app", "wrong-secret"), /order_recovery_invalid/);
});

it("recovers a paid order after 24 hours from the original session without needing today's catalog or wallet", async () => {
  const token = encodeOrderRecoveryCoordinates(coordinates(), secret);
  const reopened = readOrderRecoveryCoordinates(token, "shop.receiz.app", secret);
  const { receiz, requests } = transport();
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await recoverOriginalOrder({ receiz, coordinates: reopened, reader: buyer });
    assert.equal(result.settlement.paid, true);
    assert.equal(result.order?.id, "order_original");
    assert.equal(result.order?.createdAt, "2026-01-01T14:00:00.000Z");
    assert.equal(result.order?.itemCount, 2);
    assert.equal(result.order?.sealed, false, "a paid SDK receipt is not an enclosing order seal");
    assert.equal(result.order?.fulfillment?.status, "delivery_pending");
    assert.equal(result.order?.fulfillment?.deliveryRails, undefined, "no delivery occurred during a status read");
  }
  assert.equal(requests.length, 2);
});

it("permits only the bound buyer or actual receiving merchant for an identified buyer's order", async () => {
  for (const reader of [{}, { handle: buyer.handle, userId: "other" }, { handle: "other.receiz.id", userId: buyer.userId },
    { handle: "shop.receiz.id", userId: "wrong_receiver" }]) {
    const { receiz, requests } = transport();
    await assert.rejects(recoverOriginalOrder({ receiz, coordinates: coordinates(), reader }), /order_recovery_identity_required/);
    assert.equal(requests.length, 0);
  }
  const { receiz } = transport();
  assert.equal((await recoverOriginalOrder({ receiz, coordinates: coordinates(), reader: { handle: "shop.receiz.id", userId: receiver } })).role, "merchant");
});

it("can recover a guest purchase using its unguessable private file without requiring a merchant credential", async () => {
  const value = coordinates();
  const guest = { ...value, payerUserId: undefined, payment: { ...value.payment, actorReceizId: undefined } };
  const { receiz } = transport();
  const result = await recoverOriginalOrder({ receiz, coordinates: guest, reader: {} });
  assert.equal(result.order?.customerId, "guest:order_original");
  assert.equal(result.settlement.paid, true);
});

it("does not create a paid order for unpaid, expired, or refunded original payments", async () => {
  for (const status of ["open", "expired", "refunded"]) {
    const { receiz, requests } = transport({ status });
    const result = await recoverOriginalOrder({ receiz, coordinates: coordinates(), reader: buyer });
    assert.equal(result.order, null);
    assert.equal(result.settlement.paid, false);
    assert.equal(requests.length, 1);
  }
});

it("rejects amount, reference, merchant, session, and recipient mismatches", async () => {
  for (const mismatch of [{ amountUsdCents: "1" }, { referenceId: "other" }, { merchantUsername: "other" },
    { checkoutSessionId: "cs_other" }, { recipientUserId: "30000000-0000-4000-8000-000000000003" }]) {
    const { receiz } = transport(mismatch);
    await assert.rejects(recoverOriginalOrder({ receiz, coordinates: coordinates(), reader: buyer }), /checkout_(?:amount|reference|merchant|session|recipient)_mismatch/);
  }
});

it("cannot encode inconsistent quantities, amount, receiver, or fulfillment coordinates", () => {
  const original = coordinates();
  for (const change of [{ amountUsd: "1.00" }, { itemCount: 1 }, { merchantReceizId: "other.receiz.id" }, { recipientUserId: "" }]) {
    const value = structuredClone(original);
    Object.assign(value.payment.context.quote as Record<string, unknown>, change);
    assert.throws(() => encodeOrderRecoveryCoordinates(value, secret), /order_recovery_quote_mismatch/);
  }
  const value = structuredClone(original);
  value.payment.context.customer = { fulfillment: { kind: "unknown" } };
  assert.throws(() => encodeOrderRecoveryCoordinates(value, secret), /order_recovery_quote_mismatch/);
});

it("never treats forged Reserve coordinates as payment or creates a card charge for them", async () => {
  const value = coordinates();
  value.payment.funding = { totalUsdCents: 1800, walletBalanceUsdCents: 900, walletAppliedUsdCents: 900, cardDeltaUsdCents: 900 };
  const { receiz, requests } = transport({ amountUsdCents: "900" });
  await assert.rejects(recoverOriginalOrder({ receiz, coordinates: value, reader: buyer }), /reserve_checkout_execution_required/);
  assert.equal(requests.length, 0);
});
