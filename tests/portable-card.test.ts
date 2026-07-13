import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evolvePortableCard,
  portableCardExchangeAsset,
  sealCollectedCard,
  sha256PortableBasis,
  verifyPortableCard
} from "../src/features/play/portable-card.js";

const NOW = "2026-07-13T15:00:00.000Z";

describe("Wilds portable cards", () => {
  it("uses standards-compatible SHA-256 for offline proof digests", () => {
    assert.equal(
      sha256PortableBasis("abc"),
      "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("seals a collected card deterministically and verifies it offline", () => {
    const input = {
      formId: "mintcub-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "encounter-mint-1",
      capturedAt: NOW
    };
    const first = sealCollectedCard(input);
    const replay = sealCollectedCard(input);

    assert.deepEqual(replay, first);
    assert.equal(first.status, "sealed_local");
    assert.match(first.proof.digest, /^sha256:[a-f0-9]{64}$/);
    assert.equal(verifyPortableCard(first).ok, true);
    assert.equal(first.manifest.schema, "receiz.wilds_card_manifest.v1");
    assert.equal(first.manifest.formId, "mintcub-1");
  });

  it("rejects owner, stat, and digest tampering", () => {
    const asset = sealCollectedCard({
      formId: "voltray-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "encounter-voltray-1",
      capturedAt: NOW
    });

    assert.equal(verifyPortableCard({
      ...asset,
      manifest: { ...asset.manifest, ownerReceizId: "tampered.receiz.id" }
    }).ok, false);
    assert.equal(verifyPortableCard({
      ...asset,
      manifest: { ...asset.manifest, stats: { ...asset.manifest.stats, power: 999 } }
    }).ok, false);
    assert.equal(verifyPortableCard({ ...asset, proof: { ...asset.proof, digest: "sha256:tampered" } }).ok, false);
  });

  it("evolves through proof-linked forms without erasing the collection seal", () => {
    const base = sealCollectedCard({
      formId: "ledgerfox-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "encounter-ledger-1",
      capturedAt: NOW
    });
    const evolved = evolvePortableCard({
      previous: base,
      nextFormId: "ledgerfox-2",
      evolvedAt: "2026-07-14T15:00:00.000Z"
    });

    assert.equal(verifyPortableCard(evolved).ok, true);
    assert.equal(evolved.manifest.formId, "ledgerfox-2");
    assert.equal(evolved.manifest.lineage.rootAssetId, base.id);
    assert.equal(evolved.manifest.lineage.previousAssetId, base.id);
    assert.equal(evolved.manifest.lineage.rootDigest, base.proof.digest);
    assert.notEqual(evolved.id, base.id);
  });

  it("projects only synchronized cards into verified Exchange assets", () => {
    const local = sealCollectedCard({
      formId: "titanseal-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "encounter-titan-1",
      capturedAt: NOW
    });

    assert.throws(() => portableCardExchangeAsset(local, 2500), /wilds_card_sync_required/);
    const asset = portableCardExchangeAsset({ ...local, status: "verified", synchronizedAt: NOW }, 2500);
    assert.equal(asset.ownerId, "player.receiz.id");
    assert.equal(asset.priceLabel, "$25.00");
    assert.equal(asset.manifest?.assetId, local.id);
    assert.match(asset.manifest?.links.verify ?? "", /^\/verify\?/);
  });
});
