import { NextRequest, NextResponse } from "next/server";
import { executeMarketAdmission } from "@/lib/receiz/wilds-market-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const result = await executeMarketAdmission(request, await request.json());
    return NextResponse.json({ ok: true, ...result }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "wilds_market_admission_failed";
    const status = message.includes("owner") || message.includes("authority") ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { "cache-control": "private, no-store" } });
  }
}
