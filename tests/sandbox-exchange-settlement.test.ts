import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { settleSandboxExchangeTrade } from "../src/lib/exchange/sandbox-settlement.js";
import { baseState } from "./support/commerce-state.js";

describe("sandbox Exchange settlement", () => {
  it("settles demo buys server-side and returns updated ownership", () => {
    const state = baseState();
    const asset = state.exchange.assets[0]!;
    const result = settleSandboxExchangeTrade(state, {
      actorReceizId: "buyer.receiz.id",
      assetId: asset.id,
      settlementLedgerEventId: "sandbox-ledger-1",
      shares: 3,
      side: "buy",
      recordedAt: "2026-07-13T21:00:00.000Z"
    });

    assert.equal(result.preview.shares, 3);
    assert.equal(result.state.exchange.assets[0]?.userShares, asset.userShares + 3);
    assert.equal(result.state.exchange.assets[0]?.appendEvents[0]?.settlementLedgerEventId, "sandbox-ledger-1");
  });

  it("rejects invalid shares and unauthorized demo sells", () => {
    const state = baseState();
    const asset = state.exchange.assets[0]!;
    assert.throws(() => settleSandboxExchangeTrade(state, { actorReceizId: "buyer.receiz.id", assetId: asset.id, shares: 1.5, side: "buy" }), /shares_invalid/);
    assert.throws(() => settleSandboxExchangeTrade(state, { actorReceizId: "buyer.receiz.id", assetId: asset.id, shares: 1, side: "sell" }), /sell_authority/);
  });
});
