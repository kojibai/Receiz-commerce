import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { admitLegacyCard } from "../src/features/play/living-card-proof.js";
import { admitPublicWildsCard, parsePublicWildsCardRecord, resolveLocalPublicWildsCard } from "../src/features/play/public-card-registry.js";
import { sealCollectedCard } from "../src/features/play/portable-card.js";

const bornAt = "2026-07-13T20:00:00.000Z";

function card() {
  return admitLegacyCard(sealCollectedCard({ formId: "mintcub-1", ownerReceizId: "collector.receiz.id", encounterId: "public-card", capturedAt: bornAt }), bornAt);
}

describe("verified public Wilds card registry", () => {
  it("admits and resolves an offline-verifiable card by its short public id", () => {
    const asset = card();
    const sourceUrl = `https://cards.example/cards/${encodeURIComponent(asset.id)}`;
    const record = admitPublicWildsCard(asset, sourceUrl, bornAt);

    assert.equal(record.schema, "receiz.wilds_public_card.v1");
    assert.equal(resolveLocalPublicWildsCard(asset.id)?.asset.proof.digest, asset.proof.digest);
    assert.equal(parsePublicWildsCardRecord({ state: record })?.sourceUrl, sourceUrl);
  });

  it("rejects a tampered card before it can become publicly resolvable", () => {
    const asset = card();
    const tampered = { ...asset, manifest: { ...asset.manifest, name: "Counterfeit" } };
    assert.throws(() => admitPublicWildsCard(tampered, `https://cards.example/cards/${asset.id}`, bornAt), /verification/);
  });
});
