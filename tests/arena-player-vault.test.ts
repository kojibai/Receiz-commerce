import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { emptyAdventureCondition } from "../src/features/play/adventure/card-condition.js";
import { generateArenaPath } from "../src/features/play/arena/campaign.js";
import { projectArenaFighter } from "../src/features/play/arena/card-fighter.js";
import { createArenaDeviceIdentity, MemoryArenaKeyStore, signArenaPendingReceipt } from "../src/features/play/arena/device-signature.js";
import { sealArenaReceipt } from "../src/features/play/arena/receipt.js";
import { createArenaTranscript } from "../src/features/play/arena/transcript.js";
import {
  applyWildsInput,
  canUseWildsAsset,
  initialPlayState,
  playableInventory,
  restorePlayState,
  selectedAsset,
  serializePlayState,
  type WildsAssetUse,
} from "../src/features/play/game-state.js";
import { embedPortableVaultInPng, verifyPortableVaultPng } from "../src/features/play/card-export.js";
import { createWildsPlayerVault, reconcileWildsPlayerVault, verifyWildsPlayerVault } from "../src/features/play/wilds-player-vault.js";
import { initialWildsWorldProjection } from "../src/features/play/wilds-world-state.js";
import { arenaFixtureRevision, arenaFixtureTerminal } from "./support/arena-fixtures.js";

const sourcePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

async function arenaState() {
  const card = initialPlayState.inventory[0]!;
  const revision = arenaFixtureRevision(card);
  const path = generateArenaPath({ seed: "portable-arena", playerId: "wilds.player.receiz.id", roster: [projectArenaFighter(card, revision)], completedEncounterIds: [] });
  const { definition, state: terminal } = arenaFixtureTerminal();
  const transcript = createArenaTranscript(definition, terminal);
  const priorConditions = Object.fromEntries(definition.teams.flatMap((team) => team.fighters.map((fighter) => [fighter.assetId, emptyAdventureCondition(fighter.assetId)])));
  const receipt = sealArenaReceipt({
    definition, transcript, priorConditions, encounterId: "arena:portable", checkpointId: "arena:checkpoint:portable",
    actorId: "wilds.player.receiz.id", authority: { kind: "offline-pending", deviceId: "device-portable" },
    publication: { state: "pending", revision: 0 }, createdAt: "2026-07-16T22:00:00.000Z",
  });
  const keys = new MemoryArenaKeyStore();
  const identity = await createArenaDeviceIdentity("device-portable", keys);
  const pending = await signArenaPendingReceipt(identity.id, {
    schema: "receiz.wilds.arena_pending_basis.v1", id: "pending:portable", actorId: "wilds.player.receiz.id",
    parentDigests: [revision.digest], payload: receipt,
  }, keys);
  return {
    ...initialPlayState,
    arenaPath: path,
    arenaLivingRevisions: { [card.id]: revision },
    arenaPendingReceiptTail: [pending],
    arenaReceiptTail: [receipt],
    arenaConflictTail: [{ eventId: "arena:conflict:1", digest: `sha256:${"c".repeat(64)}`, reason: "causal_parent_missing" as const }],
    arenaMemorials: [{ id: "arena:memorial:portable", assetId: card.id, matchId: "arena:match:portable", finalEventId: "arena:event:portable", epitaph: "The first path remains remembered.", honoredByTeamVictory: true }],
    arenaDeviceIdentities: [identity],
  };
}

function playerVault(playState: typeof initialPlayState) {
  return createWildsPlayerVault({
    playerId: "wilds.player.receiz.id", exportedAt: "2026-07-16T22:05:00.000Z", playState,
    settings: { avatarStyle: "female", movementMode: "run", audio: {} }, personalEvents: [],
    canonicalCursor: { worldId: "wilds:global:v3", revision: 0, eventId: null }, receipts: [],
  });
}

