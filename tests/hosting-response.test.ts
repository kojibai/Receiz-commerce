import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeCustomDomainHostingResponse } from "../src/lib/storage/hosting-response.js";
import { baseState } from "./support/commerce-state.js";

describe("hosting API response merge", () => {
  it("keeps the claimed subdomain when a custom-domain response comes from the server hosting singleton", () => {
    const currentHosting = {
      ...baseState().hosting,
      tenantSlug: "bjklock",
      subdomain: "bjklock.receiz.app",
      liveUrl: "https://bjklock.receiz.app",
      subdomainStatus: {
        ...baseState().hosting.subdomainStatus,
        domain: "bjklock.receiz.app",
        liveUrl: "https://bjklock.receiz.app"
      }
    };
    const serverHosting = {
      ...baseState().hosting,
      tenantSlug: "boost",
      subdomain: "boost.receiz.app",
      liveUrl: "https://shop.bjklock.com",
      customDomain: {
        ...baseState().hosting.customDomain,
        domain: "shop.bjklock.com",
        liveUrl: "https://shop.bjklock.com",
        status: "active" as const,
        sslStatus: "valid" as const,
        verified: true,
        dnsResolved: true,
        message: "Domain verified, DNS propagated, and SSL ready"
      }
    };

    const merged = mergeCustomDomainHostingResponse(currentHosting, serverHosting);

    assert.equal(merged.tenantSlug, "bjklock");
    assert.equal(merged.subdomain, "bjklock.receiz.app");
    assert.equal(merged.subdomainStatus.domain, "bjklock.receiz.app");
    assert.equal(merged.customDomain.domain, "shop.bjklock.com");
    assert.equal(merged.customDomain.status, "active");
    assert.equal(merged.liveUrl, "https://shop.bjklock.com");
  });
});
