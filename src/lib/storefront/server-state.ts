import { headers } from "next/headers";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { storeStateProjectionSource } from "@/lib/receiz/proof-state";
import { mockStorage } from "@/lib/storage/mock-storage";
import { tenantFallbackState } from "@/lib/hosting/tenant-state";
import { hydrateProofStoreFromReceizStoreState } from "@/lib/receiz/store-state-ledger";

export async function loadStorefrontState() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(host);
  const proofStore = await getServerProofStateStore();
  const tenantHost = hostContext.tenantHost ?? hostContext.host;

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
