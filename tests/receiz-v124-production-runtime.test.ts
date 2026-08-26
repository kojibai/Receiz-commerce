import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ReceizCommerceAdapter } from "../src/lib/receiz/adapter";
import { createReceizV124ProductionRuntime } from "../src/lib/receiz/v124/production-runtime";

const hash = (value: string) => value.padEnd(64, value).slice(0, 64);

function mockAdapter(status: "available" | "unavailable" = "available") {
  const calls: string[] = [];
  const session = {
    schema: "receiz.authority-session.v124", status: "active", authoritySessionHandle: "session-handle",
    applicationId: "app", audience: "app", actorSubjectId: "subject", subjectSourceArtifactSha256: hash("a"),
    identityArtifactSha256: hash("b"), identityKeyId: "key", grantedScopes: ["receiz:domains.write"],
    grantedRails: ["domains"], namespaces: [], revocationHead: hash("c"), issuedAtKaiUPulse: 1,
    expiresAtKaiUPulse: 2, sessionBindingDigest: hash("d"), runtimeReceiptDigest: hash("e"),
    authority: { sessionIsProofAuthority: false, strongerTruth: "receiz-identity-artifact" },
  };
  const plan = { schema: "receiz.operation-plan.v124", applicationId: "app", exactPlanDigest: hash("p") };
  const handle = { schema: "receiz.durable-execution-handle.v124", applicationId: "app", authority: { handleIsProofAuthority: false } };
  const report = (operations: readonly string[]) => ({
    schema: "receiz.operational-capability-report.v124", applicationId: "app", requestedOperations: operations,
    qualifiedAtKaiUPulse: 1, reportDigest: hash("r"), runtimeReceiptDigest: hash("s"),
    results: operations.map((operation) => ({ operation, status, actualGrantedScopes: [], serviceVersion: "124.0.3",
      registryVersion: "124.0.0", reducerVersion: "124.0.0", publicDependencyHeads: {},
      dependencyHealth: status === "available" ? "healthy" : "unhealthy", reasonCode: status === "available" ? null : "DEPENDENCY_UNHEALTHY",
      retry: { strategy: "none", retryAfterKaiUPulse: null }, evidence: { runtime: status === "available" ? "ready" : "unavailable", registry: "compatible", reducer: "compatible", publicHeads: "current", distributedLimiter: "not-required" },
    })), authority: { reportIsProofAuthority: false, reportIsOperationalAuthority: false, strongerTruth: "receiz-identity-artifact" },
  });
  const v124 = {
    kai: { now: () => ({ pulse: 1, uPulse: 1 }) }, proofAuthority: { createChallenge: async (value: unknown) => value },
    runtime: { openAuthoritySessionV124: async () => session, refreshAuthoritySessionV124: async () => session,
      closeAuthoritySessionV124: async () => ({ status: "closed" }), qualifyV124: async ({ operations }: { operations: readonly string[] }) => report(operations) },
    execution: { planAtomicOperationV124: async () => plan, stage: async () => { calls.push("stage"); return handle; },
      stagePrepared: async () => handle, execute: async () => { calls.push("execute"); return { status: "unknown", executionId: "execution" }; },
      resolve: async () => ({ status: "committed" }), resolveByIdempotencyKey: async () => ({ status: "committed" }), cancel: async () => ({ writes: 0 }) },
    domains: { verifiedAdditionsV124: async (value: unknown) => value, verifiedReplayV124: async (value: unknown) => value,
      verifiedCheckpointV124: async (value: unknown) => value, verifiedPrivateAdditionsV124: async () => ({ status: "authenticated", additions: [{ secret: true }], head: hash("h") }),
      exportVerifiedReplayProofObjectV124: async () => ({ applicationId: "app", domainId: "world", throughHead: hash("h"), portableAssetDigest: hash("x"), proofObject: { secretExactBytes: true } }),
      restoreVerifiedReplayProofObjectV124: async () => ({ status: "restored" }) },
    subjects: { resolveNamespacesV124: async (value: unknown) => value }, identity: { resolvePublicRecipientV124: async () => ({ status: "not-found-or-not-authorized" }) },
    sources: { publishSealedSourceV124: async () => ({ status: "published" }) }, recipient: { normalizeAlias: (value: string) => value.toLowerCase(), createLocatorReference: async (value: unknown) => value },
    value: { planLocatorBoundIntent: async (value: unknown) => value }, world: {}, transport: {}, portable: {},
  };
  return { adapter: { v124 } as unknown as ReceizCommerceAdapter, calls, session };
}

describe("Receiz v124 trusted-host production runtime", () => {
  it("rejects JSON-reconstructed plans, handles, and sessions", async () => {
    const fake = mockAdapter();
    const runtime = createReceizV124ProductionRuntime({ applicationId: "app", audience: "app", adapter: fake.adapter });
    const { sessionRef } = await runtime.sessions.open({ actorSubjectId: "subject" } as never);
    await assert.rejects(() => runtime.sessions.close(JSON.parse(JSON.stringify(sessionRef))), /SESSION_CUSTODY_REQUIRED/);
    const { planRef } = await runtime.execution.plan({ operations: [], participants: [], expectedParticipantHeads: {}, semanticIdempotencyKey: "id", attemptId: "attempt" });
    await assert.rejects(() => runtime.execution.stage(JSON.parse(JSON.stringify(planRef)), ["stage"]), /EXACT_PLAN_CUSTODY_REQUIRED/);
    const { handleRef } = await runtime.execution.stage(planRef, ["stage"]);
    await assert.rejects(() => runtime.execution.execute(JSON.parse(JSON.stringify(handleRef)), {} as never, ["execute"]), /EXECUTION_HANDLE_CUSTODY_REQUIRED/);
  });

  it("blocks mutation when a dependency is not operational", async () => {
    const fake = mockAdapter("unavailable");
    const runtime = createReceizV124ProductionRuntime({ applicationId: "app", audience: "app", adapter: fake.adapter });
    const { planRef } = await runtime.execution.plan({ operations: [], participants: [], expectedParticipantHeads: {}, semanticIdempotencyKey: "id", attemptId: "attempt" });
    await assert.rejects(() => runtime.execution.stage(planRef, ["stage"]), /OPERATION_NOT_QUALIFIED/);
    assert.deepEqual(fake.calls, []);
  });

  it("keeps exact private additions and replay candidate bytes out of projections", async () => {
    const fake = mockAdapter();
    const runtime = createReceizV124ProductionRuntime({ applicationId: "app", audience: "app", adapter: fake.adapter });
    const opened = await runtime.sessions.open({ actorSubjectId: "subject" } as never);
    const privateProjection = await runtime.replay.verifiedPrivateAdditions({ domainId: "world" } as never, opened.sessionRef);
    assert.equal(privateProjection.count, 1);
    assert.equal("additions" in privateProjection, false);
    const candidate = await runtime.replay.exportProofObject({ applicationId: "app" } as never);
    assert.equal(candidate.sealed, false);
    assert.equal("proofObject" in candidate, false);
    assert.deepEqual(runtime.replay.candidateForCanonicalSeal(candidate.replayCandidateRef), { secretExactBytes: true });
  });
});
