import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { portableCardPackage, renderWildsCardSvg } from "../src/features/play/card-export.js";
import { sealCollectedCard } from "../src/features/play/portable-card.js";

describe("Wilds card export", () => {
  const card = sealCollectedCard({
    formId: "voltray-1",
    ownerReceizId: "player.receiz.id",
    encounterId: "export-voltray",
    capturedAt: "2026-07-13T15:00:00.000Z"
  });

  it("renders a complete high-resolution collectible card document", () => {
    const svg = renderWildsCardSvg(card);

    assert.match(svg, /viewBox="0 0 750 1050"/);
    assert.match(svg, />Voltray</);
    assert.match(svg, /WLD-002-1/);
    for (const label of ["HEALTH", "POWER", "GUARD", "SPEED", "BOND"]) assert.match(svg, new RegExp(label));
    assert.match(svg, /Spark Pulse/);
    assert.match(svg, /Voltray Bond/);
    assert.match(svg, /sha256:[a-f0-9]{64}/);
    assert.match(svg, /RARE|UNCOMMON|TRAIL|MYTHIC|ETERNAL/);
  });

  it("escapes manifest text before placing it in SVG", () => {
    const unsafe = {
      ...card,
      manifest: { ...card.manifest, name: "<script>alert('x')</script>" }
    };
    const svg = renderWildsCardSvg(unsafe);

    assert.doesNotMatch(svg, /<script>/);
    assert.match(svg, /&lt;script&gt;/);
  });

  it("packages artwork, manifest, proof, lineage, and offline instructions", () => {
    const pkg = portableCardPackage(card);

    assert.equal(pkg.schema, "receiz.wilds_portable_package.v1");
    assert.equal(pkg.asset.manifest.assetId, card.id);
    assert.equal(pkg.asset.proof.digest, card.proof.digest);
    assert.equal(pkg.lineage.rootAssetId, card.manifest.lineage.rootAssetId);
    assert.match(pkg.cardSvg, /Voltray/);
    assert.match(pkg.offlineVerification, /recompute/i);
  });
});
