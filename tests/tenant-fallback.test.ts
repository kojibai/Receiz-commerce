import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hostContextFromHost } from "../src/lib/hosting/host-context.js";
import { tenantFallbackState } from "../src/lib/hosting/tenant-state.js";
import { resolvePageBySlug, resolveProductBySlug } from "../src/lib/storefront/content-routing.js";
import { baseState } from "./support/commerce-state.js";

describe("tenant fallback state", () => {
  it("does not show the platform default brand on a subdomain without a published record", () => {
    const state = tenantFallbackState(baseState(), hostContextFromHost("bjklock.localhost:3001"));

    assert.equal(state.brand.name, "Bjklock");
    assert.equal(state.hosting.subdomain, "bjklock.receiz.app");
    assert.equal(state.hosting.customDomain.domain, "");
    assert.equal(state.auth.signedInAs, "customer");
    assert.equal(state.auth.receizId.connected, false);
    assert.equal(state.auth.receizId.localProofVerified, false);
    assert.equal(JSON.stringify(state).includes("Boost"), false);
  });

  it("does not show the platform default brand on a custom domain without a published record", () => {
    const state = tenantFallbackState(baseState(), hostContextFromHost("shop.example.com"));

    assert.equal(state.brand.name, "Shop");
    assert.equal(state.hosting.customDomain.domain, "shop.example.com");
    assert.equal(state.auth.signedInAs, "customer");
    assert.equal(JSON.stringify(state).includes("Boost"), false);
  });

  it("rewrites stale template copy even when local tenant storage already matches the subdomain", () => {
    const staleTenant = {
      ...baseState(),
      brand: {
        ...baseState().brand,
        name: "Bjklock",
        logoText: "bjklock"
      },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app"
      }
    };
    const state = tenantFallbackState(staleTenant, hostContextFromHost("bjklock.localhost:3001"));

    assert.equal(state.brand.name, "Bjklock");
    assert.equal(JSON.stringify(state).includes("Boost"), false);
    assert.equal(state.auth.receizId.connected, false);
    assert.equal(state.auth.receizId.localProofVerified, false);
    assert.equal(state.hosting.customDomain.domain, "");
  });

  it("trusts a published tenant record even when unedited seed copy remains", () => {
    const publishedTenant = {
      ...baseState(),
      brand: {
        ...baseState().brand,
        name: "Bjklock Supply",
        logoText: "bjk"
      },
      storefront: {
        ...baseState().storefront,
        headline: "Bjklock proof shop",
        heroBody: "This is the real saved store."
      },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app",
        customDomain: {
          ...baseState().hosting.customDomain,
          domain: "shop.bjklock.com"
        }
      }
    };
    const state = tenantFallbackState(
      publishedTenant,
      hostContextFromHost("bjklock.localhost:3001"),
      { trustedPublishedState: true }
    );

    assert.equal(state.brand.name, "Bjklock Supply");
    assert.equal(state.storefront.headline, "Bjklock proof shop");
    assert.equal(state.storefront.heroBody, "This is the real saved store.");
    assert.equal(state.hosting.customDomain.domain, "shop.bjklock.com");
  });

  it("adds required system pages to trusted tenant state so direct page URLs do not fall through to Vercel 404", () => {
    const publishedTenant = {
      ...baseState(),
      pages: [],
      blogPosts: [],
      brand: {
        ...baseState().brand,
        name: "Bjklock Supply",
        logoText: "bjk"
      },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app"
      }
    };
    const state = tenantFallbackState(
      publishedTenant,
      hostContextFromHost("bjklock.receiz.app"),
      { trustedPublishedState: true }
    );

    assert.equal(resolvePageBySlug(state, "/about")?.slug, "/about");
    assert.equal(resolvePageBySlug(state, "/rewards")?.slug, "/rewards");
  });

  it("keeps product detail routes resolvable on fallback tenant storefronts", () => {
    const state = tenantFallbackState(baseState(), hostContextFromHost("bjklock.receiz.app"));

    assert.equal(resolveProductBySlug(state, "coffee-pack")?.id, "coffee-pack");
  });
});
