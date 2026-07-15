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
import {
  DEFAULT_WILDS_AUDIO_SETTINGS,
  audioCuesForTransition,
  createWildsAudioRuntime,
  ecologyAudioCue,
  bossAudioCue,
  normalizeWildsAudioSettings,
  settlementAudioCue
} from "../src/features/play/wilds-audio";
import { readFileSync } from "node:fs";

describe("Wilds presentation quality", () => {
  it("mounts a single responsive campaign owner", () => {
    const storefront = readFileSync(`${process.cwd()}/src/features/storefront/PublicStorefront.tsx`, "utf8");
    assert.equal(storefront.match(/<PlayCampaign\b/g)?.length, 1);
    assert.match(storefront, /mobileCampaign=\{compactLayout \? campaign : null\}/);
    assert.match(storefront, /\{compactLayout === false \? campaign : null\}/);
  });

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
      drawCallRatio: 0.28125,
      triangleRatio: 0.2426222222222222
    });
    assert.equal(rendererBudgetStatus(profile, { calls: 158, triangles: 100_000 }).withinBudget, true);
    assert.equal(rendererBudgetStatus(profile, { calls: 161, triangles: 100_000 }).withinBudget, false);
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

describe("Wilds synthesized audio", () => {
  it("normalizes persisted audio settings", () => {
    assert.deepEqual(normalizeWildsAudioSettings({
      master: 2,
      effects: -1,
      ambience: 0.4,
      music: 0.3,
      muted: true
    }), {
      master: 1,
      effects: 0,
      ambience: 0.4,
      music: 0.3,
      muted: true
    });
    assert.deepEqual(normalizeWildsAudioSettings(null), DEFAULT_WILDS_AUDIO_SETTINGS);
  });

  it("maps encounter changes onto intentional cues", () => {
    assert.deepEqual(
      audioCuesForTransition(
        { phase: "idle", proximity: "cold" },
        { phase: "hint", proximity: "hot" }
      ),
      ["search", "proximity-hot", "rustle"]
    );
    assert.deepEqual(
      audioCuesForTransition(
        { phase: "capsule", proximity: "hot" },
        { phase: "sealed", proximity: "hot" }
      ),
      ["seal"]
    );
    assert.deepEqual(
      audioCuesForTransition(
        { phase: "hint", proximity: "warm" },
        { phase: "hint", proximity: "hot" }
      ),
      ["proximity-hot", "foliage-surge"]
    );
  });

  it("maps settlement arrival, services, and route play onto local synthesized cues", () => {
    assert.equal(settlementAudioCue("arrival"), "settlement-arrival");
    assert.equal(settlementAudioCue("service"), "settlement-service");
    assert.equal(settlementAudioCue("route-step"), "route-step");
    assert.equal(settlementAudioCue("route-complete"), "route-complete");
  });

  it("maps living ecology discovery and resolution onto local family motifs", () => {
    assert.equal(ecologyAudioCue("rumor", "echo-ruin"), "ecology-rumor");
    assert.equal(ecologyAudioCue("discovered", "wandering-market"), "ecology-market");
    assert.equal(ecologyAudioCue("discovered", "stormfront"), "ecology-storm");
    assert.equal(ecologyAudioCue("step", "resource-bloom"), "ecology-step");
    assert.equal(ecologyAudioCue("resolved", "unstable-portal"), "ecology-resolved");
  });

  it("maps global boss families and outcomes onto local synthesized motifs", () => {
    assert.equal(bossAudioCue("telegraph", "skycoil-tempest"), "boss-skycoil");
    assert.equal(bossAudioCue("action", "mirecrown-colossus"), "boss-action");
    assert.equal(bossAudioCue("defeat", "crystal-burrower"), "boss-defeat");
  });

  it("destroys every synthesized audio resource", async () => {
    const calls: string[] = [];
    const audioParam = {
      setValueAtTime() {},
      exponentialRampToValueAtTime() {}
    };
    const runtime = createWildsAudioRuntime(() => ({
      currentTime: 0,
      destination: {},
      resume: async () => { calls.push("resume"); },
      close: async () => { calls.push("close"); },
      createOscillator: () => ({
        type: "sine",
        frequency: audioParam,
        connect() {},
        disconnect() {},
        start() {},
        stop() { calls.push("stop"); }
      }),
      createGain: () => ({
        gain: audioParam,
        connect() {},
        disconnect() {}
      })
    }));
    await runtime.unlock();
    runtime.play("search");
    await runtime.destroy();
    assert.deepEqual(calls, ["resume", "stop", "close"]);
  });
});
