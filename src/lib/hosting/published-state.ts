import type { CommerceState, HostingConfig } from "../../types/domain";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeHostingForPublish(base: HostingConfig, input: unknown): HostingConfig {
  const hosting = (isRecord(input) ? input : {}) as Partial<HostingConfig>;

  return {
    ...base,
    ...hosting,
    subdomainStatus: {
      ...base.subdomainStatus,
      ...(isRecord(hosting.subdomainStatus) ? hosting.subdomainStatus : {})
    },
    customDomain: {
      ...base.customDomain,
      ...(isRecord(hosting.customDomain) ? hosting.customDomain : {})
    },
    published: true,
    lastPublishedAt: "now"
  };
}

export function buildPublishedCommerceState(base: CommerceState, input: unknown): CommerceState {
  const state = (isRecord(input) ? input : {}) as Partial<CommerceState>;

  return {
    ...base,
    ...state,
    hosting: mergeHostingForPublish(base.hosting, state.hosting)
  };
}
