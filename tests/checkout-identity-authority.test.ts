import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkoutModeForAuthority,
  checkoutWalletAuthority,
  proofObjectCheckoutFunding
} from "../src/lib/checkout/wallet-authority.js";

describe("Receiz proof object checkout authority", () => {
  it("treats a verified proof object as full wallet authority", () => {
    const authority = checkoutWalletAuthority({
      scopedReceizAccess: false,
      proofObject: {
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
      source: "proof_object"
    });

    assert.deepEqual(proofObjectCheckoutFunding(1800), {
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

  it("applies the proof object wallet first and requires card for the remaining delta", () => {
    assert.deepEqual(proofObjectCheckoutFunding(1800, 900), {
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
      proofObject: {
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
    assert.match(authority.message, /verified Receiz proof object/);
  });

  it("uses the Receiz checkout rail when proof object wallet authority is present", () => {
    assert.equal(
      checkoutModeForAuthority({
        configuredCheckoutMode: undefined,
        tenantSurface: false,
        authMode: undefined,
        scopedReceizAccess: false,
        proofObjectAuthorized: true
      }),
      "receiz"
    );

    assert.equal(
      checkoutModeForAuthority({
        configuredCheckoutMode: undefined,
        tenantSurface: false,
        authMode: undefined,
        scopedReceizAccess: false,
        proofObjectAuthorized: false
      }),
      "mock"
    );
  });
});
