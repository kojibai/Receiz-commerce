import assert from "node:assert/strict";
import { it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter.js";
import { createWalletFirstReceizSettlement } from "../src/lib/checkout/receiz-settlement.js";
import { issuePaymentContinuation, readPaymentContinuation } from "../src/lib/checkout/payment-continuation.js";
import { hostingPlanUpdateFromPlatformPayment } from "../src/lib/hosting/platform-billing.js";
import { seedCommerceState } from "../src/data/seed.js";

it("creates one merchant card checkout, verifies its settlement, then activates the paid plan", async () => {
  const requests: Array<{ path: string; body?: Record<string, unknown> }> = [];
  const receiz = createReceizCommerceAdapter({ baseUrl: "https://receiz.test", fetchImpl: (async (url, init) => {
    const parsed = new URL(String(url));
    requests.push({ path: `${parsed.pathname}${parsed.search}`, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (parsed.pathname === "/api/connect/wallet/me") {
      return Response.json({ ok: true, userId: "upgrading_merchant", wallet: { balanceUsd: "900.00", valueStates: { settledBalanceUsdCents: "0" } } });
    }
    if (parsed.pathname === "/api/payments/embed/checkout") {
      return Response.json({ ok: true, checkout: { mode: "embedded", sessionId: "cs_original", clientSecret: "cs_original_secret", amountUsdCents: "4900", referenceId: "upgrade_1" } });
    }
    if (parsed.pathname === "/api/payments/embed/checkout/session") {
      return Response.json({ ok: true, session: { sessionId: "cs_original", isPaid: true, state: "paid", merchantUsername: "bjklock" }, settlement: { kind: "wallet_credit", userId: "platform", amountUsdCents: "4900", alreadyProcessed: false } });
    }
    throw new Error(`Unexpected payment request: ${parsed.pathname}`);
  }) as typeof fetch, accessToken: "connected-buyer-fixture" });
  const input = { receiz, amountUsd: "49.00", tenantHost: "seller.receiz.app", recipientUserId: "platform", merchantUsername: "bjklock", buyerAuthenticated: true, buyerUserId: "upgrading_merchant", idempotencyKey: "upgrade_1", orderId: "upgrade_1", note: "Pro account upgrade" };
  const created = await createWalletFirstReceizSettlement(input);
  assert.equal(created.paid, false);
  assert.equal(created.checkoutSession?.clientSecret, "cs_original_secret");
  assert.equal(hostingPlanUpdateFromPlatformPayment(seedCommerceState.hosting, "pro", created).ok, false);
  const token = issuePaymentContinuation({ purpose: "hosting_plan", tenantHost: input.tenantHost, actorReceizId: "seller.receiz.id", merchantUsername: "bjklock", referenceId: "upgrade_1", checkoutSessionId: "cs_original", amountUsd: "49.00", funding: created.funding, context: {} }, "test-merchant-integration-secret-32-bytes");
  const quote = readPaymentContinuation(token, { purpose: "hosting_plan", tenantHost: input.tenantHost, actorReceizId: "seller.receiz.id" }, "test-merchant-integration-secret-32-bytes");
  const paid = await createWalletFirstReceizSettlement({ ...input, resume: { checkoutSessionId: quote.checkoutSessionId, funding: quote.funding } });
  assert.equal(paid.paid, true);
  assert.equal(paid.funding.cardRequired, false);
  const upgraded = hostingPlanUpdateFromPlatformPayment(seedCommerceState.hosting, "pro", paid);
  assert.equal(upgraded.ok, true);
  assert.equal(upgraded.hosting.plan, "pro");
  assert.deepEqual(requests.map((request) => request.path), [
    "/api/connect/wallet/me", "/api/payments/embed/checkout", "/api/payments/embed/checkout/session?session_id=cs_original&merchant=bjklock"
  ]);
  assert.equal(requests[1]?.body?.username, "bjklock");
  assert.equal(requests[1]?.body?.amountUsd, "49.00");
  assert.equal(requests[1]?.body?.uiMode, "embedded");
});

for (const receiver of [
  { username: "bjklock", id: "10000000-0000-4000-8000-000000000001", purpose: "platform upgrade", amountUsd: "49.00", cents: "4900" },
  { username: "store_owner", id: "20000000-0000-4000-8000-000000000002", purpose: "store purchase", amountUsd: "18.00", cents: "1800" },
]) it(`receives a ${receiver.purpose} directly through the SDK without the receiver's credentials or wallet`, async () => {
  const calls: Array<{ path: string; username?: unknown; authorization: string | null }> = [];
  const receiz = createReceizCommerceAdapter({ baseUrl: "https://receiz.test", fetchImpl: (async (url, init) => {
    const parsed = new URL(String(url));
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    calls.push({ path: parsed.pathname, username: body.username, authorization: new Headers(init?.headers).get("authorization") });
    if (parsed.pathname === "/api/payments/embed/checkout") return Response.json({ ok: true, checkout: {
      sessionId: "cs_receiver", clientSecret: "fixture_card_secret", amountUsdCents: receiver.cents, referenceId: "incoming_1"
    } });
    if (parsed.pathname === "/api/payments/embed/checkout/session") {
      assert.equal(parsed.searchParams.get("merchant"), receiver.username);
      return Response.json({ ok: true, checkoutSessionId: "cs_receiver", status: "paid", amountUsdCents: receiver.cents,
        referenceId: "incoming_1", merchantUsername: receiver.username, recipientUserId: receiver.id, receiptId: "incoming_receipt" });
    }
    throw new Error("An incoming merchant payment must not read or debit the receiver's wallet");
  }) as typeof fetch });
  const input = { receiz, amountUsd: receiver.amountUsd, tenantHost: "store_owner.receiz.app", recipientUserId: receiver.id,
    merchantUsername: receiver.username, buyerAuthenticated: false, idempotencyKey: "incoming_1", note: receiver.purpose };
  const started = await createWalletFirstReceizSettlement(input);
  assert.equal(started.paid, false);
  const confirmed = await createWalletFirstReceizSettlement({ ...input, resume: { checkoutSessionId: "cs_receiver", funding: started.funding } });
  assert.equal(confirmed.paid, true);
  assert.equal(confirmed.checkoutSession?.recipientUserId, receiver.id);
  assert.equal(confirmed.receiptId, "incoming_receipt");
  assert.deepEqual(calls.map(call => call.path), ["/api/payments/embed/checkout", "/api/payments/embed/checkout/session"]);
  assert.equal(calls[0].username, receiver.username);
  assert.ok(calls.every(call => call.authorization === null));
});
