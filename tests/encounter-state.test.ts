import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { encounterFromSearch, idleEncounterState } from "../src/features/play/encounter-state";
import { hotspotsForRegion } from "../src/features/play/hidden-hotspots";

describe("Wilds encounter presentation state", () => {
  const hotspot = hotspotsForRegion(0, 0)[0]!;

  it("turns an exact hotspot search into a covered emergence", () => {
    const encounter = encounterFromSearch(
      { kind: "hit", hotspot, distance: 0 },
      hotspot.position,
      "2026-07-13T15:00:00.000Z",
      "player.receiz.id"
    );

    assert.equal(encounter.phase, "emerging");
    assert.equal(encounter.hotspotId, hotspot.id);
    assert.equal(encounter.cover, hotspot.cover);
    assert.equal(encounter.formId, hotspot.formId);
  });

  it("keeps directional clues separate from capturable encounters", () => {
    const encounter = encounterFromSearch(
      { kind: "near_miss", hotspot, distance: 3, direction: { x: 1, z: 0 } },
      { x: hotspot.position.x - 3, z: hotspot.position.z },
      "2026-07-13T15:00:00.000Z",
      "player.receiz.id"
    );

    assert.equal(encounter.phase, "hint");
    assert.deepEqual(encounter.direction, { x: 1, z: 0 });
    assert.equal(encounter.hotspotId, hotspot.id);
  });

  it("represents an untouched game with a stable idle value", () => {
    assert.deepEqual(idleEncounterState, { phase: "idle" });
  });
});
