import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WildsWorldService } from "../src/features/play/wilds-world-service.js";
import { replayWildsWorld } from "../src/features/play/wilds-world-state.js";

const pulse = "2026-07-15T21:00:00.000Z";
const authority = (at: string) => ({ actorId: "player:ecologist", canonical: true, pulse: at, occurredAt: at });

describe("canonical Wilds ecology service", () => {
  it("admits one bounded ecology ensemble and replays it exactly", () => {
    const service = new WildsWorldService();
    const first = service.tickEcology({ pulse, occurredAt: pulse, systemActorId: "receiz:pulse" });
    const duplicate = service.tickEcology({ pulse, occurredAt: pulse, systemActorId: "receiz:pulse" });

    assert.equal(first.events.length, 8);
    assert.equal(first.events.every((event) => event.kind === "ecology.spawned"), true);
    assert.equal(Object.keys(first.projection.ecologySites).length, 8);
    assert.deepEqual(replayWildsWorld(service.events()), first.projection);
    assert.equal(duplicate.events.length, 0);
  });

  it("requires physical canonical discovery and deduplicates it", () => {
    const service = new WildsWorldService();
    const world = service.tickEcology({ pulse, occurredAt: pulse, systemActorId: "receiz:pulse" }).projection;
    const site = Object.values(world.ecologySites)[0]!;

    assert.throws(() => service.execute({ type: "ecology.discover", siteId: site.id, position: { x: 0, z: 0 }, commandId: "ecology:discover:far" }, authority("2026-07-15T21:01:00.000Z")), /wilds_ecology_location_invalid/);
    const first = service.execute({ type: "ecology.discover", siteId: site.id, position: site.position, commandId: "ecology:discover:near" }, authority("2026-07-15T21:02:00.000Z"));
    const duplicate = service.execute({ type: "ecology.discover", siteId: site.id, position: site.position, commandId: "ecology:discover:near" }, authority("2026-07-15T21:02:00.000Z"));

    assert.deepEqual(first.events.map((event) => event.kind), ["ecology.discovered"]);
    assert.equal(first.projection.ecologySites[site.id]?.phase, "discovered");
    assert.equal(duplicate.events.length, 0);
  });

  it("validates proof, activates, contributes, resolves, and records aftermath once", () => {
    const service = new WildsWorldService();
    const world = service.tickEcology({ pulse, occurredAt: pulse, systemActorId: "receiz:pulse" }).projection;
    const site = Object.values(world.ecologySites)[0]!;
    service.execute({ type: "ecology.discover", siteId: site.id, position: site.position, commandId: "ecology:discover:contribution" }, authority("2026-07-15T21:01:00.000Z"));

    assert.throws(() => service.execute({ type: "ecology.contribute", siteId: site.id, position: site.position, amount: 10, cardProofDigest: "bad", commandId: "ecology:bad-proof" }, authority("2026-07-15T21:02:00.000Z")), /wilds_world_card_proof_invalid/);
    const command = { type: "ecology.contribute" as const, siteId: site.id, position: site.position, amount: 10, cardProofDigest: `sha256:${"a".repeat(64)}`, commandId: "ecology:contribute:complete" };
    const result = service.execute(command, authority("2026-07-15T21:03:00.000Z"));
    const duplicate = service.execute(command, authority("2026-07-15T21:03:00.000Z"));

    assert.deepEqual(result.events.map((event) => event.kind), ["ecology.phase_changed", "ecology.contributed", "ecology.phase_changed", "ecology.resolved"]);
    assert.equal(result.projection.ecologySites[site.id]?.phase, "aftermath");
    assert.equal(result.projection.ecologyHistory.includes(site.id), true);
    assert.equal(duplicate.events.length, 0);
  });

  it("blocks noncanonical ecology commands", () => {
    const service = new WildsWorldService();
    const world = service.tickEcology({ pulse, occurredAt: pulse, systemActorId: "receiz:pulse" }).projection;
    const site = Object.values(world.ecologySites)[0]!;
    assert.throws(() => service.execute({ type: "ecology.discover", siteId: site.id, position: site.position, commandId: "ecology:guest:discover" }, { ...authority("2026-07-15T21:01:00.000Z"), canonical: false }), /wilds_world_canonical_authority_required/);
  });

  it("admits one causally linked child on a later Pulse and never duplicates it", () => {
    const service = new WildsWorldService();
    const world = service.tickEcology({ pulse, occurredAt: pulse, systemActorId: "receiz:pulse" }).projection;
    const parent = Object.values(world.ecologySites).find((site) => site.familyId === "stormfront")!;
    service.execute({ type: "ecology.discover", siteId: parent.id, position: parent.position, commandId: "ecology:discover:storm" }, authority("2026-07-15T21:01:00.000Z"));
    service.execute({ type: "ecology.contribute", siteId: parent.id, position: parent.position, amount: 10, cardProofDigest: `sha256:${"b".repeat(64)}`, commandId: "ecology:resolve:storm" }, authority("2026-07-15T21:02:00.000Z"));

    service.tickEcology({ pulse: "2026-07-15T22:00:00.000Z", occurredAt: "2026-07-15T22:00:00.000Z", systemActorId: "receiz:pulse" });
    const children = Object.values(service.snapshot().ecologySites).filter((site) => site.parentSiteId === parent.id);
    service.tickEcology({ pulse: "2026-07-15T23:00:00.000Z", occurredAt: "2026-07-15T23:00:00.000Z", systemActorId: "receiz:pulse" });

    assert.equal(children.length, 1);
    assert.equal(Object.values(service.snapshot().ecologySites).filter((site) => site.parentSiteId === parent.id).length, 1);
  });
});
