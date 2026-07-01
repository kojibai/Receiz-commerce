import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  merchantServerSessionRequirement,
  type MerchantServerAction
} from "../src/lib/hosting/merchant-session-gate.js";

describe("merchant server session gate", () => {
  it("blocks custom domain actions without a signed Receiz Connect session", () => {
    const gate = merchantServerSessionRequirement({
      action: "custom_domain",
      connected: false,
      localReceizIdConnected: false,
      localProofVerified: false
    });

    assert.equal(gate.ok, false);
    assert.equal(gate.eventType, "DOMAIN_CONNECTED");
    assert.equal(gate.message, "Sign in with Receiz ID before connecting a custom domain.");
    assert.equal(gate.statusLabel, "Receiz ID sign-in required");
  });

  it("accepts a verified Identity Seal session as a merchant session", () => {
    const actions: MerchantServerAction[] = ["custom_domain", "verify_domain", "publish"];

    for (const action of actions) {
      const gate = merchantServerSessionRequirement({
        action,
        connected: false,
        handle: "local-only.receiz.id",
        localReceizIdConnected: true,
        localProofVerified: true
      });

      assert.deepEqual(gate, {
        ok: true,
        handle: "local-only.receiz.id",
        source: "identity_seal"
      });
    }
  });

  it("does not accept an unverified local Receiz ID as a merchant session", () => {
    const gate = merchantServerSessionRequirement({
      action: "publish",
      connected: false,
      handle: "local-only.receiz.id",
      localReceizIdConnected: true,
      localProofVerified: false
    });

    assert.equal(gate.ok, false);
    assert.match(gate.message, /Sign in with Receiz ID/);
  });

  it("falls back to a stable handle for verified local Identity Seal sessions without a handle", () => {
    const gate = merchantServerSessionRequirement({
      action: "publish",
      connected: false,
      handle: "",
      localReceizIdConnected: true,
      localProofVerified: true
    });

    assert.deepEqual(gate, {
      ok: true,
      handle: "identity-seal",
      source: "identity_seal"
    });
  });

  it("prefers the Receiz Connect profile when both server and local sessions are present", () => {
    const gate = merchantServerSessionRequirement({
      action: "publish",
      connected: true,
      handle: "owner.receiz.id",
      localReceizIdConnected: true,
      localProofVerified: true
    });

    assert.deepEqual(gate, {
      ok: true,
      handle: "owner.receiz.id",
      source: "receiz_connect"
    });
  });

  it("allows merchant server actions when a Receiz Connect profile is signed in", () => {
    const gate = merchantServerSessionRequirement({
      action: "publish",
      connected: true,
      handle: "owner.receiz.id",
      localReceizIdConnected: false,
      localProofVerified: false
    });

    assert.deepEqual(gate, {
      ok: true,
      handle: "owner.receiz.id",
      source: "receiz_connect"
    });
  });

  it("allows a server Receiz session even when userinfo does not expose a handle", () => {
    const gate = merchantServerSessionRequirement({
      action: "publish",
      connected: true,
      handle: "",
      localReceizIdConnected: true,
      localProofVerified: true
    });

    assert.deepEqual(gate, {
      ok: true,
      handle: "receiz-connected",
      source: "receiz_connect"
    });
  });
});
