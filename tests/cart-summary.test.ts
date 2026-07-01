import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCartSummary } from "../src/lib/storefront/cart-summary.js";
import { stateWithCartProduct } from "../src/lib/storefront/product-purchase.js";
import { baseState } from "./support/commerce-state.js";

describe("cart summary", () => {
  it("summarizes cart lines with totals for checkout", () => {
    const state = stateWithCartProduct(stateWithCartProduct(baseState(), "coffee-pack"), "coffee-pack");
    const summary = buildCartSummary(state);

    assert.equal(summary.itemCount, 2);
    assert.equal(summary.subtotalLabel, "$36.00");
    assert.equal(summary.canCheckout, true);
    assert.equal(summary.checkoutLabel, "Checkout with Receiz");
    assert.equal(summary.lines[0]?.productId, "coffee-pack");
    assert.equal(summary.lines[0]?.quantity, 2);
    assert.equal(summary.lines[0]?.lineTotalLabel, "$36.00");
  });

  it("keeps stale or missing cart lines out of the purchase summary", () => {
    const state = {
      ...baseState(),
      cart: {
        lines: [
          { productId: "missing-product", quantity: 3 },
          { productId: "coffee-pack", quantity: 1 }
        ]
      }
    };

    const summary = buildCartSummary(state);

    assert.equal(summary.itemCount, 1);
    assert.equal(summary.subtotalLabel, "$18.00");
    assert.equal(summary.lines.length, 1);
    assert.equal(summary.lines[0]?.productId, "coffee-pack");
  });

  it("exposes an empty cart state without allowing checkout", () => {
    const summary = buildCartSummary(baseState());

    assert.equal(summary.itemCount, 0);
    assert.equal(summary.subtotalLabel, "$0.00");
    assert.equal(summary.canCheckout, false);
    assert.equal(summary.checkoutLabel, "Add products to checkout");
    assert.equal(summary.lines.length, 0);
  });
});
