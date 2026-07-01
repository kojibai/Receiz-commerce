import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPublishedCommerceState } from "../src/lib/hosting/published-state.js";
import { baseState } from "./support/commerce-state.js";

describe("published commerce state", () => {
  it("preserves a locally verified custom domain when DNS propagation is proven", () => {
    const localState = {
      ...baseState(),
      hosting: {
        ...baseState().hosting,
        merchantReceizId: "boost.receiz.id",
        customDomain: {
          ...baseState().hosting.customDomain,
          domain: "shop.bjk.ceo",
          liveUrl: "https://shop.bjk.ceo",
          status: "active" as const,
          sslStatus: "valid" as const,
          verified: true,
          dnsResolved: true,
          message: "Domain verified and SSL ready",
          dnsInstructions: ["Point shop.bjk.ceo CNAME to custom.receiz.app"]
        }
      }
    };

    const published = buildPublishedCommerceState(
      baseState(),
      { hosting: { ...localState.hosting, published: true } },
      {
        displayName: "Bjklock",
        merchantReceizId: "bjklock.receiz.id"
      }
    );

    assert.equal(published.hosting.customDomain.domain, "shop.bjk.ceo");
    assert.equal(published.hosting.customDomain.status, "active");
    assert.equal(published.hosting.customDomain.sslStatus, "valid");
    assert.equal(published.hosting.liveUrl, "https://shop.bjk.ceo");
    assert.equal(published.hosting.merchantReceizId, "bjklock.receiz.id");
  });

  it("does not publish mock-connected custom domains as verified without DNS proof", () => {
    const localState = {
      ...baseState(),
      hosting: {
        ...baseState().hosting,
        merchantReceizId: "boost.receiz.id",
        customDomain: {
          ...baseState().hosting.customDomain,
          domain: "shop.bjk.ceo",
          liveUrl: "https://shop.bjk.ceo",
          status: "connected" as const,
          sslStatus: "valid" as const,
          verified: true,
          message: "Mock custom domain connected"
        }
      }
    };

    const published = buildPublishedCommerceState(
      baseState(),
      { hosting: { ...localState.hosting, published: true } },
      {
        displayName: "Bjklock",
        merchantReceizId: "bjklock.receiz.id"
      }
    );

    assert.equal(published.hosting.customDomain.domain, "shop.bjk.ceo");
    assert.equal(published.hosting.customDomain.status, "needs_dns");
    assert.equal(published.hosting.customDomain.sslStatus, "pending");
    assert.equal(published.hosting.customDomain.verified, false);
    assert.equal(published.hosting.customDomain.dnsResolved, false);
    assert.deepEqual(published.hosting.customDomain.dnsRecords, [
      {
        type: "CNAME",
        host: "shop.bjk.ceo",
        value: "custom.receiz.app",
        label: "Point shop.bjk.ceo to custom.receiz.app"
      }
    ]);
    assert.deepEqual(published.hosting.customDomain.dnsInstructions, [
      "Point shop.bjk.ceo CNAME to custom.receiz.app"
    ]);
    assert.equal(published.hosting.liveUrl, "https://bjklock.receiz.app");
  });
});
