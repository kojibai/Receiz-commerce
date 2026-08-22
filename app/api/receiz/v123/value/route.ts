import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { receizRequestSession } from "@/lib/receiz/session";
import { projectionReport, zeroWriteReport } from "@/lib/receiz/v123/authority-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "no-store" };

export async function GET(request: NextRequest) {
  const session = receizRequestSession(request);
  const host = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain);
  if (!session.cookieAccessToken || session.sessionScope !== host.storageKey) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED", writes: 0, authority: zeroWriteReport("receiz.value.execution.v123", "UNAUTHORIZED") }, { status: 401, headers });
  }
  const idempotencyKey = new URL(request.url).searchParams.get("idempotencyKey")?.trim();
  if (!idempotencyKey) {
    return NextResponse.json({ ok: false, code: "V123_VALUE_IDEMPOTENCY_KEY_REQUIRED", writes: 0, authority: zeroWriteReport("receiz.value.execution.v123", "V123_VALUE_IDEMPOTENCY_KEY_REQUIRED") }, { status: 400, headers });
  }
  try {
    const adapter = createReceizCommerceAdapter({ accessToken: session.cookieAccessToken });
    const data = await adapter.v123.value.executionByIdempotencyKey(idempotencyKey);
    return NextResponse.json({ data, authority: projectionReport("receiz.value.execution.v123", "receiz-server-projection") }, { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "V123_VALUE_EXECUTION_LOOKUP_FAILED";
    return NextResponse.json({ ok: false, code, writes: 0, authority: zeroWriteReport("receiz.value.execution.v123", code) }, { status: 400, headers });
  }
}
