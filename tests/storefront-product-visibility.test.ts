import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "node:test";

describe("public storefront product visibility", () => {
  it("feeds only active products to desktop and mobile catalogs", async () => {
    const source = await readFile(resolve(process.cwd(), "src/features/storefront/PublicStorefront.tsx"), "utf8");

    assert.match(source, /const storefrontProducts = activeStorefrontProducts\(state\.products\)/);
    assert.doesNotMatch(source, /products=\{state\.products\}/);
  });
});
