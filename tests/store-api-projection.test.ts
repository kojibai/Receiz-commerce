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
      proofMemory: {
        knownHead: {
          afterEntryId: "store_state:bjklock.receiz.app:20260701203000000",
          afterKaiUpulse: "20260701203000000",
          afterCreatedAt: "2026-07-01T20:30:00.000Z"
        }
      },
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

  it("rejects published tenant responses without a proof-memory Kai head", () => {
    assert.equal(
      mergeStoreApiProjection(baseState(), {
        ok: true,
        publishedState: true,
        brand: { name: "No proof head" }
      }),
      null
    );
  });

  it("ignores fallback or failed API responses", () => {
    assert.equal(mergeStoreApiProjection(baseState(), { ok: true, publishedState: false }), null);
    assert.equal(mergeStoreApiProjection(baseState(), { ok: false, publishedState: true }), null);
  });

  it("does not merge an older append head over a newer local proof-store head", () => {
    const base = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Fresh storefront" },
      hosting: {
        ...baseState().hosting,
        storeProofHead: {
          afterEntryId: "store_state:bjklock.receiz.app:20260701T203000000Z",
          afterKaiUpulse: "20260701203000000",
          afterCreatedAt: "2026-07-01T20:30:00.000Z"
        }
      }
    };

    const merged = mergeStoreApiProjection(base, {
      ok: true,
      publishedState: true,
      proofMemory: {
        knownHead: {
          afterEntryId: "store_state:bjklock.receiz.app:20260701T190000000Z",
          afterKaiUpulse: "20260701190000000",
          afterCreatedAt: "2026-07-01T19:00:00.000Z"
        }
      },
      brand: { name: "Older storefront" },
      products: [{ ...base.products[0], id: "older-product", name: "Older product" }]
    });

    assert.equal(merged, null);
  });

  it("merges a newer append head and stores it as the new local proof boundary", () => {
    const base = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Old storefront" },
      hosting: {
        ...baseState().hosting,
        storeProofHead: {
          afterEntryId: "store_state:bjklock.receiz.app:20260701T190000000Z",
          afterKaiUpulse: "20260701190000000",
          afterCreatedAt: "2026-07-01T19:00:00.000Z"
        }
      }
    };

    const merged = mergeStoreApiProjection(base, {
      ok: true,
      publishedState: true,
      proofMemory: {
        knownHead: {
          afterEntryId: "store_state:bjklock.receiz.app:20260701T203000000Z",
          afterKaiUpulse: "20260701203000000",
          afterCreatedAt: "2026-07-01T20:30:00.000Z"
        }
      },
      brand: { name: "Fresh storefront" },
      products: [{ ...base.products[0], id: "fresh-product", name: "Fresh product" }]
    });

    assert.ok(merged);
    assert.equal(merged.brand.name, "Fresh storefront");
    assert.equal(merged.products[0]?.id, "fresh-product");
    assert.equal(merged.hosting.storeProofHead?.afterKaiUpulse, "20260701203000000");
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
