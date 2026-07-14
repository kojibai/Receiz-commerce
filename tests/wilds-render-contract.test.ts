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
    assert.match(source, /wilds-coordinate-badges/);
    assert.match(source, /Discovery on/);
    assert.doesNotMatch(source, /setSearchArmed\(false\)/);
    assert.match(source, /state\.encounter\.proximity/);
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
    const cardExport = await readFile("src/features/play/card-export.ts", "utf8");
    const css = await readFile("app/globals.css", "utf8");
    const growth = await readFile("src/features/play/WildsGrowthPanel.tsx", "utf8");
    const transformation = await readFile("src/features/play/WildsTransformation.tsx", "utf8");
    const ceremony = await readFile("src/features/play/WildsChildCeremony.tsx", "utf8");

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
    assert.match(inventory, /Set as active deck leader/);
    assert.match(inventory, /type: "select-asset"/);
    assert.match(inventory, /type: "evolve"/);
    assert.match(card, /wilds-card-foil/);
    assert.match(card, /renderHeartboundSvg/);
    assert.match(card, /fit:\s*"full-body"/);
    assert.match(cardExport, /renderHeartboundSvg/);
    assert.match(growth, /What remains/);
    assert.match(growth, /Revision history/);
    assert.match(transformation, /aria-label="Living card transformation"/);
    assert.match(transformation, /aria-live="assertive"/);
    assert.match(ceremony, /Both parents remain yours/);
    assert.match(ceremony, /aria-label="Living child ceremony"/);
    assert.match(inventory, /WildsGrowthPanel/);
    assert.match(campaign, /WildsTransformation/);
    assert.match(campaign, /WildsChildCeremony/);
    assert.doesNotMatch(card, /wilds-card-creature-core/);
    assert.doesNotMatch(cardExport, /function creatureMark/);
    assert.match(css, /\.heartbound-card-art\s*>\s*svg\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*max-width:\s*100%;/s);
    assert.match(css, /\.heartbound-card-art\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*10;/s);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.wilds-capture-capsule/);
  });

  it("renders a complete living character back with exact proof controls", async () => {
    const cardBack = await readFile("src/features/play/WildsCardBack.tsx", "utf8");

    assert.match(cardBack, /aria-label="Living card back"/);
    assert.match(cardBack, /Character story/);
    assert.match(cardBack, /Personality/);
    assert.match(cardBack, /Gameplay intelligence/);
    assert.match(cardBack, /Full visual DNA/);
    assert.match(cardBack, /Complete offline proof/);
    assert.match(cardBack, /Copy canonical proof/);
    assert.match(cardBack, /Download canonical proof/);
    assert.match(cardBack, /Generate exact PNG proof metadata/);
    assert.match(cardBack, /aria-live="polite"/);
  });

  it("resolves public cards across devices and physically flips the complete card", async () => {
    const page = await readFile("src/features/play/WildsCardPage.tsx", "utf8");
    const scene = await readFile("src/features/play/WildsCardScene.tsx", "utf8");
    const cardExport = await readFile("src/features/play/card-export.ts", "utf8");
    const css = await readFile("app/globals.css", "utf8");
    const campaign = await readFile("src/features/play/PlayCampaign.tsx", "utf8");

    assert.match(page, /fetch\(`\/api\/cards\/\$\{encodeURIComponent\(assetId\)\}`/);
    assert.doesNotMatch(page, /not found locally/i);
    assert.match(scene, /WildsCardBack/);
    assert.match(scene, /aria-pressed=\{flipped\}/);
    assert.match(scene, /wilds-card-flipper/);
    assert.match(cardExport, /registerPublicWildsCard/);
    assert.match(css, /backface-visibility:\s*hidden/);
    assert.match(css, /clip-path:\s*inset\(0 round/);
    assert.doesNotMatch(css, /\.wilds-card-foil\s*\{[^}]*inset:\s*-35%/s);
    assert.match(campaign, /\{deckCards\.length\}\/∞/);
  });

  it("keeps creatures hidden until an exact terrain search reveals one", async () => {
    const state = await readFile("src/features/play/game-state.ts", "utf8");
    const world = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");
    const campaign = await readFile("src/features/play/PlayCampaign.tsx", "utf8");
    const battle = await readFile("src/features/play/WildsBattle.tsx", "utf8");

    assert.match(state, /searchHiddenHotspots/);
    assert.match(world, /function SearchableTerrain/);
    assert.match(world, /function InstancedGroundCover/);
    assert.match(world, /<InstancedGroundCover player=\{player\} tiles=\{tiles\}/);
    assert.match(world, /function ExplorerAvatar/);
    assert.match(world, /movingUntil/);
    assert.match(campaign, /Choose your explorer/);
    assert.match(campaign, /Female explorer/);
    assert.match(campaign, /Male explorer/);
    assert.match(campaign, /<WildsBattle/);
    assert.match(battle, /wilds-battle-health/);
    assert.match(battle, /aria-label="Capture weakened creature"/);
    assert.match(battle, /Switch active card/);
    assert.match(battle, /battle\.wild\.hpRatio > 0\.3/);
    assert.match(world, /function EncounterSequence/);
    assert.match(world, /const encounter = state\.encounter/);
    assert.doesNotMatch(world, /nearbyCreatureCards\(state\.player\)/);
    assert.doesNotMatch(world, /\{creatureCards\.map/);
    assert.doesNotMatch(world, /habitatNodes\.map/);
    assert.match(world, /function RustlingClue/);
    assert.match(world, /encounter\.proximity === "hot"/);
    assert.match(world, /HabitatCover cover=\{encounter\.cover/);
    assert.match(campaign, /signal-\$\{state\.encounter\.proximity\}/);
  });

  it("uses Next navigation for every internal standalone-card action", async () => {
    const source = await readFile("src/features/play/WildsCardPage.tsx", "utf8");

    assert.match(source, /import Link from "next\/link"/);
    assert.doesNotMatch(source, /<a\s+[^>]*href=\{?[`"]\/?/);
    assert.match(source, /<Link className="wilds-card-home" href="\/#play">/);
    assert.match(source, /<Link href=\{`\/?\?card=/);
  });
});
