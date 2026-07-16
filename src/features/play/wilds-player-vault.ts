import { canonicalPortableCardJson, sha256PortableBasis } from "./portable-card";
import { restorePlayState, serializePlayState, type PlayState } from "./game-state";
import { WILDS_WORLD_ID } from "./wilds-world-event";
import type { WildsWorldProjection } from "./wilds-world-state";

export type WildsPlayerVaultPayload = {
  schema: "receiz.wilds_player_vault.v3";
  playerId: string;
  exportedAt: string;
  playState: PlayState;
  settings: {
    avatarStyle: "female" | "male" | null;
    movementMode: "walk" | "run";
    audio: Record<string, boolean | number>;
  };
  personalEvents: { eventId: string; kind: string; occurredAt: string; receiptDigest?: string }[];
  canonicalCursor: { worldId: typeof WILDS_WORLD_ID; revision: number; eventId: string | null };
  receipts: { eventId: string; digest: string }[];
  payloadDigest: string;
};

type PlayerVaultInput = Omit<WildsPlayerVaultPayload, "schema" | "payloadDigest">;

function identityValid(value: string) {
  return value.length >= 3 && value.length <= 180 && /^[a-z0-9][a-z0-9:._-]*$/i.test(value);
}

function normalizedInput(input: PlayerVaultInput): PlayerVaultInput {
  if (!identityValid(input.playerId)) throw new Error("wilds_player_vault_owner_invalid");
  if (!Number.isFinite(Date.parse(input.exportedAt))) throw new Error("wilds_player_vault_time_invalid");
  if (input.canonicalCursor.worldId !== WILDS_WORLD_ID || !Number.isSafeInteger(input.canonicalCursor.revision) || input.canonicalCursor.revision < 0) throw new Error("wilds_player_vault_cursor_invalid");
  const events = new Map<string, PlayerVaultInput["personalEvents"][number]>();
  for (const event of input.personalEvents) {
    if (!identityValid(event.eventId) || !event.kind || !Number.isFinite(Date.parse(event.occurredAt))) throw new Error("wilds_player_vault_event_invalid");
    events.set(event.eventId, event);
  }
  const receipts = new Map<string, PlayerVaultInput["receipts"][number]>();
  for (const receipt of input.receipts) {
    if (!identityValid(receipt.eventId) || !/^sha256:[a-f0-9]{64}$/.test(receipt.digest)) throw new Error("wilds_player_vault_receipt_invalid");
    receipts.set(receipt.eventId, receipt);
  }
  return {
    ...input,
    exportedAt: new Date(Date.parse(input.exportedAt)).toISOString(),
    playState: restorePlayState(serializePlayState(input.playState)),
    personalEvents: [...events.values()].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.eventId.localeCompare(right.eventId)).slice(-2_048),
    receipts: [...receipts.values()].sort((left, right) => left.eventId.localeCompare(right.eventId)).slice(-2_048)
  };
}

function basis(input: PlayerVaultInput) {
  return { schema: "receiz.wilds_player_vault.v3" as const, ...input };
}

function recordKey(value: unknown) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return JSON.stringify(value);
  const item = value as Record<string, unknown>;
  return String(item.eventId ?? item.id ?? item.digest ?? item.sourceEventId ?? JSON.stringify(value));
}

function mergeRecords<T>(local: readonly T[] | undefined, restored: readonly T[] | undefined) {
  const merged = new Map<string, T>();
  for (const value of local ?? []) merged.set(recordKey(value), value);
  for (const value of restored ?? []) merged.set(recordKey(value), value);
  return [...merged.values()];
}

export function createWildsPlayerVault(input: PlayerVaultInput): WildsPlayerVaultPayload {
  const normalized = normalizedInput(input);
  return { ...basis(normalized), payloadDigest: sha256PortableBasis(canonicalPortableCardJson(basis(normalized))) };
}

export function verifyWildsPlayerVault(value: WildsPlayerVaultPayload) {
  const errors: string[] = [];
  try {
    // Verify the exact serialized payload first. Normalizing PlayState can add
    // fields introduced by later releases, which must not invalidate a vault
    // that was correctly sealed before those fields existed.
    const { payloadDigest, schema, ...payload } = value;
    const expectedDigest = sha256PortableBasis(canonicalPortableCardJson({ schema, ...payload }));
    if (schema !== "receiz.wilds_player_vault.v3" || payloadDigest !== expectedDigest) {
      errors.push("wilds_player_vault_digest_invalid");
    }
    const normalized = normalizedInput({
      playerId: value.playerId,
      exportedAt: value.exportedAt,
      playState: value.playState,
      settings: value.settings,
      personalEvents: value.personalEvents,
      canonicalCursor: value.canonicalCursor,
      receipts: value.receipts
    });
    void normalized;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "wilds_player_vault_invalid");
  }
  return { ok: errors.length === 0, errors };
}

