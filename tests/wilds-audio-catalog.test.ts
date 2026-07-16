import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WILDS_AUDIO_ASSETS,
  WILDS_NAMED_AUDIO_BANKS,
  requiredWildsAudioCoverage,
} from "../src/features/play/audio/wilds-audio-catalog";
import { WILDS_AUDIO_PRODUCTION } from "../src/features/play/audio/wilds-audio-production";

describe("Wilds production audio catalog", () => {
  it("covers every required semantic cue with local production assets", () => {
    const ids = new Set(WILDS_AUDIO_ASSETS.map((asset) => asset.id));

    for (const id of requiredWildsAudioCoverage()) {
      assert.ok(ids.has(id), `missing ${id}`);
    }

    for (const asset of WILDS_AUDIO_ASSETS) {
      assert.match(asset.variants[0]?.url ?? "", /^\/audio\/wilds\//);
      assert.ok(!asset.variants.some((variant) => variant.url.includes("placeholder")));
      assert.ok(asset.variants.length >= 1);
    }
  });

  it("requires complete production provenance for every declared asset", () => {
    for (const asset of WILDS_AUDIO_ASSETS) {
      assert.ok(asset.production.prompt.length >= 24, asset.id);
      assert.equal(asset.production.format, "mp3_44100_128");
      assert.match(asset.production.status, /^(planned|generated)$/);
      if (asset.production.status === "generated") {
        assert.match(asset.production.generatedAt ?? "", /^\d{4}-\d{2}-\d{2}$/);
      } else {
        assert.equal(asset.production.generatedAt, null);
      }
      assert.match(asset.production.rights, /^original-/);
      assert.ok(asset.priority >= 0 && asset.priority <= 100);
      assert.ok(asset.maxConcurrent >= 1);
    }
  });

  it("defines all five regional banks and every ecology and boss family bank", () => {
    const banks = new Set(WILDS_AUDIO_ASSETS.map((asset) => asset.bank));

    for (const region of WILDS_NAMED_AUDIO_BANKS) {
      assert.ok(banks.has(region), `missing region bank ${region}`);
    }

    assert.equal([...banks].filter((bank) => bank.startsWith("ecology:")).length, 8);
    assert.equal([...banks].filter((bank) => bank.startsWith("boss:")).length, 8);
  });

  it("uses no cloud sound provider or runtime audio dependency", () => {
    const allowedProviders = new Set(["internal-authored", "open-source-offline", "recorded-original"]);
    for (const asset of WILDS_AUDIO_ASSETS) {
      assert.ok(allowedProviders.has(asset.production.provider), asset.id);
      assert.doesNotMatch(JSON.stringify(asset.production), /elevenlabs|cloud|api[_-]?key/i);
      if (asset.bus === "dialogue") assert.equal(asset.production.provider, "recorded-original");
    }
    assert.equal(WILDS_AUDIO_PRODUCTION.externalService, false);
    assert.deepEqual(WILDS_AUDIO_PRODUCTION.runtimeAudioDependencies, []);
    assert.equal(WILDS_AUDIO_PRODUCTION.credentialEnvironmentVariable, null);
  });
});
