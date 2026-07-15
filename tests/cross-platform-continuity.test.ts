import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertContinuityEnvelope,
  continuityEnvelopeForOwner,
  continuityKeyForOwner,
  RECEIZ_CANONICAL_ISSUER,
  RECEIZ_CONTINUITY_NAMESPACE
} from "../src/lib/receiz/cross-platform-continuity.js";
import { initialPlayState } from "../src/features/play/game-state.js";
import { createWildsPlayerVault, reconcileWildsPlayerVault, verifyWildsPlayerVault } from "../src/features/play/wilds-player-vault.js";
import { initialWildsWorldProjection } from "../src/features/play/wilds-world-state.js";

describe("Receiz cross-platform continuity", () => {
  it("uses one host-independent continuity key for every storefront", () => {
    const owner = "wilds.player.receiz.id";
    const key = continuityKeyForOwner(owner);
    assert.equal(key, `${RECEIZ_CONTINUITY_NAMESPACE}:${owner}`);
    assert.equal(key.includes("boost.receiz.app"), false);
    assert.equal(key.includes("shop.example.com"), false);
    assert.equal(key.includes("receiz.app"), false);
  });

  it("restores the same vault across domains without changing canonical identity", () => {
    const owner = "wilds.player.receiz.id";
    const vault = createWildsPlayerVault({
      playerId: owner,
      exportedAt: "2026-07-15T15:00:00.000Z",
      playState: initialPlayState,
      settings: { avatarStyle: "female", movementMode: "walk", audio: {} },
      personalEvents: [],
      canonicalCursor: { worldId: "wilds:global:v3", revision: 2, eventId: null },
      receipts: []
    });
    assert.deepEqual(vault.continuity, continuityEnvelopeForOwner(owner));
    assert.deepEqual(verifyWildsPlayerVault(vault), { ok: true, errors: [] });
    assert.doesNotThrow(() => reconcileWildsPlayerVault({
      local: initialPlayState,
      restored: vault,
      canonical: initialWildsWorldProjection(),
      actorId: owner
    }));
  });

  it("rejects clone-local issuer, namespace, world, and owner envelopes", () => {
    const valid = continuityEnvelopeForOwner("wilds.player.receiz.id");
    assert.doesNotThrow(() => assertContinuityEnvelope({ ...valid, issuer: "https://receiz.app" } as never));
    assert.throws(() => assertContinuityEnvelope({ ...valid, issuer: "https://clone.example" } as never), /issuer_invalid/);
    assert.throws(() => assertContinuityEnvelope({ ...valid, namespace: "clone:continuity:v1" } as never), /namespace_invalid/);
    assert.throws(() => assertContinuityEnvelope({ ...valid, worldId: "clone:world" } as never), /world_invalid/);
    assert.throws(() => assertContinuityEnvelope(valid, "wilds.player.other"), /owner_invalid/);
    assert.equal(RECEIZ_CANONICAL_ISSUER, "https://receiz.com");
  });
});
