import type { CommerceState } from "../../types/domain";
import type { HostContext } from "./host-context";
import { subdomainForSlug } from "./domain-utils";

function titleFromHost(value: string) {
  return value
    .split(".")[0]
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function logoTextFromHost(value: string) {
  return value.split(".")[0]?.replace(/[^a-z0-9]+/gi, "").toLowerCase().slice(0, 8) || "store";
}

export function tenantFallbackState(state: CommerceState, hostContext: HostContext): CommerceState {
  if (hostContext.surface !== "tenant") return state;

  if (hostContext.tenantSlug) {
    const subdomain = subdomainForSlug(hostContext.tenantSlug);
    const isStoredTenant = state.hosting.subdomain === subdomain;

    return {
      ...state,
      brand: isStoredTenant
        ? state.brand
        : {
            ...state.brand,
            name: titleFromHost(hostContext.tenantSlug),
            logoText: logoTextFromHost(hostContext.tenantSlug)
          },
      hosting: {
        ...state.hosting,
        tenantSlug: hostContext.tenantSlug,
        subdomain,
        liveUrl: `https://${subdomain}`,
        subdomainStatus: {
          ...state.hosting.subdomainStatus,
          domain: subdomain,
          liveUrl: `https://${subdomain}`,
          status: "active",
          sslStatus: "valid",
          verified: true,
          message: "Loaded from hosted subdomain"
        }
      },
      auth: {
        ...state.auth,
        signedInAs: "customer"
      }
    };
  }

  if (hostContext.customDomain) {
    const isStoredDomain = state.hosting.customDomain.domain === hostContext.customDomain;

    return {
      ...state,
      brand: isStoredDomain
        ? state.brand
        : {
            ...state.brand,
            name: titleFromHost(hostContext.customDomain),
            logoText: logoTextFromHost(hostContext.customDomain)
          },
      hosting: {
        ...state.hosting,
        liveUrl: `https://${hostContext.customDomain}`,
        customDomain: {
          ...state.hosting.customDomain,
          domain: hostContext.customDomain,
          liveUrl: `https://${hostContext.customDomain}`,
          status: "active",
          sslStatus: "valid",
          verified: true,
          message: "Loaded from custom domain"
        }
      },
      auth: {
        ...state.auth,
        signedInAs: "customer"
      }
    };
  }

  return state;
}
