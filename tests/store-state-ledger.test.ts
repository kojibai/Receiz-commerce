import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreStateConnectRecord, buildStoreStateRecord } from "../src/lib/receiz/proof-state.js";
import { createInMemoryProofStateStore } from "../src/lib/receiz/proof-state-store.js";
import { admitRecoveredStoreStateRecords, extractStoreStateRecords } from "../src/lib/receiz/store-state-ledger.js";
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

  it("admits newer recovered records when an older tenant record is already warm", async () => {
    const tenantHost = "bjklock.receiz.app";
    const store = await createInMemoryProofStateStore("bjklock.receiz.id");
    const oldState = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Bjklock" },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: tenantHost
      },
      products: [
        {
          ...baseState().products[0],
          id: "old-product",
          name: "Signature item"
        }
      ]
    };
    const newState = {
      ...oldState,
      brand: { ...oldState.brand, name: "BJ Klock" },
      products: [
        {
          ...oldState.products[0],
          id: "new-product",
          name: "New product"
        }
      ],
      blogPosts: [
        {
          ...oldState.blogPosts[0],
          id: "new-story",
          title: "New story"
        }
      ]
    };
    const oldRecord = buildStoreStateRecord(oldState, {
      actorReceizId: "bjklock.receiz.id",
      tenantHost,
      recordedAt: "2026-06-30T12:00:00.000Z"
    });
    const newRecord = buildStoreStateRecord(newState, {
      actorReceizId: "bjklock.receiz.id",
      tenantHost,
      recordedAt: "2026-06-30T16:00:00.000Z"
    });

    await store.admitStoreRecord(oldRecord);
    const result = await admitRecoveredStoreStateRecords(store, tenantHost, [oldRecord, newRecord]);
    const projected = store.projectHost(baseState(), tenantHost);

    assert.equal(result.admitted, 1);
    assert.equal(result.recovered, 2);
    assert.equal(projected.brand.name, "BJ Klock");
    assert.equal(projected.products[0]?.name, "New product");
    assert.equal(projected.blogPosts[0]?.title, "New story");
  });
});
