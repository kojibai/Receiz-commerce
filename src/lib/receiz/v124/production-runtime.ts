import type {
  ReceizAtomicOperationInputV124,
  ReceizAuthoritySessionV124,
  ReceizCloseAuthoritySessionInputV124,
  ReceizDomainReplayExpectationV124,
  ReceizDomainReplayProofObjectExportInputV124,
  ReceizDomainReplayProofObjectRestoreInputV124,
  ReceizDurableExecutionHandleV124,
  ReceizExecutionIdempotencyCoordinatesV124,
  ReceizExecutionOutcomeV124,
  ReceizExecutionResolutionV124,
  ReceizLocatorBoundValueIntentInputV124,
  ReceizOpenAuthoritySessionInputV124,
  ReceizOperationPlanV124,
  ReceizOperationalCapabilityReportV124,
  ReceizPortableExecutionTransitionSetV124,
  ReceizPortableSealedArtifactV124,
  ReceizPrivateDomainAdditionsInputV124,
  ReceizPublicRecipientResolutionInputV124,
  ReceizPublishSealedSourceInputV124,
  ReceizRefreshAuthoritySessionInputV124,
  ReceizResolveNamespacesInputV124,
} from "@receiz/sdk";
import { randomUUID } from "node:crypto";
import type { ReceizCommerceAdapter } from "../adapter";

const NON_AUTHORITY = Object.freeze({
  referenceIsAuthority: false as const,
  strongerTruth: "sealed-receiz-proof-object" as const,
});

export const RECEIZ_V124_RUNTIME_LAWS = Object.freeze({
  jsonCanMintCustody: false,
  representationCanOutrankSource: false,
  mutationRequiresOperationalQualification: true,
  unknownOutcomeRequiresResolution: true,
  replayCandidateIsSealed: false,
  exactPrivateAdditionsLeaveTrustedHost: false,
  failedDecisionWrites: 0,
});

type OpaqueRef<Schema extends string> = Readonly<{
  schema: Schema;
  opaqueId: string;
  authority: typeof NON_AUTHORITY;
}>;

export type ReceizV124SessionRef = OpaqueRef<"receiz.app.authority-session-ref.v124">;
export type ReceizV124PlanRef = OpaqueRef<"receiz.app.execution-plan-ref.v124">;
export type ReceizV124HandleRef = OpaqueRef<"receiz.app.execution-handle-ref.v124">;
export type ReceizV124PrivateAdditionsRef = OpaqueRef<"receiz.app.private-additions-ref.v124">;
export type ReceizV124ReplayCandidateRef = OpaqueRef<"receiz.app.replay-candidate-ref.v124">;
export type ReceizV124SealedSourceRef = OpaqueRef<"receiz.app.sealed-source-ref.v124">;

type V124 = ReceizCommerceAdapter["v124"];
type PrivateAdditions = Awaited<ReturnType<V124["domains"]["verifiedPrivateAdditionsV124"]>>;
type ReplayCandidate = Awaited<ReturnType<V124["domains"]["exportVerifiedReplayProofObjectV124"]>>;

export type ReceizV124TrustedSessionStore = Readonly<{
  read(ref: string): Promise<ReceizAuthoritySessionV124 | null>;
  write(ref: string, session: ReceizAuthoritySessionV124): Promise<void>;
  remove(ref: string): Promise<void>;
}>;

export function createReceizV124MemorySessionStore(): ReceizV124TrustedSessionStore {
  const values = new Map<string, ReceizAuthoritySessionV124>();
  return Object.freeze({
    async read(ref) { return values.get(ref) ?? null; },
    async write(ref, session) { values.set(ref, session); },
    async remove(ref) { values.delete(ref); },
  });
}

function opaque<Schema extends string>(schema: Schema): OpaqueRef<Schema> {
  return Object.freeze({ schema, opaqueId: randomUUID(), authority: NON_AUTHORITY });
}

function requireApplication(actual: string, expected: string): void {
  if (actual !== expected) throw new Error("RECEIZ_V124_APPLICATION_MISMATCH");
}

function requireCustody<T>(map: WeakMap<object, T>, ref: object, code: string): T {
  const value = map.get(ref);
  if (!value) throw new Error(code);
  return value;
}

function assertOperational(report: ReceizOperationalCapabilityReportV124, operations: readonly string[]): void {
  const byOperation = new Map(report.results.map((result) => [result.operation, result]));
  for (const operation of operations) {
    const result = byOperation.get(operation);
    if (!result || result.status !== "available" || result.dependencyHealth !== "healthy" || result.evidence.runtime !== "ready") {
      throw new Error(`RECEIZ_V124_OPERATION_NOT_QUALIFIED:${operation}:${result?.reasonCode ?? "MISSING_REPORT"}`);
    }
  }
}

