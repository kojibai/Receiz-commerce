import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  rendererBudgetStatus,
  selectWildsQualityProfile
} from "../src/features/play/wilds-quality-profile";
import {
  activeWildsVisualEvents,
  appendWildsVisualEvent
} from "../src/features/play/wilds-visual-events";

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

describe("Wilds visual events", () => {
  it("deduplicates, expires, and bounds presentation events", () => {
    const first = appendWildsVisualEvent([], {
      id: "scan-1",
      kind: "search",
      createdAt: 100,
      durationMs: 800,
      intensity: 0.7
    }, 100);
    const duplicate = appendWildsVisualEvent(first, {
      id: "scan-1",
      kind: "search",
      createdAt: 120,
      durationMs: 800,
      intensity: 1
    }, 120);
    assert.equal(duplicate.length, 1);
    let events = duplicate;
    for (let index = 0; index < 40; index += 1) {
      events = appendWildsVisualEvent(events, {
        id: `impact-${index}`,
        kind: "impact",
        createdAt: 200 + index,
        durationMs: 900,
        intensity: 1
      }, 200 + index);
    }
    assert.equal(events.length, 24);
    assert.equal(activeWildsVisualEvents(events, 2_000).length, 0);
  });
});
