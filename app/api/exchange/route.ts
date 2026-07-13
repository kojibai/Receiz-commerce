import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { buildStoreStateRecord, storeStateProjectionSource } from "@/lib/receiz/proof-state";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { hydrateProofStoreFromReceizStoreState } from "@/lib/receiz/store-state-ledger";
import {
  publishAndAdmitReceizStoreState,
  receizStoreStateSyncCompleted,
  receizStoreStateWriteSucceeded,
  summarizeReceizStoreStatePublicationResult
} from "@/lib/receiz/store-state-publication";
import { merchantLocalProofObjectFromState } from "@/lib/hosting/merchant-proof-authority";
import { receizRequestSession } from "@/lib/receiz/session";
import { stateWithListedExchangeAsset } from "@/lib/storefront/proof-exchange";
import { mockStorage } from "@/lib/storage/mock-storage";
import type { CommerceState, ReceizedAsset } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "invalid_exchange_upload" }, { status: 400 });

  const file = form.get("proofObject");
  const submittedAsset = parseJson<ReceizedAsset>(form.get("asset"));
  const submittedState = parseJson<CommerceState>(form.get("state"));
  const localProof = merchantLocalProofObjectFromState(parseJson(form.get("merchantProof")));
  const accessToken = receizRequestSession(request).cookieAccessToken;
  const actorReceizId = localProof.handle || String(form.get("actorReceizId") ?? "").trim();
  const tenantHost = String(form.get("tenantHost") ?? submittedState?.hosting.subdomain ?? "").trim().toLowerCase();

  if (!(file instanceof File) || !file.size || !validAsset(submittedAsset) || !submittedState || !tenantHost) {
    return NextResponse.json({ ok: false, error: "exchange_proof_object_required" }, { status: 400 });
  }
  if (!accessToken && !(localProof.connected && localProof.localProofVerified && localProof.keyFile)) {
    return NextResponse.json({ ok: false, error: "receiz_authority_required" }, { status: 401 });
  }

  const receiz = createReceizCommerceAdapter({ accessToken });
  const verification = await receiz.verifyArtifact(file);
  if (!verification.ok) {
    return NextResponse.json(
      { ok: false, error: "exchange_proof_verification_failed", message: verification.errors.join(", ") },
      { status: 422 }
    );
  }

  const digest = await sha256Basis(file);
  const verifiedAsset: ReceizedAsset = {
    ...submittedAsset,
    verifiedArtifact: {
      filename: file.name || submittedAsset.verifiedArtifact?.filename || "Receiz proof object",
      kind: verification.kind || submittedAsset.verifiedArtifact?.kind || "receiz.proof_bundle",
      verifiedAt: new Date().toISOString(),
      warnings: verification.warnings,
      sha256Basis: digest
    }
  };

  const merchantReceizId = submittedState.hosting.merchantReceizId || actorReceizId;
  const proofStore = await getServerProofStateStore(merchantReceizId);
  await hydrateProofStoreFromReceizStoreState(proofStore, tenantHost).catch(() => undefined);
  const recovered = proofStore.projectHost(mockStorage.getState(), tenantHost);
  const publishedMarket = storeStateProjectionSource(proofStore.records(), tenantHost) === "published";
  if (!publishedMarket && merchantReceizId !== actorReceizId) {
    return NextResponse.json({ ok: false, error: "exchange_owner_authority_required" }, { status: 403 });
  }
  const baseState = publishedMarket ? recovered : submittedState;
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
    proof: { keyFile: localProof.keyFile, passphrase: localProof.passphrase },
    record
  });

  return NextResponse.json({
    ok: true,
    state,
    verification: { kind: verification.kind, warnings: verification.warnings },
    storeStateSync: {
      ok: receizStoreStateWriteSucceeded(publication),
      synced: receizStoreStateSyncCompleted(publication),
      result: summarizeReceizStoreStatePublicationResult(publication)
    }
  });
}
