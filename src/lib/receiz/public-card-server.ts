import { parsePublicWildsCardRecord, publicWildsCardRecoverySourceUrls, resolveLocalPublicWildsCard } from "@/features/play/public-card-registry";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { platform } from "@/lib/platform";

export function publicCardRequestOrigin(headers: Pick<Headers, "get">, fallback = `https://${platform.domain}`) {
  const forwardedHost = headers.get("x-forwarded-host");
  const host = forwardedHost ?? headers.get("host");
  if (!host) return new URL(fallback).origin;
  const forwardedProto = headers.get("x-forwarded-proto");
  return `${forwardedProto ?? "https"}://${host}`;
}

export async function resolvePublicWildsCardGlobally(assetId: string, requestOrigin: string) {
  const local = resolveLocalPublicWildsCard(assetId);
  if (local) return local;

  for (const sourceUrl of publicWildsCardRecoverySourceUrls(assetId, requestOrigin, platform.domain)) {
    try {
      const recovered = parsePublicWildsCardRecord(await createReceizCommerceAdapter().readAppStateByUrl(sourceUrl));
      if (recovered?.assetId === assetId) return recovered;
    } catch {
      // Continue through custom-domain, platform, compact, and legacy recovery locations.
    }
  }

  return null;
}
