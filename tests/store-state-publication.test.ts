import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreStateRecord } from "../src/lib/receiz/proof-state.js";
import {
  buildStoreStatePublicStorePublications,
  extractReceizStoreAppendCoordinate
} from "../src/lib/receiz/store-state-publication.js";
import { baseState } from "./support/commerce-state.js";
import { receizAppendFixture } from "./support/receiz-append.js";

describe("Receiz store-state publication", () => {
  it("extracts the Kai pulse and anchor from a Receiz append response", () => {
    const coordinate = extractReceizStoreAppendCoordinate({
      ok: true,
      append: {
        id: "append_123",
        anchorId: "anchor_123",
        kaiUpulse: "123456.000001",
        recordedAt: "2026-07-01T20:30:00.000Z"
      }
    });

    assert.deepEqual(coordinate, {
      kaiUpulse: "123456.000001",
      anchorId: "anchor_123",
      recordedAt: "2026-07-01T20:30:00.000Z",
      proof: null
    });
  });

  it("extracts the Kai pulse and anchor from a nested proof bundle", () => {
    const coordinate = extractReceizStoreAppendCoordinate({
      ok: true,
      result: {
        proofBundle: {
          kind: "receiz.proof_bundle",
          kaiPulseEternal: "123457",
          kaiKlok: "123457",
          anchorId: "anchor_456",
          ts: "2026-07-01T20:31:00.000Z"
        }
      }
    });

    assert.equal(coordinate?.kaiUpulse, "123457");
    assert.equal(coordinate?.anchorId, "anchor_456");
    assert.equal(coordinate?.recordedAt, "2026-07-01T20:31:00.000Z");
    assert.equal(coordinate?.proof?.kind, "receiz.proof_bundle");
  });

  it("does not accept append responses without a Kai coordinate", () => {
    assert.equal(
      extractReceizStoreAppendCoordinate({
        ok: true,
        append: {
          id: "append_missing_kai",
          anchorId: "anchor_missing_kai",
          recordedAt: "2026-07-01T20:32:00.000Z"
        }
      }),
      null
    );
  });

  it("publishes every tenant host with the baseline durable projection key", () => {
    const state = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Limited Drop With" },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app",
        merchantReceizId: "bjklock.receiz.id",
        customDomain: {
          ...baseState().hosting.customDomain,
          domain: "shop.bjk.ceo"
        }
      }
    };
    const record = buildStoreStateRecord(state, {
      actorReceizId: "bjklock.receiz.id",
      tenantHost: "shop.bjk.ceo",
      reason: "publish",
      ...receizAppendFixture("2026-06-30T00:00:00.000Z", "777")
    });

    const publications = buildStoreStatePublicStorePublications(record);
    const byHost = new Map(publications.map((publication) => [publication.host, publication]));

    assert.deepEqual([...byHost.keys()].sort(), ["bjklock.receiz.app", "shop.bjk.ceo"]);
    assert.equal(byHost.get("bjklock.receiz.app")?.payload.id, "store_state:bjklock.receiz.app");
    assert.equal(byHost.get("shop.bjk.ceo")?.payload.id, "store_state:shop.bjk.ceo");
    assert.equal(
      byHost.get("shop.bjk.ceo")?.options.idempotencyKey,
      `store-state:${record.id}:shop.bjk.ceo`
    );
    assert.deepEqual(byHost.get("shop.bjk.ceo")?.payload.data.storeStateRecord, record);
  });
});
