import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createWalletFirstReceizSettlement } from "../src/lib/checkout/receiz-settlement.js";
import type { ReceizCommerceAdapter } from "../src/lib/receiz/adapter.js";

const connectedBuyer = { buyerAuthenticated: true, buyerUserId: "payer_user" };

function fakeReceiz(input: {
  walletBalanceUsdCents: string;
  checkoutUrl?: string;
  checkoutStatus?: string;
  transferOk?: boolean;
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
        ok: input.transferOk ?? true,
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
        status: input.checkoutStatus ?? "open"
      };
    },
    async checkout(body: Record<string, unknown>) {
      calls.push({ name: "checkout", body });
      return {
        ok: true,
        checkoutSessionId: "checkout_card_delta",
        checkoutUrl: input.checkoutUrl,
        status: input.checkoutStatus ?? "open"
      };
    }
  } as unknown as ReceizCommerceAdapter;

  return { adapter, calls };
}

describe("Receiz wallet-first settlement", () => {
  it("requires an explicit payer before reading a wallet and rejects a receiver's wallet substituted for it", async () => {
    const { adapter, calls } = fakeReceiz({ walletBalanceUsdCents: "0" });
    const input = { receiz: adapter, amountUsd: "49.00", tenantHost: "seller.receiz.app", recipientUserId: "platform_receiver",
      merchantUsername: "bjklock", buyerAuthenticated: true, idempotencyKey: "upgrade_roles", note: "Account upgrade" };
    await assert.rejects(createWalletFirstReceizSettlement(input), /checkout_buyer_identity_required/);
    assert.deepEqual(calls, []);
    adapter.connectWallet = async () => ({ ok: true, userId: "platform_receiver", balanceUsdCents: "5000" });
    await assert.rejects(createWalletFirstReceizSettlement({ ...input, buyerUserId: "upgrading_merchant" }), /checkout_buyer_wallet_mismatch/);
    assert.deepEqual(calls, [], "receiver funds cannot be used and no card session may start");
  });

  it("does not charge a connected buyer's card when the Reserve projection is missing or malformed", async () => {
    for (const wallet of [{ balanceUsd: "950.00" }, { valueStates: { settledBalanceUsdCents: "unknown" } }]) {
      const { adapter, calls } = fakeReceiz({ walletBalanceUsdCents: "0" });
      adapter.connectWallet = async () => ({ ok: true, userId: "payer_user", wallet });
      await assert.rejects(createWalletFirstReceizSettlement({
        ...connectedBuyer,
        receiz: adapter, amountUsd: "18.00", tenantHost: "merchant.receiz.app", recipientUserId: "merchant_user",
        merchantUsername: "merchant", idempotencyKey: "order_unknown_balance", note: "Merchant order"
      }), /checkout_reserve_balance_unavailable/);
      assert.deepEqual(calls, []);
    }
  });

  it("verifies an already-paid creation against its original merchant session before admitting payment", async () => {
    const { adapter, calls } = fakeReceiz({ walletBalanceUsdCents: "0", checkoutStatus: "paid" });
    adapter.merchantCheckoutSession = async (query) => {
      calls.push({ name: "merchantCheckoutSession", body: query });
      return { ok: true, checkoutSessionId: query.checkoutSessionId, status: "paid", amountUsdCents: "1800", merchantUsername: "merchant" };
    };
    const input = { receiz: adapter, amountUsd: "18.00", tenantHost: "merchant.receiz.app", recipientUserId: "merchant_user",
      merchantUsername: "merchant", buyerAuthenticated: false, idempotencyKey: "order_already_paid", note: "Merchant order" };
    assert.equal((await createWalletFirstReceizSettlement(input)).paid, true);
    assert.equal(calls.filter((call) => call.name === "checkout").length, 1);
    assert.equal(calls.at(-1)?.name, "merchantCheckoutSession");
    for (const mismatch of [
      { amountUsdCents: "900" }, { checkoutSessionId: "cs_other" }, { merchantUsername: "other" },
      { referenceId: "order_other" }, { ok: false }, { amountUsdCents: undefined }
    ]) {
      adapter.merchantCheckoutSession = async () => ({ ok: true, checkoutSessionId: "checkout_card_delta", status: "paid", amountUsdCents: "1800", ...mismatch });
      await assert.rejects(createWalletFirstReceizSettlement(input), /checkout_(?:amount|session|merchant|reference)/);
    }
  });

  it("rejects a resumed quote whose funding total differs from the original amount", async () => {
    const { adapter, calls } = fakeReceiz({ walletBalanceUsdCents: "0", checkoutStatus: "paid" });
    await assert.rejects(createWalletFirstReceizSettlement({
      ...connectedBuyer,
      receiz: adapter, amountUsd: "18.00", tenantHost: "merchant.receiz.app",
      recipientUserId: "merchant_user", idempotencyKey: "order_mismatch", note: "Merchant order",
      resume: { checkoutSessionId: "checkout_card_delta", funding: {
        totalUsdCents: 900, walletBalanceUsdCents: 0, walletAppliedUsdCents: 0, cardDeltaUsdCents: 900
      } }
    }), /checkout_funding_mismatch/);
    assert.equal(calls.length, 0);
  });

  it("reads funded Reserve from the real nested wallet response and refuses an unsupported debit", async () => {
    const { adapter, calls } = fakeReceiz({ walletBalanceUsdCents: "0" });
    adapter.connectWallet = async () => ({
      ok: true,
      wallet: { userId: "buyer", balanceUsd: "950.00", valueStates: { settledBalanceUsdCents: "900" } }
    });
    await assert.rejects(createWalletFirstReceizSettlement({
      buyerAuthenticated: true, buyerUserId: "buyer",
      receiz: adapter, amountUsd: "18.00", tenantHost: "merchant.receiz.app",
      recipientUserId: "merchant_user", merchantUsername: "merchant",
      idempotencyKey: "order_reserve", note: "Merchant order"
    } as Parameters<typeof createWalletFirstReceizSettlement>[0]), /reserve_checkout_execution_required/);
    assert.equal(calls.length, 0, "an unsupported reserve debit must fail before taking card payment");
  });

  it("does not treat a completed but unpaid card session as settled", async () => {
    const { adapter } = fakeReceiz({ walletBalanceUsdCents: "0", checkoutStatus: "complete" });
    const settlement = await createWalletFirstReceizSettlement({
      ...connectedBuyer,
      receiz: adapter, amountUsd: "18.00", tenantHost: "merchant.receiz.app",
      recipientUserId: "merchant_user", idempotencyKey: "order_unpaid", note: "Merchant order"
    });
    assert.equal(settlement.paid, false);
  });

  it("confirms the original card session without recalculating funding or creating another charge", async () => {
    const { adapter, calls } = fakeReceiz({ walletBalanceUsdCents: "0", checkoutStatus: "paid" });
    const settlement = await createWalletFirstReceizSettlement({
      ...connectedBuyer,
      receiz: adapter, amountUsd: "18.00", tenantHost: "merchant.receiz.app",
      recipientUserId: "merchant_user", idempotencyKey: "order_resume", note: "Merchant order",
      resume: {
        checkoutSessionId: "checkout_card_delta",
        funding: { totalUsdCents: 1800, walletBalanceUsdCents: 0, walletAppliedUsdCents: 0, cardDeltaUsdCents: 1800 }
      }
    });
    assert.equal(settlement.paid, true);
    assert.equal(settlement.funding.cardRequired, false);
    assert.equal(settlement.funding.cardDeltaLabel, "$18.00");
    assert.deepEqual(calls.map((call) => call.name), ["checkoutSession"]);
  });

  it("cannot reconstruct Reserve authority from a resumed split quote", async () => {
    const { adapter, calls } = fakeReceiz({ walletBalanceUsdCents: "0", checkoutStatus: "paid" });
    await assert.rejects(createWalletFirstReceizSettlement({
      ...connectedBuyer,
      receiz: adapter, amountUsd: "18.00", tenantHost: "merchant.receiz.app",
      recipientUserId: "merchant_user", idempotencyKey: "order_resume", note: "Merchant order",
      resume: {
        checkoutSessionId: "checkout_card_delta",
        funding: { totalUsdCents: 1800, walletBalanceUsdCents: 900, walletAppliedUsdCents: 900, cardDeltaUsdCents: 900 }
      }
    }), /reserve_checkout_execution_required/);
    assert.deepEqual(calls, []);
  });

  it("lets a guest pay the merchant without reading another account's wallet", async () => {
    const { adapter, calls } = fakeReceiz({ walletBalanceUsdCents: "900" });
    await createWalletFirstReceizSettlement({
      receiz: adapter, amountUsd: "18.00", tenantHost: "merchant.receiz.app",
      recipientUserId: "merchant_user", merchantUsername: "merchant", buyerAuthenticated: false,
      idempotencyKey: "order_guest", note: "Merchant order"
    } as Parameters<typeof createWalletFirstReceizSettlement>[0]);
    assert.equal(calls[0]?.name, "checkout");
    assert.equal(calls[0]?.body?.username, "merchant");
    assert.equal(calls[0]?.body?.amountUsd, "18.00");
  });

  for (const balance of ["900", "5000"]) {
    it(`rejects a legacy wallet projection of ${balance} cents before creating a charge or transfer`, async () => {
      const { adapter, calls } = fakeReceiz({ walletBalanceUsdCents: balance, checkoutStatus: "paid" });
      await assert.rejects(createWalletFirstReceizSettlement({
        ...connectedBuyer,
        receiz: adapter, amountUsd: "18.00", tenantHost: "merchant.receiz.app",
        recipientUserId: "merchant_user", idempotencyKey: "order_no_source", note: "Merchant order"
      }), /reserve_checkout_execution_required/);
      assert.deepEqual(calls.map((call) => call.name), ["connectWallet"]);
    });
  }
});
