import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPublishedCommerceState } from "../src/lib/hosting/published-state.js";
import { baseState } from "./support/commerce-state.js";

describe("published commerce state", () => {
  it("preserves a locally connected custom domain when Identity Seal owner data has no remote domain", () => {
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
          dnsInstructions: ["Point shop.bjk.ceo CNAME to cname.vercel-dns-0.com"]
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
});
