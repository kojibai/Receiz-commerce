import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { receizRequestSession } from "@/lib/receiz/session";
import { zeroWriteReport } from "@/lib/receiz/v122/authority-report";
import {
  buildAuthenticatedAdmission,
  parseReceizSubjectGet,
  parseReceizSubjectPost,
  subjectRouteResult,
} from "@/lib/receiz/v122/subject-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "cache-control": "no-store" };

async function authenticatedContext(request: NextRequest) {
  const session = receizRequestSession(request);
  const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const host = hostContextFromHost(requestHost);
  const accessToken = session.cookieAccessToken;
  if (!accessToken || session.sessionScope !== host.storageKey) return null;
  const profile = await loadReceizConnectProfile(accessToken).catch(() => null);
  if (!profile?.handle) return null;
  return { adapter: createReceizCommerceAdapter({ accessToken }), ownerReceizId: profile.handle };
}

function unauthorized() {
  return NextResponse.json({
    ok: false,
    code: "UNAUTHORIZED",
    writes: 0,
    authority: zeroWriteReport("receiz.subject.v122", "UNAUTHORIZED"),
  }, { status: 401, headers });
}

function edgeOnly(action: "exportEdgeBundle" | "importEdgeBundle") {
  const code = "EDGE_VERIFICATION_REQUIRED";
  return NextResponse.json({
    ok: false,
    code,
    writes: 0,
    message: `${action} requires an in-process independent edge verifier and cannot accept serialized authority.`,
    authority: zeroWriteReport("receiz.subject.edge_bundle.v122", code),
  }, { status: 409, headers });
}

export async function GET(request: NextRequest) {
  const context = await authenticatedContext(request);
  if (!context) return unauthorized();
  try {
    const operation = parseReceizSubjectGet(request.url);
    if (operation.action === "state") {
      const data = await context.adapter.v122.subjects.state(operation.subjectId);
      return NextResponse.json(subjectRouteResult("receiz.subject.state.v122", data), { headers });
    }
    if (operation.action === "accessBinding") {
      const data = await context.adapter.v122.subjects.accessBinding(operation.subjectId);
      return NextResponse.json(subjectRouteResult("receiz.subject.access-public-key.v122", data), { headers });
    }
    return edgeOnly(operation.action);
  } catch (error) {
    const code = error instanceof Error ? error.message : "receiz_subject_request_invalid";
    return NextResponse.json({ ok: false, code, writes: 0, authority: zeroWriteReport("receiz.subject.v122", code) }, { status: 400, headers });
  }
}

export async function POST(request: NextRequest) {
  const context = await authenticatedContext(request);
  if (!context) return unauthorized();
  try {
    const operation = await parseReceizSubjectPost(request);
    if (operation.action === "admit") {
      const data = await context.adapter.v122.subjects.admit(buildAuthenticatedAdmission(operation, context.ownerReceizId));
      return NextResponse.json(subjectRouteResult("receiz.subject.admit.v122", data), { status: data.ok ? 200 : 409, headers });
    }
    if (operation.action === "publishAccessKey") {
      const data = await context.adapter.v122.subjects.publishAccessKey(operation);
      return NextResponse.json(subjectRouteResult("receiz.subject.access-public-key.v122", data), { status: data.ok ? 200 : 409, headers });
    }
    return edgeOnly(operation.action);
  } catch (error) {
    const code = error instanceof Error ? error.message : "receiz_subject_request_invalid";
    return NextResponse.json({ ok: false, code, writes: 0, authority: zeroWriteReport("receiz.subject.v122", code) }, { status: 400, headers });
  }
}
