import type { CardVariantTraits } from "./card-variant";
import type { CreatureFoil, CreatureRarity, CreatureStage, CreatureStats } from "./creature-catalog";

export type GrowthPath = "bond" | "battle" | "exploration" | "legacy" | "community" | "character";
export type TraitSource = "birth" | "parent_a" | "parent_b" | "blended" | "mutation" | "ascension";
export type GenomeTraitKey = "skeleton" | "face" | "appendages" | "surface" | "palette" | "behavior" | "aura" | "stance";
export type LivingCardStatus = "sealed_local" | "verified" | "listed" | "suspended" | "revoked";

export type LivingGrowthSnapshot = {
  bond: number;
  paths: Record<GrowthPath, number>;
  eventIds: string[];
  achievementIds: string[];
  consumedAchievementIds: string[];
  completedQuestIds: string[];
  recoveryUntil: string | null;
};

export type LivingCardGenome = {
  generatorVersion: 1;
  identityAnchor: string;
  skeleton: {
    locomotion: "biped" | "quadruped" | "serpentine" | "flying";
    head: number;
    torso: number;
    limb: number;
  };
  face: {
    identityAnchor: string;
    eye: "round" | "almond" | "star" | "crescent";
    mouth: "smile" | "muzzle" | "beak" | "fang";
    expressionSet: "gentle" | "brave" | "curious" | "mischievous";
  };
  appendages: { ears: string; horns: string; wings: string; tail: string; crest: string };
  surface: { kind: "fur" | "feather" | "scale" | "shell" | "energy"; pattern: string };
  palette: { primary: string; secondary: string; accent: string; glow: string };
  behavior: { temperament: string; idleCadenceMs: number; signatureGesture: string; battleStance: string };
  auraProfile: { kind: string; intensity: number; particle: string };
  anatomy: {
    body: "round" | "long" | "armored" | "winged" | "serpentine";
    detail: "ears" | "horns" | "wings" | "crest" | "shell" | "tail";
    aura: "leaf" | "spark" | "tide" | "ember" | "prism" | "stone";
  };
  variant: CardVariantTraits;
  provenance: Record<GenomeTraitKey, TraitSource>;
};

export type LivingCardRevisionReason = {
  kind: "birth" | "stage" | "ascension" | "parenthood";
  label: string;
};

export type LivingCardRevision = {
  revision: number;
  previousRevisionDigest: string | null;
  digest: string;
  sealedAt: string;
  kaiPulse: string;
  reason: LivingCardRevisionReason;
  stage: CreatureStage;
  ascensionRank: number;
  formId: string;
  growth: LivingGrowthSnapshot;
  qualifyingAchievementIds: string[];
  consumedCatalystId: string | null;
  genomeDelta: Partial<LivingCardGenome>;
  genomeDigest: string;
  stats: CreatureStats;
  abilityNames: readonly [string, string];
  title: string;
  rendererVersion: 1;
  renderedArtDigest: string;
  childEventIds: string[];
};

export type LivingCardRevisionDraft = Omit<
  LivingCardRevision,
  "revision" | "previousRevisionDigest" | "digest" | "genomeDigest" | "rendererVersion" | "renderedArtDigest"
>;

export type LivingCardBirth = {
  kind: "legacy_admission" | "capture" | "starter" | "fusion";
  bornAt: string;
  formId: string;
  legacyDigest: string | null;
};

export type LivingLineage = {
  rootAssetId: string;
  rootDigest: string;
  previousAssetId: string | null;
  previousDigest: string | null;
  evolvedAt: string | null;
  parentAssetIds?: [string, string];
  parentDigests?: [string, string];
  fusionSparkId?: string;
  childAssetIds: string[];
};

export type LivingCardManifest = {
  schema: "receiz.wilds_living_card_manifest.v2";
  catalogVersion: "receiz.wilds.catalog.v1";
  assetId: string;
  formId: string;
  familyId: string;
  stage: CreatureStage;
  cardNumber: string;
  name: string;
  species: string;
  rarity: CreatureRarity;
  foil: CreatureFoil;
  stats: CreatureStats;
  abilityNames: readonly [string, string];
  ownerReceizId: string;
  encounterId: string;
  capturedAt: string;
  variant: {
    generatorVersion: 1;
    seed: string;
    traitsDigest: string;
    kaiPulse: string;
    battleTranscriptDigest: string;
    traits: CardVariantTraits;
  };
  lineage: LivingLineage;
  birth: LivingCardBirth;
  birthGenome: LivingCardGenome;
  currentRevision: number;
  revisions: LivingCardRevision[];
};

export type LivingCardAsset = {
  id: string;
  status: LivingCardStatus;
  synchronizedAt: string | null;
  manifest: LivingCardManifest;
  proof: {
    kind: "receiz.wilds_living_seal.v2";
    digest: string;
    canonicalization: "receiz.sorted-json.v1";
    sealedAt: string;
  };
};

export function isLivingCardAsset(value: unknown): value is LivingCardAsset {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { manifest?: { schema?: unknown } };
  return candidate.manifest?.schema === "receiz.wilds_living_card_manifest.v2";
}
