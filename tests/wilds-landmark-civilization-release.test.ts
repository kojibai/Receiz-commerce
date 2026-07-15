import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { initialPlayState, restorePlayState } from "../src/features/play/game-state";
import { createWildsCivicEvent, normalizeWildsCivicActorId, projectWildsCivicHistory, verifyWildsCivicEvent } from "../src/features/play/wilds-civic-history";
import { createWildsPlayerVault, reconcileWildsPlayerVault } from "../src/features/play/wilds-player-vault";
import { WAYFINDER_HOLLOW } from "../src/features/play/wilds-settlements";
import { projectWildsAtlas } from "../src/features/play/wilds-world-atlas";
import { initialWildsWorldProjection } from "../src/features/play/wilds-world-state";

function civic(sourceId: string, occurredAt: string, digest: string | null = null) {
  return createWildsCivicEvent({
    settlementId: "wayfinder-hollow",
    actorId: "player:release",
    kind: digest ? "service.completed" : "resident.met",
    sourceId,
    occurredAt,
    cardProofDigest: digest,
    reputation: 5
  });
}

describe("Wilds landmark civilization release", () => {
  it("replays civic history deterministically and caps duplicate service completion", () => {
    const first = civic("orientation", "2026-07-15T18:00:00.000Z");
    const duplicate = civic("orientation", "2026-07-15T18:01:00.000Z");
    const projection = projectWildsCivicHistory([duplicate, first, first]);

    assert.deepEqual(projection, projectWildsCivicHistory([duplicate, first, first]));
    assert.equal(projection.reputation, 5);
    assert.deepEqual(projection.completedSourceIds, ["orientation"]);
    assert.equal(normalizeWildsCivicActorId("player@example.com"), "player-example.com");
  });

  it("rejects invalid proof attunement and restores legacy V5 with safe civic defaults", () => {
    const attunement = civic("card-attunement:release", "2026-07-15T18:02:00.000Z", `sha256:${"a".repeat(64)}`);
    assert.equal(verifyWildsCivicEvent(attunement).ok, true);
    assert.equal(verifyWildsCivicEvent({ ...attunement, cardProofDigest: `sha256:${"b".repeat(63)}` }).ok, false);

    const legacy = { ...initialPlayState } as Record<string, unknown>;
    delete legacy.civicEvents;
    delete legacy.regionalReputation;
    const restored = restorePlayState(JSON.stringify({ schema: "receiz.wilds.save.v5", state: legacy }));
    assert.deepEqual(restored.civicEvents, []);
    assert.deepEqual(restored.regionalReputation, {});
  });

  it("carries civic history through V3 vault reconciliation without changing canonical world truth", () => {
    const event = civic("resident:mira-vale", "2026-07-15T18:03:00.000Z");
    const playState = { ...initialPlayState, civicEvents: [event], regionalReputation: { "wayfinder-hollow": 5 } };
    const restored = createWildsPlayerVault({
      playerId: "player:release",
      exportedAt: "2026-07-15T18:04:00.000Z",
      playState,
      settings: { avatarStyle: "female", movementMode: "walk", audio: {} },
      personalEvents: [],
      canonicalCursor: { worldId: "wilds:global:v3", revision: 0, eventId: null },
      receipts: []
    });
    const canonical = initialWildsWorldProjection();
    const reconciled = reconcileWildsPlayerVault({ local: initialPlayState, restored, canonical, actorId: "player:release" });

    assert.deepEqual(reconciled.state.civicEvents, [event]);
    assert.equal(reconciled.state.regionalReputation["wayfinder-hollow"], 5);
    assert.deepEqual(canonical, initialWildsWorldProjection());
  });

  it("keeps atlas, walkable entrance, monuments, and compact layout on one authority contract", async () => {
    const atlas = projectWildsAtlas({
      center: { x: 0, z: 0 }, zoom: "world", missionProgress: 0, worldMastery: 0,
      discoveredLandmarkIds: ["wayfinder-hollow"], selfId: "release", players: []
    });
    assert.deepEqual(atlas.landmarks.find((item) => item.id === "wayfinder-hollow")?.position, WAYFINDER_HOLLOW.position);

    const environment = await readFile("src/features/play/WildsSettlementEnvironment.tsx", "utf8");
    const experience = await readFile("src/features/play/WildsSettlementExperience.tsx", "utf8");
    const css = await readFile("app/globals.css", "utf8");
    assert.match(environment, /livingWorld\?\.defeatedBossIds/);
    assert.match(experience, /livingWorld\?\.defeatedBossIds/);
    assert.match(experience, /worldMode === "receiz_live"/);
    assert.match(experience, /Local facts are isolated and never presented as shared truth/);
    assert.match(css, /\.wilds-settlement-districts button[^}]*min-height:\s*44px/s);
    assert.match(css, /@media \(max-width:\s*360px\)[\s\S]*\.wilds-settlement-districts button/);
  });
});
