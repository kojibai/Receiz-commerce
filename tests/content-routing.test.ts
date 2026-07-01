import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeRoutePath,
  resolveBlogPostBySlug,
  resolvePageBySlug,
  resolveProductBySlug,
  slugifyRouteSegment
} from "../src/lib/storefront/content-routing.js";
import { baseState } from "./support/commerce-state.js";

describe("storefront content routing", () => {
  it("normalizes product and page route segments", () => {
    assert.equal(slugifyRouteSegment("Coffee Pack"), "coffee-pack");
    assert.equal(slugifyRouteSegment("/blog/Proof Sealed Beans"), "proof-sealed-beans");
    assert.equal(normalizeRoutePath("https://example.com/company/About Us?ref=nav"), "/company/about-us");
  });

  it("resolves active products by SEO path, id, or generated slug", () => {
    const state = {
      ...baseState(),
      products: [
        {
          ...baseState().products[0]!,
          seo: {
            title: "Coffee Pack",
            description: "Whole bean",
            canonicalPath: "/products/house-blend",
            keywords: [],
            socialImageUrl: null
          }
        }
      ]
    };

    assert.equal(resolveProductBySlug(state, "house-blend")?.id, "coffee-pack");
    assert.equal(resolveProductBySlug(state, "coffee-pack")?.id, "coffee-pack");
  });

  it("resolves only published blog posts and pages", () => {
    const state = {
      ...baseState(),
      blogPosts: [
        {
          id: "post-1",
          title: "Proof Sealed Beans",
          slug: "/blog/proof-sealed-beans",
          excerpt: "Proof story",
          body: "Long-form story",
          authorName: "Boost",
          coverImageUrl: null,
          tags: [],
          featured: true,
          status: "published" as const,
          publishedAt: "2026-06-30T00:00:00.000Z",
          seo: {
            title: "Proof Sealed Beans",
            description: "Proof story",
            canonicalPath: "/blog/proof-sealed-beans",
            keywords: [],
            socialImageUrl: null
          }
        },
        {
          id: "post-2",
          title: "Draft Post",
          slug: "/blog/draft-post",
          excerpt: "Hidden",
          body: "Hidden",
          authorName: "Boost",
          coverImageUrl: null,
          tags: [],
          featured: false,
          status: "draft" as const,
          publishedAt: "2026-06-30T00:00:00.000Z",
          seo: {
            title: "Draft Post",
            description: "Hidden",
            canonicalPath: "/blog/draft-post",
            keywords: [],
            socialImageUrl: null
          }
        }
      ],
      pages: [
        {
          id: "about",
          title: "About",
          slug: "/about",
          visibleInNav: true,
          published: true,
          sections: []
        },
        {
          id: "secret",
          title: "Secret",
          slug: "/secret",
          visibleInNav: false,
          published: false,
          sections: []
        }
      ]
    };

    assert.equal(resolveBlogPostBySlug(state, "proof-sealed-beans")?.id, "post-1");
    assert.equal(resolveBlogPostBySlug(state, "draft-post"), null);
    assert.equal(resolvePageBySlug(state, "about")?.id, "about");
    assert.equal(resolvePageBySlug(state, "secret"), null);
  });

  it("resolves published pages by full dynamic route paths", () => {
    const state = {
      ...baseState(),
      pages: [
        {
          id: "company-about",
          title: "About Our Company",
          slug: "/company/about",
          visibleInNav: true,
          published: true,
          sections: [],
          seo: {
            title: "Company About",
            description: "About this store",
            canonicalPath: "/company/about",
            keywords: [],
            socialImageUrl: null
          }
        },
        {
          id: "wrong-path",
          title: "Wrong Path",
          slug: "/about",
          visibleInNav: true,
          published: true,
          sections: []
        }
      ]
    };

    assert.equal(resolvePageBySlug(state, "/company/about")?.id, "company-about");
    assert.equal(resolvePageBySlug(state, "company/about")?.id, "company-about");
    assert.equal(resolvePageBySlug(state, "/company/missing"), null);
  });
});
