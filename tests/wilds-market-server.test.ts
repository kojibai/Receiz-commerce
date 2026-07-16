import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NextRequest } from "next/server";
import { emptyAdventureCondition } from "../src/features/play/adventure/card-condition";
import { stepMarketRuntime, type MarketInput, type MarketRuntimeState } from "../src/features/play/market/runtime";
import { marketTranscript } from "../src/features/play/market/transcript";
import {
  executeMarketAdmission,
  resetMarketAdmissionForTests,
  type MarketAdmissionDependencies,
} from "../src/lib/receiz/wilds-market-server";
import { marketRuntimeFixture } from "./support/market-fixtures";

type InputIntent = MarketInput extends infer Value ? Value extends MarketInput ? Omit<Value, "sequence" | "tick"> : never : never;

function apply(state: MarketRuntimeState, input: InputIntent, contract: ReturnType<typeof marketRuntimeFixture>["contract"]) {
  return stepMarketRuntime(state, { ...input, sequence: state.sequence + 1, tick: state.tick + 1 } as MarketInput, contract);
}

function submitted(idempotencyKey = "market-request-0001") {
  const fixture = marketRuntimeFixture();
  let state = fixture.state;
  const cargo = fixture.contract.intelligence.find((node) => node.kind === "cargo")!;
  while (Math.hypot(state.player.x - cargo.position.x, state.player.z - cargo.position.z) > 1) {
    state = apply(state, { kind: "move", vector: { x: Math.sign(cargo.position.x - state.player.x), z: Math.sign(cargo.position.z - state.player.z) } }, fixture.contract);
  }
  state = apply(state, { kind: "inspect", targetId: cargo.id }, fixture.contract);
  state = apply(state, { kind: "negotiate", action: { kind: "commit" } }, fixture.contract);
  state = apply(state, { kind: "extract" }, fixture.contract);
  const cards = [fixture.source.grove, fixture.source.stone] as const;
  const priorConditions = Object.fromEntries(cards.map((card) => [card.id, emptyAdventureCondition(card.id)]));
  return {
    idempotencyKey,
    cards,
    priorConditions,
    contract: fixture.contract,
    terms: fixture.terms,
    transcript: marketTranscript(state),
    mortalConsent: null,
  };
}

function dependencies(options: { practice?: boolean; publish?: boolean; audit?: boolean } = {}) {
  const calls: string[] = [];
  const deps: MarketAdmissionDependencies = {
    resolveActor: async () => ({ playerId: "market.player", handle: "market.player", practice: options.practice ?? false, accessToken: "token" }),
    publish: async () => { calls.push("publish"); return options.publish === false ? false : true; },
    audit: async () => { calls.push("audit"); return options.audit === false ? false : true; },
    now: () => "2026-07-16T23:20:00.000Z",
  };
  return { deps, calls };
}

const request = {} as NextRequest;

describe("Receiz Wayfarer replay admission", () => {
  it("replays and atomically publishes one canonical receipt", async () => {
    resetMarketAdmissionForTests();
    const { deps, calls } = dependencies();
    const body = submitted();
    const result = await executeMarketAdmission(request, body, deps);
    assert.equal(result.publication.published, true);
    assert.equal(result.projection?.revision, 1);
    assert.equal(result.receipt?.actorId, "market.player");
    assert.deepEqual(calls, ["publish", "audit"]);
    assert.deepEqual(await executeMarketAdmission(request, body, deps), result);
    assert.deepEqual(calls, ["publish", "audit"]);
  });

  it("keeps practice previews local and noncanonical", async () => {
    resetMarketAdmissionForTests();
    const { deps, calls } = dependencies({ practice: true });
    const result = await executeMarketAdmission(request, { ...submitted(), guestId: "guest-market-01" }, deps);
    assert.equal(result.receipt, null);
    assert.equal(result.projection, null);
    assert.equal(result.publication.mode, "local_practice");
    assert.deepEqual(calls, []);
  });

  it("rejects ownership, proof changes, replay tampering, and stale conditions", async () => {
    resetMarketAdmissionForTests();
    const body = submitted();
    const wrong = dependencies();
    wrong.deps.resolveActor = async () => ({ playerId: "other", handle: "other", practice: false, accessToken: "token" });
    await assert.rejects(() => executeMarketAdmission(request, body, wrong.deps), /market_card_owner_invalid/);
    await assert.rejects(() => executeMarketAdmission(request, { ...body, contract: { ...body.contract, squadPins: [{ ...body.contract.squadPins[0]!, proofDigest: `sha256:${"f".repeat(64)}` }, ...body.contract.squadPins.slice(1)] } }, dependencies().deps), /market/);
    await assert.rejects(() => executeMarketAdmission(request, { ...body, transcript: { ...body.transcript, finalStateDigest: `sha256:${"e".repeat(64)}` } }, dependencies().deps), /market_transcript_digest_invalid/);

    resetMarketAdmissionForTests();
    await executeMarketAdmission(request, body, dependencies().deps);
    await assert.rejects(() => executeMarketAdmission(request, submitted("market-request-0002"), dependencies().deps), /market_prior_condition_stale/);
  });

  it("does not adopt failed publication or audit revisions", async () => {
    resetMarketAdmissionForTests();
    const body = submitted();
    await assert.rejects(() => executeMarketAdmission(request, body, dependencies({ publish: false }).deps), /market_canonical_publish_required/);
    assert.equal((await executeMarketAdmission(request, body, dependencies().deps)).projection?.revision, 1);

    resetMarketAdmissionForTests();
    await assert.rejects(() => executeMarketAdmission(request, body, dependencies({ audit: false }).deps), /market_canonical_audit_required/);
    assert.equal((await executeMarketAdmission(request, body, dependencies().deps)).projection?.revision, 1);
  });
});
