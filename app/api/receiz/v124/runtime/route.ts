import { NextResponse } from "next/server";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { projectReceizV124Qualification } from "@/lib/receiz/v124/authority-report";
import { createReceizV124ProductionRuntime } from "@/lib/receiz/v124/production-runtime";

export const dynamic = "force-dynamic";

const APPLICATION_ID = process.env.RECEIZ_APPLICATION_ID || "receiz-commerce-kit";
const AUDIENCE = process.env.RECEIZ_RUNTIME_AUDIENCE || APPLICATION_ID;
const DEFAULT_OPERATIONS = Object.freeze([
  "runtime.authority-session.open",
  "execution.atomic.stage",
  "execution.atomic.execute",
  "domain.replay.verified",
  "identity.public-recipient.resolve",
  "source.sealed.publish",
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.getAll("operation").map((value) => value.trim()).filter(Boolean);
  const operations = requested.length ? [...new Set(requested)].slice(0, 32) : DEFAULT_OPERATIONS;
  const runtime = createReceizV124ProductionRuntime({
    applicationId: APPLICATION_ID,
    audience: AUDIENCE,
    adapter: createReceizCommerceAdapter(),
  });

  try {
    const report = await runtime.qualify(operations);
    return NextResponse.json({
      ok: report.results.every((result) => result.status === "available"),
      sdkVersion: "124.0.1",
      rulesetVersion: "124.0.0",
      kai: runtime.kaiNow(),
      qualification: projectReceizV124Qualification(report),
    }, { status: report.results.some((result) => result.status === "unavailable") ? 503 : 200 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      sdkVersion: "124.0.1",
      rulesetVersion: "124.0.0",
      error: "RECEIZ_V124_RUNTIME_QUALIFICATION_UNAVAILABLE",
      detail: error instanceof Error ? error.message : "unknown",
      authority: {
        methodPresenceIsOperationalEvidence: false,
        representationCanOutrankSource: false,
        strongerTruth: "sealed-receiz-proof-object",
      },
    }, { status: 503 });
  }
}
