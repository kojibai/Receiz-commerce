import { canonicalPortableCardJson, sha256PortableBasis } from "./portable-card";

export const WILDS_RIFT_COOLDOWN_MS = 8_000;
export const WILDS_RIFT_GRANT_TTL_MS = 15_000;
const WILDS_WORLD_COORDINATE_LIMIT = 1_000_000;

export type RiftTravelRequest = {
  idempotencyKey: string;
  source: { x: number; z: number };
  destination: { x: number; z: number };
  requestedAt: string;
};

export type RiftTravelGrant = {
  grantId: string;
  playerId: string;
  destination: { x: number; z: number };
  issuedAt: string;
  expiresAt: string;
};

export type RiftTravelAuthority = {
  playerId: string;
  now: number;
  lastRiftAt: number | null;
  locked: boolean;
};

type RiftTravelError =
  | "wilds_rift_activity_locked"
  | "wilds_rift_actor_mismatch"
  | "wilds_rift_cooldown"
  | "wilds_rift_grant_expired"
  | "wilds_rift_grant_invalid"
  | "wilds_rift_idempotency_invalid"
  | "wilds_rift_position_invalid"
  | "wilds_rift_time_invalid";

function validCoordinate(position: { x: number; z: number }) {
  return [position.x, position.z].every((coordinate) => (
    Number.isFinite(coordinate) && Math.abs(coordinate) <= WILDS_WORLD_COORDINATE_LIMIT
  ));
}

export function authorizeRiftTravel(
  request: RiftTravelRequest,
  authority: RiftTravelAuthority
): { ok: true; grant: RiftTravelGrant } | { ok: false; error: RiftTravelError } {
  if (authority.locked) return { ok: false, error: "wilds_rift_activity_locked" };
  if (!/^[a-z0-9:-]{6,96}$/i.test(request.idempotencyKey)) {
    return { ok: false, error: "wilds_rift_idempotency_invalid" };
  }
  if (!validCoordinate(request.source) || !validCoordinate(request.destination)) {
    return { ok: false, error: "wilds_rift_position_invalid" };
  }
  const requestTime = Date.parse(request.requestedAt);
  if (!Number.isFinite(requestTime) || Math.abs(authority.now - requestTime) > 30_000) {
    return { ok: false, error: "wilds_rift_time_invalid" };
  }
  if (authority.lastRiftAt !== null && authority.now - authority.lastRiftAt < WILDS_RIFT_COOLDOWN_MS) {
    return { ok: false, error: "wilds_rift_cooldown" };
  }

  const issuedAt = new Date(authority.now).toISOString();
  const digest = sha256PortableBasis(canonicalPortableCardJson({
    playerId: authority.playerId,
    idempotencyKey: request.idempotencyKey,
    source: request.source,
    destination: request.destination,
    issuedAt
  }));
  return {
    ok: true,
    grant: {
      grantId: `rift:${digest.slice(7, 39)}`,
      playerId: authority.playerId,
      destination: { ...request.destination },
      issuedAt,
      expiresAt: new Date(authority.now + WILDS_RIFT_GRANT_TTL_MS).toISOString()
    }
  };
}

export function validateRiftGrant(
  grant: RiftTravelGrant,
  authority: { playerId: string; now: number }
): { ok: true } | { ok: false; error: RiftTravelError } {
  if (!grant || !/^rift:[a-f0-9]{32}$/.test(grant.grantId) || !validCoordinate(grant.destination)) {
    return { ok: false, error: "wilds_rift_grant_invalid" };
  }
  if (grant.playerId !== authority.playerId) return { ok: false, error: "wilds_rift_actor_mismatch" };
  const issuedAt = Date.parse(grant.issuedAt);
  const expiresAt = Date.parse(grant.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt - issuedAt !== WILDS_RIFT_GRANT_TTL_MS) {
    return { ok: false, error: "wilds_rift_grant_invalid" };
  }
  if (authority.now > expiresAt || authority.now < issuedAt) return { ok: false, error: "wilds_rift_grant_expired" };
  return { ok: true };
}
