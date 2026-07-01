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
      localReceizIdConnected: true,
      localProofVerified: true
    });

    assert.equal(gate.ok, false);
    assert.equal(gate.eventType, "DOMAIN_CONNECTED");
    assert.equal(gate.message, "Sign in with Receiz ID before connecting a custom domain.");
    assert.equal(gate.statusLabel, "Receiz ID sign-in required");
  });

  it("does not accept local proof as a server-authorized merchant session", () => {
    const actions: MerchantServerAction[] = ["custom_domain", "verify_domain", "publish"];

    for (const action of actions) {
      const gate = merchantServerSessionRequirement({
        action,
        connected: false,
        handle: "local-only.receiz.id",
        localReceizIdConnected: true,
        localProofVerified: true
      });

      assert.equal(gate.ok, false);
      assert.match(gate.message, /Sign in with Receiz ID/);
    }
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
      handle: "owner.receiz.id"
    });
  });
});
