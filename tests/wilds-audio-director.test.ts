import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createWildsAudioDirector,
  regionAudioIdentityForPosition,
  regionAudioBankForPosition,
} from "../src/features/play/audio/wilds-audio-director";
import { WILDS_AUDIO_ASSETS } from "../src/features/play/audio/wilds-audio-catalog";

describe("Wilds adaptive audio director", () => {
  it("maps the five regions to the approved sonic identities", () => {
    assert.equal(regionAudioIdentityForPosition({ x: 0, z: 0 }), "organic-mythic-scifi");
    assert.equal(regionAudioIdentityForPosition({ x: 96, z: -72 }), "epic-high-fantasy");
    assert.equal(regionAudioIdentityForPosition({ x: -128, z: 94 }), "futuristic-electronic");
    assert.equal(regionAudioIdentityForPosition({ x: -24, z: -158 }), "epic-high-fantasy");
    assert.equal(regionAudioIdentityForPosition({ x: 126, z: 68 }), "organic-mythic-scifi");
    assert.equal(regionAudioBankForPosition({ x: 122, z: 62 }), "amberweald");
  });

  it("prevents repetition and respects per-emitter cue cooldown", async () => {
    let now = 1_000;
    const plays: string[] = [];
    const director = createWildsAudioDirector({
      assets: WILDS_AUDIO_ASSETS,
      now: () => now,
      play: ({ asset }) => { plays.push(asset.id); },
    });

    await director.emit({ type: "effect", cue: "battle-hit", emitterId: "target:1" });
    await director.emit({ type: "effect", cue: "battle-hit", emitterId: "target:1" });
    await director.emit({ type: "effect", cue: "battle-hit", emitterId: "target:2" });
    now += 100;
    await director.emit({ type: "effect", cue: "battle-hit", emitterId: "target:1" });

    assert.deepEqual(plays, ["effects.battle-hit", "effects.battle-hit", "effects.battle-hit"]);
  });

  it("crossfades regional streams without restarting unchanged music", async () => {
    const transitions: string[] = [];
    const retained: string[][] = [];
    const director = createWildsAudioDirector({
      assets: WILDS_AUDIO_ASSETS,
      play: () => undefined,
      transitionStream: ({ asset }) => { transitions.push(asset.id); },
      retainBanks: (banks) => { retained.push([...banks].sort()); },
    });

    await director.updateWorld({ position: { x: 0, z: 0 }, intensity: "exploration" });
    await director.updateWorld({ position: { x: 2, z: 1 }, intensity: "exploration" });
    await director.updateWorld({ position: { x: 96, z: -72 }, intensity: "battle" });

    assert.deepEqual(transitions, [
      "ambience.verdant-heartlands.day",
      "music.verdant-heartlands.exploration",
      "ambience.echo-highlands.day",
      "music.echo-highlands.battle",
    ]);
    assert.deepEqual(retained.at(-1), ["echo-highlands", "global"]);
  });
});
