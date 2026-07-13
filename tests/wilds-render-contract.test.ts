import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("Receiz Wilds rendering contract", () => {
  it("avoids competing float transforms and coplanar path planes", async () => {
    const source = await readFile("src/features/play/WildsWorldCanvas.tsx", "utf8");

    assert.doesNotMatch(source, /\bFloat\b/);
    assert.doesNotMatch(source, /ContactShadows/);
    assert.doesNotMatch(source, /preserveDrawingBuffer/);
    assert.doesNotMatch(source, /<planeGeometry args=\{\[1\.05, 9\.6\]\}/);
    assert.doesNotMatch(source, /tubeGeometry/);
    assert.match(source, /trailRibbonGeometry/);
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
});
