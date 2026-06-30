import { NextResponse } from "next/server";
import { mockCheckout } from "@/lib/checkout/mock-checkout";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const order = mockCheckout.confirmMockCheckout({
    customerId: String(body.customerId ?? "customer-lena"),
    totalLabel: String(body.totalLabel ?? "$18.00"),
    status: "mock_paid",
    itemCount: Number(body.itemCount ?? 1)
  });

  return NextResponse.json({ ok: true, order });
}
