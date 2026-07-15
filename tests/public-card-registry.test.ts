import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { admitLegacyCard } from "../src/features/play/living-card-proof.js";
import { admitPublicWildsCard, attemptPublicWildsCardRegistration, parsePublicWildsCardRecord, publicWildsCardRecoverySourceUrls, registerPublicWildsCard, resolveLocalPublicWildsCard } from "../src/features/play/public-card-registry.js";
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

  it("admits the compact URL that is actually encoded in the card QR", () => {
    const asset = card();
    const sourceUrl = `https://cards.example/c/${asset.id.slice("wilds:".length)}`;
    const record = admitPublicWildsCard(asset, sourceUrl, bornAt);

    assert.equal(record.sourceUrl, sourceUrl);
  });

  it("recovers platform-published cards when their image is requested on a custom domain", () => {
    const asset = card();

    assert.deepEqual(
      publicWildsCardRecoverySourceUrls(asset.id, "https://shop.bjk.ceo", "receiz.app"),
      [
        `https://shop.bjk.ceo/c/${asset.id.slice("wilds:".length)}`,
        `https://shop.bjk.ceo/cards/${encodeURIComponent(asset.id)}`,
        `https://receiz.app/c/${asset.id.slice("wilds:".length)}`,
        `https://receiz.app/cards/${encodeURIComponent(asset.id)}`
      ]
    );
  });

  it("rejects a tampered card before it can become publicly resolvable", () => {
    const asset = card();
    const tampered = { ...asset, manifest: { ...asset.manifest, name: "Counterfeit" } };
    assert.throws(() => admitPublicWildsCard(tampered, `https://cards.example/cards/${asset.id}`, bornAt), /verification/);
  });

  it("rejects a registration that was not durably published", async () => {
    const asset = card();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
      ok: true,
      published: false,
      record: admitPublicWildsCard(asset, `https://cards.example/cards/${encodeURIComponent(asset.id)}`, bornAt)
    }), { status: 200, headers: { "content-type": "application/json" } });

    try {
      await assert.rejects(() => registerPublicWildsCard(asset), /publication/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("reports unavailable publication without blocking offline export", async () => {
    const asset = card();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
      ok: false,
      published: false,
      error: "wilds_public_card_authority_required"
    }), { status: 503, headers: { "content-type": "application/json" } });

    try {
      assert.deepEqual(await attemptPublicWildsCardRegistration(asset), {
        published: false,
        error: "wilds_public_card_authority_required"
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("forwards a restored Identity Seal for signed Receiz publication", async () => {
    const asset = card();
    const keyFile = { schema: "receiz.identity.key.v1", keyId: "key:test" };
    const record = admitPublicWildsCard(asset, `https://cards.example/c/${asset.id.slice("wilds:".length)}`, bornAt);
    const originalFetch = globalThis.fetch;
    let submitted: unknown = null;
    globalThis.fetch = async (_input, init) => {
      submitted = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ ok: true, published: true, record }), { status: 200, headers: { "content-type": "application/json" } });
    };

    try {
      await registerPublicWildsCard(asset, { identityProof: { keyFile } });
      assert.deepEqual(submitted, { asset, identityProof: { keyFile } });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
