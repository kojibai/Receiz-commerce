import type {
  CheckoutSessionResponse,
  ConnectTransferResponse,
  ConnectWalletResponse
} from "@receiz/sdk";
import type { ReceizOpenAuthoritySessionInputV124 } from "@receiz/sdk";
import type { ReceizCommerceAdapter } from "@/lib/receiz/adapter";
import type { Order } from "@/types/domain";
import { reserveBalanceUsdCents } from "./payment-contract";
import { createNativeReserveExecution, recoverNativeReservePayment, type NativeReservePreparation, type NativeReserveQuote } from "./native-reserve-execution";
import { encodeNativeReserveCoordinates, readNativeReserveCoordinates } from "./native-reserve-coordinates";

export const RECEIZ_CHECKOUT_VALUE_AUTHORITY_NOTICE =
  "USD checkout is a commerce quote. Proof-native value movement requires an explicit Phi intent bound to its source proof and head." as const;

export type ReceizProofNativeValueMovement = Readonly<{
  amountPhiMicro: string;
  sourceProofObjectId: string;
  sourceValueHead: string;
  valueIntentDigest: string;
  rail: "settlement" | "reserve";
}>;

export type WalletFirstFunding = {
  strategy: "receiz_wallet_first";
  totalUsdCents: number;
  walletBalanceUsdCents: number;
  walletAppliedUsdCents: number;
  cardDeltaUsdCents: number;
  totalLabel: string;
  walletBalanceLabel: string;
  walletAppliedLabel: string;
  cardDeltaLabel: string;
  cardRequired: boolean;
};

