import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initialWildsWorldProjection } from "../src/features/play/wilds-world-state.js";
import {
  acceptWildsWorldSnapshot,
  buildWildsWorldCommandBody,
  parseWildsWorldSnapshotResponse
} from "../src/features/play/use-wilds-world.js";

describe("Wilds world client contract", () => {
  it("never rolls a client back to an older canonical revision", () => {
    const current = { ...initialWildsWorldProjection(), revision: 8 };
    const stale = { ...initialWildsWorldProjection(), revision: 7 };
    const fresh = { ...initialWildsWorldProjection(), revision: 9 };

    assert.equal(acceptWildsWorldSnapshot(current, stale), current);
    assert.equal(acceptWildsWorldSnapshot(current, fresh), fresh);
  });

  it("builds one explicit guest-aware command envelope", () => {
    assert.deepEqual(buildWildsWorldCommandBody("guest-12345678", { type: "raid.join", bossId: "boss:one", commandId: "command:one" }), {
      guestId: "guest-12345678",
      command: { type: "raid.join", bossId: "boss:one", commandId: "command:one" }
    });
  });

  it("sends sealed card material only for semantic raid actions", () => {
    const card = { id: "card:one", proof: { digest: `sha256:${"a".repeat(64)}` } } as never;
    assert.deepEqual(buildWildsWorldCommandBody("guest-12345678", { type: "raid.act", bossId: "boss:one", roundId: "round:one", intent: "strike", commandId: "command:act" }, card), {
      guestId: "guest-12345678",
      command: { type: "raid.act", bossId: "boss:one", roundId: "round:one", intent: "strike", commandId: "command:act" },
      card
    });
  });

  it("rejects malformed snapshot responses", () => {
    assert.throws(() => parseWildsWorldSnapshotResponse({ ok: true, projection: { revision: 1 } }), /wilds_world_snapshot_invalid/);
    const projection = initialWildsWorldProjection();
    assert.equal(parseWildsWorldSnapshotResponse({ ok: true, projection }), projection);
  });
});
