import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyWildsInput,
  canDiscover,
  initialPlayState,
  restorePlayState,
  serializePlayState,
  type PlayState
} from "../src/features/play/game-state";

describe("Receiz Wilds game state", () => {
  it("moves the player into range and collects a new companion card", () => {
    let state = initialPlayState;

    state = applyWildsInput(state, { type: "move", direction: "east" });
    state = applyWildsInput(state, { type: "move", direction: "east" });
    state = applyWildsInput(state, { type: "move", direction: "east" });
    state = applyWildsInput(state, { type: "move", direction: "north" });

    assert.equal(canDiscover(state), true);

    const next = applyWildsInput(state, { type: "discover" });

    assert.equal(next.discoveredCardIds.includes("voltray"), true);
    assert.equal(next.selectedCardId, "voltray");
    assert.equal(next.beans > state.beans, true);
    assert.match(next.lastEvent, /Voltray card collected/);
  });

  it("does not select cards the player has not collected", () => {
    const next = applyWildsInput(initialPlayState, { type: "select-card", cardId: "voltray" });

    assert.equal(next, initialPlayState);
  });

  it("turns mission completion into a portable merchant reward card", () => {
    const readyState: PlayState = {
      ...initialPlayState,
      completed: false,
      discoveredCardIds: ["mintcub", "voltray", "ledgerfox"],
      missionProgress: 91,
      rewardCards: [],
      selectedCardId: "voltray"
    };

    const next = applyWildsInput(readyState, { type: "mission" });

    assert.equal(next.completed, true);
    assert.equal(next.missionProgress, 100);
    assert.equal(next.rewardCards.length, 1);
    assert.match(next.rewardCards[0].businessUse, /coupon/);
  });

  it("levels and bonds the selected companion through deterministic training", () => {
    let state = initialPlayState;
    state = applyWildsInput(state, { type: "train" });
    state = applyWildsInput(state, { type: "train" });
    state = applyWildsInput(state, { type: "train" });

    assert.equal(state.companionProgress.mintcub.level, 2);
    assert.equal(state.companionProgress.mintcub.bond, 3);
    assert.match(state.lastEvent, /Level 2/);
  });

  it("blocks exhausted actions and lets the scout make camp to recover", () => {
    const exhausted = { ...initialPlayState, energy: 0 };
    const blocked = applyWildsInput(exhausted, { type: "mission" });
    const rested = applyWildsInput(blocked, { type: "rest" });

    assert.equal(blocked.missionProgress, exhausted.missionProgress);
    assert.match(blocked.lastEvent, /energy/i);
    assert.equal(rested.energy, 35);
    assert.equal(rested.combo, 0);
  });

  it("unlocks the Titan expedition from deck breadth and companion mastery", () => {
    const readyState: PlayState = {
      ...initialPlayState,
      discoveredCardIds: ["mintcub", "voltray", "ledgerfox"],
      companionProgress: {
        ...initialPlayState.companionProgress,
        mintcub: { level: 3, xp: 0, bond: 6 },
        voltray: { level: 1, xp: 0, bond: 0 },
        ledgerfox: { level: 1, xp: 0, bond: 0 }
      }
    };

    const next = applyWildsInput(readyState, { type: "mission" });
    assert.equal(next.bossUnlocked, true);
    assert.equal(next.worldRank, "Titan challenger");
  });

  it("round-trips versioned progression and rejects corrupted saves", () => {
    const trained = applyWildsInput(initialPlayState, { type: "train" });
    assert.deepEqual(restorePlayState(serializePlayState(trained)), trained);
    assert.deepEqual(restorePlayState("not-json"), initialPlayState);
  });
});
