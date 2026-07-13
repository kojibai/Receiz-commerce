import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("same-surface payment contract", () => {
  it("never navigates storefront or admin checkout to a Receiz payment URL", () => {
    const source = readFileSync("src/lib/storage/use-template-store.ts", "utf8");

    assert.doesNotMatch(source, /window\.location\.assign\(checkoutUrl\)/);
    assert.doesNotMatch(source, /window\.location\.assign\(session\.checkoutUrl\)/);
    assert.doesNotMatch(source, /window\.location\.assign\(payload\.connectUrl\)/);
    assert.match(source, /setEmbeddedPayment/);
  });

  it("keeps proof verification on the active app or tenant domain", () => {
    const ui = readFileSync("src/components/ui.tsx", "utf8");
    const storefront = readFileSync("src/features/storefront/PublicStorefront.tsx", "utf8");

    assert.match(ui, /const RECEIZ_VERIFY_URL = "\/verify"/);
    assert.doesNotMatch(ui, /https:\/\/receiz\.com/);
    assert.doesNotMatch(readFileSync("src/data/seed.ts", "utf8"), /verify(?:Url)?: "https:\/\/receiz\.com/);
    assert.match(storefront, /href={`\/verify\?claim=/);
    assert.doesNotMatch(storefront, /href={selected\.manifest\.links\.verify}/);
  });

  it("renders card funding inside the admin and storefront surfaces", () => {
    const admin = readFileSync("src/features/admin/AdminStudio.tsx", "utf8");
    const storefront = readFileSync("src/features/storefront/PublicStorefront.tsx", "utf8");

    assert.match(admin, /EmbeddedReceizPayment/);
    assert.match(storefront, /EmbeddedReceizPayment/);
  });

  it("does not connect a custom domain before platform payment is confirmed", () => {
    const route = readFileSync("app/api/hosting/route.ts", "utf8");

    assert.match(route, /custom_domain_payment_required/);
    assert.match(route, /platformPaymentConfirmed\(platformBilling\)/);
  });

  it("settles Exchange trades on the server and saves ownership only after payment", () => {
    const checkout = readFileSync("app/api/checkout/route.ts", "utf8");
    const exchange = readFileSync("app/api/exchange/route.ts", "utf8");

    assert.match(checkout, /commerceAction === "exchange_trade"/);
    assert.match(checkout, /exchangeTrade && settlement\.paid/);
    assert.match(checkout, /publishSettledExchangeTrade/);
    assert.match(checkout, /settleSandboxExchangeTrade/);
    assert.match(exchange, /verifyArtifact\(file\)/);
    assert.match(exchange, /publishAndAdmitReceizStoreState/);
  });

  it("admits new Exchange assets only through server verification", () => {
    const store = readFileSync("src/lib/storage/use-template-store.ts", "utf8");
    const uploadRoute = readFileSync("app/api/exchange/route.ts", "utf8");
    const wildsRoute = readFileSync("app/api/exchange/wilds/route.ts", "utf8");

    assert.match(store, /Choose a Receiz proof object to run the offline verifier before listing/);
    assert.match(uploadRoute, /admitUploadedAsset/);
    assert.match(wildsRoute, /synchronizeWildsCard/);
    assert.match(wildsRoute, /admitWildsCard/);
    assert.match(wildsRoute, /verifyPortableCardPng/);
    assert.match(wildsRoute, /request\.formData/);
    assert.match(store, /portableCardPngBlob/);
  });
});
