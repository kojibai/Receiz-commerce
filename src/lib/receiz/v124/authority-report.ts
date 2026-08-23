import type { ReceizOperationalCapabilityReportV124 } from "@receiz/sdk";

/** Public/operator-safe projection. Exact scopes and dependency heads stay server-side. */
export function projectReceizV124Qualification(report: ReceizOperationalCapabilityReportV124) {
  return Object.freeze({
    schema: "receiz.app.operational-capability-report.v124" as const,
    applicationId: report.applicationId,
    qualifiedAtKaiUPulse: report.qualifiedAtKaiUPulse,
    reportDigest: report.reportDigest,
    results: report.results.map((result) => Object.freeze({
      operation: result.operation,
      status: result.status,
      dependencyHealth: result.dependencyHealth,
      reasonCode: result.reasonCode,
      retry: result.retry,
      evidence: result.evidence,
    })),
    authority: Object.freeze({
      reportIsProofAuthority: false as const,
      reportIsOperationalAuthority: false as const,
      representationCanOutrankSource: false as const,
      strongerTruth: "sealed-receiz-proof-object" as const,
    }),
  });
}
