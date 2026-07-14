import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { projectLivingCardDossier } from "../src/features/play/living-card-dossier.js";
import { createLivingChildTransaction } from "../src/features/play/living-lineage.js";
import { admitLegacyCard } from "../src/features/play/living-card-proof.js";
import { sealCollectedCard } from "../src/features/play/portable-card.js";

const bornAt = "2026-07-13T18:00:00.000Z";

function parent(formId: string, encounterId: string) {
  return admitLegacyCard(sealCollectedCard({ formId, ownerReceizId: "collector.receiz.id", encounterId, capturedAt: bornAt }), bornAt);
}

describe("Living card character and proof dossier", () => {
  const parentA = parent("mintcub-1", "dossier-a");
  const parentB = parent("voltray-1", "dossier-b");
  const child = createLivingChildTransaction({
    parentA,
    parentB,
    inheritance: "balanced",
    sparkId: "spark:dossier",
    kaiPulse: String(Date.parse(bornAt)),
    createdAt: bornAt,
    fusionSparks: 1,
    recovery: {}
  }).child;

  it("projects a stable emotional dossier from sealed facts", () => {
    const dossier = projectLivingCardDossier(child, "https://cards.example");

    assert.deepEqual(projectLivingCardDossier(child, "https://cards.example"), dossier);
    assert.match(dossier.story, new RegExp(child.manifest.name));
    assert.match(dossier.story, /born|lineage|parents/i);
    assert.ok(dossier.personality.traits.length >= 3);
    assert.ok(dossier.personality.careCues.length >= 2);
    assert.ok(dossier.gameplay.strengths.length >= 2);
    assert.ok(dossier.dna.identityFingerprint.length > 20);
    assert.equal(dossier.lineage.parents.length, 2);
    assert.equal(dossier.verification.ok, true);
    assert.equal(dossier.verification.checks.every((check) => check.status === "pass"), true);
  });

  it("exposes the complete unshortened canonical proof needed offline", () => {
    const dossier = projectLivingCardDossier(child, "https://cards.example");

    assert.match(dossier.canonicalProofJson, new RegExp(child.proof.digest));
    assert.match(dossier.canonicalProofJson, new RegExp(child.manifest.revisions[0]!.digest));
    assert.match(dossier.canonicalProofJson, new RegExp(child.manifest.birthGenome.identity!.signature));
    assert.match(dossier.canonicalProofJson, /receiz\.sorted-json\.v1/);
    assert.match(dossier.canonicalProofJson, /collector\.receiz\.id/);
    assert.equal(dossier.verification.route, `https://cards.example/cards/${encodeURIComponent(child.id)}`);
  });
});
