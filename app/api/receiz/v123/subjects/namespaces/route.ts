import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { receizRequestSession } from "@/lib/receiz/session";
import { projectionReport, zeroWriteReport } from "@/lib/receiz/v123/authority-report";
import { parseReceizNamespaceResolutionV123 } from "@/lib/receiz/v123/planning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "no-store" };

export async function POST(request: NextRequest) {
  const session = receizRequestSession(request);
  const host = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain);
  if (!session.cookieAccessToken || session.sessionScope !== host.storageKey) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED", writes: 0, authority: zeroWriteReport("receiz.subject.namespaces.v123", "UNAUTHORIZED") }, { status: 401, headers });
  }
  try {
    const input = parseReceizNamespaceResolutionV123(await request.json());
    const adapter = createReceizCommerceAdapter({ accessToken: session.cookieAccessToken });
    const data = await adapter.v123.subjects.resolveNamespaces(input);
    if ("ok" in data && data.ok === false) {
      return NextResponse.json({ data, authority: zeroWriteReport("receiz.subject.namespaces.v123", data.code) }, { status: data.code === "SUBJECT_HEAD_STALE" ? 409 : 404, headers });
    }
    return NextResponse.json({ data, authority: projectionReport("receiz.subject.namespace-resolution.v123", "receiz-sdk") }, { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "V123_NAMESPACE_INPUT_INVALID";
    return NextResponse.json({ ok: false, code, writes: 0, authority: zeroWriteReport("receiz.subject.namespaces.v123", code) }, { status: 400, headers });
  }
}
