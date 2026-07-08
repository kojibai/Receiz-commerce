import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreStateConnectRecord, buildStoreStateRecord } from "../src/lib/receiz/proof-state.js";
import { createInMemoryProofStateStore } from "../src/lib/receiz/proof-state-store.js";
import {
  admitRecoveredStoreStateRecords,
  extractStoreStateRecords,
  recoverReceizPublicProofStoreStateRecords
} from "../src/lib/receiz/store-state-ledger.js";
import { baseState } from "./support/commerce-state.js";
import { receizAppendFixture } from "./support/receiz-append.js";

describe("Receiz store-state ledger recovery", () => {
  it("does not recover storefront content from auxiliary connect pointers", () => {
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
      ...receizAppendFixture("2026-06-30T12:00:00.000Z")
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

    assert.equal(records.length, 0);
  });

  it("extracts published store records from public proof registry records", () => {
    const state = {
      ...baseState(),
      brand: { ...baseState().brand, name: "BJ Klock" },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app",
        customDomain: {
          ...baseState().hosting.customDomain,
          domain: ""
        }
      },
      products: [{ ...baseState().products[0], id: "new-product", name: "New product" }]
    };
    const record = buildStoreStateRecord(state, {
      actorReceizId: "bjklock.receiz.id",
      tenantHost: "bjklock.receiz.app",
      ...receizAppendFixture("2026-06-30T16:00:00.000Z")
    });
    const publicProof = {
      ok: true,
      sourceUrl: "https://bjklock.receiz.app",
      record: {
        schema: "receiz.app.public_store_state_projection.v1",
        data: {
          storeStateRecord: record
        }
      }
    };

    const records = extractStoreStateRecords(publicProof);

    assert.equal(records.length, 1);
    assert.equal(records[0]?.state.brand.name, "BJ Klock");
    assert.equal(records[0]?.state.products[0]?.name, "New product");
  });

  it("extracts published store records from app-state URL responses", () => {
    const state = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Proof Coffee" },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "proof-coffee",
        subdomain: "proof-coffee.receiz.app"
      },
      products: [{ ...baseState().products[0], id: "roast", name: "House roast" }]
    };
    const record = buildStoreStateRecord(state, {
      actorReceizId: "proof-coffee.receiz.id",
      tenantHost: "proof-coffee.receiz.app",
      ...receizAppendFixture("2026-06-30T17:00:00.000Z")
    });
    const response = {
      ok: true,
      record: {
        sourceUrl: "https://proof-coffee.receiz.app/",
        schema: "receiz.app.public_store_state_projection.v1",
        data: {
          storeStateRecord: record
        }
      }
    };

    const records = extractStoreStateRecords(response);

    assert.equal(records.length, 1);
    assert.equal(records[0]?.state.brand.name, "Proof Coffee");
    assert.equal(records[0]?.state.products[0]?.name, "House roast");
  });

  it("recovers cold-start storefront state through the SDK public-store latest rail", async () => {
    const state = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Cold Start Store" },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "cold-start",
        subdomain: "cold-start.receiz.app"
      }
    };
    const record = buildStoreStateRecord(state, {
      actorReceizId: "cold-start.receiz.id",
      tenantHost: "cold-start.receiz.app",
      ...receizAppendFixture("2026-07-01T18:00:00.000Z")
    });
    const calls: string[] = [];
    const records = await recoverReceizPublicProofStoreStateRecords("cold-start.receiz.app", {
      restoreLatestPublicStore: async (input: { host?: string; requiredSchema?: string }) => {
        calls.push(`restoreLatest:${input.host}:${input.requiredSchema}`);
        return { ok: true, storeStateRecord: record };
      },
      resolvePublicStore: async () => {
        calls.push("resolve");
        return { ok: false };
      },
      readAppStateByUrl: async () => {
        calls.push("byUrl");
        return { ok: false };
      },
      resolveTenant: async () => {
        calls.push("resolveTenant");
        return { ok: false };
      }
    });

    assert.equal(records.length, 1);
    assert.equal(records[0]?.state.brand.name, "Cold Start Store");
    assert.equal(calls[0], "restoreLatest:cold-start.receiz.app:receiz.app.store_state.v1");
  });

  it("bounds public proof recovery when a Receiz rail hangs", async () => {
    const previousTimeout = process.env.RECEIZ_STORE_STATE_RECOVERY_TIMEOUT_MS;
    const previousWarn = console.warn;
    process.env.RECEIZ_STORE_STATE_RECOVERY_TIMEOUT_MS = "20";
    console.warn = () => {};
    const calls: string[] = [];

    try {
      const recovery = recoverReceizPublicProofStoreStateRecords("hung.receiz.app", {
        restoreLatestPublicStore: async () => {
          calls.push("restoreLatest");
          return await new Promise<never>(() => {});
        },
        resolvePublicStore: async () => {
          calls.push("resolve");
          return { ok: false };
        },
        readAppStateByUrl: async (url: string) => {
          calls.push(`byUrl:${url}`);
          return { ok: false };
        },
        resolveTenant: async () => {
          calls.push("resolveTenant");
          return { ok: false };
        }
      });
      const result = await Promise.race([
        recovery,
        new Promise<"hung">((resolve) => setTimeout(() => resolve("hung"), 100))
      ]);

      assert.notEqual(result, "hung");
      assert.deepEqual(result, []);
      assert.equal(calls.includes("resolve"), true);
    } finally {
      if (previousTimeout === undefined) {
        delete process.env.RECEIZ_STORE_STATE_RECOVERY_TIMEOUT_MS;
      } else {
        process.env.RECEIZ_STORE_STATE_RECOVERY_TIMEOUT_MS = previousTimeout;
      }
      console.warn = previousWarn;
    }
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
      ...receizAppendFixture("2026-06-30T12:00:00.000Z")
    });
    const newRecord = buildStoreStateRecord(newState, {
      actorReceizId: "bjklock.receiz.id",
      tenantHost,
      ...receizAppendFixture("2026-06-30T16:00:00.000Z")
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
