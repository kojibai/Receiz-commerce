import type { CommerceState } from "../../src/types/domain.js";

export function baseState(): CommerceState {
  return {
    brand: {
      name: "Boost Coffee",
      logoText: "boost",
      logoImageUrl: null,
      tagline: "Proof sealed",
      primaryColor: "#ff486e",
      secondaryColor: "#00a88a",
      accentColor: "#ffbd00",
      neutralColor: "#1f2937",
      backgroundColor: "#ffffff",
      fontFamily: "Inter",
      cornerRadius: "balanced",
      buttonStyle: "filled"
    },
    storefront: {
      homepageMode: "store",
      headline: "Proof commerce",
      subheadline: "Sell sealed objects",
      heroBody: "Built on Receiz",
      ctaLabel: "Shop"
    },
    hosting: {
      mode: "hosted_platform",
      tenantSlug: "boost",
      subdomain: "boost.receiz.app",
      subdomainStatus: {
        domain: "boost.receiz.app",
        status: "active",
        sslStatus: "valid",
        verified: true
      },
      customDomain: {
        domain: "",
        status: "pending",
        sslStatus: "pending"
      },
      liveUrl: "https://boost.receiz.app",
      merchantReceizId: "boost.receiz.id",
      settlementAccountLabel: "Boost Receiz account",
      plan: "pro",
      published: true,
      lastPublishedAt: "now"
    },
    billing: {
      status: "active",
      paymentMethodLabel: "Receiz account billing",
      monthlyTotalLabel: "$49 / mo",
      trialEndsAt: "Active",
      invoices: [],
      plans: []
    },
    navigation: [{ id: "shop", label: "Shop", href: "/", visible: true }],
    pages: [
      {
        id: "home",
        title: "Home",
        slug: "/",
        visibleInNav: true,
        published: true,
        sections: []
      }
    ],
    blogPosts: [],
    collections: [],
    products: [
      {
        id: "coffee-pack",
        name: "Coffee Pack",
        subtitle: "Whole bean",
        type: "physical",
        priceLabel: "$18.00",
        status: "active",
        inventoryLabel: "10",
        rewardEligible: true,
        sealed: true,
        imageTone: "bag"
      }
    ],
    cart: { lines: [] },
    orders: [],
    customers: [],
    rewards: [],
    rewardRules: [],
    assets: [],
    listings: [],
    qualifiers: [],
    campaigns: [],
    game: {
      enabled: false,
      campaignId: "",
      dailyLimit: "1",
      leaderboardEnabled: false
    },
    receiz: {
      connected: true,
      mode: "live",
      statusLabel: "Receiz connected",
      proofsIssued: 0
    },
    checkout: {
      mode: "live",
      label: "Receiz checkout"
    },
    auth: {
      admin: { id: "admin", name: "Admin", email: "admin@example.com", role: "admin" },
      customer: {
        id: "customer",
        name: "Customer",
        email: "customer@example.com",
        tier: "Member",
        rewardsValueLabel: "$0",
        beans: 0,
        streak: "0x",
        orderIds: [],
        rewardIds: [],
        assetIds: []
      },
      receizId: {
        connected: true,
        handle: "boost.receiz.id",
        displayName: "Boost",
        keyId: "key",
        loginMode: "existing_receiz_id",
        accountImageLabel: "Receiz account image",
        artifactKind: "receiz_id",
        artifactStatus: "verified",
        portableStateStatus: "verified",
        localProofVerified: true,
        restoreSources: ["Receiz Key", "Identity Record", "Identity Seal image"],
        oneClickLogin: true,
        existingIdsSupported: true,
        sdkHelpers: [],
        statusLabel: "Connected"
      },
      signedInAs: "admin"
    },
    publish: { checklist: [] },
    proofEvents: []
  };
}
