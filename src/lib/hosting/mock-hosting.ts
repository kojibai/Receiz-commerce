import { seedCommerceState } from "@/data/seed";
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
    hosting = { ...hosting, subdomain };
    return hosting;
  },
  connectCustomDomain(domain: string) {
    hosting = {
      ...hosting,
      customDomain: { domain, status: "connected", sslStatus: "valid" }
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
