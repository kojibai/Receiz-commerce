import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accountRouteActiveFromMobileView,
  accountRouteSessionKind,
  shouldAutoResolveAccountRouteSession,
  shouldShowAccountIdentityEntry
} from "../src/lib/storefront/account-route-session.js";

describe("account route session resolution", () => {
  it("treats receiz.app account routes as merchant account routes", () => {
    assert.equal(accountRouteSessionKind(false), "merchant");
    assert.equal(accountRouteActiveFromMobileView("account"), true);
  });

  it("auto-resolves an unsigned platform account route instead of showing the login prompt", () => {
    const input = {
      accountRouteActive: true,
      identityActionsReady: true,
      receizConnected: false,
      resolvingAccountSession: false
    };

    assert.equal(shouldAutoResolveAccountRouteSession(input), true);
    assert.equal(shouldShowAccountIdentityEntry(input), false);
  });

  it("keeps the manual login fallback outside the account route", () => {
    assert.equal(
      shouldShowAccountIdentityEntry({
        accountRouteActive: false,
        identityActionsReady: true,
        receizConnected: false,
        resolvingAccountSession: false
      }),
      true
    );
  });

  it("does not change tenant account routing semantics", () => {
    assert.equal(accountRouteSessionKind(true), "customer");
  });
});
