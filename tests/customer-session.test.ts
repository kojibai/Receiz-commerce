import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { customerForAccountSurface, customerReceizHandle, customerReceizOwnerId } from "../src/lib/storefront/customer-session.js";
import { baseState } from "./support/commerce-state.js";

describe("customer account surface", () => {
  it("shows a guest customer on logged-out tenant stores", () => {
    const state = {
      ...baseState(),
      auth: {
        ...baseState().auth,
        signedInAs: "customer" as const,
        receizId: {
          ...baseState().auth.receizId,
          connected: false
        }
      }
    };
    const customer = customerForAccountSurface(state, true);

    assert.equal(customer.name, "Your account");
    assert.equal(customer.email, "Continue with Receiz ID");
    assert.equal(customerReceizHandle(state, customer), "Receiz ID not connected");
    assert.equal(customerReceizOwnerId(state, customer, true), null);
  });

  it("uses the logged-in customer handle instead of the merchant store identity", () => {
    const state = {
      ...baseState(),
      auth: {
        ...baseState().auth,
        signedInAs: "customer" as const,
        customer: {
          ...baseState().auth.customer,
          name: "Jordan Buyer",
          receizHandle: "jordan.receiz.id"
        },
        receizId: {
          ...baseState().auth.receizId,
          connected: true,
          handle: "merchant.receiz.id"
        }
      }
    };
    const customer = customerForAccountSurface(state, true);

    assert.equal(customer.name, "Jordan Buyer");
    assert.equal(customerReceizHandle(state, customer), "jordan.receiz.id");
    assert.equal(customerReceizOwnerId(state, customer, true), "jordan.receiz.id");
  });

  it("does not show stored merchant demo customers to tenant visitors", () => {
    const state = {
      ...baseState(),
      customers: [
        {
          ...baseState().auth.customer,
          id: "demo-customer",
          name: "Demo Person",
          email: "demo@example.com"
        }
      ],
      auth: {
        ...baseState().auth,
        signedInAs: "admin" as const,
        receizId: {
          ...baseState().auth.receizId,
          connected: true,
          handle: "merchant.receiz.id"
        }
      }
    };
    const customer = customerForAccountSurface(state, true);

    assert.equal(customer.name, "Your account");
    assert.equal(customer.email, "Continue with Receiz ID");
    assert.equal(customerReceizHandle(state, customer, true), "Receiz ID not connected");
    assert.equal(customerReceizOwnerId(state, customer, true), null);
  });

  it("never promotes connection status text or unverified state into a vault owner", () => {
    const base = baseState();
    const customer = { ...base.auth.customer, receizHandle: "Receiz ID not connected" };
    const state = {
      ...base,
      auth: {
        ...base.auth,
        customer,
        receizId: { ...base.auth.receizId, connected: true, localProofVerified: false }
      }
    };

    assert.equal(customerReceizOwnerId(state, customer, true), null);
  });
});
