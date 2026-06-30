import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CommerceState } from "../src/types/domain.js";
import {
  COMMERCE_EVENT_SCHEMA,
  STORE_STATE_SCHEMA,
  admitCommerceEvent,
  buildStoreStateRecord,
  projectStoreStateFromRecords
} from "../src/lib/receiz/proof-state.js";

function baseState(): CommerceState {
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

describe("Receiz proof commerce state", () => {
  it("builds a tenant-scoped store record without checkout-only or cart state", () => {
    const state = baseState();
    const record = buildStoreStateRecord(state, {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      reason: "publish"
    });

    assert.equal(record.schema, STORE_STATE_SCHEMA);
    assert.equal(record.tenantHost, "boost.receiz.app");
    assert.equal(record.tenantSlug, "boost");
    assert.equal(record.merchantReceizId, "boost.receiz.id");
    assert.equal(record.state.products.length, 1);
    assert.deepEqual((record.state as Record<string, unknown>).cart, undefined);
    assert.deepEqual((record.state as Record<string, unknown>).orders, undefined);
    assert.equal(record.state.hosting.published, true);
  });

  it("projects the newest published store state for the requested host", () => {
    const boost = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      reason: "publish",
      recordedAt: "2026-06-30T00:00:00.000Z"
    });
    const latest = buildStoreStateRecord(
      {
        ...baseState(),
        brand: { ...baseState().brand, name: "Boost Prime" }
      },
      {
        actorReceizId: "boost.receiz.id",
        tenantHost: "boost.receiz.app",
        reason: "publish",
        recordedAt: "2026-06-30T00:01:00.000Z"
      }
    );
    const other = buildStoreStateRecord(
      {
        ...baseState(),
        brand: { ...baseState().brand, name: "Other Store" },
        hosting: {
          ...baseState().hosting,
          tenantSlug: "other",
          subdomain: "other.receiz.app",
          liveUrl: "https://other.receiz.app"
        }
      },
      {
        actorReceizId: "other.receiz.id",
        tenantHost: "other.receiz.app",
        reason: "publish",
        recordedAt: "2026-06-30T00:02:00.000Z"
      }
    );

    const projected = projectStoreStateFromRecords(baseState(), [boost, other, latest], "boost.receiz.app");

    assert.equal(projected.brand.name, "Boost Prime");
    assert.equal(projected.hosting.subdomain, "boost.receiz.app");
  });

  it("projects a saved store for both its subdomain and custom domain", () => {
    const state = {
      ...baseState(),
      brand: { ...baseState().brand, name: "BJK Lock Store" },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app",
        liveUrl: "https://bjklock.receiz.app",
        customDomain: {
          ...baseState().hosting.customDomain,
          domain: "shop.bjklock.com",
          liveUrl: "https://shop.bjklock.com",
          status: "active" as const,
          sslStatus: "valid" as const,
          verified: true
        }
      }
    };
    const record = buildStoreStateRecord(state, {
      actorReceizId: "bjklock.receiz.id",
      tenantHost: "shop.bjklock.com",
      reason: "publish",
      recordedAt: "2026-06-30T00:04:00.000Z"
    });

    assert.equal(projectStoreStateFromRecords(baseState(), [record], "shop.bjklock.com").brand.name, "BJK Lock Store");
    assert.equal(projectStoreStateFromRecords(baseState(), [record], "bjklock.receiz.app").brand.name, "BJK Lock Store");
  });

  it("admits checkout events exactly once and projects settlement into sales and customers", () => {
    const state = baseState();
    const event = {
      schema: COMMERCE_EVENT_SCHEMA,
      id: "evt_checkout_settled_1",
      type: "checkout.settled",
      createdAt: "2026-06-30T00:03:00.000Z",
      tenantHost: "boost.receiz.app",
      merchantReceizId: "boost.receiz.id",
      data: {
        orderId: "ord_1001",
        checkoutSessionId: "cs_1001",
        customerId: "cus_1001",
        customerEmail: "lena@example.com",
        customerName: "Lena Ortiz",
        totalLabel: "$18.00",
        itemCount: 1,
        paymentRail: "receiz_wallet",
        settlementStatus: "settled",
        shipping: {
          name: "Lena Ortiz",
          email: "lena@example.com",
          line1: "10 Main St",
          city: "New York",
          region: "NY",
          postalCode: "10001",
          country: "US"
        }
      }
    } as const;

    const first = admitCommerceEvent(state, event);
    const second = admitCommerceEvent(first.state, event);

    assert.equal(first.admitted, true);
    assert.equal(second.admitted, false);
    assert.equal(second.state.orders.length, 1);
    assert.equal(second.state.customers.length, 1);
    assert.equal(second.state.orders[0]?.status, "settled");
    assert.equal(second.state.orders[0]?.paymentRail, "receiz_wallet");
    assert.equal(second.state.orders[0]?.merchantReceizId, "boost.receiz.id");
    assert.equal(second.state.customers[0]?.email, "lena@example.com");
    assert.equal(second.state.proofEvents.length, 1);
  });
});
