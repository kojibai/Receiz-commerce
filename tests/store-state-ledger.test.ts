import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreStateConnectRecord, buildStoreStateRecord } from "../src/lib/receiz/proof-state.js";
import { extractStoreStateRecords } from "../src/lib/receiz/store-state-ledger.js";
import { baseState } from "./support/commerce-state.js";

describe("Receiz store-state ledger recovery", () => {
  it("extracts published store records from nested ledger event payloads", () => {
    const state = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Bjklock Supply" },
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
    const record = buildStoreStateRecord(state, {
      actorReceizId: "bjklock.receiz.id",
      tenantHost: "shop.bjklock.com",
      recordedAt: "2026-06-30T12:00:00.000Z"
    });

    const ledger = {
      ok: true,
      events: [
        {
          id: "event-1",
          type: "connect.record",
          data: buildStoreStateConnectRecord(record)
        }
      ]
    };

    const records = extractStoreStateRecords(ledger);

    assert.equal(records.length, 1);
    assert.equal(records[0]?.state.brand.name, "Bjklock Supply");
    assert.equal(records[0]?.state.hosting.subdomain, "bjklock.receiz.app");
    assert.equal(records[0]?.state.hosting.customDomain.domain, "shop.bjklock.com");
  });
});
