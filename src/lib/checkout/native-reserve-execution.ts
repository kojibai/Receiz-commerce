import {
  canonicalizeReceizV122,
  readReceizIdentityArtifact,
  receizBase64UrlDecode,
  type ReceizExecutionOutcomeV124,
  type ReceizOpenAuthoritySessionInputV124,
  type ReceizPortableExecutionTransitionRecoveryV124,
  type ReceizPortableExecutionTransitionSetV124,
} from "@receiz/sdk";
import type { ReceizCommerceAdapter } from "../receiz/adapter";
import { merchantCheckoutUsername } from "./payment-contract";
import type { WalletFirstFunding } from "./receiz-settlement";
import { nativeReserveConsentDigest, nativeReserveScopes } from "./native-reserve-consent";
import { createReceizV124ProductionRuntime, type ReceizV124HandleRef, type ReceizV124PlanRef, type ReceizV124SessionRef } from "../receiz/v124/production-runtime";

export const MAX_RESERVE_EXECUTION_BYTES = 550_000;

export type NativeReserveQuote = Readonly<{
  applicationId: string;
  tenantHost: string;
  buyerUserId: string;
  buyerReceizId: string;
  merchantUsername: string;
  recipientUserId: string;
  referenceId: string;
  idempotencyKey: string;
  funding: Pick<WalletFirstFunding, "totalUsdCents" | "walletBalanceUsdCents" | "walletAppliedUsdCents" | "cardDeltaUsdCents">;
}>;

export type NativeReservePreparation = Readonly<{
  transitionSet: ReceizPortableExecutionTransitionSetV124;
  /** The original SDK display-price basis; its digest must reproduce the plan. */
  priceBasis: unknown;
}>;

export type NativeReservePayment = Readonly<{
  recovery: ReceizPortableExecutionTransitionRecoveryV124;
  valueIntentDigest: string;
  amountUsdCents: number;
  sourceParticipantId: string;
  destinationParticipantId: string;
}>;

function boundSize(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  if (!bytes.byteLength || bytes.byteLength > MAX_RESERVE_EXECUTION_BYTES) throw new Error("reserve_execution_source_too_large");
}

function assertQuote(quote: NativeReserveQuote) {
  if ([quote.applicationId, quote.tenantHost, quote.buyerUserId, quote.buyerReceizId, quote.merchantUsername,
    quote.recipientUserId, quote.referenceId, quote.idempotencyKey].some(value => !value?.trim())) {
    throw new Error("reserve_checkout_binding_required");
  }
  const f = quote.funding;
  if (Object.values(f).some(value => !Number.isSafeInteger(value) || value < 0) ||
    f.totalUsdCents <= 0 || f.walletAppliedUsdCents <= 0 ||
    f.walletAppliedUsdCents !== Math.min(f.totalUsdCents, f.walletBalanceUsdCents) ||
    f.cardDeltaUsdCents !== f.totalUsdCents - f.walletAppliedUsdCents) throw new Error("reserve_checkout_funding_invalid");
}

/** Complete sources are verified by the existing SDK before these narrower
 * commerce bindings are checked. Identity owner fields are never admitted here. */
async function inspectBoundReserveSet(receiz: ReceizCommerceAdapter, quote: NativeReserveQuote,
  transitionSet: ReceizPortableExecutionTransitionSetV124) {
  assertQuote(quote);
  boundSize(transitionSet);
  const edge = receiz.v125.value.edge;
  const verified = await edge.verifyTransitionSet(transitionSet, { audience: quote.applicationId });
  if (verified.operationPlan.applicationId !== quote.applicationId || verified.members.length !== 2) {
    throw new Error("reserve_checkout_participants_invalid");
  }
  const inspections = await Promise.all(verified.members.map(member => edge.inspect(verified.operationPlan,
    { participantId: member.participantId, expectedRail: "reserve" })));
  const sender = inspections.find(value => value.role === "sender");
  const receiver = inspections.find(value => value.role === "receiver");
  if (!sender || !receiver || canonicalizeReceizV122(sender.intent) !== canonicalizeReceizV122(receiver.intent)) {
    throw new Error("reserve_checkout_participant_intent_mismatch");
  }
  const intent = sender.intent;
  if (intent.idempotencyKey !== `${quote.idempotencyKey}:reserve` ||
    intent.quotedUsdCents !== String(quote.funding.walletAppliedUsdCents)) throw new Error("reserve_checkout_quote_mismatch");
  const senderMember = transitionSet.members.find(member => member.participantId === sender.participantId);
  const receiverMember = transitionSet.members.find(member => member.participantId === receiver.participantId);
  if (!senderMember || !receiverMember) throw new Error("reserve_checkout_participants_invalid");
  const [buyerIdentity, merchantIdentity] = await Promise.all([
    readReceizIdentityArtifact(receizBase64UrlDecode(senderMember.identityArtifact.exactBytesB64u)),
    readReceizIdentityArtifact(receizBase64UrlDecode(receiverMember.identityArtifact.exactBytesB64u)),
  ]);
  if (buyerIdentity.owner.uid !== quote.buyerUserId ||
    !buyerIdentity.owner.username || merchantCheckoutUsername(buyerIdentity.owner.username) !== merchantCheckoutUsername(quote.buyerReceizId)) {
    throw new Error("reserve_checkout_buyer_mismatch");
  }
  // The SDK binds the destination subject to its exact participant and source.
  // A subject identifier is distinct from the receiving account's UID. Bind
  // account identity here; a username fallback remains an explicit receiver.
  const recipientHandle = quote.recipientUserId.trim().replace(/^@/, "").replace(/\.receiz\.id$/i, "").toLowerCase();
  if (!merchantIdentity.owner.username || merchantCheckoutUsername(merchantIdentity.owner.username) !== quote.merchantUsername ||
    (merchantIdentity.owner.uid !== quote.recipientUserId && recipientHandle !== quote.merchantUsername)) {
    throw new Error("reserve_checkout_receiver_mismatch");
  }
  return { verified, sender, receiver, intent, buyerIdentity };
}

