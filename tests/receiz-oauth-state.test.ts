import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  packReceizOAuthState,
  packReceizSessionTicket,
  unpackReceizOAuthState,
  unpackReceizSessionTicket
} from "../src/lib/receiz/oauth-state.js";

const secret = "test-secret-for-receiz-commerce-oauth";

describe("Receiz OAuth state bridge", () => {
  it("round-trips host-scoped oauth state with pkce verifier and return path", () => {
    const packed = packReceizOAuthState(
      {
        flowNonce: "flow-nonce",
        verifier: "pkce-verifier",
        returnTo: "/account?tab=rewards",
        sessionScope: "receiz-app-commerce-state-v1:tenant:bjklock.receiz.app",
        startOrigin: "https://bjklock.receiz.app"
      },
      secret
    );

    const unpacked = unpackReceizOAuthState(packed, secret);

    assert.equal(unpacked.verifier, "pkce-verifier");
    assert.equal(unpacked.returnTo, "/account?tab=rewards");
    assert.equal(unpacked.sessionScope, "receiz-app-commerce-state-v1:tenant:bjklock.receiz.app");
    assert.equal(unpacked.startOrigin, "https://bjklock.receiz.app");
  });

  it("round-trips a short-lived tenant session ticket", () => {
    const ticket = packReceizSessionTicket(
      {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 3600,
        returnTo: "/",
        sessionScope: "receiz-app-commerce-state-v1:tenant:shop.example.com",
        flowNonce: "flow-nonce",
        startOrigin: "https://shop.example.com"
      },
      secret
    );

    const unpacked = unpackReceizSessionTicket(ticket, secret);

    assert.equal(unpacked.accessToken, "access-token");
    assert.equal(unpacked.refreshToken, "refresh-token");
    assert.equal(unpacked.sessionScope, "receiz-app-commerce-state-v1:tenant:shop.example.com");
  });

  it("rejects tampered state", () => {
    const packed = packReceizOAuthState(
      {
        flowNonce: "flow-nonce",
        verifier: "pkce-verifier",
        returnTo: "/",
        sessionScope: "scope",
        startOrigin: "https://receiz.app"
      },
      secret
    );

    assert.throws(() => unpackReceizOAuthState(`${packed}x`, secret), /Invalid Receiz OAuth state/);
  });
});
