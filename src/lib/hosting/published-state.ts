import type { CommerceState, HostingConfig } from "../../types/domain";
import { normalizeCustomDomain, normalizeTenantSlug, subdomainForSlug } from "./domain-utils";

export type PublishOwner = {
  customDomain?: string;
  displayName?: string;
  merchantReceizId?: string;
  tenantSlug?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeReceizHandle(value: string | undefined) {
  const handle = value?.trim().replace(/^@/, "");
  if (!handle) return "";
  return handle.includes(".") ? handle : `${handle}.receiz.id`;
}

function tenantSlugFromOwner(owner: PublishOwner, fallback: string) {
  const source = owner.tenantSlug || owner.merchantReceizId?.replace(/\.receiz\.id$/i, "") || owner.displayName || fallback;

  try {
    return normalizeTenantSlug(source);
  } catch {
    return fallback;
  }
}

function customDomainFromOwner(owner: PublishOwner) {
  if (!owner.customDomain) return "";
  if (isTemplateCustomDomain(owner.customDomain)) return "";

  try {
    return normalizeCustomDomain(owner.customDomain);
  } catch {
    return "";
  }
}

function isTemplateCustomDomain(value: string | undefined) {
  const domain = value?.trim().toLowerCase() ?? "";
  return domain === "www.boostcoffee.com" || domain === "boostcoffee.com";
}

function stripTemplatePublishedContent(state: CommerceState): CommerceState {
  if (state.hosting.merchantReceizId === "boost.receiz.id") return state;

  return {
    ...state,
    blogPosts: state.blogPosts.filter((post) => post.id !== "blog-origin-roast" && post.id !== "blog-rewards-guide")
  };
}

function mergeHostingForPublish(base: HostingConfig, input: unknown, owner: PublishOwner = {}): HostingConfig {
  const hosting = (isRecord(input) ? input : {}) as Partial<HostingConfig>;
  const merged = {
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
  const ownerHandle = normalizeReceizHandle(owner.merchantReceizId);

  if (!ownerHandle) return merged;

  const existingHandle = normalizeReceizHandle(merged.merchantReceizId);
  const ownerChanged = existingHandle !== ownerHandle;
  const tenantSlug = ownerChanged ? tenantSlugFromOwner(owner, merged.tenantSlug || "store") : merged.tenantSlug;
  const subdomain = ownerChanged ? subdomainForSlug(tenantSlug) : merged.subdomain;
  const ownerCustomDomain = customDomainFromOwner(owner);
  const shouldResetTemplateDomain = isTemplateCustomDomain(merged.customDomain.domain);
  const customDomain = ownerCustomDomain
    ? {
        ...merged.customDomain,
        domain: ownerCustomDomain,
        liveUrl: `https://${ownerCustomDomain}`,
        status: merged.customDomain.status === "pending" ? "ready" : merged.customDomain.status,
        message: merged.customDomain.message || "Loaded from Receiz profile"
      }
    : shouldResetTemplateDomain
      ? {
          ...base.customDomain,
          domain: "",
          liveUrl: "",
          status: "pending" as const,
          sslStatus: "pending" as const,
          verified: false,
          dnsResolved: false,
          message: "Connect a custom domain when ready"
        }
      : merged.customDomain;

  return {
    ...merged,
    mode: "hosted_platform",
    tenantSlug,
    subdomain,
    liveUrl: customDomain.domain ? `https://${customDomain.domain}` : `https://${subdomain}`,
    merchantReceizId: ownerHandle,
    settlementAccountLabel: `${owner.displayName || ownerHandle} Receiz account`,
    subdomainStatus: {
      ...merged.subdomainStatus,
      domain: subdomain,
      liveUrl: `https://${subdomain}`
    },
    customDomain,
    published: true,
    lastPublishedAt: "now"
  };
}

export function buildPublishedCommerceState(base: CommerceState, input: unknown, owner: PublishOwner = {}): CommerceState {
  const state = (isRecord(input) ? input : {}) as Partial<CommerceState>;

  return stripTemplatePublishedContent({
    ...base,
    ...state,
    hosting: mergeHostingForPublish(base.hosting, state.hosting, owner)
  });
}
