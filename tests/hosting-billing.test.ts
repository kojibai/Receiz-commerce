import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hostingBillingFromPlatformPayment,
  hostingPlanUpdateFromPlatformPayment
} from "../src/lib/hosting/platform-billing.js";
import { baseState } from "./support/commerce-state.js";

describe("hosting billing settlement", () => {
  it("does not mark sandbox platform billing as a paid hosting subscription", () => {
    const billing = hostingBillingFromPlatformPayment(baseState().billing, "pro", {
      ok: true,
      mode: "sandbox",
      paid: false,
      amountUsd: "49.00",
      message: "Set RECEIZ_PLATFORM_BILLING_MODE=live to charge through Receiz"
    });

    assert.equal(billing.status, "trial");
    assert.equal(billing.paymentMethodLabel, "Sandbox billing - payment not collected");
    assert.equal(billing.invoices[0]?.status, "open");
  });

  it("marks live or proof object platform billing as active only when the receipt is paid", () => {
    const billing = hostingBillingFromPlatformPayment(baseState().billing, "pro", {
      ok: true,
      mode: "proof_object_wallet_first",
      paid: true,
      amountUsd: "49.00",
      message: "Verified Receiz proof object authorized platform settlement."
    });

    assert.equal(billing.status, "active");
    assert.equal(billing.paymentMethodLabel, "Proof object wallet-first billing");
    assert.equal(billing.invoices[0]?.amountLabel, "$49.00");
    assert.equal(billing.invoices[0]?.status, "paid");
  });

  it("does not move to a paid hosting plan until payment is confirmed", () => {
    const current = { ...baseState().hosting, plan: "starter" as const };
    const result = hostingPlanUpdateFromPlatformPayment(current, "pro", {
      ok: true,
      mode: "proof_object_wallet_first",
      paid: false,
      amountUsd: "49.00",
      message: "Card funds the remaining delta."
    });

    assert.equal(result.ok, false);
    assert.equal(result.hosting.plan, current.plan);
    assert.match(result.message, /payment/i);
  });

  it("allows the free starter plan without paid settlement", () => {
    const result = hostingPlanUpdateFromPlatformPayment(baseState().hosting, "starter", {
      ok: true,
      mode: "no_charge",
      paid: true,
      amountUsd: "0.00"
    });

    assert.equal(result.ok, true);
    assert.equal(result.hosting.plan, "starter");
  });
});
