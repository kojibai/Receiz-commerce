import type { CommerceState, CustomerAccount, ReceizIdState } from "@/types/domain";
import type { BrowserReceizIdSession } from "@/lib/storefront/tenant-customer-session";

export type LocalReceizIdentitySessionInput = {
  accountImageLabel?: string;
  artifactKind?: ReceizIdState["artifactKind"];
  artifactStatus?: ReceizIdState["artifactStatus"];
  displayName: string;
  email?: string;
  handle: string;
  keyId?: string;
  localProofVerified?: boolean;
  loginMode: ReceizIdState["loginMode"];
  portableStateStatus?: ReceizIdState["portableStateStatus"];
  statusLabel: string;
};

function upsertCustomer(customers: CustomerAccount[], customer: CustomerAccount) {
  if (!customers.some((item) => item.id === customer.id || item.receizHandle === customer.receizHandle)) {
    return [customer, ...customers];
  }

  return customers.map((item) =>
    item.id === customer.id || item.receizHandle === customer.receizHandle
      ? { ...item, ...customer }
      : item
  );
}

function ownerSlugFromHandle(handle: string, fallback: string) {
  const source = handle.replace(/\.receiz\.id$/i, "") || fallback || "store";
  const slug = source
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .split(".")[0]
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return slug.length >= 3 ? slug : "store";
}

function logoTextFromSlug(slug: string) {
  return slug.replace(/[^a-z0-9]+/g, "").slice(0, 8) || "store";
}

function platformMerchantWorkspace(
  current: CommerceState,
  input: LocalReceizIdentitySessionInput,
  receizId: ReceizIdState
): CommerceState {
  const displayName = input.displayName || "New Receiz Store";
  const tenantSlug = ownerSlugFromHandle(input.handle, displayName);
  const subdomain = `${tenantSlug}.receiz.app`;
  const customer: CustomerAccount = {
    id: current.auth.customer.id || "customer-receiz-owner",
    name: displayName,
    email: input.email || current.auth.customer.email || `${tenantSlug}@receiz.local`,
    tier: "Owner",
    rewardsValueLabel: "$0.00",
    beans: 0,
    streak: "0x",
    orderIds: [],
    rewardIds: [],
    assetIds: [],
    receizHandle: input.handle
  };

  return {
    ...current,
    brand: {
      ...current.brand,
      name: displayName,
      logoText: logoTextFromSlug(tenantSlug),
      logoImageUrl: null,
      tagline: "Proof-sealed commerce by Receiz"
    },
    storefront: {
      homepageMode: "store",
      headline: "",
      subheadline: "",
      heroBody: "",
      ctaLabel: "Shop now"
    },
    hosting: {
      ...current.hosting,
      mode: "hosted_platform",
      tenantSlug,
      subdomain,
      liveUrl: `https://${subdomain}`,
      merchantReceizId: input.handle,
      settlementAccountLabel: `${displayName} Receiz account`,
      plan: "starter",
      published: false,
      lastPublishedAt: "Not published",
      subdomainStatus: {
        ...current.hosting.subdomainStatus,
        domain: subdomain,
        status: "pending",
        sslStatus: "pending",
        verified: false,
        dnsResolved: false,
        liveUrl: `https://${subdomain}`,
        message: "Free Receiz.app subdomain ready to claim"
      },
      customDomain: {
        ...current.hosting.customDomain,
        domain: "",
        status: "pending",
        sslStatus: "pending",
        verified: false,
        dnsResolved: false,
        liveUrl: "",
        verification: undefined,
        dnsRecords: undefined,
        dnsInstructions: undefined,
        message: "Connect a custom domain when ready"
      }
    },
    billing: {
      ...current.billing,
      status: "trial",
      paymentMethodLabel: "No payment method yet",
      monthlyTotalLabel: "$0 / mo",
      trialEndsAt: "Free starter hosting",
      invoices: []
    },
    navigation: [],
    pages: [],
    blogPosts: [],
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
    exchange: {
      ...current.exchange,
      selectedAssetId: "",
      proofMemoryHead: {
        afterEntryId: null,
        afterKaiUpulse: null,
        afterCreatedAt: null
      },
      assets: []
    },
    game: {
      ...current.game,
      enabled: false,
      campaignId: "",
      leaderboardEnabled: false
    },
    auth: {
      ...current.auth,
      workspaceOwnerId: input.handle,
      templateClearedAt: new Date().toISOString(),
      signedInAs: "admin",
      admin: {
        ...current.auth.admin,
        name: displayName,
        email: input.email || current.auth.admin.email
      },
      customer,
      receizId
    },
    proofEvents: [
      {
        id: `event-${tenantSlug}-workspace`,
        type: "RECEIZ_ID_CONNECTED",
        title: "RECEIZ_ID_CONNECTED",
        detail: `${input.handle} workspace initialized`,
        status: "linked",
        timestampLabel: "now",
        createdAt: new Date().toISOString()
      }
    ]
  };
}

