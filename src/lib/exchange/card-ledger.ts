import { canonicalPortableCardJson, sha256PortableBasis, verifyPortableCard, type PortableCardAsset } from "../../features/play/portable-card";

export type CardLedgerEntry = { asset: PortableCardAsset; ownerId: string; registeredAt: string };
export type CardListing = { id: string; assetId: string; sellerId: string; priceCents: number; status: "open" | "closed" | "cancelled"; createdAt: string };
export type CardTradeOffer = {
  id: string;
  proposerId: string;
  ownerId: string;
  offeredAssetIds: string[];
  requestedAssetIds: string[];
  status: "open" | "accepted" | "declined" | "cancelled";
  createdAt: string;
  resolvedAt: string | null;
};
export type CardLedgerOperation = { id: string; type: "register" | "list" | "trade" | "send"; actorId: string; assetIds: string[]; recipientId: string | null; createdAt: string };
export type CardLedgerState = {
  cards: Record<string, CardLedgerEntry>;
  listings: CardListing[];
  offers: CardTradeOffer[];
  operations: CardLedgerOperation[];
};

export const emptyCardLedger: CardLedgerState = { cards: {}, listings: [], offers: [], operations: [] };

function validAt(at: string) {
  if (!Number.isFinite(Date.parse(at))) throw new Error("card_ledger_time_invalid");
}

function idFor(kind: string, value: unknown) {
  return `${kind}:${sha256PortableBasis(canonicalPortableCardJson(value)).slice(7, 31)}`;
}

function requireOwner(state: CardLedgerState, actorId: string, assetId: string) {
  const entry = state.cards[assetId];
  if (!entry) throw new Error("card_ledger_asset_missing");
  if (entry.ownerId !== actorId) throw new Error("card_ledger_owner_required");
  return entry;
}

function operation(type: CardLedgerOperation["type"], actorId: string, assetIds: string[], recipientId: string | null, at: string): CardLedgerOperation {
  return { id: idFor("cardop", { type, actorId, assetIds, recipientId, at }), type, actorId, assetIds, recipientId, createdAt: at };
}

export function registerLedgerCard(state: CardLedgerState, input: { actorId: string; card: PortableCardAsset; at: string }) {
  validAt(input.at);
  if (!verifyPortableCard(input.card).ok) throw new Error("card_ledger_proof_invalid");
  if (input.card.manifest.ownerReceizId !== input.actorId) throw new Error("card_ledger_capture_owner_required");
  const existing = state.cards[input.card.id];
  if (existing) {
    if (existing.ownerId !== input.actorId) throw new Error("card_ledger_asset_already_owned");
    return state;
  }
  return {
    ...state,
    cards: { ...state.cards, [input.card.id]: { asset: input.card, ownerId: input.actorId, registeredAt: input.at } },
    operations: [...state.operations, operation("register", input.actorId, [input.card.id], null, input.at)]
  };
}

export function listLedgerCard(state: CardLedgerState, input: { actorId: string; assetId: string; priceCents: number; at: string }) {
  validAt(input.at);
  requireOwner(state, input.actorId, input.assetId);
  if (!Number.isInteger(input.priceCents) || input.priceCents < 1) throw new Error("card_listing_price_invalid");
  const listing: CardListing = {
    id: idFor("cardlisting", input), assetId: input.assetId, sellerId: input.actorId,
    priceCents: input.priceCents, status: "open", createdAt: input.at
  };
  return {
    ...state,
    listings: [...state.listings.map((item) => item.assetId === input.assetId && item.status === "open" ? { ...item, status: "cancelled" as const } : item), listing],
    operations: [...state.operations, operation("list", input.actorId, [input.assetId], null, input.at)]
  };
}

export function proposeCardTrade(state: CardLedgerState, input: {
  proposerId: string; ownerId: string; offeredAssetIds: string[]; requestedAssetIds: string[]; at: string;
}) {
  validAt(input.at);
  if (input.proposerId === input.ownerId) throw new Error("card_trade_distinct_parties_required");
  const offeredAssetIds = Array.from(new Set(input.offeredAssetIds));
  const requestedAssetIds = Array.from(new Set(input.requestedAssetIds));
  if (!offeredAssetIds.length || !requestedAssetIds.length || offeredAssetIds.length !== input.offeredAssetIds.length || requestedAssetIds.length !== input.requestedAssetIds.length) throw new Error("card_trade_assets_invalid");
  offeredAssetIds.forEach((id) => requireOwner(state, input.proposerId, id));
  requestedAssetIds.forEach((id) => requireOwner(state, input.ownerId, id));
  const offer: CardTradeOffer = {
    id: idFor("cardoffer", { ...input, offeredAssetIds, requestedAssetIds }), proposerId: input.proposerId, ownerId: input.ownerId,
    offeredAssetIds, requestedAssetIds, status: "open", createdAt: input.at, resolvedAt: null
  };
  return { ...state, offers: [...state.offers, offer] };
}

export function acceptCardTrade(state: CardLedgerState, input: { actorId: string; offerId: string; at: string }) {
  validAt(input.at);
  const offer = state.offers.find((candidate) => candidate.id === input.offerId);
  if (!offer || offer.status !== "open") throw new Error("card_trade_offer_not_open");
  if (offer.ownerId !== input.actorId) throw new Error("card_trade_owner_acceptance_required");
  offer.offeredAssetIds.forEach((id) => requireOwner(state, offer.proposerId, id));
  offer.requestedAssetIds.forEach((id) => requireOwner(state, offer.ownerId, id));
  const cards = { ...state.cards };
  for (const id of offer.offeredAssetIds) cards[id] = { ...cards[id]!, ownerId: offer.ownerId };
  for (const id of offer.requestedAssetIds) cards[id] = { ...cards[id]!, ownerId: offer.proposerId };
  const transferred = [...offer.offeredAssetIds, ...offer.requestedAssetIds];
  return {
    ...state,
    cards,
    listings: state.listings.map((item) => transferred.includes(item.assetId) && item.status === "open" ? { ...item, status: "cancelled" as const } : item),
    offers: state.offers.map((item) => item.id === offer.id ? { ...item, status: "accepted" as const, resolvedAt: input.at } : item),
    operations: [...state.operations, operation("trade", input.actorId, transferred, offer.proposerId, input.at)]
  };
}

export function sendLedgerCard(state: CardLedgerState, input: { actorId: string; assetId: string; recipient: string; at: string }) {
  validAt(input.at);
  requireOwner(state, input.actorId, input.assetId);
  const recipient = input.recipient.trim().toLowerCase();
  if (!/^([a-z0-9._-]{2,64}|[^\s@]+@[^\s@]+\.[^\s@]+)$/i.test(recipient) || recipient === input.actorId.toLowerCase()) throw new Error("card_send_recipient_invalid");
  return {
    ...state,
    cards: { ...state.cards, [input.assetId]: { ...state.cards[input.assetId]!, ownerId: recipient } },
    listings: state.listings.map((item) => item.assetId === input.assetId && item.status === "open" ? { ...item, status: "cancelled" as const } : item),
    offers: state.offers.map((offer) => offer.status === "open" && [...offer.offeredAssetIds, ...offer.requestedAssetIds].includes(input.assetId) ? { ...offer, status: "cancelled" as const, resolvedAt: input.at } : offer),
    operations: [...state.operations, operation("send", input.actorId, [input.assetId], recipient, input.at)]
  };
}
