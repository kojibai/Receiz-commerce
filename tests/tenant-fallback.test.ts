import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hostContextFromHost } from "../src/lib/hosting/host-context.js";
import { tenantFallbackState } from "../src/lib/hosting/tenant-state.js";
import { baseState } from "./support/commerce-state.js";

describe("tenant fallback state", () => {
  it("does not show the platform default brand on a subdomain without a published record", () => {
    const state = tenantFallbackState(baseState(), hostContextFromHost("bjklock.localhost:3001"));

    assert.equal(state.brand.name, "Bjklock");
    assert.equal(state.hosting.subdomain, "bjklock.receiz.app");
    assert.equal(state.auth.signedInAs, "customer");
  });

  it("does not show the platform default brand on a custom domain without a published record", () => {
    const state = tenantFallbackState(baseState(), hostContextFromHost("shop.example.com"));

    assert.equal(state.brand.name, "Shop");
    assert.equal(state.hosting.customDomain.domain, "shop.example.com");
    assert.equal(state.auth.signedInAs, "customer");
  });
});
