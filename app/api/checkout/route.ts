import { NextRequest, NextResponse } from "next/server";
import { mockCheckout } from "@/lib/checkout/mock-checkout";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";

function amountFromBody(body: Record<string, unknown>) {
  const explicit = body.amountUsd ?? body.amount;
  if (explicit) return String(explicit);

  const totalLabel = String(body.totalLabel ?? "18.00");
  const normalized = totalLabel.replace(/[^0-9.]/g, "");
  return normalized || "18.00";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const accessToken =
    request.cookies.get("receiz_access_token")?.value ??
    process.env.RECEIZ_ACCESS_TOKEN ??
    process.env.RECEIZ_CONNECT_ACCESS_TOKEN;
  const hasReceizAccess = Boolean(accessToken);
  const checkoutMode =
    process.env.RECEIZ_CHECKOUT_MODE ??
    process.env.CHECKOUT_PROVIDER ??
    process.env.NEXT_PUBLIC_CHECKOUT_MODE ??
    (hasReceizAccess ? "receiz" : "mock");

  if (checkoutMode === "receiz" || checkoutMode === "live") {
    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "receiz_login_required",
          connectUrl: "/api/auth/receiz/start?returnTo=/"
        },
        { status: 401 }
      );
    }

    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });
    const session = await receiz.checkout({
      amountUsd: amountFromBody(body),
      currency: "usd",
      uiMode: body.uiMode === "embedded" ? "embedded" : "hosted",
      referenceId: String(body.referenceId ?? body.orderId ?? "receiz-commerce-order"),
      description: String(body.description ?? "Receiz.app proof-sealed order"),
      customerEmail: typeof body.customerEmail === "string" ? body.customerEmail : undefined,
      successUrl: typeof body.successUrl === "string" ? body.successUrl : undefined,
      cancelUrl: typeof body.cancelUrl === "string" ? body.cancelUrl : undefined
    });

    return NextResponse.json({ ok: true, mode: "receiz", session });
  }

  const order = mockCheckout.confirmMockCheckout({
    customerId: String(body.customerId ?? "customer-lena"),
    totalLabel: String(body.totalLabel ?? "$18.00"),
    status: "mock_paid",
    itemCount: Number(body.itemCount ?? 1)
  });

  return NextResponse.json({ ok: true, order });
}
