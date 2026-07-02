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
    exchange: {
      enabled: true,
      headline: "Proof Exchange",
      subheadline: "Peer-to-peer fractional markets for Receiz proof objects.",
      selectedAssetId: "exchange-coffee-pack",
      walletBalanceCents: 2500,
      settlementRail: "receiz_wallet_first",
      proofMemoryHead: {
        afterEntryId: "exchange-coffee-pack:append:list:20260701110000000Z",
        afterKaiUpulse: "1782932400000",
        afterCreatedAt: "2026-07-01T11:00:00.000Z"
      },
      assets: [
        {
          id: "exchange-coffee-pack",
          sourceAssetId: "coffee-pack",
          title: "Coffee Pack Proof Object",
          symbol: "COFFEE",
          category: "physical",
          status: "listed",
          manifest: {
            schema: "receiz.asset_manifest.v1",
            assetId: "asset:coffee-pack:BC-88421",
            assetType: "proof_object",
            proof: {
              kind: "receiz.proof_bundle",
              verifyUrl: "https://receiz.com/v/boost/BC-88421/1782932400000",
              kaiPulseEternal: "1782932400000",
              kaiKlok: "kai:1782932400000",
              receizClaimId: "bc88421coffeeclaim",
              artifactSha256Basis: "sha256:coffee-pack-proof"
            },
            owner: {
              receizSubject: "boost.receiz.id",
              displayName: "Boost Coffee",
              custody: "fractionalized"
            },
            links: {
              verify: "https://receiz.com/v/boost/BC-88421/1782932400000"
            }
          },
          ownerReceizId: "boost.receiz.id",
          deterministicValueCents: 180000,
          shareCount: 100,
          availableShares: 100,
          userShares: 0,
          lastPriceCents: 1800,
          liquidityCents: 30000,
          volume24hCents: 86400,
          change24hBps: 420,
          settlementRail: "receiz_wallet_first",
          twinMarketIntentId: "intent-coffee-pack",
          chart: [
            { id: "p1", timestamp: "2026-07-01T08:00:00.000Z", kaiPulse: "1782921600000", priceCents: 1600, liquidityCents: 25000, volumeCents: 24000 },
            { id: "p2", timestamp: "2026-07-01T09:00:00.000Z", kaiPulse: "1782925200000", priceCents: 1710, liquidityCents: 28000, volumeCents: 42800 },
            { id: "p3", timestamp: "2026-07-01T10:00:00.000Z", kaiPulse: "1782928800000", priceCents: 1760, liquidityCents: 30000, volumeCents: 65000 },
            { id: "p4", timestamp: "2026-07-01T11:00:00.000Z", kaiPulse: "1782932400000", priceCents: 1800, liquidityCents: 30000, volumeCents: 86400 }
          ],
          orderBook: [
            { id: "bid-1", side: "bid", priceCents: 1782, shares: 18, ownerReceizId: "collector.receiz.id", proofObjectId: "order:bid:coffee:1" },
            { id: "ask-1", side: "ask", priceCents: 1818, shares: 16, ownerReceizId: "boost.receiz.id", proofObjectId: "order:ask:coffee:1" }
          ],
          appendEvents: [
            {
              id: "exchange-coffee-pack:append:list:20260701110000000Z",
              type: "asset.listed",
              actorReceizId: "boost.receiz.id",
              detail: "COFFEE listed with 100 fractional shares",
              createdAt: "2026-07-01T11:00:00.000Z",
              kaiPulse: "1782932400000",
              appendAnchorId: "anchor:exchange-coffee-pack:1782932400000",
              appendHash: "sha256:exchange-list-coffee",
              proofObjectId: "asset:coffee-pack:BC-88421"
            }
          ]
        }
      ]
    },
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
