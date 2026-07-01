import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyLocalReceizIdentitySession } from "../src/lib/storefront/local-identity-session.js";
import { customerForAccountSurface, customerReceizHandle } from "../src/lib/storefront/customer-session.js";
import { baseState } from "./support/commerce-state.js";

describe("local Receiz identity sessions", () => {
  it("turns tenant-local identity restore into a scoped customer account", () => {
    const state = applyLocalReceizIdentitySession(
      {
        ...baseState(),
        auth: {
          ...baseState().auth,
          signedInAs: "admin"
        }
      },
      {
        accountImageLabel: "identity-seal.png",
        artifactKind: "identity_seal",
        artifactStatus: "verified",
        displayName: "Jordan Buyer",
        handle: "jordan.receiz.id",
        keyId: "rzid_jordan",
        localProofVerified: true,
        loginMode: "restored_identity_artifact",
        portableStateStatus: "verified",
        statusLabel: "Identity artifact locally verified"
      },
      true
    );

    const customer = customerForAccountSurface(state, true);

    assert.equal(state.auth.signedInAs, "customer");
    assert.equal(customer.name, "Jordan Buyer");
    assert.equal(customerReceizHandle(state, customer), "jordan.receiz.id");
    assert.equal(state.auth.receizId.accountImageLabel, "identity-seal.png");
  });

  it("does not convert the platform workspace into a customer session", () => {
    const state = applyLocalReceizIdentitySession(
      baseState(),
      {
        displayName: "Platform Owner",
        handle: "owner.receiz.id",
        loginMode: "new_receiz_id",
        statusLabel: "New Receiz ID created"
      },
      false
    );

    assert.equal(state.auth.signedInAs, baseState().auth.signedInAs);
    assert.equal(state.auth.receizId.handle, "owner.receiz.id");
  });

  it("turns platform proof login into a user-owned empty merchant workspace", () => {
    const state = applyLocalReceizIdentitySession(
      baseState(),
      {
        accountImageLabel: "identity-seal.png",
        artifactKind: "identity_seal",
        artifactStatus: "verified",
        displayName: "BJ Klock",
        handle: "bjklock.receiz.id",
        keyId: "rzid_bjklock",
        localProofVerified: true,
        loginMode: "restored_identity_artifact",
        portableStateStatus: "verified",
        statusLabel: "Identity artifact locally verified"
      },
      false
    );

    assert.equal(state.auth.signedInAs, "admin");
    assert.equal(state.auth.receizId.handle, "bjklock.receiz.id");
    assert.equal(state.auth.workspaceOwnerId, "bjklock.receiz.id");
    assert.equal(state.brand.name, "BJ Klock");
    assert.equal(state.brand.logoText, "bjklock");
    assert.equal(state.hosting.tenantSlug, "bjklock");
    assert.equal(state.hosting.subdomain, "bjklock.receiz.app");
    assert.equal(state.hosting.merchantReceizId, "bjklock.receiz.id");
    assert.equal(state.hosting.plan, "starter");
    assert.equal(state.hosting.published, false);
    assert.equal(state.billing.status, "trial");
    assert.equal(state.billing.monthlyTotalLabel, "$0 / mo");
    assert.deepEqual(state.products, []);
    assert.deepEqual(state.collections, []);
    assert.deepEqual(state.pages, []);
    assert.deepEqual(state.blogPosts, []);
    assert.equal(JSON.stringify(state).includes("Boost"), false);
  });
});
