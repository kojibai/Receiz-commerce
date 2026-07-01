import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractReceizStoreAppendCoordinate } from "../src/lib/receiz/store-state-publication.js";

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
});
