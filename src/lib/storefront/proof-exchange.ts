import type {
  CommerceState,
  ExchangeAppendEvent,
  ExchangeAsset,
  ExchangeConfig,
  ExchangeOrderBookLine,
  ExchangePricePoint,
  Product,
  ProofEvent,
  ReceizedAsset
} from "@/types/domain";
import { canonicalReceizVerifyUrl, receizVerifyUrl } from "../receiz/verify-url";

export type ExchangeTradeSide = "buy" | "sell";

export type ExchangeTradeInput = {
  assetId: string;
  side: ExchangeTradeSide;
  shares: number;
  actorReceizId: string;
  walletBalanceCents?: number;
  recordedAt?: string;
};

export type ExchangeLiquidityInput = {
  assetId: string;
  amountCents: number;
  actorReceizId: string;
  recordedAt?: string;
};

export type ExchangeListAssetInput =
  | {
      source: "asset";
      asset: ReceizedAsset;
      actorReceizId: string;
      recordedAt?: string;
    }
  | {
      source: "product";
      product: Product;
      actorReceizId: string;
      recordedAt?: string;
    };

export type ExchangeTradePreview = {
  side: ExchangeTradeSide;
  shares: number;
  priceCents: number;
  totalCents: number;
  totalLabel: string;
  walletAppliedCents: number;
  walletAppliedLabel: string;
  cardDeltaCents: number;
  cardDeltaLabel: string;
  cardRequired: boolean;
  resultingShares: number;
};

export type ExchangeAssetView = Omit<ExchangeAsset, "orderBook"> & {
  sourcePrimitive: "receiz.asset_manifest.v1";
  orderBook: {
    bids: ExchangeOrderBookLine[];
    asks: ExchangeOrderBookLine[];
  };
  deterministicValueLabel: string;
  latestPriceLabel: string;
  liquidityLabel: string;
  volumeLabel: string;
  changeLabel: string;
  ownedPercentLabel: string;
  availablePercentLabel: string;
  spreadLabel: string;
};

export type ExchangeDeskProjection = {
  enabled: boolean;
  headline: string;
  subheadline: string;
  walletFirstLabel: string;
  selected: ExchangeAssetView | null;
  assets: ExchangeAssetView[];
  proofMemoryHead: ExchangeConfig["proofMemoryHead"];
};

const MARKET_MAKER = "receiz.exchange.amm";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}

function formatUsdExact(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}

function clampShares(asset: ExchangeAsset, side: ExchangeTradeSide, shares: number) {
  const wholeShares = Math.max(1, Math.floor(Number.isFinite(shares) ? shares : 1));
  return side === "buy"
    ? Math.min(wholeShares, Math.max(0, asset.availableShares))
    : Math.min(wholeShares, Math.max(0, asset.userShares));
}

function sanitizeCoordinatePart(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "receiz";
}

function stampPart(recordedAt: string) {
  const digits = recordedAt.replace(/\D/g, "");
  return `${digits}${recordedAt.endsWith("Z") ? "Z" : ""}`;
}

function kaiPulseFor(recordedAt: string, asset: ExchangeAsset, sequence = 0) {
  const seed = `${Date.parse(recordedAt) || 0}${asset.manifest.proof.kaiPulseEternal}${sequence}`;
  return seed.replace(/\D/g, "").slice(0, 16) || asset.manifest.proof.kaiPulseEternal;
}

function appendHashFor(parts: string[]) {
  const basis = parts.join(":");
  let hash = 0;
  for (let index = 0; index < basis.length; index += 1) {
    hash = (hash * 31 + basis.charCodeAt(index)) >>> 0;
  }
  return `sha256:exchange-${hash.toString(16).padStart(8, "0")}`;
}

function centsFromPriceLabel(label: string, fallbackCents: number) {
  const match = label.replace(/,/g, "").match(/\$?(\d+(?:\.\d{1,2})?)/);
  if (!match) return fallbackCents;
  return Math.max(1, Math.round(Number(match[1]) * 100));
}

function symbolFromTitle(title: string) {
  const words = title.toUpperCase().match(/[A-Z0-9]+/g) ?? ["ASSET"];
  const joined = words.length === 1 ? words[0] : words.map((word) => word[0]).join("");
  return joined.slice(0, 5).padEnd(Math.min(4, joined.length), "");
}

