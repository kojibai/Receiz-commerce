import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { applyWildsInput, initialPlayState } from "../src/features/play/game-state";
import { validatePresenceMove } from "../src/features/play/multiplayer-core";
import {
  authorizeRiftTravel,
  validateRiftGrant,
  WILDS_RIFT_COOLDOWN_MS,
  type RiftTravelRequest
} from "../src/features/play/wilds-rift-travel";

const requestedAt = "2026-07-15T12:00:00.000Z";
const now = Date.parse(requestedAt);
const validRequest: RiftTravelRequest = {
  idempotencyKey: "rift-request-1",
  source: { x: 0, z: 0 },
  destination: { x: 144, z: -96 },
  requestedAt
};

describe("Wilds Rift travel", () => {
  it("authorizes a bounded safe Rift without weakening ordinary movement", () => {
    const result = authorizeRiftTravel(validRequest, {
      playerId: "player-1",
      now,
      lastRiftAt: null,
      locked: false
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.grant.destination, validRequest.destination);
    assert.equal(result.grant.playerId, "player-1");
    assert.equal(validateRiftGrant(result.grant, { playerId: "player-1", now: now + 1_000 }).ok, true);
    assert.equal(validatePresenceMove(
      { x: 0, z: 0, at: requestedAt },
      { x: 144, z: -96, at: "2026-07-15T12:00:01.000Z" }
    ).ok, false);
  });

  it("rejects malformed, locked, and cooling-down travel", () => {
    assert.deepEqual(authorizeRiftTravel({ ...validRequest, destination: { x: Infinity, z: 0 } }, {
      playerId: "player-1", now, lastRiftAt: null, locked: false
    }), { ok: false, error: "wilds_rift_position_invalid" });
    assert.deepEqual(authorizeRiftTravel({ ...validRequest, destination: { x: 1_000_001, z: 0 } }, {
      playerId: "player-1", now, lastRiftAt: null, locked: false
    }), { ok: false, error: "wilds_rift_position_invalid" });
    assert.deepEqual(authorizeRiftTravel({ ...validRequest, idempotencyKey: "" }, {
      playerId: "player-1", now, lastRiftAt: null, locked: false
    }), { ok: false, error: "wilds_rift_idempotency_invalid" });
    assert.deepEqual(authorizeRiftTravel(validRequest, {
      playerId: "player-1", now, lastRiftAt: null, locked: true
    }), { ok: false, error: "wilds_rift_activity_locked" });
    assert.deepEqual(authorizeRiftTravel(validRequest, {
      playerId: "player-1", now, lastRiftAt: now - WILDS_RIFT_COOLDOWN_MS + 1, locked: false
    }), { ok: false, error: "wilds_rift_cooldown" });
  });

  it("rejects expired or foreign grants", () => {
    const result = authorizeRiftTravel(validRequest, {
      playerId: "player-1", now, lastRiftAt: null, locked: false
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.deepEqual(validateRiftGrant(result.grant, { playerId: "player-2", now: now + 1_000 }), {
      ok: false,
      error: "wilds_rift_actor_mismatch"
    });
    assert.deepEqual(validateRiftGrant(result.grant, { playerId: "player-1", now: now + 15_001 }), {
      ok: false,
      error: "wilds_rift_grant_expired"
    });
  });

  it("moves game state only from a valid unexpired grant", () => {
    const result = authorizeRiftTravel(validRequest, {
      playerId: "player-1", now, lastRiftAt: null, locked: false
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;

    const moved = applyWildsInput(initialPlayState, {
      type: "apply-rift-grant",
      grant: result.grant,
      playerId: "player-1",
      appliedAt: "2026-07-15T12:00:01.000Z"
    });
    assert.deepEqual(moved.player, { x: 144, z: -96 });
    assert.match(moved.lastEvent, /Rift complete/);

    const expired = applyWildsInput(initialPlayState, {
      type: "apply-rift-grant",
      grant: result.grant,
      playerId: "player-1",
      appliedAt: "2026-07-15T12:00:16.000Z"
    });
    assert.strictEqual(expired, initialPlayState);
  });

  it("derives Rift authority from the server actor and room instead of client identity", async () => {
    const route = await readFile("app/api/wilds/rift/route.ts", "utf8");
    assert.match(route, /resolveWildsMultiplayerActor\(request, body\?\.guestId\)/);
    assert.match(route, /parseWildsRoomKey\(body\?\.roomKey\)/);
    assert.match(route, /getWildsMultiplayerSnapshot\(roomKey/);
    assert.match(route, /authorizeRiftTravel/);
    assert.match(route, /cache-control": "private, no-store"/);
    assert.doesNotMatch(route, /body\?\.playerId/);
  });
});
