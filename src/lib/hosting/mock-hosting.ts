import { seedCommerceState } from "@/data/seed";
import { normalizeCustomDomain, normalizeTenantSlug, subdomainForSlug } from "@/lib/hosting/domain-utils";
import type { HostingMode } from "@/types/domain";

let hosting = seedCommerceState.hosting;
let billing = seedCommerceState.billing;

export const mockHosting = {
  getHostingStatus() {
    return hosting;
  },
  getBillingStatus() {
    return billing;
  },
  claimSubdomain(subdomain: string) {
    const tenantSlug = normalizeTenantSlug(subdomain);
    const domain = subdomainForSlug(tenantSlug);
    hosting = {
      ...hosting,
      tenantSlug,
      subdomain: domain,
      liveUrl: `https://${domain}`,
      subdomainStatus: {
        domain,
        status: "active",
        sslStatus: "mock",
        verified: true,
        liveUrl: `https://${domain}`,
        message: "Mock subdomain claimed"
      }
    };
    return hosting;
  },
  connectCustomDomain(domain: string) {
    const normalizedDomain = normalizeCustomDomain(domain);
    hosting = {
      ...hosting,
      customDomain: {
        domain: normalizedDomain,
        status: "connected",
        sslStatus: "valid",
        verified: true,
        liveUrl: `https://${normalizedDomain}`,
        message: "Mock custom domain connected"
      }
    };
    return hosting;
  },
  verifyDomain(domain: string) {
    return { domain, verified: true, sslStatus: "valid" };
  },
  setHostingMode(mode: HostingMode) {
    hosting = { ...hosting, mode };
    return hosting;
  },
  selectHostingPlan(plan: typeof hosting.plan) {
    const selected = billing.plans.find((item) => item.id === plan);
    hosting = { ...hosting, plan };
    billing = {
      ...billing,
      monthlyTotalLabel: selected?.priceLabel ?? billing.monthlyTotalLabel
    };
    return { hosting, billing };
  },
  addBillingMethod(label: string) {
    billing = {
      ...billing,
      status: "active",
      paymentMethodLabel: label,
      trialEndsAt: "Active subscription"
    };
    return billing;
  },
  getPublishChecklist() {
    return seedCommerceState.publish.checklist;
  }
};
