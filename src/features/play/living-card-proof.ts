import { displayCreatureName } from "./card-variant";
import { creatureForm } from "./creature-catalog";
import {
  canonicalPortableCardJson,
  sha256PortableBasis,
  verifyPortableCard,
  type LegacyPortableCardAsset,
  type PortableCardVerification
} from "./portable-card";
import {
  isLivingCardAsset,
  type LivingCardAsset,
  type LivingCardGenome,
  type LivingCardManifest,
  type LivingCardRevision,
  type LivingCardRevisionDraft,
  type LivingGrowthSnapshot
} from "./living-card-types";

const DIGEST = /^sha256:[a-f0-9]{64}$/;

export function emptyLivingGrowth(bond = 0): LivingGrowthSnapshot {
  return {
    bond,
    paths: { bond, battle: 0, exploration: 0, legacy: 0, community: 0, character: 0 },
    achievementIds: [],
    consumedAchievementIds: [],
    completedQuestIds: [],
    recoveryUntil: null
  };
}

function mergeGenome(previous: LivingCardGenome, delta: Partial<LivingCardGenome>): LivingCardGenome {
  return {
    ...previous,
    ...delta,
    anatomy: { ...previous.anatomy, ...(delta.anatomy ?? {}) },
    variant: {
      ...previous.variant,
      ...(delta.variant ?? {}),
      palette: { ...previous.variant.palette, ...(delta.variant?.palette ?? {}) }
    },
    provenance: { ...previous.provenance, ...(delta.provenance ?? {}) }
  };
}

export function livingGenomeDigest(genome: LivingCardGenome) {
  return sha256PortableBasis(canonicalPortableCardJson(genome));
}

function renderedArtDigest(genome: LivingCardGenome, formId: string, title: string) {
  return sha256PortableBasis(canonicalPortableCardJson({ renderer: 1, genome, formId, title }));
}

function revisionBasis(revision: LivingCardRevision) {
  const { digest: _digest, ...basis } = revision;
  return basis;
}

function sealRevision(revision: Omit<LivingCardRevision, "digest">): LivingCardRevision {
  const provisional = { ...revision, digest: "" } as LivingCardRevision;
  return { ...revision, digest: sha256PortableBasis(canonicalPortableCardJson(revisionBasis(provisional))) };
}

function manifestDigest(manifest: LivingCardManifest) {
  return sha256PortableBasis(canonicalPortableCardJson(manifest));
}

function birthGenome(legacy: LegacyPortableCardAsset): LivingCardGenome {
  const form = creatureForm(legacy.manifest.formId);
  if (!form) throw new Error("wilds_living_form_unknown");
  return {
    generatorVersion: 1,
    identityAnchor: sha256PortableBasis(canonicalPortableCardJson({ legacy: legacy.proof.digest, face: "heartbound" })).slice(7, 31),
    anatomy: { ...form.anatomy },
    variant: {
      ...legacy.manifest.variant.traits,
      palette: { ...legacy.manifest.variant.traits.palette }
    },
    provenance: { anatomy: "birth", face: "birth", palette: "birth", behavior: "birth", aura: "birth" }
  };
}

export function admitLegacyCard(legacy: LegacyPortableCardAsset, admittedAt: string): LivingCardAsset {
  if (!verifyPortableCard(legacy).ok) throw new Error("wilds_legacy_card_invalid");
  if (!Number.isFinite(Date.parse(admittedAt))) throw new Error("wilds_living_admission_time_invalid");
  const form = creatureForm(legacy.manifest.formId)!;
  const genome = birthGenome(legacy);
  const revision = sealRevision({
    revision: 0,
    previousRevisionDigest: null,
    sealedAt: legacy.proof.sealedAt,
    kaiPulse: legacy.manifest.variant.kaiPulse,
    reason: { kind: "birth", label: "Original verified card admitted as a living companion" },
    stage: form.stage,
    ascensionRank: 0,
    formId: form.id,
    growth: emptyLivingGrowth(form.stats.bond),
    qualifyingAchievementIds: [],
    consumedCatalystId: null,
    genomeDelta: {},
    genomeDigest: livingGenomeDigest(genome),
    stats: { ...form.stats },
    abilityNames: [form.abilities[0].name, form.abilities[1].name],
    title: legacy.manifest.name,
    rendererVersion: 1,
    renderedArtDigest: renderedArtDigest(genome, form.id, legacy.manifest.name),
    childEventIds: []
  });
  const manifest: LivingCardManifest = {
    ...legacy.manifest,
    schema: "receiz.wilds_living_card_manifest.v2",
    lineage: { ...legacy.manifest.lineage, childAssetIds: [] },
    birth: { kind: "legacy_admission", bornAt: legacy.manifest.capturedAt, formId: form.id, legacyDigest: legacy.proof.digest },
    birthGenome: genome,
    currentRevision: 0,
    revisions: [revision]
  };
  return {
    id: legacy.id,
    status: legacy.status,
    synchronizedAt: legacy.synchronizedAt,
    manifest,
    proof: {
      kind: "receiz.wilds_living_seal.v2",
      digest: manifestDigest(manifest),
      canonicalization: "receiz.sorted-json.v1",
      sealedAt: admittedAt
    }
  };
}

