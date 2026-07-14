import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fusionChild, fusionEligibility } from "../src/features/play/card-fusion";
import { sealCollectedCard, verifyPortableCard } from "../src/features/play/portable-card";

const parentA = sealCollectedCard({ formId: "mintcub-1", ownerReceizId: "player.receiz.id", encounterId: "fusion-a", capturedAt: "2026-07-12T12:00:00.000Z" });
const parentB = sealCollectedCard({ formId: "voltray-1", ownerReceizId: "player.receiz.id", encounterId: "fusion-b", capturedAt: "2026-07-12T12:01:00.000Z" });

describe("Wilds reusable-parent fusion", () => {
  it("creates one deterministic proof-linked child without changing either parent", () => {
    const input = { parentA, parentB, inheritance: "balanced" as const, fusionKaiPulse: "1783962000000", fusedAt: "2026-07-13T17:00:00.000Z", sparkId: "spark:first" };
    const child = fusionChild(input);
    assert.deepEqual(fusionChild(input), child);
    assert.equal(verifyPortableCard(child).ok, true);
    assert.deepEqual(child.manifest.lineage.parentAssetIds, [parentA.id, parentB.id].sort());
    assert.equal(parentA.manifest.encounterId, "fusion-a");
    assert.equal(parentB.manifest.encounterId, "fusion-b");
  });

  it("requires a Spark, distinct same-owner parents, and expired cooldowns", () => {
    const at = "2026-07-13T17:00:00.000Z";
    assert.equal(fusionEligibility({ parentA, parentB, fusionSparks: 1, fusionCooldowns: {}, at }).ok, true);
    assert.equal(fusionEligibility({ parentA, parentB, fusionSparks: 0, fusionCooldowns: {}, at }).ok, false);
    assert.equal(fusionEligibility({ parentA, parentB: parentA, fusionSparks: 1, fusionCooldowns: {}, at }).ok, false);
    assert.equal(fusionEligibility({ parentA, parentB, fusionSparks: 1, fusionCooldowns: { [parentA.id]: "2026-07-14T17:00:00.000Z" }, at }).ok, false);
  });
});
