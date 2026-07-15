import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const css = readFileSync("app/globals.css", "utf8");
const storefront = readFileSync("src/features/storefront/PublicStorefront.tsx", "utf8");

describe("mobile storefront layout CSS", () => {
  it("gives the Play pane a dedicated compact-layout hook", () => {
    assert.match(storefront, /<MobilePane active=\{active\} action=\{<StatusPill tone="pink">Game on<\/StatusPill>\} className="mobile-play-pane" title="Play">/);
  });

  it("keeps the five-item storefront toolbar on one mobile row", () => {
    assert.match(css, /\.bottom-nav\s*\{[\s\S]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);[\s\S]*\}/);
    assert.match(css, /\.bottom-nav button\s*\{[\s\S]*min-width:\s*0;[\s\S]*\}/);
    assert.match(css, /\.bottom-nav button\s*\{[\s\S]*padding:\s*0;[\s\S]*\}/);
  });

  it("keeps mobile storefront search and products in swipe rails", () => {
    assert.match(css, /\.mobile-category-scroll\s*\{[\s\S]*display:\s*flex;[\s\S]*overflow-x:\s*auto;[\s\S]*\}/);
    assert.match(css, /\.mobile-store-search-button\s*\{[\s\S]*width:\s*34px;[\s\S]*height:\s*34px;[\s\S]*\}/);
    assert.match(css, /\.mobile-mini-products\s*\{[\s\S]*display:\s*flex;[\s\S]*overflow-x:\s*auto;[\s\S]*scroll-snap-type:\s*x mandatory;[\s\S]*\}/);
    assert.match(css, /\.mobile-mini-products article\s*\{[\s\S]*flex:\s*0 0 calc\(\(100% - 10px\) \/ 2\);[\s\S]*scroll-snap-align:\s*start;[\s\S]*\}/);
  });

  it("keeps Exchange market controls in a compact horizontal mobile rail", () => {
    assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.exchange-market-list\s*\{[\s\S]*display:\s*flex;[\s\S]*overflow-x:\s*auto;[\s\S]*\}/);
    assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.exchange-market-list > \*\s*\{[\s\S]*flex:\s*0 0 clamp\(74px,\s*23vw,\s*104px\);[\s\S]*\}/);
    assert.match(css, /\.exchange-market-list button,\s*\.exchange-list-asset-button\s*\{/);
  });

  it("keeps the mobile account proof card compact above the cart", () => {
    assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.mobile-header\s*\{[\s\S]*height:\s*44px;[\s\S]*min-height:\s*44px;[\s\S]*\}/);
    assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.mobile-pane-heading\s*\{[\s\S]*min-height:\s*26px;[\s\S]*\}/);
    assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.mobile-account-card\s*\{[\s\S]*gap:\s*5px;[\s\S]*padding:\s*6px;[\s\S]*\}/);
    assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.mobile-account-card \.large-avatar\s*\{[\s\S]*width:\s*36px;[\s\S]*height:\s*36px;[\s\S]*\}/);
    assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.mobile-account-scope div\s*\{[\s\S]*min-height:\s*36px;[\s\S]*padding:\s*5px;[\s\S]*\}/);
    assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.mobile-pane \.cart-summary-empty\s*\{[\s\S]*grid-template-columns:\s*24px minmax\(0,\s*1fr\);[\s\S]*padding:\s*8px;[\s\S]*\}/);
  });

  it("lets content flow behind the floating toolbar with clearance only at scroll end", () => {
    assert.match(css, /\.mobile-stage\s*\{[^}]*height:\s*calc\(100dvh - 44px\);/s);
    assert.doesNotMatch(css, /height:\s*calc\(100dvh - 78px - 90px\)/);
    assert.match(css, /\.mobile-pane\s*\{[^}]*padding-bottom:\s*max\(94px,\s*calc\(80px \+ env\(safe-area-inset-bottom\)\)\);/s);
    assert.match(css, /\.bottom-nav\s*\{[^}]*bottom:\s*var\(--mobile-app-nav-bottom\);[^}]*min-height:\s*var\(--mobile-app-nav-height\);/s);
  });

  it("gives every compact Wilds control its own bounded layout row", () => {
    assert.match(css, /\.commerce-app\s*\{[^}]*--mobile-app-nav-bottom:\s*max\(8px, env\(safe-area-inset-bottom\)\);[^}]*--mobile-app-nav-height:\s*56px/s);
    assert.match(css, /\.mobile-play-pane \.mobile-pane-heading\s*\{[^}]*min-height:\s*20px;[^}]*height:\s*20px/s);
    assert.match(css, /\.mobile-play-pane \.mobile-pane-heading \.status-pill\s*\{[^}]*min-height:\s*18px/s);
    assert.doesNotMatch(css, /\.mobile-play-wrap \.wilds-command-system\s*\{[^}]*position:\s*fixed/s);
    assert.match(css, /\.mobile-pane\.mobile-play-pane\s*\{[^}]*bottom:\s*calc\(var\(--mobile-app-nav-bottom\) \+ var\(--mobile-app-nav-height\) \+ 8px\);[^}]*overflow:\s*hidden/s);
    assert.match(css, /\.mobile-play-wrap \.wilds-shell\s*\{[^}]*grid-template-rows:\s*minmax\(0, 1fr\) auto;[^}]*height:\s*100%/s);
    assert.match(css, /\.mobile-play-wrap \.wilds-world\s*\{[^}]*grid-template-rows:\s*minmax\(0, 1fr\) 68px/s);
    assert.match(css, /\.mobile-play-wrap \.wilds-stage\s*\{[^}]*min-height:\s*0/s);
    assert.match(css, /\.mobile-play-wrap \.wilds-trackpad\s*\{[^}]*width:\s*68px;[^}]*height:\s*68px/s);
  });

  it("keeps the atlas and new flank controls reachable on small screens", () => {
    assert.match(css, /\.wilds-screen-controls\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) var\(--wilds-pad-size\) minmax\(0,\s*1fr\)/s);
    assert.match(css, /\.wilds-control-rail\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
    assert.match(css, /\.wilds-control-rail-left\s*\{[^}]*justify-self:\s*end/s);
    assert.match(css, /\.wilds-control-rail-right\s*\{[^}]*justify-self:\s*start/s);
    assert.match(css, /\.wilds-control-flank\s*\{[^}]*min-height:\s*44px/s);
    assert.match(css, /\.wilds-world-map\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;[^}]*z-index:\s*6000/s);
    assert.match(css, /\.wilds-world-map-close\s*\{[^}]*top:\s*max\(12px,\s*env\(safe-area-inset-top\)\)/s);
    assert.match(css, /\.wilds-world-map-body\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*overflow:\s*hidden/s);
    assert.match(css, /\.wilds-atlas-stage\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0/s);
    assert.match(css, /\.wilds-atlas-destinations\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*4/s);
    assert.match(css, /@media \(max-width:\s*560px\)[\s\S]*\.wilds-atlas-destinations\s*\{[^}]*right:\s*10px;[^}]*bottom:\s*max\(10px,\s*env\(safe-area-inset-bottom\)\);[^}]*left:\s*10px/s);
  });

  it("uses customer ownership language on the mobile assets page", () => {
    assert.match(storefront, /Purchased products, benefits, and access can become Receized assets\./);
    assert.doesNotMatch(storefront, /Sold products, benefits, and access can become Receized assets\./);
  });
});
