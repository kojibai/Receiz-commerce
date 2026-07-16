import type { WildsAudioBus } from "./wilds-audio-types";

export type WildsAudioMixerSettings = Readonly<{
  master: number;
  music: number;
  ambience: number;
  effects: number;
  creatures: number;
  dialogue: number;
  muted: boolean;
}>;

type GainParamLike = {
  value: number;
  setValueAtTime(value: number, time: number): void;
  linearRampToValueAtTime(value: number, time: number): void;
};

export type WildsGainNodeLike = {
  gain: GainParamLike;
  connect(target: unknown): void;
  disconnect(): void;
};

export type WildsMixerContextLike = {
  currentTime: number;
  destination: unknown;
  createGain(): WildsGainNodeLike;
};

const BUS_NAMES = ["music", "ambience", "effects", "creatures", "dialogue"] as const satisfies readonly WildsAudioBus[];
const DIALOGUE_MUSIC_DUCK = 0.52;
const DIALOGUE_AMBIENCE_DUCK = 0.62;

const DEFAULT_MIXER_SETTINGS: WildsAudioMixerSettings = {
  master: 0.72,
  music: 0.3,
  ambience: 0.42,
  effects: 0.82,
  creatures: 0.72,
  dialogue: 0.9,
  muted: false,
};

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function createWildsAudioMixer(context: WildsMixerContextLike) {
  const master = context.createGain();
  const buses = new Map<WildsAudioBus, WildsGainNodeLike>();
  let settings = { ...DEFAULT_MIXER_SETTINGS };
  let dialogueActive = false;
  let disposed = false;

  master.connect(context.destination);
  for (const name of BUS_NAMES) {
    const node = context.createGain();
    node.connect(master);
    buses.set(name, node);
  }

  const targetGain = (bus: WildsAudioBus) => {
    const base = settings[bus];
    if (bus === "music" && dialogueActive) return base * DIALOGUE_MUSIC_DUCK;
    if (bus === "ambience" && dialogueActive) return base * DIALOGUE_AMBIENCE_DUCK;
    return base;
  };

  const apply = () => {
    const now = context.currentTime;
    master.gain.setValueAtTime(settings.muted ? 0 : settings.master, now);
    for (const name of BUS_NAMES) {
      buses.get(name)?.gain.linearRampToValueAtTime(targetGain(name), now + 0.06);
    }
  };

  apply();

  return {
    input(bus: WildsAudioBus) {
      return buses.get(bus) ?? master;
    },
    setSettings(next: WildsAudioMixerSettings) {
      settings = {
        master: clamp(next.master),
        music: clamp(next.music),
        ambience: clamp(next.ambience),
        effects: clamp(next.effects),
        creatures: clamp(next.creatures),
        dialogue: clamp(next.dialogue),
        muted: next.muted,
      };
      apply();
    },
    setMuted(muted: boolean) {
      settings = { ...settings, muted };
      apply();
    },
    setDialogueActive(active: boolean) {
      dialogueActive = active;
      apply();
    },
    snapshot() {
      return {
        masterGain: settings.muted ? 0 : settings.master,
        musicGain: targetGain("music"),
        ambienceGain: targetGain("ambience"),
        effectsGain: targetGain("effects"),
        creaturesGain: targetGain("creatures"),
        dialogueGain: targetGain("dialogue"),
        musicDucked: dialogueActive,
        disposed,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const node of buses.values()) node.disconnect();
      buses.clear();
      master.disconnect();
    },
  };
}
