import { NextRequest, NextResponse } from "next/server";
import { readPaymentStatusContinuation } from "@/lib/checkout/payment-continuation";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { receizRequestSession } from "@/lib/receiz/session";
import { hostContextFromHost } from "@/lib/hosting/host-context";

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
    const payment = await receiz.merchantCheckoutSession({ checkoutSessionId: continuation.checkoutSessionId, username: continuation.merchantUsername });
    const paid = payment.ok === true && payment.status === "paid" && payment.checkoutSessionId === continuation.checkoutSessionId &&
      String(payment.amountUsdCents) === String(continuation.funding.cardDeltaUsdCents) &&
      continuation.funding.walletAppliedUsdCents === 0 &&
      continuation.funding.cardDeltaUsdCents === continuation.funding.totalUsdCents &&
      (!payment.referenceId || payment.referenceId === continuation.referenceId) &&
      (!payment.merchantUsername || payment.merchantUsername === continuation.merchantUsername);
    return NextResponse.json({ ok: true, paid, status: payment.status }, { headers });
  } catch {
    return NextResponse.json({ ok: false, error: "payment_status_unavailable" }, { status: 409, headers });
  }
}
