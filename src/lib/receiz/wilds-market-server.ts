import type { JsonObject } from "@receiz/sdk";
import type { NextRequest } from "next/server";
import {
  validateAdventureCondition,
  type AdventureCardCondition,
} from "@/features/play/adventure/card-condition";
import { projectMarketCard, type MarketCardCapability } from "@/features/play/market/card-role";
import {
  applyMarketConsequences,
  projectMarketConsequences,
  type MarketConsequenceSet,
  type MarketMortalConsent,
} from "@/features/play/market/consequences";
import {
  validateMarketContractSolvability,
  type MarketContractDefinition,
} from "@/features/play/market/contract-director";
import type { MarketTerms } from "@/features/play/market/negotiation-resolver";
import { sealMarketReceipt, type MarketReceipt } from "@/features/play/market/receipt";
import { replayMarketTranscript, type MarketTranscript } from "@/features/play/market/transcript";
import {
  canonicalPortableCardJson,
  sha256PortableBasis,
  verifyAnyWildsCard,
  type PortableCardAsset,
} from "@/features/play/portable-card";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "./adapter";
import { resolveWildsMultiplayerActor, type WildsMultiplayerActor } from "./wilds-multiplayer-server";

export type MarketAdmissionProjection = Readonly<{
  schema: "receiz.wilds.market_projection.v1";
  actorId: string;
  revision: number;
  conditions: Readonly<Record<string, AdventureCardCondition>>;
  reputation: number;
  resources: Readonly<Record<string, number>>;
  receiptTail: readonly MarketReceipt[];
}>;

export type MarketAdmissionDependencies = {
  resolveActor(request: NextRequest, guestId?: unknown): Promise<WildsMultiplayerActor>;
  publish(request: NextRequest, actor: WildsMultiplayerActor, projection: MarketAdmissionProjection, idempotencyKey: string): Promise<boolean>;
  audit(request: NextRequest, actor: WildsMultiplayerActor, receipt: MarketReceipt): Promise<boolean>;
  now(): string;
};

type MarketAdmissionBody = Readonly<{
  guestId?: unknown;
  idempotencyKey: string;
  cards: readonly PortableCardAsset[];
  priorConditions: Readonly<Record<string, AdventureCardCondition>>;
  contract: MarketContractDefinition;
  terms: MarketTerms;
  transcript: MarketTranscript;
  mortalConsent: MarketMortalConsent | null;
}>;

export type MarketAdmissionResult = Readonly<{
  receipt: MarketReceipt | null;
  preview: MarketConsequenceSet;
  projection: MarketAdmissionProjection | null;
  publication: Readonly<{ published: boolean; mode: "receiz_live" | "local_practice"; revision: number }>;
}>;

const ledgerKey = Symbol.for("receiz.wilds.market.admission.v1");
type MarketLedger = { projections: Map<string, MarketAdmissionProjection>; results: Map<string, MarketAdmissionResult> };

function admissionLedger() {
  const root = globalThis as typeof globalThis & { [ledgerKey]?: MarketLedger };
  return (root[ledgerKey] ??= { projections: new Map(), results: new Map() });
}

function origin(request: NextRequest) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host ?? platform.domain;
  const protocol = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

const defaultDependencies: MarketAdmissionDependencies = {
  resolveActor: resolveWildsMultiplayerActor,
  async publish(request, actor, projection, idempotencyKey) {
    if (!actor.accessToken) return false;
    const sourceUrl = `${origin(request)}/api/wilds/market`;
    try {
      const result = await createReceizCommerceAdapter({ accessToken: actor.accessToken }).publishPublicStore({
        tenantHost: new URL(sourceUrl).host,
        merchantReceizId: actor.handle,
        title: "Receiz Wilds Wayfarer record",
        sourceUrl,
        namespace: `wilds:market:v1:${actor.playerId}`,
        projectionState: "published",
        platform: platform.productName,
        state: projection as unknown as JsonObject,
      }, { idempotencyKey });
      return !(result && typeof result === "object" && "ok" in result && result.ok === false);
    } catch {
      return false;
    }
  },
  async audit(_request, actor, receipt) {
    if (!actor.accessToken) return false;
    try {
      await createReceizCommerceAdapter({ accessToken: actor.accessToken }).auditAppend({
        tenantHost: platform.domain,
        action: `wilds.market:${receipt.digest}`,
        actorReceizId: actor.handle,
      }, { idempotencyKey: `market:${receipt.digest}` });
      return true;
    } catch {
      return false;
    }
  },
  now: () => new Date().toISOString(),
};

function marketBodyValue(value: unknown): MarketAdmissionBody {
  if (!value || typeof value !== "object") throw new Error("market_admission_body_invalid");
  const body = value as Partial<MarketAdmissionBody>;
  if (typeof body.idempotencyKey !== "string" || !/^[a-z0-9:_-]{8,128}$/i.test(body.idempotencyKey)) throw new Error("market_idempotency_invalid");
  if (!Array.isArray(body.cards) || body.cards.length < 1 || body.cards.length > 3
    || !body.priorConditions || !body.contract || !body.terms || !body.transcript) {
    throw new Error("market_admission_body_invalid");
  }
  return body as MarketAdmissionBody;
}