function spreadFor(asset: ExchangeAsset) {
  const bids = asset.orderBook.filter((line) => line.side === "bid").map((line) => line.priceCents);
  const asks = asset.orderBook.filter((line) => line.side === "ask").map((line) => line.priceCents);
  if (!bids.length || !asks.length) return 0;
  return Math.max(0, Math.min(...asks) - Math.max(...bids));
}

function withView(asset: ExchangeAsset): ExchangeAssetView {
  const changePrefix = asset.change24hBps >= 0 ? "+" : "";
  const bids = asset.orderBook
    .filter((line) => line.side === "bid")
    .sort((left, right) => right.priceCents - left.priceCents);
  const asks = asset.orderBook
    .filter((line) => line.side === "ask")
    .sort((left, right) => left.priceCents - right.priceCents);

  return {
    ...asset,
    sourcePrimitive: "receiz.asset_manifest.v1",
    orderBook: { bids, asks },
    deterministicValueLabel: formatUsdExact(asset.deterministicValueCents),
    latestPriceLabel: formatUsdExact(asset.lastPriceCents),
    liquidityLabel: formatUsd(asset.liquidityCents),
    volumeLabel: formatUsd(asset.volume24hCents),
    changeLabel: `${changePrefix}${(asset.change24hBps / 100).toFixed(2)}%`,
    ownedPercentLabel: `${((asset.userShares / asset.shareCount) * 100).toFixed(2)}%`,
    availablePercentLabel: `${((asset.availableShares / asset.shareCount) * 100).toFixed(2)}%`,
    spreadLabel: formatUsdExact(spreadFor(asset))
  };
}

function proofEvent(type: ProofEvent["type"], detail: string, createdAt: string): ProofEvent {
  return {
    id: `event:${type.toLowerCase()}:${stampPart(createdAt)}`,
    type,
    title: type,
    detail,
    status: "verified",
    timestampLabel: "now",
    createdAt
  };
}

function updateOrderBook(asset: ExchangeAsset, side: ExchangeTradeSide, shares: number): ExchangeOrderBookLine[] {
  const next = asset.orderBook.map((line) => {
    if (side === "buy" && line.side === "ask") {
      return { ...line, shares: Math.max(0, line.shares - shares) };
    }
    if (side === "sell" && line.side === "bid") {
      return { ...line, shares: Math.max(0, line.shares - shares) };
    }
    return line;
  });

  const replenishmentSide: ExchangeOrderBookLine["side"] = side === "buy" ? "bid" : "ask";
  return [
    {
      id: `${asset.id}:${replenishmentSide}:${asset.appendEvents.length + 1}`,
      side: replenishmentSide,
      priceCents: side === "buy" ? Math.max(1, asset.lastPriceCents - 18) : asset.lastPriceCents + 18,
      shares,
      ownerReceizId: MARKET_MAKER,
      proofObjectId: `${asset.id}:book:${replenishmentSide}`
    },
    ...next.filter((line) => line.shares > 0)
  ];
}

export function buildExchangeTradePreview(
  asset: ExchangeAsset,
  side: ExchangeTradeSide,
  shares: number,
  walletBalanceCents = 0
): ExchangeTradePreview {
  const safeShares = clampShares(asset, side, shares);
  const totalCents = safeShares * asset.lastPriceCents;
  const walletAppliedCents = side === "buy" ? Math.min(Math.max(0, walletBalanceCents), totalCents) : 0;
  const cardDeltaCents = side === "buy" ? Math.max(0, totalCents - walletAppliedCents) : 0;

  return {
    side,
    shares: safeShares,
    priceCents: asset.lastPriceCents,
    totalCents,
    totalLabel: formatUsdExact(totalCents),
    walletAppliedCents,
    walletAppliedLabel: formatUsdExact(walletAppliedCents),
    cardDeltaCents,
    cardDeltaLabel: formatUsdExact(cardDeltaCents),
    cardRequired: cardDeltaCents > 0,
    resultingShares: side === "buy" ? asset.userShares + safeShares : Math.max(0, asset.userShares - safeShares)
  };
}

