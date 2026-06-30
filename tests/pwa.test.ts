import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPwaManifest } from "../src/lib/pwa/manifest.js";
import {
  PWA_CACHE_VERSION,
  cacheStrategyForRequest,
  shouldBypassServiceWorker
} from "../src/lib/pwa/cache-policy.js";

describe("PWA install and service worker policy", () => {
  it("builds an installable app manifest with maskable icons and shortcuts", () => {
    const manifest = buildPwaManifest();

    assert.equal(manifest.name, "Receiz.app Commerce Cloud");
    assert.equal(manifest.start_url, "/");
    assert.equal(manifest.scope, "/");
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.theme_color, "#07111f");
    assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192" && icon.purpose?.includes("maskable")));
    assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose?.includes("maskable")));
    assert.ok(manifest.shortcuts?.some((shortcut) => shortcut.url === "/admin"));
  });

  it("keeps sensitive Receiz routes network-only and caches storefront routes", () => {
    assert.equal(PWA_CACHE_VERSION.startsWith("receiz-commerce-pwa-"), true);
    assert.equal(shouldBypassServiceWorker(new URL("https://receiz.app/api/checkout"), "POST"), true);
    assert.equal(shouldBypassServiceWorker(new URL("https://receiz.app/api/auth/receiz/me"), "GET"), true);
    assert.equal(shouldBypassServiceWorker(new URL("https://receiz.app/api/receiz/webhook"), "POST"), true);
    assert.equal(cacheStrategyForRequest(new URL("https://receiz.app/products/coffee-pack"), "GET", "navigate"), "network-first-page");
    assert.equal(cacheStrategyForRequest(new URL("https://receiz.app/api/store"), "GET", "cors"), "network-first-proof-state");
    assert.equal(cacheStrategyForRequest(new URL("https://receiz.app/_next/static/chunk.js"), "GET", "no-cors"), "stale-while-revalidate-static");
  });
});