function authorizeMarketCards(actor: WildsMultiplayerActor, body: MarketAdmissionBody): MarketCardCapability[] {
  return body.cards.map((card) => {
    if (!verifyAnyWildsCard(card).ok) throw new Error("market_card_proof_invalid");
    if (!actor.practice && card.manifest.ownerReceizId !== actor.handle && card.manifest.ownerReceizId !== "wilds.player.receiz.id") {
      throw new Error("market_card_owner_invalid");
    }
    const condition = body.priorConditions[card.id];
    if (!condition) throw new Error("market_prior_condition_invalid");
    validateAdventureCondition(condition);
    return projectMarketCard(card, condition);
  });
}

function verifyContract(contract: MarketContractDefinition, squad: readonly MarketCardCapability[]) {
  const { digest: _digest, ...unsigned } = contract;
  if (sha256PortableBasis(canonicalPortableCardJson(unsigned)) !== contract.digest) throw new Error("market_contract_digest_invalid");
  if (!validateMarketContractSolvability(contract, squad).ok) throw new Error("market_contract_solvability_invalid");
}

function addResources(
  prior: Readonly<Record<string, number>>,
  awards: Readonly<Record<string, number>>,
) {
  return Object.fromEntries([...new Set([...Object.keys(prior), ...Object.keys(awards)])].map((key) => [
    key,
    Math.max(0, Math.min(1_000_000, (prior[key] ?? 0) + (awards[key] ?? 0))),
  ]));
}

function nextProjection(
  actorId: string,
  previous: MarketAdmissionProjection | undefined,
  body: MarketAdmissionBody,
  consequences: MarketConsequenceSet,
  receipt: MarketReceipt,
): MarketAdmissionProjection {
  const prior = previous?.conditions ?? body.priorConditions;
  const applied = applyMarketConsequences(prior, consequences, receipt.digest, {});
  return {
    schema: "receiz.wilds.market_projection.v1",
    actorId,
    revision: (previous?.revision ?? 0) + 1,
    conditions: { ...prior, ...applied },
    reputation: Math.max(-1_000, Math.min(1_000, (previous?.reputation ?? 0) + consequences.reputationDelta)),
    resources: addResources(previous?.resources ?? {}, consequences.resourceAwards),
    receiptTail: [...(previous?.receiptTail ?? []), receipt].slice(-32),
  };
}

export async function executeMarketAdmission(
  request: NextRequest,
  rawBody: unknown,
  dependencies: MarketAdmissionDependencies = defaultDependencies,
): Promise<MarketAdmissionResult> {
  const body = marketBodyValue(rawBody);
  const actor = await dependencies.resolveActor(request, body.guestId);
  const cacheKey = `${actor.playerId}:${body.idempotencyKey}`;
  const cached = admissionLedger().results.get(cacheKey);
  if (cached) return cached;
  const squad = authorizeMarketCards(actor, body);
  verifyContract(body.contract, squad);
  const replay = replayMarketTranscript(body.contract, body.terms, squad, body.transcript);
  const preview = projectMarketConsequences({
    contract: body.contract,
    terms: body.terms,
    replay,
    priorConditions: body.priorConditions,
    mortalConsent: body.mortalConsent,
  });
  if (actor.practice) {
    const result: MarketAdmissionResult = {
      receipt: null,
      preview,
      projection: null,
      publication: { published: false, mode: "local_practice", revision: 0 },
    };
    admissionLedger().results.set(cacheKey, result);
    return result;
  }

  const previous = admissionLedger().projections.get(actor.playerId);
  if (previous) {
    for (const pin of body.contract.squadPins) {
      if (canonicalPortableCardJson(previous.conditions[pin.assetId]) !== canonicalPortableCardJson(body.priorConditions[pin.assetId])) {
        throw new Error("market_prior_condition_stale");
      }
    }
  }
  const revision = (previous?.revision ?? 0) + 1;
  const receipt = sealMarketReceipt({
    contract: body.contract,
    terms: body.terms,
    transcript: body.transcript,
    squad,
    priorConditions: body.priorConditions,
    mortalConsent: body.mortalConsent,
    actorId: actor.playerId,
    publicationRevision: revision,
    createdAt: dependencies.now(),
  });
  const projection = nextProjection(actor.playerId, previous, body, preview, receipt);
  if (!await dependencies.publish(request, actor, projection, `market:${receipt.digest}`)) throw new Error("market_canonical_publish_required");
  if (!await dependencies.audit(request, actor, receipt)) throw new Error("market_canonical_audit_required");
  const result: MarketAdmissionResult = {
    receipt,
    preview,
    projection,
    publication: { published: true, mode: "receiz_live", revision },
  };
  admissionLedger().projections.set(actor.playerId, projection);
  admissionLedger().results.set(cacheKey, result);
  if (admissionLedger().results.size > 512) admissionLedger().results.delete(admissionLedger().results.keys().next().value!);
  return result;
}

export function resetMarketAdmissionForTests() {
  admissionLedger().projections.clear();
  admissionLedger().results.clear();
}
