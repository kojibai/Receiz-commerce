export type ReceizDoctrineEntry = Readonly<{
  domain: "subject" | "world" | "mandate" | "multi-world" | "value";
  strongestSource: string;
  sdkOperation: string;
  mcpTool: string;
  aiSkill: string;
  actionClass: "read" | "plan" | "write";
  mcpAuthority: false;
  prohibitedShortcut: string;
  requiredEvidence: readonly string[];
}>;

const subjectSource = "exact sealed subject proof object plus independently admitted append history";
const worldSource = "exact persisted transaction bytes plus authenticated participant and world heads";
const mandateSource = "sealed mandate history bound to current owner, worker, and revocation heads";
const valueSource = "source proof object and value head plus the expected destination subject head";

const rows: ReceizDoctrineEntry[] = [
  { domain: "subject", strongestSource: "exact proof-object bytes and authenticated owner binding", sdkOperation: "adapter.v122.subjects.admit", mcpTool: "receiz_v122_subject_admit", aiSkill: "receiz-living-subject", actionClass: "write", mcpAuthority: false, prohibitedShortcut: "Never admit a caller-supplied receipt, owner, verification object, or projection.", requiredEvidence: ["exact artifact bytes", "authenticated owner", "idempotency key", "expected absence"] },
  { domain: "subject", strongestSource: subjectSource, sdkOperation: "adapter.v122.subjects.state", mcpTool: "receiz_v122_subject_state", aiSkill: "receiz-living-subject", actionClass: "read", mcpAuthority: false, prohibitedShortcut: "Never call state or API JSON the proof object.", requiredEvidence: ["subject ID", "authenticated state", "admission receipt authentication"] },
  { domain: "subject", strongestSource: subjectSource, sdkOperation: "adapter.v122.subjects.exportEdgeBundle", mcpTool: "receiz_v122_subject_export_edge_bundle", aiSkill: "receiz-portable-continuity", actionClass: "read", mcpAuthority: false, prohibitedShortcut: "Never export without independent admission, owner, chain, registry, and reducer verification.", requiredEvidence: ["in-process edge verifier", "known edge head", "exact bundle segments"] },
  { domain: "subject", strongestSource: subjectSource, sdkOperation: "adapter.v122.subjects.importEdgeBundle", mcpTool: "receiz_v122_subject_import_edge_bundle", aiSkill: "receiz-portable-continuity", actionClass: "write", mcpAuthority: false, prohibitedShortcut: "Never serialize a verifier or import shape-valid JSON as authority.", requiredEvidence: ["exact edge bundle", "independent verifier", "causal ancestry"] },
  { domain: "subject", strongestSource: subjectSource, sdkOperation: "adapter.v122.subjects.accessBinding", mcpTool: "receiz_v122_subject_access_binding", aiSkill: "receiz-living-subject", actionClass: "read", mcpAuthority: false, prohibitedShortcut: "Never confuse a public access binding with private-key custody.", requiredEvidence: ["subject ID", "current subject head", "access-key head"] },
  { domain: "subject", strongestSource: "edge-held encrypted access kit and current sealed subject head", sdkOperation: "adapter.v122.subjects.publishAccessKey", mcpTool: "receiz_v122_subject_access_key_publish", aiSkill: "receiz-living-subject", actionClass: "write", mcpAuthority: false, prohibitedShortcut: "Never transmit the private key, wrapping key, or encrypted access kit.", requiredEvidence: ["public binding only", "expected access-key head", "edge custody"] },
  { domain: "world", strongestSource: "edge plaintext plus authenticated recipient public bindings; only ciphertext may leave", sdkOperation: "adapter.v122.world.planPrivateCommand", mcpTool: "receiz_v122_world_plan_private", aiSkill: "receiz-world-event-runtime", actionClass: "plan", mcpAuthority: false, prohibitedShortcut: "Never send private payloads, access kits, or wrapping keys to a server or MCP tool.", requiredEvidence: ["edge plaintext", "recipient bindings", "ciphertext envelope"] },
  { domain: "world", strongestSource: worldSource, sdkOperation: "adapter.v122.world.validateTransaction", mcpTool: "receiz_v122_world_validate_transaction", aiSkill: "receiz-multi-subject-transaction", actionClass: "read", mcpAuthority: false, prohibitedShortcut: "Never validate against caller-provided heads or authority digests.", requiredEvidence: ["exact transaction", "authenticated heads", "registry and reducer", "authority and mandate digests"] },
  { domain: "world", strongestSource: worldSource, sdkOperation: "adapter.v122.world.executeTransactionV122", mcpTool: "receiz_v122_world_execute_transaction", aiSkill: "receiz-world-event-runtime", actionClass: "write", mcpAuthority: false, prohibitedShortcut: "Never partially write or normalize an unknown outcome into failure.", requiredEvidence: ["validated exact transaction", "atomic store", "idempotency key"] },
  { domain: "world", strongestSource: worldSource, sdkOperation: "adapter.v122.world.execution", mcpTool: "receiz_v122_world_execution", aiSkill: "receiz-deterministic-replay", actionClass: "read", mcpAuthority: false, prohibitedShortcut: "Never retry an unknown execution before authoritative lookup.", requiredEvidence: ["world ID", "transaction ID", "authenticated execution outcome"] },
  { domain: "world", strongestSource: worldSource, sdkOperation: "adapter.v122.world.executionByIdempotencyKey", mcpTool: "receiz_v122_world_execution_by_idempotency", aiSkill: "receiz-deterministic-replay", actionClass: "read", mcpAuthority: false, prohibitedShortcut: "Never invent a transaction result from a timeout.", requiredEvidence: ["world ID", "original idempotency key"] },
  { domain: "world", strongestSource: worldSource, sdkOperation: "adapter.v122.world.additionsV122", mcpTool: "receiz_v122_world_additions", aiSkill: "receiz-causal-sync", actionClass: "read", mcpAuthority: false, prohibitedShortcut: "Never treat additions as a replacement snapshot or last-write-wins state.", requiredEvidence: ["world ID", "known authenticated head", "causal additions"] },
  { domain: "mandate", strongestSource: mandateSource, sdkOperation: "adapter.v122.mandates.issue", mcpTool: "receiz_v122_mandate_issue", aiSkill: "receiz-autonomous-mandate", actionClass: "write", mcpAuthority: false, prohibitedShortcut: "Never issue unbounded prose autonomy or omit exact heads, limits, expiry, and revocation.", requiredEvidence: ["owner and worker heads", "bounded commands", "world and region bounds", "expiry and limits"] },
  { domain: "mandate", strongestSource: mandateSource, sdkOperation: "adapter.v122.mandates.state", mcpTool: "receiz_v122_mandate_state", aiSkill: "receiz-autonomous-mandate", actionClass: "read", mcpAuthority: false, prohibitedShortcut: "Never let a cached mandate outrank its current revocation head.", requiredEvidence: ["mandate ID", "authenticated current state"] },
  { domain: "mandate", strongestSource: mandateSource, sdkOperation: "adapter.v122.mandates.revoke", mcpTool: "receiz_v122_mandate_revoke", aiSkill: "receiz-autonomous-mandate", actionClass: "write", mcpAuthority: false, prohibitedShortcut: "Never accept post-revocation execution or rewrite earlier mandate history.", requiredEvidence: ["mandate ID", "expected revocation head", "idempotency key"] },
  { domain: "multi-world", strongestSource: "exact transactions and authenticated heads for every canonically ordered world", sdkOperation: "adapter.v122.world.planMultiWorldTransaction", mcpTool: "receiz_v122_multi_world_plan", aiSkill: "receiz-multi-subject-transaction", actionClass: "plan", mcpAuthority: false, prohibitedShortcut: "Never reorder by arrival time or omit a participating world.", requiredEvidence: ["canonical world IDs", "exact transactions", "expected world heads", "single idempotency key"] },
  { domain: "multi-world", strongestSource: "one atomic acceptance over every exact planned world transaction", sdkOperation: "adapter.v122.world.executeMultiWorldTransaction", mcpTool: "receiz_v122_multi_world_execute", aiSkill: "receiz-multi-subject-transaction", actionClass: "write", mcpAuthority: false, prohibitedShortcut: "Never report partial multi-world success.", requiredEvidence: ["exact multi-world plan", "all current heads", "atomic outcome"] },
  { domain: "value", strongestSource: valueSource, sdkOperation: "adapter.v122.value.planSettlement", mcpTool: "receiz_v122_value_plan_settlement", aiSkill: "receiz-value-rails", actionClass: "plan", mcpAuthority: false, prohibitedShortcut: "Never move USD or merge Settlement with Reserve.", requiredEvidence: ["amountPhiMicro", "source proof and head", "destination head", "pinned price basis"] },
  { domain: "value", strongestSource: valueSource, sdkOperation: "adapter.v122.value.planReserve", mcpTool: "receiz_v122_value_plan_reserve", aiSkill: "receiz-value-rails", actionClass: "plan", mcpAuthority: false, prohibitedShortcut: "Never move a USD projection or call a plan committed value.", requiredEvidence: ["amountPhiMicro", "source proof and head", "destination head", "pinned price basis"] },
];

export const RECEIZ_V122_DOCTRINE = Object.freeze(rows.map((entry) => Object.freeze({
  ...entry,
  requiredEvidence: Object.freeze([...entry.requiredEvidence]),
})));

export const RECEIZ_V122_EXAMPLES = Object.freeze({
  sdk: `const plan = await adapter.v122.value.planSettlement({
  amountPhiMicro, sourceProofObjectId, sourceValueHead,
  destinationSubjectId, expectedDestinationHead,
  usdPerPhiMicrocents, priceBasis
});
// A plan is not committed value.`,
  mcp: `receiz_v122_value_plan_settlement(input)
// mcpAuthority: false; independently verify source and heads.`,
});