export function exchangeAssetSnapshot(asset: ExchangeAsset) {
  const latest = asset.appendEvents[0] ?? null;
  return {
    assetId: asset.id,
    proofObjectId: asset.manifest.assetId,
    knownHead: {
      afterEntryId: latest?.id ?? null,
      afterKaiUpulse: latest?.kaiPulse ?? asset.manifest.proof.kaiPulseEternal,
      afterCreatedAt: latest?.createdAt ?? null
    }
  };
}

export function projectExchangeDesk(state: CommerceState): ExchangeDeskProjection {
  const assets = state.exchange.assets.map(withView);
  const selected =
    assets.find((asset) => asset.id === state.exchange.selectedAssetId) ??
    assets[0] ??
    null;

  return {
    enabled: state.exchange.enabled,
    headline: state.exchange.headline,
    subheadline: state.exchange.subheadline,
    walletFirstLabel: "Receiz wallet first",
    selected,
    assets,
    proofMemoryHead: state.exchange.proofMemoryHead
  };
}

export function stateWithListedExchangeAsset(state: CommerceState, input: ExchangeListAssetInput): CommerceState {
  const recordedAt = input.recordedAt ?? new Date().toISOString();
  const sourceId = input.source === "asset" ? input.asset.id : input.product.id;
  const existing = state.exchange.assets.find((asset) => asset.sourceAssetId === sourceId);

  if (existing) {
    return {
      ...state,
      exchange: {
        ...state.exchange,
        selectedAssetId: existing.id
      }
    };
  }

  const title = input.source === "asset" ? input.asset.name : input.product.name;
  const sourcePriceLabel = input.source === "asset" ? input.asset.priceLabel : input.product.priceLabel;
  const sourceProof = input.source === "asset" ? input.asset.proofSource : input.product.id;
  const sourceType = input.source === "asset" ? input.asset.type : input.product.type;
  const sourceManifest = input.source === "asset" ? input.asset.manifest : undefined;
  const basePriceCents = centsFromPriceLabel(sourcePriceLabel, 1_000);
  const shareCount = Math.max(100, Math.min(1_000, Math.round(basePriceCents / 10) * 10));
  const deterministicValueCents = Math.max(basePriceCents * 100, 10_000);
  const lastPriceCents = Math.max(1, Math.round(deterministicValueCents / shareCount));
  const safeTitle = sanitizeCoordinatePart(title);
  const assetId = `exchange-${sourceId}`;
  const proofObjectId = sourceManifest?.assetId ?? `asset:${sourceId}:${sourceProof}`;
  const kaiPulse = kaiPulseFor(recordedAt, {
    id: assetId,
    manifest: {
      proof: {
        kaiPulseEternal: sourceManifest?.proof.kaiPulseEternal ?? String(Date.parse(recordedAt) || 0)
      }
    }
  } as ExchangeAsset);
  const verifyUrl = canonicalReceizVerifyUrl(
    sourceManifest?.links.verify || sourceManifest?.proof.verifyUrl,
    receizVerifyUrl(safeTitle, sourceProof, kaiPulse)
  );
  const append: ExchangeAppendEvent = {
    id: `${assetId}:append:list:${stampPart(recordedAt)}`,
    type: "asset.listed",
    actorReceizId: input.actorReceizId,
    detail: `${title} listed with ${shareCount} fractional shares`,
    createdAt: recordedAt,
    kaiPulse,
    appendAnchorId: `anchor:${assetId}:${kaiPulse}`,
    appendHash: appendHashFor([assetId, "listed", input.actorReceizId, recordedAt]),
    proofObjectId
  };
  const nextAsset: ExchangeAsset = {
    id: assetId,
    sourceAssetId: sourceId,
    title,
    symbol: symbolFromTitle(title),
    category:
      sourceType === "digital"
        ? "digital"
        : sourceType === "access"
          ? "access"
          : sourceType === "benefit"
            ? "benefit"
            : "physical",
    status: "listed",
    manifest: sourceManifest
      ? {
          ...sourceManifest,
          proof: {
            ...sourceManifest.proof,
            verifyUrl
          },
          owner: {
            ...sourceManifest.owner,
            receizSubject: sourceManifest.owner.receizSubject || input.actorReceizId,
            displayName: sourceManifest.owner.displayName || input.actorReceizId,
            custody: "fractionalized"
          },
          links: {
            ...sourceManifest.links,
            verify: verifyUrl
          }
        }
      : {
          schema: "receiz.asset_manifest.v1",
          assetId: append.proofObjectId,
          assetType: "market_certificate",
          proof: {
            kind: "receiz.proof_bundle",
            verifyUrl,
            kaiPulseEternal: kaiPulse,
            kaiKlok: `kai:${kaiPulse}`,
            receizClaimId: `${safeTitle}-${sourceProof}`.replace(/[^a-z0-9]/gi, "").slice(0, 32) || assetId,
            artifactSha256Basis: append.appendHash
          },
          owner: {
            receizSubject: input.actorReceizId,
            displayName: input.actorReceizId,
            custody: "fractionalized"
          },
          links: {
            verify: verifyUrl
          }
        },
    ownerReceizId: input.actorReceizId,
    deterministicValueCents,
    shareCount,
    availableShares: shareCount,
    userShares: 0,
    lastPriceCents,
    liquidityCents: Math.round(deterministicValueCents * 0.18),
    volume24hCents: 0,
    change24hBps: 0,
    settlementRail: "receiz_wallet_first",
    chart: [
      {
        id: `${assetId}:price:${stampPart(recordedAt)}`,
        timestamp: recordedAt,
        kaiPulse,
        priceCents: lastPriceCents,
        liquidityCents: Math.round(deterministicValueCents * 0.18),
        volumeCents: 0
      }
    ],
    orderBook: [
      {
        id: `${assetId}:bid:genesis`,
        side: "bid",
        priceCents: Math.max(1, lastPriceCents - Math.max(1, Math.round(lastPriceCents * 0.015))),
        shares: Math.max(1, Math.round(shareCount * 0.12)),
        ownerReceizId: MARKET_MAKER,
        proofObjectId: `${assetId}:book:bid`
      },
      {
        id: `${assetId}:ask:genesis`,
        side: "ask",
        priceCents: lastPriceCents + Math.max(1, Math.round(lastPriceCents * 0.015)),
        shares: Math.max(1, Math.round(shareCount * 0.12)),
        ownerReceizId: input.actorReceizId,
        proofObjectId: `${assetId}:book:ask`
      }
    ],
    appendEvents: [append]
  };

  return {
    ...state,
    exchange: {
      ...state.exchange,
      enabled: true,
      selectedAssetId: nextAsset.id,
      proofMemoryHead: {
        afterEntryId: append.id,
        afterKaiUpulse: append.kaiPulse,
        afterCreatedAt: append.createdAt
      },
      assets: [nextAsset, ...state.exchange.assets]
    },
    assets: input.source === "asset"
      ? state.assets.map((asset) => (asset.id === input.asset.id ? { ...asset, status: "listed" } : asset))
      : state.assets,
    proofEvents: [proofEvent("EXCHANGE_ASSET_LISTED", append.detail, recordedAt), ...state.proofEvents]
  };
}

