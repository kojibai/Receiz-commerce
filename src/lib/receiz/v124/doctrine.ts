import { RECEIZ_V124_MCP_TOOLS } from "./contract";

const ALL = "receiz-build-production-system";
const PROOF = "receiz-proof-authority";
const VALUE = "receiz-value-execution";
const REPLAY = "receiz-deterministic-replay";

const METHODS = [
  "receizKaiNow",
  "createReceizProofAuthorityChallenge",
  "client.execution.planAtomicOperationV124",
  "client.execution.stage",
  "client.execution.stagePrepared",
  "client.execution.execute",
  "client.execution.resolve",
  "client.execution.resolveByIdempotencyKey",
  "client.execution.cancel",
  "client.runtime.openAuthoritySessionV124",
  "client.runtime.refreshAuthoritySessionV124",
  "client.runtime.closeAuthoritySessionV124",
  "client.runtime.qualifyV124",
  "client.domains.verifiedAdditionsV124",
  "client.domains.verifiedReplayV124",
  "client.domains.verifiedCheckpointV124",
  "client.domains.verifiedPrivateAdditionsV124",
  "client.domains.exportVerifiedReplayProofObjectV124",
  "client.domains.restoreVerifiedReplayProofObjectV124",
  "client.subjects.resolveNamespacesV124",
  "client.identity.resolvePublicRecipientV124",
  "client.sources.publishSealedSourceV124",
] as const;

const OUTCOMES = [
  "Genesis-derived live Kai coordinate; no authority object is created.",
  "Exact application-bound signable challenge; explicit local identity consent remains required.",
  "Deterministic atomic plan only; the plan is not commit or proof authority.",
  "Durably stages the exact SDK plan behind a process-local non-authoritative handle.",
  "Stages an SDK-verified portable transition set with the exact plan.",
  "Executes only with a custodied handle and reverified active authority session.",
  "Reads a durable authenticated execution outcome; never retries a mutation.",
  "Recovers by the original semantic idempotency coordinate without manufacturing a plan.",
  "Cancels through custodied handle/session authority and returns a zero-write terminal result.",
  "Opens a short-lived session from exact sealed subject and identity evidence.",
  "Reverifies and rotates local or trusted-host persisted session custody.",
  "Reverifies and consumes session custody.",
  "Reports dependency readiness; method presence and the report itself are not operational authority.",
  "Authenticates additions and verifies exact predecessor continuity in SDK replay custody.",
  "Builds deterministic authenticated replay beneath sealed source truth.",
  "Creates an exact-head checkpoint from SDK-held verified replay custody.",
  "Keeps exact access-filtered additions in trusted-host custody; models receive safe coordinates only.",
  "Exports an unsealed non-authoritative proof-object candidate for canonical Record → Seal.",
  "Restores only a canonically verified sealed replay proof object.",
  "Returns an authenticated exact-head namespace projection beneath the sealed subject.",
  "Returns a rate-limited one-use encrypted recipient locator without destination identity/head disclosure.",
  "Publishes an already sealed source; the publication receipt remains subordinate.",
] as const;

function skillsFor(index: number): readonly string[] {
  if (index === 0 || index === 1 || (index >= 9 && index <= 12)) return [ALL, PROOF];
  if (index >= 2 && index <= 8) return [ALL, VALUE];
  if (index >= 13 && index <= 18) return [ALL, REPLAY];
  return [ALL];
}

export const RECEIZ_V124_DOCTRINE = Object.freeze(RECEIZ_V124_MCP_TOOLS.map((mcpTool, index) => Object.freeze({
  mcpTool,
  sdkMethod: METHODS[index],
  aiSkills: skillsFor(index),
  outcome: OUTCOMES[index],
  mcpAuthority: false as const,
  representationCanOutrankSource: false as const,
})));

export const RECEIZ_V124_DEVELOPER_SEQUENCE = Object.freeze([
  "verify exact bytes",
  "profile admission",
  "verified actor and history",
  "transition",
  "plan domains, effects, and idempotency",
  "plan-bound capability",
  "seal",
  "durable stage",
  "independent byte resolution",
  "atomic named-domain acceptance",
  "report-only receipt",
]);

export const RECEIZ_V124_EXAMPLES = Object.freeze({
  sdk: `const runtime = createReceizV124ProductionRuntime({ applicationId, audience, adapter });
const report = await runtime.qualify(["execution.atomic.execute"]);
// A report describes readiness; it is never proof or operational authority.
const { planRef } = await runtime.execution.plan(exactAtomicInput);
const { handleRef } = await runtime.execution.stage(planRef, ["execution.atomic.stage"]);
const outcome = await runtime.execution.execute(handleRef, sessionRef, ["execution.atomic.execute"]);
if (outcome.status === "unknown") await runtime.execution.resolve({ applicationId, executionId: outcome.executionId });`,
  mcp: `Use receiz-build-production-system for the complete v124 surface.
Use only an exact tool listed by the focused skill manifest.
Keep sessionRef, handleRef, privateAdditionsRef, and sealedSourceArtifactRef in trusted-host custody.
Never reconstruct SDK authority from JSON; never expose exact private additions to the model.`,
});
