import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildExchangeTradePreview,
  exchangeAssetSnapshot,
  projectExchangeDesk,
  stateWithListedExchangeAsset,
  stateWithExchangeLiquidity,
  stateWithExchangeTrade
} from "../src/lib/storefront/proof-exchange.js";
import { baseState } from "./support/commerce-state.js";

describe("proof exchange", () => {
  it("projects proof assets with value, order book, and wallet-first settlement", () => {
    const state = baseState();
    const desk = projectExchangeDesk(state);

    assert.equal(desk.assets.length, 1);
    assert.equal(desk.selected?.symbol, "COFFEE");
    assert.equal(desk.selected?.sourcePrimitive, "receiz.asset_manifest.v1");
    assert.equal(desk.walletFirstLabel, "Receiz wallet first");
    assert.equal(desk.selected?.latestPriceLabel, "$18.00");
    assert.equal(desk.selected?.deterministicValueLabel, "$1,800.00");
    assert.equal(desk.selected?.orderBook.bids.length, 1);
    assert.equal(desk.selected?.orderBook.asks.length, 1);
  });

  it("previews fractional buys with wallet first and card delta", () => {
    const state = baseState();
    const asset = state.exchange.assets[0]!;
    const preview = buildExchangeTradePreview(asset, "buy", 8, 2_500);

    assert.equal(preview.totalCents, 14_400);
    assert.equal(preview.walletAppliedCents, 2_500);
    assert.equal(preview.cardDeltaCents, 11_900);
    assert.equal(preview.cardRequired, true);
    assert.equal(preview.resultingShares, 8);
  });

  it("lists uploaded proof-object manifests without replacing the verified source", () => {
    const state = baseState();
    const listed = stateWithListedExchangeAsset(
      {
        ...state,
        assets: [
          {
            id: "proof-uploaded-pass",
            name: "Uploaded pass",
            type: "limited_drop",
            ownerId: "merchant.receiz.id",
            status: "owned",
            priceLabel: "$1.00",
            proofSource: "claim-uploaded-pass",
            manifest: {
              schema: "receiz.asset_manifest.v1",
              assetId: "asset_uploaded_pass",
              assetType: "proof_object",
              proof: {
                kind: "receiz.proof_bundle",
                verifyUrl: "https://receiz.com/v/uploaded-pass/claim-uploaded-pass/1782965191557178",
                kaiPulseEternal: "1782965191557178",
                kaiKlok: "kai:1782965191557178",
                receizClaimId: "claim-uploaded-pass",
                artifactSha256Basis: "sha256:uploaded-pass"
              },
              owner: {
                receizSubject: "merchant.receiz.id",
                displayName: "Merchant",
                custody: "current"
              },
              links: {
                verify: "https://receiz.com/v/uploaded-pass/claim-uploaded-pass/1782965191557178"
              }
            }
          }
        ]
      },
      {
        source: "asset",
        asset: {
          id: "proof-uploaded-pass",
          name: "Uploaded pass",
          type: "limited_drop",
          ownerId: "merchant.receiz.id",
          status: "owned",
          priceLabel: "$1.00",
          proofSource: "claim-uploaded-pass",
          manifest: {
            schema: "receiz.asset_manifest.v1",
            assetId: "asset_uploaded_pass",
            assetType: "proof_object",
            proof: {
              kind: "receiz.proof_bundle",
              verifyUrl: "https://receiz.com/v/uploaded-pass/claim-uploaded-pass/1782965191557178",
              kaiPulseEternal: "1782965191557178",
              kaiKlok: "kai:1782965191557178",
              receizClaimId: "claim-uploaded-pass",
              artifactSha256Basis: "sha256:uploaded-pass"
            },
            owner: {
              receizSubject: "merchant.receiz.id",
              displayName: "Merchant",
              custody: "current"
            },
            links: {
              verify: "https://receiz.com/v/uploaded-pass/claim-uploaded-pass/1782965191557178"
            }
          }
        },
        actorReceizId: "merchant.receiz.id",
        recordedAt: "2026-07-01T12:10:00.000Z"
      }
    );
    const asset = listed.exchange.assets[0]!;

    assert.equal(asset.manifest.assetId, "asset_uploaded_pass");
    assert.equal(asset.manifest.proof.receizClaimId, "claim-uploaded-pass");
    assert.equal(asset.manifest.proof.verifyUrl, "https://receiz.com/v/uploaded-pass/claim-uploaded-pass/1782965191557178");
    assert.equal(asset.manifest.links.verify, "https://receiz.com/v/uploaded-pass/claim-uploaded-pass/1782965191557178");
    assert.equal(asset.manifest.owner.custody, "fractionalized");
    assert.equal(asset.appendEvents[0]?.proofObjectId, "asset_uploaded_pass");
    assert.equal(listed.assets[0]?.status, "listed");
  });

  it("uses a canonical Receiz /v proof URL for listed assets", () => {
    const state = baseState();
    const listed = stateWithListedExchangeAsset(state, {
      source: "product",
      product: state.products[0]!,
      actorReceizId: "merchant.receiz.id",
      recordedAt: "2026-07-01T12:10:00.000Z"
    });
    const asset = listed.exchange.assets[0]!;

    assert.match(asset.manifest.proof.verifyUrl, /^https:\/\/receiz\.com\/v\//);
    assert.equal(asset.manifest.links.verify, asset.manifest.proof.verifyUrl);
  });

  it("appends a market trade and mints child ownership proof locally", () => {
    const state = baseState();
    const traded = stateWithExchangeTrade(state, {
      assetId: "exchange-coffee-pack",
      side: "buy",
      shares: 4,
      actorReceizId: "customer.receiz.id",
      walletBalanceCents: 10_000,
      recordedAt: "2026-07-01T12:00:00.000Z"
    });
    const asset = traded.exchange.assets[0]!;

    assert.equal(asset.userShares, 4);
    assert.equal(asset.availableShares, 96);
    assert.equal(asset.appendEvents[0]?.type, "market.trade");
    assert.equal(asset.appendEvents[0]?.childProofObjectId, "exchange-coffee-pack:share:customer-receiz-id:20260701120000000Z");
    assert.equal(asset.chart.at(-1)?.priceCents, asset.lastPriceCents);
    assert.equal(traded.proofEvents[0]?.type, "EXCHANGE_TRADE");
    assert.match(traded.proofEvents[0]?.detail ?? "", /4 shares/);
  });

  it("appends deterministic liquidity without replacing proof history", () => {
    const state = baseState();
    const withLiquidity = stateWithExchangeLiquidity(state, {
      assetId: "exchange-coffee-pack",
      amountCents: 12_000,
      actorReceizId: "market-maker.receiz.id",
      recordedAt: "2026-07-01T12:05:00.000Z"
    });
    const asset = withLiquidity.exchange.assets[0]!;

    assert.equal(asset.liquidityCents, 42_000);
    assert.equal(asset.appendEvents[0]?.type, "liquidity.appended");
    assert.equal(asset.appendEvents.length, state.exchange.assets[0]!.appendEvents.length + 1);
    assert.equal(exchangeAssetSnapshot(asset).knownHead.afterEntryId, asset.appendEvents[0]?.id);
  });
});
