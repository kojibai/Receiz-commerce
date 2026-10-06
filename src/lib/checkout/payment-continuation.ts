import { createHmac, timingSafeEqual } from "node:crypto";
import type { WalletFirstFunding } from "./receiz-settlement";
import { receizOAuthSecret } from "../receiz/oauth-state";

export type PaymentContinuation = {
  purpose: "storefront_checkout" | "hosting_plan" | "custom_domain";
  tenantHost: string;
  actorReceizId?: string;
  merchantUsername: string;
  referenceId: string;
  checkoutSessionId: string;
  amountUsd: string;
  funding: Pick<WalletFirstFunding, "totalUsdCents" | "walletBalanceUsdCents" | "walletAppliedUsdCents" | "cardDeltaUsdCents">;
  context: Record<string, unknown>;
  issuedAt?: number;
};

function signature(body: string, secret: string) {
  return createHmac("sha256", secret).update(`receiz-checkout-continuation:v1:${body}`).digest("base64url");
}

// This correlates an app quote with the original payment session. It never authorizes
// a debit or establishes settlement: the payment rail is independently queried.
export function issuePaymentContinuation(quote: PaymentContinuation, secret = receizOAuthSecret()): string {
  const { totalUsdCents, walletBalanceUsdCents, walletAppliedUsdCents, cardDeltaUsdCents } = quote.funding;
  const body = Buffer.from(JSON.stringify({
    ...quote,
    funding: { totalUsdCents, walletBalanceUsdCents, walletAppliedUsdCents, cardDeltaUsdCents },
    issuedAt: Date.now()
  })).toString("base64url");
  return `${body}.${signature(body, secret)}`;
}

function verifiedPaymentContinuation(token: string, secret: string): PaymentContinuation {
  if (token.length > 64_000) throw new Error("checkout_continuation_invalid");
  const parts = token.split(".");
  const [body, supplied] = parts;
  const expected = Buffer.from(signature(body ?? "", secret));
  const actual = Buffer.from(supplied ?? "");
  if (parts.length !== 2 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("checkout_continuation_invalid");
  const quote = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PaymentContinuation;
  if (!quote || !Number.isSafeInteger(quote.issuedAt) || !quote.issuedAt || quote.issuedAt > Date.now() + 30_000 ||
    !["storefront_checkout", "hosting_plan", "custom_domain"].includes(quote.purpose) ||
    [quote.tenantHost, quote.merchantUsername, quote.referenceId, quote.checkoutSessionId].some((value) => typeof value !== "string" || !value.trim()) ||
    (quote.actorReceizId !== undefined && (typeof quote.actorReceizId !== "string" || !quote.actorReceizId.trim())) ||
    !quote.context || typeof quote.context !== "object" || Array.isArray(quote.context) ||
    !/^\d+(?:\.\d{1,2})?$/.test(quote.amountUsd) || !quote.funding) throw new Error("checkout_continuation_invalid");
  const { totalUsdCents, walletBalanceUsdCents, walletAppliedUsdCents, cardDeltaUsdCents } = quote.funding;
  if ([totalUsdCents, walletBalanceUsdCents, walletAppliedUsdCents, cardDeltaUsdCents].some((value) => !Number.isSafeInteger(value) || value < 0) ||
    totalUsdCents <= 0 || totalUsdCents !== Math.round(Number(quote.amountUsd) * 100) ||
    walletAppliedUsdCents !== Math.min(totalUsdCents, walletBalanceUsdCents) || cardDeltaUsdCents !== totalUsdCents - walletAppliedUsdCents) throw new Error("checkout_continuation_invalid");
  if (Date.now() - quote.issuedAt > 24 * 60 * 60 * 1000) throw new Error("checkout_continuation_expired");
  return quote;
}

export function readPaymentContinuation(token: string, binding: Pick<PaymentContinuation, "purpose" | "actorReceizId"> & { tenantHost?: string }, secret = receizOAuthSecret()): PaymentContinuation {
  const quote = verifiedPaymentContinuation(token, secret);
  if (quote.purpose !== binding.purpose || (binding.tenantHost !== undefined && quote.tenantHost !== binding.tenantHost) ||
    (quote.actorReceizId && quote.actorReceizId !== binding.actorReceizId)) throw new Error("checkout_continuation_mismatch");
  return quote;
}

/** Status-only possession check. It cannot authorize a debit, an order append,
 * or paid account access; those paths still require readPaymentContinuation. */
export function readPaymentStatusContinuation(token: string, binding: Pick<PaymentContinuation, "purpose" | "actorReceizId"> & { tenantHost?: string }, secret = receizOAuthSecret()): PaymentContinuation {
  const quote = verifiedPaymentContinuation(token, secret);
  if (quote.purpose !== binding.purpose || (binding.tenantHost !== undefined && quote.tenantHost !== binding.tenantHost) ||
    (binding.actorReceizId !== undefined && quote.actorReceizId && quote.actorReceizId !== binding.actorReceizId)) throw new Error("checkout_continuation_mismatch");
  return quote;
}
