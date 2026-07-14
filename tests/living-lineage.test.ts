import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLivingChildTransaction, lineageEligibility } from "../src/features/play/living-lineage.js";
import { admitLegacyCard, currentRevision, verifyLivingCard } from "../src/features/play/living-card-proof.js";
import { isLivingCardAsset } from "../src/features/play/living-card-types.js";
import { evolvePortableCard, sealCollectedCard } from "../src/features/play/portable-card.js";

const legacyA = sealCollectedCard({ formId: "mintcub-1", ownerReceizId: "player.receiz.id", encounterId: "lineage-a", capturedAt: "2026-07-10T12:00:00.000Z" });
const legacyB = sealCollectedCard({ formId: "voltray-1", ownerReceizId: "player.receiz.id", encounterId: "lineage-b", capturedAt: "2026-07-10T12:01:00.000Z" });
const parentA = evolvePortableCard({ previous: admitLegacyCard(legacyA, legacyA.manifest.capturedAt), nextFormId: "mintcub-2", evolvedAt: "2026-07-11T12:00:00.000Z" });
const parentB = admitLegacyCard(legacyB, legacyB.manifest.capturedAt);
const input = {
  parentA,
  parentB,
  inheritance: "balanced" as const,
  sparkId: "spark:earned:first",
  kaiPulse: "1783962000000",
  createdAt: "2026-07-13T17:00:00.000Z",
  fusionSparks: 1,
  recovery: {}
};

describe("Wilds atomic living lineage", () => {
  it("creates one independent child and appends the same birth event to both reusable parents", () => {
    const result = createLivingChildTransaction(input);
    assert.deepEqual(createLivingChildTransaction(input), result);
    assert.notEqual(result.child.id, parentA.id);
    assert.notEqual(result.child.id, parentB.id);
    assert.equal(result.parentA.id, parentA.id);
    assert.equal(result.parentB.id, parentB.id);
    assert.equal(currentRevision(result.parentA).childEventIds.includes(result.eventId), true);
    assert.equal(currentRevision(result.parentB).childEventIds.includes(result.eventId), true);
    assert.equal(result.parentA.manifest.lineage.childAssetIds.includes(result.child.id), true);
    assert.equal(result.parentB.manifest.lineage.childAssetIds.includes(result.child.id), true);
    assert.equal(Object.values(result.child.manifest.birthGenome.provenance).includes("parent_a"), true);
    assert.equal(Object.values(result.child.manifest.birthGenome.provenance).includes("parent_b"), true);
    assert.equal(verifyLivingCard(result.parentA).ok, true);
    assert.equal(verifyLivingCard(result.parentB).ok, true);
    assert.equal(verifyLivingCard(result.child).ok, true);
  });

  it("requires valid distinct same-owner parents, an earned Spark, and completed recovery", () => {
    assert.equal(lineageEligibility(input).ok, true);
    assert.equal(lineageEligibility({ ...input, fusionSparks: 0 }).ok, false);
    assert.equal(lineageEligibility({ ...input, parentB: parentA }).ok, false);
    assert.equal(lineageEligibility({ ...input, recovery: { [parentA.id]: "2026-07-14T17:00:00.000Z" } }).ok, false);
    const foreign = admitLegacyCard(sealCollectedCard({ formId: "voltray-1", ownerReceizId: "other.receiz.id", encounterId: "foreign-parent", capturedAt: "2026-07-10T13:00:00.000Z" }), "2026-07-10T13:00:00.000Z");
    assert.equal(lineageEligibility({ ...input, parentB: foreign }).ok, false);
  });

  it("accepts verified parents at any stage without mutating inputs on failure", () => {
    const beforeA = structuredClone(parentA);
    const beforeB = structuredClone(parentB);
    assert.equal(isLivingCardAsset(parentA), true);
    assert.throws(() => createLivingChildTransaction({ ...input, sparkId: "" }));
    assert.deepEqual(parentA, beforeA);
    assert.deepEqual(parentB, beforeB);
  });
});
