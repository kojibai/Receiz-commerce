"use client";

import { useEffect, useMemo, useState } from "react";
import { createReceizClient, type ReceizIdentityAccountProjection } from "@receiz/sdk";
import { seedCommerceState } from "@/data/seed";
import {
  normalizeCustomDomain,
  normalizeTenantSlug,
  subdomainForSlug
} from "@/lib/hosting/domain-utils";
import { BASE_STORAGE_KEY, currentHostContext, type HostContext } from "@/lib/hosting/host-context";
import type { CommerceState, CustomerAccount, ProofEvent } from "@/types/domain";
import { makeId } from "@/lib/utils";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeObject<T extends Record<string, unknown>>(base: T, value: unknown): T {
  return isRecord(value) ? ({ ...base, ...value } as T) : base;
}

function mergeArray<T>(base: T[], value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : base;
}

function safeTenantSlug(value: unknown) {
  try {
    return normalizeTenantSlug(typeof value === "string" ? value : seedCommerceState.hosting.subdomain);
  } catch {
    return seedCommerceState.hosting.tenantSlug;
  }
}

function migrateStoredState(value: unknown): CommerceState {
  if (!isRecord(value)) return seedCommerceState;

  const base = seedCommerceState;
  const stored = value as Partial<CommerceState>;
  const storedHosting = (isRecord(stored.hosting) ? stored.hosting : {}) as Partial<CommerceState["hosting"]>;
  const tenantSlug = safeTenantSlug(storedHosting.tenantSlug ?? storedHosting.subdomain);
  const subdomain =
    typeof storedHosting.subdomain === "string" && storedHosting.subdomain.includes(".")
      ? storedHosting.subdomain
      : subdomainForSlug(tenantSlug);
  const liveUrl = typeof storedHosting.liveUrl === "string" ? storedHosting.liveUrl : `https://${subdomain}`;
  const receizId = mergeObject(base.auth.receizId, isRecord(stored.auth) ? stored.auth.receizId : undefined);
  const merchantReceizId =
    typeof storedHosting.merchantReceizId === "string"
      ? storedHosting.merchantReceizId
      : receizId.handle || base.hosting.merchantReceizId;

  return {
    ...base,
    ...stored,
    brand: mergeObject(base.brand, stored.brand),
    storefront: mergeObject(base.storefront, stored.storefront),
    hosting: {
      ...base.hosting,
      ...storedHosting,
      tenantSlug,
      subdomain,
      liveUrl,
      merchantReceizId,
      settlementAccountLabel:
        typeof storedHosting.settlementAccountLabel === "string"
          ? storedHosting.settlementAccountLabel
          : base.hosting.settlementAccountLabel,
      subdomainStatus: {
        ...base.hosting.subdomainStatus,
        ...(isRecord(storedHosting.subdomainStatus) ? storedHosting.subdomainStatus : {}),
        domain: subdomain,
        liveUrl
      },
      customDomain: {
        ...base.hosting.customDomain,
        ...(isRecord(storedHosting.customDomain) ? storedHosting.customDomain : {})
      }
    },
    billing: {
      ...mergeObject(base.billing, stored.billing),
      plans: mergeArray(base.billing.plans, isRecord(stored.billing) ? stored.billing.plans : undefined),
      invoices: mergeArray(base.billing.invoices, isRecord(stored.billing) ? stored.billing.invoices : undefined)
    },
    navigation: mergeArray(base.navigation, stored.navigation),
    pages: mergeArray(base.pages, stored.pages),
    collections: mergeArray(base.collections, stored.collections),
    products: mergeArray(base.products, stored.products),
    cart: {
      ...mergeObject(base.cart, stored.cart),
      lines: mergeArray(base.cart.lines, isRecord(stored.cart) ? stored.cart.lines : undefined)
    },
    orders: mergeArray(base.orders, stored.orders),
    customers: mergeArray(base.customers, stored.customers),
    rewards: mergeArray(base.rewards, stored.rewards),
    rewardRules: mergeArray(base.rewardRules, stored.rewardRules),
    assets: mergeArray(base.assets, stored.assets),
    listings: mergeArray(base.listings, stored.listings),
    qualifiers: mergeArray(base.qualifiers, stored.qualifiers),
    campaigns: mergeArray(base.campaigns, stored.campaigns),
    game: mergeObject(base.game, stored.game),
    receiz: mergeObject(base.receiz, stored.receiz),
    checkout: mergeObject(base.checkout, stored.checkout),
    auth: {
      ...base.auth,
      ...(isRecord(stored.auth) ? stored.auth : {}),
      admin: mergeObject(base.auth.admin, isRecord(stored.auth) ? stored.auth.admin : undefined),
      customer: mergeObject(base.auth.customer, isRecord(stored.auth) ? stored.auth.customer : undefined),
      receizId
    },
    publish: {
      ...mergeObject(base.publish, stored.publish),
      checklist: mergeArray(base.publish.checklist, isRecord(stored.publish) ? stored.publish.checklist : undefined)
    },
    proofEvents: mergeArray(base.proofEvents, stored.proofEvents)
  };
}

