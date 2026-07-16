import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  projectWildsSpatialEmitter,
  wildsDistanceAttenuation,
} from "../src/features/play/audio/wilds-spatial-audio";

describe("Wilds spatial audio", () => {
  it("projects a bounded positional emitter relative to the listener", () => {
    assert.deepEqual(
      projectWildsSpatialEmitter({
        listener: { x: 10, y: 1, z: 10 },
        source: { x: 18, y: 1, z: 6 },
        maxDistance: 32,
      }),
      { x: 8, y: 0, z: -4, distance: Math.sqrt(80), audible: true },
    );
  });

  it("marks distant emitters inaudible and uses a smooth bounded rolloff", () => {
    assert.equal(projectWildsSpatialEmitter({
      listener: { x: 0, y: 0, z: 0 },
      source: { x: 40, y: 0, z: 0 },
      maxDistance: 32,
    }).audible, false);
    assert.equal(wildsDistanceAttenuation(0, 32), 1);
    assert.equal(wildsDistanceAttenuation(32, 32), 0);
    assert.ok(wildsDistanceAttenuation(8, 32) > wildsDistanceAttenuation(24, 32));
  });
});
