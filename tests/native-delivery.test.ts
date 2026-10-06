import assert from "node:assert/strict";
import { createCipheriv, createHash } from "node:crypto";
import { it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter.js";
import { holdProductDeliverySource, openProductDeliverySource } from "../src/lib/delivery/native-delivery.js";
import { openPaidOrderDelivery } from "../src/lib/delivery/paid-delivery.js";
import { authoritativeCheckoutQuote } from "../src/lib/checkout/checkout-authority.js";
import { encodeOrderRecoveryCoordinates, readOrderRecoveryCoordinates, type OrderRecoveryCoordinates } from "../src/lib/checkout/order-recovery.js";
import { baseState } from "./support/commerce-state.js";
import type { ProductDeliverySource } from "../src/types/domain.js";

const secret = "test-only-native-product-delivery-secret-12345";
const binding = { tenantHost: "shop.receiz.app", productId: "digital_original", merchantReceizId: "shop.receiz.id" };
const purpose = "receiz-storefront-exact-delivery-source:v1";

/** Deliberately authentic app transport containing an UNSEALED file. These
 * tests must prove encryption/metadata do not admit it as native proof. */
function unsealedSource(): ProductDeliverySource {
  const bytes = new TextEncoder().encode("unsealed test payload");
  const capsule = createReceizCommerceAdapter().v124.material.encodeCapsuleBytes({ exactArtifactBytes: bytes, filename: "unsealed.txt", mimeType: "text/plain" });
  const iv = Buffer.alloc(12, 3);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(purpose).update("\0").update(secret).digest(), iv);
  cipher.setAAD(Buffer.from(JSON.stringify([purpose, binding.productId, binding.merchantReceizId])));
  const token = ["ds1", iv.toString("base64url"), Buffer.concat([cipher.update(capsule), cipher.final()]).toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
  const hash = createHash("sha256").update(bytes).digest("hex");
  return { schema: "receiz.app.product_delivery_source.v1", token, size: bytes.length, filename: "unsealed.txt", mimeType: "text/plain",
    artifactSha256: hash, payloadSha256: hash, ownerReceizId: binding.merchantReceizId };
}
function coordinates(): OrderRecoveryCoordinates {
  return { schema: "receiz.app.order_recovery_coordinates.v1", createdAt: "2026-01-01T14:00:00Z", payment: {
    purpose: "storefront_checkout", tenantHost: binding.tenantHost, merchantUsername: "shop", referenceId: "original_order", checkoutSessionId: "original_session", amountUsd: "18.00",
    funding: { totalUsdCents: 1800, walletBalanceUsdCents: 0, walletAppliedUsdCents: 0, cardDeltaUsdCents: 1800 },
    context: { quote: { amountUsd: "18.00", totalUsdCents: 1800, itemCount: 1, merchantReceizId: binding.merchantReceizId, recipientUserId: "shop",
      wildsAssets: [], items: [{ id: binding.productId, title: "Original file", quantity: 1, unitPriceUsd: "18.00", amountUsd: "18.00", deliverySource: unsealedSource() }] },
      customer: { fulfillment: { kind: "digital_delivery" } } }
  } };
}
function adapter(status = "paid", mismatch = {}) {
  const requests: string[] = [];
  const receiz = createReceizCommerceAdapter({ baseUrl: "https://receiz.test", fetchImpl: (async (url, init) => {
    const target = new URL(String(url)); requests.push(target.pathname);
    assert.equal(init?.method ?? "GET", "GET", "delivery never creates a payment");
    assert.equal(target.pathname, "/api/payments/embed/checkout/session");
    assert.equal(target.searchParams.get("session_id"), "original_session");
    return Response.json({ ok: true, checkoutSessionId: "original_session", merchantUsername: "shop", referenceId: "original_order", amountUsdCents: "1800", status, ...mismatch });
  }) as typeof fetch });
  return { receiz, requests };
}

it("refuses digital checkout without an attached delivery source and freezes the purchased source", () => {
  const state = baseState(); state.products[0]!.type = "digital";
  const lines = [{ productId: state.products[0]!.id, quantity: 1 }];
  assert.throws(() => authoritativeCheckoutQuote(state, lines), /checkout_digital_source_required/);
  state.products[0]!.deliverySource = unsealedSource();
  const quote = authoritativeCheckoutQuote(state, lines);
  const original = quote.items[0]!.deliverySource!.token;
  state.products[0]!.deliverySource!.token = "changed_by_merchant";
  assert.equal(quote.items[0]!.deliverySource!.token, original);
});

it("real SDK verification rejects an unsealed upload rather than wrapping it as a native proof", async () => {
  const { receiz, requests } = adapter();
  await assert.rejects(holdProductDeliverySource({ receiz, binding, secret, file: new File(["ordinary content"], "not-proof.txt", { type: "text/plain" }) }));
  assert.equal(requests.length, 0);
});

it("binds encrypted source to merchant, product and exact metadata before SDK admission", async () => {
  const { receiz, requests } = adapter();
  const source = unsealedSource();
  for (const wrong of [{ ...binding, productId: "other" }, { ...binding, merchantReceizId: "other.receiz.id" }]) {
    await assert.rejects(openProductDeliverySource({ receiz, binding: wrong, source, secret }), /delivery_source_invalid/);
  }
  await assert.rejects(openProductDeliverySource({ receiz, binding, source, secret: "another-secret-with-at-least-32-characters" }), /delivery_source_invalid/);
  await assert.rejects(openProductDeliverySource({ receiz, binding, source: { ...source, artifactSha256: "a".repeat(64) }, secret }), /delivery_source_digest_mismatch/);
  await assert.rejects(openProductDeliverySource({ receiz, binding, source: { ...source, filename: "changed.txt" }, secret }), /delivery_source_digest_mismatch/);
  assert.equal(requests.length, 0);
});

it("a valid encrypted capsule of plain bytes still fails the actual SDK proof verifier", async () => {
  const { receiz, requests } = adapter();
  await assert.rejects(openProductDeliverySource({ receiz, binding, source: unsealedSource(), secret }));
  assert.equal(requests.length, 0);
});

it("never releases a source for unpaid, expired or refunded original payments", async () => {
  for (const status of ["open", "expired", "refunded"]) {
    const { receiz, requests } = adapter(status);
    await assert.rejects(openPaidOrderDelivery({ receiz, coordinates: coordinates(), reader: {}, secret }), /delivery_payment_not_settled/);
    assert.equal(requests.length, 1);
  }
});

it("checks the bound buyer and original payment before opening any source", async () => {
  const original = coordinates();
  const value = { ...original, payerUserId: "buyer_id", payment: { ...original.payment, actorReceizId: "buyer.receiz.id" } };
  const { receiz, requests } = adapter();
  await assert.rejects(openPaidOrderDelivery({ receiz, coordinates: value, reader: { handle: "other.receiz.id", userId: "other" }, secret }), /order_recovery_identity_required/);
  assert.equal(requests.length, 0);
  const wrong = adapter("paid", { amountUsdCents: "1" });
  await assert.rejects(openPaidOrderDelivery({ receiz: wrong.receiz, coordinates: coordinates(), reader: {}, secret }), /checkout_amount_mismatch/);
  assert.equal(wrong.requests.length, 1);
});

it("a paid SDK receipt cannot convert an unsealed source into a delivered proof", async () => {
  const value = readOrderRecoveryCoordinates(encodeOrderRecoveryCoordinates(coordinates(), secret), binding.tenantHost, secret);
  const { receiz, requests } = adapter();
  await assert.rejects(openPaidOrderDelivery({ receiz, coordinates: value, reader: {}, secret }));
  assert.equal(requests.length, 1);
});

it("bounds a complete recoverable quote without truncating its delivery source", () => {
  const value = coordinates();
  const quote = value.payment.context.quote as { items: Array<{ deliverySource: ProductDeliverySource }> };
  quote.items[0]!.deliverySource.token = "x".repeat(350_000);
  const token = encodeOrderRecoveryCoordinates(value, secret);
  assert.equal((readOrderRecoveryCoordinates(token, binding.tenantHost, secret).payment.context.quote as typeof quote).items[0]!.deliverySource.token.length, 350_000);
  quote.items[0]!.deliverySource.token = "x".repeat(1_500_000);
  assert.throws(() => encodeOrderRecoveryCoordinates(value, secret), /order_recovery_too_large/);
});
