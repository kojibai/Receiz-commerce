import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  customDomainStatusFromVercel,
  dnsInstructionsForDomain
} from "../src/lib/hosting/vercel-domains.js";

describe("Vercel domain DNS guidance", () => {
  it("uses the branded Receiz CNAME target for merchant custom domains", () => {
    assert.deepEqual(dnsInstructionsForDomain("shop.bjk.ceo"), [
      "Point shop.bjk.ceo CNAME to custom.receiz.app"
    ]);
  });

  it("exposes copyable DNS record rows for the domain UI", () => {
    const status = customDomainStatusFromVercel(
      "shop.bjk.ceo",
      { name: "shop.bjk.ceo", verified: false },
      { resolved: false, records: [], expectedRecords: ["custom.receiz.app"] }
    );

    assert.deepEqual(status.dnsRecords, [
      {
        type: "CNAME",
        host: "shop.bjk.ceo",
        value: "custom.receiz.app",
        label: "Point shop.bjk.ceo to custom.receiz.app"
      }
    ]);
  });
});
