import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { projectMarketCard } from "../src/features/play/market/card-role";
import { generateMarketBoard } from "../src/features/play/market/contract-director";
import { createMarketNegotiation } from "../src/features/play/market/negotiation-resolver";
import { sealMarketReceipt } from "../src/features/play/market/receipt";
import { createMarketRuntime, stepMarketRuntime, type MarketInput, type MarketRuntimeState } from "../src/features/play/market/runtime";
import { marketTranscript } from "../src/features/play/market/transcript";
import { applyWildsInput, initialPlayState, restorePlayState, serializePlayState } from "../src/features/play/game-state";
import { marketFixtureInput } from "./support/market-fixtures";

type InputIntent = MarketInput extends infer Value ? Value extends MarketInput ? Omit<Value, "sequence" | "tick"> : never : never;

function apply(state: MarketRuntimeState, input: InputIntent, contract: ReturnType<typeof generateMarketBoard>["contracts"][number]) {
  return stepMarketRuntime(state, { ...input, sequence: state.sequence + 1, tick: state.tick + 1 } as MarketInput, contract);
}

function marketReceiptFixture() {
  const card = initialPlayState.inventory[0]!;
  const prior = initialPlayState.adventureConditions[card.id]!;
  const capability = projectMarketCard(card, prior);
  const contract = generateMarketBoard(marketFixtureInput([capability])).contracts[0];
  const terms = createMarketNegotiation(contract).terms;
  let state = createMarketRuntime(contract, terms, [capability]);
  const cargo = contract.intelligence.find((node) => node.kind === "cargo")!;
  while (Math.hypot(state.player.x - cargo.position.x, state.player.z - cargo.position.z) > 1) {
    state = apply(state, { kind: "move", vector: { x: Math.sign(cargo.position.x - state.player.x), z: Math.sign(cargo.position.z - state.player.z) } }, contract);
  }
  state = apply(state, { kind: "inspect", targetId: cargo.id }, contract);
  state = apply(state, { kind: "negotiate", action: { kind: "commit" } }, contract);
  state = apply(state, { kind: "extract" }, contract);
  return sealMarketReceipt({
    contract,
    terms,
    transcript: marketTranscript(state),
    squad: [capability],
    priorConditions: { [card.id]: prior },
    mortalConsent: null,
    actorId: "wilds.player.receiz.id",
    publicationRevision: 1,
    createdAt: "2026-07-16T23:30:00.000Z",
  });
}

describe("Wayfarer Save V10 projection", () => {
  it("migrates Save V9 shared conditions without losing Hearttree compatibility", () => {
    const legacyState = { ...initialPlayState } as Partial<typeof initialPlayState> & { adventureConditions?: unknown };
    delete legacyState.adventureConditions;
    const restored = restorePlayState(JSON.stringify({ schema: "receiz.wilds.save.v9", state: legacyState }));
    const id = restored.inventory[0]!.id;
    assert.equal(restored.adventureConditions[id]!.life, "alive");
    assert.equal(restored.hearttreeConditions[id]!.life, "alive");
    assert.match(serializePlayState(restored), /receiz\.wilds\.save\.v10/);
  });

  it("adopts one verified Market receipt and preserves resources, reputation, and squad", () => {
    const receipt = marketReceiptFixture();
    const first = applyWildsInput(initialPlayState, { type: "market-admit", receipt });
    const duplicate = applyWildsInput(first, { type: "market-admit", receipt });
    const assetId = initialPlayState.inventory[0]!.id;
    assert.equal(first.marketReceipts.length, 1);
    assert.ok(first.adventureConditions[assetId]!.xp.market > 0);
    assert.ok(first.marketReputation > 0);
    assert.ok(Object.values(first.marketResources).some((amount) => amount > 0));
    assert.deepEqual(first.marketSquadAssetIds, [assetId]);
    assert.deepEqual(duplicate, first);
  });

  it("rejects invalid Market squads and selects only living verified cards", () => {
    const id = initialPlayState.inventory[0]!.id;
    assert.deepEqual(applyWildsInput(initialPlayState, { type: "market-select-squad", assetIds: [] }), initialPlayState);
    assert.deepEqual(applyWildsInput(initialPlayState, { type: "market-select-squad", assetIds: ["missing"] }), initialPlayState);
    assert.deepEqual(applyWildsInput(initialPlayState, { type: "market-select-squad", assetIds: [id, id] }).marketSquadAssetIds, [id]);
  });
});
