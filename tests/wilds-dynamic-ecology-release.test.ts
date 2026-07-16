import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createWildsEcologyActivity } from "../src/features/play/wilds-ecology-activity";
import { generateWildsEcologyEnsemble, WILDS_ECOLOGY_FAMILIES } from "../src/features/play/wilds-ecology";
import { initialPlayState, restorePlayState, serializePlayState } from "../src/features/play/game-state";
import { projectWildsAtlas } from "../src/features/play/wilds-world-atlas";

const pulse = "2026-07-15T12:00:00.000Z";

describe("Wilds V3 Slice 3 release contract", () => {
  it("ships all eight deterministic ecology families with distinct playable modules", () => {
    const sites = generateWildsEcologyEnsemble({ pulse, existingSites: [], ordinalStart: 1 });
    assert.deepEqual(sites.map((site) => site.familyId), WILDS_ECOLOGY_FAMILIES);
    assert.equal(new Set(sites.map((site) => createWildsEcologyActivity(site).moduleId)).size, 8);
    assert.equal(sites.every((site) => site.phase === "foreshadowed" && site.parentSiteId === null), true);
  });

  it("keeps rumor coordinates private until portable knowledge is exact", () => {
    const site = generateWildsEcologyEnsemble({ pulse, existingSites: [], ordinalStart: 1 })[0]!;
    const base = { center: { x: 0, z: 0 }, discoveredLandmarkIds: [], missionProgress: 0, worldMastery: 0, selfId: "self", players: [], zoom: "world" as const, dynamicSites: [], ecologySites: [{ ...site, discoveredAt: null, discoveredBy: null, contributionTotal: 0, participantIds: [], resolvedAt: null }] };
    const rumor = projectWildsAtlas({ ...base, ecologyKnowledge: {} }).ecologySites[0]!;
    assert.equal("position" in rumor, false);
    const exact = projectWildsAtlas({ ...base, ecologyKnowledge: { [site.id]: { siteId: site.id, familyId: site.familyId, visibility: "exact", sourceEventId: `wve:${"a".repeat(64)}`, occurredAt: pulse, canonicalRevision: 1 } } }).ecologySites[0]!;
    assert.equal("position" in exact, true);
    if ("position" in exact) assert.deepEqual(exact.position, site.position);
  });

  it("round-trips Save V10 while preserving ecology defaults", () => {
    const restored = restorePlayState(serializePlayState(initialPlayState));
    assert.equal(JSON.parse(serializePlayState(restored)).schema, "receiz.wilds.save.v10");
    assert.deepEqual(restored.ecologyEvents, []);
    assert.deepEqual(restored.ecologyKnowledge, {});
  });

  it("uses local procedural visuals and locally shipped production audio", () => {
    const sources = [
      "src/features/play/WildsEcologyEnvironment.tsx",
      "src/features/play/WildsEcologyExperience.tsx",
      "src/features/play/wilds-ecology.ts",
      "src/features/play/wilds-audio.ts",
      "src/features/play/audio/wilds-audio-catalog.ts",
      "src/features/play/audio/wilds-audio-loader.ts",
      "src/features/play/audio/wilds-audio-mixer.ts"
    ].map((path) => readFileSync(path, "utf8")).join("\n");
    assert.doesNotMatch(sources, /https?:\/\//);
    assert.match(sources, /\/audio\/wilds\//);
    assert.match(sources, /createWildsAudioLoader/);
    assert.match(sources, /createWildsAudioMixer/);
    assert.doesNotMatch(sources, /createOscillator|speechSynthesis|SpeechSynthesis/);
    assert.match(sources, /instancedMesh/);
  });

  it("keeps mobile activity controls bounded and renderer diagnostics gated", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const diagnostics = readFileSync("src/features/play/WildsWorldCanvas.tsx", "utf8");
    assert.match(css, /\.wilds-ecology-action\s*\{[^}]*min-height:\s*44px/s);
    assert.match(css, /\.wilds-ecology-experience\s*\{[^}]*height:\s*100dvh;[^}]*overflow:\s*hidden/s);
    assert.match(diagnostics, /__THREE_GAME_DIAGNOSTICS__/);
    assert.doesNotMatch(diagnostics, /wilds-debug-overlay/);
  });

  it("marks Slice 3 qualified in the living-world program", () => {
    const program = readFileSync("docs/superpowers/specs/2026-07-15-wilds-v3-living-world-program-design.md", "utf8");
    assert.match(program, /Slice 3 · qualified/);
  });
});
