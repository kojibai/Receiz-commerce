import type { WildsAudioProductionMetadata } from "./wilds-audio-types";

export const WILDS_AUDIO_RUNTIME_FORMAT = "mp3_44100_128" as const;

export function plannedWildsAudioProduction(prompt: string): WildsAudioProductionMetadata {
  return {
    provider: "internal-authored",
    prompt,
    format: WILDS_AUDIO_RUNTIME_FORMAT,
    status: "planned",
    generatedAt: null,
    rights: "original-authored",
  };
}

export function plannedWildsRecordedVoice(prompt: string): WildsAudioProductionMetadata {
  return {
    provider: "recorded-original",
    prompt,
    format: WILDS_AUDIO_RUNTIME_FORMAT,
    status: "planned",
    generatedAt: null,
    rights: "original-recording",
  };
}

export const WILDS_AUDIO_PRODUCTION = {
  provider: "Internal authored or open-source offline tooling",
  runtimeFormat: WILDS_AUDIO_RUNTIME_FORMAT,
  sourcePolicy: "original-or-license-audited-open-source",
  runtimePolicy: "local-assets-native-web-audio-only",
  externalService: false,
  runtimeAudioDependencies: [] as const,
  credentialEnvironmentVariable: null,
} as const;
