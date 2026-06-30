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
});
