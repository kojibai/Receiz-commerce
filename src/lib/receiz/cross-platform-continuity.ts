import { WILDS_WORLD_ID } from "../../features/play/wilds-world-event";

/**
 * The continuity namespace is deliberately independent of a storefront host.
 * Hostnames partition merchant commerce state; they are never an identity
 * boundary for a Receiz player, card, vault, or shared-world event.
 */
export const RECEIZ_CONTINUITY_SCHEMA = "receiz.cross_platform_continuity.v1" as const;
export const RECEIZ_CONTINUITY_NAMESPACE = "receiz:continuity:v1" as const;
export const RECEIZ_CANONICAL_ISSUER = "https://receiz.app" as const;

export type ReceizContinuityEnvelope = {
  schema: typeof RECEIZ_CONTINUITY_SCHEMA;
  namespace: typeof RECEIZ_CONTINUITY_NAMESPACE;
  issuer: typeof RECEIZ_CANONICAL_ISSUER;
  ownerId: string;
  worldId: typeof WILDS_WORLD_ID;
};

function validIdentity(value: string) {
  return value.length >= 3 && value.length <= 180 && /^[a-z0-9][a-z0-9:._-]*$/i.test(value);
}

export function continuityKeyForOwner(ownerId: string) {
  if (!validIdentity(ownerId)) throw new Error("receiz_continuity_owner_invalid");
  return `${RECEIZ_CONTINUITY_NAMESPACE}:${ownerId.toLowerCase()}`;
}

export function createContinuityEnvelope(ownerId: string): ReceizContinuityEnvelope {
  if (!validIdentity(ownerId)) throw new Error("receiz_continuity_owner_invalid");
  return {
    schema: RECEIZ_CONTINUITY_SCHEMA,
    namespace: RECEIZ_CONTINUITY_NAMESPACE,
    issuer: RECEIZ_CANONICAL_ISSUER,
    ownerId,
    worldId: WILDS_WORLD_ID
  };
}

export function assertContinuityEnvelope(value: ReceizContinuityEnvelope, ownerId?: string) {
  if (value.schema !== RECEIZ_CONTINUITY_SCHEMA) throw new Error("receiz_continuity_schema_invalid");
  if (value.namespace !== RECEIZ_CONTINUITY_NAMESPACE) throw new Error("receiz_continuity_namespace_invalid");
  if (value.issuer !== RECEIZ_CANONICAL_ISSUER) throw new Error("receiz_continuity_issuer_invalid");
  if (value.worldId !== WILDS_WORLD_ID) throw new Error("receiz_continuity_world_invalid");
  if (!validIdentity(value.ownerId) || (ownerId !== undefined && value.ownerId !== ownerId)) {
    throw new Error("receiz_continuity_owner_invalid");
  }
  return value;
}

export function continuityEnvelopeForOwner(ownerId: string) {
  return assertContinuityEnvelope(createContinuityEnvelope(ownerId), ownerId);
}
