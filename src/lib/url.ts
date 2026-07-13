const LOCAL_ORIGIN = "http://localhost:3000";

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed.replace(/\/$/, "")
    : `https://${trimmed.replace(/\/$/, "")}`;
}

export function getConfiguredSiteOrigin() {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeOrigin(process.env.VERCEL_URL) ??
    LOCAL_ORIGIN
  );
}

export function getRequestOrigin(request: Request) {
  if (process.env.RECEIZ_TRUST_FORWARDED_ORIGIN === "true") {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    if (forwardedHost && /^(?:[a-z0-9-]+\.)*[a-z0-9-]+(?::\d+)?$/i.test(forwardedHost)) {
      return `${forwardedProto === "http" ? "http" : "https"}://${forwardedHost}`;
    }
  }

  return normalizeOrigin(new URL(request.url).origin) ?? getConfiguredSiteOrigin();
}

export function getReceizRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/auth/receiz/callback`;
}
