// @receiz-generated receiz.app.contract.v1
// Regenerate with receiz app apply; do not edit directly.

import { parseReceizWebhookRequest } from "@receiz/sdk";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const secret = process.env.RECEIZ_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false }, { status: 503 });
  const parsed = await parseReceizWebhookRequest(request, { secret });
  return NextResponse.json({ ok: true, eventId: parsed.event.id });
}
