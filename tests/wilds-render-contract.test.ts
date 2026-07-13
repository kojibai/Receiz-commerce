import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("Receiz Wilds rendering contract", () => {
  it("avoids competing float transforms and unstable contact shadows", async () => {
    const source = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");

    assert.doesNotMatch(source, /\bFloat\b/);
    assert.doesNotMatch(source, /ContactShadows/);
    assert.doesNotMatch(source, /preserveDrawingBuffer/);
    assert.doesNotMatch(source, /<planeGeometry args=\{\[1\.05, 9\.6\]\}/);
    assert.doesNotMatch(source, /tubeGeometry/);
    assert.match(source, /StreamedTerrain/);
  });

  it("exposes renderer and game-state diagnostics for release profiling", async () => {
    const source = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");

    assert.match(source, /__THREE_GAME_DIAGNOSTICS__/);
    assert.match(source, /renderer:\s*gl\.info/);
  });

  it("gives the four companions distinct authored silhouettes", async () => {
    const source = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");

    assert.match(source, /function CreatureDetails/);
    for (const id of ["mintcub", "voltray", "ledgerfox", "titanseal"]) {
      assert.match(source, new RegExp(`cardId === ["']${id}["']`));
    }
  });

  it("keeps compact controls below the world and collapses mission detail", async () => {
    const source = await readFile("src/features/play/PlayCampaign.tsx", "utf8");
    const css = await readFile("app/globals.css", "utf8");
    const stageEnd = source.indexOf('<div className="wilds-screen-controls"');
    const eventToast = source.indexOf('<div className="wilds-event-toast"');

    assert.ok(stageEnd > eventToast);
    assert.match(source, /<details className="wilds-mission-card">/);
    assert.match(source, /<details className="wilds-command-tray wilds-reward-tray">/);
    assert.match(source, /<details className="wilds-command-tray wilds-deck-tray">/);
    assert.match(source, /<details className="wilds-inventory-tray">/);
    assert.match(source, /Portable card vault/);
    assert.match(source, /<summary>/);
    assert.match(source, /aria-label="Make camp and recover energy"/);
    assert.match(source, /aria-label="Run world mission"/);
    assert.match(css, /\.mobile-play-wrap \.wilds-stage\s*\{[^}]*min-height: clamp\(430px, 64dvh, 620px\)/);
    assert.doesNotMatch(css, /\.mobile-play-wrap \.wilds-stage\s*\{[^}]*min-height: 286px/);
  });

  it("uses a drag trackpad and streams terrain around the player", async () => {
    const campaign = await readFile("src/features/play/PlayCampaign.tsx", "utf8");
    const world = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");

    assert.match(campaign, /function WildsTrackpad/);
    assert.match(campaign, /setPointerCapture/);
    assert.match(campaign, /move-vector/);
    assert.match(world, /function StreamedTerrain/);
    assert.match(world, /WORLD_TILE_SIZE/);
  });

  it("renders an accessible Receiz Capsule reward and bounded card inventory", async () => {
    const campaign = await readFile("src/features/play/PlayCampaign.tsx", "utf8");
    const reward = await readFile("src/features/play/WildsCaptureReward.tsx", "utf8");
    const inventory = await readFile("src/features/play/WildsInventory.tsx", "utf8");
    const card = await readFile("src/features/play/WildsCard.tsx", "utf8");
    const css = await readFile("app/globals.css", "utf8");

    assert.match(campaign, /type: "search-point"/);
    assert.match(campaign, /type: "advance-encounter"/);
    assert.match(campaign, /WildsCaptureReward/);
    assert.match(campaign, /WildsInventory/);
    assert.match(campaign, /useState\(initialPlayState\)/);
    assert.match(campaign, /setState\(restorePlayState\(window\.localStorage\.getItem\(WILDS_SAVE_KEY\)\)\)/);
    assert.match(reward, /role="dialog"/);
    assert.match(reward, /aria-live="assertive"/);
    assert.match(reward, /wilds-capture-capsule/);
    assert.match(inventory, /type="search"/);
    assert.match(inventory, /INVENTORY_PAGE_SIZE = 36/);
    assert.match(inventory, /downloadPortableCard/);
    assert.match(inventory, /type: "evolve"/);
    assert.match(card, /wilds-card-foil/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.wilds-capture-capsule/);
  });

  it("keeps creatures hidden until an exact terrain search reveals one", async () => {
    const state = await readFile("src/features/play/game-state.ts", "utf8");
    const world = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");

    assert.match(state, /searchHiddenHotspots/);
    assert.match(world, /function SearchableTerrain/);
    assert.match(world, /function EncounterSequence/);
    assert.match(world, /const encounter = state\.encounter/);
    assert.doesNotMatch(world, /nearbyCreatureCards\(state\.player\)/);
    assert.doesNotMatch(world, /\{creatureCards\.map/);
  });
});
