import { creatureFamilies, creatureForm, creatureForms, type CreatureRarity } from "./creature-catalog";
import {
  evolvePortableCard,
  sealCollectedCard,
  verifyPortableCard,
  type PortableCardAsset
} from "./portable-card";
import { encounterFromSearch, idleEncounterState, isCapturableEncounter, type EncounterState } from "./encounter-state";
import { nearbyHiddenHotspots, searchHiddenHotspots } from "./hidden-hotspots";
import { applyBattleAction, battleTranscriptDigest, startWildBattle, type BattleAction, type BattleState } from "./battle-engine";
import { fusionChild, fusionEligibility, type FusionInheritance } from "./card-fusion";

export type GameAction = "explore" | "train" | "mission";
export type MoveDirection = "north" | "south" | "west" | "east";
export type WildsInput =
  | { type: "move"; direction: MoveDirection }
  | { type: "move-vector"; x: number; z: number }
  | { type: "discover" }
  | { type: "capture"; encounterId: string; capturedAt: string; ownerReceizId: string }
  | { type: "search-point"; x: number; z: number; searchedAt: string; ownerReceizId: string }
  | { type: "advance-encounter"; at: string }
  | { type: "start-battle"; at: string }
  | { type: "battle-action"; action: BattleAction }
  | { type: "dismiss-reveal" }
  | { type: "mark-synced"; assetId: string; synchronizedAt: string }
  | { type: "mark-listed"; assetId: string; synchronizedAt: string }
  | { type: "import-card"; asset: PortableCardAsset }
  | { type: "fuse-cards"; parentAId: string; parentBId: string; inheritance: FusionInheritance; fusedAt: string }
  | { type: "evolve"; assetId: string; evolvedAt: string }
  | { type: "train"; cardId?: string }
  | { type: "mission" }
  | { type: "rest" }
  | { type: "select-card"; cardId: string }
  | { type: "select-asset"; assetId: string }
  | { type: "reset" };

export type Vec3 = readonly [number, number, number];

export type CreatureCard = {
  id: string;
  name: string;
  species: string;
  role: string;
  power: number;
  rarity: CreatureRarity;
  color: string;
  accent: string;
  position: Vec3;
  businessLogic: string;
};

export type HabitatNode = {
  id: string;
  label: string;
  position: Vec3;
  tone: "grove" | "spark" | "trade" | "reward" | "gate";
};

export type MissionCard = {
  id: string;
  title: string;
  reward: string;
  requirement: string;
};

export type RewardCard = {
  id: string;
  title: string;
  businessUse: string;
  value: string;
};

export type PlayState = {
  activeAction: GameAction;
  beans: number;
  cardXp: number;
  challenge: number;
  combo: number;
  companionProgress: Record<string, { level: number; xp: number; bond: number }>;
  completed: boolean;
  completedMissionIds: string[];
  capturedHotspotIds: string[];
  discoveredCardIds: string[];
  energy: number;
  encounter: EncounterState;
  inventory: PortableCardAsset[];
  lastEvent: string;
  level: number;
  missionProgress: number;
  lastSearchPoint: { x: number; z: number } | null;
  player: {
    x: number;
    z: number;
  };
  pendingSyncAssetIds: string[];
  rewardCards: RewardCard[];
  selectedCardId: string;
  selectedAssetId: string;
  streak: number;
  bossUnlocked: boolean;
  battle: BattleState | null;
  fusionSparks: number;
  fusionCooldowns: Record<string, string>;
  achievements: string[];
  worldRank: "Grove scout" | "Trail keeper" | "Wilds ranger" | "Titan challenger";
};

export const worldBounds = {
  min: -500_000_000,
  max: 500_000_000,
  analogStep: 0.42,
  step: 1.05
} as const;

const flagshipPositions: Record<string, Vec3> = {
  mintcub: [-2.8, 0, -1.4],
  voltray: [1.6, 0, -2.1],
  ledgerfox: [-0.4, 0, 1.5],
  titanseal: [3.1, 0, 1.2]
};

export const creatureCards: CreatureCard[] = creatureFamilies.map((family, index) => {
  const form = creatureForm(family.formIds[0])!;
  return {
    id: family.id,
    name: form.name,
    species: form.species,
    role: form.role,
    power: form.stats.power,
    rarity: form.rarity,
    color: form.palette.primary,
    accent: form.palette.accent,
    position: flagshipPositions[family.id] ?? [index * 120_000 - 15_000_000, 0, ((index * 7919) % 30_000_000) - 15_000_000],
    businessLogic: `${form.habitat} · ${form.abilities[0].name}`
  };
});

