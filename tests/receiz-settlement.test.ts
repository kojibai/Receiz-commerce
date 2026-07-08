import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createWalletFirstReceizSettlement } from "../src/lib/checkout/receiz-settlement.js";
import type { ReceizCommerceAdapter } from "../src/lib/receiz/adapter.js";

function fakeReceiz(input: {
  walletBalanceUsdCents: string;
  checkoutUrl?: string;
}) {
  const calls: Array<{ name: string; body?: Record<string, unknown>; idempotencyKey?: string }> = [];
  const adapter = {
    async connectWallet() {
      calls.push({ name: "connectWallet" });
      return { ok: true, userId: "payer_user", balanceUsdCents: input.walletBalanceUsdCents };
    },
    async connectTransfer(body: Record<string, unknown>, idempotencyKey?: string) {
      calls.push({ name: "connectTransfer", body, idempotencyKey });
      return {
        ok: true,
        transferId: "transfer_wallet",
        ledgerEventId: "ledger_wallet",
        proofBundle: { schema: "proof.wallet.transfer" }
      };
    },
    async checkoutSession(query: { checkoutSessionId?: string }) {
      calls.push({ name: "checkoutSession", body: query });
      return {
        ok: true,
        checkoutSessionId: query.checkoutSessionId,
        checkoutUrl: input.checkoutUrl ?? "https://receiz.test/pay/refreshed",
        status: "open"
      };
    },
    async checkout(body: Record<string, unknown>) {
      calls.push({ name: "checkout", body });
      return {
        ok: true,
        checkoutSessionId: "checkout_card_delta",
        checkoutUrl: input.checkoutUrl,
        status: "open"
      };
    }
  } as unknown as ReceizCommerceAdapter;

  return { adapter, calls };
}

describe("Receiz wallet-first settlement", () => {
  it("moves wallet funds to the recipient when the wallet covers the full amount", async () => {
    const { adapter, calls } = fakeReceiz({ walletBalanceUsdCents: "5000" });

    const settlement = await createWalletFirstReceizSettlement({
      receiz: adapter,
      amountUsd: "49.00",
      tenantHost: "merchant.receiz.app",
      recipientUserId: "merchant_user",
      idempotencyKey: "order_123",
      note: "Merchant order"
    });

    assert.equal(settlement.paid, true);
    assert.equal(settlement.settlementStatus, "settled");
    assert.equal(settlement.paymentRail, "receiz_wallet");
    assert.equal(settlement.funding.walletAppliedLabel, "$49.00");
    assert.equal(settlement.funding.cardDeltaLabel, "$0.00");
    assert.equal(settlement.checkoutSession, null);
    assert.deepEqual(calls.map((call) => call.name), ["connectWallet", "connectTransfer"]);
    assert.equal(calls[1]?.body?.recipientUserId, "merchant_user");
    assert.equal(calls[1]?.body?.amountUsd, "49.00");
  });

  it("moves wallet funds and creates a hosted card checkout for the delta", async () => {
    const { adapter, calls } = fakeReceiz({
      walletBalanceUsdCents: "900",
      checkoutUrl: "https://receiz.test/pay/card-delta"
    });

    const settlement = await createWalletFirstReceizSettlement({
      receiz: adapter,
      amountUsd: "18.00",
      tenantHost: "merchant.receiz.app",
      recipientUserId: "merchant_user",
      idempotencyKey: "order_456",
      note: "Merchant order",
      customerEmail: "buyer@example.com",
      successUrl: "https://merchant.receiz.app/?checkout=success",
      cancelUrl: "https://merchant.receiz.app/?checkout=cancel"
    });

    assert.equal(settlement.paid, false);
    assert.equal(settlement.settlementStatus, "card_required");
    assert.equal(settlement.paymentRail, "wallet_card_split");
    assert.equal(settlement.funding.walletAppliedLabel, "$9.00");
    assert.equal(settlement.funding.cardDeltaLabel, "$9.00");
    assert.equal(settlement.checkoutSession?.checkoutUrl, "https://receiz.test/pay/card-delta");
    assert.deepEqual(calls.map((call) => call.name), ["connectWallet", "checkout", "connectTransfer"]);
    assert.equal(calls[1]?.body?.amountUsd, "9.00");
    assert.equal(calls[1]?.body?.uiMode, "hosted");
    assert.equal(calls[1]?.body?.recipientUserId, "merchant_user");
    assert.equal(calls[2]?.body?.amountUsd, "9.00");
  });
});