function titleFromHost(value: string) {
  return value
    .split(".")[0]
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function applyHostContext(state: CommerceState, hostContext: HostContext): CommerceState {
  const { customDomain, host, tenantSlug } = hostContext;

  if (tenantSlug) {
    const subdomain = subdomainForSlug(tenantSlug);
    const isStoredTenant = state.hosting.subdomain === subdomain;
    return {
      ...state,
      brand: isStoredTenant
        ? state.brand
        : {
            ...state.brand,
            name: titleFromHost(tenantSlug),
            logoText: tenantSlug.replace(/[^a-z0-9]+/g, "").slice(0, 8) || state.brand.logoText
          },
      hosting: {
        ...state.hosting,
        tenantSlug,
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

  if (customDomain) {
    const isStoredDomain = state.hosting.customDomain.domain === customDomain;
    return {
      ...state,
      brand: isStoredDomain
        ? state.brand
        : {
            ...state.brand,
            name: titleFromHost(customDomain),
            logoText: customDomain.split(".")[0]?.replace(/[^a-z0-9]+/g, "").slice(0, 8) || state.brand.logoText
          },
      hosting: {
        ...state.hosting,
        liveUrl: `https://${customDomain}`,
        customDomain: {
          ...state.hosting.customDomain,
          domain: customDomain,
          liveUrl: `https://${customDomain}`,
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

function readState(hostContext: HostContext): CommerceState {
  if (typeof window === "undefined") return seedCommerceState;

  const raw = window.localStorage.getItem(hostContext.storageKey) ?? window.localStorage.getItem(BASE_STORAGE_KEY);
  if (!raw) return applyHostContext(seedCommerceState, hostContext);

  try {
    return applyHostContext(migrateStoredState(JSON.parse(raw)), hostContext);
  } catch {
    return applyHostContext(seedCommerceState, hostContext);
  }
}

function makeEvent(type: ProofEvent["type"], detail: string): ProofEvent {
  const status =
    type === "ASSET_RECEIZED"
      ? "sealed"
      : type === "DOMAIN_CONNECTED" || type === "RECEIZ_ID_CONNECTED"
        ? "linked"
        : type === "BILLING_METHOD_ADDED" || type === "HOSTING_PLAN_UPDATED" || type === "THEME_UPDATED"
          ? "success"
          : "verified";

  return {
    id: makeId("event"),
    type,
    title: type,
    detail,
    status,
    timestampLabel: "now"
  };
}

function identityArtifactKind(file: File): CommerceState["auth"]["receizId"]["artifactKind"] {
  const name = file.name.toLowerCase();

  if (name.includes("record")) return "identity_record";
  if (file.type.startsWith("image/")) return "identity_seal";
  if (name.includes("receiz-id")) return "receiz_id";

  return "receiz_key";
}

function accountHandle(projection: ReceizIdentityAccountProjection | null, fallback: string) {
  const username = projection?.owner.username?.trim();
  if (!username) return fallback;
  return username.includes(".") ? username : `${username}.receiz.id`;
}

type ReceizProfile = {
  id?: string;
  name?: string;
  email?: string;
  handle?: string;
  subdomain?: string;
  customDomain?: string;
};

type ReceizProfileResponse = {
  ok: boolean;
  connected: boolean;
  profile?: ReceizProfile;
};

function compactString(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function normalizeProfileHandle(value: string | undefined, fallback: string) {
  const handle = compactString(value, fallback).replace(/^@/, "");
  return handle.includes(".") ? handle : `${handle}.receiz.id`;
}

function ownerKeyFromProfile(profile: ReceizProfile) {
  return compactString(profile.id, compactString(profile.handle, compactString(profile.email, "receiz-account")));
}

function displayNameFromProfile(profile: ReceizProfile) {
  const fromHandle = profile.handle?.replace(/\.receiz\.id$/i, "").replace(/[._-]+/g, " ");
  return compactString(profile.name, compactString(fromHandle, "New Receiz Store"));
}

function logoTextFromProfile(profile: ReceizProfile) {
  const source = profile.handle?.replace(/\.receiz\.id$/i, "") ?? profile.name ?? "store";
  const cleaned = source.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8);
  return cleaned || "store";
}

function tenantFromProfile(profile: ReceizProfile) {
  const source = profile.subdomain ?? profile.handle?.replace(/\.receiz\.id$/i, "") ?? profile.name ?? "store";
  try {
    return normalizeTenantSlug(source);
  } catch {
    return "store";
  }
}

function customDomainFromProfile(profile: ReceizProfile) {
  if (!profile.customDomain) return "";
  try {
    return normalizeCustomDomain(profile.customDomain);
  } catch {
    return "";
  }
}

function customerFromProfile(current: CustomerAccount, profile: ReceizProfile): CustomerAccount {
  return {
    ...current,
    id: current.id || "customer-receiz-owner",
    name: displayNameFromProfile(profile),
    email: compactString(profile.email, current.email),
    tier: current.tier || "Owner"
  };
}

function createFreshMerchantWorkspace(current: CommerceState, profile: ReceizProfile): CommerceState {
  const displayName = displayNameFromProfile(profile);
  const handle = normalizeProfileHandle(profile.handle, current.auth.receizId.handle);
  const tenantSlug = tenantFromProfile(profile);
  const subdomain = subdomainForSlug(tenantSlug);
  const customDomain = customDomainFromProfile(profile);
  const customer: CustomerAccount = {
    id: current.auth.customer.id || "customer-receiz-owner",
    name: displayName,
    email: compactString(profile.email, current.auth.customer.email),
    tier: "Owner",
    rewardsValueLabel: "$0.00",
    beans: 0,
    streak: "0x",
    orderIds: [],
    rewardIds: [],
    assetIds: []
  };

  return {
    ...current,
    brand: {
      ...current.brand,
      name: displayName,
      logoText: logoTextFromProfile(profile),
      logoImageUrl: null,
      tagline: "Proof-sealed commerce by Receiz"
    },
    storefront: {
      headline: "Proof-sealed commerce",
      subheadline: "Sell products, access, benefits, and Receized assets.",
      heroBody: "Your store is ready for products, payments, rewards, and proof.",
      ctaLabel: "Shop now"
    },
    hosting: {
      ...current.hosting,
      mode: "hosted_platform",
      tenantSlug,
      subdomain,
      liveUrl: `https://${subdomain}`,
      merchantReceizId: handle,
      settlementAccountLabel: `${displayName} Receiz account`,
      published: false,
      lastPublishedAt: "Not published",
      subdomainStatus: {
        ...seedCommerceState.hosting.subdomainStatus,
        domain: subdomain,
        status: "pending",
        sslStatus: "pending",
        verified: false,
        dnsResolved: false,
        liveUrl: `https://${subdomain}`,
        message: "Choose and claim this free Receiz.app subdomain"
      },
      customDomain: {
        ...seedCommerceState.hosting.customDomain,
        domain: customDomain,
        status: customDomain ? "ready" : "pending",
        sslStatus: customDomain ? "valid" : "pending",
        verified: Boolean(customDomain),
        dnsResolved: Boolean(customDomain),
        liveUrl: customDomain ? `https://${customDomain}` : "",
        verification: undefined,
        dnsInstructions: undefined,
        message: customDomain ? "Loaded from Receiz profile" : "Connect a custom domain when ready"
      }
    },
    billing: {
      ...current.billing,
      status: "trial",
      paymentMethodLabel: "No payment method yet",
      monthlyTotalLabel: "$0 / mo",
      trialEndsAt: "Free subdomain available",
      invoices: []
    },
    navigation: seedCommerceState.navigation,
    pages: [],
    collections: [],
    products: [],
    cart: { lines: [] },
    orders: [],
    customers: [customer],
    rewards: [],
    rewardRules: [],
    assets: [],
    listings: [],
    qualifiers: [],
    campaigns: [],
    game: {
      ...current.game,
      enabled: false,
      campaignId: "",
      leaderboardEnabled: false
    },
    auth: {
      ...current.auth,
      admin: {
        ...current.auth.admin,
        name: displayName,
        email: compactString(profile.email, current.auth.admin.email)
      },
      customer
    },
    publish: {
      ...current.publish,
      checklist: current.publish.checklist.map((item) => ({
        ...item,
        complete: item.id === "receiz",
        warning: item.id === "game" ? true : item.warning
      }))
    },
    proofEvents: [makeEvent("RECEIZ_ID_CONNECTED", `${handle} workspace initialized`)]
  };
}

function applyReceizProfile(current: CommerceState, profile: ReceizProfile): CommerceState {
  const ownerKey = ownerKeyFromProfile(profile);
  const resetTemplate = current.auth.workspaceOwnerId !== ownerKey && current.hosting.published;
  const base = resetTemplate ? createFreshMerchantWorkspace(current, profile) : current;
  const handle = normalizeProfileHandle(profile.handle, base.auth.receizId.handle);
  const displayName = displayNameFromProfile(profile);
  const customer = customerFromProfile(base.auth.customer, profile);
  const tenantSlug = profile.subdomain ? tenantFromProfile(profile) : base.hosting.tenantSlug;
  const subdomain = subdomainForSlug(tenantSlug);
  const customDomain = customDomainFromProfile(profile) || base.hosting.customDomain.domain;

  return {
    ...base,
    customers: base.customers.length ? base.customers.map((item, index) => (index === 0 ? customer : item)) : [customer],
    hosting: {
      ...base.hosting,
      tenantSlug,
      subdomain,
      liveUrl: customDomain || base.hosting.liveUrl === base.hosting.customDomain.liveUrl ? `https://${customDomain || subdomain}` : base.hosting.liveUrl,
      merchantReceizId: handle,
      settlementAccountLabel: `${displayName} Receiz account`,
      subdomainStatus: {
        ...base.hosting.subdomainStatus,
        domain: subdomain,
        liveUrl: `https://${subdomain}`
      },
      customDomain: {
        ...base.hosting.customDomain,
        domain: customDomain,
        liveUrl: customDomain ? `https://${customDomain}` : base.hosting.customDomain.liveUrl,
        status: customDomain ? base.hosting.customDomain.status : "pending",
        message: customDomain ? base.hosting.customDomain.message : "Connect a custom domain when ready"
      }
    },
    auth: {
      ...base.auth,
      workspaceOwnerId: ownerKey,
      templateClearedAt: resetTemplate ? new Date().toISOString() : base.auth.templateClearedAt,
      admin: {
        ...base.auth.admin,
        name: displayName,
        email: compactString(profile.email, base.auth.admin.email)
      },
      customer,
      receizId: {
        ...base.auth.receizId,
        connected: true,
        handle,
        displayName,
        keyId: compactString(profile.id, base.auth.receizId.keyId),
        loginMode: "existing_receiz_id",
        accountImageLabel: "Receiz account image",
        statusLabel: "Receiz ID connected"
      }
    }
  };
}

function applyReceizDisconnected(current: CommerceState): CommerceState {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "receiz_id") return current;

  return {
    ...current,
    auth: {
      ...current.auth,
      receizId: {
        ...current.auth.receizId,
        connected: false,
        statusLabel: "Connect Receiz ID"
      }
    }
  };
}

async function fetchReceizProfile(): Promise<ReceizProfileResponse | null> {
  const response = await fetch("/api/auth/receiz/me", {
    headers: { accept: "application/json" }
  });

  if (!response.ok) return null;
  return (await response.json()) as ReceizProfileResponse;
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));

  if (response.status === 401 && typeof payload.connectUrl === "string") {
    window.location.assign(payload.connectUrl);
    throw new Error("Receiz login required");
  }

  if (!response.ok || payload.ok === false) {
    throw new Error(String(payload.message ?? payload.error ?? "Request failed"));
  }

  return payload as T;
}

function priceFromLabel(label: string) {
  const match = label.match(/[0-9]+(?:\.[0-9]+)?/);
  return match ? Number(match[0]) : 0;
}

function cartAmountUsd(state: CommerceState) {
  const total = state.cart.lines.reduce((sum, line) => {
    const product = state.products.find((item) => item.id === line.productId);
    return sum + priceFromLabel(product?.priceLabel ?? "0") * line.quantity;
  }, 0);

  if (total > 0) return total.toFixed(2);

  const firstProduct = state.products.find((product) => product.status === "active");
  return Math.max(1, priceFromLabel(firstProduct?.priceLabel ?? "18")).toFixed(2);
}

export function useTemplateStore() {
  const [state, setState] = useState<CommerceState>(seedCommerceState);
  const [hydrated, setHydrated] = useState(false);
  const [hostContext, setHostContext] = useState<HostContext>(() => currentHostContext());

  useEffect(() => {
    const context = currentHostContext();
    setHostContext(context);
    setState(readState(context));
    setHydrated(true);

    if (process.env.NEXT_PUBLIC_AUTH_MODE === "receiz_id") {
      void fetchReceizProfile()
        .then((result) => {
          if (!result) return;
          setState((current) =>
            result.connected && result.profile
              ? applyReceizProfile(current, result.profile)
              : applyReceizDisconnected(current)
          );
        })
        .catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(hostContext.storageKey, JSON.stringify(state));
    }
  }, [hostContext.storageKey, hydrated, state]);

  const actions = useMemo(
    () => ({
      reset() {
        setState(seedCommerceState);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(currentHostContext().storageKey);
          window.localStorage.removeItem(BASE_STORAGE_KEY);
        }
      },
      updateBrand(input: Partial<CommerceState["brand"]>) {
        setState((current) => ({
          ...current,
          brand: { ...current.brand, ...input }
        }));
      },
      saveTheme() {
        setState((current) => ({
          ...current,
          proofEvents: [makeEvent("THEME_UPDATED", `${current.brand.name} theme saved`), ...current.proofEvents]
        }));
      },
      updateStorefront(input: Partial<CommerceState["storefront"]>) {
        setState((current) => ({
          ...current,
          storefront: { ...current.storefront, ...input }
        }));
      },
      toggleGame() {
        setState((current) => ({
          ...current,
          game: { ...current.game, enabled: !current.game.enabled }
        }));
      },
      setCheckoutMode(mode: CommerceState["checkout"]["mode"]) {
        setState((current) => ({
          ...current,
          checkout: {
            mode,
            label:
              mode === "mock"
                ? "Receiz sandbox"
                : mode === "live"
                  ? "Receiz checkout"
                  : "Receiz delegated checkout"
          }
        }));
      },
      async claimSubdomain(subdomain: string) {
        let tenantSlug = "";
        let domain = "";

        try {
          tenantSlug = normalizeTenantSlug(subdomain);
          domain = subdomainForSlug(tenantSlug);
        } catch (error) {
          setState((current) => ({
            ...current,
            proofEvents: [makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Invalid subdomain"), ...current.proofEvents]
          }));
          return;
        }

        setState((current) => ({
          ...current,
          hosting: {
            ...current.hosting,
            tenantSlug,
            subdomain: domain,
            liveUrl: `https://${domain}`,
            subdomainStatus: {
              ...current.hosting.subdomainStatus,
              domain,
              status: "pending",
              sslStatus: "pending",
              verified: false,
              liveUrl: `https://${domain}`,
              message: "Checking hosted subdomain"
            }
          },
          proofEvents: [makeEvent("DOMAIN_CONNECTED", `${domain} requested`), ...current.proofEvents]
        }));

        try {
          const result = await postJson<{ hosting: CommerceState["hosting"] }>("/api/hosting", {
            action: "subdomain",
            subdomain: domain
          });
          setState((current) => ({
            ...current,
            hosting: result.hosting,
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", `${result.hosting.subdomainStatus.message ?? result.hosting.subdomain} · ${result.hosting.subdomainStatus.status}`),
              ...current.proofEvents
            ]
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            hosting: {
              ...current.hosting,
              subdomainStatus: {
                ...current.hosting.subdomainStatus,
                status: "error",
                sslStatus: "unknown",
                message: error instanceof Error ? error.message : "Subdomain claim failed"
              }
            },
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Subdomain claim failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      async connectCustomDomain(domain: string) {
        let normalizedDomain = "";

        try {
          normalizedDomain = normalizeCustomDomain(domain);
        } catch (error) {
          setState((current) => ({
            ...current,
            proofEvents: [makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Invalid custom domain"), ...current.proofEvents]
          }));
          return;
        }

        setState((current) => ({
          ...current,
          hosting: {
            ...current.hosting,
            customDomain: {
              ...current.hosting.customDomain,
              domain: normalizedDomain,
              status: "pending",
              sslStatus: "pending",
              verified: false,
              liveUrl: `https://${normalizedDomain}`,
              message: "Adding domain to Vercel"
            }
          },
          proofEvents: [makeEvent("DOMAIN_CONNECTED", `${normalizedDomain} requested`), ...current.proofEvents]
        }));

        try {
          const result = await postJson<{ hosting: CommerceState["hosting"] }>("/api/hosting", {
            action: "custom_domain",
            domain: normalizedDomain
          });
          setState((current) => ({
            ...current,
            hosting: result.hosting,
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", `${result.hosting.customDomain.message ?? normalizedDomain} · ${result.hosting.customDomain.status}`),
              ...current.proofEvents
            ]
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            hosting: {
              ...current.hosting,
              customDomain: {
                ...current.hosting.customDomain,
                status: "error",
                sslStatus: "unknown",
                message: error instanceof Error ? error.message : "Custom domain failed"
              }
            },
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Custom domain failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      async verifyCustomDomain(domain: string) {
        let normalizedDomain = "";

        try {
          normalizedDomain = normalizeCustomDomain(domain);
        } catch (error) {
          setState((current) => ({
            ...current,
            proofEvents: [makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Invalid custom domain"), ...current.proofEvents]
          }));
          return;
        }

        try {
          const result = await postJson<{ hosting: CommerceState["hosting"] }>("/api/hosting", {
            action: "verify_domain",
            domain: normalizedDomain
          });
          setState((current) => ({
            ...current,
            hosting: result.hosting,
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", `${result.hosting.customDomain.message ?? normalizedDomain} · ${result.hosting.customDomain.status}`),
              ...current.proofEvents
            ]
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Domain verification failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      async selectHostingPlan(plan: CommerceState["hosting"]["plan"]) {
        setState((current) => {
          const selected = current.billing.plans.find((item) => item.id === plan);
          return {
            ...current,
            hosting: { ...current.hosting, plan },
            billing: {
              ...current.billing,
              monthlyTotalLabel: selected?.priceLabel ?? current.billing.monthlyTotalLabel
            },
            proofEvents: [
              makeEvent("HOSTING_PLAN_UPDATED", `${selected?.name ?? plan} hosting plan selected`),
              ...current.proofEvents
            ]
          };
        });

        try {
          const result = await postJson<{
            hosting: CommerceState["hosting"];
            billing: CommerceState["billing"];
          }>("/api/hosting", {
            action: "plan",
            plan
          });
          setState((current) => ({
            ...current,
            hosting: result.hosting,
            billing: result.billing,
            proofEvents: [makeEvent("HOSTING_PLAN_UPDATED", `${plan} plan synced with Receiz billing`), ...current.proofEvents]
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            proofEvents: [
              makeEvent("HOSTING_PLAN_UPDATED", error instanceof Error ? error.message : "Hosting plan sync failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      async addBillingMethod(label: string) {
        setState((current) => ({
          ...current,
          billing: {
            ...current.billing,
            status: "active",
            paymentMethodLabel: label,
            trialEndsAt: "Active subscription"
          },
          proofEvents: [makeEvent("BILLING_METHOD_ADDED", `${label} added for hosting`), ...current.proofEvents]
        }));

        try {
          const result = await postJson<{ billing: CommerceState["billing"] }>("/api/hosting", {
            action: "payment",
            paymentMethodLabel: label
          });
          setState((current) => ({
            ...current,
            billing: result.billing,
            proofEvents: [makeEvent("BILLING_METHOD_ADDED", "Receiz account billing synced"), ...current.proofEvents]
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            proofEvents: [
              makeEvent("BILLING_METHOD_ADDED", error instanceof Error ? error.message : "Billing sync failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      signInWithReceizId() {
        if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_AUTH_MODE === "receiz_id") {
          const returnTo = `${window.location.pathname}${window.location.search}`;
          window.location.assign(`/api/auth/receiz/start?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }

        setState((current) => ({
          ...current,
          auth: {
            ...current.auth,
            receizId: {
              ...current.auth.receizId,
              connected: true,
              loginMode: "existing_receiz_id",
              statusLabel: "Signed in with existing Receiz ID"
            }
          },
          proofEvents: [
            makeEvent("RECEIZ_ID_CONNECTED", `${current.auth.receizId.handle} signed in`),
            ...current.proofEvents
          ]
        }));
      },
      createReceizId() {
        setState((current) => {
          const handle = `${current.brand.logoText.toLowerCase().replace(/[^a-z0-9]+/g, "") || "brand"}.receiz.id`;
          return {
            ...current,
            auth: {
              ...current.auth,
              receizId: {
                ...current.auth.receizId,
                connected: true,
                handle,
                displayName: current.brand.name,
                loginMode: "new_receiz_id",
                statusLabel: "New Receiz ID created"
              }
            },
            proofEvents: [
              makeEvent("RECEIZ_ID_CONNECTED", `${handle} created`),
              ...current.proofEvents
            ]
          };
        });
      },
      async restoreReceizIdentityArtifact(file: File) {
        const client = createReceizClient();
        let projection: ReceizIdentityAccountProjection | null = null;
        let failed = false;

        try {
          const keyFile = await client.identity.readArtifact(file);
          projection = await client.identity.projectAccount(keyFile);
        } catch {
          failed = true;
        }

        setState((current) => {
          const artifactKind = identityArtifactKind(file);
          const handle = accountHandle(projection, current.auth.receizId.handle);
          const displayName = projection?.owner.displayName ?? current.auth.receizId.displayName;
          const localProofVerified = Boolean(projection?.portableStateVerified);
          const portableStateStatus = projection?.portableStateStatus ?? (failed ? "invalid" : "missing");
          const artifactStatus = localProofVerified ? "verified" : failed ? "pending" : "restored";
          const statusLabel = localProofVerified
            ? "Identity artifact locally verified"
            : failed
              ? "Identity artifact needs a valid Receiz proof"
              : "Identity artifact restored";

          return {
            ...current,
            auth: {
              ...current.auth,
              receizId: {
                ...current.auth.receizId,
                connected: !failed,
                handle,
                displayName,
                keyId: projection?.keyId ?? current.auth.receizId.keyId,
                loginMode: "restored_identity_artifact",
                accountImageLabel: file.name,
                artifactKind,
                artifactStatus,
                portableStateStatus,
                localProofVerified,
                statusLabel
              }
            },
            proofEvents: [
              makeEvent(
                "RECEIZ_ID_CONNECTED",
                failed
                  ? `${file.name} could not be restored`
                  : `${handle} restored from ${artifactKind.replace(/_/g, " ")}`
              ),
              ...current.proofEvents
            ]
          };
        });
      },
      publish() {
        setState((current) => {
          const next = {
            ...current,
            hosting: { ...current.hosting, published: true, lastPublishedAt: "now" },
            proofEvents: [makeEvent("SITE_PUBLISHED", `${current.hosting.subdomain} published`), ...current.proofEvents]
          };

          void postJson<{ hosting: CommerceState["hosting"] }>("/api/hosting", {
            action: "publish",
            state: {
              brand: next.brand,
              storefront: next.storefront,
              hosting: next.hosting,
              products: next.products,
              rewards: next.rewards,
              rewardRules: next.rewardRules,
              campaigns: next.campaigns,
              game: next.game,
              checkout: next.checkout
            }
          })
            .then((result) => {
              setState((latest) => ({
                ...latest,
                hosting: result.hosting,
                proofEvents: [makeEvent("SITE_PUBLISHED", "Store published to Receiz proof rails"), ...latest.proofEvents]
              }));
            })
            .catch((error) => {
              setState((latest) => ({
                ...latest,
                proofEvents: [
                  makeEvent("SITE_PUBLISHED", error instanceof Error ? error.message : "Publish sync failed"),
                  ...latest.proofEvents
                ]
              }));
            });

          return next;
        });
      },
      addToCart(productId: string) {
        setState((current) => {
          const existing = current.cart.lines.find((line) => line.productId === productId);
          return {
            ...current,
            cart: {
              lines: existing
                ? current.cart.lines.map((line) =>
                    line.productId === productId
                      ? { ...line, quantity: line.quantity + 1 }
                      : line
                  )
                : [...current.cart.lines, { productId, quantity: 1 }]
            }
          };
        });
      },
      completeMockCheckout() {
        setState((current) => {
          const order = {
            id: `${Math.floor(10000 + Math.random() * 89999)}`,
            customerId: current.auth.customer.id,
            totalLabel: "$18.00",
            status: "mock_paid" as const,
            itemCount: Math.max(1, current.cart.lines.length),
            sealed: true,
            createdAt: new Date().toISOString()
          };

          return {
            ...current,
            cart: { lines: [] },
            orders: [order, ...current.orders],
            proofEvents: [makeEvent("ORDER_VERIFIED", `Order #${order.id} sealed`), ...current.proofEvents]
          };
        });
      },
      startCheckout() {
        setState((current) => {
          const checkoutMode = process.env.NEXT_PUBLIC_CHECKOUT_MODE ?? current.checkout.mode;

          if (checkoutMode === "mock") {
            const order = {
              id: `${Math.floor(10000 + Math.random() * 89999)}`,
              customerId: current.auth.customer.id,
              totalLabel: `$${cartAmountUsd(current)}`,
              status: "mock_paid" as const,
              itemCount: Math.max(1, current.cart.lines.length),
              sealed: true,
              createdAt: new Date().toISOString()
            };

            return {
              ...current,
              cart: { lines: [] },
              orders: [order, ...current.orders],
              proofEvents: [makeEvent("ORDER_VERIFIED", `Order #${order.id} sealed`), ...current.proofEvents]
            };
          }

          void postJson<{
            session?: {
              checkoutUrl?: string;
              checkoutSessionId?: string;
              clientSecret?: string;
            };
          }>("/api/checkout", {
            amountUsd: cartAmountUsd(current),
            totalLabel: `$${cartAmountUsd(current)}`,
            itemCount: Math.max(1, current.cart.lines.length),
            customerId: current.auth.customer.id,
            customerEmail: current.auth.customer.email,
            referenceId: `order-${Date.now()}`,
            description: `${current.brand.name} proof-sealed order`,
            tenantSlug: current.hosting.tenantSlug,
            tenantHost: current.hosting.subdomain,
            merchantReceizId: current.hosting.merchantReceizId,
            successUrl: `${window.location.origin}/?checkout=success`,
            cancelUrl: `${window.location.origin}/?checkout=cancel`
          })
            .then((result) => {
              if (result.session?.checkoutUrl) {
                window.location.assign(result.session.checkoutUrl);
                return;
              }

              setState((latest) => ({
                ...latest,
                proofEvents: [
                  makeEvent("ORDER_VERIFIED", `Receiz checkout ${result.session?.checkoutSessionId ?? "session"} ready`),
                  ...latest.proofEvents
                ]
              }));
            })
            .catch((error) => {
              setState((latest) => ({
                ...latest,
                proofEvents: [
                  makeEvent("ORDER_VERIFIED", error instanceof Error ? error.message : "Receiz checkout failed"),
                  ...latest.proofEvents
                ]
              }));
            });

          return current;
        });
      },
      appendProofEvent(type: ProofEvent["type"], detail: string) {
        setState((current) => ({
          ...current,
          proofEvents: [makeEvent(type, detail), ...current.proofEvents]
        }));
      },
      sealAsset(assetId: string) {
        setState((current) => ({
          ...current,
          assets: current.assets.map((asset) =>
            asset.id === assetId ? { ...asset, status: "listed" } : asset
          ),
          proofEvents: [makeEvent("ASSET_RECEIZED", `${assetId} sealed`), ...current.proofEvents]
        }));
      }
    }),
    []
  );

  return { state, actions, hydrated, hostContext };
}
