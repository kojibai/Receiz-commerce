import { headers } from "next/headers";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { mockStorage } from "@/lib/storage/mock-storage";
import { tenantFallbackState } from "@/lib/hosting/tenant-state";

export async function loadStorefrontState() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(host);
  const proofStore = await getServerProofStateStore();
  const state =
    hostContext.surface === "tenant"
      ? tenantFallbackState(proofStore.projectHost(mockStorage.getState(), hostContext.tenantHost ?? hostContext.host), hostContext)
      : mockStorage.getState();

  return { state, hostContext };
}
