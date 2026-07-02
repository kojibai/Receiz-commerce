import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  merchantLocalProofObjectFromState,
  merchantProofAuthorityRequirement,
  type MerchantAuthorityAction
} from "../src/lib/hosting/merchant-proof-authority.js";

describe("merchant proof authority gate", () => {
  it("blocks custom domain actions without a verified proof object or Receiz ID continuation", () => {
    const gate = merchantProofAuthorityRequirement({
      action: "custom_domain",
      delegatedPermission: false,
      localReceizIdConnected: false,
      localProofVerified: false
    });

    assert.equal(gate.ok, false);
    assert.equal(gate.eventType, "DOMAIN_CONNECTED");
    assert.equal(gate.message, "Create or restore a verified Receiz proof object in app before connecting a custom domain.");
    assert.equal(gate.statusLabel, "Receiz proof object required");
  });

  it("accepts a verified Identity Seal proof object as full merchant authority", () => {
    const actions: MerchantAuthorityAction[] = [
      "account",
      "billing",
      "checkout",
      "custom_domain",
      "publish",
      "verify_domain",
      "wallet"
    ];

    for (const action of actions) {
      const gate = merchantProofAuthorityRequirement({
        action,
        delegatedPermission: false,
        handle: "local-only.receiz.id",
        localReceizIdConnected: true,
        localProofVerified: true
      });

      assert.deepEqual(gate, {
        ok: true,
        handle: "local-only.receiz.id",
        source: "proof_object"
      });
    }
  });

  it("carries the local Identity Seal key file for signed public-store publish", () => {
    const keyFile = {
      schema: "receiz.key.v1",
      crypto: {
        publicKeyRawB64u: "public-key"
      }
    };

    const proof = merchantLocalProofObjectFromState({
      keyFile,
      auth: {
        receizId: {
          connected: true,
          displayName: "Local Merchant",
          handle: "local-only.receiz.id",
          localProofVerified: true
        }
      }
    });

    assert.equal(proof.connected, true);
    assert.equal(proof.localProofVerified, true);
    assert.equal(proof.handle, "local-only.receiz.id");
    assert.deepEqual(proof.keyFile, keyFile);
  });

  it("does not accept an unverified local proof object as authority", () => {
    const gate = merchantProofAuthorityRequirement({
      action: "wallet",
      delegatedPermission: false,
      handle: "local-only.receiz.id",
      localReceizIdConnected: true,
      localProofVerified: false
    });

    assert.equal(gate.ok, false);
    assert.match(gate.message, /verified Receiz proof object/);
  });

  it("falls back to a stable handle for verified local Identity Seal proof objects without a handle", () => {
    const gate = merchantProofAuthorityRequirement({
      action: "publish",
      delegatedPermission: false,
      handle: "",
      localReceizIdConnected: true,
      localProofVerified: true
    });

    assert.deepEqual(gate, {
      ok: true,
      handle: "identity-seal",
      source: "proof_object"
    });
  });

  it("prefers delegated permission when both delegated permission and local proof are present", () => {
    const gate = merchantProofAuthorityRequirement({
      action: "publish",
      delegatedPermission: true,
      handle: "owner.receiz.id",
      localReceizIdConnected: true,
      localProofVerified: true
    });

    assert.deepEqual(gate, {
      ok: true,
      handle: "owner.receiz.id",
      source: "delegated_permission"
    });
  });

  it("allows merchant actions when delegated Connect permission is present", () => {
    const gate = merchantProofAuthorityRequirement({
      action: "publish",
      delegatedPermission: true,
      handle: "owner.receiz.id",
      localReceizIdConnected: false,
      localProofVerified: false
    });

    assert.deepEqual(gate, {
      ok: true,
      handle: "owner.receiz.id",
      source: "delegated_permission"
    });
  });

  it("allows delegated permission even when userinfo does not expose a handle", () => {
    const gate = merchantProofAuthorityRequirement({
      action: "publish",
      delegatedPermission: true,
      handle: "",
      localReceizIdConnected: true,
      localProofVerified: true
    });

    assert.deepEqual(gate, {
      ok: true,
      handle: "receiz-connected",
      source: "delegated_permission"
    });
  });
});
