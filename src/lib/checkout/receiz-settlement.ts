import type {
  CheckoutSessionResponse,
  ConnectTransferResponse,
  ConnectWalletResponse
} from "@receiz/sdk";
import type { ReceizCommerceAdapter } from "@/lib/receiz/adapter";
import type { Order } from "@/types/domain";

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
};

export function centsFromUsdAmount(value: string | number | undefined | null) {
  const amount = typeof value === "number" ? value : Number(String(value ?? "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

export function centsFromReceizValue(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return 0;
  const cents = Number.parseInt(String(value), 10);
  return Number.isFinite(cents) ? Math.max(0, cents) : 0;
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
  const wallet = totalUsdCents > 0 ? await input.receiz.connectWallet() : null;
  const walletBalanceUsdCents = centsFromReceizValue(wallet?.balanceUsdCents);
  const funding = walletFirstFunding(totalUsdCents, walletBalanceUsdCents);
  const orderId = input.orderId ?? input.idempotencyKey;
  let walletTransfer: ConnectTransferResponse | null = null;
  let checkoutSession: CheckoutSessionResponse | null = null;

  if (funding.cardDeltaUsdCents > 0) {
    const cardIdempotencyKey = `${input.idempotencyKey}:card`;
    checkoutSession = await input.receiz.checkout({
      amountUsd: usdAmountFromCents(funding.cardDeltaUsdCents),
      currency: "usd",
      uiMode: "hosted",
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
  }

  if (funding.walletAppliedUsdCents > 0) {
    const walletIdempotencyKey = `${input.idempotencyKey}:wallet`;
    walletTransfer = await input.receiz.connectTransfer(
      {
        recipientUserId: input.recipientUserId,
        unit: "usd",
        amountUsd: usdAmountFromCents(funding.walletAppliedUsdCents),
        note: input.note,
        clientNonce: walletIdempotencyKey
      },
      walletIdempotencyKey
    );
  }

  const paymentRail = paymentRailFromFunding(funding);
  const proofBundle = proofBundleFrom(checkoutSession?.proofBundle) ?? proofBundleFrom(walletTransfer?.proofBundle);

  return {
    ok: true,
    paid: !funding.cardRequired,
    funding,
    wallet,
    walletTransfer,
    checkoutSession,
    paymentRail,
    settlementStatus: funding.cardRequired ? "card_required" : "settled",
    receiptId: checkoutSession?.receiptId ?? walletTransfer?.ledgerEventId ?? walletTransfer?.transferId,
    proofBundle
  };
}