/** Recovery never spends again. Both participants independently reopen the
 * same complete SDK recovery; a paid flag or receipt cannot reduce the card. */
export async function recoverNativeReservePayment(receiz: ReceizCommerceAdapter, quote: NativeReserveQuote,
  recovery: ReceizPortableExecutionTransitionRecoveryV124): Promise<NativeReservePayment> {
  boundSize(recovery);
  const bound = await inspectBoundReserveSet(receiz, quote, recovery.transitionSet);
  const edge = receiz.v125.value.edge;
  const sender = await edge.confirmReserveSend(recovery, { applicationId: quote.applicationId, participantId: bound.sender.participantId });
  const receiver = await edge.receiveReserve(recovery, { applicationId: quote.applicationId, participantId: bound.receiver.participantId });
  if (canonicalizeReceizV122(sender.intent) !== canonicalizeReceizV122(bound.intent) ||
    canonicalizeReceizV122(receiver.intent) !== canonicalizeReceizV122(bound.intent)) {
    throw new Error("reserve_checkout_recovery_intent_mismatch");
  }
  return Object.freeze({ recovery, valueIntentDigest: bound.intent.valueIntentDigest,
    amountUsdCents: quote.funding.walletAppliedUsdCents,
    sourceParticipantId: sender.participantId, destinationParticipantId: receiver.participantId });
}

/** Same-runtime orchestration of the installed SDK. This object is deliberately
 * not JSON transport: only complete sealed source/recovery material can cross
 * a process boundary, where the SDK reopens it independently. */
