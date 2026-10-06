import { digestReceizCanonicalV122, receizOidcScopesForRails } from "@receiz/sdk";
import type { NativeReserveQuote } from "./native-reserve-execution";

export function nativeReserveScopes() {
  return [...new Set(receizOidcScopesForRails("reserve", "domains"))].sort();
}

export function nativeReserveConsentDigest(quote: NativeReserveQuote, exactPlanDigest: string) {
  return digestReceizCanonicalV122({ schema: "receiz.app.reserve-checkout-consent.v1", quote,
    exactPlanDigest, scopes: nativeReserveScopes(),
    statement: "Pay the displayed Reserve amount to this merchant for this purchase. Any card remainder is a separate confirmation. An incomplete purchase remains recoverable." });
}
