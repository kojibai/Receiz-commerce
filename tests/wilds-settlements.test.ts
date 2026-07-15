import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateLandmarkAccess } from "../src/features/play/wilds-landmark-access";
import { landmarkApproachPoint, landmarkAtPosition, WILDS_FLAGSHIP_LANDMARKS } from "../src/features/play/wilds-landmarks";
import { describeWildsPoint } from "../src/features/play/wilds-world-geography";
import { WAYFINDER_HOLLOW, WILDS_SETTLEMENTS, settlementAtPosition } from "../src/features/play/wilds-settlements";

describe("Wayfinder Hollow permanent settlement", () => {
  it("owns one stable public coordinate and a walkable approach", () => {
    assert.equal(WAYFINDER_HOLLOW.id, "wayfinder-hollow");
    assert.deepEqual(WAYFINDER_HOLLOW.position, { x: 72, z: 40 });
    assert.equal(WILDS_SETTLEMENTS.length, 1);
    assert.equal(WILDS_FLAGSHIP_LANDMARKS.some((item) => item.id === WAYFINDER_HOLLOW.id), true);
    assert.equal(landmarkAtPosition(WAYFINDER_HOLLOW.position)?.id, WAYFINDER_HOLLOW.id);
    assert.equal(settlementAtPosition(WAYFINDER_HOLLOW.position)?.id, WAYFINDER_HOLLOW.id);
    assert.match(describeWildsPoint(WAYFINDER_HOLLOW.position), /Wayfinder Hollow/);

    const approach = landmarkApproachPoint(WAYFINDER_HOLLOW);
    assert.ok(Math.hypot(approach.x - WAYFINDER_HOLLOW.position.x, approach.z - WAYFINDER_HOLLOW.position.z) > WAYFINDER_HOLLOW.radius);
    assert.equal(evaluateLandmarkAccess(WAYFINDER_HOLLOW, { verifiedCardCount: 0, activeCardLevel: 0, achievementIds: [], partySize: 1 }).allowed, true);
  });

  it("defines five readable districts and three permanent residents", () => {
    assert.deepEqual(WAYFINDER_HOLLOW.districts.map((district) => district.id), ["trail-gate", "dawn-commons", "mosslight-atelier", "cartographer-house", "monument-walk"]);
    assert.equal(new Set(WAYFINDER_HOLLOW.districts.map((district) => district.position.join(":"))).size, 5);
    assert.deepEqual(WAYFINDER_HOLLOW.residents.map((resident) => resident.id), ["mira-vale", "oren-moss", "sola-reed"]);
    assert.equal(new Set(WAYFINDER_HOLLOW.residents.map((resident) => resident.serviceId)).size, 3);
    assert.equal(WAYFINDER_HOLLOW.services.find((service) => service.id === "card-attunement")?.cardRequired, true);
    assert.equal(WAYFINDER_HOLLOW.services.find((service) => service.id === "orientation")?.cardRequired, false);
  });
});
