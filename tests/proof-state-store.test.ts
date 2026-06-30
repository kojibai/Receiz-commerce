import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreStateRecord } from "../src/lib/receiz/proof-state.js";
import { createInMemoryProofStateStore } from "../src/lib/receiz/proof-state-store.js";
import type { CommerceState } from "../src/types/domain.js";
import { baseState } from "./support/commerce-state.js";

describe("Receiz proof state store", () => {
  it("adopts newest published tenant state from proof memory", async () => {
    const store = await createInMemoryProofStateStore("test-owner");
    const first = buildStoreStateRecord(baseState(), {
      actorReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      recordedAt: "2026-06-30T00:00:00.000Z"
    });
    const newest = buildStoreStateRecord(
      {
        ...baseState(),
        brand: { ...baseState().brand, name: "Boost Prime" }
      } as CommerceState,
      {
        actorReceizId: "boost.receiz.id",
        tenantHost: "boost.receiz.app",
        recordedAt: "2026-06-30T00:02:00.000Z"
      }
    );

    await store.admitStoreRecord(first);
    await store.admitStoreRecord(newest);

    const projected = store.projectHost(baseState(), "boost.receiz.app");

    assert.equal(projected.brand.name, "Boost Prime");
    assert.equal(store.snapshot().head.count, 2);
  });

  it("projects saved tenant theme, content, and custom categories by subdomain", async () => {
    const store = await createInMemoryProofStateStore("test-owner");
    const saved = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Bjklock Supply", logoText: "bjk" },
      storefront: {
        ...baseState().storefront,
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
        recordedAt: "2026-06-30T00:05:00.000Z"
      })
    );

    const projected = store.projectHost(baseState(), "bjklock.receiz.app");

    assert.equal(projected.brand.name, "Bjklock Supply");
    assert.equal(projected.storefront.headline, "Rare proof gear");
    assert.equal(projected.collections[0]?.name, "Rare gear");
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
        recordedAt: "2026-06-30T00:00:00.000Z"
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
