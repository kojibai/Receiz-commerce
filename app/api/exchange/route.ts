import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { admitUploadedAsset } from "@/lib/exchange/asset-admission";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
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
import type { ReceizedAsset } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_EXCHANGE_UPLOAD_BYTES = 8 * 1024 * 1024;

function parseJson<T>(value: FormDataEntryValue | null): T | null {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function validAsset(value: ReceizedAsset | null): value is ReceizedAsset {
  return Boolean(
    value?.id &&
    value.name &&
    value.manifest?.assetId &&
    value.manifest.schema === "receiz.asset_manifest.v1" &&
    value.manifest.proof.artifactSha256Basis
  );
}

async function sha256Basis(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_EXCHANGE_UPLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: "exchange_upload_too_large" }, { status: 413 });
  }
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "invalid_exchange_upload" }, { status: 400 });

  const file = form.get("proofObject");
  const submittedAsset = parseJson<ReceizedAsset>(form.get("asset"));
  const requestSession = receizRequestSession(request);
  const accessToken = requestSession.cookieAccessToken;
  const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(requestHost);
  const tenantHost = hostContext.tenantHost ?? hostContext.host;

  if (!(file instanceof File) || !file.size || file.size > MAX_EXCHANGE_UPLOAD_BYTES || !validAsset(submittedAsset) || !tenantHost) {
    return NextResponse.json({ ok: false, error: "exchange_proof_object_required" }, { status: 400 });
  }
  if (!accessToken || requestSession.sessionScope !== hostContext.storageKey) {
    return NextResponse.json({ ok: false, error: "receiz_authority_required" }, { status: 401 });
  }

  const profile = await loadReceizConnectProfile(accessToken).catch(() => null);
  if (!profile?.handle) {
    return NextResponse.json({ ok: false, error: "receiz_identity_unavailable" }, { status: 401 });
  }
  const actorReceizId = profile.handle;

  const receiz = createReceizCommerceAdapter({ accessToken });
  const verification = await receiz.verifyArtifact(file);
  if (verification.status !== "verified-artifact") {
    const message = verification.status === "invalid"
      ? verification.errors.map((error) => error.message).join(", ")
      : verification.status === "denied"
        ? `Artifact verification was not evaluated: ${verification.code}`
        : `Unsupported artifact: ${verification.reason}`;
    return NextResponse.json(
      { ok: false, error: "exchange_proof_verification_failed", message },
      { status: 422 }
    );
  }

  const digest = await sha256Basis(file);
  const proofStore = await getServerProofStateStore();
  await hydrateProofStoreFromReceizStoreState(proofStore, tenantHost).catch(() => undefined);
  const recovered = proofStore.projectHost(mockStorage.getState(), tenantHost);
  const publishedMarket = storeStateProjectionSource(proofStore.records(), tenantHost) === "published";
  if (!publishedMarket) {
    return NextResponse.json({ ok: false, error: "exchange_market_not_published" }, { status: 409 });
  }
  const baseState = recovered;
  let verifiedAsset: ReceizedAsset;
  try {
    verifiedAsset = admitUploadedAsset({
      actorReceizId,
      artifactDigest: digest,
      filename: file.name,
      submittedAsset,
      verification: verification.verification,
      existingAssetIds: [
        ...baseState.assets.map((asset) => asset.id),
        ...baseState.exchange.assets.map((asset) => asset.sourceAssetId)
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "exchange_asset_manifest_invalid" },
      { status: 422 }
    );
  }
  const state = stateWithListedExchangeAsset(
    {
      ...baseState,
      assets: baseState.assets.some((asset) => asset.id === verifiedAsset.id)
        ? baseState.assets.map((asset) => asset.id === verifiedAsset.id ? verifiedAsset : asset)
        : [verifiedAsset, ...baseState.assets]
    },
    { source: "asset", asset: verifiedAsset, actorReceizId }
  );
  const record = buildStoreStateRecord(state, { actorReceizId, reason: "sync", tenantHost });
  const publication = await publishAndAdmitReceizStoreState({
    accessToken,
    proofStore,
    record
  });

  return NextResponse.json({
    ok: true,
    state,
    verification: {
      kind: verification.verification.kind,
      warnings: verification.verification.warnings,
      artifactDigest: verification.artifactDigest,
      payloadDigest: verification.payloadDigest,
      authority: verification.operationAuthority
    },
    storeStateSync: {
      ok: receizStoreStateWriteSucceeded(publication),
      synced: receizStoreStateSyncCompleted(publication),
      result: summarizeReceizStoreStatePublicationResult(publication)
    }
  });
}
