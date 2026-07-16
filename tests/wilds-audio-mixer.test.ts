import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createWildsAudioMixer } from "../src/features/play/audio/wilds-audio-mixer";

function mixerHarness() {
  let disconnectCount = 0;
  const context = {
    currentTime: 0,
    destination: {},
    createGain() {
      const gain = {
        value: 1,
        setValueAtTime(value: number) { this.value = value; },
        linearRampToValueAtTime(value: number) { this.value = value; },
      };
      return {
        gain,
        connect() {},
        disconnect() { disconnectCount += 1; },
      };
    },
  };
  return { context, disconnectCount: () => disconnectCount };
}

describe("Wilds production audio mixer", () => {
  it("controls six settings groups and applies bounded dialogue ducking", () => {
    const harness = mixerHarness();
    const mixer = createWildsAudioMixer(harness.context);
    mixer.setSettings({
      master: 0.8,
      music: 0.6,
      ambience: 0.5,
      effects: 0.7,
      creatures: 0.65,
      dialogue: 1,
      muted: false,
    });

    mixer.setDialogueActive(true);
    assert.equal(mixer.snapshot().musicDucked, true);
    assert.ok(mixer.snapshot().musicGain < 0.6);
    assert.ok(mixer.snapshot().ambienceGain < 0.5);

    mixer.setDialogueActive(false);
    assert.equal(mixer.snapshot().musicDucked, false);
    assert.equal(mixer.snapshot().musicGain, 0.6);
    assert.equal(mixer.snapshot().ambienceGain, 0.5);
  });

  it("mutes through master and disconnects every graph node on disposal", () => {
    const harness = mixerHarness();
    const mixer = createWildsAudioMixer(harness.context);
    mixer.setMuted(true);
    assert.equal(mixer.snapshot().masterGain, 0);

    mixer.dispose();
    assert.equal(mixer.snapshot().disposed, true);
    assert.equal(harness.disconnectCount(), 6);
  });
});
