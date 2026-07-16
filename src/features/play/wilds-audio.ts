import type { WildsEcologyFamilyId } from "./wilds-ecology";
import type { WildsBossFamilyId } from "./wilds-boss-ecology";
import { createWildsAudioLoader, type WildsDecodedAudioBuffer } from "./audio/wilds-audio-loader";
import { createWildsAudioMixer, type WildsGainNodeLike } from "./audio/wilds-audio-mixer";

export type WildsAudioSettings = {
  master: number;
  effects: number;
  ambience: number;
  music: number;
  muted: boolean;
};

export type WildsAudioCue =
  | "search"
  | "proximity-warm"
  | "proximity-hot"
  | "rustle"
  | "emerge"
  | "battle-hit"
  | "capture"
  | "seal"
  | "reveal"
  | "evolve"
  | "lineage"
  | "player-arrival"
  | "weather-pollen"
  | "landmark-near"
  | "settlement-arrival"
  | "settlement-service"
  | "route-step"
  | "route-complete"
  | "foliage-surge"
  | "ecology-rumor"
  | "ecology-step"
  | "ecology-resolved"
  | "ecology-market"
  | "ecology-ruin"
  | "ecology-portal"
  | "ecology-festival"
  | "ecology-migration"
  | "ecology-bloom"
  | "ecology-storm"
  | "ecology-distress"
  | "boss-crystal"
  | "boss-skycoil"
  | "boss-mirecrown"
  | "boss-embermane"
  | "boss-tidal"
  | "boss-echo"
  | "boss-lumen"
  | "boss-voidroot"
  | "boss-action"
  | "boss-transform"
  | "boss-vulnerable"
  | "boss-defeat"
  | "confirm"
  | "error";

export type WildsEncounterAudioState = {
  phase: string;
  proximity?: string;
};

export const DEFAULT_WILDS_AUDIO_SETTINGS: WildsAudioSettings = {
  master: 0.72,
  effects: 0.82,
  ambience: 0.42,
  music: 0.3,
  muted: false
};

type BufferSourceLike = {
  buffer: WildsDecodedAudioBuffer | null;
  onended: (() => void) | null;
  connect(target: unknown): void;
  disconnect(): void;
  start(time?: number): void;
  stop(time?: number): void;
};

type WildsMediaLike = {
  src: string;
  loop: boolean;
  volume: number;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
};

export type WildsAudioContextLike = {
  currentTime: number;
  destination: unknown;
  resume(): Promise<void>;
  close(): Promise<void>;
  createGain(): WildsGainNodeLike;
  createBufferSource(): BufferSourceLike;
  decodeAudioData(data: ArrayBuffer): Promise<WildsDecodedAudioBuffer>;
};

export function settlementAudioCue(action: "arrival" | "service" | "route-step" | "route-complete"): WildsAudioCue {
  return action === "arrival" ? "settlement-arrival"
    : action === "service" ? "settlement-service"
      : action === "route-step" ? "route-step"
        : "route-complete";
}

const ECOLOGY_FAMILY_CUES: Record<WildsEcologyFamilyId, WildsAudioCue> = {
  "wandering-market": "ecology-market",
  "echo-ruin": "ecology-ruin",
  "unstable-portal": "ecology-portal",
  "convergence-festival": "ecology-festival",
  "creature-migration": "ecology-migration",
  "resource-bloom": "ecology-bloom",
  stormfront: "ecology-storm",
  "settlement-distress": "ecology-distress"
};

export function ecologyAudioCue(action: "rumor" | "discovered" | "step" | "resolved", familyId: WildsEcologyFamilyId): WildsAudioCue {
  return action === "rumor" ? "ecology-rumor"
    : action === "step" ? "ecology-step"
      : action === "resolved" ? "ecology-resolved"
        : ECOLOGY_FAMILY_CUES[familyId];
}

const BOSS_FAMILY_CUES: Record<WildsBossFamilyId, WildsAudioCue> = {
  "crystal-burrower": "boss-crystal", "skycoil-tempest": "boss-skycoil", "mirecrown-colossus": "boss-mirecrown",
  "embermane-siegebeast": "boss-embermane", "tidal-prism-leviathan": "boss-tidal", "echo-antler-warden": "boss-echo",
  "lumen-moth-sovereign": "boss-lumen", "voidroot-devourer": "boss-voidroot"
};

export function bossAudioCue(action: "telegraph" | "action" | "transform" | "vulnerable" | "defeat", familyId: WildsBossFamilyId): WildsAudioCue {
  return action === "action" ? "boss-action" : action === "transform" ? "boss-transform" : action === "vulnerable" ? "boss-vulnerable" : action === "defeat" ? "boss-defeat" : BOSS_FAMILY_CUES[familyId];
}

