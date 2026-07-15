import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sealCollectedCard } from "../src/features/play/portable-card.js";
import { replayWildsWorld } from "../src/features/play/wilds-world-state.js";
import { WildsWorldService } from "../src/features/play/wilds-world-service.js";

const pulse = "2026-07-15T12:00:00.000Z";
const card = sealCollectedCard({ capturedAt: pulse, encounterId: "world-raid-card", formId: "mintcub-1", ownerReceizId: "player-1" });

describe("canonical boss world service", () => {
  it("admits semantic actions in Pulse/Kai-Klok order and replays exact global health", () => {
    const service = new WildsWorldService();
    const spawned = service.tick({ pulse, occurredAt: pulse, systemActorId: "receiz:pulse" }).projection;
    const boss = Object.values(spawned.bosses)[0]!;
    const round = Object.values(spawned.raids)[0]!;
    const authority = { actorId: "player-1", canonical: true, card, pulse: "2026-07-15T12:01:00.000Z", occurredAt: "2026-07-15T12:01:00.000Z" };
    service.execute({ type: "raid.enter", bossId: boss.id, roundId: round.id, position: boss.position as { x: number; z: number }, commandId: "command:enter:raid" }, authority);
    const before = service.snapshot().bosses[boss.id]!.health;
    const result = service.execute({ type: "raid.act", bossId: boss.id, roundId: round.id, intent: "strike", commandId: "command:act:strike" }, { ...authority, pulse: "2026-07-15T12:02:00.000Z", occurredAt: "2026-07-15T12:02:00.000Z" });

    assert.equal(result.projection.bosses[boss.id]!.health < before, true);
    assert.deepEqual(replayWildsWorld(service.events()), result.projection);
    assert.deepEqual(service.execute({ type: "raid.act", bossId: boss.id, roundId: round.id, intent: "strike", commandId: "command:act:strike" }, { ...authority, pulse: "2026-07-15T12:03:00.000Z", occurredAt: "2026-07-15T12:03:00.000Z" }).events, []);
  });

  it("requires a verified owned card for canonical impact", () => {
    const service = new WildsWorldService();
    const projection = service.tick({ pulse, occurredAt: pulse, systemActorId: "receiz:pulse" }).projection;
    const boss = Object.values(projection.bosses)[0]!;
    const round = Object.values(projection.raids)[0]!;
    assert.throws(() => service.execute({ type: "raid.act", bossId: boss.id, roundId: round.id, intent: "strike", commandId: "command:act:missing" }, {
      actorId: "player-1", canonical: true, pulse: "2026-07-15T12:01:00.000Z", occurredAt: "2026-07-15T12:01:00.000Z"
    }), /wilds_world_verified_card_required/);
  });

  it("records reconnect leases and explicit retreat as ordered world facts", () => {
    const service = new WildsWorldService();
    const projection = service.tick({ pulse, occurredAt: pulse, systemActorId: "receiz:pulse" }).projection;
    const boss = Object.values(projection.bosses)[0]!;
    const round = Object.values(projection.raids)[0]!;
    const base = { actorId: "player-1", canonical: true, card, pulse: "2026-07-15T12:01:00.000Z", occurredAt: "2026-07-15T12:01:00.000Z" };
    service.execute({ type: "raid.enter", bossId: boss.id, roundId: round.id, position: boss.position as { x: number; z: number }, commandId: "command:lease:enter" }, base);
    service.execute({ type: "raid.lease", bossId: boss.id, roundId: round.id, status: "disconnected", commandId: "command:lease:away" }, { ...base, pulse: "2026-07-15T12:02:00.000Z", occurredAt: "2026-07-15T12:02:00.000Z" });
    const afterLease = service.snapshot().raids[round.id] as unknown as { leases: Record<string, { expiresAt: string | null }> };
    assert.equal(afterLease.leases["player-1"]!.expiresAt, "2026-07-15T12:03:30.000Z");
    service.execute({ type: "raid.retreat", bossId: boss.id, roundId: round.id, commandId: "command:lease:retreat" }, { ...base, pulse: "2026-07-15T12:03:00.000Z", occurredAt: "2026-07-15T12:03:00.000Z" });
    const afterRetreat = service.snapshot().raids[round.id] as unknown as { squads: string[][] };
    assert.equal(afterRetreat.squads.flat().includes("player-1"), false);
  });
});
