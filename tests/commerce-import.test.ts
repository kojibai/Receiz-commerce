import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCommerceImport } from "../src/lib/import/commerce-importer.js";

describe("commerce content importer", () => {
  it("imports Shopify products JSON into Receiz products", () => {
    const result = parseCommerceImport({
      sourceType: "shopify",
      payload: JSON.stringify({
        products: [
          {
            id: 100,
            title: "Origin Roast",
            handle: "origin-roast",
            body_html: "<p>Single-origin beans.</p>",
            product_type: "Coffee",
            variants: [{ price: "24.00", inventory_quantity: 12 }],
            image: { src: "https://cdn.example.com/coffee.png" }
          }
        ]
      })
    });

    assert.equal(result.products.length, 1);
    assert.equal(result.products[0]?.name, "Origin Roast");
    assert.equal(result.products[0]?.priceLabel, "$24.00");
    assert.equal(result.products[0]?.seo?.canonicalPath, "/products/origin-roast");
    assert.equal(result.summary.products, 1);
  });

  it("imports WooCommerce products and WordPress posts/pages", () => {
    const result = parseCommerceImport({
      sourceType: "wordpress",
      payload: JSON.stringify({
        products: [
          {
            id: 22,
            name: "Member Pass",
            slug: "member-pass",
            price: "49",
            stock_quantity: 7,
            short_description: "<p>VIP access.</p>",
            description: "<p>Unlock events.</p>",
            images: [{ src: "https://site.test/pass.png" }]
          }
        ],
        posts: [
          {
            id: 11,
            slug: "launch-story",
            title: { rendered: "Launch Story" },
            excerpt: { rendered: "<p>How we launched.</p>" },
            content: { rendered: "<p>Full story.</p>" },
            date: "2026-06-30T00:00:00"
          }
        ],
        pages: [
          {
            id: 9,
            slug: "about",
            title: { rendered: "About" },
            content: { rendered: "<p>About the brand.</p>" }
          }
        ]
      })
    });

    assert.equal(result.products[0]?.name, "Member Pass");
    assert.equal(result.blogPosts[0]?.title, "Launch Story");
    assert.equal(result.pages[0]?.slug, "/about");
    assert.equal(result.summary.pages, 1);
  });

  it("imports products from CSV exports", () => {
    const result = parseCommerceImport({
      sourceType: "csv",
      payload: "title,description,price,inventory,status\nGift Card,Digital credit,10,999,active"
    });

    assert.equal(result.products.length, 1);
    assert.equal(result.products[0]?.name, "Gift Card");
    assert.equal(result.products[0]?.type, "digital");
    assert.equal(result.products[0]?.priceLabel, "$10.00");
  });

  it("imports JSON-LD Product and BlogPosting from generic site HTML", () => {
    const result = parseCommerceImport({
      sourceType: "generic_site",
      payload: `
        <html>
          <head>
            <title>Proof Brand</title>
            <meta name="description" content="Proof native commerce" />
            <script type="application/ld+json">
              {"@context":"https://schema.org","@type":"Product","name":"Proof Hoodie","description":"Sealed merch","offers":{"price":"68","priceCurrency":"USD"}}
            </script>
            <script type="application/ld+json">
              {"@context":"https://schema.org","@type":"BlogPosting","headline":"Why proof commerce","description":"The story","articleBody":"Long story"}
            </script>
          </head>
          <body><h1>Proof Brand</h1></body>
        </html>
      `
    });

    assert.equal(result.products[0]?.name, "Proof Hoodie");
    assert.equal(result.products[0]?.priceLabel, "$68.00");
    assert.equal(result.blogPosts[0]?.title, "Why proof commerce");
    assert.equal(result.pages[0]?.title, "Proof Brand");
  });
});
