import { headers } from "next/headers";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { storeStateProjectionSource } from "@/lib/receiz/proof-state";
import { mockStorage } from "@/lib/storage/mock-storage";
import { tenantFallbackState } from "@/lib/hosting/tenant-state";
import { hydrateProofStoreFromReceizStoreState } from "@/lib/receiz/store-state-ledger";
import { mergeStoreApiProjection } from "./store-api-projection";

function requestProtocol(host: string, forwardedProto: string | null) {
  if (forwardedProto) return forwardedProto.split(",")[0]?.trim() || "https";
  return host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
}

async function loadCanonicalTenantProjection(host: string, protocol: string) {
  try {
    const response = await fetch(`${protocol}://${host}/api/store`, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        "x-receiz-storefront-fetch": "1"
      }
    });

    if (!response.ok) return null;

    return mergeStoreApiProjection(mockStorage.getState(), await response.json());
  } catch {
    return null;
  }
}

export async function loadStorefrontState() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? platform.domain;
  const protocol = requestProtocol(host, requestHeaders.get("x-forwarded-proto"));
  const hostContext = hostContextFromHost(host);
  const tenantHost = hostContext.tenantHost ?? hostContext.host;

  if (hostContext.surface === "tenant") {
    const canonicalState = await loadCanonicalTenantProjection(host, protocol);

    if (canonicalState) {
      return {
        state: tenantFallbackState(canonicalState, hostContext, { trustedPublishedState: true }),
        hostContext
      };
    }
  }

  const proofStore = await getServerProofStateStore();

  if (hostContext.surface === "tenant") {
    await hydrateProofStoreFromReceizStoreState(proofStore, tenantHost);
  }

  const projectionSource = hostContext.surface === "tenant" ? storeStateProjectionSource(proofStore.records(), tenantHost) : "platform";
  const trustedPublishedState = projectionSource === "published";

  const state =
    hostContext.surface === "tenant"
      ? tenantFallbackState(proofStore.projectHost(mockStorage.getState(), tenantHost), hostContext, { trustedPublishedState })
      : mockStorage.getState();

  return { state, hostContext };
}
