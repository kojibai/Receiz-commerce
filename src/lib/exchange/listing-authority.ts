import { assertReceizAssetManifest, projectReceizAssetManifest, type DocumentVerifyResponse } from "@receiz/sdk";
import type { ReceizedAsset } from "@/types/domain";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function manifestCandidate(verification: DocumentVerifyResponse) {
  const containers = [verification.bundle, verification.package, verification.anchor].filter(isRecord);
  for (const container of containers) {
    for (const value of [container.assetManifest, container.manifest, container]) {
      if (isRecord(value) && value.schema === "receiz.asset_manifest.v1") return value;
    }
  }

  throw new Error("exchange_verified_manifest_required");
}

function assetType(value: string): ReceizedAsset["type"] {
  if (value === "market_certificate" || value === "wallet_note") return "benefit";
  if (value === "profile_original" || value === "document") return "claim";
  if (value === "proof_object") return "limited_drop";
  return "access";
}

function listingPriceLabel(value: string) {
  const match = value.match(/[0-9]+(?:\.[0-9]{1,2})?/);
  const amount = match ? Number(match[0]) : 0;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    throw new Error("exchange_listing_price_invalid");
  }
  return `$${amount.toFixed(2)}`;
}

export function verifiedExchangeAsset(input: {
  actorReceizId: string;
  artifactDigest: string;
  filename: string;
  submittedAsset: ReceizedAsset;
  verification: DocumentVerifyResponse;
  verifiedAt?: string;
}): ReceizedAsset {
  const manifest = assertReceizAssetManifest(manifestCandidate(input.verification));
  const projection = projectReceizAssetManifest(manifest);
  const owner = isRecord(manifest.owner) ? manifest.owner : {};
  const ownerReceizId = typeof owner.receizSubject === "string" ? owner.receizSubject.trim() : "";
  if (!ownerReceizId || ownerReceizId !== input.actorReceizId) {
    throw new Error("exchange_owner_authority_required");
  }
  if (input.submittedAsset.manifest?.assetId !== manifest.assetId) {
    throw new Error("exchange_asset_manifest_mismatch");
  }

  const proof = manifest.proof;
  const verifyUrl = manifest.links.verify || proof.verifyUrl;
  return {
    id: `proof:${manifest.assetId}`,
    name: projection.title || input.submittedAsset.name,
    type: assetType(manifest.assetType),
    ownerId: ownerReceizId,
    status: "owned",
    priceLabel: listingPriceLabel(input.submittedAsset.priceLabel),
    proofSource: proof.receizClaimId,
    manifest: {
      schema: "receiz.asset_manifest.v1",
      assetId: manifest.assetId,
      assetType: manifest.assetType,
      proof: {
        kind: "receiz.proof_bundle",
        verifyUrl,
        kaiPulseEternal: proof.kaiPulseEternal,
        kaiKlok: proof.kaiKlok,
        receizClaimId: proof.receizClaimId,
        artifactSha256Basis: proof.artifactSha256Basis || input.artifactDigest
      },
      owner: {
        receizSubject: ownerReceizId,
        displayName: typeof owner.displayName === "string" && owner.displayName.trim() ? owner.displayName : ownerReceizId,
        custody: "current"
      },
      links: {
        verify: verifyUrl,
        asset: manifest.links.open || manifest.links.public
      }
    },
    verifiedArtifact: {
      filename: input.filename || "Receiz proof object",
      kind: input.verification.kind || "receiz.proof_bundle",
      verifiedAt: input.verifiedAt ?? new Date().toISOString(),
      warnings: input.verification.warnings,
      sha256Basis: input.artifactDigest
    }
  };
}
