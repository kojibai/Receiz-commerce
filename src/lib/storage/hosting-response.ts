import type { HostingConfig } from "@/types/domain";

function customDomainIsLive(domain: HostingConfig["customDomain"]) {
  return Boolean(domain.domain && domain.verified && domain.dnsResolved);
}

export function mergeCustomDomainHostingResponse(
  current: HostingConfig,
  response: HostingConfig
): HostingConfig {
  const customDomain = {
    ...current.customDomain,
    ...response.customDomain
  };
  const customDomainLive = customDomainIsLive(customDomain);

  return {
    ...current,
    mode: response.mode ?? current.mode,
    customDomain,
    liveUrl: customDomainLive
      ? customDomain.liveUrl || `https://${customDomain.domain}`
      : current.subdomain
        ? `https://${current.subdomain}`
        : current.liveUrl
  };
}
