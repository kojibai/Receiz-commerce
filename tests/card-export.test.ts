import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  embedPortableCardInPng,
  readPortableCardFromPng,
  renderWildsCardSvg,
  verifyPortableCardPng
} from "../src/features/play/card-export.js";
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

  it("embeds the complete proof into one offline-verifiable PNG", () => {
    const sourcePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    const portablePng = embedPortableCardInPng(sourcePng, card);
    const decoded = readPortableCardFromPng(portablePng);
    const verified = verifyPortableCardPng(portablePng);

    assert.equal(decoded.schema, "receiz.wilds_png_proof.v1");
    assert.equal(decoded.asset.id, card.id);
    assert.equal(decoded.asset.proof.digest, card.proof.digest);
    assert.equal(decoded.asset.manifest.lineage.rootAssetId, card.manifest.lineage.rootAssetId);
    assert.equal(verified.ok, true);
    assert.equal(verified.asset?.id, card.id);
  });

  it("rejects a PNG when its image or embedded proof bytes are changed", () => {
    const sourcePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    const portablePng = embedPortableCardInPng(sourcePng, card);
    const tampered = portablePng.slice();
    tampered[tampered.length - 18] ^= 0x01;

    assert.equal(verifyPortableCardPng(tampered).ok, false);
  });
});
