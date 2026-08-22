import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { receizRequestSession } from "@/lib/receiz/session";
import { projectionReport, zeroWriteReport } from "@/lib/receiz/v122/authority-report";
import { planReceizValue, type ReceizValuePlanInput } from "@/lib/receiz/v122/value-request";

export const runtime = "nodejs";
const headers = { "cache-control": "no-store" };
const fields = new Set([
  "rail", "amountPhiMicro", "sourceProofObjectId", "sourceValueHead", "destinationSubjectId",
  "expectedDestinationHead", "usdPerPhiMicrocents", "priceBasis",
]);

export async function POST(request: NextRequest) {
  const session = receizRequestSession(request);
  const host = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain);
  if (!session.cookieAccessToken || session.sessionScope !== host.storageKey) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED", writes: 0, authority: zeroWriteReport("receiz.world.value-intent.v122", "UNAUTHORIZED") }, { status: 401, headers });
  }
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("receiz_value_request_invalid");
    const body = value as Record<string, unknown>;
    if (Object.keys(body).some((key) => !fields.has(key))) throw new Error("receiz_value_request_unknown_or_authority_field");
    const intent = await planReceizValue(body as ReceizValuePlanInput);
    return NextResponse.json({
      data: intent,
      committed: false,
      movedQuantity: { unit: "phi-micro", amount: intent.amountPhiMicro },
      usd: { role: "deterministic-display-projection", quotedCents: intent.quotedUsdCents },
      authority: { ...projectionReport("receiz.world.value-intent.v122", "receiz-sdk"), actionClass: "plan" },
    }, { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "receiz_value_request_invalid";
    return NextResponse.json({ ok: false, code, writes: 0, authority: zeroWriteReport("receiz.world.value-intent.v122", code) }, { status: 400, headers });
  }
}