/**
 * Trusted-host composition for the complete v124 production surface.
 *
 * WeakMap identity makes JSON reconstruction of a session, plan, handle, private
 * result, replay candidate, or sealed source unusable. A trusted-host persisted
 * session coordinate can only enter through refreshPersisted, which requires a
 * fresh signed challenge and returns a newly custodied local session.
 */
export function createReceizV124ProductionRuntime(input: Readonly<{
  applicationId: string;
  audience: string;
  adapter: ReceizCommerceAdapter;
  sessionStore?: ReceizV124TrustedSessionStore;
}>) {
  const { applicationId, audience, adapter } = input;
  const sessionStore = input.sessionStore ?? createReceizV124MemorySessionStore();
  const sessions = new WeakMap<object, ReceizAuthoritySessionV124>();
  const plans = new WeakMap<object, ReceizOperationPlanV124>();
  const handles = new WeakMap<object, ReceizDurableExecutionHandleV124>();
  const privateAdditions = new WeakMap<object, PrivateAdditions>();
  const replayCandidates = new WeakMap<object, ReplayCandidate>();
  const sealedSources = new WeakMap<object, ReceizPortableSealedArtifactV124>();

  const bindSession = async (session: ReceizAuthoritySessionV124) => {
    requireApplication(session.applicationId, applicationId);
    if (session.audience !== audience) throw new Error("RECEIZ_V124_AUDIENCE_MISMATCH");
    const ref: ReceizV124SessionRef = opaque("receiz.app.authority-session-ref.v124");
    sessions.set(ref, session);
    await sessionStore.write(ref.opaqueId, session);
    return ref;
  };

  const readSession = async (ref: ReceizV124SessionRef) => {
    const local = sessions.get(ref);
    if (!local) throw new Error("RECEIZ_V124_SESSION_CUSTODY_REQUIRED");
    return local;
  };

  const qualify = async (operations: readonly string[]) => {
    const report = await adapter.v124.runtime.qualifyV124({ applicationId, operations });
    requireApplication(report.applicationId, applicationId);
    return report;
  };

  const qualifyForMutation = async (operations: readonly string[]) => {
    const report = await qualify(operations);
    assertOperational(report, operations);
    return report;
  };

  return Object.freeze({
    authority: RECEIZ_V124_RUNTIME_LAWS,
    kaiNow: adapter.v124.kai.now,
    createProofAuthorityChallenge(challenge: Omit<Parameters<V124["proofAuthority"]["createChallenge"]>[0], "applicationId">) {
      return adapter.v124.proofAuthority.createChallenge({ ...challenge, applicationId });
    },
    qualify,
    sessions: Object.freeze({
      async open(sessionInput: Omit<ReceizOpenAuthoritySessionInputV124, "applicationId" | "audience">) {
        const session = await adapter.v124.runtime.openAuthoritySessionV124({ ...sessionInput, applicationId, audience });
        return Object.freeze({ sessionRef: await bindSession(session), projection: session });
      },
      async refresh(ref: ReceizV124SessionRef, refreshInput: Omit<ReceizRefreshAuthoritySessionInputV124, "applicationId" | "audience" | "authoritySessionHandle" | "persistedSession">) {
        const persistedSession = await readSession(ref);
        const session = await adapter.v124.runtime.refreshAuthoritySessionV124({
          ...refreshInput,
          applicationId,
          audience,
          authoritySessionHandle: persistedSession.authoritySessionHandle,
          persistedSession,
        });
        const nextRef = await bindSession(session);
        sessions.delete(ref);
        await sessionStore.remove(ref.opaqueId);
        return Object.freeze({ sessionRef: nextRef, projection: session });
      },
      async refreshPersisted(persistedSessionRef: string, refreshInput: Omit<ReceizRefreshAuthoritySessionInputV124, "applicationId" | "audience" | "authoritySessionHandle" | "persistedSession">) {
        const persistedSession = await sessionStore.read(persistedSessionRef);
        if (!persistedSession) throw new Error("RECEIZ_V124_PERSISTED_SESSION_NOT_FOUND");
        const session = await adapter.v124.runtime.refreshAuthoritySessionV124({
          ...refreshInput,
          applicationId,
          audience,
          authoritySessionHandle: persistedSession.authoritySessionHandle,
          persistedSession,
        });
        const nextRef = await bindSession(session);
        await sessionStore.remove(persistedSessionRef);
        return Object.freeze({ sessionRef: nextRef, projection: session });
      },
      async close(ref: ReceizV124SessionRef) {
        const persistedSession = await readSession(ref);
        const closeInput: ReceizCloseAuthoritySessionInputV124 = {
          applicationId,
          authoritySessionHandle: persistedSession.authoritySessionHandle,
          persistedSession,
        };
        const result = await adapter.v124.runtime.closeAuthoritySessionV124(closeInput);
        sessions.delete(ref);
        await sessionStore.remove(ref.opaqueId);
        return result;
      },
    }),
    execution: Object.freeze({
      async plan(planInput: Omit<ReceizAtomicOperationInputV124, "applicationId">) {
        const plan = await adapter.v124.execution.planAtomicOperationV124({ ...planInput, applicationId });
        const planRef: ReceizV124PlanRef = opaque("receiz.app.execution-plan-ref.v124");
        plans.set(planRef, plan);
        return Object.freeze({ planRef, projection: plan });
      },
      async stage(planRef: ReceizV124PlanRef, qualificationOperations: readonly string[]) {
        await qualifyForMutation(qualificationOperations);
        const plan = requireCustody(plans, planRef, "RECEIZ_V124_EXACT_PLAN_CUSTODY_REQUIRED");
        const handle = await adapter.v124.execution.stage(plan);
        const handleRef: ReceizV124HandleRef = opaque("receiz.app.execution-handle-ref.v124");
        handles.set(handleRef, handle);
        return Object.freeze({ handleRef, projection: handle });
      },
      async stagePrepared(planRef: ReceizV124PlanRef, transitionSet: ReceizPortableExecutionTransitionSetV124, qualificationOperations: readonly string[]) {
        await qualifyForMutation(qualificationOperations);
        const plan = requireCustody(plans, planRef, "RECEIZ_V124_EXACT_PLAN_CUSTODY_REQUIRED");
        const handle = await adapter.v124.execution.stagePrepared(plan, transitionSet);
        const handleRef: ReceizV124HandleRef = opaque("receiz.app.execution-handle-ref.v124");
        handles.set(handleRef, handle);
        return Object.freeze({ handleRef, projection: handle });
      },
      async execute(handleRef: ReceizV124HandleRef, sessionRef: ReceizV124SessionRef, qualificationOperations: readonly string[]): Promise<ReceizExecutionOutcomeV124> {
        await qualifyForMutation(qualificationOperations);
        const handle = requireCustody(handles, handleRef, "RECEIZ_V124_EXECUTION_HANDLE_CUSTODY_REQUIRED");
        const session = await readSession(sessionRef);
        const outcome = await adapter.v124.execution.execute(handle, session);
        if (outcome.status !== "unknown") handles.delete(handleRef);
        return outcome;
      },
      resolve(coordinates: ReceizExecutionResolutionV124) {
        requireApplication(coordinates.applicationId, applicationId);
        return adapter.v124.execution.resolve(coordinates);
      },
      resolveByIdempotencyKey(coordinates: ReceizExecutionIdempotencyCoordinatesV124) {
        requireApplication(coordinates.applicationId, applicationId);
        return adapter.v124.execution.resolveByIdempotencyKey(coordinates);
      },
      async cancel(handleRef: ReceizV124HandleRef, sessionRef: ReceizV124SessionRef, qualificationOperations: readonly string[]) {
        await qualifyForMutation(qualificationOperations);
        const handle = requireCustody(handles, handleRef, "RECEIZ_V124_EXECUTION_HANDLE_CUSTODY_REQUIRED");
        const session = await readSession(sessionRef);
        const result = await adapter.v124.execution.cancel(handle, session);
        handles.delete(handleRef);
        return result;
      },
    }),
    replay: Object.freeze({
      verifiedAdditions(expectation: ReceizDomainReplayExpectationV124) {
        requireApplication(expectation.applicationId, applicationId);
        return adapter.v124.domains.verifiedAdditionsV124(expectation);
      },
      verifiedReplay(expectation: ReceizDomainReplayExpectationV124) {
        requireApplication(expectation.applicationId, applicationId);
        return adapter.v124.domains.verifiedReplayV124(expectation);
      },
      verifiedCheckpoint(checkpointInput: Readonly<{ applicationId: string; domainId: string; throughHead: string }>) {
        requireApplication(checkpointInput.applicationId, applicationId);
        return adapter.v124.domains.verifiedCheckpointV124(checkpointInput);
      },
      async verifiedPrivateAdditions(privateInput: Omit<ReceizPrivateDomainAdditionsInputV124, "applicationId" | "authoritySessionHandle">, sessionRef: ReceizV124SessionRef) {
        const session = await readSession(sessionRef);
        const exact = await adapter.v124.domains.verifiedPrivateAdditionsV124({
          ...privateInput,
          applicationId,
          authoritySessionHandle: session.authoritySessionHandle,
        });
        const privateAdditionsRef: ReceizV124PrivateAdditionsRef = opaque("receiz.app.private-additions-ref.v124");
        privateAdditions.set(privateAdditionsRef, exact);
        return Object.freeze({
          privateAdditionsRef,
          status: exact.status,
          count: exact.status === "authenticated" ? exact.additions.length : 0,
          head: exact.status === "authenticated" ? exact.head : null,
          authority: NON_AUTHORITY,
        });
      },
      async exportProofObject(exportInput: ReceizDomainReplayProofObjectExportInputV124) {
        requireApplication(exportInput.applicationId, applicationId);
        const candidate = await adapter.v124.domains.exportVerifiedReplayProofObjectV124(exportInput);
        const replayCandidateRef: ReceizV124ReplayCandidateRef = opaque("receiz.app.replay-candidate-ref.v124");
        replayCandidates.set(replayCandidateRef, candidate);
        return Object.freeze({
          replayCandidateRef,
          domainId: candidate.domainId,
          throughHead: candidate.throughHead,
          portableAssetDigest: candidate.portableAssetDigest,
          sealed: false as const,
          authority: NON_AUTHORITY,
        });
      },
      candidateForCanonicalSeal(ref: ReceizV124ReplayCandidateRef) {
        return requireCustody(replayCandidates, ref, "RECEIZ_V124_REPLAY_CANDIDATE_CUSTODY_REQUIRED").proofObject;
      },
      async restoreSealed(ref: ReceizV124SealedSourceRef, expectation: Omit<ReceizDomainReplayProofObjectRestoreInputV124, "artifact">) {
        const artifact = requireCustody(sealedSources, ref, "RECEIZ_V124_SEALED_REPLAY_SOURCE_REQUIRED");
        requireApplication(expectation.applicationId, applicationId);
        return adapter.v124.domains.restoreVerifiedReplayProofObjectV124({ ...expectation, artifact });
      },
    }),
    namespaces: Object.freeze({
      resolve(namespaceInput: ReceizResolveNamespacesInputV124) {
        return adapter.v124.subjects.resolveNamespacesV124(namespaceInput);
      },
    }),
    recipients: Object.freeze({
      async resolve(recipientInput: Omit<ReceizPublicRecipientResolutionInputV124, "applicationId" | "authoritySessionHandle" | "normalizedAlias"> & { alias: string }, sessionRef: ReceizV124SessionRef) {
        const session = await readSession(sessionRef);
        const normalizedAlias = adapter.v124.recipient.normalizeAlias(recipientInput.alias);
        const result = await adapter.v124.identity.resolvePublicRecipientV124({
          applicationId,
          authoritySessionHandle: session.authoritySessionHandle,
          expectedRequesterSubjectId: recipientInput.expectedRequesterSubjectId,
          normalizedAlias,
          purpose: recipientInput.purpose,
          operationNonce: recipientInput.operationNonce,
        });
        if (result.status !== "resolved") return result;
        const recipientLocator = await adapter.v124.recipient.createLocatorReference(result);
        return Object.freeze({ ...result, recipientLocator });
      },
      planPhiIntent(valueInput: ReceizLocatorBoundValueIntentInputV124) {
        return adapter.v124.value.planLocatorBoundIntent(valueInput);
      },
    }),
    sources: Object.freeze({
      holdSealed(sourceArtifact: ReceizPortableSealedArtifactV124) {
        const sourceRef: ReceizV124SealedSourceRef = opaque("receiz.app.sealed-source-ref.v124");
        sealedSources.set(sourceRef, sourceArtifact);
        return sourceRef;
      },
      async publish(sourceRef: ReceizV124SealedSourceRef, sessionRef: ReceizV124SessionRef | null = null) {
        const sourceArtifact = requireCustody(sealedSources, sourceRef, "RECEIZ_V124_SEALED_SOURCE_CUSTODY_REQUIRED");
        const session = sessionRef ? await readSession(sessionRef) : null;
        const publishInput: ReceizPublishSealedSourceInputV124 = {
          applicationId,
          authoritySessionHandle: session?.authoritySessionHandle ?? null,
          sourceArtifact,
        };
        return adapter.v124.sources.publishSealedSourceV124(publishInput);
      },
    }),
  });
}
