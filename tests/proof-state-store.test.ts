import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreStateRecord } from "../src/lib/receiz/proof-state.js";
import {
  createInMemoryProofStateStore,
  createServerProofStateStoreRegistry
} from "../src/lib/receiz/proof-state-store.js";
import type { CommerceState } from "../src/types/domain.js";
import { baseState } from "./support/commerce-state.js";
import { receizAppendFixture } from "./support/receiz-append.js";

describe("Receiz proof state store", () => {
  it("adopts newest published tenant state from proof memory", async () => {
    const store = await createInMemoryProofStateStore("test-owner");
    const first = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      ...receizAppendFixture("2026-06-30T00:00:00.000Z")
    });
    const newest = buildStoreStateRecord(
      {
        ...baseState(),
        brand: { ...baseState().brand, name: "Boost Prime" }
      } as CommerceState,
      {
        actorReceizId: "boost.receiz.id",
        tenantHost: "boost.receiz.app",
        ...receizAppendFixture("2026-06-30T00:02:00.000Z")
      }
    );

    await store.admitStoreRecord(first);
    await store.admitStoreRecord(newest);

    const projected = store.projectHost(baseState(), "boost.receiz.app");

    assert.equal(projected.brand.name, "Boost Prime");
    assert.equal(store.snapshot().head.count, 2);
  });

  it("uses canonical append admission without manufacturing Kai proof", async () => {
    const store = await createInMemoryProofStateStore("pulse-owner");
    const first = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      recordedAt: "2099-01-01T00:00:00.000Z"
    });
    const authoritative = buildStoreStateRecord(
      {
        ...baseState(),
        brand: { ...baseState().brand, name: "Canonical Append Wins" }
      } as CommerceState,
      {
        actorReceizId: "boost.receiz.id",
        tenantHost: "boost.receiz.app",
        recordedAt: "2000-01-01T00:00:00.000Z"
      }
    );

    await store.admitStoreRecord(first);
    await store.admitStoreRecord(authoritative);

    assert.equal(store.projectHost(baseState(), "boost.receiz.app").brand.name, "Canonical Append Wins");
    const entriesById = new Map(store.snapshot().entries.map((entry) => [entry.id, entry]));
    assert.equal(entriesById.get(first.id)?.kaiUpulse, null);
    assert.equal(entriesById.get(authoritative.id)?.kaiUpulse, null);
    assert.equal(entriesById.get(first.id)?.projection?.admissionSchema, "receiz.app.store_state_admission.v1");
    assert.equal(entriesById.get(first.id)?.projection?.canonicalAppendOrdinal, 1);
    assert.equal(entriesById.get(authoritative.id)?.projection?.canonicalAppendOrdinal, 2);
  });

  it("projects saved tenant theme, content, and custom categories by subdomain", async () => {
    const store = await createInMemoryProofStateStore("test-owner");
    const saved = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Bjklock Supply", logoText: "bjk" },
      storefront: {
        ...baseState().storefront,
        homepageMode: "blog",
        headline: "Rare proof gear"
      },
      collections: [
        {
          id: "rare",
          name: "Rare gear",
          slug: "rare-gear",
          productIds: ["coffee-pack"],
          published: true
        }
      ]
    } as CommerceState;

    await store.admitStoreRecord(
      buildStoreStateRecord(saved, {
        actorReceizId: "bjklock.receiz.id",
        tenantHost: "bjklock.receiz.app",
        ...receizAppendFixture("2026-06-30T00:05:00.000Z")
      })
    );

    const projected = store.projectHost(baseState(), "bjklock.receiz.app");

    assert.equal(projected.brand.name, "Bjklock Supply");
    assert.equal(projected.storefront.homepageMode, "blog");
    assert.equal(projected.storefront.headline, "Rare proof gear");
    assert.equal(projected.collections[0]?.name, "Rare gear");
  });

  it("projects merchant-scoped publishes through the public tenant store", async () => {
    const registry = createServerProofStateStoreRegistry();
    const merchantStore = await registry.storeForOwner("bjklock.receiz.id");
    const publicStore = await registry.storeForOwner();
    const saved = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Bjklock Supply", logoText: "bjk" },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app",
        merchantReceizId: "bjklock.receiz.id"
      }
    } as CommerceState;

    await merchantStore.admitStoreRecord(
      buildStoreStateRecord(saved, {
        actorReceizId: "bjklock.receiz.id",
        tenantHost: "bjklock.receiz.app",
        ...receizAppendFixture("2026-06-30T00:08:00.000Z")
      })
    );

    const projected = publicStore.projectHost(baseState(), "bjklock.receiz.app");

    assert.equal(projected.brand.name, "Bjklock Supply");
    assert.equal(projected.hosting.merchantReceizId, "bjklock.receiz.id");
  });

  it("projects merchant-scoped checkout events through the public tenant store", async () => {
    const registry = createServerProofStateStoreRegistry();
    const merchantStore = await registry.storeForOwner("bjklock.receiz.id");
    const publicStore = await registry.storeForOwner();
    const saved = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Bjklock Supply", logoText: "bjk" },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app",
        merchantReceizId: "bjklock.receiz.id"
      }
    } as CommerceState;

    await merchantStore.admitStoreRecord(
      buildStoreStateRecord(saved, {
        actorReceizId: "bjklock.receiz.id",
        tenantHost: "bjklock.receiz.app",
        ...receizAppendFixture("2026-06-30T00:09:00.000Z")
      })
    );
    await merchantStore.admitCommerceEvent(saved, {
      schema: "receiz.app.commerce_event.v1",
      id: "checkout:bjklock.receiz.app:in_app_123",
      type: "checkout.requires_card",
      createdAt: "2026-06-30T00:10:00.000Z",
      tenantHost: "bjklock.receiz.app",
      merchantReceizId: "bjklock.receiz.id",
      data: {
        orderId: "order-123",
        checkoutSessionId: "in_app_123",
        customerId: "customer-buyer",
        customerEmail: "buyer@example.com",
        customerName: "Buyer Example",
        totalLabel: "$18.00",
        itemCount: 1,
        paymentRail: "card_fallback",
        settlementStatus: "card_required"
      }
    });

    const projected = publicStore.projectHost(baseState(), "bjklock.receiz.app");

    assert.equal(projected.brand.name, "Bjklock Supply");
    assert.equal(projected.orders.length, 1);
    assert.equal(projected.orders[0]?.id, "order-123");
    assert.equal(projected.orders[0]?.settlementStatus, "card_required");
    assert.equal(projected.customers[0]?.name, "Buyer Example");
  });

  it("projects subdomain checkout events when the tenant is opened by custom domain", async () => {
    const registry = createServerProofStateStoreRegistry();
    const merchantStore = await registry.storeForOwner("bjklock.receiz.id");
    const publicStore = await registry.storeForOwner();
    const saved = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Bjklock Supply", logoText: "bjk" },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app",
        liveUrl: "https://shop.bjklock.com",
        merchantReceizId: "bjklock.receiz.id",
        customDomain: {
          ...baseState().hosting.customDomain,
          domain: "shop.bjklock.com",
          status: "active",
          sslStatus: "valid",
          verified: true
        }
      }
    } as CommerceState;

    await merchantStore.admitStoreRecord(
      buildStoreStateRecord(saved, {
        actorReceizId: "bjklock.receiz.id",
        tenantHost: "shop.bjklock.com",
        ...receizAppendFixture("2026-06-30T00:11:00.000Z")
      })
    );
    await merchantStore.admitCommerceEvent(saved, {
      schema: "receiz.app.commerce_event.v1",
      id: "checkout:bjklock.receiz.app:in_app_456",
      type: "checkout.requires_card",
      createdAt: "2026-06-30T00:12:00.000Z",
      tenantHost: "bjklock.receiz.app",
      merchantReceizId: "bjklock.receiz.id",
      data: {
        orderId: "order-456",
        checkoutSessionId: "in_app_456",
        customerId: "customer-custom-domain",
        customerEmail: "domain-buyer@example.com",
        customerName: "Domain Buyer",
        totalLabel: "$24.00",
        itemCount: 1,
        paymentRail: "card_fallback",
        settlementStatus: "card_required"
      }
    });

    const projected = publicStore.projectHost(baseState(), "shop.bjklock.com");

    assert.equal(projected.brand.name, "Bjklock Supply");
    assert.equal(projected.orders.length, 1);
    assert.equal(projected.orders[0]?.id, "order-456");
    assert.equal(projected.customers[0]?.email, "domain-buyer@example.com");
  });

  it("admits a commerce event once and persists the known head", async () => {
    const store = await createInMemoryProofStateStore("test-owner");
    const event = {
      schema: "receiz.app.commerce_event.v1",
      id: "evt_1",
      type: "checkout.settled",
      createdAt: "2026-06-30T00:03:00.000Z",
      tenantHost: "boost.receiz.app",
      merchantReceizId: "boost.receiz.id",
      data: {
        orderId: "ord_1",
        customerEmail: "lena@example.com",
        totalLabel: "$18.00",
        paymentRail: "receiz_wallet",
        settlementStatus: "settled"
      }
    } as const;

    const first = await store.admitCommerceEvent(baseState(), event);
    const second = await store.admitCommerceEvent(first.state, event);

    assert.equal(first.admitted, true);
    assert.equal(second.admitted, false);
    assert.equal(second.state.orders.length, 1);
    assert.equal(store.knownHead(10).afterEntryId, "evt_1");
  });

  it("projects admitted commerce events into the host state", async () => {
    const store = await createInMemoryProofStateStore("test-owner");
    await store.admitStoreRecord(
      buildStoreStateRecord(baseState(), {
        actorReceizId: "boost.receiz.id",
        tenantHost: "boost.receiz.app",
        ...receizAppendFixture("2026-06-30T00:00:00.000Z")
      })
    );
    await store.admitCommerceEvent(baseState(), {
      schema: "receiz.app.commerce_event.v1",
      id: "evt_2",
      type: "checkout.settled",
      createdAt: "2026-06-30T00:03:00.000Z",
      tenantHost: "boost.receiz.app",
      merchantReceizId: "boost.receiz.id",
      data: {
        orderId: "ord_2",
        customerEmail: "maya@example.com",
        customerName: "Maya Chen",
        totalLabel: "$34.00",
        paymentRail: "receiz_wallet",
        settlementStatus: "settled"
      }
    });

    const projected = store.projectHost(baseState(), "boost.receiz.app");

    assert.equal(projected.orders.length, 1);
    assert.equal(projected.orders[0]?.id, "ord_2");
    assert.equal(projected.customers[0]?.email, "maya@example.com");
  });
});
