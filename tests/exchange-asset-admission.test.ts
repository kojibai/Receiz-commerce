import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { admitUploadedAsset, admitWildsCard, localAssetVerifyPath, synchronizeWildsCard } from "../src/lib/exchange/asset-admission.js";
import { sealCollectedCard } from "../src/features/play/portable-card.js";
import { admitLegacyCard } from "../src/features/play/living-card-proof.js";
import { baseState } from "./support/commerce-state.js";

describe("Exchange asset admission", () => {
  it("offline-verifies and synchronizes a locally sealed bearer card for the uploader", () => {
    const local = sealCollectedCard({
      formId: "mintcub-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "sync-mint",
      capturedAt: "2026-07-13T14:59:00.000Z"
    });
    const synchronized = synchronizeWildsCard({
      actorReceizId: "player.receiz.id",
      card: local,
      synchronizedAt: "2026-07-13T15:00:00.000Z"
    });

    assert.equal(synchronized.status, "verified");
    assert.equal(synchronized.synchronizedAt, "2026-07-13T15:00:00.000Z");
    const transferred = synchronizeWildsCard({ actorReceizId: "other.receiz.id", card: local });
    assert.equal(transferred.status, "verified");
    assert.equal(transferred.manifest.ownerReceizId, "player.receiz.id");
    assert.throws(() => synchronizeWildsCard({ actorReceizId: "player.receiz.id", card: { ...local, proof: { ...local.proof, digest: "sha256:bad" } } }), /verification_failed/);
  });

  it("lists a verified offline transfer under the uploading owner while preserving card proof", () => {
    const card = sealCollectedCard({
      formId: "mintcub-1",
      ownerReceizId: "original.receiz.id",
      encounterId: "bearer-admission",
      capturedAt: "2026-07-13T15:00:00.000Z"
    });
    const synchronized = synchronizeWildsCard({ actorReceizId: "recipient.receiz.id", card });
    const admitted = admitWildsCard({
      actorReceizId: "recipient.receiz.id",
      card: synchronized,
      existingAssetIds: [],
      priceCents: 2500
    });

    assert.equal(admitted.ownerId, "recipient.receiz.id");
    assert.equal(admitted.manifest?.owner.receizSubject, "recipient.receiz.id");
    assert.equal(card.manifest.ownerReceizId, "original.receiz.id");
    assert.equal(admitted.verifiedArtifact?.sha256Basis, card.proof.digest);
  });

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

  it("admits a verified living card with its append-only history intact", () => {
    const living = admitLegacyCard(sealCollectedCard({
      formId: "mintcub-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "living-admission",
      capturedAt: "2026-07-13T15:00:00.000Z"
    }), "2026-07-13T15:00:00.000Z");
    const synchronized = synchronizeWildsCard({ actorReceizId: "player.receiz.id", card: living, synchronizedAt: "2026-07-13T15:01:00.000Z" });
    const admitted = admitWildsCard({ actorReceizId: "player.receiz.id", card: synchronized, existingAssetIds: [], priceCents: 3200 });

    assert.equal(admitted.ownerId, "player.receiz.id");
    assert.equal(living.manifest.revisions.length, 1);
  });

  it("rejects local-only, tampered, and duplicate Wilds cards", () => {
    const card = sealCollectedCard({
      formId: "voltray-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "admission-voltray",
      capturedAt: "2026-07-13T15:00:00.000Z"
    });
    assert.throws(() => admitWildsCard({ actorReceizId: "player.receiz.id", card, priceCents: 1000, existingAssetIds: [] }), /sync_required/);
    assert.equal(admitWildsCard({ actorReceizId: "other.receiz.id", card: { ...card, status: "verified" }, priceCents: 1000, existingAssetIds: [] }).ownerId, "other.receiz.id");
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
