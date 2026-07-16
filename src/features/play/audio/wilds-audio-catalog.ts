import { WILDS_BOSS_FAMILIES } from "../wilds-boss-ecology";
import { WILDS_ECOLOGY_FAMILIES } from "../wilds-ecology";
import hearttreeManifest from "../../../../public/audio/wilds/hearttree/manifest.json" with { type: "json" };
import { plannedWildsAudioProduction, plannedWildsRecordedVoice } from "./wilds-audio-production";
import type {
  WildsAudioAsset,
  WildsAudioAssetId,
  WildsAudioBankId,
  WildsAudioBus,
  WildsNamedRegionAudioBank,
} from "./wilds-audio-types";

export const WILDS_NAMED_AUDIO_BANKS = [
  "verdant-heartlands",
  "amberweald",
  "echo-highlands",
  "moonwater-reach",
  "prism-coast",
] as const satisfies readonly WildsNamedRegionAudioBank[];

export const WILDS_PRODUCTION_EFFECT_CUES = [
  "search",
  "proximity-warm",
  "proximity-hot",
  "rustle",
  "emerge",
  "battle-hit",
  "capture",
  "seal",
  "reveal",
  "evolve",
  "lineage",
  "player-arrival",
  "weather-pollen",
  "landmark-near",
  "settlement-arrival",
  "settlement-service",
  "route-step",
  "route-complete",
  "foliage-surge",
  "ecology-rumor",
  "ecology-step",
  "ecology-resolved",
  "ecology-market",
  "ecology-ruin",
  "ecology-portal",
  "ecology-festival",
  "ecology-migration",
  "ecology-bloom",
  "ecology-storm",
  "ecology-distress",
  "boss-crystal",
  "boss-skycoil",
  "boss-mirecrown",
  "boss-embermane",
  "boss-tidal",
  "boss-echo",
  "boss-lumen",
  "boss-voidroot",
  "boss-action",
  "boss-transform",
  "boss-vulnerable",
  "boss-defeat",
  "confirm",
  "error",
] as const;

const REGION_STATES = ["exploration", "wonder", "tension", "battle", "aftermath"] as const;
const CREATURE_BEHAVIORS = ["idle", "notice", "movement", "attack", "hurt", "bond", "capture", "victory", "evolution"] as const;

function asset(input: {
  id: WildsAudioAssetId;
  bus: WildsAudioBus;
  bank: WildsAudioBankId;
  path: string;
  prompt: string;
  loop?: boolean;
  stream?: boolean;
  spatial?: boolean;
  durationSeconds?: number;
  gain?: number;
  priority?: number;
  cooldownMs?: number;
  maxConcurrent?: number;
}): WildsAudioAsset {
  return {
    id: input.id,
    bus: input.bus,
    bank: input.bank,
    priority: input.priority ?? 50,
    cooldownMs: input.cooldownMs ?? 80,
    maxConcurrent: input.maxConcurrent ?? 4,
    stream: input.stream ?? false,
    spatial: input.spatial ?? false,
    variants: [{
      url: `/audio/wilds/${input.path}.mp3`,
      durationSeconds: input.durationSeconds ?? 1,
      loop: input.loop ?? false,
      gain: input.gain ?? 1,
    }],
    production: plannedWildsAudioProduction(input.prompt),
  };
}

const effectAssets = WILDS_PRODUCTION_EFFECT_CUES.map((cue) => asset({
  id: `effects.${cue}`,
  bus: "effects",
  bank: "global",
  path: `global/effects/${cue}-01`,
  prompt: `Short ${cue.replaceAll("-", " ")} sound for premium adaptive Wilds adventure gameplay, tactile organic and crystalline source, clear transient, controlled cinematic tail, no music, no voice, readable under a dense gameplay mix.`,
  spatial: cue !== "confirm" && cue !== "error",
  priority: cue.startsWith("boss-") ? 85 : cue === "error" ? 80 : 55,
  cooldownMs: cue === "battle-hit" ? 90 : 140,
}));

const regionalAssets = WILDS_NAMED_AUDIO_BANKS.flatMap((region) => [
  asset({
    id: `ambience.${region}.day`,
    bus: "ambience",
    bank: region,
    path: `regions/${region}/ambience-day-01`,
    prompt: `Seamless ${region.replaceAll("-", " ")} environmental ambience for the official Wilds world, detailed natural location bed with authored regional identity, gentle movement and distant life, no melody, no voice, no sharp foreground events.`,
    loop: true,
    stream: true,
    spatial: false,
    durationSeconds: 18,
    gain: 0.8,
    priority: 20,
    maxConcurrent: 1,
  }),
  ...REGION_STATES.map((state) => asset({
    id: `music.${region}.${state}`,
    bus: "music",
    bank: region,
    path: `regions/${region}/music-${state}-01`,
    prompt: `Seamless adaptive ${state} music stem for ${region.replaceAll("-", " ")} in the official Wilds score, region-authentic instrumentation, shared Receiz leitmotif, cinematic dynamics, loop-safe ending, no dialogue, no sound effects.`,
    loop: true,
    stream: true,
    durationSeconds: 20,
    gain: 0.72,
    priority: state === "battle" ? 72 : 30,
    maxConcurrent: 1,
  })),
]);

