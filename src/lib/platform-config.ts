export type PlatformConfigurationInput = Readonly<{
  name?: string;
  domain?: string;
  defaultSubdomain?: string;
}>;

function domainName(value: string) {
  const normalized = value.trim().toLowerCase();
  const labels = normalized.split(".");
  if (normalized.length > 253 || labels.length < 2 || labels.some(label =>
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    throw new Error("platform_domain_invalid");
  }
  return normalized;
}

/** Public deployment branding and routing only; this never grants authority. */
export function resolvePlatformConfiguration(input: PlatformConfigurationInput = {}) {
  const name = input.name?.trim() || "Receiz.app";
  if (name.length > 80) throw new Error("platform_name_invalid");
  const domain = domainName(input.domain?.trim() || "receiz.app");
  const defaultSubdomain = domainName(input.defaultSubdomain?.trim() || `boost.${domain}`);
  const slug = defaultSubdomain.endsWith(`.${domain}`) ? defaultSubdomain.slice(0, -domain.length - 1) : "";
  if (!slug || slug.includes(".")) throw new Error("platform_default_subdomain_mismatch");
  return Object.freeze({ name, productName: `${name} Commerce Cloud`, domain, defaultSubdomain,
    freeSubdomainLabel: `Free ${name} subdomain` });
}
