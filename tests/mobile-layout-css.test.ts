import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const css = readFileSync("app/globals.css", "utf8");

describe("mobile storefront layout CSS", () => {
  it("keeps the six-item storefront toolbar on one mobile row", () => {
    assert.match(css, /\.bottom-nav\s*\{[\s\S]*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\);[\s\S]*\}/);
    assert.match(css, /\.bottom-nav button\s*\{[\s\S]*min-width:\s*0;[\s\S]*\}/);
    assert.match(css, /\.bottom-nav button\s*\{[\s\S]*padding:\s*0;[\s\S]*\}/);
  });

  it("keeps Exchange market controls in a compact horizontal mobile rail", () => {
    assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.exchange-market-list\s*\{[\s\S]*display:\s*flex;[\s\S]*overflow-x:\s*auto;[\s\S]*\}/);
    assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.exchange-market-list > \*\s*\{[\s\S]*flex:\s*0 0 clamp\(74px,\s*23vw,\s*104px\);[\s\S]*\}/);
    assert.match(css, /\.exchange-market-list button,\s*\.exchange-list-asset-button\s*\{/);
  });
});
