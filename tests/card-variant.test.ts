import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveCardVariant, displayCreatureName, variantSeedFor } from "../src/features/play/card-variant";

const basis = {
  formId: "mintcub-1",
  encounterId: "hotspot:0:0:1",
  ownerReceizId: "player.receiz.id",
  capturedAt: "2026-07-13T15:00:00.000Z",
  kaiPulse: "1783954800000",
  battleTranscriptDigest: "sha256:battle"
};

describe("Wilds deterministic card variants", () => {
  it("regenerates the same individual and changes with its Kai pulse", () => {
    const seed = variantSeedFor(basis);
    assert.deepEqual(deriveCardVariant(seed, 1), deriveCardVariant(seed, 1));
    assert.notDeepEqual(
      deriveCardVariant(seed, 1),
      deriveCardVariant(variantSeedFor({ ...basis, kaiPulse: "1783954800001" }), 1)
    );
  });

  it("keeps generated traits inside gameplay and animation bounds", () => {
    for (let index = 0; index < 1_000; index += 1) {
      const traits = deriveCardVariant(variantSeedFor({ ...basis, encounterId: `encounter:${index}` }), 1);
      assert.ok(traits.bodyScale >= 0.88 && traits.bodyScale <= 1.12);
      assert.ok(traits.auraIntensity >= 0.35 && traits.auraIntensity <= 1);
      assert.ok(traits.animationMs >= 1_800 && traits.animationMs <= 4_600);
      assert.ok(traits.potential >= 1 && traits.potential <= 100);
      assert.ok(traits.statBias >= -6 && traits.statBias <= 6);
      assert.ok(traits.abilityModifier >= -4 && traits.abilityModifier <= 8);
      assert.match(traits.palette.primary, /^hsl\(\d+ 7\d% \d+%\)$/);
      assert.match(traits.visualFingerprint, /^[a-f0-9]{16}$/);
    }
  });

  it("projects the compatible starter identifier as SealCub", () => {
    assert.equal(displayCreatureName("mintcub-1", "Mintcub"), "SealCub");
    assert.equal(displayCreatureName("voltray-1", "Voltray"), "Voltray");
  });
});
