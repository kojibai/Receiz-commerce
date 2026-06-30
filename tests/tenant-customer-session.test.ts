import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyBrowserReceizIdSession,
  applyTenantCustomerSession,
  BROWSER_RECEIZ_ID_SESSION_KEY,
  buildBrowserReceizIdSession,
  buildTenantCustomerSession,
  parseBrowserReceizIdSession,
  parseTenantCustomerSession,
  tenantCustomerSessionKey
} from "../src/lib/storefront/tenant-customer-session.js";
import { baseState } from "./support/commerce-state.js";

describe("tenant customer sessions", () => {
  it("stores browser-local Receiz ID proof memory without storefront content", () => {
    const state = {
      ...baseState(),
      auth: {
        ...baseState().auth,
        signedInAs: "customer" as const,
        customer: {
          ...baseState().auth.customer,
          name: "Jordan Buyer",
          email: "jordan@example.com",
          receizHandle: "jordan.receiz.id"
        },
        receizId: {
          ...baseState().auth.receizId,
          handle: "jordan.receiz.id",
          displayName: "Jordan Buyer"
        }
      }
    };

    const session = buildBrowserReceizIdSession(state, { schema: "receiz.key.v1" }, "2026-06-30T12:00:00.000Z");

    assert.equal(BROWSER_RECEIZ_ID_SESSION_KEY, "receiz-app-commerce-state-v1:browser-receiz-id-session-v1");
    assert.equal(session?.receizId.handle, "jordan.receiz.id");
    assert.deepEqual(session?.keyFile, { schema: "receiz.key.v1" });
    assert.equal("products" in (session as object), false);
    assert.equal("brand" in (session as object), false);
  });

  it("projects an existing browser Receiz ID into a fresh tenant store", () => {
    const session = buildBrowserReceizIdSession(
      {
        ...baseState(),
        auth: {
          ...baseState().auth,
          signedInAs: "customer" as const,
          customer: {
            ...baseState().auth.customer,
            name: "Jordan Buyer",
            email: "jordan@example.com",
            receizHandle: "jordan.receiz.id",
            orderIds: ["order-other-store"],
            rewardIds: ["reward-other-store"],
            assetIds: ["asset-other-store"],
            beans: 42,
            streak: "4x"
          },
          receizId: {
            ...baseState().auth.receizId,
            handle: "jordan.receiz.id",
            displayName: "Jordan Buyer"
          }
        }
      },
      undefined,
      "2026-06-30T12:00:00.000Z"
    );

    const state = applyBrowserReceizIdSession(
      {
        ...baseState(),
        brand: {
          ...baseState().brand,
          name: "Fresh Store"
        },
        customers: []
      },
      session
    );

    assert.equal(state.brand.name, "Fresh Store");
    assert.equal(state.auth.signedInAs, "customer");
    assert.equal(state.auth.customer.name, "Jordan Buyer");
    assert.equal(state.auth.customer.receizHandle, "jordan.receiz.id");
    assert.deepEqual(state.auth.customer.orderIds, []);
    assert.deepEqual(state.auth.customer.rewardIds, []);
    assert.deepEqual(state.auth.customer.assetIds, []);
    assert.equal(state.auth.customer.beans, 0);
    assert.equal(state.auth.receizId.connected, true);
  });

  it("stores only a scoped customer Receiz ID session for tenant storefronts", () => {
    const state = {
      ...baseState(),
      auth: {
        ...baseState().auth,
        signedInAs: "customer" as const,
        customer: {
          ...baseState().auth.customer,
          id: "customer-jordan",
          name: "Jordan Buyer",
          email: "jordan@example.com",
          receizHandle: "jordan.receiz.id"
        },
        receizId: {
          ...baseState().auth.receizId,
          connected: true,
          handle: "jordan.receiz.id",
          displayName: "Jordan Buyer"
        }
      }
    };

    const session = buildTenantCustomerSession(state, "boost.receiz.app", "2026-06-30T12:00:00.000Z");

    assert.equal(session?.tenantHost, "boost.receiz.app");
    assert.equal(session?.customer.name, "Jordan Buyer");
    assert.equal(session?.receizId.handle, "jordan.receiz.id");
    assert.equal("products" in (session as object), false);
    assert.equal("brand" in (session as object), false);
  });

  it("does not build a session for a guest or admin workspace", () => {
    assert.equal(buildTenantCustomerSession(baseState(), "boost.receiz.app"), null);

    const guest = {
      ...baseState(),
      auth: {
        ...baseState().auth,
        receizId: {
          ...baseState().auth.receizId,
          connected: false
        }
      }
    };

    assert.equal(buildTenantCustomerSession(guest, "boost.receiz.app"), null);
  });

  it("restores a tenant customer session without changing storefront content", () => {
    const base = baseState();
    const session = buildTenantCustomerSession(
      {
        ...base,
        auth: {
          ...base.auth,
          signedInAs: "customer" as const,
          customer: {
            ...base.auth.customer,
            id: "customer-jordan",
            name: "Jordan Buyer",
            email: "jordan@example.com",
            receizHandle: "jordan.receiz.id"
          },
          receizId: {
            ...base.auth.receizId,
            handle: "jordan.receiz.id",
            displayName: "Jordan Buyer"
          }
        }
      },
      "boost.receiz.app"
    );

    const state = applyTenantCustomerSession(
      {
        ...base,
        brand: {
          ...base.brand,
          name: "Live Brand"
        },
        products: [
          {
            ...base.products[0],
            name: "Live Product"
          }
        ],
        customers: []
      },
      session
    );

    assert.equal(state.brand.name, "Live Brand");
    assert.equal(state.products[0]?.name, "Live Product");
    assert.equal(state.auth.signedInAs, "customer");
    assert.equal(state.auth.customer.name, "Jordan Buyer");
    assert.equal(state.customers[0]?.receizHandle, "jordan.receiz.id");
  });

  it("parses valid sessions and rejects invalid storage", () => {
    const key = tenantCustomerSessionKey("receiz-app-commerce-state-v1:tenant:boost.receiz.app");
    const session = buildTenantCustomerSession(
      {
        ...baseState(),
        auth: {
          ...baseState().auth,
          signedInAs: "customer" as const
        }
      },
      "boost.receiz.app",
      "2026-06-30T12:00:00.000Z"
    );

    assert.equal(key, "receiz-app-commerce-state-v1:tenant:boost.receiz.app:customer-session-v1");
    assert.equal(parseTenantCustomerSession(JSON.stringify(session))?.tenantHost, "boost.receiz.app");
    assert.equal(parseBrowserReceizIdSession(JSON.stringify(buildBrowserReceizIdSession(baseState())))?.receizId.handle, "boost.receiz.id");
    assert.equal(parseBrowserReceizIdSession("{bad json"), null);
    assert.equal(parseBrowserReceizIdSession(JSON.stringify({ version: 1, customer: {} })), null);
    assert.equal(parseTenantCustomerSession("{bad json"), null);
    assert.equal(parseTenantCustomerSession(JSON.stringify({ version: 1, customer: {} })), null);
  });
});
