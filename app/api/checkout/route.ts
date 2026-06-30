import { NextRequest, NextResponse } from "next/server";
import { mockCheckout } from "@/lib/checkout/mock-checkout";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { platform } from "@/lib/platform";

function amountFromBody(body: Record<string, unknown>) {
  const explicit = body.amountUsd ?? body.amount;
  if (explicit) return String(explicit);

  const totalLabel = String(body.totalLabel ?? "18.00");
  const normalized = totalLabel.replace(/[^0-9.]/g, "");
  return normalized || "18.00";
}

function usdCentsFromAmount(value: string) {
  const normalized = value.replace(/[^0-9.]/g, "");
  const amount = Number(normalized || "0");
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

function usdLabelFromCents(cents: number) {
  return `$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

function centsFromValue(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return 0;
  const cents = Number.parseInt(String(value), 10);
  return Number.isFinite(cents) ? Math.max(0, cents) : 0;
}

function checkoutFunding(totalUsdCents: number, walletBalanceUsdCents: number) {
  const walletAppliedUsdCents = Math.min(totalUsdCents, walletBalanceUsdCents);
  const cardDeltaUsdCents = Math.max(0, totalUsdCents - walletAppliedUsdCents);

  return {
    strategy: "receiz_wallet_first" as const,
    totalUsdCents,
    walletBalanceUsdCents,
    walletAppliedUsdCents,
    cardDeltaUsdCents,
    totalLabel: usdLabelFromCents(totalUsdCents),
    walletBalanceLabel: usdLabelFromCents(walletBalanceUsdCents),
    walletAppliedLabel: usdLabelFromCents(walletAppliedUsdCents),
    cardDeltaLabel: usdLabelFromCents(cardDeltaUsdCents),
    cardRequired: cardDeltaUsdCents > 0
  };
}

function paymentRails(merchantReceizId: string) {
  return {
    preferred: "receiz_wallet" as const,
    fallback: "credit_card" as const,
    settlement: "merchant_receiz_reserve" as const,
    merchantReceizId
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const accessToken = request.cookies.get("receiz_access_token")?.value;
  const sessionScope = request.cookies.get("receiz_session_scope")?.value;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(host);
  const hasScopedReceizAccess = Boolean(accessToken && sessionScope === hostContext.storageKey);
  const configuredCheckoutMode =
    process.env.RECEIZ_CHECKOUT_MODE ??
    process.env.CHECKOUT_PROVIDER ??
    process.env.NEXT_PUBLIC_CHECKOUT_MODE;
  const checkoutMode =
    configuredCheckoutMode ??
    (hostContext.surface === "tenant" || process.env.NEXT_PUBLIC_AUTH_MODE === "receiz_id" || hasScopedReceizAccess
      ? "receiz"
      : "mock");
  if (checkoutMode === "receiz" || checkoutMode === "live") {
    const merchantReceizId =
      typeof body.merchantReceizId === "string" && body.merchantReceizId.trim()
        ? body.merchantReceizId.trim()
        : hostContext.tenantSlug
          ? `${hostContext.tenantSlug}.receiz.id`
          : process.env.RECEIZ_DEFAULT_MERCHANT_RECEIZ_ID ?? "";
    const totalUsdCents = usdCentsFromAmount(amountFromBody(body));

    if (!hasScopedReceizAccess || !accessToken) {
      const funding = checkoutFunding(totalUsdCents, 0);

      return NextResponse.json({
        ok: true,
        mode: "receiz_wallet_first",
        wallet: {
          ok: false,
          error: "receiz_wallet_not_scoped",
          message: "No scoped Receiz wallet session is available; card handles the remaining checkout delta."
        },
        paymentRails: paymentRails(merchantReceizId),
        funding,
        session: {
          ok: true,
          checkoutSessionId: `in_app_${Date.now()}`,
          status: funding.cardRequired ? "card_required" : "wallet_reserved"
        }
      });
    }

    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });
    const checkout = await receiz.oneClickCheckout({
      tenantHost: String(body.tenantHost ?? hostContext.tenantHost ?? host),
      orderId: String(body.referenceId ?? body.orderId ?? `order_${Date.now()}`),
      amountUsd: amountFromBody(body),
      currency: "usd",
      walletFirst: true,
      cardFallback: true,
      customerEmail: typeof body.customerEmail === "string" ? body.customerEmail : undefined,
      successUrl: typeof body.successUrl === "string" ? body.successUrl : undefined,
      cancelUrl: typeof body.cancelUrl === "string" ? body.cancelUrl : undefined,
      idempotencyKey: String(body.referenceId ?? body.orderId ?? `checkout:${hostContext.storageKey}:${amountFromBody(body)}`),
      cart: {
        items: [
          {
            id: "receiz-commerce-cart",
            title: String(body.description ?? "Receiz.app proof-sealed order"),
            quantity: Number(body.itemCount ?? 1),
            amountUsd: amountFromBody(body)
          }
        ]
      }
    });
    const walletBalanceUsdCents = checkout.wallet && "balanceUsdCents" in checkout.wallet
      ? centsFromValue(checkout.wallet.balanceUsdCents)
      : 0;
    const walletAppliedUsdCents = centsFromValue(checkout.funding.walletAppliedUsdCents);
    const cardDeltaUsdCents = centsFromValue(checkout.funding.cardDeltaUsdCents);
    const funding = {
      ...checkoutFunding(totalUsdCents, walletBalanceUsdCents),
      walletAppliedUsdCents,
      cardDeltaUsdCents,
      walletAppliedLabel: usdLabelFromCents(walletAppliedUsdCents),
      cardDeltaLabel: usdLabelFromCents(cardDeltaUsdCents),
      cardRequired: cardDeltaUsdCents > 0
    };
    const session = checkout.checkoutSession ?? {
      ok: checkout.ok,
      checkoutSessionId: checkout.orderId ?? `receiz_${Date.now()}`,
      status: funding.cardRequired ? "card_required" : "wallet_reserved"
    };

    return NextResponse.json({
      ok: true,
      mode: "receiz",
      wallet: checkout.wallet,
      paymentRails: paymentRails(merchantReceizId),
      funding,
      proofObject: checkout.proofObject,
      events: checkout.events,
      session
    });
  }

  const order = mockCheckout.confirmMockCheckout({
    customerId: String(body.customerId ?? "customer-lena"),
    totalLabel: String(body.totalLabel ?? "$18.00"),
    status: "mock_paid",
    itemCount: Number(body.itemCount ?? 1)
  });

  return NextResponse.json({ ok: true, order });
}
