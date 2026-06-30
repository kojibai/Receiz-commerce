export const PWA_CACHE_VERSION = "receiz-commerce-pwa-2026-06-30";

export type PwaCacheStrategy =
  | "network-only"
  | "network-first-page"
  | "network-first-proof-state"
  | "stale-while-revalidate-static";

const sensitiveApiPrefixes = [
  "/api/auth",
  "/api/checkout",
  "/api/hosting",
  "/api/receiz/webhook",
  "/api/content/twin",
  "/api/receiz-id"
];

const staticPrefixes = ["/_next/static/", "/icons/", "/manifest.webmanifest"];
const storePagePrefixes = ["/products", "/blog", "/account", "/offline"];

export function shouldBypassServiceWorker(url: URL, method: string) {
  if (method !== "GET") return true;
  return sensitiveApiPrefixes.some((prefix) => url.pathname.startsWith(prefix));
}

export function cacheStrategyForRequest(
  url: URL,
  method: string,
  mode: RequestMode | "navigate" | "cors" | "no-cors" | "same-origin"
): PwaCacheStrategy {
  if (shouldBypassServiceWorker(url, method)) return "network-only";

  if (staticPrefixes.some((prefix) => url.pathname.startsWith(prefix))) {
    return "stale-while-revalidate-static";
  }

  if (url.pathname === "/api/store") {
    return "network-first-proof-state";
  }

  if (mode === "navigate" || url.pathname === "/" || storePagePrefixes.some((prefix) => url.pathname.startsWith(prefix))) {
    return "network-first-page";
  }

  return "network-only";
}
