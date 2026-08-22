import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { receizRequestSession } from "@/lib/receiz/session";
import { admittedWriteReport, projectionReport, zeroWriteReport } from "@/lib/receiz/v122/authority-report";
import { parseReceizWorldOperation } from "@/lib/receiz/v122/world-request";

export const runtime = "nodejs";
const headers = { "cache-control": "no-store" };

async function adapterFor(request: NextRequest) {
  const session = receizRequestSession(request);
  const host = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain);
  return session.cookieAccessToken && session.sessionScope === host.storageKey
    ? createReceizCommerceAdapter({ accessToken: session.cookieAccessToken })
    : null;
}

function executionResponse(primitive: string, data: unknown) {
  const outcome = data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : null;
  const authority = outcome?.status === "committed"
    ? admittedWriteReport(primitive)
    : outcome?.status === "zero-write"
      ? zeroWriteReport(primitive, "world_execution_zero_write")
      : projectionReport(primitive, "receiz-server-projection");
  return NextResponse.json({ data, authority }, { headers });
}

export async function POST(request: NextRequest) {
  const adapter = await adapterFor(request);
  if (!adapter) return NextResponse.json({ ok: false, code: "UNAUTHORIZED", writes: 0, authority: zeroWriteReport("receiz.world.v122", "UNAUTHORIZED") }, { status: 401, headers });
  try {
    const operation = parseReceizWorldOperation(await request.json());
    switch (operation.action) {
      case "validate":
        return NextResponse.json({ data: await adapter.v122.world.validateTransaction(operation.transaction), authority: projectionReport("receiz.world.transaction.validate.v122", "receiz-sdk") }, { headers });
      case "execute":
        return executionResponse("receiz.world.transaction.execute.v122", await adapter.v122.world.executeTransactionV122({ transaction: operation.transaction }));
      case "execution":
        return executionResponse("receiz.world.execution.v122", await adapter.v122.world.execution(operation));
      case "executionByIdempotency":
        return executionResponse("receiz.world.execution.v122", await adapter.v122.world.executionByIdempotencyKey({ worldId: operation.worldId, idempotencyKey: operation.idempotencyKey }));
      case "additions":
        return NextResponse.json({ data: await adapter.v122.world.additionsV122(operation), authority: projectionReport("receiz.world.additions.v122", "receiz-server-projection") }, { headers });
      case "planMultiWorld":
        return NextResponse.json({ data: await adapter.v122.world.planMultiWorldTransaction(operation), authority: projectionReport("receiz.multi-world.plan.v122", "receiz-sdk") }, { headers });
      case "executeMultiWorld":
        return executionResponse("receiz.multi-world.execute.v122", await adapter.v122.world.executeMultiWorldTransaction({ plan: operation.plan }));
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "receiz_world_request_invalid";
    return NextResponse.json({ ok: false, code, writes: 0, authority: zeroWriteReport("receiz.world.v122", code) }, { status: 400, headers });
  }
}
