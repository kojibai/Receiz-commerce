import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertPublishRequestBodySize,
  preparePublishRequestBody,
  prepareStoreStateMediaForPublishPayload
} from "../src/lib/receiz/publish-payload-media.js";
import type { CommerceState, Product } from "../src/types/domain.js";
import { baseState } from "./support/commerce-state.js";

function imageDataUrl(size: number) {
  return `data:image/jpeg;base64,${"a".repeat(size)}`;
}

describe("publish payload media preparation", () => {
  it("compresses oversized inline storefront images before JSON publish", async () => {
    const hugeImage = imageDataUrl(1_200_000);
    const compressedImage = imageDataUrl(64_000);
    const product = baseState().products[0]!;
    const state: CommerceState = {
      ...baseState(),
      brand: { ...baseState().brand, logoImageUrl: hugeImage },
      products: [
        {
          ...product,
          imageUrl: hugeImage,
          seo: {
            title: product.seo?.title ?? product.name,
            description: product.seo?.description ?? product.subtitle,
            canonicalPath: product.seo?.canonicalPath ?? "/products/test",
            keywords: product.seo?.keywords ?? [],
            socialImageUrl: hugeImage
          }
        }
      ]
    };

    const prepared = await prepareStoreStateMediaForPublishPayload(state, {
      tenantHost: "bjklock.receiz.app",
      merchantReceizId: "bjklock.receiz.id",
      itemMaxChars: 80_000,
      totalMaxChars: 180_000,
      compress: async () => compressedImage
    });
    const serialized = JSON.stringify({ action: "publish", state: prepared.state });

    assert.equal(prepared.compressed, 2);
    assert.equal(prepared.stripped, 1);
    assert.equal(prepared.state.brand.logoImageUrl, compressedImage);
    assert.equal(prepared.state.products[0]?.imageUrl, compressedImage);
    assert.equal(prepared.state.products[0]?.seo?.socialImageUrl, null);
    assert.ok(serialized.length < 180_000);
    assert.doesNotThrow(() => assertPublishRequestBodySize(serialized));
  });

  it("uses the Receiz media URL when the upload rail returns durable media", async () => {
    const hugeImage = imageDataUrl(1_200_000);
    const durableUrl = "https://media.receiz.test/logo.webp";
    const state = {
      ...baseState(),
      brand: { ...baseState().brand, logoImageUrl: hugeImage }
    };

    const prepared = await prepareStoreStateMediaForPublishPayload(state, {
      tenantHost: "bjklock.receiz.app",
      merchantReceizId: "bjklock.receiz.id",
      upload: async () => ({
        ok: true,
        media: { url: durableUrl, id: "media-proof-1" },
        proof: {
          appendAnchorId: "anchor-media-1",
          kaiPulse: "1782746100000",
          receizClaimId: "claim-media-1"
        }
      })
    });

    assert.equal(prepared.uploaded, 1);
    assert.equal(prepared.state.brand.logoImageUrl, durableUrl);
    assert.equal(prepared.state.brand.logoImageProof?.schema, "receiz.media_proof_reference.v1");
    assert.equal(prepared.state.brand.logoImageProof?.mediaUrl, durableUrl);
    assert.equal(prepared.state.brand.logoImageProof?.proofObjectId, "claim-media-1");
    assert.equal(prepared.state.brand.logoImageProof?.appendAnchorId, "anchor-media-1");
    assert.equal(prepared.state.brand.logoImageProof?.kaiPulse, "1782746100000");
    assert.match(prepared.state.brand.logoImageProof?.sourceHashSha256 ?? "", /^sha256:/);
  });

  it("strips inline media when it cannot be uploaded or compressed inside the payload budget", async () => {
    const hugeImage = imageDataUrl(1_200_000);
    const state = {
      ...baseState(),
      brand: { ...baseState().brand, logoImageUrl: hugeImage }
    };

    const prepared = await prepareStoreStateMediaForPublishPayload(state, {
      tenantHost: "bjklock.receiz.app",
      itemMaxChars: 80_000,
      totalMaxChars: 80_000,
      compress: async () => null
    });

    assert.equal(prepared.stripped, 1);
    assert.equal(prepared.state.brand.logoImageUrl, null);
  });

  it("keeps compressed product images in the final publish request envelope", async () => {
    const hugeImage = imageDataUrl(1_200_000);
    const compressedImage = imageDataUrl(64_000);
    const product = baseState().products[0]!;
    const state = {
      ...baseState(),
      products: Array.from({ length: 14 }, (_item, index) => ({
        ...product,
        id: `product-${index}`,
        name: `Product ${index}`,
        imageUrl: hugeImage
      }))
    };
    const merchantProof = {
      auth: {
        receizId: {
          connected: true,
          handle: "merchant.receiz.id",
          localProofVerified: true,
          keyFile: {
            schema: "receiz.identity_seal.v1",
            payload: "p".repeat(2_560_000)
          }
        }
      }
    };

    const body = await preparePublishRequestBody({
      action: "publish",
      merchantProof,
      state,
      statePayload: (preparedState: CommerceState) => ({
        products: preparedState.products,
        hosting: preparedState.hosting,
        brand: preparedState.brand
      }),
      media: {
        tenantHost: "bjklock.receiz.app",
        merchantReceizId: "merchant.receiz.id",
        compress: async () => compressedImage
      }
    });
    const serialized = JSON.stringify(body);

    assert.doesNotThrow(() => assertPublishRequestBodySize(serialized));
    assert.ok(serialized.length <= 3_000_000);
    assert.ok(body.state.products.some((item: Product) => item.imageUrl === compressedImage));
    assert.ok(body.state.products.some((item: Product) => item.imageUrl === null));
    assert.equal(body.state.products.some((item: Product) => item.imageUrl === hugeImage), false);
  });
});
