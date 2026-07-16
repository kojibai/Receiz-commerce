import type { WildsAudioCue } from "../wilds-audio";
import { WILDS_NAMED_REGIONS } from "../wilds-world-geography";
import { WILDS_AUDIO_ASSETS } from "./wilds-audio-catalog";
import type {
  WildsAudioAsset,
  WildsAudioBankId,
  WildsNamedRegionAudioBank,
} from "./wilds-audio-types";
import type { WildsAudioPosition, WildsSpatialProjection } from "./wilds-spatial-audio";
import { projectWildsSpatialEmitter } from "./wilds-spatial-audio";

export type WildsAudioIdentity =
  | "organic-mythic-scifi"
  | "epic-high-fantasy"
  | "futuristic-electronic";

export type WildsMusicIntensity =
  | "exploration"
  | "wonder"
  | "tension"
  | "encounter"
  | "battle"
  | "boss"
  | "raid"
  | "aftermath";

export type WildsAudioWorldState = Readonly<{
  position: WildsAudioPosition;
  intensity: WildsMusicIntensity;
  ecologyBank?: `ecology:${string}` | null;
  bossBank?: `boss:${string}` | null;
  dialogueActive?: boolean;
}>;

export type WildsSemanticAudioEvent = Readonly<{
  type: "effect";
  cue: WildsAudioCue;
  emitterId?: string;
  position?: WildsAudioPosition;
  maxDistance?: number;
}>;

export type WildsAudioPlayRequest = Readonly<{
  asset: WildsAudioAsset;
  variantIndex: number;
  event: WildsSemanticAudioEvent;
  spatial: WildsSpatialProjection | null;
}>;

export type WildsAudioStreamTransition = Readonly<{
  asset: WildsAudioAsset;
  crossfadeMs: number;
}>;

export type WildsAudioDirectorHarness = Readonly<{
  assets?: readonly WildsAudioAsset[];
  now?: () => number;
  play: (request: WildsAudioPlayRequest) => void | Promise<void>;
  transitionStream?: (request: WildsAudioStreamTransition) => void | Promise<void>;
  preloadBank?: (bank: WildsAudioBankId) => void | Promise<void>;
  retainBanks?: (banks: ReadonlySet<WildsAudioBankId>) => void;
  setDialogueActive?: (active: boolean) => void;
}>;

const REGION_IDENTITIES: Readonly<Record<WildsNamedRegionAudioBank, WildsAudioIdentity>> = {
  "verdant-heartlands": "organic-mythic-scifi",
  amberweald: "organic-mythic-scifi",
  "echo-highlands": "epic-high-fantasy",
  "moonwater-reach": "epic-high-fantasy",
  "prism-coast": "futuristic-electronic",
};

export function regionAudioBankForPosition(position: Pick<WildsAudioPosition, "x" | "z">): WildsNamedRegionAudioBank {
  return WILDS_NAMED_REGIONS
    .map((region) => ({
      id: region.id,
      distance: Math.hypot(region.position.x - position.x, region.position.z - position.z),
    }))
    .sort((left, right) => left.distance - right.distance || left.id.localeCompare(right.id))[0]!
    .id;
}

export function regionAudioIdentityForPosition(position: Pick<WildsAudioPosition, "x" | "z">): WildsAudioIdentity {
  return REGION_IDENTITIES[regionAudioBankForPosition(position)];
}

function catalogMusicState(intensity: WildsMusicIntensity) {
  if (intensity === "encounter") return "tension";
  if (intensity === "boss" || intensity === "raid") return "battle";
  return intensity;
}

export function createWildsAudioDirector(harness: WildsAudioDirectorHarness) {
  const assets = new Map((harness.assets ?? WILDS_AUDIO_ASSETS).map((asset) => [asset.id, asset] as const));
  const now = harness.now ?? Date.now;
  const cooldowns = new Map<string, number>();
  const activeCounts = new Map<string, number>();
  const variantSequences = new Map<string, number>();
  let listener: WildsAudioPosition = { x: 0, y: 0, z: 0 };
  let currentAmbienceId: string | null = null;
  let currentMusicId: string | null = null;
  let worldState: WildsAudioWorldState | null = null;
  let disposed = false;

  const transition = async (id: string, current: "ambience" | "music") => {
    const asset = assets.get(id);
    if (!asset) return;
    if (current === "ambience" && currentAmbienceId === id) return;
    if (current === "music" && currentMusicId === id) return;
    await harness.transitionStream?.({ asset, crossfadeMs: current === "music" ? 1_600 : 900 });
    if (current === "ambience") currentAmbienceId = id;
    else currentMusicId = id;
  };

  return {
    async emit(event: WildsSemanticAudioEvent) {
      if (disposed) return false;
      const asset = assets.get(`effects.${event.cue}`);
      if (!asset) return false;
      const emitterKey = event.emitterId ?? "global";
      const cooldownKey = `${asset.id}:${emitterKey}`;
      const timestamp = now();
      const lastPlayed = cooldowns.get(cooldownKey);
      if (lastPlayed !== undefined && timestamp - lastPlayed < asset.cooldownMs) return false;
      const active = activeCounts.get(asset.id) ?? 0;
      if (active >= asset.maxConcurrent) return false;

      const spatial = asset.spatial && event.position
        ? projectWildsSpatialEmitter({
            listener,
            source: event.position,
            maxDistance: event.maxDistance ?? 48,
          })
        : null;
      if (spatial && !spatial.audible) return false;

      const sequence = variantSequences.get(asset.id) ?? 0;
      const variantIndex = sequence % asset.variants.length;
      variantSequences.set(asset.id, sequence + 1);
      cooldowns.set(cooldownKey, timestamp);
      activeCounts.set(asset.id, active + 1);
      try {
        await harness.play({ asset, variantIndex, event, spatial });
        return true;
      } finally {
        const remaining = (activeCounts.get(asset.id) ?? 1) - 1;
        if (remaining > 0) activeCounts.set(asset.id, remaining);
        else activeCounts.delete(asset.id);
      }
    },
    async updateWorld(next: WildsAudioWorldState) {
      if (disposed) return;
      listener = next.position;
      worldState = next;
      const region = regionAudioBankForPosition(next.position);
      const banks = new Set<WildsAudioBankId>(["global", region]);
      if (next.ecologyBank) banks.add(next.ecologyBank);
      if (next.bossBank) banks.add(next.bossBank);
      harness.retainBanks?.(banks);
      await Promise.allSettled([...banks].map((bank) => harness.preloadBank?.(bank)));
      harness.setDialogueActive?.(next.dialogueActive ?? false);
      await transition(`ambience.${region}.day`, "ambience");
      await transition(`music.${region}.${catalogMusicState(next.intensity)}`, "music");
    },
    snapshot() {
      return {
        currentAmbienceId,
        currentMusicId,
        region: worldState ? regionAudioBankForPosition(worldState.position) : null,
        identity: worldState ? regionAudioIdentityForPosition(worldState.position) : null,
        intensity: worldState?.intensity ?? null,
        activeVoices: [...activeCounts.values()].reduce((total, count) => total + count, 0),
        disposed,
      };
    },
    dispose() {
      disposed = true;
      cooldowns.clear();
      activeCounts.clear();
      variantSequences.clear();
    },
  };
}
