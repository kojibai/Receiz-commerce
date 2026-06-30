import { NextRequest, NextResponse } from "next/server";
import { mockCheckout } from "@/lib/checkout/mock-checkout";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { receizLoginRequired } from "@/lib/receiz/session";
import { platform } from "@/lib/platform";

function amountFromBody(body: Record<string, unknown>) {
  const explicit = body.amountUsd ?? body.amount;
  if (explicit) return String(explicit);

  const totalLabel = String(body.totalLabel ?? "18.00");
  const normalized = totalLabel.replace(/[^0-9.]/g, "");
  return normalized || "18.00";
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
  const referer = request.headers.get("referer");
  let returnTo = "/";

  if (referer) {
    try {
      const url = new URL(referer);
      returnTo = `${url.pathname}${url.search}`;
    } catch {
      returnTo = "/";
    }
  }

  if (checkoutMode === "receiz" || checkoutMode === "live") {
    if (!hasScopedReceizAccess || !accessToken) {
      return NextResponse.json(receizLoginRequired(returnTo), { status: 401 });
    }

    const merchantReceizId =
      typeof body.merchantReceizId === "string" && body.merchantReceizId.trim()
        ? body.merchantReceizId.trim()
        : hostContext.tenantSlug
          ? `${hostContext.tenantSlug}.receiz.id`
          : process.env.RECEIZ_DEFAULT_MERCHANT_RECEIZ_ID ?? "";
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });
    const wallet = await receiz.connectWallet().catch((error) => ({
      ok: false,
      error: "receiz_wallet_unavailable",
      message: error instanceof Error ? error.message : "Unable to read Receiz wallet"
    }));
    const session = await receiz.checkout({
      amountUsd: amountFromBody(body),
      currency: "usd",
      uiMode: body.uiMode === "embedded" ? "embedded" : "hosted",
      referenceId: String(body.referenceId ?? body.orderId ?? "receiz-commerce-order"),
      description: String(body.description ?? "Receiz.app proof-sealed order"),
      customerEmail: typeof body.customerEmail === "string" ? body.customerEmail : undefined,
      successUrl: typeof body.successUrl === "string" ? body.successUrl : undefined,
      cancelUrl: typeof body.cancelUrl === "string" ? body.cancelUrl : undefined,
      platform: platform.productName,
      tenantSlug: String(body.tenantSlug ?? hostContext.tenantSlug ?? hostContext.customDomain ?? "default"),
      tenantHost: String(body.tenantHost ?? hostContext.tenantHost ?? host),
      merchantReceizId,
      settlementRecipientReceizId: merchantReceizId,
      settlementRecipientUserId: String(
        body.settlementRecipientUserId ?? process.env.RECEIZ_DEFAULT_SETTLEMENT_USER_ID ?? ""
      ),
      paymentRailPreference: "receiz_wallet",
      walletFirst: true,
      cardFallback: true,
      fallbackRail: "credit_card",
      settlementWallet: "merchant_receiz_reserve",
      buyerWalletUserId: wallet.ok && "userId" in wallet ? wallet.userId : undefined,
      proofObjectKind: "receiz.app.order.v1"
    });

    return NextResponse.json({
      ok: true,
      mode: "receiz",
      wallet,
      paymentRails: {
        preferred: "receiz_wallet",
        fallback: "credit_card",
        settlement: "merchant_receiz_reserve",
        merchantReceizId
      },
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
