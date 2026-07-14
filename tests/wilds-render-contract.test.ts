import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("Receiz Wilds rendering contract", () => {
  it("layers an authored biome around meaningful landmarks", async () => {
    const environment = await readFile("src/features/play/WildsEnvironment.tsx", "utf8");
    const world = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");

    assert.match(environment, /name="world-layer-play"/);
    assert.match(environment, /function GroundField/);
    assert.match(environment, /name="world-layer-mid"/);
    assert.match(environment, /name="world-layer-far"/);
    assert.match(environment, /function HearttreeSanctum/);
    assert.match(environment, /function RootArch/);
    assert.match(environment, /<mesh position=\{\[0, 1\.14, 0\]\}>/);
    assert.match(environment, /function SpringLandmark/);
    assert.match(environment, /const springStones = useRef<THREE\.InstancedMesh>/);
    assert.match(environment, /const farCanopyMesh = useRef<THREE\.InstancedMesh>/);
    assert.match(environment, /args=\{\[undefined, undefined, silhouettes\.length\]\}/);
    assert.match(environment, /instancedMesh/);
    assert.match(world, /<WildsEnvironment/);
  });

  it("builds the explorer from articulated anatomy and secondary motion", async () => {
    const explorer = await readFile("src/features/play/WildsExplorer.tsx", "utf8");
    const world = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");

    for (const joint of ["hips", "spine", "leftElbow", "rightElbow", "leftKnee", "rightKnee", "satchel", "scarf"]) {
      assert.match(explorer, new RegExp(joint));
    }
    assert.match(explorer, /movingUntil/);
    assert.match(explorer, /breath/);
    assert.match(explorer, /footPlant/);
    assert.match(world, /<WildsExplorer/);
  });

  it("adds deterministic canopy atmosphere and proximity motion", async () => {
    const atmosphere = await readFile("src/features/play/WildsAtmosphere.tsx", "utf8");
    const world = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");

    assert.match(atmosphere, /function SunShafts/);
    assert.match(atmosphere, /function PollenDrift/);
    assert.match(atmosphere, /function CanopyShadows/);
    assert.match(atmosphere, /foliage-surge/);
    assert.match(world, /<WildsAtmosphere/);
  });

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

  it("uses a warning-free quality profile and publishes budget status", async () => {
    const world = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");
    const pkg = JSON.parse(await readFile("package.json", "utf8")) as { dependencies: Record<string, string> };

    assert.equal(pkg.dependencies.three, "0.182.0");
    assert.doesNotMatch(world, /\n\s*shadows\s*\n/);
    assert.match(world, /shadows=\{\{ type: THREE\.PCFShadowMap \}\}/);
    assert.match(world, /qualityProfile\.dpr/);
    assert.match(world, /rendererBudgetStatus/);
    assert.match(world, /warningFreeCompatibility/);
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
    const environment = await readFile("src/features/play/WildsEnvironment.tsx", "utf8");

    assert.match(campaign, /function WildsTrackpad/);
    assert.match(campaign, /setPointerCapture/);
    assert.match(campaign, /move-vector/);
    assert.match(world, /function StreamedTerrain/);
    assert.match(environment, /WILDS_TILE_SIZE/);
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
    assert.match(campaign, /const restored = restorePlayState\(window\.localStorage\.getItem\(WILDS_SAVE_KEY\)\)/);
    assert.match(reward, /role="dialog"/);
    assert.match(reward, /aria-live="assertive"/);
    assert.match(reward, /wilds-capture-capsule/);
    assert.match(reward, /wilds-capture-showcase/);
    assert.doesNotMatch(reward, /<WildsCard asset=\{asset\} compact/);
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
    assert.match(css, /\.wilds-capture-showcase\s*\{[^}]*isolation:\s*isolate/s);
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
    const cardRoute = await readFile("app/api/cards/[assetId]/route.ts", "utf8");
    const inventory = await readFile("src/features/play/WildsInventory.tsx", "utf8");
    const css = await readFile("app/globals.css", "utf8");
    const campaign = await readFile("src/features/play/PlayCampaign.tsx", "utf8");

    assert.match(page, /fetch\(`\/api\/cards\/\$\{encodeURIComponent\(assetId\)\}`/);
    assert.doesNotMatch(page, /not found locally/i);
    assert.match(scene, /WildsCardBack/);
    assert.match(scene, /wilds-card-flipper/);
    assert.match(scene, /onPointerDown/);
    assert.match(scene, /onPointerUp/);
    assert.match(scene, /Math\.abs\(deltaX\) >= 28/);
    assert.match(scene, /event\.key === "Enter" \|\| event\.key === " "/);
    assert.match(scene, /aria-hidden=\{flipped\}/);
    assert.match(scene, /aria-hidden=\{!flipped\}/);
    assert.doesNotMatch(scene, /wilds-card-flip-control/);
    assert.doesNotMatch(css, /\.wilds-card-flip-control/);
    assert.match(cardExport, /attemptPublicWildsCardRegistration/);
    assert.match(cardExport, /BROWSER_RECEIZ_ID_SESSION_KEY/);
    assert.match(cardRoute, /publishPublicStoreWithIdentityProof/);
    assert.match(cardRoute, /compactCardPath\(assetId\)/);
    assert.match(cardRoute, /const hasPublicationAuthority/);
    assert.match(cardRoute, /published:\s*false/);
    assert.doesNotMatch(cardRoute, /status:[^\n]*503/);
    assert.match(inventory, /Publishing verified card link/);
    assert.match(inventory, /Portable PNG downloaded/);
    assert.match(inventory, /Portable PNG downloaded and verifies offline/);
    assert.match(cardExport, /premiumQrSvg\(cardPath/);
    assert.match(cardExport, /attemptPublicWildsCardRegistration/);
    assert.match(cardExport, /return \{ published: publication\.published \}/);
    assert.match(cardExport, /errorCorrectionLevel:\s*"L"/);
    assert.match(css, /backface-visibility:\s*hidden/);
    assert.match(css, /-webkit-backface-visibility:\s*hidden/);
    assert.match(css, /\.wilds-card-face-back\s*\{[^}]*opacity:\s*0/);
    assert.match(css, /\.wilds-card-flipper\.is-flipped\s+\.wilds-card-face-back\s*\{[^}]*opacity:\s*1/);
    assert.match(css, /clip-path:\s*inset\(0 round/);
    assert.doesNotMatch(css, /\.wilds-card-foil\s*\{[^}]*inset:\s*-35%/s);
    assert.match(campaign, /\{deckCards\.length\}\/∞/);
  });

  it("keeps creatures hidden until an exact terrain search reveals one", async () => {
    const state = await readFile("src/features/play/game-state.ts", "utf8");
    const world = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");
    const environment = await readFile("src/features/play/WildsEnvironment.tsx", "utf8");
    const campaign = await readFile("src/features/play/PlayCampaign.tsx", "utf8");
    const battle = await readFile("src/features/play/WildsBattle.tsx", "utf8");

    assert.match(state, /searchHiddenHotspots/);
    assert.match(world, /function SearchableTerrain/);
    assert.match(environment, /function EcologyInstances/);
    assert.match(environment, /<EcologyInstances/);
    assert.match(world, /<WildsExplorer/);
    assert.match(environment, /projectWildsBiome/);
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

  it("renders the SDK-native live multiplayer loop inside the shared world", async () => {
    const campaign = await readFile("src/features/play/PlayCampaign.tsx", "utf8");
    const world = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");
    const multiplayer = await readFile("src/features/play/WildsMultiplayer.tsx", "utf8");
    const hook = await readFile("src/features/play/use-wilds-multiplayer.ts", "utf8");
    const styles = await readFile("app/globals.css", "utf8");

    assert.match(campaign, /useWildsMultiplayer/);
    assert.match(campaign, /remotePlayers=\{multiplayer\.remotePlayers\}/);
    assert.match(campaign, /multiplayer\.activeBattle \? " pvp-active"/);
    assert.match(world, /function RemoteExplorer/);
    assert.match(world, /onSelectPlayer/);
    assert.match(world, /zIndexRange=\{\[12, 0\]\}/);
    assert.match(multiplayer, /Copy invite link/);
    assert.doesNotMatch(multiplayer, />PRACTICE</);
    assert.match(multiplayer, /viewBox="0 0 24 24"/);
    assert.doesNotMatch(multiplayer, /className="sr-only">Copy invite link/);
    assert.match(multiplayer, /window\.setTimeout\(\(\) => setNotice\(""\), 2_800\)/);
    assert.doesNotMatch(styles, /content: "↗"/);
    assert.match(styles, /\.wilds-live-badge, \.wilds-live-share \{ min-height: 30px/);
    assert.match(styles, /\.wilds-live-share \{[\s\S]*?width: 30px/);
    assert.match(multiplayer, /Friendly battle/);
    assert.match(multiplayer, /Return to world/);
    assert.match(hook, /dismissBattle/);
    assert.match(multiplayer, /Card stake/);
    assert.match(multiplayer, /Compliance locked/);
    assert.match(hook, /\/api\/wilds\/multiplayer\/session/);
    assert.match(hook, /\/api\/wilds\/multiplayer\/snapshot/);
    assert.match(hook, /wildsJoin/);
  });

  it("keeps animated card foil inside rounded inventory corners", async () => {
    const styles = await readFile("app/globals.css", "utf8");

    assert.match(styles, /--card-border: 8px/);
    assert.match(styles, /\.wilds-card-foil \{[\s\S]*?z-index: 0;/);
    assert.match(styles, /background-clip: padding-box/);
    assert.match(styles, /backface-visibility: hidden/);
    assert.match(styles, /\.wilds-collectible-card > :not\(\.wilds-card-foil\)/);
  });

  it("uses Next navigation for every internal standalone-card action", async () => {
    const source = await readFile("src/features/play/WildsCardPage.tsx", "utf8");

    assert.match(source, /import Link from "next\/link"/);
    assert.doesNotMatch(source, /<a\s+[^>]*href=\{?[`"]\/?/);
    assert.match(source, /<Link className="wilds-card-home" href="\/#play">/);
    assert.match(source, /<Link href=\{`\/?\?card=/);
  });

  it("imports verified card and vault PNGs into one-of-one shop products", async () => {
    const products = await readFile("src/features/admin/ProductEditorPanel.tsx", "utf8");

    assert.match(products, /verifyPortableCardPng/);
    assert.match(products, /verifyPortableVaultPng/);
    assert.match(products, /wildsStoreProduct/);
    assert.match(products, /Import card or vault/);
    assert.match(products, /one product per verified card/i);
  });

  it("integrates a gesture-safe audio lifecycle and accessible settings", async () => {
    const campaign = await readFile("src/features/play/PlayCampaign.tsx", "utf8");
    const hook = await readFile("src/features/play/use-wilds-presentation.ts", "utf8");
    const controls = await readFile("src/features/play/WildsAudioSettings.tsx", "utf8");

    assert.match(campaign, /useWildsPresentation/);
    assert.match(campaign, /<WildsAudioSettings/);
    assert.match(hook, /pointerdown/);
    assert.match(hook, /runtime\.destroy\(\)/);
    assert.match(controls, /aria-label="Wilds audio settings"/);
    assert.match(controls, /Master volume/);
    assert.match(controls, /Effects volume/);
    assert.match(controls, /Ambience volume/);
    assert.match(controls, /Music volume/);
    assert.match(controls, /Mute Wilds audio/);
    assert.match(campaign, /wilds-audio-overlay/);
    const worldControls = campaign.slice(campaign.indexOf('className="wilds-screen-controls"'));
    assert.doesNotMatch(worldControls, /<WildsAudioSettings/);
  });
});
