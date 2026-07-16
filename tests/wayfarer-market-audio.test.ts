import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createWildsAudioDirector, marketAudioEvent } from "../src/features/play/audio/wilds-audio-director";

test("Wayfarer audio routes every gameplay phase through audited real recordings", () => {
  assert.deepEqual(marketAudioEvent({ phase: "board" }), {
    ambienceId: "hearttree.ambience.exterior",
    musicId: "hearttree.music.exploration",
    motifIds: [],
    effectId: null,
  });
  assert.equal(marketAudioEvent({ phase: "intelligence", eventKind: "inspected" }).musicId, "hearttree.music.mystery");
  assert.equal(marketAudioEvent({ phase: "negotiation", eventKind: "negotiated" }).effectId, "hearttree.mechanism.mechanism-turn");
  assert.equal(marketAudioEvent({ phase: "execution", risk: "mortal", eventKind: "hazard.hit" }).musicId, "hearttree.music.boss");
  assert.equal(marketAudioEvent({ phase: "result", terminalReason: "completed" }).musicId, "hearttree.music.victory");
  assert.equal(marketAudioEvent({ phase: "defeated", terminalReason: "squad-defeated" }).effectId, "hearttree.death.death-seal");
  assert.deepEqual(marketAudioEvent({ phase: "execution", squadElements: ["Grove", "Spark", "Grove"] }).motifIds, ["hearttree.motif.grove", "hearttree.motif.spark"]);
});

test("Wayfarer director crossfades streams, pauses cleanly, and plays event effects", async () => {
  const streams: string[] = [];
  const effects: string[] = [];
  const pauses: boolean[] = [];
  const director = createWildsAudioDirector({
    play: ({ asset }) => { effects.push(asset.id); },
    transitionStream: ({ asset }) => { streams.push(asset.id); },
    setPaused: (paused) => { pauses.push(paused); },
  });
  await director.updateMarket({ phase: "intelligence", eventKind: "inspected", squadElements: ["Tide"] });
  await director.updateMarket({ phase: "intelligence", paused: true });
  assert.deepEqual(streams, ["hearttree.ambience.interior", "hearttree.music.mystery"]);
  assert.ok(effects.includes("hearttree.leaf.leaf-rustle"));
  assert.ok(effects.includes("hearttree.motif.tide"));
  assert.deepEqual(pauses, [false, true]);
});

test("Wayfarer runtime contains no synthesized tones, speech synthesis, or external audio URLs", async () => {
  const [experience, director, catalog, licenses] = await Promise.all([
    readFile("src/features/play/market/WayfarerMarketExperience.tsx", "utf8"),
    readFile("src/features/play/audio/wilds-audio-director.ts", "utf8"),
    readFile("src/features/play/audio/wilds-audio-catalog.ts", "utf8"),
    readFile("assets-src/audio/hearttree/licenses.json", "utf8"),
  ]);
  const marketRuntime = `${experience}\n${director}`;
  assert.doesNotMatch(marketRuntime, /Oscillator|SpeechSynthesis|speechSynthesis|webkitSpeech/i);
  assert.doesNotMatch(catalog, /variants:\s*\[\{\s*url:\s*["']https?:/);
  assert.match(licenses, /"license": "CC0-1\.0"/);
  assert.match(licenses, /real frame drum|Stereo forest field recording|Performed musical wind chimes/);
});
