import type { HostContext } from "@/lib/hosting/host-context";

export function shouldHydratePlatformMerchantRoute(
  hostContext: Pick<HostContext, "surface">,
  serverResolved: boolean
) {
  return hostContext.surface === "platform" || !serverResolved;
}
