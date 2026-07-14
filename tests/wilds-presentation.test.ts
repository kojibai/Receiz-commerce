import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  rendererBudgetStatus,
  selectWildsQualityProfile
} from "../src/features/play/wilds-quality-profile";

describe("Wilds presentation quality", () => {
  it("selects bounded mobile and desktop profiles", () => {
    assert.equal(selectWildsQualityProfile({ width: 390, hardwareConcurrency: 4, deviceMemory: 4, reducedMotion: false }).tier, "medium");
    assert.equal(selectWildsQualityProfile({ width: 360, hardwareConcurrency: 2, deviceMemory: 2, reducedMotion: false }).dpr, 1);
    assert.equal(selectWildsQualityProfile({ width: 1440, hardwareConcurrency: 12, deviceMemory: 8, reducedMotion: false }).dpr, 1.5);
    assert.equal(selectWildsQualityProfile({ width: 1440, hardwareConcurrency: 12, deviceMemory: 8, reducedMotion: true }).particles, 0.35);
  });

  it("reports renderer budget violations", () => {
    const profile = selectWildsQualityProfile({ width: 390, hardwareConcurrency: 4, deviceMemory: 4, reducedMotion: false });
    assert.deepEqual(rendererBudgetStatus(profile, { calls: 45, triangles: 43_672 }), {
      withinBudget: true,
      drawCallRatio: 0.375,
      triangleRatio: 0.2426222222222222
    });
    assert.equal(rendererBudgetStatus(profile, { calls: 121, triangles: 100_000 }).withinBudget, false);
  });
});
