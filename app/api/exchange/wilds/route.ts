import { NextRequest, NextResponse } from "next/server";
import { admitWildsCard, synchronizeWildsCard } from "@/lib/exchange/asset-admission";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { buildStoreStateRecord, storeStateProjectionSource } from "@/lib/receiz/proof-state";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { hydrateProofStoreFromReceizStoreState } from "@/lib/receiz/store-state-ledger";
import {
  publishAndAdmitReceizStoreState,
  receizStoreStateSyncCompleted,
  receizStoreStateWriteSucceeded,
  summarizeReceizStoreStatePublicationResult
} from "@/lib/receiz/store-state-publication";
import { receizRequestSession } from "@/lib/receiz/session";
import { stateWithListedExchangeAsset } from "@/lib/storefront/proof-exchange";
import { mockStorage } from "@/lib/storage/mock-storage";
import { platform } from "@/lib/platform";
import type { PortableCardAsset } from "@/features/play/portable-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPortableCard(value: unknown): value is PortableCardAsset {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const card = value as Partial<PortableCardAsset>;
  return Boolean(card.id && card.manifest?.schema === "receiz.wilds_card_manifest.v1" && card.proof?.kind === "receiz.wilds_local_seal.v1");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { card?: unknown; priceCents?: unknown } | null;
  if (!body || !isPortableCard(body.card)) {
    return NextResponse.json({ ok: false, error: "wilds_card_required" }, { status: 400 });
  }

  const session = receizRequestSession(request);
  const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(requestHost);
  const tenantHost = hostContext.tenantHost ?? hostContext.host;
  if (!session.cookieAccessToken || session.sessionScope !== hostContext.storageKey) {
    return NextResponse.json({ ok: false, error: "receiz_authority_required" }, { status: 401 });
  }

  const profile = await loadReceizConnectProfile(session.cookieAccessToken).catch(() => null);
  if (!profile?.handle) {
    return NextResponse.json({ ok: false, error: "receiz_identity_unavailable" }, { status: 401 });
  }

  const proofStore = await getServerProofStateStore();
  await hydrateProofStoreFromReceizStoreState(proofStore, tenantHost).catch(() => undefined);
  if (storeStateProjectionSource(proofStore.records(), tenantHost) !== "published") {
    return NextResponse.json({ ok: false, error: "exchange_market_not_published" }, { status: 409 });
  }
  const baseState = proofStore.projectHost(mockStorage.getState(), tenantHost);

  let synchronizedCard: PortableCardAsset;
  let verifiedAsset;
  try {
    synchronizedCard = synchronizeWildsCard({ actorReceizId: profile.handle, card: body.card });
    verifiedAsset = admitWildsCard({
      actorReceizId: profile.handle,
      card: synchronizedCard,
      priceCents: Number(body.priceCents ?? 2500),
      existingAssetIds: [
        ...baseState.assets.map((asset) => asset.id),
        ...baseState.exchange.assets.map((asset) => asset.sourceAssetId)
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "wilds_card_admission_failed" },
      { status: 422 }
    );
  }

  const state = stateWithListedExchangeAsset(
    { ...baseState, assets: [verifiedAsset, ...baseState.assets] },
    { source: "asset", asset: verifiedAsset, actorReceizId: profile.handle }
  );
  const record = buildStoreStateRecord(state, { actorReceizId: profile.handle, reason: "sync", tenantHost });
  const publication = await publishAndAdmitReceizStoreState({
    accessToken: session.cookieAccessToken,
    proofStore,
    record
  });

  return NextResponse.json({
    ok: true,
    card: { ...synchronizedCard, status: "listed" },
    state,
    storeStateSync: {
      ok: receizStoreStateWriteSucceeded(publication),
      synced: receizStoreStateSyncCompleted(publication),
      result: summarizeReceizStoreStatePublicationResult(publication)
    }
  });
}
