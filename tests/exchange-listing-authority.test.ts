import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifiedExchangeAsset } from "../src/lib/exchange/listing-authority.js";
import { baseState } from "./support/commerce-state.js";

function sourceAsset() {
  return {
    id: "uploaded-proof",
    name: "Uploaded proof",
    type: "limited_drop" as const,
    ownerId: "merchant.receiz.id",
    status: "owned" as const,
    priceLabel: "$25.00",
    proofSource: "claim-uploaded-proof",
    manifest: baseState().exchange.assets[0]!.manifest
  };
}

function verification(owner = "merchant.receiz.id") {
  const source = sourceAsset();
  return {
    ok: true,
    kind: "receiz.proof_bundle",
    errors: [],
    warnings: [],
    bundle: {
      assetManifest: {
        ...source.manifest!,
        proof: {
          ...source.manifest!.proof,
          artifactSha256Basis: "a".repeat(64),
          payloadVersion: "v1",
          createdAtMs: 1783958400000,
          ts: "2026-07-13T12:00:00.000Z",
          code: "uploaded-proof",
          slug: "uploaded-proof",
          verifyPath: "/v/uploaded-proof",
          sigilClaimSeed: "b".repeat(64)
        },
        owner: { ...source.manifest!.owner, receizSubject: owner }
      }
    }
  };
}

describe("exchange listing authority", () => {
  it("projects identity and proof metadata from the verified artifact", () => {
    const source = sourceAsset();
    const asset = verifiedExchangeAsset({
      actorReceizId: "merchant.receiz.id",
      artifactDigest: "sha256:file-bytes",
      filename: "proof.json",
      submittedAsset: { ...source, priceLabel: "$25.00" },
      verification: verification(),
      verifiedAt: "2026-07-13T12:00:00.000Z"
    });

    assert.equal(asset.id, `proof:${source.manifest!.assetId}`);
    assert.equal(asset.ownerId, "merchant.receiz.id");
    assert.equal(asset.priceLabel, "$25.00");
    assert.equal(asset.verifiedArtifact?.sha256Basis, "sha256:file-bytes");
    assert.equal(asset.manifest?.proof.receizClaimId, source.manifest!.proof.receizClaimId);
  });

  it("rejects an artifact owned by another identity or a mismatched submitted manifest", () => {
    const source = sourceAsset();
    const input = {
      actorReceizId: "merchant.receiz.id",
      artifactDigest: "sha256:file-bytes",
      filename: "proof.json",
      submittedAsset: source,
      verifiedAt: "2026-07-13T12:00:00.000Z"
    };

    assert.throws(() => verifiedExchangeAsset({ ...input, verification: verification("other.receiz.id") }), /exchange_owner_authority_required/);
    assert.throws(
      () => verifiedExchangeAsset({
        ...input,
        submittedAsset: { ...source, manifest: { ...source.manifest!, assetId: "asset_tampered" } },
        verification: verification()
      }),
      /exchange_asset_manifest_mismatch/
    );
  });
});
