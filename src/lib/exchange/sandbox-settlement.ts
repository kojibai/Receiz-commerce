import { buildExchangeTradePreview, stateWithExchangeTrade, type ExchangeTradeSide } from "../storefront/proof-exchange";
import type { CommerceState } from "@/types/domain";

export function settleSandboxExchangeTrade(state: CommerceState, input: {
  actorReceizId: string;
  assetId: string;
  settlementLedgerEventId?: string;
  shares: number;
  side: ExchangeTradeSide;
  recordedAt?: string;
}) {
  if (!Number.isInteger(input.shares) || input.shares <= 0) throw new Error("exchange_shares_invalid");
  const asset = state.exchange.assets.find((candidate) => candidate.id === input.assetId);
  if (!asset) throw new Error("exchange_asset_not_found");
  if (input.side === "sell" && asset.ownerReceizId !== input.actorReceizId) {
    throw new Error("exchange_sell_authority_required");
  }
  const preview = buildExchangeTradePreview(asset, input.side, input.shares, state.exchange.walletBalanceCents);
  if (!preview.shares || !preview.counterpartyReceizId || !preview.matchedOrderId) {
    throw new Error(input.side === "buy" ? "exchange_ask_unavailable" : "exchange_bid_unavailable");
  }
  const recordedAt = input.recordedAt ?? new Date().toISOString();
  const settlementLedgerEventId = input.settlementLedgerEventId ?? `sandbox:${input.assetId}:${input.side}:${recordedAt}`;
  return {
    preview,
    state: stateWithExchangeTrade(state, {
      actorReceizId: input.actorReceizId,
      assetId: input.assetId,
      recordedAt,
      settlementLedgerEventId,
      shares: preview.shares,
      side: input.side
    })
  };
}
