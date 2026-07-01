import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hostContextFromHost } from "../src/lib/hosting/host-context.js";
import { shouldHydratePlatformMerchantRoute } from "../src/lib/storefront/platform-merchant-route.js";

describe("platform merchant route fallback", () => {
  it("hydrates logged-in merchant workspace routes on receiz.app instead of returning Vercel 404", () => {
    assert.equal(shouldHydratePlatformMerchantRoute(hostContextFromHost("receiz.app"), false), true);
    assert.equal(shouldHydratePlatformMerchantRoute(hostContextFromHost("receiz.app"), true), true);
  });

  it("keeps tenant subdomains and custom domains bound to published proof resolution", () => {
    assert.equal(shouldHydratePlatformMerchantRoute(hostContextFromHost("bjklock.receiz.app"), false), false);
    assert.equal(shouldHydratePlatformMerchantRoute(hostContextFromHost("shop.bjklock.com"), false), false);
  });
});
