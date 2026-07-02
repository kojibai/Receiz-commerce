import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreStateRecord } from "../src/lib/receiz/proof-state.js";
import {
  publishAndAdmitReceizStoreState,
  publicStorePublishInput,
  publicStoreSignedPublishInput,
  receizStoreStateSyncCompleted,
  receizStoreStateWriteSucceeded,
  summarizeReceizStoreStatePublicationResult,
  summarizeStoreStateRecord
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
  it("builds canonical SDK public-store input without duplicate state envelopes", () => {
    const record = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      ...receizAppendFixture("2026-07-01T19:59:00.000Z")
    });
    const input = publicStorePublishInput("boost.receiz.app", record);

    assert.equal(input.tenantHost, "boost.receiz.app");
    assert.equal(input.merchantReceizId, "boost.receiz.id");
    assert.deepEqual(input.state, record);
    assert.equal("record" in input, false);
    assert.equal("data" in input, false);
  });

  it("builds canonical SDK signed public-store input for proof-owned publish", () => {
    const record = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      ...receizAppendFixture("2026-07-01T19:59:30.000Z")
    });
    const keyFile = { schema: "receiz.key.v1", crypto: { publicKeyRawB64u: "public-key" } };
    const input = publicStoreSignedPublishInput("boost.receiz.app", record, { keyFile: keyFile as never });

    assert.equal(input.tenantHost, "boost.receiz.app");
    assert.equal(input.merchantReceizId, "boost.receiz.id");
    assert.deepEqual(input.storeStateRecord, record);
    assert.equal("state" in input, false);
    assert.equal("record" in input, false);
    assert.equal("data" in input, false);
  });

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

  it("summarizes store-state records without echoing inline media", () => {
    const largeInlineImage = `data:image/jpeg;base64,${"a".repeat(180_000)}`;
    const state = {
      ...baseState(),
      brand: {
        ...baseState().brand,
        logoImageUrl: largeInlineImage
      },
      products: baseState().products.map((product, index) => ({
        ...product,
        imageUrl: index === 0 ? largeInlineImage : product.imageUrl
      }))
    };
    const record = buildStoreStateRecord(state, {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      ...receizAppendFixture("2026-07-01T20:01:30.000Z")
    });
    const summary = summarizeStoreStateRecord(record);
    const serialized = JSON.stringify(summary);

    assert.equal(summary.id, record.id);
    assert.equal(summary.tenantHost, "boost.receiz.app");
    assert.equal(summary.merchantReceizId, "boost.receiz.id");
    assert.equal("state" in summary, false);
    assert.equal(serialized.includes("data:image"), false);
    assert.ok(serialized.length < 1_200);
  });

  it("summarizes Receiz publication results without duplicating heavy state envelopes", () => {
    const largeInlineImage = `data:image/jpeg;base64,${"b".repeat(220_000)}`;
    const state = {
      ...baseState(),
      brand: {
        ...baseState().brand,
        logoImageUrl: largeInlineImage
      },
      products: baseState().products.map((product) => ({
        ...product,
        imageUrl: largeInlineImage
      }))
    };
    const record = buildStoreStateRecord(state, {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      ...receizAppendFixture("2026-07-01T20:02:00.000Z")
    });
    const summary = summarizeReceizStoreStatePublicationResult({
      ok: false,
      error: "Payload Too Large",
      publicStore: [
        {
          ok: false,
          error: "Payload Too Large",
          tenantHost: record.tenantHost,
          storeStateRecord: record,
          state: record
        }
      ],
      appState: [
        {
          ok: false,
          error: "Payload Too Large",
          state: record
        }
      ],
      connect: {
        ok: true,
        storeStateRecord: record
      }
    });
    const serialized = JSON.stringify(summary);

    assert.equal(serialized.includes("data:image"), false);
    assert.equal(serialized.includes("storeStateRecord"), false);
    assert.equal(serialized.includes("\"state\""), false);
    assert.ok(serialized.length < 1_200);
  });
});
