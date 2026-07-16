import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createWildsAudioLoader } from "../src/features/play/audio/wilds-audio-loader";
import type { WildsAudioAsset } from "../src/features/play/audio/wilds-audio-types";

function audioAsset(id: string, bank: WildsAudioAsset["bank"], url: string): WildsAudioAsset {
  return {
    id,
    bus: "effects",
    bank,
    priority: 50,
    cooldownMs: 0,
    maxConcurrent: 2,
    stream: false,
    spatial: false,
    variants: [{ url, durationSeconds: 1, loop: false, gain: 1 }],
    production: {
      provider: "internal-authored",
      prompt: "Original test fixture sound with a clear transient and controlled tail.",
      format: "mp3_44100_128",
      status: "planned",
      generatedAt: null,
      rights: "original-authored",
    },
  };
}

describe("Wilds audio loader", () => {
  it("deduplicates loads and evicts inactive banks within its decoded-memory budget", async () => {
    let fetchCount = 0;
    const assets = [
      audioAsset("effects.confirm", "global", "/audio/wilds/global/confirm.mp3"),
      audioAsset("effects.prism", "prism-coast", "/audio/wilds/regions/prism.mp3"),
    ];
    const loader = createWildsAudioLoader({
      assets,
      maxDecodedBytes: 16,
      fetchImpl: async () => {
        fetchCount += 1;
        return new Response(new Uint8Array([1, 2, 3, 4]));
      },
      decode: async () => ({ duration: 1, length: 2, numberOfChannels: 2 }),
    });

    await Promise.all([loader.preloadBank("global"), loader.preloadBank("global")]);
    assert.equal(fetchCount, 1);
    assert.equal(loader.snapshot().decodedBytes, 16);

    await loader.preloadBank("prism-coast");
    loader.retainBanks(new Set(["prism-coast"]));

    assert.equal(fetchCount, 2);
    assert.equal(loader.snapshot().decodedBytes, 16);
    assert.deepEqual(loader.snapshot().loadedAssetIds, ["effects.prism"]);
  });

  it("reports a missing asset without producing a synthetic fallback", async () => {
    const loader = createWildsAudioLoader({
      assets: [audioAsset("effects.confirm", "global", "/audio/wilds/global/confirm.mp3")],
      fetchImpl: async () => new Response(null, { status: 404 }),
      decode: async () => ({ duration: 1, length: 1, numberOfChannels: 1 }),
      maxDecodedBytes: 1024,
    });

    await assert.rejects(loader.load("effects.confirm"), /audio_asset_load_failed/);
    assert.deepEqual(loader.snapshot().failures, ["effects.confirm"]);
    assert.equal(loader.snapshot().loadedAssetIds.length, 0);
  });
});
