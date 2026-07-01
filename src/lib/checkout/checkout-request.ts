import type { CommerceState } from "@/types/domain";

export function checkoutTenantHost(state: Pick<CommerceState, "hosting">) {
  return state.hosting.customDomain.domain || state.hosting.subdomain;
}
