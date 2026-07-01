import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkoutModeForAuthority,
  checkoutWalletAuthority,
  identitySealCheckoutFunding
} from "../src/lib/checkout/wallet-authority.js";

describe("Identity Seal checkout authority", () => {
  it("treats a verified Identity Seal as full wallet authority", () => {
    const authority = checkoutWalletAuthority({
      scopedReceizAccess: false,
      merchantSession: {
        auth: {
          receizId: {
            connected: true,
            handle: "buyer.receiz.id",
            localProofVerified: true
          }
        }
      }
    });

    assert.deepEqual(authority, {
      ok: true,
      handle: "buyer.receiz.id",
      source: "identity_seal"
    });

    assert.deepEqual(identitySealCheckoutFunding(1800), {
      strategy: "receiz_wallet_first",
      totalUsdCents: 1800,
      walletBalanceUsdCents: 1800,
      walletAppliedUsdCents: 1800,
      cardDeltaUsdCents: 0,
      totalLabel: "$18.00",
      walletBalanceLabel: "$18.00",
      walletAppliedLabel: "$18.00",
      cardDeltaLabel: "$0.00",
      cardRequired: false
    });
  });

  it("applies the Identity Seal wallet first and requires card for the remaining delta", () => {
    assert.deepEqual(identitySealCheckoutFunding(1800, 900), {
      strategy: "receiz_wallet_first",
      totalUsdCents: 1800,
      walletBalanceUsdCents: 900,
      walletAppliedUsdCents: 900,
      cardDeltaUsdCents: 900,
      totalLabel: "$18.00",
      walletBalanceLabel: "$9.00",
      walletAppliedLabel: "$9.00",
      cardDeltaLabel: "$9.00",
      cardRequired: true
    });
  });

  it("does not grant wallet authority to an unverified local identity", () => {
    const authority = checkoutWalletAuthority({
      scopedReceizAccess: false,
      merchantSession: {
        auth: {
          receizId: {
            connected: true,
            handle: "buyer.receiz.id",
            localProofVerified: false
          }
        }
      }
    });

    assert.equal(authority.ok, false);
    assert.match(authority.message, /Sign in with Receiz ID/);
  });

  it("uses the Receiz checkout rail when Identity Seal wallet authority is present", () => {
    assert.equal(
      checkoutModeForAuthority({
        configuredCheckoutMode: undefined,
        tenantSurface: false,
        authMode: undefined,
        scopedReceizAccess: false,
        identitySealAuthorized: true
      }),
      "receiz"
    );

    assert.equal(
      checkoutModeForAuthority({
        configuredCheckoutMode: undefined,
        tenantSurface: false,
        authMode: undefined,
        scopedReceizAccess: false,
        identitySealAuthorized: false
      }),
      "mock"
    );
  });
});
