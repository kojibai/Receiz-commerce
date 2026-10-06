import assert from "node:assert/strict";
import { it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter.js";
import { seedCommerceState } from "../src/data/seed.js";
import { oneHostingMonth, nextHostingRenewalPeriod, hostingPeriodStatus, validateHostingRenewalPeriod } from "../src/lib/hosting/renewal-period.js";
import { encodeHostingRenewalCoordinates, readHostingRenewalCoordinates, recoverHostingRenewal, projectRecoveredHostingRenewal, requireActiveHostingRenewal, type HostingRenewalCoordinates } from "../src/lib/hosting/renewal-coordinates.js";
import { platformOperationFromContinuation, type PlatformOperationIntent } from "../src/lib/hosting/platform-operation.js";

const secret = "test-only-monthly-payment-coordinate-secret";
const receiver = "c1c334bd-7402-421c-b906-ef196a5447e5";
const now = Date.parse("2026-10-06T14:00:00.000Z");
function coordinates(startsAt = "2026-10-01T14:00:00.000Z", id = "month_original"): HostingRenewalCoordinates {
  const period = oneHostingMonth(startsAt);
  const operation = { id, kind: "hosting_plan" as const, merchantReceizId: "seller", tenantHost: "seller.receiz.app", plan: "pro" as const,
    amountUsd: "49.00", recipientUserId: receiver, period };
  return { schema: "receiz.app.hosting_renewal_coordinates.v1", payerUserId: "payer_id", plan: "pro", period,
    quote: { purpose: "hosting_plan", tenantHost: operation.tenantHost, actorReceizId: "seller", merchantUsername: "bjklock",
      referenceId: id, checkoutSessionId: `cs_${id}`, amountUsd: "49.00", issuedAt: Date.parse(startsAt),
      funding: { totalUsdCents: 4900, walletBalanceUsdCents: 0, walletAppliedUsdCents: 0, cardDeltaUsdCents: 4900 }, context: { operation } } };
}
function transport(options: { unpaid?: readonly string[]; mismatch?: Record<string, unknown> } = {}) {
  const requests: URL[] = [];
  const receiz = createReceizCommerceAdapter({ baseUrl: "https://receiz.test", fetchImpl: (async (url, init) => {
    const parsed = new URL(String(url)); requests.push(parsed);
    assert.equal(init?.method ?? "GET", "GET");
    assert.equal(parsed.pathname, "/api/payments/embed/checkout/session", "recovery must not mint a checkout, debit a wallet, or create a transfer");
    assert.equal(parsed.searchParams.get("merchant"), "bjklock");
    const sessionId = parsed.searchParams.get("session_id")!;
    const paid = !options.unpaid?.includes(sessionId);
    return Response.json({ ok: true, session: { sessionId, isPaid: paid, state: paid ? "paid" : "open", merchantUsername: "bjklock",
      amountUsdCents: "4900", referenceId: sessionId.slice(3), ...options.mismatch },
      ...(paid ? { settlement: { kind: "wallet_credit", userId: receiver, amountUsdCents: "4900" } } : {}) });
  }) as typeof fetch });
  return { receiz, requests };
}
function recover(value: HostingRenewalCoordinates, options: Parameters<typeof transport>[0] = {}, at = now) {
  const { receiz, requests } = transport(options);
  const token = encodeHostingRenewalCoordinates(value, secret);
  return { requests, token, result: recoverHostingRenewal({ receiz, token, merchantReceizId: "seller", payerUserId: "payer_id", secret, now: at }) };
}

it("uses one calendar month, including leap years and month-end clamping", () => {
  assert.equal(oneHostingMonth("2026-01-31T14:22:10.123Z").paidThrough, "2026-02-28T14:22:10.123Z");
  assert.equal(oneHostingMonth("2028-01-31T14:22:10.123Z").paidThrough, "2028-02-29T14:22:10.123Z");
  assert.equal(oneHostingMonth("2026-12-06T14:00:00.000Z").paidThrough, "2027-01-06T14:00:00.000Z");
  assert.throws(() => validateHostingRenewalPeriod({ startsAt: "2026-10-01T14:00:00.000Z", paidThrough: "2027-10-01T14:00:00.000Z" }), /hosting_period_invalid/);
});

it("renews from paid-through within 14 days and from now after expiration", () => {
  const period = coordinates().period;
  assert.throws(() => nextHostingRenewalPeriod(period, now), /hosting_renewal_too_early/);
  assert.equal(nextHostingRenewalPeriod(period, Date.parse("2026-10-18T14:00:00.000Z")).startsAt, period.paidThrough);
  assert.equal(nextHostingRenewalPeriod(period, Date.parse("2026-11-02T14:00:00.000Z")).startsAt, "2026-11-02T14:00:00.000Z");
  assert.equal(hostingPeriodStatus(period, Date.parse(period.startsAt) - 1), "scheduled");
  assert.equal(hostingPeriodStatus(period, Date.parse(period.startsAt)), "active");
  assert.equal(hostingPeriodStatus(period, Date.parse(period.paidThrough)), "past_due");
});

it("rejects altered ciphertext, wrong recipients of recovery, and mismatched service months", () => {
  const value = coordinates(), token = encodeHostingRenewalCoordinates(value, secret);
  for (const binding of [{ merchantReceizId: "other" }, { merchantReceizId: "seller", payerUserId: "other" }, { merchantReceizId: "seller", plan: "scale" as const }]) {
    assert.throws(() => readHostingRenewalCoordinates(token, binding, secret), /hosting_recovery_owner_mismatch/);
  }
  const parts = token.split("."); parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
  assert.throws(() => readHostingRenewalCoordinates(parts.join("."), { merchantReceizId: "seller" }, secret), /hosting_recovery_invalid/);
  assert.throws(() => readHostingRenewalCoordinates(token, { merchantReceizId: "seller" }, "other-secret"), /hosting_recovery_invalid/);
  assert.throws(() => encodeHostingRenewalCoordinates({ ...value, period: oneHostingMonth("2026-11-01T14:00:00.000Z") }, secret), /hosting_recovery_period_mismatch/);
  assert.throws(() => platformOperationFromContinuation(value.quote, { ...value.quote.context.operation as PlatformOperationIntent, period: oneHostingMonth("2026-11-01T14:00:00.000Z") }), /platform_payment_continuation_mismatch/);
});

it("refuses a month whose complete recovery exceeds the read transport limit", () => {
  const value = coordinates();
  value.quote.context.excessiveCompleteSource = "x".repeat(2_100_000);
  assert.throws(() => encodeHostingRenewalCoordinates(value, secret), /hosting_recovery_too_large/);
});

it("rechecks only the original SDK session after reload without a new charge or a 24-hour recovery limit", async () => {
  const attempt = recover(coordinates());
  const first = await attempt.result;
  assert.equal(first.status, "active");
  assert.equal(first.settlement.paid, true);
  assert.equal(attempt.requests.length, 1);
  const nextTransport = transport();
  const next = await recoverHostingRenewal({ receiz: nextTransport.receiz, token: attempt.token, merchantReceizId: "seller", payerUserId: "payer_id", secret, now });
  assert.deepEqual(next.coordinates.period, first.coordinates.period, "completion replay cannot grant another month");
  assert.equal(nextTransport.requests[0].searchParams.get("session_id"), "cs_month_original");
  const projected = projectRecoveredHostingRenewal(seedCommerceState.hosting, seedCommerceState.billing, next, attempt.token);
  const replay = projectRecoveredHostingRenewal(projected.hosting, projected.billing, next, attempt.token);
  assert.equal(replay.hosting.plan, "pro");
  assert.equal(replay.billing.invoices.filter(invoice => invoice.id === "inv-month_original").length, 1);
  assert.equal(replay.billing.paidThrough, "2026-11-01T14:00:00.000Z");
  assert.equal(replay.billing.renewalMode, "in_app");
});

it("does not grant a paid plan for a pending, expired, or unbacked future month", async () => {
  for (const [value, options, at, status] of [
    [coordinates(), { unpaid: ["cs_month_original"] }, now, "payment_pending"],
    [coordinates(), {}, Date.parse("2026-11-01T14:00:00.000Z"), "past_due"],
    [coordinates("2026-11-01T14:00:00.000Z"), {}, now, "scheduled"],
  ] as const) {
    const attempt = recover(value, options, at), result = await attempt.result;
    assert.equal(result.status, status);
    const projected = projectRecoveredHostingRenewal(seedCommerceState.hosting, seedCommerceState.billing, result, attempt.token);
    assert.equal(projected.hosting.plan, "starter");
    assert.notEqual(projected.billing.status, "active");
  }
});

it("preserves verified current access during a pending renewal and verifies both payments for an early renewal", async () => {
  const previous = coordinates(), value = { ...coordinates(previous.period.paidThrough, "renewal_next"), previous };
  const at = Date.parse("2026-10-20T14:00:00.000Z");
  for (const paidNew of [true, false]) {
    const attempt = recover(value, { unpaid: paidNew ? [] : ["cs_renewal_next"] }, at), result = await attempt.result;
    assert.equal(result.status, "active");
    assert.equal(result.settlement.paid, paidNew);
    assert.equal(attempt.requests.length, 2);
    const projection = projectRecoveredHostingRenewal({ ...seedCommerceState.hosting, billingRenewalToken: "previous-token" }, seedCommerceState.billing, result, attempt.token);
    assert.equal(projection.hosting.plan, "pro");
    assert.equal(projection.billing.paidThrough, paidNew ? value.period.paidThrough : previous.period.paidThrough);
    assert.equal(projection.hosting.billingRenewalToken, paidNew ? attempt.token : "previous-token");
    assert.equal(projection.hosting.pendingBillingRenewalToken, paidNew ? undefined : attempt.token);
  }
  const missing = await recover(value, { unpaid: ["cs_month_original"] }, at).result;
  assert.equal(missing.status, "scheduled", "future payment cannot supply missing current-month access");
});

it("rejects non-adjacent previous periods and a previous payment for a different merchant", () => {
  const previous = coordinates();
  assert.throws(() => encodeHostingRenewalCoordinates({ ...coordinates("2026-12-01T14:00:00.000Z"), previous }, secret), /hosting_recovery_period_mismatch/);
  assert.throws(() => encodeHostingRenewalCoordinates({ ...coordinates(previous.period.paidThrough), previous: { ...previous, payerUserId: "other" } }, secret), /hosting_recovery_period_mismatch/);
});

it("rejects original-session payment mismatches before granting a month", async () => {
  for (const mismatch of [{ sessionId: "cs_other" }, { merchantUsername: "other" }, { referenceId: "other" }]) {
    await assert.rejects(recover(coordinates(), { mismatch }).result, /checkout_(?:session|merchant|reference)_mismatch/);
  }
});

it("refuses a forged Reserve split before card status can be interpreted as full settlement", async () => {
  const value = coordinates();
  value.quote.funding = { totalUsdCents: 4900, walletBalanceUsdCents: 1000, walletAppliedUsdCents: 1000, cardDeltaUsdCents: 3900 };
  const attempt = recover(value);
  await assert.rejects(attempt.result, /reserve_checkout_execution_required/);
  assert.equal(attempt.requests.length, 0);
});

it("requires a fresh verified paid month to enable selling, regardless of a caller's plan label", async () => {
  const { receiz, requests } = transport();
  const input = { receiz, hosting: { ...seedCommerceState.hosting, plan: "scale" as const }, merchantReceizId: "seller", secret, now };
  await assert.rejects(requireActiveHostingRenewal(input), /hosting_month_payment_required/);
  assert.equal(requests.length, 0);
  const token = encodeHostingRenewalCoordinates(coordinates(), secret);
  const retained = { ...input, hosting: { ...input.hosting, billingRenewalToken: token } };
  assert.equal((await requireActiveHostingRenewal(retained)).coordinates.plan, "pro", "the SDK-checked original payment supplies the plan");
  await assert.rejects(requireActiveHostingRenewal({ ...retained, now: Date.parse("2026-11-01T14:00:00.000Z") }), /hosting_month_renewal_required/);
  await assert.rejects(requireActiveHostingRenewal({ ...retained, merchantReceizId: "other" }), /hosting_recovery_owner_mismatch/);
  assert.equal(requests.length, 2);
});