export function currentRevision(asset: LivingCardAsset) {
  return asset.manifest.revisions[asset.manifest.currentRevision]!;
}

export function currentLivingGenome(asset: LivingCardAsset) {
  return asset.manifest.revisions.reduce((genome, revision) => mergeGenome(genome, revision.genomeDelta), asset.manifest.birthGenome);
}

export function currentLivingProjection(asset: LivingCardAsset) {
  const revision = currentRevision(asset);
  return {
    assetId: asset.id,
    formId: revision.formId,
    stage: revision.stage,
    ascensionRank: revision.ascensionRank,
    title: revision.title,
    stats: revision.stats,
    abilityNames: revision.abilityNames,
    genome: currentLivingGenome(asset),
    revision: revision.revision,
    revisionDigest: revision.digest
  };
}

export function appendLivingCardRevision(input: { asset: LivingCardAsset; revision: LivingCardRevisionDraft }): LivingCardAsset {
  const checked = verifyLivingCard(input.asset);
  if (!checked.ok) throw new Error("wilds_living_previous_invalid");
  if (!Number.isFinite(Date.parse(input.revision.sealedAt))) throw new Error("wilds_revision_time_invalid");
  const prior = currentRevision(input.asset);
  const form = creatureForm(input.revision.formId);
  if (!form || form.stage !== input.revision.stage) throw new Error("wilds_revision_form_invalid");
  if (canonicalPortableCardJson(input.revision.stats) !== canonicalPortableCardJson(form.stats)) throw new Error("wilds_revision_stats_invalid");
  if (canonicalPortableCardJson(input.revision.abilityNames) !== canonicalPortableCardJson(form.abilities.map((ability) => ability.name))) throw new Error("wilds_revision_abilities_invalid");
  const genome = mergeGenome(currentLivingGenome(input.asset), input.revision.genomeDelta);
  const revision = sealRevision({
    ...input.revision,
    revision: prior.revision + 1,
    previousRevisionDigest: prior.digest,
    genomeDigest: livingGenomeDigest(genome),
    rendererVersion: 1,
    renderedArtDigest: renderedArtDigest(genome, form.id, input.revision.title)
  });
  const manifest: LivingCardManifest = {
    ...input.asset.manifest,
    formId: form.id,
    familyId: form.familyId,
    stage: form.stage,
    cardNumber: form.cardNumber,
    name: displayCreatureName(form.id, form.name),
    species: form.species,
    rarity: form.rarity,
    foil: form.foil,
    stats: { ...revision.stats },
    abilityNames: revision.abilityNames,
    lineage: { ...input.asset.manifest.lineage, evolvedAt: input.revision.sealedAt },
    currentRevision: revision.revision,
    revisions: [...input.asset.manifest.revisions, revision]
  };
  return {
    ...input.asset,
    manifest,
    proof: { ...input.asset.proof, digest: manifestDigest(manifest), sealedAt: input.revision.sealedAt }
  };
}

export function verifyLivingCard(asset: LivingCardAsset): PortableCardVerification {
  const errors: string[] = [];
  if (!isLivingCardAsset(asset)) return { ok: false, errors: ["schema_invalid"] };
  const manifest = asset.manifest;
  if (manifest.assetId !== asset.id) errors.push("asset_id_mismatch");
  if (!manifest.ownerReceizId.trim()) errors.push("owner_required");
  if (!manifest.revisions.length || manifest.currentRevision !== manifest.revisions.length - 1) errors.push("current_revision_invalid");
  if (manifest.birth.legacyDigest !== null && !DIGEST.test(manifest.birth.legacyDigest)) errors.push("legacy_digest_invalid");
  let genome = manifest.birthGenome;
  let previousDigest: string | null = null;
  manifest.revisions.forEach((revision, index) => {
    if (revision.revision !== index) errors.push("revision_number_invalid");
    if (revision.previousRevisionDigest !== previousDigest) errors.push("revision_link_invalid");
    if (!Number.isFinite(Date.parse(revision.sealedAt))) errors.push("revision_time_invalid");
    const expectedDigest = sha256PortableBasis(canonicalPortableCardJson(revisionBasis(revision)));
    if (revision.digest !== expectedDigest) errors.push("revision_digest_invalid");
    genome = mergeGenome(genome, revision.genomeDelta);
    if (revision.genomeDigest !== livingGenomeDigest(genome)) errors.push("revision_genome_invalid");
    if (revision.renderedArtDigest !== renderedArtDigest(genome, revision.formId, revision.title)) errors.push("revision_art_invalid");
    previousDigest = revision.digest;
  });
  const current = manifest.revisions.at(-1);
  if (current) {
    if (manifest.formId !== current.formId || manifest.stage !== current.stage) errors.push("current_projection_identity_invalid");
    if (canonicalPortableCardJson(manifest.stats) !== canonicalPortableCardJson(current.stats)) errors.push("current_projection_stats_invalid");
    if (canonicalPortableCardJson(manifest.abilityNames) !== canonicalPortableCardJson(current.abilityNames)) errors.push("current_projection_abilities_invalid");
  }
  if (asset.proof.kind !== "receiz.wilds_living_seal.v2" || asset.proof.digest !== manifestDigest(manifest)) errors.push("digest_mismatch");
  return { ok: errors.length === 0, errors };
}
