import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { admitUploadedAsset, admitWildsCard, localAssetVerifyPath } from "../src/lib/exchange/asset-admission.js";
import { sealCollectedCard } from "../src/features/play/portable-card.js";
import { baseState } from "./support/commerce-state.js";

describe("Exchange asset admission", () => {
  it("admits a synchronized owned Wilds card with local verification", () => {
    const local = sealCollectedCard({
      formId: "mintcub-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "admission-mint",
      capturedAt: "2026-07-13T15:00:00.000Z"
    });
    const asset = admitWildsCard({
      actorReceizId: "player.receiz.id",
      card: { ...local, status: "verified", synchronizedAt: "2026-07-13T15:01:00.000Z" },
      existingAssetIds: [],
      priceCents: 2500
    });

    assert.equal(asset.ownerId, "player.receiz.id");
    assert.match(asset.manifest?.links.verify ?? "", /^\/verify\?/);
    assert.equal(localAssetVerifyPath(asset.manifest!), asset.manifest?.links.verify);
  });

  it("rejects local-only, tampered, foreign-owned, and duplicate Wilds cards", () => {
    const card = sealCollectedCard({
      formId: "voltray-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "admission-voltray",
      capturedAt: "2026-07-13T15:00:00.000Z"
    });
    assert.throws(() => admitWildsCard({ actorReceizId: "player.receiz.id", card, priceCents: 1000, existingAssetIds: [] }), /sync_required/);
    assert.throws(() => admitWildsCard({ actorReceizId: "other.receiz.id", card: { ...card, status: "verified" }, priceCents: 1000, existingAssetIds: [] }), /owner_authority/);
    assert.throws(() => admitWildsCard({ actorReceizId: "player.receiz.id", card: { ...card, status: "verified", proof: { ...card.proof, digest: "sha256:bad" } }, priceCents: 1000, existingAssetIds: [] }), /verification_failed/);
    assert.throws(() => admitWildsCard({ actorReceizId: "player.receiz.id", card: { ...card, status: "verified" }, priceCents: 1000, existingAssetIds: [card.id] }), /duplicate/);
  });

  it("normalizes verified uploaded assets to local verification routes", () => {
    const source = baseState().exchange.assets[0]!;
    const submitted = {
      id: "upload-one",
      name: "Upload one",
      type: "limited_drop" as const,
      ownerId: "merchant.receiz.id",
      status: "owned" as const,
      priceLabel: "$25.00",
      proofSource: source.manifest.proof.receizClaimId,
      manifest: source.manifest
    };
    const verification = {
      ok: true,
      kind: "receiz.proof_bundle",
      errors: [],
      warnings: [],
      bundle: {
        assetManifest: {
          ...source.manifest,
          proof: {
            ...source.manifest.proof,
            artifactSha256Basis: "a".repeat(64),
            payloadVersion: "v1",
            createdAtMs: 1783958400000,
            ts: "2026-07-13T12:00:00.000Z",
            code: "upload-one",
            slug: "upload-one",
            verifyPath: "/v/upload-one",
            sigilClaimSeed: "b".repeat(64)
          },
          owner: { ...source.manifest.owner, receizSubject: "merchant.receiz.id" }
        }
      }
    };
    const asset = admitUploadedAsset({
      actorReceizId: "merchant.receiz.id",
      artifactDigest: "sha256:file",
      filename: "asset.json",
      submittedAsset: submitted,
      verification,
      existingAssetIds: []
    });

    assert.match(asset.manifest?.links.verify ?? "", /^\/verify\?/);
    assert.doesNotMatch(asset.manifest?.links.verify ?? "", /receiz\.com/);
  });
});