export type WalletFirstReceizSettlementInput = {
  receiz: ReceizCommerceAdapter;
  amountUsd: string;
  tenantHost: string;
  recipientUserId: string;
  merchantUsername?: string;
  buyerAuthenticated: boolean;
  /** Verified payer account from this request's connection, never the payee. */
  buyerUserId?: string;
  buyerReceizId?: string;
  /** Only supplied by a server-verified original checkout continuation. */
  originalReserveQuote?: NativeReserveQuote;
  reservePaymentToken?: string;
  nativeReserveExecution?: {
    preparation: NativeReservePreparation;
    authority: Omit<ReceizOpenAuthoritySessionInputV124, "applicationId" | "audience">;
    recoverOnly?: boolean;
  };
  resume?: {
    checkoutSessionId: string;
    funding: Pick<WalletFirstFunding, "totalUsdCents" | "walletBalanceUsdCents" | "walletAppliedUsdCents" | "cardDeltaUsdCents">;
  };
  /** Enabled only by an explicit checkout action, never a status/read recovery. */
  reopenExpiredCard?: boolean;
  idempotencyKey: string;
  note: string;
  orderId?: string;
  description?: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  cart?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type WalletFirstReceizSettlement = {
  ok: true;
  paid: boolean;
  funding: WalletFirstFunding;
  wallet: ConnectWalletResponse | null;
  walletTransfer: ConnectTransferResponse | null;
  checkoutSession: CheckoutSessionResponse | null;
  paymentRail: NonNullable<Order["paymentRail"]>;
  settlementStatus: NonNullable<Order["settlementStatus"]>;
  receiptId?: string;
  proofBundle?: Record<string, unknown> | null;
  reservePaymentToken?: string;
  cardError?: string;
};

export class NativeReserveRequiredError extends Error {
  constructor(readonly quote: NativeReserveQuote) {
    super("reserve_checkout_execution_required: Restore the complete Reserve payment source to authorize this purchase in app. No card payment has been created.");
  }
}

export function centsFromUsdAmount(value: string | number | undefined | null) {
  const amount = typeof value === "number" ? value : Number(String(value ?? "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

export function centsFromReceizValue(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return 0;
  if (typeof value === "string" && !/^\d+$/.test(value)) return 0;
  const cents = Number(value);
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : 0;
}

export function usdLabelFromCents(cents: number) {
  return `$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

export function usdAmountFromCents(cents: number) {
  return (Math.max(0, cents) / 100).toFixed(2);
}

export function walletFirstFunding(totalUsdCents: number, walletBalanceUsdCents: number): WalletFirstFunding {
  const safeTotalUsdCents = Math.max(0, totalUsdCents);
  const safeWalletBalanceUsdCents = Math.max(0, walletBalanceUsdCents);
  const walletAppliedUsdCents = Math.min(safeTotalUsdCents, safeWalletBalanceUsdCents);
  const cardDeltaUsdCents = Math.max(0, safeTotalUsdCents - walletAppliedUsdCents);

  return {
    strategy: "receiz_wallet_first",
    totalUsdCents: safeTotalUsdCents,
    walletBalanceUsdCents: safeWalletBalanceUsdCents,
    walletAppliedUsdCents,
    cardDeltaUsdCents,
    totalLabel: usdLabelFromCents(safeTotalUsdCents),
    walletBalanceLabel: usdLabelFromCents(safeWalletBalanceUsdCents),
    walletAppliedLabel: usdLabelFromCents(walletAppliedUsdCents),
    cardDeltaLabel: usdLabelFromCents(cardDeltaUsdCents),
    cardRequired: cardDeltaUsdCents > 0
  };
}

export function paymentRailFromFunding(funding: WalletFirstFunding): NonNullable<Order["paymentRail"]> {
  if (funding.walletAppliedUsdCents > 0 && funding.cardDeltaUsdCents > 0) return "wallet_card_split";
  if (funding.walletAppliedUsdCents > 0) return "receiz_wallet";
  if (funding.cardDeltaUsdCents > 0) return "card_fallback";
  return "receiz_checkout";
}

function proofBundleFrom(value: unknown) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function checkoutSessionIsPaid(session: CheckoutSessionResponse | null) {
  const status = session?.status?.trim().toLowerCase();
  return session?.ok === true && (status === "paid" || status === "succeeded" || status === "settled");
}

async function refreshCheckoutSessionIfNeeded(
  receiz: ReceizCommerceAdapter,
  session: CheckoutSessionResponse | null
) {
  if (!session?.checkoutSessionId || session.checkoutUrl || session.clientSecret) return session;

  try {
    const refreshed = await receiz.checkoutSession({ checkoutSessionId: session.checkoutSessionId });
    return { ...session, ...refreshed };
  } catch {
    return session;
  }
}

export async function createWalletFirstReceizSettlement(
  input: WalletFirstReceizSettlementInput
): Promise<WalletFirstReceizSettlement> {
  const totalUsdCents = centsFromUsdAmount(input.amountUsd);
  if (!/^\d+(?:\.\d{1,2})?$/.test(input.amountUsd) || !Number.isSafeInteger(totalUsdCents) || totalUsdCents <= 0) throw new Error("checkout_amount_invalid");
  if (input.buyerAuthenticated && !input.buyerUserId?.trim()) throw new Error("checkout_buyer_identity_required");
  const retainedReserve = input.reservePaymentToken ? readNativeReserveCoordinates(input.reservePaymentToken) : null;
  const originalReserveQuote = retainedReserve?.quote ?? input.originalReserveQuote;
  if (originalReserveQuote) {
    const quote = originalReserveQuote;
    if (quote.tenantHost !== input.tenantHost || quote.merchantUsername !== input.merchantUsername ||
      quote.recipientUserId !== input.recipientUserId || quote.referenceId !== (input.orderId ?? input.idempotencyKey) ||
      quote.idempotencyKey !== input.idempotencyKey ||
      quote.funding.totalUsdCents !== totalUsdCents ||
      (input.buyerAuthenticated && (quote.buyerUserId !== input.buyerUserId || quote.buyerReceizId !== input.buyerReceizId))) {
      throw new Error("reserve_checkout_original_quote_mismatch");
    }
    if (input.resume && ["totalUsdCents", "walletBalanceUsdCents", "walletAppliedUsdCents", "cardDeltaUsdCents"].some(key =>
      input.resume!.funding[key as keyof typeof input.resume.funding] !== quote.funding[key as keyof typeof quote.funding])) throw new Error("checkout_funding_mismatch");
  }
  if (input.resume) {
    const original = input.resume.funding;
    const expected = walletFirstFunding(totalUsdCents, original.walletBalanceUsdCents);
    const cents = [original.totalUsdCents, original.walletBalanceUsdCents, original.walletAppliedUsdCents, original.cardDeltaUsdCents];
    if (cents.some((value) => !Number.isSafeInteger(value) || value < 0) ||
      original.totalUsdCents !== totalUsdCents || original.walletAppliedUsdCents !== expected.walletAppliedUsdCents ||
      original.cardDeltaUsdCents !== expected.cardDeltaUsdCents) throw new Error("checkout_funding_mismatch");
  }
  const wallet = !input.resume && !originalReserveQuote && input.buyerAuthenticated ? await input.receiz.connectWallet() : null;
  if (wallet && !wallet.ok) throw new Error("checkout_wallet_read_failed");
  if (wallet) {
    const source = wallet.wallet && typeof wallet.wallet === "object" ? wallet.wallet as Record<string, unknown> : {};
    const walletUserId = wallet.userId ?? source.userId ?? source.user_id;
    if (walletUserId !== input.buyerUserId) throw new Error("checkout_buyer_wallet_mismatch");
  }
  const walletBalanceUsdCents = wallet ? reserveBalanceUsdCents(wallet) : 0;
  if (walletBalanceUsdCents === null) throw new Error("checkout_reserve_balance_unavailable: Your funded Reserve balance could not be verified. Reconnect your Identity Seal and try again. No card payment has been created.");
  const funding = originalReserveQuote ? walletFirstFunding(totalUsdCents, originalReserveQuote.funding.walletBalanceUsdCents) : input.resume
    ? walletFirstFunding(input.resume.funding.totalUsdCents, input.resume.funding.walletBalanceUsdCents)
    : walletFirstFunding(totalUsdCents, walletBalanceUsdCents);
  if (input.nativeReserveExecution && (!originalReserveQuote || funding.walletAppliedUsdCents <= 0)) {
    throw new Error("reserve_checkout_original_quote_required");
  }
  let reservePaymentToken = input.reservePaymentToken;
  let nativeReceiptId: string | undefined;
  if (funding.walletAppliedUsdCents > 0 && retainedReserve) {
    const recovered = await recoverNativeReservePayment(input.receiz, retainedReserve.quote, retainedReserve.recovery);
    nativeReceiptId = recovered.valueIntentDigest;
  } else if (funding.walletAppliedUsdCents > 0 && input.nativeReserveExecution) {
    if (!input.buyerAuthenticated || !input.buyerReceizId || !input.buyerUserId || !input.merchantUsername) {
      throw new Error("reserve_checkout_buyer_identity_required");
    }
    const quote: NativeReserveQuote = originalReserveQuote ?? { applicationId: process.env.RECEIZ_APPLICATION_ID?.trim() || "receiz-commerce-kit",
      tenantHost: input.tenantHost, buyerUserId: input.buyerUserId, buyerReceizId: input.buyerReceizId,
      merchantUsername: input.merchantUsername, recipientUserId: input.recipientUserId,
      referenceId: input.orderId ?? input.idempotencyKey, idempotencyKey: input.idempotencyKey,
      funding: { totalUsdCents: funding.totalUsdCents, walletBalanceUsdCents: funding.walletBalanceUsdCents,
        walletAppliedUsdCents: funding.walletAppliedUsdCents, cardDeltaUsdCents: funding.cardDeltaUsdCents } };
    const execution = createNativeReserveExecution(input.receiz, quote);
    if (input.nativeReserveExecution.recoverOnly) await execution.restoreForResolution(input.nativeReserveExecution.preparation);
    else await execution.prepare(input.nativeReserveExecution.preparation);
    const result = input.nativeReserveExecution.recoverOnly ? await execution.resolve() : await execution.execute(input.nativeReserveExecution.authority);
    if (result.status !== "committed") throw new Error(result.status === "unknown"
      ? "reserve_checkout_resolution_required" : `reserve_checkout_zero_write:${result.reason}`);
    nativeReceiptId = result.payment.valueIntentDigest;
    reservePaymentToken = encodeNativeReserveCoordinates({ schema: "receiz.app.native_reserve_coordinates.v1", quote, recovery: result.payment.recovery });
  } else if (funding.walletAppliedUsdCents > 0) {
    if (input.buyerReceizId && input.buyerUserId && input.merchantUsername) {
      throw new NativeReserveRequiredError({ applicationId: process.env.RECEIZ_APPLICATION_ID?.trim() || "receiz-commerce-kit",
        tenantHost: input.tenantHost, buyerUserId: input.buyerUserId, buyerReceizId: input.buyerReceizId,
        merchantUsername: input.merchantUsername, recipientUserId: input.recipientUserId,
        referenceId: input.orderId ?? input.idempotencyKey, idempotencyKey: input.idempotencyKey,
        funding: { totalUsdCents: funding.totalUsdCents, walletBalanceUsdCents: funding.walletBalanceUsdCents,
          walletAppliedUsdCents: funding.walletAppliedUsdCents, cardDeltaUsdCents: funding.cardDeltaUsdCents } });
    }
    throw new Error("reserve_checkout_execution_required: Funded Reserve requires its admitted source proof and atomic sender/receiver edge commit. A wallet response or continuation cannot authorize a debit. No payment has been taken by this attempt.");
  }
  const orderId = input.orderId ?? input.idempotencyKey;
  const walletTransfer: ConnectTransferResponse | null = null;
  let checkoutSession: CheckoutSessionResponse | null = null;
  let cardError: string | undefined;
  const verifyCardSession = (session: CheckoutSessionResponse, expectedSessionId?: string) => {
    if (!session.ok) throw new Error("checkout_session_verification_failed");
    if (expectedSessionId && session.checkoutSessionId !== expectedSessionId) throw new Error("checkout_session_mismatch");
    if (session.amountUsdCents !== undefined && centsFromReceizValue(session.amountUsdCents) !== funding.cardDeltaUsdCents) throw new Error("checkout_amount_mismatch");
    if (session.referenceId && session.referenceId !== orderId) throw new Error("checkout_reference_mismatch");
    if (input.merchantUsername && session.merchantUsername && session.merchantUsername !== input.merchantUsername) throw new Error("checkout_merchant_mismatch");
    if (input.merchantUsername && checkoutSessionIsPaid(session) && session.amountUsdCents === undefined) throw new Error("checkout_amount_unverified");
    if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(input.recipientUserId) && checkoutSessionIsPaid(session) &&
      session.recipientUserId !== input.recipientUserId) throw new Error("checkout_recipient_mismatch");
  };
  let cardIdempotencyKey = `${input.idempotencyKey}:card`;
  let reopenExpiredCard = false;

  if (input.resume && funding.cardDeltaUsdCents > 0) {
    checkoutSession = input.merchantUsername
      ? await input.receiz.merchantCheckoutSession({ checkoutSessionId: input.resume.checkoutSessionId, username: input.merchantUsername })
      : await input.receiz.checkoutSession({ checkoutSessionId: input.resume.checkoutSessionId });
    verifyCardSession(checkoutSession, input.resume.checkoutSessionId);
    if (input.reopenExpiredCard && checkoutSession.status?.trim().toLowerCase() === "expired") {
      // Only an independently verified expired card session can be replaced.
      // Reserve recovery was already reopened above; neither its amount nor
      // the original purchase changes, and concurrent retries use one card key.
      if (checkoutSession.amountUsdCents === undefined || checkoutSession.referenceId !== orderId ||
        (input.merchantUsername && checkoutSession.merchantUsername !== input.merchantUsername)) throw new Error("checkout_expired_session_unverified");
      cardIdempotencyKey = `${input.idempotencyKey}:card:expired:${checkoutSession.checkoutSessionId}`;
      reopenExpiredCard = true;
    }
  }
  if ((!input.resume || reopenExpiredCard) && funding.cardDeltaUsdCents > 0) {
    try {
      checkoutSession = await input.receiz.checkout({
      amountUsd: usdAmountFromCents(funding.cardDeltaUsdCents),
      username: input.merchantUsername,
      currency: "usd",
      uiMode: "embedded",
      referenceId: orderId,
      description: input.description ?? input.note,
      customerEmail: input.customerEmail,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      tenantHost: input.tenantHost,
      recipientUserId: input.recipientUserId,
      walletAppliedUsdCents: String(funding.walletAppliedUsdCents),
      totalUsdCents: String(funding.totalUsdCents),
      cart: input.cart,
      metadata: input.metadata,
      idempotencyKey: cardIdempotencyKey
    });
    checkoutSession = await refreshCheckoutSessionIfNeeded(input.receiz, checkoutSession);
      if (!checkoutSession?.ok || !checkoutSession.checkoutSessionId) throw new Error("checkout_session_creation_failed");
    } catch (error) {
      if (!reservePaymentToken) throw error;
      // Reserve has committed: return its exact recovery even when the card
      // request is ambiguous. Retry the same card key; never debit Reserve again.
      checkoutSession = null;
      cardError = "checkout_card_session_recovery_required";
    }
  }

  // An idempotent creation can return an already-paid session. Verify that
  // result through the same merchant status route used by continuation recovery.
  if ((!input.resume || reopenExpiredCard) && checkoutSessionIsPaid(checkoutSession) && checkoutSession?.checkoutSessionId) {
    const originalSessionId = checkoutSession.checkoutSessionId;
    checkoutSession = input.merchantUsername
      ? await input.receiz.merchantCheckoutSession({ checkoutSessionId: originalSessionId, username: input.merchantUsername })
      : await input.receiz.checkoutSession({ checkoutSessionId: originalSessionId });
    if (checkoutSession.checkoutSessionId !== originalSessionId) throw new Error("checkout_session_mismatch");
  }
  if (checkoutSession) {
    verifyCardSession(checkoutSession);
  }

  const cardSettled = !funding.cardRequired || checkoutSessionIsPaid(checkoutSession);

  const paid = totalUsdCents > 0 && cardSettled;
  if (paid) funding.cardRequired = false;
  const paymentRail = paymentRailFromFunding(funding);
  const proofBundle = proofBundleFrom(checkoutSession?.proofBundle);

  return {
    ok: true,
    paid,
    funding,
    wallet,
    walletTransfer,
    checkoutSession,
    paymentRail,
    settlementStatus: !cardSettled ? "card_required" : paid ? "settled" : "pending",
    receiptId: checkoutSession?.receiptId ?? nativeReceiptId,
    proofBundle,
    reservePaymentToken,
    cardError
  };
}
