import { headers } from "next/headers";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { mockStorage } from "@/lib/storage/mock-storage";

export async function loadStorefrontState() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(host);
  const proofStore = await getServerProofStateStore();
  const state =
    hostContext.surface === "tenant"
      ? proofStore.projectHost(mockStorage.getState(), hostContext.tenantHost ?? hostContext.host)
      : mockStorage.getState();

  return { state, hostContext };
}
