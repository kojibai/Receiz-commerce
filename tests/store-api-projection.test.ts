import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeStoreApiProjection } from "../src/lib/storefront/store-api-projection.js";
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
});
