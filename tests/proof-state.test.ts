import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CommerceState } from "../src/types/domain.js";
import {
  COMMERCE_EVENT_SCHEMA,
  STORE_STATE_SCHEMA,
  admitCommerceEvent,
  buildStoreStateConnectRecord,
  buildStoreStateRecord,
  commerceEventFromUnknown,
  isStoreStateRecord,
  storeStateProjectionSource,
  storeStateRecordMatchesTenantHost,
  projectStoreStateFromRecords
} from "../src/lib/receiz/proof-state.js";
import { buildPublishedCommerceState } from "../src/lib/hosting/published-state.js";
import { receizAppendFixture } from "./support/receiz-append.js";

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
      enabled: false,
      headline: "Proof Exchange",
      subheadline: "Peer-to-peer proof markets",
      selectedAssetId: "",
      walletBalanceCents: 0,
      settlementRail: "receiz_wallet_first",
      proofMemoryHead: {
        afterEntryId: null,
        afterKaiUpulse: null,
        afterCreatedAt: null
      },
      assets: []
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

describe("Receiz proof commerce state", () => {
  it("builds a tenant-scoped store record without checkout-only or cart state", () => {
    const state = baseState();
    const record = buildStoreStateRecord(state, {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      reason: "publish",
      ...receizAppendFixture("2026-06-30T00:00:00.000Z")
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

  it("builds the baseline publish record before any append coordinate exists", () => {
    const record = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      reason: "publish",
      recordedAt: "2026-06-30T00:00:01.123Z"
    });

    assert.equal(record.id, "store_state:boost.receiz.app:20260630T000001123Z");
    assert.equal("updatedKaiUpulse" in record, false);
    assert.equal("appendAnchorId" in record, false);
    assert.equal("appendProof" in record, false);
  });

  it("accepts baseline published store records without Kai and append anchor", () => {
    const legacyRecord = {
      schema: STORE_STATE_SCHEMA,
      id: "store_state:bjklock.receiz.app:20260630000000000",
      type: "store.state.published",
      reason: "publish",
      recordedAt: "2026-06-30T00:00:00.000Z",
      actorReceizId: "bjklock.receiz.id",
      tenantHost: "bjklock.receiz.app",
      tenantSlug: "bjklock",
      merchantReceizId: "bjklock.receiz.id",
      state: {
        ...baseState(),
        brand: { ...baseState().brand, name: "Baseline Saved Store" },
        hosting: {
          ...baseState().hosting,
          tenantSlug: "bjklock",
          subdomain: "bjklock.receiz.app",
          merchantReceizId: "bjklock.receiz.id"
        }
      }
    };

    assert.equal(isStoreStateRecord(legacyRecord), true);
    assert.equal(projectStoreStateFromRecords(baseState(), [legacyRecord], "bjklock.receiz.app").brand.name, "Baseline Saved Store");
  });

  it("projects the newest published store state for the requested host", () => {
    const boost = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      reason: "publish",
      ...receizAppendFixture("2026-06-30T00:00:00.000Z")
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
        ...receizAppendFixture("2026-06-30T00:01:00.000Z")
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
        ...receizAppendFixture("2026-06-30T00:02:00.000Z")
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
      ...receizAppendFixture("2026-06-30T00:04:00.000Z")
    });

    assert.equal(projectStoreStateFromRecords(baseState(), [record], "shop.bjklock.com").brand.name, "BJK Lock Store");
    assert.equal(projectStoreStateFromRecords(baseState(), [record], "bjklock.receiz.app").brand.name, "BJK Lock Store");
  });

  it("preserves the submitted merchant host when building a published state", () => {
    const savedImageUrl = "https://media.receiz.test/saved-espresso-kit.webp";
    const submitted = {
      brand: { ...baseState().brand, name: "Bjklock Supply" },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app",
        liveUrl: "https://bjklock.receiz.app",
        merchantReceizId: "bjklock.receiz.id",
        settlementAccountLabel: "Bjklock Receiz account",
        published: false,
        customDomain: {
          ...baseState().hosting.customDomain,
          domain: "shop.bjklock.com",
          liveUrl: "https://shop.bjklock.com",
          status: "active" as const,
          sslStatus: "valid" as const,
          verified: true
        }
      },
      products: [
        {
          ...baseState().products[0],
          id: "saved-coffee",
          name: "Saved espresso kit",
          imageUrl: savedImageUrl
        }
      ]
    };

    const state = buildPublishedCommerceState(baseState(), submitted);
    const record = buildStoreStateRecord(state, {
      actorReceizId: state.hosting.merchantReceizId,
      tenantHost: state.hosting.customDomain.domain || state.hosting.subdomain,
      reason: "publish",
      ...receizAppendFixture("2026-06-30T00:05:00.000Z")
    });

    assert.equal(state.hosting.subdomain, "bjklock.receiz.app");
    assert.equal(state.hosting.customDomain.domain, "shop.bjklock.com");
    assert.equal(state.hosting.published, true);
    assert.equal(record.tenantHost, "shop.bjklock.com");
    assert.equal(record.merchantReceizId, "bjklock.receiz.id");
    assert.equal(storeStateRecordMatchesTenantHost(record, "bjklock.receiz.app"), true);
    const projected = projectStoreStateFromRecords(baseState(), [record], "bjklock.receiz.app");
    assert.equal(projected.brand.name, "Bjklock Supply");
    assert.equal(projected.products[0]?.name, "Saved espresso kit");
    assert.equal(projected.products[0]?.imageUrl, savedImageUrl);
    assert.equal(storeStateProjectionSource([record], "bjklock.receiz.app"), "published");
    assert.equal(storeStateProjectionSource([], "bjklock.receiz.app"), "fallback");
  });

  it("normalizes publish hosting to the connected Receiz owner", () => {
    const state = buildPublishedCommerceState(
      baseState(),
      {
        hosting: {
          ...baseState().hosting,
          merchantReceizId: "boost.receiz.id",
          tenantSlug: "boost",
          subdomain: "boost.receiz.app",
          liveUrl: "https://www.boostcoffee.com",
          customDomain: {
            ...baseState().hosting.customDomain,
            domain: "www.boostcoffee.com",
            liveUrl: "https://www.boostcoffee.com",
            status: "ready" as const,
            sslStatus: "valid" as const,
            verified: true
          }
        }
      },
      {
        customDomain: "www.boostcoffee.com",
        displayName: "BJ Klock",
        merchantReceizId: "bjklock.receiz.id"
      }
    );

    assert.equal(state.hosting.merchantReceizId, "bjklock.receiz.id");
    assert.equal(state.hosting.tenantSlug, "bjklock");
    assert.equal(state.hosting.subdomain, "bjklock.receiz.app");
    assert.equal(state.hosting.liveUrl, "https://bjklock.receiz.app");
    assert.equal(state.hosting.customDomain.domain, "");
    assert.equal(state.hosting.settlementAccountLabel, "BJ Klock Receiz account");
  });

  it("removes template blog posts when publishing a merchant-owned store", () => {
    const state = buildPublishedCommerceState(
      {
        ...baseState(),
        blogPosts: [
          {
            id: "blog-origin-roast",
            title: "How Boost sources proof-sealed beans",
            slug: "/blog/proof-sealed-beans",
            excerpt: "Boost template story",
            body: "Boost template body",
            authorName: "Boost Coffee",
            coverImageUrl: null,
            tags: ["coffee"],
            featured: true,
            status: "published",
            publishedAt: "2026-06-30T00:00:00.000Z",
            seo: {
              title: "Boost story",
              description: "Boost story",
              canonicalPath: "/blog/proof-sealed-beans",
              keywords: ["Boost"],
              socialImageUrl: null
            }
          },
          {
            id: "post-custom",
            title: "BJ Klock story",
            slug: "/blog/bj-klock-story",
            excerpt: "Merchant story",
            body: "Merchant body",
            authorName: "BJ Klock",
            coverImageUrl: null,
            tags: ["updates"],
            featured: false,
            status: "draft",
            publishedAt: "2026-06-30T00:00:00.000Z",
            seo: {
              title: "BJ Klock story",
              description: "Merchant story",
              canonicalPath: "/blog/bj-klock-story",
              keywords: ["BJ Klock"],
              socialImageUrl: null
            }
          }
        ]
      },
      {},
      {
        displayName: "BJ Klock",
        merchantReceizId: "bjklock.receiz.id"
      }
    );

    assert.deepEqual(state.blogPosts.map((post) => post.id), ["post-custom"]);
  });

  it("does not project platform seed commerce arrays into a published tenant store", () => {
    const base = {
      ...baseState(),
      customers: [
        {
          id: "customer-lena",
          name: "Lena Smith",
          email: "lena@example.com",
          tier: "VIP",
          rewardsValueLabel: "$36",
          beans: 128,
          streak: "2x",
          orderIds: ["1045"],
          rewardIds: [],
          assetIds: []
        }
      ],
      orders: [
        {
          id: "1045",
          customerId: "customer-lena",
          totalLabel: "$36.00",
          status: "fulfilled" as const,
          itemCount: 2,
          sealed: true,
          createdAt: "2026-06-30T00:00:00.000Z",
          merchantReceizId: "boost.receiz.id",
          tenantHost: "boost.receiz.app"
        }
      ],
      proofEvents: [
        {
          id: "event-order",
          type: "ORDER_VERIFIED" as const,
          title: "ORDER_VERIFIED",
          detail: "Boost order",
          status: "verified" as const,
          timestampLabel: "now"
        }
      ]
    };
    const record = buildStoreStateRecord(
      {
        ...baseState(),
        brand: { ...baseState().brand, name: "BJ Klock" },
        hosting: {
          ...baseState().hosting,
          tenantSlug: "bjklock",
          subdomain: "bjklock.receiz.app",
          merchantReceizId: "bjklock.receiz.id"
        }
      },
      {
        actorReceizId: "bjklock.receiz.id",
        tenantHost: "bjklock.receiz.app",
        reason: "publish",
        ...receizAppendFixture("2026-06-30T00:05:15.000Z")
      }
    );
    const projected = projectStoreStateFromRecords(base, [record], "bjklock.receiz.app");

    assert.equal(projected.brand.name, "BJ Klock");
    assert.equal(projected.orders.length, 0);
    assert.equal(projected.customers.length, 0);
    assert.equal(projected.proofEvents.length, 0);
  });

  it("keeps compact inline image data in published proof records", () => {
    const imageDataUrl = `data:image/png;base64,${Buffer.alloc(96_000, "a").toString("base64")}`;
    const record = buildStoreStateRecord(
      {
        ...baseState(),
        brand: { ...baseState().brand, logoImageUrl: imageDataUrl },
        products: [
          {
            ...baseState().products[0],
            imageUrl: imageDataUrl
          }
        ]
      },
      {
        actorReceizId: "boost.receiz.id",
        tenantHost: "boost.receiz.app",
        reason: "publish",
        ...receizAppendFixture("2026-06-30T00:05:25.000Z")
      }
    );

    assert.equal(record.state.brand.logoImageUrl, imageDataUrl);
    assert.equal(record.state.products[0]?.imageUrl, imageDataUrl);
  });

  it("keeps durable media URLs and strips duplicated inline social images for signed storefronts", () => {
    const cameraRollDataUrl = `data:image/jpeg;base64,${Buffer.alloc(256_000, "a").toString("base64")}`;
    const durableProductUrl = "https://media.receiz.test/product.webp";
    const durableLogoUrl = "https://media.receiz.test/logo.webp";
    const durableCoverUrl = "https://media.receiz.test/cover.webp";
    const record = buildStoreStateRecord(
      {
        ...baseState(),
        brand: { ...baseState().brand, logoImageUrl: durableLogoUrl },
        products: [
          {
            ...baseState().products[0],
            imageUrl: durableProductUrl,
            seo: {
              canonicalPath: "/products/coffee-pack",
              description: "Whole bean",
              keywords: [],
              title: "Coffee Pack",
              socialImageUrl: cameraRollDataUrl
            }
          }
        ],
        blogPosts: [
          {
            id: "origin",
            title: "Origin story",
            slug: "/blog/origin",
            excerpt: "Proof sealed coffee.",
            body: "Origin body",
            status: "published",
            publishedAt: "2026-06-30T00:00:00.000Z",
            featured: true,
            authorName: "Boost Coffee",
            tags: ["coffee"],
            coverImageUrl: durableCoverUrl,
            seo: {
              canonicalPath: "/blog/origin",
              title: "Origin story",
              description: "Proof sealed coffee.",
              keywords: [],
              socialImageUrl: cameraRollDataUrl
            }
          }
        ]
      },
      {
        actorReceizId: "boost.receiz.id",
        tenantHost: "boost.receiz.app",
        reason: "publish",
        ...receizAppendFixture("2026-06-30T00:05:27.000Z")
      }
    );

    assert.equal(record.state.brand.logoImageUrl, durableLogoUrl);
    assert.equal(record.state.products[0]?.imageUrl, durableProductUrl);
    assert.equal(record.state.products[0]?.seo?.socialImageUrl, null);
    assert.equal(record.state.blogPosts[0]?.coverImageUrl, durableCoverUrl);
    assert.equal(record.state.blogPosts[0]?.seo.socialImageUrl, null);
    assert.ok(JSON.stringify(buildStoreStateConnectRecord(record)).length < 20_000);
  });

  it("omits oversized inline media from the published proof record", () => {
    const hugeDataUrl = `data:image/png;base64,${"a".repeat(2_200_000)}`;
    const record = buildStoreStateRecord(
      {
        ...baseState(),
        brand: { ...baseState().brand, logoImageUrl: hugeDataUrl },
        products: [
          {
            ...baseState().products[0],
            imageUrl: hugeDataUrl
          }
        ]
      },
      {
        actorReceizId: "boost.receiz.id",
        tenantHost: "boost.receiz.app",
        reason: "publish",
        ...receizAppendFixture("2026-06-30T00:05:30.000Z")
      }
    );

    assert.equal(record.state.brand.logoImageUrl, null);
    assert.equal(record.state.products[0]?.imageUrl, null);
    assert.ok(JSON.stringify(buildStoreStateConnectRecord(record)).length < hugeDataUrl.length);
  });

  it("wraps published store state in a Receiz connect action envelope", () => {
    const record = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      reason: "publish",
      ...receizAppendFixture("2026-06-30T00:06:00.000Z")
    });
    const connectRecord = buildStoreStateConnectRecord(record);

    assert.equal(connectRecord.schema, "receiz.app.store_state_connect.v1");
    assert.equal(connectRecord.event, "store.state.published");
    assert.equal(connectRecord.tenantHost, "boost.receiz.app");
    assert.equal(connectRecord.merchantReceizId, "boost.receiz.id");
    assert.equal(connectRecord.data.storeStateRecordId, record.id);
    assert.equal(connectRecord.data.tenantHost, record.tenantHost);
    assert.equal(connectRecord.data.merchantReceizId, record.merchantReceizId);
    assert.equal("storeStateRecord" in connectRecord.data, false);
    assert.equal("payload" in connectRecord.data, false);
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
        fulfillment: {
          kind: "physical_shipping",
          status: "shipping_required",
          message: "Payment received. Add shipping details to finish fulfillment."
        }
      }
    } as const;

    const first = admitCommerceEvent(state, event);
    const second = admitCommerceEvent(first.state, event);

    assert.equal(first.admitted, true);
    assert.equal(second.admitted, false);
    assert.equal(second.state.orders.length, 1);
    assert.equal(second.state.customers.length, 1);
    assert.equal(second.state.orders[0]?.status, "pending");
    assert.equal(second.state.orders[0]?.sealed, false);
    assert.equal(second.state.orders[0]?.fulfillment?.status, "shipping_required");
    assert.equal(second.state.orders[0]?.paymentRail, "receiz_wallet");
    assert.equal(second.state.orders[0]?.merchantReceizId, "boost.receiz.id");
    assert.equal(second.state.customers[0]?.email, "lena@example.com");
    assert.equal(second.state.proofEvents.length, 1);
  });

  it("normalizes Receiz payment webhooks into settled commerce events", () => {
    const event = commerceEventFromUnknown(
      {
        type: "payment.settled",
        data: {
          payment_id: "pay_1001",
          order_id: "ord_1001",
          tenant_host: "boost.receiz.app",
          merchant_receiz_id: "boost.receiz.id",
          customer_email: "buyer@example.com",
          customer_name: "Buyer Example",
          amount_cents: 1800,
          payment_rail: "card_fallback"
        }
      },
      "fallback.receiz.app"
    );

    assert.ok(event);
    assert.equal(event.type, "checkout.settled");
    assert.equal(event.id, "pay_1001");
    assert.equal(event.tenantHost, "boost.receiz.app");
    assert.equal(event.merchantReceizId, "boost.receiz.id");
    assert.equal(event.data.orderId, "ord_1001");
    assert.equal(event.data.totalLabel, "$18.00");
    assert.equal(event.data.paymentRail, "card_fallback");
    assert.equal(event.data.settlementStatus, "settled");
  });

  it("normalizes Receiz payment creation webhooks into pending commerce events", () => {
    const event = commerceEventFromUnknown(
      {
        type: "payment.created",
        data: {
          payment_id: "pay_pending_1001",
          tenant_host: "boost.receiz.app",
          merchant_receiz_id: "boost.receiz.id",
          amount_cents: 1800
        }
      },
      "fallback.receiz.app"
    );

    assert.ok(event);
    assert.equal(event.type, "checkout.created");
    assert.equal(event.id, "pay_pending_1001");
    assert.equal(event.data.totalLabel, "$18.00");
    assert.equal(event.data.settlementStatus, "pending");
  });

  it("normalizes Receiz refund webhooks into refunded commerce events", () => {
    const event = commerceEventFromUnknown(
      {
        type: "payment.refunded",
        data: {
          payment_id: "pay_refund_1001",
          order_id: "ord_1001",
          tenant_host: "boost.receiz.app",
          merchant_receiz_id: "boost.receiz.id",
          amount_cents: 1800
        }
      },
      "fallback.receiz.app"
    );

    assert.ok(event);
    assert.equal(event.type, "payment.refunded");
    assert.equal(event.id, "pay_refund_1001");
    assert.equal(event.data.orderId, "ord_1001");
    assert.equal(event.data.totalLabel, "$18.00");
    assert.equal(event.data.settlementStatus, "refunded");

    const admitted = admitCommerceEvent(baseState(), event);
    assert.equal(admitted.state.orders[0]?.status, "refunded");
    assert.equal(admitted.state.proofEvents[0]?.title, "PAYMENT_REFUNDED");
  });

  it("normalizes Receiz wallet transfer webhooks into wallet-settled commerce events", () => {
    const event = commerceEventFromUnknown(
      {
        event_type: "wallet.transfer.completed",
        transfer_id: "tr_1001",
        tenantHost: "boost.receiz.app",
        destinationReceizId: "boost.receiz.id",
        customerEmail: "wallet-buyer@example.com",
        amountUsd: "18.5"
      },
      "fallback.receiz.app"
    );

    assert.ok(event);
    assert.equal(event.type, "checkout.settled");
    assert.equal(event.id, "tr_1001");
    assert.equal(event.data.receiptId, "tr_1001");
    assert.equal(event.data.totalLabel, "$18.50");
    assert.equal(event.data.paymentRail, "receiz_wallet");
    assert.equal(event.data.settlementStatus, "settled");
  });

  it("rejects unsupported webhook event names", () => {
    assert.equal(commerceEventFromUnknown({ type: "profile.updated", data: {} }, "boost.receiz.app"), null);
  });
});
