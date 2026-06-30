import { NextResponse } from "next/server";
import { mockHosting } from "@/lib/hosting/mock-hosting";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hosting: mockHosting.getHostingStatus(),
    billing: mockHosting.getBillingStatus(),
    checklist: mockHosting.getPublishChecklist()
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "subdomain");

  if (action === "plan") {
    const result = mockHosting.selectHostingPlan(String(body.plan ?? "pro") as ReturnType<typeof mockHosting.getHostingStatus>["plan"]);
    return NextResponse.json({ ok: true, action, ...result });
  }

  if (action === "payment") {
    return NextResponse.json({
      ok: true,
      action,
      billing: mockHosting.addBillingMethod(String(body.paymentMethodLabel ?? "Visa ending 4242"))
    });
  }

  const subdomain = String(body.subdomain ?? "boost.receiz.store");
  return NextResponse.json({
    ok: true,
    action,
    hosting: mockHosting.claimSubdomain(subdomain)
  });
}
