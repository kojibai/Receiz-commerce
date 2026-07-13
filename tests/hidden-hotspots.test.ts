import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hotspotsForRegion,
  nearbyHiddenHotspots,
  searchHiddenHotspots
} from "../src/features/play/hidden-hotspots.js";

describe("Wilds hidden hotspots", () => {
  it("covers all 250 families across deterministic regions", () => {
    const ids = new Set<string>();
    for (let z = -16; z <= 16; z += 1) {
      for (let x = -16; x <= 16; x += 1) {
        hotspotsForRegion(x, z).forEach((hotspot) => ids.add(hotspot.familyId));
      }
    }

    assert.equal(ids.size, 250);
    assert.deepEqual(hotspotsForRegion(7, -4), hotspotsForRegion(7, -4));
    assert.equal(hotspotsForRegion(7, -4).every((hotspot) => hotspot.formId.endsWith("-1")), true);
  });

  it("streams a bounded set of stable hiding places around the player", () => {
    const first = nearbyHiddenHotspots({ x: 125.5, z: -77.25 });
    const second = nearbyHiddenHotspots({ x: 125.5, z: -77.25 });

    assert.deepEqual(first, second);
    assert.equal(first.length > 0, true);
    assert.equal(first.length <= 24, true);
    assert.equal(new Set(first.map((hotspot) => hotspot.id)).size, first.length);
  });

  it("distinguishes hits, hints, empty searches, and captured hotspots", () => {
    const hotspot = hotspotsForRegion(3, 2)[0]!;
    assert.equal(searchHiddenHotspots([hotspot], hotspot.position, []).kind, "hit");
    const hint = searchHiddenHotspots(
      [hotspot],
      { x: hotspot.position.x + 2.5, z: hotspot.position.z },
      []
    );
    assert.equal(hint.kind, "near_miss");
    if (hint.kind === "near_miss") assert.equal(hint.direction.x < 0, true);
    assert.equal(
      searchHiddenHotspots([hotspot], { x: hotspot.position.x + 20, z: hotspot.position.z }, []).kind,
      "empty"
    );
    assert.equal(searchHiddenHotspots([hotspot], hotspot.position, [hotspot.id]).kind, "captured");
  });
});
