import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  exchangeMarketTruth,
  projectExchangeDesk,
  stateWithExchangeTrade,
  stateWithListedExchangeAsset
} from "../src/lib/storefront/proof-exchange.js";
import { baseState } from "./support/commerce-state.js";

describe("exchange market truth", () => {
  it("treats legacy and seeded market data as demo instead of live", () => {
    const desk = projectExchangeDesk(baseState(), "2026-07-01T11:05:00.000Z");

    assert.equal(desk.selected?.marketTruth.status, "demo");
    assert.equal(desk.selected?.marketTruth.statusLabel, "Demo market");
    assert.equal(desk.selected?.marketTruth.priceLabel, "Seller reference");
    assert.equal(desk.selected?.liquidityLabel, "Demo");
    assert.equal(desk.selected?.volumeLabel, "Demo");
  });

  it("marks a server-verified proof listing as a fresh seller ask", () => {
    const state = baseState();
    const proofAsset = {
      id: "proof-uploaded-pass",
      name: "Uploaded pass",
      type: "limited_drop" as const,
      ownerId: "merchant.receiz.id",
      status: "owned" as const,
      priceLabel: "$100.00",
      proofSource: "claim-uploaded-pass",
      manifest: state.exchange.assets[0]!.manifest,
      verifiedArtifact: {
        filename: "pass.json",
        kind: "receiz.proof_bundle",
        verifiedAt: "2026-07-01T12:10:00.000Z",
        warnings: []
      }
    };
    const listed = stateWithListedExchangeAsset(
      { ...state, assets: [proofAsset], exchange: { ...state.exchange, assets: [], selectedAssetId: "" } },
      {
        source: "asset",
        asset: proofAsset,
        actorReceizId: "merchant.receiz.id",
        recordedAt: "2026-07-01T12:10:00.000Z"
      }
    );
    const truth = exchangeMarketTruth(listed.exchange.assets[0]!, "2026-07-01T12:15:00.000Z");

    assert.equal(truth.status, "fresh");
    assert.equal(truth.statusLabel, "Verified market");
    assert.equal(truth.priceSource, "seller_ask");
    assert.equal(truth.priceLabel, "Seller ask");
    assert.match(truth.sourceLabel, /asset\.listed/);
  });

  it("keeps product-derived listings explicitly demo", () => {
    const state = baseState();
    const listed = stateWithListedExchangeAsset(
      { ...state, exchange: { ...state.exchange, assets: [], selectedAssetId: "" } },
      {
        source: "product",
        product: state.products[0]!,
        actorReceizId: "merchant.receiz.id",
        recordedAt: "2026-07-01T12:10:00.000Z"
      }
    );

    assert.equal(exchangeMarketTruth(listed.exchange.assets[0]!, "2026-07-01T12:11:00.000Z").status, "demo");
  });

  it("promotes a settled trade to verified price provenance and later marks it stale", () => {
    const traded = stateWithExchangeTrade(baseState(), {
      assetId: "exchange-coffee-pack",
      side: "buy",
      shares: 2,
      actorReceizId: "customer.receiz.id",
      settlementLedgerEventId: "ledger_settlement_42",
      recordedAt: "2026-07-01T12:00:00.000Z"
    });
    const asset = traded.exchange.assets[0]!;

    assert.equal(exchangeMarketTruth(asset, "2026-07-01T12:05:00.000Z").status, "fresh");
    assert.equal(exchangeMarketTruth(asset, "2026-07-01T12:05:00.000Z").priceSource, "settled_trade");
    assert.equal(exchangeMarketTruth(asset, "2026-07-01T12:05:00.000Z").priceLabel, "Last settled price");
    assert.equal(exchangeMarketTruth(asset, "2026-07-01T12:31:00.000Z").status, "stale");
  });
});
