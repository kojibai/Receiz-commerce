import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("Wayfarer playable UI contract", () => {
  it("routes wandering markets to a playable proof-pinned Merchant Circuit", async () => {
    const ecology = await readFile("src/features/play/WildsEcologyExperience.tsx", "utf8");
    const experience = await readFile("src/features/play/market/WayfarerMarketExperience.tsx", "utf8");
    const scene = await readFile("src/features/play/market/WayfarerMarketScene.tsx", "utf8");
    const controls = await readFile("src/features/play/market/WayfarerMarketControls.tsx", "utf8");
    assert.match(ecology, /site\.familyId === "wandering-market"/);
    assert.match(experience, /generateMarketBoard/);
    assert.match(experience, /createMarketRuntime/);
    assert.match(experience, /stepMarketRuntime/);
    assert.match(experience, /marketTranscript/);
    assert.match(experience, /\/api\/wilds\/market/);
    assert.match(experience, /sealMarketMortalConsent/);
    assert.match(scene, /<Canvas/);
    assert.match(scene, /__WAYFARER_MARKET_DIAGNOSTICS__/);
    assert.match(controls, /market-mobile-controls/);
  });

  it("ships bounded responsive controls, safe areas, and reduced-motion support", async () => {
    const css = await readFile("app/globals.css", "utf8");
    assert.match(css, /\.wayfarer-market-experience[\s\S]*height:\s*100dvh/);
    assert.match(css, /\.wayfarer-market-experience[\s\S]*overflow:\s*hidden/);
    assert.match(css, /\.market-mobile-controls[\s\S]*safe-area-inset-bottom/);
    assert.match(css, /\.market-control[\s\S]*min-height:\s*44px/);
    assert.match(css, /@media \(max-width:\s*320px\)[\s\S]*wayfarer/);
    assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*wayfarer/);
  });
});
