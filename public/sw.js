const PWA_CACHE_VERSION = "receiz-commerce-pwa-2026-06-30";
const STATIC_CACHE = `${PWA_CACHE_VERSION}-static`;
const PAGE_CACHE = `${PWA_CACHE_VERSION}-pages`;
const PROOF_STATE_CACHE = `${PWA_CACHE_VERSION}-proof-state`;
const PRECACHE_URLS = ["/", "/offline", "/products", "/blog", "/icons/icon-192.png", "/icons/icon-512.png"];
const SENSITIVE_API_PREFIXES = [
  "/api/auth",
  "/api/checkout",
  "/api/hosting",
  "/api/receiz/webhook",
  "/api/content/twin",
  "/api/receiz-id"
];
const STATIC_PREFIXES = ["/_next/static/", "/icons/", "/manifest.webmanifest"];
const STORE_PAGE_PREFIXES = ["/products", "/blog", "/account", "/offline"];

function shouldBypass(request, url) {
  if (request.method !== "GET") return true;
  return SENSITIVE_API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function strategyFor(request, url) {
  if (shouldBypass(request, url)) return "network-only";
  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return "stale-static";
  if (url.pathname === "/api/store") return "network-first-proof-state";
  if (request.mode === "navigate" || url.pathname === "/" || STORE_PAGE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    return "network-first-page";
  }
  return "network-only";
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return fallbackUrl ? caches.match(fallbackUrl) : Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        void cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || refresh || Response.error();
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const validCaches = new Set([STATIC_CACHE, PAGE_CACHE, PROOF_STATE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("receiz-commerce-pwa-") && !validCaches.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data?.type === "CLEAR_RECEIZ_PWA_CACHES") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("receiz-commerce-pwa-")).map((key) => caches.delete(key)))));
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const strategy = strategyFor(event.request, url);

  if (strategy === "network-only") return;

  if (strategy === "stale-static") {
    event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
    return;
  }

  if (strategy === "network-first-proof-state") {
    event.respondWith(networkFirst(event.request, PROOF_STATE_CACHE));
    return;
  }

  event.respondWith(networkFirst(event.request, PAGE_CACHE, "/offline"));
});