export function stateWithExchangeTrade(state: CommerceState, input: ExchangeTradeInput): CommerceState {
  const recordedAt = input.recordedAt ?? new Date().toISOString();
  let appended: ExchangeAppendEvent | null = null;
  let detail = "";

  const assets = state.exchange.assets.map((asset) => {
    if (asset.id !== input.assetId) return asset;

    const preview = buildExchangeTradePreview(asset, input.side, input.shares, input.walletBalanceCents ?? state.exchange.walletBalanceCents);
    const priceMove = input.side === "buy" ? Math.ceil(preview.shares * 3) : -Math.ceil(preview.shares * 2);
    const nextPrice = Math.max(1, asset.lastPriceCents + priceMove);
    const kaiPulse = kaiPulseFor(recordedAt, asset, asset.appendEvents.length + 1);
    const childProofObjectId = `${asset.id}:share:${sanitizeCoordinatePart(input.actorReceizId)}:${stampPart(recordedAt)}`;

    appended = {
      id: `${asset.id}:append:trade:${stampPart(recordedAt)}`,
      type: "market.trade",
      actorReceizId: input.actorReceizId,
      detail: `${input.side} ${preview.shares} shares at ${preview.totalLabel}`,
      createdAt: recordedAt,
      kaiPulse,
      appendAnchorId: `anchor:${asset.id}:${kaiPulse}`,
      appendHash: appendHashFor([asset.id, input.side, String(preview.shares), recordedAt]),
      proofObjectId: asset.manifest.assetId,
      childProofObjectId,
      settlementLedgerEventId: `ledger:${childProofObjectId}`
    };
    detail = `${input.actorReceizId} ${input.side === "buy" ? "bought" : "sold"} ${preview.shares} shares of ${asset.symbol}`;

    const point: ExchangePricePoint = {
      id: `${asset.id}:price:${stampPart(recordedAt)}`,
      timestamp: recordedAt,
      kaiPulse,
      priceCents: nextPrice,
      liquidityCents: asset.liquidityCents,
      volumeCents: asset.volume24hCents + preview.totalCents
    };

    return {
      ...asset,
      status: "trading" as const,
      userShares: preview.resultingShares,
      availableShares:
        input.side === "buy"
          ? Math.max(0, asset.availableShares - preview.shares)
          : Math.min(asset.shareCount, asset.availableShares + preview.shares),
      lastPriceCents: nextPrice,
      volume24hCents: asset.volume24hCents + preview.totalCents,
      change24hBps: asset.change24hBps + (input.side === "buy" ? preview.shares * 8 : -preview.shares * 6),
      chart: [...asset.chart.slice(-35), point],
      orderBook: updateOrderBook(asset, input.side, preview.shares),
      appendEvents: [appended, ...asset.appendEvents]
    };
  });

  const latestAppend = appended as ExchangeAppendEvent | null;
  if (!latestAppend) return state;

  return {
    ...state,
    exchange: {
      ...state.exchange,
      proofMemoryHead: {
        afterEntryId: latestAppend.id,
        afterKaiUpulse: latestAppend.kaiPulse,
        afterCreatedAt: latestAppend.createdAt
      },
      assets
    },
    proofEvents: [proofEvent("EXCHANGE_TRADE", detail, recordedAt), ...state.proofEvents]
  };
}