export function reconcileWildsPlayerVault(input: {
  local: PlayState;
  restored: WildsPlayerVaultPayload;
  canonical: WildsWorldProjection;
  actorId: string;
}) {
  if (input.restored.playerId !== input.actorId) throw new Error("wilds_player_vault_owner_invalid");
  const verified = verifyWildsPlayerVault(input.restored);
  if (!verified.ok) throw new Error(verified.errors[0] ?? "wilds_player_vault_invalid");
  const restoredPlayState = input.restored.playState;
  const arenaLivingRevisions = { ...input.local.arenaLivingRevisions };
  for (const [assetId, revision] of Object.entries(restoredPlayState.arenaLivingRevisions)) {
    const local = arenaLivingRevisions[assetId];
    if (!local
      || (local.lifeState !== "retired" && revision.lifeState === "retired")
      || (local.lifeState !== "retired" && revision.lifeState !== "retired"
        && (revision.revision > local.revision || (revision.revision === local.revision && revision.digest > local.digest)))) {
      arenaLivingRevisions[assetId] = revision;
    }
  }
  const adventureConditions = { ...input.local.adventureConditions, ...restoredPlayState.adventureConditions };
  for (const [assetId, condition] of Object.entries(input.local.adventureConditions)) {
    if (condition.life === "dead") adventureConditions[assetId] = condition;
  }
  const localPathProgress = input.local.arenaPath?.checkpoint.completedEncounterIds.length ?? -1;
  const restoredPathProgress = restoredPlayState.arenaPath?.checkpoint.completedEncounterIds.length ?? -1;
  const mergedState: PlayState = {
    ...input.local,
    ...restoredPlayState,
    inventory: mergeRecords(input.local.inventory, restoredPlayState.inventory),
    achievements: mergeRecords(input.local.achievements, restoredPlayState.achievements),
    completedMissionIds: mergeRecords(input.local.completedMissionIds, restoredPlayState.completedMissionIds),
    discoveredCardIds: mergeRecords(input.local.discoveredCardIds, restoredPlayState.discoveredCardIds),
    capturedHotspotIds: mergeRecords(input.local.capturedHotspotIds, restoredPlayState.capturedHotspotIds),
    collectedEnergyCrystalIds: mergeRecords(input.local.collectedEnergyCrystalIds, restoredPlayState.collectedEnergyCrystalIds),
    pendingSyncAssetIds: mergeRecords(input.local.pendingSyncAssetIds, restoredPlayState.pendingSyncAssetIds),
    civicEvents: mergeRecords(input.local.civicEvents, restoredPlayState.civicEvents),
    ecologyEvents: mergeRecords(input.local.ecologyEvents, restoredPlayState.ecologyEvents),
    raidEvents: mergeRecords(input.local.raidEvents, restoredPlayState.raidEvents),
    rewardCards: mergeRecords(input.local.rewardCards, restoredPlayState.rewardCards),
    adventureConditions,
    arenaPath: !input.local.arenaPath || input.local.arenaPath.id === restoredPlayState.arenaPath?.id && restoredPathProgress >= localPathProgress
      ? restoredPlayState.arenaPath
      : input.local.arenaPath,
    arenaLivingRevisions,
    arenaPendingReceiptTail: mergeRecords(input.local.arenaPendingReceiptTail, restoredPlayState.arenaPendingReceiptTail).slice(-512),
    arenaReceiptTail: mergeRecords(input.local.arenaReceiptTail, restoredPlayState.arenaReceiptTail).slice(-512),
    arenaConflictTail: mergeRecords(input.local.arenaConflictTail, restoredPlayState.arenaConflictTail).slice(-512),
    arenaMemorials: mergeRecords(input.local.arenaMemorials, restoredPlayState.arenaMemorials).slice(-512),
    arenaDeviceIdentities: mergeRecords(input.local.arenaDeviceIdentities, restoredPlayState.arenaDeviceIdentities).slice(-32),
  };
  const state = restorePlayState(serializePlayState(mergedState));
  const warnings: string[] = [];
  if (input.restored.canonicalCursor.revision < input.canonical.revision) warnings.push("wilds_player_vault_canonical_cursor_stale");
  if (input.restored.canonicalCursor.revision > input.canonical.revision) warnings.push("wilds_player_vault_canonical_sync_pending");
  return { state, warnings };
}