export function createNativeReserveExecution(receiz: ReceizCommerceAdapter, quote: NativeReserveQuote) {
  const frozenQuote = structuredClone(quote);
  assertQuote(frozenQuote);
  const runtime = createReceizV124ProductionRuntime({ applicationId: frozenQuote.applicationId, audience: frozenQuote.applicationId, adapter: receiz });
  let preparation: NativeReservePreparation | null = null;
  let planRef: ReceizV124PlanRef | null = null;
  let handle: ReceizV124HandleRef | null = null;
  let session: ReceizV124SessionRef | null = null;
  let mustResolve = false;
  let submitted = false;
  let active = false;

  const coordinates = () => {
    if (!preparation) throw new Error("reserve_checkout_preparation_required");
    const original = preparation.transitionSet.members[0]?.operationPlan;
    if (!original) throw new Error("reserve_checkout_preparation_required");
    return { applicationId: frozenQuote.applicationId, domainId: original.domainId, operationKind: original.operationKind,
      semanticIdempotencyKey: `${frozenQuote.idempotencyKey}:reserve` };
  };
  const acceptOutcome = async (outcome: ReceizExecutionOutcomeV124) => {
    if (!preparation || outcome.applicationId !== frozenQuote.applicationId ||
      outcome.exactPlanDigest !== preparation.transitionSet.exactPlanDigest ||
      outcome.semanticIdempotencyKey !== `${frozenQuote.idempotencyKey}:reserve`) throw new Error("reserve_checkout_outcome_mismatch");
    if (outcome.status === "unknown") { mustResolve = true; return { status: "unknown" as const }; }
    mustResolve = false;
    if (outcome.status !== "committed") return { status: "zero-write" as const, reason: outcome.reasonCode };
    const recovery = receiz.client.execution.exportCommittedRecovery(outcome);
    const payment = await recoverNativeReservePayment(receiz, frozenQuote, recovery);
    return { status: "committed" as const, payment };
  };

  return Object.freeze({
    /** Resolution is read-only and may outlive the original live capability.
     * Retain the original plan coordinates without restaging it. A committed
     * result still has to reopen all complete sources through SDK recovery. */
    async restoreForResolution(input: NativeReservePreparation) {
      if (active || preparation || mustResolve) throw new Error("reserve_checkout_original_attempt_required");
      active = true;
      try {
      const copy = structuredClone(input);
      boundSize(copy);
      const original = copy.transitionSet.members?.[0]?.operationPlan;
      if (!original || original.applicationId !== frozenQuote.applicationId ||
        original.exactPlanDigest !== copy.transitionSet.exactPlanDigest) throw new Error("reserve_checkout_original_plan_required");
      const inspections = await Promise.all(Object.keys(original.expectedParticipantHeads).map(participantId => receiz.v125.value.edge.inspect(original,
        { participantId, expectedRail: "reserve" })));
      const sender = inspections.find(value => value.role === "sender");
      const receiver = inspections.find(value => value.role === "receiver");
      if (inspections.length !== 2 || !sender || !receiver ||
        canonicalizeReceizV122(sender.intent) !== canonicalizeReceizV122(receiver.intent) ||
        sender.intent.idempotencyKey !== `${frozenQuote.idempotencyKey}:reserve` ||
        sender.intent.quotedUsdCents !== String(frozenQuote.funding.walletAppliedUsdCents)) throw new Error("reserve_checkout_quote_mismatch");
      preparation = copy;
      submitted = true;
      mustResolve = true;
      } finally { active = false; }
    },
    async prepare(input: NativeReservePreparation) {
      if (active || preparation || mustResolve) throw new Error("reserve_checkout_original_attempt_required");
      active = true;
      try {
        const copy = structuredClone(input);
        boundSize(copy);
        // Keep complete recovery/receipt and encryption overhead within the
        // app's transport limit before any stage or financial execution.
        if (new TextEncoder().encode(JSON.stringify(copy)).length > 300_000) throw new Error("reserve_execution_source_too_large");
        const bound = await inspectBoundReserveSet(receiz, frozenQuote, copy.transitionSet);
        // Reproduce the carried plan through the SDK's explicit Reserve planner.
        // No USD balance, caller head, new attempt or new price basis is invented.
        const original = bound.verified.operationPlan;
        const plan = await receiz.v125.value.edge.planReserve({ applicationId: frozenQuote.applicationId,
          ...bound.intent, priceBasis: copy.priceBasis, attemptId: original.attemptId });
        if (canonicalizeReceizV122(plan.plan) !== canonicalizeReceizV122(original)) throw new Error("reserve_checkout_original_plan_required");
        planRef = (await runtime.execution.admitPreparedPlan(copy.transitionSet)).planRef;
        preparation = copy;
        return { plan: original, funding: frozenQuote.funding, sourceParticipantId: bound.sender.participantId,
          destinationParticipantId: bound.receiver.participantId };
      } finally { active = false; }
    },
    async execute(authority: Omit<ReceizOpenAuthoritySessionInputV124, "applicationId" | "audience">) {
      if (active) throw new Error("reserve_checkout_attempt_in_progress");
      if (!preparation) throw new Error("reserve_checkout_preparation_required");
      if (mustResolve || submitted) throw new Error("reserve_checkout_resolution_required");
      active = true;
      try {
        const bound = await inspectBoundReserveSet(receiz, frozenQuote, preparation.transitionSet);
        if (authority.signedChallenge?.consent?.approved !== true || authority.signedChallenge.audience !== frozenQuote.applicationId ||
          authority.signedChallenge.consent.statementDigest !== await nativeReserveConsentDigest(frozenQuote, bound.verified.operationPlan.exactPlanDigest)) {
          throw new Error("reserve_checkout_explicit_consent_required");
        }
        const report = await receiz.v124.runtime.qualifyV124({ applicationId: frozenQuote.applicationId,
          operations: ["runtime.authority-session.open", "execution.stage", "execution.execute"] });
        if (report.applicationId !== frozenQuote.applicationId || report.results.length !== 3 ||
          new Set(report.results.map(result => result.operation)).size !== 3 ||
          report.results.some(result => !["runtime.authority-session.open", "execution.stage", "execution.execute"].includes(result.operation)) ||
          report.results.some(result => result.status !== "available" || result.dependencyHealth !== "healthy" || result.evidence.runtime !== "ready")) {
          throw new Error("reserve_checkout_runtime_unavailable");
        }
        // Identity and subject source are canonically reverified by the SDK.
        // Neither cookie possession nor the caller's session JSON is authority.
        const opened = await runtime.sessions.open(authority);
        session = opened.sessionRef;
        if (opened.projection.identityKeyId !== bound.buyerIdentity.keyId || opened.projection.applicationId !== frozenQuote.applicationId ||
          opened.projection.audience !== frozenQuote.applicationId || nativeReserveScopes().some(scope => !opened.projection.grantedScopes.includes(scope))) {
          throw new Error("reserve_checkout_session_mismatch");
        }
        // Mark possible delivery before stage/execute. Any lost response must
        // resolve this same exact plan and semantic coordinate before retry.
        mustResolve = true;
        submitted = true;
        if (!planRef) throw new Error("reserve_checkout_preparation_required");
        handle ??= (await runtime.execution.stagePrepared(planRef, preparation.transitionSet, ["execution.stage"])).handleRef;
        return await acceptOutcome(await runtime.execution.execute(handle, session, ["execution.execute"]));
      } finally { active = false; }
    },
    async resolve() {
      if (active) throw new Error("reserve_checkout_attempt_in_progress");
      active = true;
      try { return await acceptOutcome(await runtime.execution.resolveByIdempotencyKey(coordinates())); }
      finally { active = false; }
    },
  });
}
