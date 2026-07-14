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
import { sealCollectedCard, verifyPortableCard } from "../src/features/play/portable-card.js";
import { nearbyHiddenHotspots } from "../src/features/play/hidden-hotspots.js";

describe("Receiz Wilds game state", () => {
  it("imports an offline-verified portable card once and makes its family playable", () => {
    const uploaded = sealCollectedCard({
      formId: "voltray-1",
      ownerReceizId: "returning.player.receiz.id",
      encounterId: "uploaded-card-1",
      capturedAt: "2026-07-13T16:00:00.000Z"
    });
    const imported = applyWildsInput(initialPlayState, { type: "import-card", asset: uploaded });
    const duplicate = applyWildsInput(imported, { type: "import-card", asset: uploaded });

    assert.equal(imported.inventory.some((asset) => asset.id === uploaded.id), true);
    assert.equal(imported.discoveredCardIds.includes("voltray"), true);
    assert.equal(imported.selectedCardId, "voltray");
    assert.equal(duplicate.inventory.length, imported.inventory.length);
  });

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
    assert.equal(next.inventory.length, state.inventory.length + 1);
    assert.equal(next.inventory.at(-1)?.manifest.formId, "voltray-1");
    assert.equal(verifyPortableCard(next.inventory.at(-1)!).ok, true);
    assert.equal(next.pendingSyncAssetIds.includes(next.inventory.at(-1)!.id), true);
  });

  it("captures and seals one portable card atomically for an encounter", () => {
    const nearby: PlayState = { ...initialPlayState, player: { x: 1.6, z: -2.1 } };
    const input = {
      type: "capture" as const,
      encounterId: "encounter-voltray-test",
      capturedAt: "2026-07-13T15:00:00.000Z",
      ownerReceizId: "player.receiz.id"
    };
    const once = applyWildsInput(nearby, input);
    const twice = applyWildsInput(once, input);

    assert.equal(once.inventory.length, initialPlayState.inventory.length + 1);
    assert.equal(twice.inventory.length, once.inventory.length);
    assert.equal(twice.inventory.at(-1)?.id, once.inventory.at(-1)?.id);
    assert.match(once.lastEvent, /sealed for offline use/i);
  });

  it("searches, emerges, seals, and reveals a hidden hotspot atomically", () => {
    const hotspot = nearbyHiddenHotspots(initialPlayState.player)[0]!;
    const searched = applyWildsInput(initialPlayState, {
      type: "search-point",
      x: hotspot.position.x,
      z: hotspot.position.z,
      searchedAt: "2026-07-13T15:00:00.000Z",
      ownerReceizId: "player.receiz.id"
    });

    assert.equal(searched.encounter.phase, "emerging");
    assert.equal(searched.inventory.length, initialPlayState.inventory.length);

    const capsule = applyWildsInput(searched, { type: "advance-encounter", at: "2026-07-13T15:00:01.000Z" });
    assert.equal(capsule.encounter.phase, "capsule");
    assert.equal(capsule.inventory.length, initialPlayState.inventory.length);

    const sealed = applyWildsInput(capsule, { type: "advance-encounter", at: "2026-07-13T15:00:02.000Z" });
    assert.equal(sealed.encounter.phase, "sealed");
    assert.equal(sealed.inventory.length, initialPlayState.inventory.length + 1);
    assert.equal(sealed.capturedHotspotIds.includes(hotspot.id), true);
    assert.equal(verifyPortableCard(sealed.inventory.at(-1)!).ok, true);

    const revealed = applyWildsInput(sealed, { type: "advance-encounter", at: "2026-07-13T15:00:03.000Z" });
    assert.equal(revealed.encounter.phase, "revealed");
    assert.equal(revealed.encounter.assetId, sealed.inventory.at(-1)!.id);

    const dismissed = applyWildsInput(revealed, { type: "dismiss-reveal" });
    const searchedAgain = applyWildsInput(dismissed, {
      type: "search-point",
      x: hotspot.position.x,
      z: hotspot.position.z,
      searchedAt: "2026-07-13T15:01:00.000Z",
      ownerReceizId: "player.receiz.id"
    });
    assert.equal(searchedAgain.encounter.phase, "hint");
    assert.equal(searchedAgain.inventory.length, sealed.inventory.length);
  });

  it("synchronizes a local card without minting another asset", () => {
    const nearby: PlayState = { ...initialPlayState, player: { x: 1.6, z: -2.1 } };
    const captured = applyWildsInput(nearby, {
      type: "capture",
      encounterId: "encounter-sync-test",
      capturedAt: "2026-07-13T15:00:00.000Z",
      ownerReceizId: "player.receiz.id"
    });
    const asset = captured.inventory.at(-1)!;
    const synced = applyWildsInput(captured, {
      type: "mark-synced",
      assetId: asset.id,
      synchronizedAt: "2026-07-13T15:01:00.000Z"
    });

    assert.equal(synced.inventory.length, captured.inventory.length);
    assert.equal(synced.inventory.at(-1)?.status, "verified");
    assert.equal(synced.pendingSyncAssetIds.includes(asset.id), false);

    const listed = applyWildsInput(synced, {
      type: "mark-listed",
      assetId: asset.id,
      synchronizedAt: "2026-07-13T15:02:00.000Z"
    });
    assert.equal(listed.inventory.at(-1)?.status, "listed");
  });

  it("evolves an eligible card and retains its earlier portable form", () => {
    const base = initialPlayState.inventory[0]!;
    const ready: PlayState = {
      ...initialPlayState,
      companionProgress: {
        ...initialPlayState.companionProgress,
        mintcub: { level: 10, xp: 0, bond: 100 }
      }
    };
    const evolved = applyWildsInput(ready, {
      type: "evolve",
      assetId: base.id,
      evolvedAt: "2026-07-14T15:00:00.000Z"
    });

    assert.equal(evolved.inventory.length, ready.inventory.length + 1);
    assert.equal(evolved.inventory.some((asset) => asset.id === base.id), true);
    assert.equal(evolved.inventory.at(-1)?.manifest.formId, "mintcub-2");
    assert.equal(evolved.inventory.at(-1)?.manifest.lineage.previousAssetId, base.id);
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

  it("migrates a v2 discovery save into sealed portable inventory", () => {
    const legacy = JSON.stringify({
      schema: "receiz.wilds.save.v2",
      state: { ...initialPlayState, inventory: undefined, pendingSyncAssetIds: undefined, discoveredCardIds: ["mintcub", "voltray"] }
    });
    const restored = restorePlayState(legacy);

    assert.equal(restored.inventory.some((asset) => asset.manifest.formId === "mintcub-1"), true);
    assert.equal(restored.inventory.some((asset) => asset.manifest.formId === "voltray-1"), true);
    assert.equal(restored.inventory.every((asset) => verifyPortableCard(asset).ok), true);
  });

  it("supports continuous analog travel across a billion-unit world", () => {
    const moved = applyWildsInput(initialPlayState, { type: "move-vector", x: 0.8, z: -0.6 });
    const edgeState: PlayState = {
      ...initialPlayState,
      player: { x: 499_999_999.9, z: -499_999_999.9 }
    };
    const clamped = applyWildsInput(edgeState, { type: "move-vector", x: 1, z: -1 });

    assert.ok(moved.player.x > initialPlayState.player.x);
    assert.ok(moved.player.z < initialPlayState.player.z);
    assert.equal(clamped.player.x, 500_000_000);
    assert.equal(clamped.player.z, -500_000_000);
  });
});
