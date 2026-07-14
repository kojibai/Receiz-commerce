import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { encounterFromSearch, idleEncounterState } from "../src/features/play/encounter-state";
import { hotspotsForRegion } from "../src/features/play/hidden-hotspots";

describe("Wilds encounter presentation state", () => {
  const hotspot = hotspotsForRegion(0, 0)[0]!;

  it("turns an exact hotspot search into a covered battle intro", () => {
    const encounter = encounterFromSearch(
      { kind: "hit", hotspot, distance: 0 },
      hotspot.position,
      "2026-07-13T15:00:00.000Z",
      "player.receiz.id"
    );

    assert.equal(encounter.phase, "battle_intro");
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
    assert.equal(encounter.proximity, "warm");
    assert.equal(encounter.distance, 3);
    assert.equal(encounter.trend, null);
  });

  it("reports whether repeated searches are getting closer", () => {
    const first = encounterFromSearch(
      { kind: "near_miss", hotspot, distance: 3.8, direction: { x: 1, z: 0 } },
      { x: hotspot.position.x - 3.8, z: hotspot.position.z },
      "2026-07-13T15:00:00.000Z",
      "player.receiz.id"
    );
    const closer = encounterFromSearch(
      { kind: "near_miss", hotspot, distance: 1.8, direction: { x: 1, z: 0 } },
      { x: hotspot.position.x - 1.8, z: hotspot.position.z },
      "2026-07-13T15:00:01.000Z",
      "player.receiz.id",
      first
    );

    assert.equal(closer.proximity, "hot");
    assert.equal(closer.trend, "closer");
  });

  it("uses cold feedback for an empty exact-point search", () => {
    const encounter = encounterFromSearch(
      { kind: "empty" },
      { x: 99, z: 99 },
      "2026-07-13T15:00:00.000Z",
      "player.receiz.id"
    );

    assert.equal(encounter.phase, "searching");
    assert.equal(encounter.proximity, "cold");
  });

  it("represents an untouched game with a stable idle value", () => {
    assert.deepEqual(idleEncounterState, { phase: "idle" });
  });
});
