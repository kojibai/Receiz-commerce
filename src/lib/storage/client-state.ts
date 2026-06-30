import {
  normalizeTenantSlug,
  subdomainForSlug
} from "../hosting/domain-utils";
import type { HostContext } from "../hosting/host-context";
import { tenantFallbackState } from "../hosting/tenant-state";
import type { CommerceState, StorefrontHomepageMode } from "../../types/domain";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeObject<T extends Record<string, unknown>>(base: T, value: unknown): T {
  return isRecord(value) ? ({ ...base, ...value } as T) : base;
}

function mergeArray<T>(base: T[], value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : base;
}

function safeTenantSlug(value: unknown, base: CommerceState) {
  try {
    return normalizeTenantSlug(typeof value === "string" ? value : base.hosting.subdomain);
  } catch {
    return base.hosting.tenantSlug;
  }
}

function isHomepageMode(value: unknown): value is StorefrontHomepageMode {
  return value === "store" || value === "blog" || value === "game";
}

function migrateStoredState(value: unknown, base: CommerceState): CommerceState {
  if (!isRecord(value)) return base;

  const stored = value as Partial<CommerceState>;
  const storedHosting = (isRecord(stored.hosting) ? stored.hosting : {}) as Partial<CommerceState["hosting"]>;
  const tenantSlug = safeTenantSlug(storedHosting.tenantSlug ?? storedHosting.subdomain, base);
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
  const storefront = mergeObject(base.storefront, stored.storefront);

  return {
    ...base,
    ...stored,
    brand: mergeObject(base.brand, stored.brand),
    storefront: {
      ...storefront,
      homepageMode: isHomepageMode(storefront.homepageMode) ? storefront.homepageMode : base.storefront.homepageMode
    },
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
    blogPosts: mergeArray(base.blogPosts, stored.blogPosts),
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

function applyHostContext(state: CommerceState, hostContext: HostContext): CommerceState {
  return tenantFallbackState(state, hostContext);
}

export type ClientStorageSnapshot = {
  scoped: string | null;
  base?: string | null;
};

export function selectClientInitialState(
  hostContext: HostContext,
  fallbackState: CommerceState,
  storage: ClientStorageSnapshot = { scoped: null, base: null }
): CommerceState {
  if (hostContext.surface === "tenant") {
    return fallbackState;
  }

  const raw = storage.scoped ?? storage.base ?? null;
  if (!raw) return applyHostContext(fallbackState, hostContext);

  try {
    return applyHostContext(migrateStoredState(JSON.parse(raw), fallbackState), hostContext);
  } catch {
    return applyHostContext(fallbackState, hostContext);
  }
}
