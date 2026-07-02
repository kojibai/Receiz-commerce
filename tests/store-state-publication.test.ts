import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreStateRecord } from "../src/lib/receiz/proof-state.js";
import {
  publishAndAdmitReceizStoreState,
  receizStoreStateSyncCompleted,
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
  it("admits locally and still attempts public-store sync without delegated transport", async () => {
    const record = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      ...receizAppendFixture("2026-07-01T20:00:00.000Z")
    });
    const { admitted, store } = proofStoreSpy();
    let observedAccessToken: string | undefined = "not-called";
    let observedRecordId = "";

    const result = await publishAndAdmitReceizStoreState({
      accessToken: undefined,
      record,
      proofStore: store,
      publish: async (accessToken, publishedRecord) => {
        observedAccessToken = accessToken;
        observedRecordId = publishedRecord.id;
        return { ok: true, publicStore: [{ ok: true }] };
      }
    });

    assert.equal(receizStoreStateWriteSucceeded(result), true);
    assert.equal(receizStoreStateSyncCompleted(result), true);
    assert.deepEqual(admitted, [record.id]);
    assert.equal(observedAccessToken, undefined);
    assert.equal(observedRecordId, record.id);
  });

  it("passes the verified proof object to the public-store publish rail", async () => {
    const record = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      ...receizAppendFixture("2026-07-01T20:00:15.000Z")
    });
    const { admitted, store } = proofStoreSpy();
    const keyFile = { schema: "receiz.key.v1", crypto: { publicKeyRawB64u: "public-key" } };
    let observedProof: unknown;

    const result = await publishAndAdmitReceizStoreState({
      accessToken: undefined,
      proof: { keyFile },
      record,
      proofStore: store,
      publish: async (_accessToken, _publishedRecord, proof) => {
        observedProof = proof;
        return {
          ok: true,
          publicStore: [
            {
              ok: true,
              knownHead: {
                afterKaiUpulse: "kai-1782936015000",
                appendAnchorId: "anchor-1782936015000"
              }
            }
          ]
        };
      }
    });

    assert.equal(receizStoreStateWriteSucceeded(result), true);
    assert.equal(receizStoreStateSyncCompleted(result), true);
    assert.deepEqual(admitted, [record.id]);
    assert.deepEqual(observedProof, { keyFile });
  });

  it("keeps local proof admission even when delegated remote sync reports a failure", async () => {
    const record = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      ...receizAppendFixture("2026-07-01T20:00:30.000Z")
    });
    const { admitted, store } = proofStoreSpy();

    const result = await publishAndAdmitReceizStoreState({
      accessToken: "receiz_write_rail",
      record,
      proofStore: store,
      publish: async () => ({ ok: false, error: "remote_sync_failed" })
    });

    assert.equal(receizStoreStateWriteSucceeded(result), false);
    assert.equal(receizStoreStateSyncCompleted(result), false);
    assert.deepEqual(admitted, [record.id]);
  });

  it("admits the store-state record when delegated public-store publish succeeds", async () => {
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
    assert.equal(receizStoreStateSyncCompleted(result), true);
    assert.deepEqual(admitted, [record.id]);
  });
});
