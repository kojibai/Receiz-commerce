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
    const stageEnd = source.indexOf('<div className="wilds-screen-controls"');
    const eventToast = source.indexOf('<div className="wilds-event-toast"');

    assert.ok(stageEnd > eventToast);
    assert.match(source, /<details className="wilds-mission-card">/);
    assert.match(source, /<summary>/);
    assert.match(source, /aria-label="Make camp and recover energy"/);
    assert.match(source, /aria-label="Run world mission"/);
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
});
