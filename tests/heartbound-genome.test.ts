import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveCardVariant } from "../src/features/play/card-variant.js";
import { creatureForms } from "../src/features/play/creature-catalog.js";
import {
  deriveAscensionGenome,
  deriveBirthGenome,
  deriveFusionGenome,
  genomeDigest,
  validateGenome
} from "../src/features/play/heartbound-genome.js";
import { sha256PortableBasis } from "../src/features/play/portable-card.js";

function birth(formId: string, salt: string) {
  const seed = sha256PortableBasis(`${formId}:${salt}`);
  return deriveBirthGenome({ formId, proofDigest: seed, variant: deriveCardVariant(seed, 1) });
}

describe("Heartbound living genome", () => {
  it("derives deterministic full-body genomes for every catalog anatomy", () => {
    for (const form of creatureForms) {
      const first = birth(form.id, "catalog");
      assert.deepEqual(birth(form.id, "catalog"), first);
      assert.equal(validateGenome(first).ok, true, form.id);
      assert.match(genomeDigest(first), /^sha256:[a-f0-9]{64}$/);
      assert.ok(first.skeleton.head > 0);
      assert.ok(first.skeleton.torso > 0);
      assert.ok(first.skeleton.limb > 0);
      assert.ok(first.face.identityAnchor.length >= 16);
    }
  });

  it("keeps the companion face identity while earned paths change its body language", () => {
    const previous = birth("mintcub-3", "ascension");
    const ascended = deriveAscensionGenome({
      previous,
      rank: 12,
      achievementId: "boss_victory_12",
      questId: "quest:mintcub:12:battle_win",
      kaiPulse: "1784200000000",
      path: "battle"
    });

    assert.equal(ascended.face.identityAnchor, previous.face.identityAnchor);
    assert.notEqual(genomeDigest(ascended), genomeDigest(previous));
    assert.equal(ascended.provenance.stance, "ascension");
  });

  it("creates a coherent child with visible sealed traits from both parents", () => {
    const parentA = birth("mintcub-2", "parent-a");
    const parentB = birth("voltray-3", "parent-b");
    const input = { parentA, parentB, emphasis: "balanced" as const, kaiPulse: "1784200000000", mutationNonce: "child-one" };
    const child = deriveFusionGenome(input);

    assert.deepEqual(deriveFusionGenome(input), child);
    assert.equal(validateGenome(child).ok, true);
    assert.ok(Object.values(child.provenance).includes("parent_a"));
    assert.ok(Object.values(child.provenance).includes("parent_b"));
    assert.notEqual(child.face.identityAnchor, parentA.face.identityAnchor);
    assert.notEqual(child.face.identityAnchor, parentB.face.identityAnchor);
    assert.equal(child.generatorVersion, 3);
    assert.ok(child.identity);
    assert.equal(child.presentation?.archetype, "hybrid");
    assert.match(child.presentation?.signature ?? "", /^sha256:[a-f0-9]{64}$/);
    assert.equal(child.identity?.faceGeometry.head, parentB.identity?.faceGeometry.head);
    assert.equal(child.identity?.body.build, parentA.identity?.body.build);
    assert.equal(child.identity?.appendageMorphs.tail, parentB.identity?.appendageMorphs.tail);
    assert.notEqual(child.identity?.signature, parentA.identity?.signature);
    assert.notEqual(child.identity?.signature, parentB.identity?.signature);
  });
});
