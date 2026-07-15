import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  admitActivityCard,
  advanceActivity,
  createLandmarkSession,
  exitActivity,
  grantActivityReward,
  resolveActivityResult
} from "../src/features/play/wilds-activity-core";
import { sealCollectedCard } from "../src/features/play/portable-card";
import { applyHearttreeIntent, createHearttreeTrial } from "../src/features/play/hearttree-trial";

const now = "2026-07-15T12:00:00.000Z";
const card = sealCollectedCard({
  capturedAt: now,
  encounterId: "landmark-card-1",
  formId: "mintcub-1",
  ownerReceizId: "player-1"
});

describe("Wilds landmark activity lifecycle", () => {
  it("admits one exact verified card and advances append-only", () => {
    const lobby = createLandmarkSession({
      actorIds: ["player-1"],
      createdAt: now,
      id: "session-1",
      landmarkId: "hearttree-sanctum",
      returnCoordinate: { x: 1, z: 2 }
    });
    const ready = admitActivityCard(lobby, "player-1", card, "admit-1");

    assert.equal(ready.phase, "ready");
    assert.equal(ready.admissions["player-1"]?.proofDigest, card.proof.digest);
    assert.equal(ready.revision, 1);
    assert.deepEqual(admitActivityCard(lobby, "player-1", card, "admit-1"), ready);

    const altered = structuredClone(card);
    altered.manifest.name = "Altered";
    assert.throws(() => admitActivityCard(lobby, "player-1", altered, "admit-2"), /verification/);
    assert.throws(() => admitActivityCard(lobby, "stranger", card, "admit-3"), /actor/);
  });

  it("locks results, grants one reward, and preserves the return coordinate", () => {
    const lobby = createLandmarkSession({
      actorIds: ["player-1"], createdAt: now, id: "session-2",
      landmarkId: "hearttree-sanctum", returnCoordinate: { x: 7, z: -4 }
    });
    const active = advanceActivity(admitActivityCard(lobby, "player-1", card, "admit"), "player-1", "start");
    const result = resolveActivityResult(active, { digest: `sha256:${"b".repeat(64)}`, score: 840, winnerActorId: "player-1" }, "result");
    const rewarded = grantActivityReward(result, { id: "hearttree-awakened", kind: "achievement" }, "reward");

    assert.equal(rewarded.phase, "reward");
    assert.equal(rewarded.reward?.id, "hearttree-awakened");
    assert.throws(() => resolveActivityResult(result, { digest: `sha256:${"c".repeat(64)}`, score: 1 }, "changed"), /result_locked/);
    assert.throws(() => grantActivityReward(rewarded, { id: "other", kind: "cosmetic" }, "other-reward"), /reward_locked/);
    const exited = exitActivity(rewarded, "player-1", "exit");
    assert.equal(exited.phase, "exited");
    assert.deepEqual(exited.returnCoordinate, { x: 7, z: -4 });
  });

  it("replays a Hearttree trial and grants one bounded mastery reward", () => {
    const intents = ["pulse", "north", "guard", "ability:0"] as const;
    const first = intents.reduce(applyHearttreeIntent, createHearttreeTrial("hearttree-seed", card));
    const replay = intents.reduce(applyHearttreeIntent, createHearttreeTrial("hearttree-seed", card));

    assert.deepEqual(replay, first);
    assert.equal(first.phase, "result");
    assert.equal(first.reward?.kind, "achievement");
    assert.equal(new Set(first.events.map((event) => event.id)).size, first.events.length);
    assert.equal(first.admittedProofDigest, card.proof.digest);
  });
});
