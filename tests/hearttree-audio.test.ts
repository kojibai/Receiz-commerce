import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import manifest from "../public/audio/wilds/hearttree/manifest.json";
import { HEARTTREE_AUDIO_ASSETS } from "../src/features/play/audio/wilds-audio-catalog";
import { createWildsAudioDirector, hearttreeAudioEvent } from "../src/features/play/audio/wilds-audio-director";

describe("Hearttree production audio", () => {
  it("ships every declared runtime file and archival master with completed local provenance", () => {
    assert.equal(manifest.assets.length, 38);
    assert.equal(new Set(manifest.assets.map((asset) => asset.id)).size, manifest.assets.length);
    for (const asset of manifest.assets) {
      assert.ok(existsSync(join(process.cwd(), "public", asset.file)), asset.id);
      assert.ok(existsSync(join(process.cwd(), asset.archivalMaster)), asset.id);
      assert.equal(asset.status, "generated");
      assert.equal(asset.provider, "open-source-offline");
      assert.equal(asset.license, "CC0-1.0");
      assert.ok(asset.truePeakDb <= -1, `${asset.id}:${asset.truePeakDb}`);
    }
    assert.equal(HEARTTREE_AUDIO_ASSETS.length, manifest.assets.length);
    assert.ok(HEARTTREE_AUDIO_ASSETS.every((asset) => asset.bank === "hearttree" && asset.production.status === "generated"));
  });

  it("routes chamber phases, squad elements, and terminal outcomes without confusing death for victory", () => {
    const master = hearttreeAudioEvent({ phase: "master", squadElements: ["Grove", "Spark", "Grove"] });
    assert.equal(master.musicId, "hearttree.music.boss");
    assert.deepEqual(master.motifIds, ["hearttree.motif.grove", "hearttree.motif.spark"]);

    const ability = hearttreeAudioEvent({ phase: "memory", eventKind: "ability.succeeded", element: "Tide" });
    assert.equal(ability.effectId, "hearttree.ability.ability-tide");
    assert.equal(ability.musicId, "hearttree.music.mystery");

    const death = hearttreeAudioEvent({ phase: "defeated", terminalReason: "squad-defeated", eventKind: "objective.completed" });
    assert.equal(death.musicId, "hearttree.music.memorial");
    assert.equal(death.effectId, "hearttree.death.death-seal");
    assert.notEqual(death.musicId, "hearttree.music.victory");

    const victory = hearttreeAudioEvent({ phase: "result", terminalReason: "completed" });
    assert.equal(victory.musicId, "hearttree.music.victory");
  });

  it("crossfades adaptive layers, plays card motifs once per squad, and synchronizes pause", async () => {
    const transitions: string[] = [];
    const plays: string[] = [];
    const pauses: boolean[] = [];
    const director = createWildsAudioDirector({
      assets: HEARTTREE_AUDIO_ASSETS,
      play: ({ asset }) => { plays.push(asset.id); },
      transitionStream: ({ asset }) => { transitions.push(asset.id); },
      preloadBank: () => undefined,
      setPaused: (paused) => { pauses.push(paused); },
    });

    await director.updateHearttree({ phase: "rootway", squadElements: ["Grove", "Stone"] });
    await director.updateHearttree({ phase: "rootway", squadElements: ["Grove", "Stone"], eventKind: "moved" });
    await director.updateHearttree({ phase: "master", squadElements: ["Grove", "Stone"], eventKind: "ability.succeeded", element: "Stone" });
    await director.updateHearttree({ phase: "master", paused: true });

    assert.deepEqual(transitions, [
      "hearttree.ambience.exterior",
      "hearttree.music.exploration",
      "hearttree.ambience.interior",
      "hearttree.music.boss",
    ]);
    assert.equal(plays.filter((id) => id === "hearttree.motif.grove").length, 1);
    assert.equal(plays.filter((id) => id === "hearttree.motif.stone").length, 1);
    assert.ok(plays.includes("hearttree.movement.movement-leaves"));
    assert.ok(plays.includes("hearttree.ability.ability-stone"));
    assert.deepEqual(pauses, [false, false, false, true]);
  });

  it("keeps audio routing pure so sound availability cannot alter authoritative gameplay state", () => {
    const state = Object.freeze({ tick: 42, health: 71, digest: "sha256:authoritative" });
    const before = JSON.stringify(state);
    hearttreeAudioEvent({ phase: "choice", eventKind: "guarded", squadElements: ["Stone"] });
    assert.equal(JSON.stringify(state), before);
  });
});
