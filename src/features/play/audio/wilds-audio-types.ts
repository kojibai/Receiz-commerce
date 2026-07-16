export type WildsAudioBus = "music" | "ambience" | "effects" | "creatures" | "dialogue";

export type WildsAudioAssetId = string;

export type WildsNamedRegionAudioBank =
  | "verdant-heartlands"
  | "amberweald"
  | "echo-highlands"
  | "moonwater-reach"
  | "prism-coast";

export type WildsAudioBankId =
  | "global"
  | WildsNamedRegionAudioBank
  | `ecology:${string}`
  | `boss:${string}`
  | `creature:${string}`
  | `voice:${string}`;

export type WildsAudioVariant = Readonly<{
  url: string;
  durationSeconds: number;
  loop: boolean;
  gain: number;
}>;

export type WildsAudioProductionMetadata = Readonly<{
  provider: "internal-authored" | "open-source-offline" | "recorded-original";
  prompt: string;
  format: "mp3_44100_128";
  status: "planned" | "generated";
  generatedAt: string | null;
  sourceTool?: string;
  rights: "original-authored" | "original-recording" | "open-source-generated";
}>;

export type WildsAudioAsset = Readonly<{
  id: WildsAudioAssetId;
  bus: WildsAudioBus;
  bank: WildsAudioBankId;
  priority: number;
  cooldownMs: number;
  maxConcurrent: number;
  stream: boolean;
  spatial: boolean;
  variants: readonly WildsAudioVariant[];
  production: WildsAudioProductionMetadata;
}>;

export type WildsAudioCatalog = ReadonlyMap<WildsAudioAssetId, WildsAudioAsset>;
