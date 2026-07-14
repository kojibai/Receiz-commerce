import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  embedPortableCardInPng,
  embedPortableVaultInPng,
  readPortableCardFromPng,
  readPortableVaultFromPng,
  renderWildsCardSvg,
  renderWildsVaultSvg,
  standaloneCardUrl,
  verifyPortableCardPng,
  verifyPortableVaultPng
} from "../src/features/play/card-export.js";
import { sealCollectedCard } from "../src/features/play/portable-card.js";
import { admitLegacyCard } from "../src/features/play/living-card-proof.js";

describe("Wilds card export", () => {
  const card = sealCollectedCard({
    formId: "voltray-1",
    ownerReceizId: "player.receiz.id",
    encounterId: "export-voltray",
    capturedAt: "2026-07-13T15:00:00.000Z"
  });

  it("renders a complete high-resolution collectible card document", () => {
    const svg = renderWildsCardSvg(card, { origin: "https://cards.kaiturah.example" });

    assert.match(svg, /viewBox="0 0 750 1050"/);
    assert.match(svg, />Voltray</);
    assert.match(svg, /WLD-002-1/);
    for (const label of ["HEALTH", "POWER", "GUARD", "SPEED", "BOND"]) assert.match(svg, new RegExp(label));
    assert.match(svg, /Spark Pulse/);
    assert.match(svg, /Voltray Bond/);
    assert.match(svg, /sha256:[a-f0-9]{64}/);
    assert.match(svg, /id="card-qr"/);
    assert.match(svg, /data-presentation-signature="sha256:[a-f0-9]{64}"/);
    assert.match(svg, /data-archetype="[a-z-]+"/);
    assert.match(svg, /data-maturity="baby"/);
    assert.match(svg, /QR link to standalone card page/);
    const premiumQr = svg.match(/data-premium-qr="true" data-module-grid="crisp-vector" data-qr-size="(\d+)"/);
    assert.ok(premiumQr);
    assert.equal(Number(premiumQr[1]), 66);
    assert.match(svg, /shape-rendering="crispEdges"/);
    assert.match(svg, /RARE|UNCOMMON|TRAIL|MYTHIC|ETERNAL/);
    assert.equal(standaloneCardUrl(card.id, "https://cards.kaiturah.example/store"), `https://cards.kaiturah.example/c/${card.id.slice("wilds:".length)}`);
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

    assert.equal(decoded.schema, "receiz.wilds_png_proof.v2");
    assert.equal(decoded.asset.id, card.id);
    assert.equal(decoded.asset.proof.digest, card.proof.digest);
    assert.equal(decoded.asset.manifest.lineage.rootAssetId, card.manifest.lineage.rootAssetId);
    assert.equal(verified.ok, true);
    assert.equal(verified.asset?.id, card.id);
  });

  it("round-trips a living card with its complete append-only history", () => {
    const living = admitLegacyCard(card, "2026-07-13T15:02:00.000Z");
    const sourcePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    const portablePng = embedPortableCardInPng(sourcePng, living);
    const verified = verifyPortableCardPng(portablePng);

    assert.equal(verified.ok, true);
    assert.equal(verified.asset?.manifest.schema, "receiz.wilds_living_card_manifest.v2");
    assert.equal(verified.asset?.id, living.id);
  });

  it("rejects a PNG when its image or embedded proof bytes are changed", () => {
    const sourcePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    const portablePng = embedPortableCardInPng(sourcePng, card);
    const tampered = portablePng.slice();
    tampered[tampered.length - 18] ^= 0x01;

    assert.equal(verifyPortableCardPng(tampered).ok, false);
  });

  it("seals and restores a complete collection from one showcase vault PNG", () => {
    const second = sealCollectedCard({
      formId: "ledgerfox-1",
      ownerReceizId: "player.receiz.id",
      encounterId: "export-ledgerfox",
      capturedAt: "2026-07-13T15:01:00.000Z"
    });
    const sourcePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    const vaultPng = embedPortableVaultInPng(sourcePng, [card, second]);
    const decoded = readPortableVaultFromPng(vaultPng);
    const verified = verifyPortableVaultPng(vaultPng);

    assert.match(renderWildsVaultSvg([card, second]), /WILDS VAULT/);
    assert.equal(decoded.schema, "receiz.wilds_vault_png_proof.v2");
    assert.equal(decoded.assets.length, 2);
    assert.equal(verified.ok, true);
    assert.deepEqual(verified.assets.map((asset) => asset.id), [card.id, second.id]);
  });
});