const ecologyAssets = WILDS_ECOLOGY_FAMILIES.map((family) => asset({
  id: `ecology.${family}.active`,
  bus: "ambience",
  bank: `ecology:${family}`,
  path: `ecology/${family}/active-loop-01`,
  prompt: `Seamless ${family.replaceAll("-", " ")} living-world event ambience for premium Wilds gameplay, recognizable material identity, spatial environmental movement, restrained cinematic tension, no dialogue, no melody, loop-safe tail.`,
  loop: true,
  stream: true,
  spatial: true,
  durationSeconds: 14,
  priority: 42,
  maxConcurrent: 1,
}));

const bossAssets = WILDS_BOSS_FAMILIES.map((family) => asset({
  id: `boss.${family}.presence`,
  bus: "creatures",
  bank: `boss:${family}`,
  path: `bosses/${family}/presence-01`,
  prompt: `Distant territory presence for the fictional ${family.replaceAll("-", " ")} global boss in premium Wilds gameplay, enormous physical creature performance and environmental resonance, threatening but readable, no speech, no music.`,
  spatial: true,
  durationSeconds: 4,
  gain: 0.9,
  priority: 88,
  cooldownMs: 6_000,
  maxConcurrent: 1,
}));

const creatureAssets = CREATURE_BEHAVIORS.map((behavior) => asset({
  id: `creatures.anatomy.${behavior}`,
  bus: "creatures",
  bank: "creature:anatomy",
  path: `creatures/anatomy/${behavior}-01`,
  prompt: `Original fictional creature ${behavior} vocal source performance for premium Wilds gameplay, layered breath throat and body resonance, emotionally readable, natural transient and tail, no human speech, no music.`,
  spatial: true,
  durationSeconds: behavior === "evolution" ? 2.5 : 1.2,
  priority: behavior === "attack" || behavior === "hurt" ? 70 : 45,
  cooldownMs: behavior === "idle" ? 4_000 : 250,
  maxConcurrent: 3,
}));

const narratorArrival = asset({
  id: "voice.narrator.heartlands-arrival",
  bus: "dialogue",
  bank: "voice:narrator",
  path: "voice/narrator/heartlands-arrival-01",
  prompt: "Human-sounding cinematic narrator with grounded warmth and quiet wonder, clear contemporary English, intimate natural delivery, welcoming a traveler into the living Verdant Heartlands without theatrical exaggeration.",
  stream: true,
  durationSeconds: 5,
  priority: 96,
  cooldownMs: 60_000,
  maxConcurrent: 1,
});

const voiceAssets = [{
  ...narratorArrival,
  production: plannedWildsRecordedVoice(narratorArrival.production.prompt),
}];

export const HEARTTREE_AUDIO_ASSETS: readonly WildsAudioAsset[] = hearttreeManifest.assets.map((entry) => {
  const bus: WildsAudioBus = entry.group === "music" || entry.group === "motif"
    ? "music"
    : entry.group === "ambience" ? "ambience" : "effects";
  const stream = entry.group === "music" || entry.group === "ambience";
  return {
    id: entry.id,
    bus,
    bank: "hearttree",
    priority: entry.group === "death" ? 100 : entry.group === "boss" ? 90 : stream ? 35 : 70,
    cooldownMs: entry.group === "movement" ? 120 : entry.group === "motif" ? 8_000 : 80,
    maxConcurrent: entry.group === "motif" ? 3 : stream ? 1 : 4,
    stream,
    spatial: false,
    variants: [{
      url: entry.file,
      durationSeconds: entry.durationSeconds,
      loop: stream,
      gain: entry.group === "ambience" ? 0.72 : entry.group === "motif" ? 0.28 : 0.9,
    }],
    production: {
      provider: "open-source-offline",
      prompt: `Offline Hearttree ${entry.group} render from license-audited real recorded material. Sources: ${entry.source.join(", ")}.`,
      format: "mp3_44100_128",
      status: "generated",
      generatedAt: hearttreeManifest.generatedAt,
      sourceTool: "ffmpeg offline render pipeline",
      rights: "open-source-generated",
    },
  };
});

export const WILDS_AUDIO_ASSETS: readonly WildsAudioAsset[] = [
  ...HEARTTREE_AUDIO_ASSETS,
  ...effectAssets,
  ...regionalAssets,
  ...ecologyAssets,
  ...bossAssets,
  ...creatureAssets,
  ...voiceAssets,
];

const REQUIRED_AUDIO_IDS = [
  ...WILDS_PRODUCTION_EFFECT_CUES.map((cue) => `effects.${cue}`),
  ...WILDS_NAMED_AUDIO_BANKS.flatMap((region) => [
    `ambience.${region}.day`,
    ...REGION_STATES.map((state) => `music.${region}.${state}`),
  ]),
  ...WILDS_ECOLOGY_FAMILIES.map((family) => `ecology.${family}.active`),
  ...WILDS_BOSS_FAMILIES.map((family) => `boss.${family}.presence`),
  ...CREATURE_BEHAVIORS.map((behavior) => `creatures.anatomy.${behavior}`),
  "voice.narrator.heartlands-arrival",
] as const;

export function requiredWildsAudioCoverage(): readonly WildsAudioAssetId[] {
  return REQUIRED_AUDIO_IDS;
}

export const WILDS_AUDIO_CATALOG = new Map(
  WILDS_AUDIO_ASSETS.map((entry) => [entry.id, entry] as const),
);
