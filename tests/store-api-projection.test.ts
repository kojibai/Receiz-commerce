import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeStoreApiProjection, mergeStoreCommerceProjection } from "../src/lib/storefront/store-api-projection.js";
import { baseState } from "./support/commerce-state.js";

describe("store API projection merge", () => {
  it("applies published tenant products and blog content over fallback state", () => {
    const base = baseState();
    const merged = mergeStoreApiProjection(base, {
      ok: true,
      publishedState: true,
      brand: { name: "BJ Klock", logoText: "bjklock" },
      hosting: { subdomain: "bjklock.receiz.app", liveUrl: "https://bjklock.receiz.app" },
      products: [{ ...base.products[0], id: "new-product", name: "New product" }],
      blogPosts: [{ ...base.blogPosts[0], id: "new-story", title: "New story" }],
      collections: [{ id: "featured", name: "Featured", slug: "featured", productIds: ["new-product"], published: true }]
    });

    assert.ok(merged);
    assert.equal(merged.brand.name, "BJ Klock");
    assert.equal(merged.products.length, 1);
    assert.equal(merged.products[0]?.name, "New product");
    assert.equal(merged.blogPosts.length, 1);
    assert.equal(merged.blogPosts[0]?.title, "New story");
    assert.equal(merged.collections[0]?.productIds[0], "new-product");
  });

  it("ignores fallback or failed API responses", () => {
    assert.equal(mergeStoreApiProjection(baseState(), { ok: true, publishedState: false }), null);
    assert.equal(mergeStoreApiProjection(baseState(), { ok: false, publishedState: true }), null);
  });

  it("merges tenant commerce projection without replacing draft storefront content", () => {
    const base = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Draft Merchant Brand" },
      products: [{ ...baseState().products[0], id: "draft-product", name: "Draft product" }],
      orders: [],
      customers: [],
      proofEvents: []
    };
    const merged = mergeStoreCommerceProjection(base, {
      ok: true,
      publishedState: true,
      brand: { name: "Published Brand" },
      products: [{ ...baseState().products[0], id: "published-product", name: "Published product" }],
      orders: [{ ...baseState().orders[0], id: "order-123", customerEmail: "buyer@example.com" }],
      customers: [{ ...baseState().customers[0], id: "customer-buyer", email: "buyer@example.com" }],
      proofEvents: [{ id: "checkout-event", type: "ORDER_VERIFIED", title: "ORDER_VERIFIED", detail: "order-123", status: "verified", timestampLabel: "now" }]
    });

    assert.ok(merged);
    assert.equal(merged.brand.name, "Draft Merchant Brand");
    assert.equal(merged.products[0]?.id, "draft-product");
    assert.equal(merged.orders[0]?.id, "order-123");
    assert.equal(merged.customers[0]?.email, "buyer@example.com");
    assert.equal(merged.proofEvents[0]?.id, "checkout-event");
  });
});
