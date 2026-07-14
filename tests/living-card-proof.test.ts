import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  admitLegacyCard,
  appendLivingCardRevision,
  currentRevision,
  verifyLivingCard
} from "../src/features/play/living-card-proof.js";
import { creatureForm } from "../src/features/play/creature-catalog.js";
import { sealCollectedCard } from "../src/features/play/portable-card.js";
import { deriveBirthGenome } from "../src/features/play/heartbound-genome.js";

const T0 = "2026-07-13T15:00:00.000Z";
const T1 = "2026-07-14T15:00:00.000Z";

describe("Wilds living card proof chain", () => {
  it("admits a legacy proof without changing its stable identity", () => {
    const legacy = sealCollectedCard({
      formId: "mintcub-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "living-card-birth",
      capturedAt: T0
    });

    const living = admitLegacyCard(legacy, T0);

    assert.equal(living.id, legacy.id);
    assert.equal(living.manifest.assetId, legacy.id);
    assert.equal(living.manifest.schema, "receiz.wilds_living_card_manifest.v2");
    assert.equal(living.manifest.birth.legacyDigest, legacy.proof.digest);
    assert.equal(living.manifest.currentRevision, 0);
    assert.equal(living.manifest.revisions.length, 1);
    assert.equal(living.manifest.birthGenome.generatorVersion, 2);
    assert.equal(living.manifest.revisions[0]?.rendererVersion, 2);
    assert.equal(verifyLivingCard(living).ok, true);
  });

  it("keeps explicitly admitted version-one living cards verifiable", () => {
    const legacy = sealCollectedCard({ formId: "mintcub-1", ownerReceizId: "player.receiz.id", encounterId: "living-card-v1", capturedAt: T0 });
    const genome = deriveBirthGenome({ formId: legacy.manifest.formId, proofDigest: legacy.proof.digest, variant: legacy.manifest.variant.traits }, { generatorVersion: 1 });
    const living = admitLegacyCard(legacy, T0, { birthGenome: genome });

    assert.equal(living.manifest.birthGenome.generatorVersion, 1);
    assert.equal(living.manifest.revisions[0]?.rendererVersion, 1);
    assert.equal(verifyLivingCard(living).ok, true);
  });

  it("appends a revision under the same asset id and rejects chain tampering", () => {
    const legacy = sealCollectedCard({
      formId: "ledgerfox-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "living-card-growth",
      capturedAt: T0
    });
    const birth = admitLegacyCard(legacy, T0);
    const nextForm = creatureForm("ledgerfox-2")!;
    const next = appendLivingCardRevision({
      asset: birth,
      revision: {
        sealedAt: T1,
        kaiPulse: String(Date.parse(T1)),
        reason: { kind: "stage", label: "Reached Stage 2 through bond mastery" },
        stage: 2,
        ascensionRank: 0,
        formId: "ledgerfox-2",
        growth: {
          bond: 100,
          paths: { bond: 100, battle: 4, exploration: 3, legacy: 0, community: 0, character: 1 },
          eventIds: ["bond:mastery:1"],
          achievementIds: ["bond_mastery_1"],
          consumedAchievementIds: ["bond_mastery_1"],
          completedQuestIds: ["ledgerfox_bond_1"],
          recoveryUntil: null
        },
        qualifyingAchievementIds: ["bond_mastery_1"],
        consumedCatalystId: "catalyst:stage-two",
        genomeDelta: {},
        stats: { ...nextForm.stats },
        abilityNames: [nextForm.abilities[0].name, nextForm.abilities[1].name],
        title: "Ledgerfox Ascendant",
        childEventIds: []
      }
    });

    assert.equal(next.id, birth.id);
    assert.equal(next.manifest.currentRevision, 1);
    assert.equal(next.manifest.revisions.length, 2);
    assert.equal(next.manifest.revisions[1]!.previousRevisionDigest, currentRevision(birth).digest);
    assert.equal(verifyLivingCard(next).ok, true);

    const wrongCurrent = {
      ...next,
      manifest: { ...next.manifest, currentRevision: 0 }
    };
    assert.equal(verifyLivingCard(wrongCurrent).ok, false);

    const reordered = {
      ...next,
      manifest: { ...next.manifest, revisions: [...next.manifest.revisions].reverse() }
    };
    assert.equal(verifyLivingCard(reordered).ok, false);
  });
});