describe("portable Arena lives", () => {
  it("round-trips paths, revisions, pending receipts, receipts, conflicts, memorials, and identities through Save V10 and Vault V3 PNG", async () => {
    const state = await arenaState();
    const restored = restorePlayState(serializePlayState(state));
    const vault = playerVault(restored);
    const verified = verifyPortableVaultPng(embedPortableVaultInPng(sourcePng, state.inventory, vault));
    assert.equal(verified.ok, true);
    assert.equal(verified.player?.playState.arenaPath?.digest, state.arenaPath?.digest);
    assert.equal(verified.player?.playState.arenaLivingRevisions[state.inventory[0]!.id]?.digest, state.arenaLivingRevisions[state.inventory[0]!.id]?.digest);
    assert.deepEqual(verified.player?.playState.arenaPendingReceiptTail, state.arenaPendingReceiptTail);
    assert.deepEqual(verified.player?.playState.arenaReceiptTail, state.arenaReceiptTail);
    assert.deepEqual(verified.player?.playState.arenaConflictTail, state.arenaConflictTail);
    assert.deepEqual(verified.player?.playState.arenaMemorials, state.arenaMemorials);
    assert.deepEqual(verified.player?.playState.arenaDeviceIdentities, state.arenaDeviceIdentities);
  });

  it("defaults missing Arena fields, caps histories, and rejects Vault digest mutation", async () => {
    const envelope = JSON.parse(serializePlayState(initialPlayState));
    for (const key of ["arenaPath", "arenaLivingRevisions", "arenaPendingReceiptTail", "arenaReceiptTail", "arenaConflictTail", "arenaMemorials", "arenaDeviceIdentities"]) delete envelope.state[key];
    const legacy = restorePlayState(JSON.stringify(envelope));
    assert.equal(legacy.arenaPath, null);
    assert.deepEqual(legacy.arenaLivingRevisions, {});
    assert.deepEqual(legacy.arenaPendingReceiptTail, []);
    const state = await arenaState();
    const oversized = restorePlayState(serializePlayState({
      ...state,
      arenaPendingReceiptTail: Array.from({ length: 600 }, () => state.arenaPendingReceiptTail[0]!),
      arenaReceiptTail: Array.from({ length: 600 }, () => state.arenaReceiptTail[0]!),
      arenaConflictTail: Array.from({ length: 600 }, (_, index) => ({ eventId: `arena:conflict:${index}`, digest: `sha256:${index.toString(16).padStart(64, "0")}`, reason: "causal_parent_missing" as const })),
      arenaMemorials: Array.from({ length: 600 }, (_, index) => ({ ...state.arenaMemorials[0]!, id: `arena:memorial:${index}` })),
      arenaDeviceIdentities: Array.from({ length: 40 }, (_, index) => ({ ...state.arenaDeviceIdentities[0]!, id: `device-${index}` })),
    }));
    assert.equal(oversized.arenaPendingReceiptTail.length, 512);
    assert.equal(oversized.arenaReceiptTail.length, 512);
    assert.equal(oversized.arenaConflictTail.length, 512);
    assert.equal(oversized.arenaMemorials.length, 512);
    assert.equal(oversized.arenaDeviceIdentities.length, 32);
    const vault = playerVault(state);
    const tampered = { ...vault, playState: { ...vault.playState, arenaMemorials: [{ ...vault.playState.arenaMemorials[0]!, epitaph: "rewritten" }] } };
    assert.equal(verifyWildsPlayerVault(tampered).ok, false);
  });

  it("keeps retired cards visible but excludes them from every active purpose", () => {
    const asset = initialPlayState.inventory[0]!;
    const retired = {
      ...initialPlayState,
      adventureConditions: {
        ...initialPlayState.adventureConditions,
        [asset.id]: { ...initialPlayState.adventureConditions[asset.id]!, life: "dead" as const, retiredAt: "2026-07-16T22:00:00.000Z", retirementCauseEventId: "arena:event:final" },
      },
    };
    const purposes: WildsAssetUse[] = ["battle", "squad", "training", "growth", "fusion", "listing", "staking", "crafting", "active"];
    assert.equal(retired.inventory.some((item) => item.id === asset.id), true);
    assert.equal(purposes.every((purpose) => !canUseWildsAsset(retired, asset.id, purpose)), true);
    assert.deepEqual(playableInventory(retired), []);
    assert.equal(selectedAsset(retired), undefined);
    assert.deepEqual(applyWildsInput(retired, { type: "select-asset", assetId: asset.id }), retired);
    assert.deepEqual(applyWildsInput(retired, { type: "train", cardId: asset.manifest.familyId, at: "2026-07-16T22:01:00.000Z" }), retired);
    assert.deepEqual(applyWildsInput(retired, { type: "mark-listed", assetId: asset.id, synchronizedAt: "2026-07-16T22:01:00.000Z" }), retired);
  });

  it("never lets an imported living Vault branch overwrite a local retirement", () => {
    const asset = initialPlayState.inventory[0]!;
    const aliveRevision = arenaFixtureRevision(asset);
    const deadCondition = { ...emptyAdventureCondition(asset.id), life: "dead" as const, retiredAt: "2026-07-16T22:00:00.000Z", retirementCauseEventId: "arena:event:final" };
    const retiredRevision = arenaFixtureRevision(asset, deadCondition);
    const local = {
      ...initialPlayState,
      adventureConditions: { ...initialPlayState.adventureConditions, [asset.id]: deadCondition },
      arenaLivingRevisions: { [asset.id]: retiredRevision },
    };
    const imported = playerVault({ ...initialPlayState, arenaLivingRevisions: { [asset.id]: aliveRevision } });
    const reconciled = reconcileWildsPlayerVault({ local, restored: imported, canonical: initialWildsWorldProjection(), actorId: imported.playerId });
    assert.equal(reconciled.state.adventureConditions[asset.id]?.life, "dead");
    assert.equal(reconciled.state.arenaLivingRevisions[asset.id]?.lifeState, "retired");
    assert.equal(canUseWildsAsset(reconciled.state, asset.id, "active"), false);
  });

  it("renders memorial status and life-history inspection without active retired-card actions", () => {
    const source = readFileSync(new URL("../src/features/play/WildsInventory.tsx", import.meta.url), "utf8");
    assert.match(source, /Memorial/);
    assert.match(source, /Life history/);
    assert.match(source, /canUseWildsAsset/);
    assert.match(source, /Retired cards remain visible/);
  });
});
