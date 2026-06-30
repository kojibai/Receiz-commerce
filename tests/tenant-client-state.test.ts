import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hostContextFromHost } from "../src/lib/hosting/host-context.js";
import { selectClientInitialState } from "../src/lib/storage/client-state.js";
import { baseState } from "./support/commerce-state.js";

describe("client initial commerce state", () => {
  it("keeps server-published tenant state instead of stale browser storage", () => {
    const publishedTenant = {
      ...baseState(),
      brand: {
        ...baseState().brand,
        name: "Bjklock Supply",
        logoText: "bjk",
        primaryColor: "#008f7a"
      },
      storefront: {
        ...baseState().storefront,
        headline: "Bjklock proof shop",
        heroBody: "This is the saved storefront."
      },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app"
      }
    };
    const staleTenantStorage = {
      ...baseState(),
      brand: {
        ...baseState().brand,
        name: "Bjklock",
        logoText: "bjklock",
        primaryColor: "#ff486e"
      },
      storefront: {
        ...baseState().storefront,
        headline: "Store",
        heroBody: "Collect beans. Unlock more."
      }
    };

    const state = selectClientInitialState(hostContextFromHost("bjklock.localhost:3001"), publishedTenant, {
      scoped: JSON.stringify(staleTenantStorage),
      base: JSON.stringify(baseState())
    });

    assert.equal(state.brand.name, "Bjklock Supply");
    assert.equal(state.brand.primaryColor, "#008f7a");
    assert.equal(state.storefront.headline, "Bjklock proof shop");
    assert.equal(state.storefront.heroBody, "This is the saved storefront.");
  });

  it("still hydrates platform admin from platform browser storage", () => {
    const storedWorkspace = {
      ...baseState(),
      brand: {
        ...baseState().brand,
        name: "Stored Admin Brand"
      }
    };

    const state = selectClientInitialState(hostContextFromHost("receiz.app"), baseState(), {
      scoped: JSON.stringify(storedWorkspace),
      base: null
    });

    assert.equal(state.brand.name, "Stored Admin Brand");
  });
});
