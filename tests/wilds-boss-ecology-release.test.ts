import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { initialPlayState, restorePlayState, serializePlayState } from "../src/features/play/game-state.js";
import { WILDS_BOSS_FAMILIES } from "../src/features/play/wilds-boss-ecology.js";
import { WILDS_RAID_LEASE_MS, WILDS_RAID_SUPPORT_CAPACITY } from "../src/features/play/wilds-raid-round.js";
import { WILDS_RAID_FIGHTERS_PER_SQUAD, WILDS_RAID_SQUADS } from "../src/features/play/wilds-raid-core.js";

describe("Wilds V3 Slice 4 release contract", () => {
  it("seals the complete bounded boss ecology grammar", () => {
    assert.equal(WILDS_BOSS_FAMILIES.length, 8);
    assert.equal(new Set(WILDS_BOSS_FAMILIES).size, 8);
    assert.equal(WILDS_RAID_SQUADS * WILDS_RAID_FIGHTERS_PER_SQUAD, 36);
    assert.equal(WILDS_RAID_SUPPORT_CAPACITY, 144);
    assert.equal(WILDS_RAID_LEASE_MS, 90_000);
  });

  it("ships Save V9 while accepting every earlier portable V3-era save", () => {
    assert.match(serializePlayState(initialPlayState), /receiz\.wilds\.save\.v9/);
    for (let version = 2; version <= 8; version += 1) {
      const restored = restorePlayState(JSON.stringify({ schema: `receiz.wilds.save.v${version}`, state: initialPlayState }));
      assert.deepEqual(restored.raidEvents, []);
    }
  });

  it("keeps boss assets, audio, authority, and rendering local and semantic", () => {
    const files = [
      "src/features/play/WildsBossEnvironment.tsx", "src/features/play/WildsWorldCanvas.tsx", "src/features/play/WildsRaidExperience.tsx",
      "src/features/play/wilds-audio.ts", "src/features/play/wilds-world-service.ts", "src/features/play/use-wilds-world.ts"
    ].map((path) => readFileSync(path, "utf8")).join("\n");
    assert.doesNotMatch(files, /elevenlabs|gemini|tripo|googleapis|mapbox|openstreetmap/i);
    assert.doesNotMatch(files, /type:\s*"raid\.act"[^\n]*(?:damage|support):/);
    assert.match(files, /WILDS_BOSS_FAMILIES/);
    assert.match(files, /instancedMesh/);
    assert.match(files, /__THREE_GAME_DIAGNOSTICS__/);
  });

  it("retains the mobile one-viewport and renderer budget gates", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const quality = readFileSync("src/features/play/wilds-quality-profile.ts", "utf8");
    assert.match(css, /\.wilds-raid-experience\s*\{[^}]*height:\s*100dvh;[^}]*overflow:\s*hidden/s);
    assert.match(css, /\.wilds-raid-action\s*\{[^}]*min-height:\s*44px/s);
    assert.match(quality, /maxDrawCalls:\s*160/);
    assert.match(quality, /maxTriangles:\s*180_000/);
  });
});
