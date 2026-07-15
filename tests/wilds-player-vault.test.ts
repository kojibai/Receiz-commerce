import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initialPlayState } from "../src/features/play/game-state.js";
import {
  createWildsPlayerVault,
  reconcileWildsPlayerVault,
  verifyWildsPlayerVault
} from "../src/features/play/wilds-player-vault.js";
import { initialWildsWorldProjection } from "../src/features/play/wilds-world-state.js";
import { embedPortableVaultInPng, readPortableVaultFromPng, verifyPortableVaultPng } from "../src/features/play/card-export.js";
import { createWildsCivicEvent } from "../src/features/play/wilds-civic-history.js";
import { canonicalPortableCardJson, sha256PortableBasis } from "../src/features/play/portable-card.js";

const sourcePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

const civicEvent = createWildsCivicEvent({
  settlementId: "wayfinder-hollow",
  actorId: "wilds.player.receiz.id",
  kind: "resident.met",
  sourceId: "mira-vale",
  occurredAt: "2026-07-15T14:30:00.000Z",
  cardProofDigest: null,
  reputation: 3
});

function playerVault() {
  return createWildsPlayerVault({
    playerId: "wilds.player.receiz.id",
    exportedAt: "2026-07-15T15:00:00.000Z",
    playState: { ...initialPlayState, player: { x: 144, z: 96 }, worldMastery: 84, civicEvents: [civicEvent], regionalReputation: { "wayfinder-hollow": 3 } },
    settings: { avatarStyle: "female", movementMode: "run", audio: { muted: false, music: 0.7 } },
    personalEvents: [
      { eventId: "personal:first", kind: "card.captured", occurredAt: "2026-07-15T14:00:00.000Z" },
      { eventId: "personal:first", kind: "card.captured", occurredAt: "2026-07-15T14:00:00.000Z" }
    ],
    canonicalCursor: { worldId: "wilds:global:v3", revision: 2, eventId: null },
    receipts: [{ eventId: "personal:first", digest: `sha256:${"a".repeat(64)}` }]
  });
}

describe("Wilds V3 player vault", () => {
  it("proof-binds normalized player state, settings, history, receipts, and cursor", () => {
    const vault = playerVault();

    assert.equal(vault.schema, "receiz.wilds_player_vault.v3");
    assert.match(vault.payloadDigest, /^sha256:[a-f0-9]{64}$/);
    assert.equal(vault.personalEvents.length, 1);
    assert.deepEqual(verifyWildsPlayerVault(vault), { ok: true, errors: [] });
    assert.equal(verifyWildsPlayerVault({ ...vault, playState: { ...vault.playState, worldMastery: 999 } }).ok, false);
  });

  it("accepts a sealed payload from before newer PlayState fields were introduced", () => {
    const current = playerVault();
    const legacyPayload = { ...current, playState: { ...current.playState, legacyUnknownField: 42 } } as typeof current;
    const { payloadDigest, ...withoutDigest } = legacyPayload;
    const legacy = {
      ...legacyPayload,
      payloadDigest: sha256PortableBasis(canonicalPortableCardJson(withoutDigest))
    };
    assert.notEqual(payloadDigest, legacy.payloadDigest);
    assert.deepEqual(verifyWildsPlayerVault(legacy), { ok: true, errors: [] });
  });

  it("embeds and verifies the complete player payload in a backward-compatible vault PNG", () => {
    const player = playerVault();
    const png = embedPortableVaultInPng(sourcePng, initialPlayState.inventory, player);
    const decoded = readPortableVaultFromPng(png);
    const verified = verifyPortableVaultPng(png);

    assert.equal(decoded.schema, "receiz.wilds_vault_png_proof.v3");
    assert.equal(decoded.player?.payloadDigest, player.payloadDigest);
    assert.equal(verified.ok, true);
    assert.equal(verified.player?.playState.worldMastery, 84);
    assert.deepEqual(verified.player?.playState.civicEvents, [civicEvent]);
    assert.equal(verified.player?.playState.regionalReputation["wayfinder-hollow"], 3);
    assert.equal(verified.assets.length, initialPlayState.inventory.length);
  });

  it("rejects the wrong owner and warns before stale world facts can overwrite canonical state", () => {
    const restored = playerVault();
    const canonical = { ...initialWildsWorldProjection(), revision: 10 };

    assert.throws(() => reconcileWildsPlayerVault({ local: initialPlayState, restored, canonical, actorId: "player:other" }), /wilds_player_vault_owner_invalid/);
    const reconciled = reconcileWildsPlayerVault({ local: initialPlayState, restored, canonical, actorId: restored.playerId });
    assert.deepEqual(reconciled.state.player, { x: 144, z: 96 });
    assert.equal(reconciled.warnings.includes("wilds_player_vault_canonical_cursor_stale"), true);
  });
});
