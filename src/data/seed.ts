import type { CommerceState } from "@/types/domain";
import { platform } from "@/lib/platform";

const now = "2026-06-29T18:00:00.000Z";

export const seedCommerceState: CommerceState = {
  brand: {
    name: "Boost Coffee",
    logoText: "boost",
    logoImageUrl: null,
    tagline: "Collect beans. Unlock more.",
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
    headline: "Proof-sealed commerce",
    subheadline: "Sell products, benefits, access, and Receized assets.",
    heroBody: "Premium coffee, perks, access, and rewards you can trust.",
    ctaLabel: "Shop now"
  },
  hosting: {
    mode: "mock_hosted",
    tenantSlug: "boost",
    subdomain: platform.defaultSubdomain,
    subdomainStatus: {
      domain: platform.defaultSubdomain,
      status: "active",
      sslStatus: "valid",
      verified: true,
      liveUrl: `https://${platform.defaultSubdomain}`,
      message: "Wildcard Receiz.app hosting ready"
    },
    customDomain: {
      domain: "www.boostcoffee.com",
      status: "ready",
      sslStatus: "valid",
      verified: true,
      liveUrl: "https://www.boostcoffee.com",
      message: "Custom domain verified"
    },
    liveUrl: `https://${platform.defaultSubdomain}`,
    merchantReceizId: "boost.receiz.id",
    settlementAccountLabel: "Boost Coffee Receiz account",
    plan: "pro",
    published: true,
    lastPublishedAt: "2h ago"
  },
  billing: {
    status: "trial",
    paymentMethodLabel: "No card required in demo",
    monthlyTotalLabel: "$49 / mo",
    trialEndsAt: "14 days left",
    invoices: [
      {
        id: "inv-demo-001",
        dateLabel: "Today",
        amountLabel: "$0.00",
        status: "paid"
      }
    ],
    plans: [
      {
        id: "starter",
        name: "Free",
        priceLabel: "$0 / mo",
        description: `Launch on a ${platform.domain} subdomain with Receiz primitives built in.`,
        included: ["Hosted storefront", "Receiz ID login", "Proof-sealed orders", "Basic rewards"]
      },
      {
        id: "pro",
        name: "Pro",
        priceLabel: "$49 / mo",
        description: "Custom domain, production hosting, advanced rewards, assets, and game modules.",
        included: ["Custom domain", "Receized assets", "Reward game", "Theme studio"],
        recommended: true
      },
      {
        id: "scale",
        name: "Scale",
        priceLabel: "$199 / mo",
        description: "Higher usage, teams, analytics, and advanced Receiz rails.",
        included: ["Team seats", "Priority hosting", "Advanced analytics", "Receiz hooks"]
      }
    ]
  },
  navigation: [
    { id: "store", label: "Storefront", href: "/", visible: true },
    { id: "products", label: "Products", href: "/#products", visible: true },
    { id: "rewards", label: "Rewards", href: "/#rewards", visible: true },
    { id: "assets", label: "Assets", href: "/#assets", visible: true },
    { id: "exchange", label: "Exchange", href: "/#exchange", visible: true },
    { id: "blog", label: "Blog", href: "/blog", visible: true },
    { id: "play", label: "Play", href: "/#play", visible: true },
    { id: "account", label: "Account", href: "/#account", visible: true },
    { id: "admin", label: "Admin", href: "/admin", visible: true }
  ],
  pages: [
    {
      id: "home",
      title: "Home",
      slug: "/",
      visibleInNav: true,
      published: true,
      sections: [
        {
          id: "home-hero",
          kind: "hero",
          title: "Boost Coffee",
          body: "Premium coffee, perks, and proof-sealed rewards."
        }
      ]
    },
    {
      id: "shop",
      title: "Shop",
      slug: "/shop",
      visibleInNav: true,
      published: true,
      sections: []
    },
    {
      id: "rewards",
      title: "Rewards",
      slug: "/rewards",
      visibleInNav: true,
      published: true,
      sections: []
    },
    {
      id: "exchange",
      title: "Exchange",
      slug: "/exchange",
      visibleInNav: true,
      published: true,
      sections: [
        {
          id: "exchange-market",
          kind: "exchange",
          title: "Proof Exchange",
          body: "Peer-to-peer fractional markets for Receiz proof objects."
        }
      ]
    },
    {
      id: "game",
      title: "Game",
      slug: "/game",
      visibleInNav: true,
      published: true,
      sections: []
    },
    {
      id: "about",
      title: "About us",
      slug: "/about",
      visibleInNav: true,
      published: true,
      sections: []
    },
    {
      id: "account",
      title: "Account",
      slug: "/account",
      visibleInNav: true,
      published: true,
      sections: []
    }
  ],
  blogPosts: [
    {
      id: "blog-origin-roast",
      title: "How Boost sources proof-sealed beans",
      slug: "/blog/proof-sealed-beans",
      excerpt: "A behind-the-scenes look at how every featured roast carries a Receiz proof trail.",
      body: "Tell the story behind the product, the people, the proof object, and the reward that customers unlock after purchase.",
      authorName: "Boost Coffee",
      coverImageUrl: null,
      tags: ["sourcing", "proof", "coffee"],
      featured: true,
      status: "published",
      publishedAt: now,
      seo: {
        title: "Proof-sealed beans from Boost Coffee",
        description: "See how Boost Coffee uses Receiz proof objects to connect sourcing, purchases, and rewards.",
        canonicalPath: "/blog/proof-sealed-beans",
        keywords: ["proof-sealed coffee", "Receiz rewards", "Boost Coffee"],
        socialImageUrl: null
      }
    },
    {
      id: "blog-rewards-guide",
      title: "Your guide to earning rewards",
      slug: "/blog/rewards-guide",
      excerpt: "How beans, access passes, coupons, and Receized perks work in the Boost rewards program.",
      body: "Explain the reward rules, customer actions, eligibility, proof seals, and how to redeem benefits.",
      authorName: "Boost Coffee",
      coverImageUrl: null,
      tags: ["rewards", "members"],
      featured: false,
      status: "draft",
      publishedAt: now,
      seo: {
        title: "Boost Coffee rewards guide",
        description: "Learn how to earn and redeem proof-sealed rewards at Boost Coffee.",
        canonicalPath: "/blog/rewards-guide",
        keywords: ["coffee rewards", "Receiz ID", "proof rewards"],
        socialImageUrl: null
      }
    }
  ],
  collections: [
    {
      id: "coffee",
      name: "Coffee",
      slug: "coffee",
      productIds: ["coffee-pack", "cold-brew", "ceramic-mug"],
      published: true
    },
    {
      id: "access",
      name: "Access and benefits",
      slug: "access",
      productIds: ["member-access", "brew-class", "limited-drop"],
      published: true
    }
  ],
  products: [
    {
      id: "coffee-pack",
      name: "Coffee Pack",
      subtitle: "House Blend - Whole Bean (12oz)",
      type: "physical",
      priceLabel: "$18.00",
      status: "active",
      inventoryLabel: "124",
      rewardEligible: true,
      sealed: true,
      imageTone: "bag"
    },
    {
      id: "cold-brew",
      name: "Cold Brew",
      subtitle: "Smooth - 12oz",
      type: "physical",
      priceLabel: "$3.50",
      status: "active",
      inventoryLabel: "86",
      rewardEligible: true,
      sealed: false,
      imageTone: "can"
    },
    {
      id: "ceramic-mug",
      name: "Ceramic Mug",
      subtitle: "12oz",
      type: "physical",
      priceLabel: "$16.00",
      status: "active",
      inventoryLabel: "211",
      rewardEligible: true,
      sealed: true,
      imageTone: "mug"
    },
    {
      id: "gift-card",
      name: "Gift Card",
      subtitle: "Digital",
      type: "digital",
      priceLabel: "From $10.00",
      status: "active",
      inventoryLabel: "∞",
      rewardEligible: true,
      sealed: true,
      imageTone: "card"
    },
    {
      id: "member-access",
      name: "Member Access",
      subtitle: "Boost Coffee Membership",
      type: "access",
      priceLabel: "$9.99 / mo",
      status: "active",
      inventoryLabel: "∞",
      rewardEligible: true,
      sealed: true,
      imageTone: "access"
    },
    {
      id: "brew-class",
      name: "Brew Class",
      subtitle: "In-person brewing workshop",
      type: "experience",
      priceLabel: "$45.00",
      status: "active",
      inventoryLabel: "58",
      rewardEligible: true,
      sealed: false,
      imageTone: "class"
    },
    {
      id: "limited-drop",
      name: "Limited Drop",
      subtitle: "Seasonal single origin",
      type: "receized_asset",
      priceLabel: "$24.00",
      status: "active",
      inventoryLabel: "24",
      rewardEligible: true,
      sealed: true,
      imageTone: "bag"
    }
  ],
  cart: {
    lines: []
  },
  orders: [
    {
      id: "1045",
      customerId: "customer-lena",
      customerEmail: "lena@example.com",
      totalLabel: "$36.00",
      status: "mock_paid",
      itemCount: 2,
      sealed: true,
      createdAt: now,
      merchantReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      checkoutSessionId: "demo_checkout_1045",
      paymentRail: "receiz_wallet",
      settlementStatus: "wallet_reserved",
      shipping: {
        name: "Lena Smith",
        email: "lena@example.com",
        line1: "88 Market Street",
        city: "San Francisco",
        region: "CA",
        postalCode: "94105",
        country: "US"
      }
    },
    {
      id: "10234",
      customerId: "customer-lena",
      customerEmail: "lena@example.com",
      totalLabel: "$20.61",
      status: "fulfilled",
      itemCount: 1,
      sealed: true,
      createdAt: now,
      merchantReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      checkoutSessionId: "demo_checkout_10234",
      paymentRail: "card_fallback",
      settlementStatus: "settled",
      shipping: {
        name: "Lena Smith",
        email: "lena@example.com",
        line1: "88 Market Street",
        city: "San Francisco",
        region: "CA",
        postalCode: "94105",
        country: "US"
      }
    }
  ],
  customers: [
    {
      id: "customer-lena",
      name: "Lena Smith",
      email: "lena@example.com",
      receizHandle: "lena.receiz.id",
      tier: "VIP",
      rewardsValueLabel: "$36.00",
      beans: 128,
      streak: "2x",
      orderIds: ["1045", "10234"],
      rewardIds: ["reward-12"],
      assetIds: ["asset-member-access", "asset-limited-drop", "asset-brew-class"],
      shippingAddress: {
        name: "Lena Smith",
        email: "lena@example.com",
        line1: "88 Market Street",
        city: "San Francisco",
        region: "CA",
        postalCode: "94105",
        country: "US"
      }
    }
  ],
  rewards: [
    {
      id: "reward-12",
      name: "$12 reward",
      type: "coupon",
      description: "Spend at Boost Coffee",
      requirement: "Requires 24 beans",
      progress: 18,
      target: 24,
      status: "active",
      transferability: ["redeem_only", "shareable"],
      expiresAt: "May 31, 2025"
    },
    {
      id: "free-shipping",
      name: "Free shipping",
      type: "benefit",
      description: "500 beans",
      requirement: "No expiry",
      progress: 500,
      target: 500,
      status: "active",
      transferability: ["redeem_only"],
      expiresAt: "No expiry"
    },
    {
      id: "vip-access",
      name: "VIP access",
      type: "access_pass",
      description: "Early drops and events",
      requirement: "1,000 beans",
      progress: 650,
      target: 1000,
      status: "active",
      transferability: ["shareable", "locked"],
      expiresAt: "60 days"
    }
  ],
  rewardRules: [
    {
      id: "rule-spend",
      label: "$12 reward",
      trigger: "Spend $24",
      rewardId: "reward-12",
      active: true
    },
    {
      id: "rule-shipping",
      label: "Free shipping",
      trigger: "500 beans",
      rewardId: "free-shipping",
      active: true
    },
    {
      id: "rule-vip",
      label: "VIP access",
      trigger: "1,000 beans",
      rewardId: "vip-access",
      active: true
    }
  ],
  assets: [
    {
      id: "asset-member-access",
      name: "Member Access",
      type: "access",
      ownerId: "customer-lena",
      status: "owned",
      priceLabel: "$9.99 / mo",
      proofSource: "MA-3387"
    },
    {
      id: "asset-limited-drop",
      name: "Limited Drop",
      type: "limited_drop",
      ownerId: "customer-lena",
      status: "listed",
      priceLabel: "$24.00",
      proofSource: "LD-1240"
    },
    {
      id: "asset-brew-class",
      name: "Brew Class",
      type: "benefit",
      ownerId: "customer-lena",
      status: "owned",
      priceLabel: "$45.00",
      proofSource: "BC-88421"
    }
  ],
  listings: [
    {
      id: "listing-limited-drop",
      assetId: "asset-limited-drop",
      terms: "$24.00",
      status: "listed"
    }
  ],
  qualifiers: [
    {
      id: "receipt",
      label: "Receipt",
      enabled: true,
      criteria: "Merchant, total, timestamp"
    },
    {
      id: "order",
      label: "Order",
      enabled: true,
      criteria: "Paid order and item count"
    },
    {
      id: "attendance",
      label: "Attendance",
      enabled: true,
      criteria: "Event, person, check-in"
    },
    {
      id: "achievement",
      label: "Achievement",
      enabled: true,
      criteria: "Score, rank, completion"
    }
  ],
  campaigns: [
    {
      id: "boost-coffee-challenge",
      name: "Boost Coffee Challenge",
      enabled: true,
      eligibleObjectIds: ["receipt", "order", "achievement"],
      scoreRule: "Collect beans and seal the result",
      rewardId: "reward-12"
    }
  ],
  exchange: {
    enabled: true,
    headline: "Proof Exchange",
    subheadline: "Peer-to-peer fractional markets for Receiz proof objects, wallet-first settlement, and append-only ownership.",
    selectedAssetId: "exchange-limited-drop",
    walletBalanceCents: 5200,
    settlementRail: "receiz_wallet_first",
    proofMemoryHead: {
      afterEntryId: "exchange-limited-drop:append:trade:20260629175500000Z",
      afterKaiUpulse: "1782746100000",
      afterCreatedAt: "2026-06-29T17:55:00.000Z"
    },
    assets: [
      {
        id: "exchange-limited-drop",
        sourceAssetId: "asset-limited-drop",
        title: "Limited Drop Access Proof",
        symbol: "DROP",
        category: "access",
        status: "trading",
        manifest: {
          schema: "receiz.asset_manifest.v1",
          assetId: "asset:limited-drop:LD-1240",
          assetType: "proof_object",
          proof: {
            kind: "receiz.proof_bundle",
            verifyUrl: "https://receiz.com/v/boost/LD-1240/1782745800000",
            kaiPulseEternal: "1782745800000",
            kaiKlok: "kai:1782745800000",
            receizClaimId: "ld1240limiteddropclaim",
            artifactSha256Basis: "sha256:limited-drop-proof-object"
          },
          owner: {
            receizSubject: "boost.receiz.id",
            displayName: "Boost Coffee",
            custody: "fractionalized"
          },
          links: {
            verify: "https://receiz.com/v/boost/LD-1240/1782745800000",
            asset: "https://receiz.com/assets/asset-limited-drop"
          }
        },
        ownerReceizId: "boost.receiz.id",
        deterministicValueCents: 240000,
        shareCount: 240,
        availableShares: 168,
        userShares: 12,
        lastPriceCents: 1180,
        liquidityCents: 93500,
        volume24hCents: 184600,
        change24hBps: 1280,
        settlementRail: "receiz_wallet_first",
        twinMarketIntentId: "intent-limited-drop",
        chart: [
          { id: "drop-p1", timestamp: "2026-06-29T12:00:00.000Z", kaiPulse: "1782724800000", priceCents: 890, liquidityCents: 64000, volumeCents: 22400 },
          { id: "drop-p2", timestamp: "2026-06-29T13:00:00.000Z", kaiPulse: "1782728400000", priceCents: 940, liquidityCents: 71200, volumeCents: 43800 },
          { id: "drop-p3", timestamp: "2026-06-29T14:00:00.000Z", kaiPulse: "1782732000000", priceCents: 1015, liquidityCents: 78000, volumeCents: 79100 },
          { id: "drop-p4", timestamp: "2026-06-29T15:00:00.000Z", kaiPulse: "1782735600000", priceCents: 1085, liquidityCents: 85800, volumeCents: 123400 },
          { id: "drop-p5", timestamp: "2026-06-29T16:00:00.000Z", kaiPulse: "1782739200000", priceCents: 1120, liquidityCents: 91200, volumeCents: 153300 },
          { id: "drop-p6", timestamp: "2026-06-29T17:55:00.000Z", kaiPulse: "1782746100000", priceCents: 1180, liquidityCents: 93500, volumeCents: 184600 }
        ],
        orderBook: [
          { id: "drop-bid-1", side: "bid", priceCents: 1160, shares: 22, ownerReceizId: "lena.receiz.id", proofObjectId: "order:drop:bid:1" },
          { id: "drop-bid-2", side: "bid", priceCents: 1138, shares: 34, ownerReceizId: "marco.receiz.id", proofObjectId: "order:drop:bid:2" },
          { id: "drop-ask-1", side: "ask", priceCents: 1198, shares: 18, ownerReceizId: "boost.receiz.id", proofObjectId: "order:drop:ask:1" },
          { id: "drop-ask-2", side: "ask", priceCents: 1225, shares: 25, ownerReceizId: "collector.receiz.id", proofObjectId: "order:drop:ask:2" }
        ],
        appendEvents: [
          {
            id: "exchange-limited-drop:append:trade:20260629175500000Z",
            type: "market.trade",
            actorReceizId: "lena.receiz.id",
            detail: "buy 12 shares at $141.60",
            createdAt: "2026-06-29T17:55:00.000Z",
            kaiPulse: "1782746100000",
            appendAnchorId: "anchor:exchange-limited-drop:1782746100000",
            appendHash: "sha256:exchange-drop-trade",
            proofObjectId: "asset:limited-drop:LD-1240",
            childProofObjectId: "exchange-limited-drop:share:lena-receiz-id:20260629175500000Z",
            settlementLedgerEventId: "ledger:drop:lena:20260629175500000Z"
          },
          {
            id: "exchange-limited-drop:append:list:20260629173000000Z",
            type: "asset.listed",
            actorReceizId: "boost.receiz.id",
            detail: "DROP listed with 240 fractional shares",
            createdAt: "2026-06-29T17:30:00.000Z",
            kaiPulse: "1782744600000",
            appendAnchorId: "anchor:exchange-limited-drop:1782744600000",
            appendHash: "sha256:exchange-drop-list",
            proofObjectId: "asset:limited-drop:LD-1240"
          }
        ]
      },
      {
        id: "exchange-brew-class",
        sourceAssetId: "asset-brew-class",
        title: "Brew Class Seat Certificate",
        symbol: "BREW",
        category: "benefit",
        status: "listed",
        manifest: {
          schema: "receiz.asset_manifest.v1",
          assetId: "asset:brew-class:BC-88421",
          assetType: "market_certificate",
          proof: {
            kind: "receiz.proof_bundle",
            verifyUrl: "https://receiz.com/v/boost/BC-88421/1782745200000",
            kaiPulseEternal: "1782745200000",
            kaiKlok: "kai:1782745200000",
            receizClaimId: "bc88421brewclassclaim",
            artifactSha256Basis: "sha256:brew-class-market-certificate"
          },
          owner: {
            receizSubject: "boost.receiz.id",
            displayName: "Boost Coffee",
            custody: "fractionalized"
          },
          links: {
            verify: "https://receiz.com/v/boost/BC-88421/1782745200000"
          }
        },
        ownerReceizId: "boost.receiz.id",
        deterministicValueCents: 450000,
        shareCount: 450,
        availableShares: 360,
        userShares: 0,
        lastPriceCents: 1000,
        liquidityCents: 121000,
        volume24hCents: 96600,
        change24hBps: -210,
        settlementRail: "receiz_wallet_first",
        twinMarketIntentId: "intent-brew-class",
        chart: [
          { id: "brew-p1", timestamp: "2026-06-29T12:00:00.000Z", kaiPulse: "1782724800000", priceCents: 1045, liquidityCents: 96000, volumeCents: 18300 },
          { id: "brew-p2", timestamp: "2026-06-29T13:00:00.000Z", kaiPulse: "1782728400000", priceCents: 1030, liquidityCents: 101000, volumeCents: 29100 },
          { id: "brew-p3", timestamp: "2026-06-29T14:00:00.000Z", kaiPulse: "1782732000000", priceCents: 1018, liquidityCents: 110000, volumeCents: 52200 },
          { id: "brew-p4", timestamp: "2026-06-29T15:30:00.000Z", kaiPulse: "1782737400000", priceCents: 1000, liquidityCents: 121000, volumeCents: 96600 }
        ],
        orderBook: [
          { id: "brew-bid-1", side: "bid", priceCents: 988, shares: 40, ownerReceizId: "taylor.receiz.id", proofObjectId: "order:brew:bid:1" },
          { id: "brew-ask-1", side: "ask", priceCents: 1016, shares: 32, ownerReceizId: "boost.receiz.id", proofObjectId: "order:brew:ask:1" }
        ],
        appendEvents: [
          {
            id: "exchange-brew-class:append:list:20260629153000000Z",
            type: "asset.listed",
            actorReceizId: "boost.receiz.id",
            detail: "BREW listed with 450 fractional shares",
            createdAt: "2026-06-29T15:30:00.000Z",
            kaiPulse: "1782737400000",
            appendAnchorId: "anchor:exchange-brew-class:1782737400000",
            appendHash: "sha256:exchange-brew-list",
            proofObjectId: "asset:brew-class:BC-88421"
          }
        ]
      }
    ]
  },
  game: {
    enabled: true,
    campaignId: "boost-coffee-challenge",
    dailyLimit: "1 play / customer",
    leaderboardEnabled: true
  },
  receiz: {
    connected: true,
    mode: "mock",
    statusLabel: "Receiz connected",
    proofsIssued: 34891
  },
  checkout: {
    mode: "mock",
    label: "Receiz sandbox"
  },
  auth: {
    admin: {
      id: "admin-alex",
      name: "Alex Morgan",
      email: "alex@boostcoffee.com",
      role: "admin"
    },
    customer: {
      id: "customer-lena",
      name: "Lena Smith",
      email: "lena@example.com",
      tier: "VIP",
      rewardsValueLabel: "$36.00",
      beans: 128,
      streak: "2x",
      orderIds: ["1045", "10234"],
      rewardIds: ["reward-12"],
      assetIds: ["asset-member-access", "asset-limited-drop", "asset-brew-class"]
    },
    receizId: {
      connected: false,
      handle: "boost.receiz.id",
      displayName: "Boost Coffee",
      keyId: "rzid_demo_boost_88421",
      loginMode: "existing_receiz_id",
      accountImageLabel: "Identity Seal image",
      artifactKind: "identity_seal",
      artifactStatus: "verified",
      portableStateStatus: "verified",
      localProofVerified: true,
      restoreSources: ["Receiz Key", "Identity Record", "Identity Seal image"],
      oneClickLogin: true,
      existingIdsSupported: true,
      sdkHelpers: [
        "createReceizIdIdentity",
        "buildReceizIdContinueRequest",
        "projectReceizIdentityAccount",
        "readReceizIdentityArtifact",
        "verifyReceizIdentityLoginProof",
        "signReceizIdentityLoginProof"
      ],
      statusLabel: "Connect Receiz ID"
    },
    signedInAs: "customer"
  },
  publish: {
    checklist: [
      { id: "brand", label: "Brand settings", complete: true },
      { id: "pages", label: "Pages and navigation", complete: true },
      { id: "products", label: "Products and collections", complete: true },
      { id: "rewards", label: "Rewards and rules", complete: true },
      { id: "receiz", label: "Receiz seal settings", complete: true },
      { id: "checkout", label: "Checkout configuration", complete: true },
      { id: "domain", label: "Domain and hosting", complete: true },
      { id: "game", label: "Game setup optional", complete: false, warning: true }
    ]
  },
  proofEvents: [
    {
      id: "event-object",
      type: "OBJECT_VERIFIED",
      title: "OBJECT_VERIFIED",
      detail: "Coffee Pack · Serial #BC-88421",
      status: "verified",
      timestampLabel: "2m ago"
    },
    {
      id: "event-reward",
      type: "REWARD_ISSUED",
      title: "REWARD_ISSUED",
      detail: "$12 reward · Order #1045",
      status: "success",
      timestampLabel: "4m ago"
    },
    {
      id: "event-asset",
      type: "ASSET_RECEIZED",
      title: "ASSET_RECEIZED",
      detail: "Member Access · #MA-3387",
      status: "sealed",
      timestampLabel: "8m ago"
    },
    {
      id: "event-game",
      type: "GAME_COMPLETED",
      title: "GAME_COMPLETED",
      detail: "Boost Coffee Challenge",
      status: "success",
      timestampLabel: "12m ago"
    },
    {
      id: "event-order",
      type: "ORDER_VERIFIED",
      title: "ORDER_VERIFIED",
      detail: "Order #10234 verified",
      status: "verified",
      timestampLabel: "15m ago"
    }
  ]
};
