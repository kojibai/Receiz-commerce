import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProductPurchaseModel,
  productRoutePath,
  stateWithCartProduct
} from "../src/lib/storefront/product-purchase.js";
import { baseState } from "./support/commerce-state.js";

describe("product purchase routing", () => {
  it("builds canonical product paths from SEO paths or generated slugs", () => {
    const state = baseState();
    const product = state.products[0]!;

    assert.equal(
      productRoutePath({
        ...product,
        seo: {
          title: "House Blend",
          description: "Whole bean",
          canonicalPath: "/products/house-blend",
          keywords: [],
          socialImageUrl: null
        }
      }),
      "/products/house-blend"
    );
    assert.equal(productRoutePath(product), "/products/coffee-pack");
  });

  it("adds the selected product to a checkout cart snapshot", () => {
    const state = baseState();
    const withOne = stateWithCartProduct(state, "coffee-pack");
    const withTwo = stateWithCartProduct(withOne, "coffee-pack");

    assert.deepEqual(withOne.cart.lines, [{ productId: "coffee-pack", quantity: 1 }]);
    assert.deepEqual(withTwo.cart.lines, [{ productId: "coffee-pack", quantity: 2 }]);
    assert.deepEqual(state.cart.lines, []);
  });

  it("builds a product purchase model for the detail page", () => {
    const state = baseState();
    const product = state.products[0]!;
    const model = buildProductPurchaseModel(state, product);

    assert.equal(model.productId, "coffee-pack");
    assert.equal(model.primaryActionLabel, "Buy with Receiz checkout");
    assert.equal(model.secondaryActionLabel, "Add to cart");
    assert.equal(model.priceLabel, "$18.00");
    assert.ok(model.proofFacts.some((fact) => fact.label === "Proof" && fact.value === "Proof sealed"));
    assert.ok(model.proofFacts.some((fact) => fact.label === "Settlement" && fact.value === "boost.receiz.id"));
  });
});
