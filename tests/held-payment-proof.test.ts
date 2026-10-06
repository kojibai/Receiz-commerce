import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_HELD_PAYMENT_PROOF_BYTES, paymentProofUsdLabel, verifyHeldPaymentProof } from "../src/lib/checkout/held-payment-proof";

const file = (value: unknown) => new Blob([JSON.stringify(value)], { type: "application/json" });

describe("Held native payment proof", () => {
  it("rejects a wallet balance, paid flag, and legacy receipt instead of admitting financial authority", async () => {
    for (const value of [
      { ok: true, wallet: { valueStates: { settledBalanceUsdCents: 5000 } } },
      { paid: true, receiptId: "caller-asserted-receipt" },
      { schema: "receiz.value.execution-receipt.v123", amountPhiMicro: "100" },
    ]) await assert.rejects(verifyHeldPaymentProof(file(value), "receiz-commerce-kit"), /recovery_file_required/);
  });

  it("lets the installed SDK reject a forged transition set, without fetching a projection", async () => {
    await assert.rejects(verifyHeldPaymentProof(file({
      schema: "receiz.portable-execution-transition-recovery.v124",
      transitionSet: { paid: true, members: [] },
    }), "receiz-commerce-kit"), /V124_/);
  });

  it("requires complete bytes, app binding, and a bounded original file", async () => {
    await assert.rejects(verifyHeldPaymentProof(file({}), ""), /application_required/);
    await assert.rejects(verifyHeldPaymentProof(new Blob([]), "receiz-commerce-kit"), /size_invalid/);
    const oversized = { size: MAX_HELD_PAYMENT_PROOF_BYTES + 1, arrayBuffer: async () => { throw new Error("must_not_read"); } };
    await assert.rejects(verifyHeldPaymentProof(oversized, "receiz-commerce-kit"), /size_invalid/);
    await assert.rejects(verifyHeldPaymentProof({ size: 12, arrayBuffer: async () => new ArrayBuffer(2) }, "receiz-commerce-kit"), /bytes_incomplete/);
    await assert.rejects(verifyHeldPaymentProof(new Blob([new Uint8Array([255])]), "receiz-commerce-kit"), /recovery_file_required/);
  });

  it("projects the proof's canonical USD cents without floating-point rounding", () => {
    assert.equal(paymentProofUsdLabel("0"), "$0.00");
    assert.equal(paymentProofUsdLabel("1234"), "$12.34");
    assert.equal(paymentProofUsdLabel("9007199254740993"), "$90071992547409.93");
    assert.throws(() => paymentProofUsdLabel("12.34"), /display_amount_invalid/);
  });
});
