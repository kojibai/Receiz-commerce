import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authoritativeCheckoutQuote,
  canonicalOrderId,
  settlementIdempotencyKey
} from "../src/lib/checkout/checkout-authority.js";
import { baseState } from "./support/commerce-state.js";

describe("authoritative checkout quote", () => {
  it("derives price, quantity, merchant, and recipient from published store state", () => {
    const state = baseState();
    state.hosting.merchantReceizId = "merchant.receiz.id";
    state.hosting.settlementUserId = "merchant_user_123";

    const quote = authoritativeCheckoutQuote(state, [
      { productId: state.products[0]!.id, quantity: 2 }
    ]);

    assert.equal(quote.amountUsd, "36.00");
    assert.equal(quote.totalUsdCents, 3600);
    assert.equal(quote.itemCount, 2);
    assert.equal(quote.merchantReceizId, "merchant.receiz.id");
    assert.equal(quote.recipientUserId, "merchant_user_123");
    assert.deepEqual(quote.items, [
      {
        id: state.products[0]!.id,
        title: state.products[0]!.name,
        quantity: 2,
        unitPriceUsd: "18.00",
        amountUsd: "36.00"
      }
    ]);
  });

  it("rejects missing, inactive, empty, and zero-value cart lines", () => {
    const state = baseState();
    state.products[0]!.status = "draft";

    assert.throws(() => authoritativeCheckoutQuote(state, []), /checkout_cart_required/);
    assert.throws(
      () => authoritativeCheckoutQuote(state, [{ productId: "missing", quantity: 1 }]),
      /checkout_product_unavailable/
    );
    assert.throws(
      () => authoritativeCheckoutQuote(state, [{ productId: state.products[0]!.id, quantity: 1 }]),
      /checkout_product_unavailable/
    );

    state.products[0]!.status = "active";
    state.products[0]!.priceLabel = "$0.00";
    assert.throws(
      () => authoritativeCheckoutQuote(state, [{ productId: state.products[0]!.id, quantity: 1 }]),
      /checkout_total_invalid/
    );
  });

  it("rejects malformed and excessive quantities", () => {
    const state = baseState();

    for (const quantity of [0, -1, 1.5, 100]) {
      assert.throws(
        () => authoritativeCheckoutQuote(state, [{ productId: state.products[0]!.id, quantity }]),
        /checkout_quantity_invalid/
      );
    }
  });

  it("binds idempotency to the full economic operation", () => {
    const base = {
      actorReceizId: "buyer.receiz.id",
      amountUsd: "18.00",
      merchantReceizId: "merchant.receiz.id",
      operation: "checkout" as const,
      recipientUserId: "merchant_user",
      tenantHost: "merchant.receiz.app"
    };
    const first = settlementIdempotencyKey({ ...base, orderId: "order_1" });
    const retry = settlementIdempotencyKey({ ...base, orderId: "order_1" });
    const second = settlementIdempotencyKey({ ...base, orderId: "order_2" });

    assert.equal(first, retry);
    assert.notEqual(first, second);
    assert.match(canonicalOrderId("order_1"), /^order_1$/);
    assert.match(canonicalOrderId("bad order id"), /^order_[0-9a-f-]{36}$/);
  });
});
