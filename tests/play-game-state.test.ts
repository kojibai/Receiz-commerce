import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyWildsInput,
  canDiscover,
  initialPlayState,
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
});
