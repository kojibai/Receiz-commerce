import { NextRequest, NextResponse } from "next/server";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { projectionReport, zeroWriteReport } from "@/lib/receiz/v123/authority-report";
import {
  planReceizWorldCommandCanonicalV123,
  planReceizWorldTransactionCanonicalV123,
} from "@/lib/receiz/v123/planning";

export const runtime = "nodejs";
const headers = { "cache-control": "no-store" };

function requestBody(value: unknown): Readonly<{ action: "planCommand" | "planTransaction"; input: unknown }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("V123_WORLD_PLAN_REQUEST_INVALID");
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => key !== "action" && key !== "input")) throw new TypeError("V123_WORLD_PLAN_REQUEST_INVALID");
  if (body.action !== "planCommand" && body.action !== "planTransaction") throw new TypeError("V123_WORLD_PLAN_ACTION_INVALID");
  return { action: body.action, input: body.input };
}

export async function POST(request: NextRequest) {
  try {
    const operation = requestBody(await request.json());
    const adapter = createReceizCommerceAdapter();
    const data = operation.action === "planCommand"
      ? await planReceizWorldCommandCanonicalV123(adapter, operation.input)
      : await planReceizWorldTransactionCanonicalV123(adapter, operation.input);
    return NextResponse.json({
      data,
      committed: false,
      authority: { ...projectionReport(`receiz.world.${operation.action}.v123`, "receiz-sdk"), actionClass: "plan" },
    }, { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "V123_WORLD_PLAN_REQUEST_INVALID";
    return NextResponse.json({ ok: false, code, writes: 0, authority: zeroWriteReport("receiz.world.plan.v123", code) }, { status: 400, headers });
  }
}
