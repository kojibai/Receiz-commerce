import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { receizRequestSession } from "@/lib/receiz/session";
import { projectionReport, zeroWriteReport } from "@/lib/receiz/v122/authority-report";

export const runtime = "nodejs";
const headers = { "cache-control": "no-store" };

const ISSUE_FIELDS = new Set([
  "action", "allowedCommandKinds", "expiresAtKai", "expectedOwnerHead", "expectedWorkerHead", "maximumGeometryUnits",
  "maximumResourcePhiMicro", "nonce", "ownerSubjectId", "regionIds", "revocationHead", "workerSubjectId", "worldIds",
]);

function bodyRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("receiz_mandate_request_invalid");
  return value as Record<string, unknown>;
}

async function adapterFor(request: NextRequest) {
  const session = receizRequestSession(request);
  const host = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain);
  return session.cookieAccessToken && session.sessionScope === host.storageKey
    ? createReceizCommerceAdapter({ accessToken: session.cookieAccessToken })
    : null;
}

export async function POST(request: NextRequest) {
  const adapter = await adapterFor(request);
  if (!adapter) return NextResponse.json({ ok: false, code: "UNAUTHORIZED", writes: 0, authority: zeroWriteReport("receiz.subject-mandate.v122", "UNAUTHORIZED") }, { status: 401, headers });
  try {
    const body = bodyRecord(await request.json());
    if (["authority", "capability", "receipt", "verification"].some((key) => key in body)) throw new Error("receiz_mandate_authority_field_forbidden");
    if (body.action === "state") {
      if (Object.keys(body).some((key) => !["action", "mandateId"].includes(key)) || typeof body.mandateId !== "string") throw new Error("receiz_mandate_state_invalid");
      const data = await adapter.v122.mandates.state({ mandateId: body.mandateId });
      return NextResponse.json({ data, authority: projectionReport("receiz.subject-mandate.v122", "receiz-server-projection") }, { headers });
    }
    if (body.action === "revoke") {
      if (Object.keys(body).some((key) => !["action", "mandateId", "expectedRevocationHead", "idempotencyKey"].includes(key)) || typeof body.mandateId !== "string") throw new Error("receiz_mandate_revoke_invalid");
      const { action: _action, ...input } = body;
      const data = await adapter.v122.mandates.revoke(input as Record<string, unknown> & { mandateId: string });
      return NextResponse.json({ data, authority: { ...projectionReport("receiz.subject-mandate.revoke.v122", "receiz-sdk"), actionClass: "commit" } }, { headers });
    }
    if (body.action === "issue") {
      if (Object.keys(body).some((key) => !ISSUE_FIELDS.has(key))) throw new Error("receiz_mandate_issue_invalid");
      const { action: _action, ...input } = body;
      const data = await adapter.v122.mandates.issue(input);
      return NextResponse.json({ data, authority: { ...projectionReport("receiz.subject-mandate.issue.v122", "receiz-sdk"), actionClass: "commit" } }, { headers });
    }
    throw new Error("receiz_mandate_action_invalid");
  } catch (error) {
    const code = error instanceof Error ? error.message : "receiz_mandate_request_invalid";
    return NextResponse.json({ ok: false, code, writes: 0, authority: zeroWriteReport("receiz.subject-mandate.v122", code) }, { status: 400, headers });
  }
}