function clampUnit(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

export function normalizeWildsAudioSettings(value: unknown): WildsAudioSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_WILDS_AUDIO_SETTINGS };
  const candidate = value as Partial<WildsAudioSettings>;
  return {
    master: clampUnit(candidate.master, DEFAULT_WILDS_AUDIO_SETTINGS.master),
    effects: clampUnit(candidate.effects, DEFAULT_WILDS_AUDIO_SETTINGS.effects),
    ambience: clampUnit(candidate.ambience, DEFAULT_WILDS_AUDIO_SETTINGS.ambience),
    music: clampUnit(candidate.music, DEFAULT_WILDS_AUDIO_SETTINGS.music),
    muted: typeof candidate.muted === "boolean" ? candidate.muted : DEFAULT_WILDS_AUDIO_SETTINGS.muted
  };
}

export function audioCuesForTransition(
  previous: WildsEncounterAudioState,
  next: WildsEncounterAudioState
): WildsAudioCue[] {
  if (previous.phase === next.phase && previous.proximity === next.proximity) return [];
  if (previous.phase === "hint" && next.phase === "hint") {
    if (next.proximity === "hot") return ["proximity-hot", "foliage-surge"];
    if (next.proximity === "warm") return ["proximity-warm"];
  }
  if (next.phase === "searching") return ["search"];
  if (next.phase === "hint") {
    const proximityCue = next.proximity === "hot"
      ? "proximity-hot"
      : next.proximity === "warm" ? "proximity-warm" : null;
    return ["search", proximityCue, "rustle"].filter((cue): cue is WildsAudioCue => cue !== null);
  }
  if (next.phase === "emerging") return ["emerge"];
  if (next.phase === "capsule") return ["capture"];
  if (next.phase === "sealed") return ["seal"];
  if (next.phase === "revealed") return ["reveal"];
  return [];
}

export function createWildsAudioRuntime(
  factory: () => WildsAudioContextLike,
  options: {
    fetchImpl?: typeof fetch;
    createMedia?: (url: string) => WildsMediaLike;
  } = {}
) {
  let context: WildsAudioContextLike | null = null;
  let loader: ReturnType<typeof createWildsAudioLoader> | null = null;
  let mixer: ReturnType<typeof createWildsAudioMixer> | null = null;
  let settings = { ...DEFAULT_WILDS_AUDIO_SETTINGS };
  let destroyed = false;
  let ambience: WildsMediaLike | null = null;
  const activeSources = new Set<BufferSourceLike>();

  const createMedia = options.createMedia ?? ((url: string) => {
    const media = new Audio(url);
    return media;
  });

  const play = (cue: WildsAudioCue) => {
    if (!context || !loader || !mixer || destroyed || settings.muted) return;
    void loader.load(`effects.${cue}`).then((loaded) => {
      if (!context || !mixer || !loaded.buffer || destroyed || settings.muted) return;
      const source = context.createBufferSource();
      source.buffer = loaded.buffer;
      source.connect(mixer.input(loaded.asset.bus));
      source.onended = () => {
        activeSources.delete(source);
        source.disconnect();
      };
      activeSources.add(source);
      source.start(context.currentTime);
    }).catch(() => {
      // Missing production audio degrades to silence and remains visible in loader diagnostics.
    });
  };

  const stopAmbience = () => {
    if (!ambience) return;
    ambience.pause();
    ambience.currentTime = 0;
    ambience = null;
  };

  return {
    async unlock() {
      if (destroyed) return;
      context ??= factory();
      await context.resume();
      mixer ??= createWildsAudioMixer(context);
      loader ??= createWildsAudioLoader({
        fetchImpl: options.fetchImpl,
        decode: (data) => context!.decodeAudioData(data),
      });
      mixer.setSettings({ ...settings, creatures: 0.72, dialogue: 0.9 });
    },
    setSettings(next: WildsAudioSettings) {
      settings = normalizeWildsAudioSettings(next);
      mixer?.setSettings({ ...settings, creatures: 0.72, dialogue: 0.9 });
      if (ambience) ambience.volume = settings.master * settings.ambience;
      if (settings.muted) stopAmbience();
    },
    play,
    startAmbience() {
      if (!context || !loader || destroyed || settings.muted || ambience) return;
      void loader.load("ambience.verdant-heartlands.day").then((loaded) => {
        if (ambience || destroyed || settings.muted) return;
        const media = createMedia(loaded.variantUrl);
        media.loop = true;
        media.volume = settings.master * settings.ambience;
        ambience = media;
        return media.play();
      }).catch(() => {
        stopAmbience();
      });
    },
    stopAmbience,
    async destroy() {
      if (destroyed) return;
      destroyed = true;
      stopAmbience();
      for (const source of activeSources) {
        try { source.stop(); } catch { /* The source may already have ended. */ }
        source.disconnect();
      }
      activeSources.clear();
      loader?.dispose();
      mixer?.dispose();
      loader = null;
      mixer = null;
      const activeContext = context;
      context = null;
      if (activeContext) await activeContext.close();
    }
  };
}
