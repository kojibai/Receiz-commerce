import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { customerForAccountSurface, customerReceizHandle } from "../src/lib/storefront/customer-session.js";
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
  });
});
