export type ReceizV123DoctrineEntry = Readonly<{
  domain: "world" | "value" | "subject" | "identity" | "auth";
  strongestSource: string;
  sdkOperation: string;
  mcpTool: string;
  aiSkill: string | null;
  actionClass: "read" | "plan" | "write";
  mcpAuthority: false;
  prohibitedShortcut: string;
  requiredEvidence: readonly string[];
}>;

const rows: ReceizV123DoctrineEntry[] = [
  {
    domain: "world",
    strongestSource: "exact source command and authenticated world head",
    sdkOperation: "adapter.v123.world.planCommandV122",
    mcpTool: "receiz_v123_world_plan_command_v122",
    aiSkill: null,
    actionClass: "plan",
    mcpAuthority: false,
    prohibitedShortcut: "Never let a caller supply a generated command digest, command identity, or authority field.",
    requiredEvidence: ["exact command input", "authenticated world head", "SDK-generated digest"],
  },
  {
    domain: "world",
    strongestSource: "exact source commands and authenticated participant heads",
    sdkOperation: "adapter.v123.world.planTransactionV122",
    mcpTool: "receiz_v123_world_plan_transaction_v122",
    aiSkill: null,
    actionClass: "plan",
    mcpAuthority: false,
    prohibitedShortcut: "Never accept caller-generated transaction identity, digest, ordering, or security fields.",
    requiredEvidence: ["exact planned commands", "authenticated heads", "SDK-generated transaction identity"],
  },
  {
    domain: "value",
    strongestSource: "persisted exact settlement intent, source proof object, and authenticated value heads",
    sdkOperation: "adapter.v123.value.executeSettlement",
    mcpTool: "receiz_v123_value_execute_settlement",
    aiSkill: "receiz-value-execution",
    actionClass: "write",
    mcpAuthority: false,
    prohibitedShortcut: "Never execute from a display projection, fabricated intent, USD amount, or unpersisted plan.",
    requiredEvidence: ["exact Phi intent", "persist-before-execute", "semantic idempotency key", "explicit consent"],
  },
  {
    domain: "value",
    strongestSource: "persisted exact reserve intent, source proof object, and authenticated value heads",
    sdkOperation: "adapter.v123.value.executeReserve",
    mcpTool: "receiz_v123_value_execute_reserve",
    aiSkill: "receiz-value-execution",
    actionClass: "write",
    mcpAuthority: false,
    prohibitedShortcut: "Never merge Reserve with Settlement or execute from USD display value.",
    requiredEvidence: ["exact Phi intent", "persist-before-execute", "semantic idempotency key", "explicit consent"],
  },
  {
    domain: "value",
    strongestSource: "authenticated execution outcome bound to the original semantic idempotency key",
    sdkOperation: "adapter.v123.value.executionByIdempotencyKey",
    mcpTool: "receiz_v123_value_execution_by_idempotency",
    aiSkill: "receiz-value-execution",
    actionClass: "read",
    mcpAuthority: false,
    prohibitedShortcut: "Never retry an unknown value execution before authoritative lookup by idempotency key.",
    requiredEvidence: ["original idempotency key", "lookup before retry", "exact authenticated outcome"],
  },
  {
    domain: "subject",
    strongestSource: "exact authenticated subject head and namespace evidence",
    sdkOperation: "adapter.v123.subjects.resolveNamespaces",
    mcpTool: "receiz_v123_subject_resolve_namespaces",
    aiSkill: null,
    actionClass: "read",
    mcpAuthority: false,
    prohibitedShortcut: "Never resolve from a stale, caller-overridden, or approximate head.",
    requiredEvidence: ["exact subject ID", "exact authenticated head", "normalized namespace names"],
  },
  {
    domain: "identity",
    strongestSource: "locally held identity proof object plus an exact application challenge and explicit consent",
    sdkOperation: "adapter.v123.identity.exchangeProofAuthority",
    mcpTool: "receiz_v123_identity_exchange_proof_authority",
    aiSkill: "receiz-proof-authority",
    actionClass: "write",
    mcpAuthority: false,
    prohibitedShortcut: "Never invent a challenge, infer consent, serialize bearer authority, or let representation stand in for the proof object.",
    requiredEvidence: ["local proof object", "exact application challenge", "explicit consent", "memory-only bearer"],
  },
  {
    domain: "auth",
    strongestSource: "live bearer authority derived from the accepted proof object and exact granted scopes",
    sdkOperation: "adapter.v123.auth.grantedScopes",
    mcpTool: "receiz_v123_auth_granted_scopes",
    aiSkill: "receiz-proof-authority",
    actionClass: "read",
    mcpAuthority: false,
    prohibitedShortcut: "Never infer a grant from requested scopes, UI state, a receipt, MCP output, or AI narration.",
    requiredEvidence: ["live in-memory authority", "exact scope introspection", "required-scope equality"],
  },
];

export const RECEIZ_V123_DOCTRINE = Object.freeze(rows.map((entry) => Object.freeze({
  ...entry,
  requiredEvidence: Object.freeze([...entry.requiredEvidence]),
})));

export const RECEIZ_V123_EXAMPLES = Object.freeze({
  sdk: `const persisted = await coordinator.persist(plan, semanticIdempotencyKey);
const outcome = await authoritySession.executeSettlement(persisted);
// Unknown outcome: lookup before retry. Representation is never authority.`,
  mcp: `receiz_v123_identity_exchange_proof_authority(input)
// Requires the exact proof object and explicit consent; mcpAuthority: false.`,
});