function browserSessionIdentityInput(session: BrowserReceizIdSession): LocalReceizIdentitySessionInput {
  return {
    accountImageLabel: session.receizId.accountImageLabel,
    artifactKind: session.receizId.artifactKind,
    artifactStatus: session.receizId.artifactStatus,
    displayName: session.receizId.displayName,
    email: session.customer.email,
    handle: session.receizId.handle,
    keyId: session.receizId.keyId,
    localProofVerified: session.receizId.localProofVerified,
    loginMode: session.receizId.loginMode,
    portableStateStatus: session.receizId.portableStateStatus,
    statusLabel: session.receizId.statusLabel
  };
}

function isDemoPlatformWorkspace(current: CommerceState) {
  return (
    !current.auth.receizId.connected &&
    !current.auth.workspaceOwnerId &&
    current.hosting.tenantSlug === "boost" &&
    current.hosting.merchantReceizId === "boost.receiz.id"
  );
}

export function applyPlatformBrowserReceizIdSession(
  current: CommerceState,
  session: BrowserReceizIdSession | null
): CommerceState {
  if (!session) return current;
  if (current.auth.receizId.connected || current.auth.workspaceOwnerId) return current;
  if (!isDemoPlatformWorkspace(current)) return current;

  return applyLocalReceizIdentitySession(current, browserSessionIdentityInput(session), false);
}

export function applyLocalReceizIdentitySession(
  current: CommerceState,
  input: LocalReceizIdentitySessionInput,
  tenantSurface: boolean
): CommerceState {
  const receizId = {
    ...current.auth.receizId,
    connected: true,
    handle: input.handle,
    displayName: input.displayName,
    keyId: input.keyId ?? current.auth.receizId.keyId,
    loginMode: input.loginMode,
    accountImageLabel: input.accountImageLabel ?? current.auth.receizId.accountImageLabel,
    artifactKind: input.artifactKind ?? current.auth.receizId.artifactKind,
    artifactStatus: input.artifactStatus ?? current.auth.receizId.artifactStatus,
    portableStateStatus: input.portableStateStatus ?? current.auth.receizId.portableStateStatus,
    localProofVerified: input.localProofVerified ?? current.auth.receizId.localProofVerified,
    statusLabel: input.statusLabel
  };

  if (!tenantSurface) {
    return platformMerchantWorkspace(current, input, receizId);
  }

  const customerId = `customer-${input.handle.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "receiz-id"}`;
  const customer: CustomerAccount = {
    ...(tenantSurface
      ? {
          rewardsValueLabel: "$0.00",
          beans: 0,
          streak: "0x",
          orderIds: [],
          rewardIds: [],
          assetIds: []
        }
      : current.auth.customer),
    id: tenantSurface ? customerId : current.auth.customer.id || customerId,
    name: input.displayName || current.auth.customer.name || "Receiz customer",
    email: input.email || current.auth.customer.email || `${input.handle.replace(/\.receiz\.id$/i, "")}@receiz.local`,
    receizHandle: input.handle,
    tier: tenantSurface ? "Member" : current.auth.customer.tier || "Member"
  };

  return {
    ...current,
    customers: tenantSurface ? upsertCustomer(current.customers, customer) : current.customers,
    auth: {
      ...current.auth,
      signedInAs: tenantSurface ? "customer" : current.auth.signedInAs,
      customer: tenantSurface ? customer : current.auth.customer,
      receizId
    }
  };
}
