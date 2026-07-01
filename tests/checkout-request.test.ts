import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutTenantHost } from "../src/lib/checkout/checkout-request.js";
import { baseState } from "./support/commerce-state.js";

describe("checkout request helpers", () => {
  it("uses the custom domain as the tenant host when a merchant store has one", () => {
    const state = {
      ...baseState(),
      hosting: {
        ...baseState().hosting,
        subdomain: "bjklock.receiz.app",
        customDomain: {
          ...baseState().hosting.customDomain,
          domain: "shop.bjk.ceo",
          liveUrl: "https://shop.bjk.ceo",
          status: "active" as const,
          sslStatus: "valid" as const,
          verified: true
        }
      }
    };

    assert.equal(checkoutTenantHost(state), "shop.bjk.ceo");
  });

  it("falls back to the hosted subdomain when no custom domain is connected", () => {
    assert.equal(checkoutTenantHost(baseState()), baseState().hosting.subdomain);
  });
});