const MAX_NEARBY_CREATURES = 12;
const ENCOUNTER_REGION_SIZE = 24;

function encounterUnit(x: number, z: number, salt: number) {
  const value = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

export function nearbyCreatureCards(player: Pick<PlayState, "player">["player"]): CreatureCard[] {
  const regionX = Math.floor(player.x / ENCOUNTER_REGION_SIZE);
  const regionZ = Math.floor(player.z / ENCOUNTER_REGION_SIZE);
  const regionSeed = Math.abs((regionX * 73856093) ^ (regionZ * 19349663));
  const cards: CreatureCard[] = [];
  if (Math.abs(regionX) <= 1 && Math.abs(regionZ) <= 1) cards.push(...creatureCards.slice(0, 4));
  for (let slot = 0; cards.length < MAX_NEARBY_CREATURES && slot < 20; slot += 1) {
    const index = 4 + ((regionSeed + slot * 47) % (creatureCards.length - 4));
    const source = creatureCards[index]!;
    if (cards.some((card) => card.id === source.id)) continue;
    cards.push({
      ...source,
      position: [
        regionX * ENCOUNTER_REGION_SIZE + 2 + encounterUnit(regionX, regionZ, slot) * 20,
        0,
        regionZ * ENCOUNTER_REGION_SIZE + 2 + encounterUnit(regionZ, regionX, slot + 31) * 20
      ]
    });
  }
  return cards.slice(0, MAX_NEARBY_CREATURES);
}

export const habitatNodes: HabitatNode[] = [
  { id: "grove", label: "Mint Grove", position: [-3.2, 0, -1.7], tone: "grove" },
  { id: "spark-den", label: "Spark Den", position: [1.3, 0, -2.4], tone: "spark" },
  { id: "trade-crossing", label: "Trade Crossing", position: [-0.7, 0, 1.8], tone: "trade" },
  { id: "reward-nest", label: "Reward Nest", position: [1.7, 0, 2.8], tone: "reward" },
  { id: "titan-gate", label: "Titan Gate", position: [3.4, 0, 1.5], tone: "gate" }
];

export const missionCards: MissionCard[] = [
  {
    id: "daily-expedition",
    title: "Daily Wild Expedition",
    reward: "Brandable reward card",
    requirement: "Discover one companion and play a mission."
  },
  {
    id: "bond-training",
    title: "Train 3 companion cards",
    reward: "+450 beans",
    requirement: "Use card powers to raise mission progress."
  },
  {
    id: "titan-challenge",
    title: "Clear the Titan Gate",
    reward: "Custom coupon slot",
    requirement: "Bring a trained card into the gate mission."
  }
];

const starterCardAsset = sealCollectedCard({
  formId: "mintcub-1",
  ownerReceizId: "wilds.player.receiz.id",
  encounterId: "starter-mintcub",
  capturedAt: "2026-06-29T12:00:00.000Z"
});

export const initialPlayState: PlayState = {
  activeAction: "explore",
  beans: 28,
  cardXp: 136,
  challenge: 42,
  combo: 0,
  companionProgress: Object.fromEntries(creatureCards.map((card) => [card.id, { level: 1, xp: 0, bond: 0 }])),
  completed: false,
  completedMissionIds: [],
  capturedHotspotIds: [],
  discoveredCardIds: ["mintcub"],
  energy: 84,
  encounter: idleEncounterState,
  inventory: [{ ...starterCardAsset, status: "verified", synchronizedAt: "2026-06-29T12:00:00.000Z" }],
  lastEvent: "SealCub joined your deck. Walk near another wild companion.",
  level: 7,
  missionProgress: 38,
  lastSearchPoint: null,
  player: {
    x: -2.15,
    z: -0.85
  },
  pendingSyncAssetIds: [],
  rewardCards: [],
  selectedCardId: "mintcub",
  selectedAssetId: starterCardAsset.id,
  streak: 9,
  bossUnlocked: false,
  battle: null,
  fusionSparks: 1,
  fusionCooldowns: {},
  achievements: ["first_spark"],
  worldRank: "Grove scout"
};

const PLAY_SAVE_SCHEMA = "receiz.wilds.save.v4";
const LEGACY_PLAY_SAVE_SCHEMAS = new Set(["receiz.wilds.save.v2", "receiz.wilds.save.v3"]);

export function serializePlayState(state: PlayState) {
  return JSON.stringify({ schema: PLAY_SAVE_SCHEMA, state });
}

export function restorePlayState(value: string | null | undefined): PlayState {
  if (!value) return initialPlayState;
  try {
    const parsed = JSON.parse(value) as { schema?: unknown; state?: unknown };
    if ((parsed.schema !== PLAY_SAVE_SCHEMA && !LEGACY_PLAY_SAVE_SCHEMAS.has(String(parsed.schema))) || !parsed.state || typeof parsed.state !== "object") return initialPlayState;
    const saved = parsed.state as Partial<PlayState>;
    if (!saved.player || typeof saved.player.x !== "number" || typeof saved.player.z !== "number") return initialPlayState;
    const discoveredCardIds = Array.isArray(saved.discoveredCardIds)
      ? saved.discoveredCardIds.filter((id): id is string => typeof id === "string" && creatureCards.some((card) => card.id === id))
      : initialPlayState.discoveredCardIds;
    const restoredInventory = Array.isArray(saved.inventory)
      ? saved.inventory.filter((asset): asset is PortableCardAsset => Boolean(asset) && verifyPortableCard(asset as PortableCardAsset).ok)
      : [];
    const migratedInventory = discoveredCardIds.reduce<PortableCardAsset[]>((assets, cardId, index) => {
      if (assets.some((asset) => asset.manifest.familyId === cardId)) return assets;
      const sealed = sealCollectedCard({
        formId: `${cardId}-1`,
        ownerReceizId: "wilds.player.receiz.id",
        encounterId: `legacy-${cardId}`,
        capturedAt: new Date(Date.UTC(2026, 5, 29, 12, index)).toISOString()
      });
      return [...assets, sealed];
    }, restoredInventory);
    const restoredEncounter = restoreEncounter(saved.encounter);
    const restoredSelectedAssetId = typeof saved.selectedAssetId === "string" && migratedInventory.some((asset) => asset.id === saved.selectedAssetId)
      ? saved.selectedAssetId
      : [...migratedInventory].reverse().find((asset) => asset.manifest.familyId === saved.selectedCardId)?.id ?? migratedInventory[0]?.id ?? starterCardAsset.id;
    return withWorldProgress({
      ...initialPlayState,
      ...saved,
      player: {
        x: clamp(saved.player.x, worldBounds.min, worldBounds.max),
        z: clamp(saved.player.z, worldBounds.min, worldBounds.max)
      },
      discoveredCardIds,
      inventory: migratedInventory,
      selectedAssetId: restoredSelectedAssetId,
      capturedHotspotIds: Array.isArray(saved.capturedHotspotIds)
        ? saved.capturedHotspotIds.filter((id): id is string => typeof id === "string")
        : [],
      encounter: restoredEncounter.phase === "sealed" ? { ...restoredEncounter, phase: "revealed" } : restoredEncounter,
      lastSearchPoint: saved.lastSearchPoint && typeof saved.lastSearchPoint.x === "number" && typeof saved.lastSearchPoint.z === "number"
        ? { x: saved.lastSearchPoint.x, z: saved.lastSearchPoint.z }
        : null,
      pendingSyncAssetIds: Array.isArray(saved.pendingSyncAssetIds)
        ? saved.pendingSyncAssetIds.filter((id): id is string => typeof id === "string" && migratedInventory.some((asset) => asset.id === id))
        : migratedInventory.filter((asset) => asset.status === "sealed_local").map((asset) => asset.id),
      companionProgress: {
        ...initialPlayState.companionProgress,
        ...(saved.companionProgress ?? {})
      }
    });
  } catch {
    return initialPlayState;
  }
}

function restoreEncounter(value: unknown): EncounterState {
  if (!value || typeof value !== "object") return idleEncounterState;
  const candidate = value as Record<string, unknown>;
  if (candidate.phase === "idle") return idleEncounterState;
  const phases = new Set(["searching", "hint", "battle_intro", "player_turn", "capture_ready", "fled", "defeated", "emerging", "capsule", "sealed", "revealed"]);
  if (!phases.has(String(candidate.phase)) || typeof candidate.searchedAt !== "string" || typeof candidate.ownerReceizId !== "string") return idleEncounterState;
  const point = candidate.searchPoint as Record<string, unknown> | undefined;
  if (!point || typeof point.x !== "number" || typeof point.z !== "number") return idleEncounterState;
  const proximity = candidate.proximity === "warm" || candidate.proximity === "hot" ? candidate.proximity : "cold";
  const trend = candidate.trend === "closer" || candidate.trend === "farther" || candidate.trend === "steady" ? candidate.trend : null;
  return { ...candidate, proximity, trend } as EncounterState;
}

export function selectedCard(state: PlayState) {
  const asset = selectedAsset(state);
  return creatureCards.find((card) => card.id === (asset?.manifest.familyId ?? state.selectedCardId)) ?? creatureCards[0];
}

export function selectedAsset(state: PlayState) {
  return state.inventory.find((asset) => asset.id === state.selectedAssetId) ?? state.inventory.find((asset) => asset.manifest.familyId === state.selectedCardId) ?? state.inventory[0];
}

export function discoveredCards(state: PlayState) {
  return creatureCards.filter((card) => state.discoveredCardIds.includes(card.id));
}

export function nearestCreature(state: Pick<PlayState, "player">) {
  return nearbyCreatureCards(state.player)
    .map((card) => ({
      card,
      distance: distance2d(state.player, { x: card.position[0], z: card.position[2] })
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}

export function canDiscover(state: PlayState) {
  const nearest = nearestCreature(state);
  return Boolean(nearest && nearest.distance <= 1.25 && !state.discoveredCardIds.includes(nearest.card.id));
}

export function applyWildsInput(state: PlayState, input: WildsInput): PlayState {
  if (input.type === "reset") return initialPlayState;

  if (input.type === "import-card") {
    const asset = input.asset;
    if (!verifyPortableCard(asset).ok) return { ...state, lastEvent: "That PNG did not pass the offline card verifier." };
    if (state.inventory.some((candidate) => candidate.id === asset.id)) {
      return { ...state, selectedAssetId: asset.id, selectedCardId: asset.manifest.familyId, lastEvent: `${asset.manifest.name} is already in your inventory and now leads your active deck.` };
    }
    const discoveredCardIds = Array.from(new Set([...state.discoveredCardIds, asset.manifest.familyId]));
    return withWorldProgress({
      ...state,
      discoveredCardIds,
      inventory: [...state.inventory, asset],
      selectedAssetId: asset.id,
      selectedCardId: asset.manifest.familyId,
      lastEvent: `${asset.manifest.name} passed offline verification and joined your playable inventory.`
    });
  }

  if (input.type === "fuse-cards") {
    const parentA = state.inventory.find((asset) => asset.id === input.parentAId);
    const parentB = state.inventory.find((asset) => asset.id === input.parentBId);
    if (!parentA || !parentB) return { ...state, lastEvent: "Choose two cards from your verified inventory." };
    const sparkId = `spark:${input.fusedAt}`;
    let child: PortableCardAsset;
    try {
      child = fusionChild({ parentA, parentB, inheritance: input.inheritance, fusionKaiPulse: String(Date.parse(input.fusedAt)), fusedAt: input.fusedAt, sparkId });
    } catch {
      return { ...state, lastEvent: "Those cards could not form a verified fusion child." };
    }
    if (state.inventory.some((asset) => asset.id === child.id)) return state;
    const eligibility = fusionEligibility({ parentA, parentB, fusionSparks: state.fusionSparks, fusionCooldowns: state.fusionCooldowns, at: input.fusedAt });
    if (!eligibility.ok) return { ...state, lastEvent: eligibility.availableAt ? `A parent is resting until ${eligibility.availableAt}.` : "Earn a Fusion Spark and choose two eligible parents." };
    const cooldown = new Date(Date.parse(input.fusedAt) + 24 * 60 * 60 * 1000).toISOString();
    return {
      ...state,
      achievements: Array.from(new Set([...state.achievements, "first_fusion_child"])),
      discoveredCardIds: Array.from(new Set([...state.discoveredCardIds, child.manifest.familyId])),
      fusionSparks: state.fusionSparks - 1,
      fusionCooldowns: { ...state.fusionCooldowns, [parentA.id]: cooldown, [parentB.id]: cooldown },
      inventory: [...state.inventory, child],
      pendingSyncAssetIds: [...state.pendingSyncAssetIds, child.id],
      selectedAssetId: child.id,
      selectedCardId: child.manifest.familyId,
      lastEvent: `${parentA.manifest.name} and ${parentB.manifest.name} created ${child.manifest.name}. Both parents remain usable.`
    };
  }

  if (input.type === "dismiss-reveal") {
    if (state.encounter.phase === "idle") return state;
    return { ...state, battle: null, encounter: idleEncounterState };
  }

  if (input.type === "start-battle") {
    if (state.encounter.phase !== "battle_intro" || !state.encounter.formId || !state.encounter.hotspotId) return state;
    const wild = creatureForm(state.encounter.formId);
    const playerAsset = selectedAsset(state);
    if (!wild || !playerAsset || !verifyPortableCard(playerAsset).ok) return { ...state, encounter: { ...state.encounter, phase: "defeated" }, lastEvent: "No verified playable card was available for battle." };
    const battle = startWildBattle({
      encounterSeed: state.encounter.hotspotId,
      player: { assetId: playerAsset.id, name: playerAsset.manifest.name, ...playerAsset.manifest.stats, health: playerAsset.manifest.stats.health * 2 },
      wild: { formId: wild.id, name: wild.name, ...wild.stats }
    });
    return { ...state, battle, encounter: { ...state.encounter, phase: "player_turn" }, lastEvent: `${wild.name} emerged. Weaken it below 30% before capture.` };
  }

  if (input.type === "battle-action") {
    if (!state.battle || (state.encounter.phase !== "player_turn" && state.encounter.phase !== "capture_ready")) return state;
    const battle = applyBattleAction(state.battle, input.action);
    if (battle === state.battle) return state;
    if (battle.phase === "captured") {
      return { ...state, battle, encounter: { ...state.encounter, phase: "capsule" }, lastEvent: "Capture locked. Sealing the portable card now." };
    }
    const phase = battle.phase === "capture_ready" ? "capture_ready" : battle.phase === "fled" ? "fled" : battle.phase === "defeated" ? "defeated" : "player_turn";
    const last = battle.transcript.at(-1)?.detail ?? "Battle turn resolved.";
    return { ...state, battle, encounter: { ...state.encounter, phase }, lastEvent: last };
  }

  if (input.type === "search-point") {
    if (!Number.isFinite(input.x) || !Number.isFinite(input.z) || !Number.isFinite(Date.parse(input.searchedAt)) || !input.ownerReceizId.trim()) return state;
    const point = {
      x: clamp(input.x, worldBounds.min, worldBounds.max),
      z: clamp(input.z, worldBounds.min, worldBounds.max)
    };
    const result = searchHiddenHotspots(nearbyHiddenHotspots(point), point, state.capturedHotspotIds);
    const encounter = encounterFromSearch(result, point, input.searchedAt, input.ownerReceizId.trim(), state.encounter);
    const lastEvent = result.kind === "hit"
      ? `Something is moving beneath the ${result.hotspot.cover}. Keep watching.`
      : result.kind === "near_miss"
        ? `Signal ${encounter.proximity}${encounter.trend ? ` · ${encounter.trend}` : ""}. Follow the search clue.`
        : result.kind === "captured"
          ? "This hotspot is quiet now. Its sealed card is already in your inventory."
          : "Signal cold. Try another point and keep moving.";
    return { ...state, activeAction: "explore", encounter, lastEvent, lastSearchPoint: point };
  }

  if (input.type === "advance-encounter") {
    if (!Number.isFinite(Date.parse(input.at)) || !isCapturableEncounter(state.encounter)) return state;
    const encounter = state.encounter;
    if (encounter.phase === "emerging") return { ...state, encounter: { ...encounter, phase: "capsule" }, lastEvent: "Capsule locked. Sealing the portable card now." };
    if (encounter.phase === "sealed") return { ...state, encounter: { ...encounter, phase: "revealed" }, lastEvent: "Capture complete. Your verified portable card is ready." };
    if (encounter.phase !== "capsule") return state;

    const existing = state.inventory.find((asset) => asset.manifest.encounterId === encounter.hotspotId);
    if (existing) {
      return {
        ...state,
        capturedHotspotIds: Array.from(new Set([...state.capturedHotspotIds, encounter.hotspotId])),
        encounter: { ...encounter, phase: "sealed", assetId: existing.id },
        lastEvent: `${existing.manifest.name} is already sealed in your inventory.`
      };
    }
    let sealed: PortableCardAsset;
    try {
      sealed = sealCollectedCard({
        formId: encounter.formId,
        ownerReceizId: encounter.ownerReceizId,
        encounterId: encounter.hotspotId,
        capturedAt: input.at,
        battleTranscriptDigest: state.battle ? battleTranscriptDigest(state.battle) : undefined
      });
    } catch {
      return { ...state, encounter: { ...encounter, phase: "emerging" }, lastEvent: "The capsule reopened because its offline seal could not be verified." };
    }
    if (!verifyPortableCard(sealed).ok) return { ...state, encounter: { ...encounter, phase: "emerging" }, lastEvent: "The capsule reopened because its offline seal could not be verified." };
    const nextDiscovered = Array.from(new Set([...state.discoveredCardIds, sealed.manifest.familyId]));
    return withWorldProgress({
      ...state,
      beans: state.beans + 6,
      cardXp: state.cardXp + 12,
      capturedHotspotIds: [...state.capturedHotspotIds, encounter.hotspotId],
      combo: state.combo + 1,
      discoveredCardIds: nextDiscovered,
      encounter: { ...encounter, phase: "sealed", assetId: sealed.id },
      inventory: [...state.inventory, sealed],
      lastEvent: `${sealed.manifest.name} was captured and sealed as one portable card.`,
      level: nextDiscovered.length >= 3 ? Math.max(state.level, 8) : state.level,
      missionProgress: Math.min(100, state.missionProgress + 12),
      pendingSyncAssetIds: [...state.pendingSyncAssetIds, sealed.id],
      selectedAssetId: sealed.id,
      selectedCardId: sealed.manifest.familyId,
      streak: state.streak + 1
    });
  }

  if (input.type === "mark-synced" || input.type === "mark-listed") {
    if (!Number.isFinite(Date.parse(input.synchronizedAt))) return state;
    const target = state.inventory.find((asset) => asset.id === input.assetId);
    if (!target || target.status === "suspended" || target.status === "revoked") return state;
    const nextStatus = input.type === "mark-listed" ? "listed" : "verified";
    return {
      ...state,
      inventory: state.inventory.map((asset) => asset.id === input.assetId
        ? { ...asset, status: nextStatus, synchronizedAt: input.synchronizedAt }
        : asset),
      pendingSyncAssetIds: state.pendingSyncAssetIds.filter((id) => id !== input.assetId),
      lastEvent: input.type === "mark-listed"
        ? `${target.manifest.name} passed offline verification and is listed on the Exchange.`
        : `${target.manifest.name} synchronized and is Exchange eligible.`
    };
  }

  if (input.type === "evolve") {
    const previous = state.inventory.find((asset) => asset.id === input.assetId);
    if (!previous || previous.manifest.stage >= 3) return state;
    const next = creatureForm(`${previous.manifest.familyId}-${previous.manifest.stage + 1}`);
    const progress = state.companionProgress[previous.manifest.familyId] ?? { level: 1, xp: 0, bond: 0 };
    if (!next || progress.level < next.evolution.level || progress.bond < next.evolution.bond) {
      return { ...state, lastEvent: `${previous.manifest.name} needs more levels and bond before evolving.` };
    }
    const evolved = evolvePortableCard({ previous, nextFormId: next.id, evolvedAt: input.evolvedAt });
    return {
      ...state,
      inventory: state.inventory.map((asset) => asset.id === evolved.id ? evolved : asset),
      pendingSyncAssetIds: Array.from(new Set([...state.pendingSyncAssetIds, evolved.id])),
      cardXp: state.cardXp + 25,
      lastEvent: `${previous.manifest.name} evolved into ${next.name}. Its living history was sealed in place.`
    };
  }

  if (input.type === "select-card") {
    if (!state.discoveredCardIds.includes(input.cardId)) return state;
    const asset = [...state.inventory].reverse().find((candidate) => candidate.manifest.familyId === input.cardId);
    return {
      ...state,
      selectedAssetId: asset?.id ?? state.selectedAssetId,
      selectedCardId: input.cardId,
      lastEvent: `${cardName(input.cardId)} is now leading your deck.`
    };
  }

  if (input.type === "select-asset") {
    const asset = state.inventory.find((candidate) => candidate.id === input.assetId);
    if (!asset || !verifyPortableCard(asset).ok) return state;
    return {
      ...state,
      selectedAssetId: asset.id,
      selectedCardId: asset.manifest.familyId,
      lastEvent: `${asset.manifest.name} is now leading your active deck.`
    };
  }

  if (input.type === "move" || input.type === "move-vector") {
    const nextPlayer = input.type === "move"
      ? movePlayer(state.player, input.direction)
      : movePlayerVector(state.player, input.x, input.z);
    const nearest = nearestCreature({ player: nextPlayer });
    const nearbyText =
      nearest.distance <= 1.25
        ? `${nearest.card.name} is within discovery range.`
        : "Explore the wilds and look for companion signals.";

    return {
      ...state,
      activeAction: "explore",
      energy: Math.max(0, state.energy - 1),
      lastEvent: nearbyText,
      player: nextPlayer
    };
  }

  if (input.type === "rest") {
    return {
      ...state,
      activeAction: "explore",
      combo: 0,
      energy: Math.min(100, state.energy + 35),
      lastEvent: "Camp restored 35 energy. Your expedition combo reset."
    };
  }

  if (input.type === "discover" || input.type === "capture") {
    const nearest = nearestCreature(state);
    if (!nearest || nearest.distance > 1.25) {
      return {
        ...state,
        activeAction: "explore",
        lastEvent: "Move closer to a wild companion before discovering."
      };
    }

    if (state.discoveredCardIds.includes(nearest.card.id)) {
      return {
        ...state,
        activeAction: "explore",
        selectedAssetId: [...state.inventory].reverse().find((asset) => asset.manifest.familyId === nearest.card.id)?.id ?? state.selectedAssetId,
        selectedCardId: nearest.card.id,
        lastEvent: `${nearest.card.name} is already in your deck.`
      };
    }

    const encounterId = input.type === "capture" ? input.encounterId : `legacy-encounter-${nearest.card.id}`;
    const capturedAt = input.type === "capture" ? input.capturedAt : "2026-07-13T12:00:00.000Z";
    const ownerReceizId = input.type === "capture" ? input.ownerReceizId : "wilds.player.receiz.id";
    const existingEncounter = state.inventory.find((asset) => asset.manifest.encounterId === encounterId);
    if (existingEncounter) {
      return {
        ...state,
        selectedAssetId: existingEncounter.id,
        selectedCardId: existingEncounter.manifest.familyId,
        lastEvent: `${existingEncounter.manifest.name} is already sealed in your inventory.`
      };
    }
    let sealed: PortableCardAsset;
    try {
      sealed = sealCollectedCard({
        formId: `${nearest.card.id}-1`,
        ownerReceizId,
        encounterId,
        capturedAt
      });
    } catch {
      return { ...state, lastEvent: "The Receiz Capsule reopened because the local seal could not be verified. Try again." };
    }
    if (!verifyPortableCard(sealed).ok) {
      return { ...state, lastEvent: "The Receiz Capsule reopened because the local seal could not be verified. Try again." };
    }

    const nextDiscovered = [...state.discoveredCardIds, nearest.card.id];
    return withWorldProgress({
      ...state,
      activeAction: "explore",
      beans: state.beans + 6,
      cardXp: state.cardXp + 12,
      discoveredCardIds: nextDiscovered,
      inventory: [...state.inventory, sealed],
      lastEvent: `${nearest.card.name} card collected and sealed for offline use. ${nearest.card.businessLogic}.`,
      combo: state.combo + 1,
      level: nextDiscovered.length >= 3 ? Math.max(state.level, 8) : state.level,
      missionProgress: Math.min(100, state.missionProgress + 12),
      pendingSyncAssetIds: [...state.pendingSyncAssetIds, sealed.id],
      selectedAssetId: sealed.id,
      selectedCardId: nearest.card.id,
      streak: state.streak + 1
    });
  }

  if (input.type === "train") {
    const targetCardId = input.cardId ?? state.selectedCardId;
    if (!state.discoveredCardIds.includes(targetCardId)) return state;
    if (state.energy < 6) {
      return { ...state, lastEvent: "Not enough energy to train. Make camp before the next session." };
    }
    const currentProgress = state.companionProgress[targetCardId] ?? { level: 1, xp: 0, bond: 0 };
    const totalXp = currentProgress.xp + 40;
    const leveledUp = totalXp >= 100;
    const nextProgress = {
      level: Math.min(10, currentProgress.level + (leveledUp ? 1 : 0)),
      xp: leveledUp ? totalXp - 100 : totalXp,
      bond: Math.min(100, currentProgress.bond + 1)
    };

    return withWorldProgress({
      ...state,
      activeAction: "train",
      beans: state.beans + 4,
      cardXp: state.cardXp + 10,
      challenge: Math.min(100, state.challenge + 4),
      combo: state.combo + 1,
      companionProgress: { ...state.companionProgress, [targetCardId]: nextProgress },
      energy: Math.max(0, state.energy - 6),
      lastEvent: leveledUp
        ? `${cardName(targetCardId)} reached Level ${nextProgress.level}. A new mastery tier is active.`
        : `${cardName(targetCardId)} gained 40 XP and strengthened your bond.`,
      missionProgress: Math.min(100, state.missionProgress + 9),
      selectedAssetId: [...state.inventory].reverse().find((asset) => asset.manifest.familyId === targetCardId)?.id ?? state.selectedAssetId,
      selectedCardId: targetCardId,
      streak: state.streak + 1
    });
  }

  if (state.energy < 10) {
    return { ...state, lastEvent: "Not enough energy for a mission. Make camp to recover." };
  }

  const progressGain = 16 + discoveredCards(state).length * 4 + Math.floor(selectedCard(state).power / 24);
  const nextProgress = Math.min(100, state.missionProgress + progressGain);
  const earnedReward = nextProgress >= 100 && !state.rewardCards.some((reward) => reward.id === "merchant-perk");

  return withWorldProgress({
    ...state,
    activeAction: "mission",
    beans: state.beans + 10,
    cardXp: state.cardXp + 18,
    challenge: Math.min(100, state.challenge + 7),
    combo: state.combo + 1,
    completed: state.completed || earnedReward,
    energy: Math.max(0, state.energy - 10),
    lastEvent: earnedReward
      ? "Mission cleared. A brandable merchant reward card is now portable."
      : `${selectedCard(state).name} played a mission power.`,
    level: earnedReward ? Math.max(state.level, 9) : state.level,
    missionProgress: nextProgress,
    rewardCards: earnedReward
      ? [
          ...state.rewardCards,
          {
            id: "merchant-perk",
            title: "Boost Coffee Wild Perk",
            businessUse: "Merchant can map this to a coupon, VIP access, free item, or custom proof reward.",
            value: "Customizable"
          }
        ]
      : state.rewardCards,
    completedMissionIds: earnedReward
      ? Array.from(new Set([...state.completedMissionIds, "daily-expedition"]))
      : state.completedMissionIds,
    streak: state.streak + 1
  });
}

function withWorldProgress(state: PlayState): PlayState {
  const highestLevel = Math.max(1, ...Object.values(state.companionProgress).map((progress) => progress.level));
  const bossUnlocked = state.discoveredCardIds.length >= 3 && highestLevel >= 3;
  const worldRank: PlayState["worldRank"] = bossUnlocked
    ? "Titan challenger"
    : state.discoveredCardIds.length >= 3
      ? "Wilds ranger"
      : state.discoveredCardIds.length >= 2
        ? "Trail keeper"
        : "Grove scout";
  return { ...state, bossUnlocked, worldRank };
}

function movePlayer(player: PlayState["player"], direction: MoveDirection) {
  const next = { ...player };

  if (direction === "north") next.z -= worldBounds.step;
  if (direction === "south") next.z += worldBounds.step;
  if (direction === "west") next.x -= worldBounds.step;
  if (direction === "east") next.x += worldBounds.step;

  return {
    x: clamp(next.x, worldBounds.min, worldBounds.max),
    z: clamp(next.z, worldBounds.min, worldBounds.max)
  };
}

function movePlayerVector(player: PlayState["player"], x: number, z: number) {
  const safeX = Number.isFinite(x) ? x : 0;
  const safeZ = Number.isFinite(z) ? z : 0;
  const magnitude = Math.hypot(safeX, safeZ);
  if (magnitude < 0.08) return player;
  const scale = worldBounds.analogStep / Math.max(1, magnitude);
  return {
    x: clamp(player.x + safeX * scale, worldBounds.min, worldBounds.max),
    z: clamp(player.z + safeZ * scale, worldBounds.min, worldBounds.max)
  };
}

function distance2d(a: { x: number; z: number }, b: { x: number; z: number }) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function cardName(cardId: string) {
  return creatureCards.find((card) => card.id === cardId)?.name ?? "Companion";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
