import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolvePlatformConfiguration } from "../src/lib/platform-config";
import { isPlatformHost, subdomainForSlug, tenantSlugFromHost } from "../src/lib/hosting/domain-utils";

describe("fork platform configuration", () => {
  it("preserves the existing platform when no fork settings are supplied", () => {
    const config = resolvePlatformConfiguration();
    assert.equal(config.domain, "receiz.app");
    assert.equal(config.defaultSubdomain, "boost.receiz.app");
    assert.equal(config.productName, "Receiz.app Commerce Cloud");
  });

  it("keeps merchant URLs and platform routing on the fork's owned domain", () => {
    const config = resolvePlatformConfiguration({ name: "Independent Commerce", domain: "Commerce.Example", defaultSubdomain: "demo.commerce.example" });
    assert.equal(config.name, "Independent Commerce");
    assert.equal(config.domain, "commerce.example");
    assert.equal(config.defaultSubdomain, "demo.commerce.example");
    assert.equal(isPlatformHost("commerce.example", config.domain), true);
    assert.equal(isPlatformHost("receiz.app", config.domain), false);
    assert.equal(tenantSlugFromHost("seller.commerce.example", config.domain), "seller");
    assert.equal(tenantSlugFromHost("seller.receiz.app", config.domain), null);
    assert.equal(subdomainForSlug("seller", config.domain), "seller.commerce.example");
  });

  it("derives the demo tenant from the fork root and rejects another platform's default tenant", () => {
    assert.equal(resolvePlatformConfiguration({ domain: "commerce.example" }).defaultSubdomain, "boost.commerce.example");
    assert.throws(() => resolvePlatformConfiguration({ domain: "commerce.example", defaultSubdomain: "boost.receiz.app" }), /subdomain_mismatch/);
    assert.throws(() => resolvePlatformConfiguration({ domain: "commerce.example", defaultSubdomain: "nested.seller.commerce.example" }), /subdomain_mismatch/);
  });

  it("rejects URLs, credentials, ports and malformed platform domains", () => {
    for (const domain of ["https://commerce.example", "user@commerce.example", "commerce.example:3000", "commerce..example", "-commerce.example", "commerce.example/path"]) {
      assert.throws(() => resolvePlatformConfiguration({ domain }), /domain_invalid/);
    }
  });
});
