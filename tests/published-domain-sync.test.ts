import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPublishedStateForHostingSync } from "../src/lib/hosting/published-domain-sync.js";
import { baseState } from "./support/commerce-state.js";

describe("published domain sync", () => {
  it("keeps the saved storefront and subdomain when a custom domain becomes live", () => {
    const submitted = {
      ...baseState(),
      brand: {
        ...baseState().brand,
        name: "Limited Drop With",
        logoText: "bjklock"
      },
      storefront: {
        ...baseState().storefront,
        headline: "Limited Drop With",
        heroBody: "A limited drop brand with early access passes"
      },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app",
        merchantReceizId: "bjklock.receiz.id",
        published: true
      }
    };
    const state = buildPublishedStateForHostingSync(
      baseState(),
      submitted,
      {
        ...submitted.hosting,
        customDomain: {
          ...submitted.hosting.customDomain,
          domain: "shop.bjk.ceo",
          liveUrl: "https://shop.bjk.ceo",
          status: "active",
          sslStatus: "valid",
          verified: true,
          dnsResolved: true,
          message: "Domain verified and SSL ready"
        }
      },
      {
        displayName: "BJ Klock",
        merchantReceizId: "bjklock.receiz.id"
      }
    );

    assert.ok(state);
    assert.equal(state.brand.name, "Limited Drop With");
    assert.equal(state.storefront.headline, "Limited Drop With");
    assert.equal(state.storefront.heroBody, "A limited drop brand with early access passes");
    assert.equal(state.hosting.tenantSlug, "bjklock");
    assert.equal(state.hosting.subdomain, "bjklock.receiz.app");
    assert.equal(state.hosting.customDomain.domain, "shop.bjk.ceo");
    assert.equal(state.hosting.liveUrl, "https://shop.bjk.ceo");
  });

  it("does not public-sync an unpublished workspace just because DNS was connected", () => {
    const submitted = {
      ...baseState(),
      hosting: {
        ...baseState().hosting,
        published: false
      }
    };

    assert.equal(buildPublishedStateForHostingSync(baseState(), submitted, submitted.hosting), null);
  });
});
