import { NextRequest, NextResponse } from "next/server";
import { readPaymentStatusContinuation } from "@/lib/checkout/payment-continuation";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { receizRequestSession } from "@/lib/receiz/session";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { createWalletFirstReceizSettlement } from "@/lib/checkout/receiz-settlement";
import { reserveContext, isPendingReserveSession } from "@/lib/checkout/native-reserve-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !["storefront_checkout", "hosting_plan", "custom_domain"].includes(body.purpose) || typeof body.continuationToken !== "string") {
      return NextResponse.json({ ok: false, error: "payment_status_invalid" }, { status: 400, headers });
    }
    const host = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
    const session = receizRequestSession(request);
    const scopedToken = session.sessionScope === host.storageKey ? session.cookieAccessToken : undefined;
    const profile = await loadReceizConnectProfile(scopedToken).catch(() => null);
    // This read reports no customer data and grants no account access. The
    // original signed coordinate remains readable when the five-minute
    // permission expires while a customer is entering card details.
    const continuation = readPaymentStatusContinuation(body.continuationToken, {
      purpose: body.purpose, actorReceizId: profile?.handle,
      tenantHost: body.purpose === "storefront_checkout" ? host.tenantHost ?? host.host : undefined
    });
    const receiz = createReceizCommerceAdapter({ baseUrl: process.env.RECEIZ_BASE_URL });
    if (isPendingReserveSession(continuation.checkoutSessionId)) {
      return NextResponse.json({ ok: true, paid: false, status: "reserve_pending" }, { headers });
    }
    const quote = continuation.context.quote as { recipientUserId?: string } | undefined;
    const operation = continuation.context.operation as { recipientUserId?: string } | undefined;
    const reserve = reserveContext(continuation);
    const settlement = await createWalletFirstReceizSettlement({ receiz, amountUsd: continuation.amountUsd,
      tenantHost: continuation.tenantHost, merchantUsername: continuation.merchantUsername,
      recipientUserId: quote?.recipientUserId ?? operation?.recipientUserId ?? continuation.merchantUsername,
      orderId: continuation.referenceId, idempotencyKey: reserve.originalReserveQuote?.idempotencyKey ?? continuation.referenceId, buyerAuthenticated: false,
      note: "Inspect the original payment", ...reserve,
      resume: { checkoutSessionId: continuation.checkoutSessionId, funding: continuation.funding } });
    return NextResponse.json({ ok: true, paid: settlement.paid, status: settlement.checkoutSession?.status ?? settlement.settlementStatus }, { headers });
  } catch {
    return NextResponse.json({ ok: false, error: "payment_status_unavailable" }, { status: 409, headers });
  }
}
