import { NextRequest, NextResponse } from "next/server";
import { readOrderRecoveryCoordinates } from "@/lib/checkout/order-recovery";
import { openPaidOrderDelivery } from "@/lib/delivery/paid-delivery";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { receizAuthorityRequired, receizRequestSession } from "@/lib/receiz/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };

export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get("content-length")) > 1_550_000) throw new Error("delivery_request_too_large");
    const body = await request.json();
    const host = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
    const coordinates = readOrderRecoveryCoordinates(body.recoveryToken, host.tenantHost ?? host.host);
    const session = receizRequestSession(request);
    const profile = session.cookieAccessToken && session.sessionScope === host.storageKey
      ? await loadReceizConnectProfile(session.cookieAccessToken).catch(() => null) : null;
    const result = await openPaidOrderDelivery({ receiz: createReceizCommerceAdapter({ baseUrl: process.env.RECEIZ_BASE_URL }), coordinates,
      reader: { handle: profile?.handle, userId: profile?.id } });
    return NextResponse.json({ ok: true, orderId: result.order.id, files: result.files.map(({ bytes, ...file }) => ({ ...file, bytes: Buffer.from(bytes).toString("base64") })) }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "delivery_unavailable";
    if (message === "order_recovery_identity_required") return NextResponse.json(receizAuthorityRequired("/account", "wallet_checkout"), { status: 401, headers });
    return NextResponse.json({ ok: false, error: message }, { status: 409, headers });
  }
}
