import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveCardVariant } from "../src/features/play/card-variant.js";
import { deriveHeartboundPresentation, validateHeartboundPresentation } from "../src/features/play/heartbound-anime-genome.js";
import { deriveBirthGenome } from "../src/features/play/heartbound-genome.js";
import { heartboundArchetypes } from "../src/features/play/heartbound-archetypes.js";
import { heartboundTemplates } from "../src/features/play/heartbound-templates.js";
import { sha256PortableBasis } from "../src/features/play/portable-card.js";

function genome(formId: string, salt: string) {
  const proof = sha256PortableBasis(`${formId}:${salt}`);
  return deriveBirthGenome({ formId, proofDigest: proof, variant: deriveCardVariant(proof, 1) });
}

describe("Heartbound v3 anime presentation", () => {
  it("ships the complete authored archetype and template grammar", () => {
    assert.equal(heartboundArchetypes.length, 9);
    assert.equal(heartboundTemplates.length, 11);
    for (const template of heartboundTemplates) {
      assert.ok(template.compatibleArchetypes.length > 0);
      assert.ok(template.maturity.baby.headToBody > template.maturity.heroic.headToBody);
      assert.ok(template.faceClearance > 0);
    }
  });

  it("derives a sealed, deterministic and lovable baby presentation", () => {
    const birth = genome("mintcub-1", "anime-contract");
    const first = deriveHeartboundPresentation({ genome: birth, stage: 1, ascensionRank: 0 });
    assert.deepEqual(deriveHeartboundPresentation({ genome: birth, stage: 1, ascensionRank: 0 }), first);
    assert.equal(first.version, 3);
    assert.equal(first.maturity, "baby");
    assert.match(first.signature, /^sha256:[a-f0-9]{64}$/);
    assert.ok(first.identityAnchors.face.length > 10);
    assert.ok(first.face.catchlights >= 2);
    assert.ok(first.face.eyeSize >= 1);
    assert.ok(first.body.headToBody > 0);
    assert.equal(validateHeartboundPresentation(first).ok, true);
  });

  it("maps earned growth onto a continuous maturity curve", () => {
    const birth = genome("mintcub-1", "maturity");
    assert.equal(deriveHeartboundPresentation({ genome: birth, stage: 1, ascensionRank: 0 }).maturity, "baby");
    assert.equal(deriveHeartboundPresentation({ genome: birth, stage: 2, ascensionRank: 0 }).maturity, "adolescent");
    assert.equal(deriveHeartboundPresentation({ genome: birth, stage: 3, ascensionRank: 0 }).maturity, "heroic");
    assert.equal(deriveHeartboundPresentation({ genome: birth, stage: 3, ascensionRank: 1 }).maturity, "legendary");
  });

  it("creates 10,000 deterministic structural identities without collision", () => {
    const signatures = new Set<string>();
    for (let index = 0; index < 10_000; index += 1) {
      const individual = genome(`mintcub-${1 + index % 3}`, `anime-identity:${index}`);
      const presentation = deriveHeartboundPresentation({ genome: individual, stage: 1, ascensionRank: 0 });
      assert.equal(signatures.has(presentation.signature), false, `duplicate presentation at ${index}`);
      signatures.add(presentation.signature);
    }
    assert.equal(signatures.size, 10_000);
  });
});
