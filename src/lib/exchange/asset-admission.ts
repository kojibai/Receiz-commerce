import type { DocumentVerifyResponse } from "@receiz/sdk";
import { portableCardExchangeAsset, verifyPortableCard, type PortableCardAsset } from "../../features/play/portable-card.js";
import type { ReceizAssetManifestProjection, ReceizedAsset } from "../../types/domain.js";
import { verifiedExchangeAsset } from "./listing-authority.js";

export function localAssetVerifyPath(manifest: ReceizAssetManifestProjection) {
  return `/verify?claim=${encodeURIComponent(manifest.proof.receizClaimId)}&pulse=${encodeURIComponent(manifest.proof.kaiPulseEternal)}`;
}

function withLocalVerification(asset: ReceizedAsset): ReceizedAsset {
  if (!asset.manifest) throw new Error("exchange_verified_manifest_required");
  const verifyPath = localAssetVerifyPath(asset.manifest);
  return {
    ...asset,
    manifest: {
      ...asset.manifest,
      proof: { ...asset.manifest.proof, verifyUrl: verifyPath },
      links: { ...asset.manifest.links, verify: verifyPath }
    }
  };
}

function assertUnique(assetId: string, existingAssetIds: readonly string[]) {
  if (existingAssetIds.includes(assetId)) throw new Error("exchange_asset_duplicate");
}

export function admitWildsCard(input: {
  actorReceizId: string;
  card: PortableCardAsset;
  priceCents: number;
  existingAssetIds: readonly string[];
}) {
  if (input.card.status !== "verified" && input.card.status !== "listed") throw new Error("wilds_card_sync_required");
  const verification = verifyPortableCard(input.card);
  if (!verification.ok) throw new Error("wilds_card_verification_failed");
  if (input.card.manifest.ownerReceizId !== input.actorReceizId) throw new Error("exchange_owner_authority_required");
  assertUnique(input.card.id, input.existingAssetIds);
  return withLocalVerification(portableCardExchangeAsset(input.card, input.priceCents));
}

export function admitUploadedAsset(input: {
  actorReceizId: string;
  artifactDigest: string;
  filename: string;
  submittedAsset: ReceizedAsset;
  verification: DocumentVerifyResponse;
  existingAssetIds: readonly string[];
  verifiedAt?: string;
}) {
  const verified = verifiedExchangeAsset({
    actorReceizId: input.actorReceizId,
    artifactDigest: input.artifactDigest,
    filename: input.filename,
    submittedAsset: input.submittedAsset,
    verification: input.verification,
    verifiedAt: input.verifiedAt
  });
  assertUnique(verified.id, input.existingAssetIds);
  return withLocalVerification(verified);
}