export function stateWithExchangeLiquidity(state: CommerceState, input: ExchangeLiquidityInput): CommerceState {
  const recordedAt = input.recordedAt ?? new Date().toISOString();
  let appended: ExchangeAppendEvent | null = null;
  let detail = "";

  const assets = state.exchange.assets.map((asset) => {
    if (asset.id !== input.assetId) return asset;

    const kaiPulse = kaiPulseFor(recordedAt, asset, asset.appendEvents.length + 1);
    appended = {
      id: `${asset.id}:append:liquidity:${stampPart(recordedAt)}`,
      type: "liquidity.appended",
      actorReceizId: input.actorReceizId,
      detail: `${formatUsdExact(input.amountCents)} liquidity appended`,
      createdAt: recordedAt,
      kaiPulse,
      appendAnchorId: `anchor:${asset.id}:${kaiPulse}`,
      appendHash: appendHashFor([asset.id, "liquidity", String(input.amountCents), recordedAt]),
      proofObjectId: asset.manifest.assetId
    };
    detail = `${input.actorReceizId} added ${formatUsdExact(input.amountCents)} liquidity to ${asset.symbol}`;

    const nextLiquidityCents = asset.liquidityCents + Math.max(0, input.amountCents);
    const point: ExchangePricePoint = {
      id: `${asset.id}:liquidity:${stampPart(recordedAt)}`,
      timestamp: recordedAt,
      kaiPulse,
      priceCents: asset.lastPriceCents,
      liquidityCents: nextLiquidityCents,
      volumeCents: asset.volume24hCents
    };

    return {
      ...asset,
      liquidityCents: nextLiquidityCents,
      chart: [...asset.chart.slice(-35), point],
      appendEvents: [appended, ...asset.appendEvents]
    };
  });

  const latestAppend = appended as ExchangeAppendEvent | null;
  if (!latestAppend) return state;

  return {
    ...state,
    exchange: {
      ...state.exchange,
      proofMemoryHead: {
        afterEntryId: latestAppend.id,
        afterKaiUpulse: latestAppend.kaiPulse,
        afterCreatedAt: latestAppend.createdAt
      },
      assets
    },
    proofEvents: [proofEvent("EXCHANGE_LIQUIDITY_ADDED", detail, recordedAt), ...state.proofEvents]
  };
}
