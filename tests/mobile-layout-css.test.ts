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

  it("keeps Exchange market controls in a compact mobile row without horizontal scroll", () => {
    assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.exchange-market-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[\s\S]*overflow-x:\s*visible;[\s\S]*\}/);
  });
});
