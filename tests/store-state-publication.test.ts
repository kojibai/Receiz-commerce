import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreStateRecord } from "../src/lib/receiz/proof-state.js";
import {
  publishAndAdmitReceizStoreState,
  receizStoreStateWriteSucceeded
} from "../src/lib/receiz/store-state-publication.js";
import type { ProofStateStore } from "../src/lib/receiz/proof-state-store.js";
import { baseState } from "./support/commerce-state.js";
import { receizAppendFixture } from "./support/receiz-append.js";

function proofStoreSpy() {
  const admitted: string[] = [];
  return {
    admitted,
    store: {
      async admitStoreRecord(record) {
        admitted.push(record.id);
        return record;
      }
    } as ProofStateStore
  };
}

describe("Receiz store-state publication", () => {
  it("does not admit warm server state when durable public-store publish fails", async () => {
    const record = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      ...receizAppendFixture("2026-07-01T20:00:00.000Z")
    });
    const { admitted, store } = proofStoreSpy();

    const result = await publishAndAdmitReceizStoreState({
      accessToken: undefined,
      record,
      proofStore: store,
      publish: async () => ({ ok: false, error: "receiz_public_store_write_rail_missing" })
    });

    assert.equal(receizStoreStateWriteSucceeded(result), false);
    assert.deepEqual(admitted, []);
  });

  it("admits the store-state record only after durable public-store publish succeeds", async () => {
    const record = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      ...receizAppendFixture("2026-07-01T20:01:00.000Z")
    });
    const { admitted, store } = proofStoreSpy();

    const result = await publishAndAdmitReceizStoreState({
      accessToken: "receiz_write_rail",
      record,
      proofStore: store,
      publish: async () => ({ ok: true, publicStore: [{ ok: true }] })
    });

    assert.equal(receizStoreStateWriteSucceeded(result), true);
    assert.deepEqual(admitted, [record.id]);
  });
});
