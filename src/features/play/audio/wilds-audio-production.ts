import type { WildsAudioProductionMetadata } from "./wilds-audio-types";

export const WILDS_AUDIO_RUNTIME_FORMAT = "mp3_44100_128" as const;

export function plannedWildsAudioProduction(prompt: string): WildsAudioProductionMetadata {
  return {
    provider: "elevenlabs",
    prompt,
    format: WILDS_AUDIO_RUNTIME_FORMAT,
    status: "planned",
    generatedAt: null,
    rights: "original-account-generation",
  };
}

export const WILDS_AUDIO_PRODUCTION = {
  provider: "ElevenLabs",
  runtimeFormat: WILDS_AUDIO_RUNTIME_FORMAT,
  sourcePolicy: "original-only",
  runtimePolicy: "local-assets-only",
  credentialEnvironmentVariable: "ELEVENLABS_API_KEY",
} as const;
