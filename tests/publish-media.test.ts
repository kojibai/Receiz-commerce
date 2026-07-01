import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreStateRecord } from "../src/lib/receiz/proof-state.js";
import {
  prepareStoreStateMediaForPublish,
  type ReceizMediaUploadLike
} from "../src/lib/receiz/media-publication.js";
import { baseState } from "./support/commerce-state.js";

function dataUrl(label: string) {
  return `data:image/png;base64,${Buffer.from(`image:${label}`).toString("base64")}`;
}

describe("Receiz media publication", () => {
  it("uploads inline merchant images before building the published proof state", async () => {
    const logo = dataUrl("logo");
    const product = dataUrl("product");
    const cover = dataUrl("cover");
    const calls: Array<{ purpose?: string; filename?: string; idempotencyKey?: string; size: number; type: string }> = [];
    const upload: ReceizMediaUploadLike = async (file, options) => {
      calls.push({
        purpose: options?.purpose,
        filename: options?.filename,
        idempotencyKey: options?.idempotencyKey,
        size: file.size,
        type: file.type
      });

      return {
        ok: true,
        media: {
          url: `https://media.receiz.test/${calls.length}.webp`
        }
      };
    };

    const prepared = await prepareStoreStateMediaForPublish(
      {
        ...baseState(),
        brand: { ...baseState().brand, logoImageUrl: logo },
        products: [
          {
            ...baseState().products[0],
            imageUrl: product,
            seo: {
              canonicalPath: "/products/coffee-pack",
              title: "Coffee Pack",
              description: "Whole bean",
              keywords: [],
              socialImageUrl: product
            }
          }
        ],
        blogPosts: [
          {
            id: "origin",
            title: "Origin story",
            slug: "/blog/origin",
            excerpt: "How the store sources proof-sealed beans.",
            body: "Origin body",
            status: "published",
            publishedAt: "2026-06-30T00:00:00.000Z",
            featured: true,
            authorName: "Boost Coffee",
            tags: ["coffee"],
            coverImageUrl: cover,
            seo: {
              canonicalPath: "/blog/origin",
              title: "Origin story",
              description: "How the store sources proof-sealed beans.",
              keywords: [],
              socialImageUrl: cover
            }
          }
        ]
      },
      {
        tenantHost: "boost.receiz.app",
        merchantReceizId: "boost.receiz.id",
        upload
      }
    );

    assert.match(prepared.brand.logoImageUrl ?? "", /^https:\/\/media\.receiz\.test\/\d+\.webp$/);
    assert.match(prepared.products[0]?.imageUrl ?? "", /^https:\/\/media\.receiz\.test\/\d+\.webp$/);
    assert.equal(prepared.products[0]?.seo?.socialImageUrl, prepared.products[0]?.imageUrl);
    assert.match(prepared.blogPosts[0]?.coverImageUrl ?? "", /^https:\/\/media\.receiz\.test\/\d+\.webp$/);
    assert.equal(prepared.blogPosts[0]?.seo.socialImageUrl, prepared.blogPosts[0]?.coverImageUrl);
    assert.equal(new Set([prepared.brand.logoImageUrl, prepared.products[0]?.imageUrl, prepared.blogPosts[0]?.coverImageUrl]).size, 3);
    assert.deepEqual([...calls.map((call) => call.purpose)].sort(), ["blog.cover", "product.image", "store.logo"]);
    assert.equal(calls.every((call) => call.type === "image/png"), true);
    assert.equal(calls.every((call) => call.idempotencyKey?.startsWith("receiz-media:boost.receiz.app:")), true);

    const record = buildStoreStateRecord(prepared, {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      reason: "publish",
      recordedAt: "2026-06-30T00:00:00.000Z"
    });

    assert.equal(record.state.brand.logoImageUrl, prepared.brand.logoImageUrl);
    assert.equal(record.state.products[0]?.imageUrl, prepared.products[0]?.imageUrl);
  });

  it("fails publication clearly when Receiz media upload does not return a durable URL", async () => {
    await assert.rejects(
      prepareStoreStateMediaForPublish(
        {
          ...baseState(),
          brand: { ...baseState().brand, logoImageUrl: dataUrl("logo") }
        },
        {
          tenantHost: "boost.receiz.app",
          merchantReceizId: "boost.receiz.id",
          upload: async () => ({ ok: true, media: { id: "media_without_url" } })
        }
      ),
      /receiz_media_url_missing/
    );
  });
});
