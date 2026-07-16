import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("Hearttree expedition UI contract", () => {
  it("uses the deterministic runtime and real squad instead of the legacy button trial", async () => {
    const expedition = await readFile("src/features/play/hearttree/HearttreeExpedition.tsx", "utf8");
    const scene = await readFile("src/features/play/hearttree/HearttreeScene.tsx", "utf8");
    const controls = await readFile("src/features/play/hearttree/HearttreeControls.tsx", "utf8");
    const landmark = await readFile("src/features/play/WildsLandmarkExperience.tsx", "utf8");
    assert.match(scene, /<Canvas/);
    assert.match(expedition, /createHearttreeRuntime/);
    assert.match(expedition, /stepHearttreeRuntime/);
    assert.match(expedition, /generateHearttreeExpedition/);
    assert.match(expedition, /hearttree-select-squad|onSquadChange/);
    assert.match(expedition, /\/api\/wilds\/hearttree/);
    assert.match(expedition, /mortalConsent/);
    assert.match(expedition, /permanent-death/);
    assert.match(expedition, /aria-live="polite"/);
    assert.match(expedition, /prefers-reduced-motion/);
    assert.match(controls, /kind: "move"/);
    assert.match(controls, /kind: "dodge"/);
    assert.match(controls, /kind: "guard"/);
    assert.match(controls, /kind: "ability"/);
    assert.match(controls, /kind: "switch"/);
    assert.match(controls, /kind: "extract"/);
    assert.match(controls, /health/);
    assert.match(controls, /stamina/);
    assert.match(controls, /cooldowns/);
    assert.match(landmark, /<HearttreeExpedition/);
    assert.doesNotMatch(landmark, /createHearttreeTrial|applyHearttreeIntent/);
  });

  it("has mobile-safe touch controls and reduced-motion behavior", async () => {
    const css = await readFile("app/globals.css", "utf8");
    assert.match(css, /\.hearttree-expedition\s*\{[^}]*height:\s*100dvh;[^}]*overflow:\s*hidden/s);
    assert.match(css, /\.hearttree-touch-control[^}]*min-height:\s*44px/s);
    assert.match(css, /\.hearttree-expedition[^}]*padding-top:\s*env\(safe-area-inset-top\)/s);
    assert.match(css, /@media \(max-width:\s*430px\)[\s\S]*\.hearttree-hud/s);
    assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.hearttree-/s);
  });
});
