import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deriveHeartboundIdentity,
  heartboundIdentitySignature,
  validateHeartboundIdentity
} from "../src/features/play/heartbound-identity.js";
import { sha256PortableBasis } from "../src/features/play/portable-card.js";

const anchors = { familyId: "seal-family", locomotion: "biped" as const, signatureDetail: "ears" };

describe("Heartbound advanced identity grammar", () => {
  it("creates deterministic identities with no duplicate signatures in 10,000 proofs", () => {
    const signatures = new Set<string>();
    for (let index = 0; index < 10_000; index += 1) {
      const proof = sha256PortableBasis(`identity-sample:${index}`);
      const identity = deriveHeartboundIdentity(proof, {
        familyId: `family-${index % 250}`,
        locomotion: (["biped", "quadruped", "flying", "serpentine"] as const)[index % 4]!,
        signatureDetail: (["ears", "horns", "wings", "tail"] as const)[index % 4]!
      });
      assert.deepEqual(deriveHeartboundIdentity(proof, {
        familyId: `family-${index % 250}`,
        locomotion: (["biped", "quadruped", "flying", "serpentine"] as const)[index % 4]!,
        signatureDetail: (["ears", "horns", "wings", "tail"] as const)[index % 4]!
      }), identity);
      assert.equal(validateHeartboundIdentity(identity).ok, true);
      const signature = heartboundIdentitySignature(identity);
      assert.equal(signatures.has(signature), false, `duplicate identity at ${index}`);
      signatures.add(signature);
    }
    assert.equal(signatures.size, 10_000);
  });

  it("changes face, body, markings, and behavior rather than only palette", () => {
    const first = deriveHeartboundIdentity(sha256PortableBasis("heartbound-first"), anchors);
    const second = deriveHeartboundIdentity(sha256PortableBasis("heartbound-second"), anchors);

    assert.notEqual(first.faceGeometry.signature, second.faceGeometry.signature);
    assert.notEqual(first.body.signature, second.body.signature);
    assert.notEqual(first.markings.signature, second.markings.signature);
    assert.notEqual(first.behavior.signature, second.behavior.signature);
    assert.equal(first.family.familyId, second.family.familyId);
    assert.equal(first.family.locomotion, second.family.locomotion);
  });

  it("rejects proportions outside the lovable anatomy contract", () => {
    const identity = deriveHeartboundIdentity(sha256PortableBasis("heartbound-invalid"), anchors);
    assert.equal(validateHeartboundIdentity({ ...identity, faceGeometry: { ...identity.faceGeometry, eyeSpacing: 4 } }).ok, false);
    assert.equal(validateHeartboundIdentity({ ...identity, body: { ...identity.body, neck: 0.1 } }).ok, false);
  });
});
