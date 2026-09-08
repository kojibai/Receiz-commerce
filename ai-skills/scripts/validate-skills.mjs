import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const skillsIndex = JSON.parse(readFileSync(join(root, "skills.json"), "utf8"));
const skills = [
    {
        name: "receiz-app-builder-skill",
        resources: ["workflow.md", "authority-boundaries.md", "generated-file-repair.md", "upgrade-rules.md"],
        examples: ["commerce.md", "marketplace.md", "persistent-world.md", "ai-operated.md", "profile-portfolio.md", "content-publishing.md", "proof-verifier.md", "minimal-proof-object.md"],
    },
    {
        name: "receiz-proof-skill",
        resources: [
            "receiz-laws.md",
            "proof-object-model.md",
            "verification-flow.md",
            "output-templates.md",
            "failure-modes.md",
            "mcp-tool-map.md",
            "sdk-reference.md",
        ],
        examples: ["verify-card.md", "verify-product.md", "verify-post.md", "verify-pack.md", "verify-vault.md"],
    },
    {
        name: "receiz-builder-skill",
        resources: [
            "sdk-quickstart.md",
            "app-patterns.md",
            "no-db-pattern.md",
            "proof-native-ui-patterns.md",
            "deployment-checklist.md",
            "generated-code-rules.md",
        ],
        examples: ["create-storefront.md", "create-marketplace.md", "create-proof-page.md", "create-pack-app.md", "create-profile-vault.md"],
    },
    {
        name: "receiz-mcp-agent-skill",
        resources: [
            "mcp-tool-map.md",
            "v124-runtime-tool-map.md",
            "v124-runtime-tool-map.json",
            "v125-economy-tool-map.md",
            "v125-economy-tool-map.json",
            "agent-operating-rules.md",
            "safe-tool-calling.md",
            "auth-boundaries.md",
            "action-confirmation-rules.md",
            "response-templates.md",
        ],
        examples: ["agent-verify-object.md", "agent-build-app.md", "agent-append-proof.md", "agent-inspect-vault.md"],
    },
    {
        name: "receiz-commerce-skill",
        resources: [
            "commerce-object-model.md",
            "product-proof-flow.md",
            "storefront-patterns.md",
            "order-and-receipt-boundaries.md",
            "seller-buyer-language.md",
            "conversion-copy-patterns.md",
        ],
        examples: ["create-product-page.md", "create-no-db-store.md", "verify-product-ownership.md", "explain-receiz-commerce.md"],
    },
    {
        name: "receiz-sports-card-skill",
        resources: [
            "sports-card-object-model.md",
            "card-memory-law.md",
            "live-event-append-flow.md",
            "rarity-and-event-language.md",
            "mlb-proof-language.md",
            "game-surface-patterns.md",
        ],
        examples: ["explain-player-card.md", "explain-live-event-card.md", "explain-pack-opening.md", "explain-card-market.md", "explain-geo-appeal.md"],
    },
    {
        name: "receiz-offline-verifier-skill",
        resources: [
            "offline-verification-law.md",
            "verifier-flow.md",
            "artifact-over-server.md",
            "airplane-mode-principle.md",
            "security-boundaries.md",
        ],
        examples: ["verify-offline-asset.md", "explain-offline-proof.md", "debug-verification-failure.md"],
    },
    {
        name: "receiz-distribution-skill",
        resources: [
            "qr-activation-flow.md",
            "pack-derby-model.md",
            "venue-playbook.md",
            "affiliate-boundaries.md",
            "staff-training-script.md",
            "conversion-language.md",
        ],
        examples: ["create-bar-flyer-copy.md", "create-venue-one-pager.md", "explain-pack-derby.md", "create-restaurant-activation.md"],
    },
    {
        name: "receiz-skill-bundle",
        resources: [
            "skill-routing.md",
            "combined-agent-behavior.md",
            "when-to-use-each-skill.md",
            "canonical-receiz-language.md",
        ],
        examples: [],
    },
];
const constitutionalSkills = [
    "receiz-architecture",
    "receiz-domain-builder",
    "receiz-constitutional-laws",
    "receiz-command-builder",
    "receiz-authority-security",
    "receiz-deterministic-replay",
    "receiz-offline-first",
    "receiz-causal-sync",
    "receiz-portable-artifacts",
    "receiz-migrations",
    "receiz-performance",
    "receiz-observability",
    "receiz-testing",
    "receiz-release",
    "receiz-build-production-system",
];
const operationSkills = [
    "receiz-identity-profile",
    "receiz-portable-continuity",
    "receiz-bearer-ownership",
    "receiz-offline-command",
    "receiz-proof-media",
    "receiz-cross-app-state",
    "receiz-receipt-admission",
];
const artifactSkills = [
    "receiz-portable-artifacts",
    "receiz-proof-skill",
    "receiz-offline-verifier-skill",
    "receiz-cross-app-state",
    "receiz-app-builder-skill",
    "receiz-migrations",
    "receiz-testing",
    "receiz-release",
];
const artifactRegistryDigest = skillsIndex.registryDigest;
const operationMatrixDigest = skillsIndex.operationMatrixDigest;
const artifactLaws = Array.from({ length: 30 }, (_, index) => `ARTIFACT-${String(index + 1).padStart(3, "0")}`);
const artifactSdkOperations = skillsIndex.operationAuthorityMatrix.map((row) => row.operation);
const currentMcpArtifactTools = skillsIndex.currentMcpArtifactTools;
const currentMcpLivingSubjectTools = skillsIndex.currentMcpLivingSubjectTools;
const currentMcpTools = skillsIndex.currentMcpTools;
const currentMcpV122Tools = skillsIndex.currentMcpV122Tools;
const currentMcpV123Tools = skillsIndex.currentMcpV123Tools;
const currentMcpV124Tools = skillsIndex.currentMcpV124Tools;
const currentMcpV125Tools = skillsIndex.currentMcpV125Tools;
const v124_1CapabilityInventory = skillsIndex.v124_1CapabilityInventory;
const v125CapabilityInventory = skillsIndex.v125CapabilityInventory;
const sdkClientCapabilityInventory = skillsIndex.sdkClientCapabilityInventory;
const sdkClientCapabilityInventoryDigest = skillsIndex.sdkClientCapabilityInventoryDigest;
const historicalSdkClientCapabilities = skillsIndex.historicalSdkClientCapabilities;
const historicalV112McpArtifactTools = skillsIndex.historicalV112McpArtifactTools;
const machineAllowedTools = new Set();
const machineSdkOperations = new Set();
const machineHistoricalSdkOperations = new Set();
const requiredNewMachineAllowedTools = Object.freeze([
    "receiz_webhook_events_catalog",
    "receiz_webhook_register_endpoint",
    "receiz_webhook_rotate_secret",
    "receiz_webhook_send_test_event",
    "receiz_webhook_receiver_scaffold",
    "receiz_webhook_verify_payload",
    "receiz_mcp_append_event",
    "receiz_mcp_commit_atomic_projection",
    "receiz_source_carried_replay_open",
    "receiz_conversation_source_family_open",
    "receiz_conversation_epoch_grants_plan",
    "receiz_material_source_parts_open",
    "receiz_v125_lawful_action_law_register",
    "receiz_v125_lawful_action_admit",
    "receiz_v125_lawful_action_value_head_derive",
    "receiz_v125_edge_value_plan_settlement",
    "receiz_v125_edge_value_plan_reserve",
    "receiz_v125_edge_value_plan_inspect",
    "receiz_v125_edge_value_transition_set_verify",
    "receiz_v125_edge_value_commit_set_prepare",
    "receiz_v125_edge_value_recovery_create",
    "receiz_v125_edge_value_settlement_send_confirm",
    "receiz_v125_edge_value_settlement_receive",
    "receiz_v125_edge_value_reserve_send_confirm",
    "receiz_v125_edge_value_reserve_receive",
]);
const removedMachineTools = Object.freeze([
    "receiz_identity_profile_update_plan",
    "receiz_identity_profile_update_execute",
    "receiz_bearer_asset_claim_plan",
    "receiz_bearer_asset_claim_execute",
]);
const currentVersion = skillsIndex.version;
const currentRulesetVersion = skillsIndex.rulesetVersion;
const currentRange = `>=${Number(currentVersion.split(".")[0])}.0.0 <${Number(currentVersion.split(".")[0]) + 1}.0.0`;
const currentSchema = `receiz.ai-skill-contract.v${Number(currentVersion.split(".")[0])}`;
const currentForbiddenOperations = [
    "last-write-wins", "timestamp-as-head-authority", "connect-token-as-proof-authority",
    "local-receipt-as-global-authority", "projection-as-current-owner", "silent-divergence-resolution",
    "remote-reconciliation-before-first-paint", "unverified-server-artifact-render",
    "environment-player-token-fallback", "accepted-means-effects-delivered", "indeterminate-means-failed",
    "created-at-as-proof-authority",
];
const expectedTemporalAuthority = Object.freeze({
    kksVersion: "KKSv1.0",
    coordinateSchema: "receiz.kks-v1.proof-coordinate.v1",
    temporalAuthority: "kai-pulse-monotonic-frequency-from-genesis",
    coordinateCandidate: "local-genesis-frequency",
    admittedCoordinate: "verified-kaisigil-bound-kks-coordinate",
    existingProofCoordinate: "verified-sealed-carried-kaisigil-coordinate",
    intrinsicProof: "kaisigil-blake3-poseidon-groth16",
    causalOrder: "verified-previous-head-then-strictly-greater-kai-upulse",
    bareCoordinateAuthority: false,
    chronosRole: "descriptive-projection-only",
    createdAtAuthority: false,
    networkRequired: false,
    conformance: "runReceizV125TemporalAuthorityConformance",
    sdk: {
        live: "createReceizKksV1LiveProofCoordinate",
        sealed: "projectReceizKksV1SealedProofCoordinate",
        admit: "admitReceizKksV1ProofCoordinate",
    },
    mcp: {
        live: "receiz_v124_kai_now",
        sealed: "receiz_sealed_kai_moment",
    },
});
const expectedLocalContinuityAuthority = Object.freeze({
    schema: "receiz.identity.local-continuity-authority.v1",
    admittedProjection: "immediate-complete-sealed-head",
    localTruth: "permanent-append-only",
    synchronization: "verified-descendants-after-sealed-head-only",
    serverRole: "distribution-and-indexing-only",
    networkRequiredForLocalUse: false,
    globalAcknowledgementDeletesLocalTruth: false,
    infrastructureMayBlockVerifiedOwner: false,
    permittedHydration: [
        "verified-transactions-after-sealed-head",
        "verified-messages-from-other-actors-after-sealed-head",
        "verified-twin-activity-after-sealed-head",
        "verified-global-descendants-after-sealed-head",
    ],
});
const requiredLocalContinuityForbiddenOperations = [
    "server-reconstruction-before-local-projection",
    "delete-settled-local-proof-after-sync",
    "hydrate-at-or-before-sealed-head",
    "infrastructure-gates-verified-owner",
];
const expectedAuthorityFlow = Object.freeze({
    schema: "receiz.authority-flow.v1",
    stages: ["source", "evidence", "relationship", "permissible-inference", "representation"],
    direction: "forward-only",
    terminalAuthority: "actual-sealed-proof-object",
    representationIsAuthority: false,
    sourceMayBeReconstructedFromRepresentation: false,
    externalAuthorityAboveProofObject: false,
    highestCashOutFrame: {
        label: "Highest Cash-Out Frame",
        statement: "source + law + sequence + object + evidence. And the reader underneath them.",
        readerPosition: "underneath-authority",
        readerIsAuthority: false,
    },
});
const requiredAuthorityFlowForbiddenOperations = [
    "representation-as-source-authority",
    "inference-rewrites-relationship",
    "relationship-substitutes-for-evidence",
    "evidence-replaces-source",
    "external-authority-above-proof-object",
    "reader-as-authority",
];
const currentFocusedSkills = new Set(["receiz-value-rails", "receiz-value-execution", "receiz-proof-authority"]);
const v124McpToolContracts = Object.freeze([
    ["receiz_v124_kai_now", "receizKaiNow", "none", []],
    ["receiz_v124_proof_authority_challenge_create", "createReceizProofAuthorityChallenge", "requested-exact", []],
    ["receiz_v124_execution_plan_atomic_operation", "client.execution.planAtomicOperationV124", "none", []],
    ["receiz_v124_execution_stage", "client.execution.stage", "fixed-all", ["receiz:domains.write"]],
    ["receiz_v124_execution_stage_prepared", "client.execution.stagePrepared", "fixed-all", ["receiz:domains.write"]],
    ["receiz_v124_execution_execute", "client.execution.execute", "active-session-route-and-category-rail", ["receiz:domains.write"]],
    ["receiz_v124_execution_resolve", "client.execution.resolve", "fixed-all", ["receiz:domains.read"]],
    ["receiz_v124_execution_resolve_by_idempotency", "client.execution.resolveByIdempotencyKey", "fixed-all", ["receiz:domains.read"]],
    ["receiz_v124_execution_cancel", "client.execution.cancel", "active-session-route-and-category-rail", ["receiz:domains.write"]],
    ["receiz_v124_runtime_authority_session_open", "client.runtime.openAuthoritySessionV124", "challenge-session-plus-requested-rail-write", []],
    ["receiz_v124_runtime_authority_session_refresh", "client.runtime.refreshAuthoritySessionV124", "challenge-session-plus-requested-rail-write", []],
    ["receiz_v124_runtime_authority_session_close", "client.runtime.closeAuthoritySessionV124", "stored-session-grant", []],
    ["receiz_v124_runtime_qualify", "client.runtime.qualifyV124", "application-bound-bearer", []],
    ["receiz_v124_domain_verified_additions", "client.domains.verifiedAdditionsV124", "fixed-all", ["receiz:domains.read"]],
    ["receiz_v124_domain_verified_replay", "client.domains.verifiedReplayV124", "fixed-all", ["receiz:domains.read"]],
    ["receiz_v124_domain_verified_checkpoint", "client.domains.verifiedCheckpointV124", "fixed-all", ["receiz:domains.read"]],
    ["receiz_v124_domain_verified_private_additions", "client.domains.verifiedPrivateAdditionsV124", "active-session-route-and-stored-grant", ["receiz:world.private"]],
    ["receiz_v124_domain_replay_proof_object_export", "client.domains.exportVerifiedReplayProofObjectV124", "none", []],
    ["receiz_v124_domain_replay_proof_object_restore", "client.domains.restoreVerifiedReplayProofObjectV124", "none", []],
    ["receiz_source_carried_replay_open", "openReceizSourceCarriedReplayFamilyV124 + projectReceizSourceCarriedReplayBranchesV124", "none", []],
    ["receiz_conversation_source_family_open", "openReceizConversationSourceFamilyV1", "none", []],
    ["receiz_conversation_epoch_grants_plan", "planReceizConversationEpochGrantBatchesV1", "none", []],
    ["receiz_material_source_parts_open", "openReceizMaterialSourceParts", "none", []],
    ["receiz_v124_subject_namespaces_resolve", "client.subjects.resolveNamespacesV124", "fixed-all", ["receiz:subjects.read"]],
    ["receiz_v124_identity_public_recipient_resolve", "client.identity.resolvePublicRecipientV124", "active-session-route-and-stored-grant", ["receiz:subjects.read"]],
    ["receiz_v124_source_publish_sealed", "client.sources.publishSealedSourceV124", "source-kind-and-stored-grant", []],
]);
const v124McpConditionalScopeContracts = Object.freeze({
    receiz_v124_proof_authority_challenge_create: ["exact-requested-scopes-within-registered-application-grant"],
    receiz_v124_execution_execute: ["exact-stored-granted-scopes", "settlement-or-reserve-granted-rail-when-operation-category-requires-it"],
    receiz_v124_execution_cancel: ["exact-stored-granted-scopes", "settlement-or-reserve-granted-rail-when-operation-category-requires-it"],
    receiz_v124_runtime_authority_session_open: ["exact-signed-challenge-scopes", "receiz:<requested-rail>.write"],
    receiz_v124_runtime_authority_session_refresh: ["exact-signed-challenge-scopes", "exact-stored-session-scopes", "receiz:<requested-rail>.write"],
    receiz_v124_runtime_authority_session_close: ["exact-stored-session-scopes"],
    receiz_v124_runtime_qualify: ["application-bound-bearer"],
    receiz_v124_domain_verified_private_additions: ["exact-stored-granted-scopes"],
    receiz_v124_identity_public_recipient_resolve: ["exact-stored-granted-scopes"],
    receiz_v124_source_publish_sealed: [
        "subject:receiz:subjects.write:no-session",
        "replay-segment:receiz:domains.write:exact-stored-granted-scopes",
        "checkpoint:receiz:domains.write:exact-stored-granted-scopes",
    ],
});
const v124McpReferenceContracts = Object.freeze({
    receiz_v124_kai_now: [[], []],
    receiz_v124_proof_authority_challenge_create: [[], []],
    receiz_v124_execution_plan_atomic_operation: [[], ["planRef"]],
    receiz_v124_execution_stage: [["planRef"], ["handleRef"]],
    receiz_v124_execution_stage_prepared: [["planRef", "transitionSetRef"], ["handleRef"]],
    receiz_v124_execution_execute: [["handleRef", "sessionRef"], ["planRef"]],
    receiz_v124_execution_resolve: [[], ["planRef"]],
    receiz_v124_execution_resolve_by_idempotency: [[], ["planRef"]],
    receiz_v124_execution_cancel: [["handleRef", "sessionRef"], ["planRef"]],
    receiz_v124_runtime_authority_session_open: [["identityArtifactRef", "subjectSourceArtifactRef", "signedChallengeRef"], ["sessionRef", "persistedSessionRef"]],
    receiz_v124_runtime_authority_session_refresh: [["sessionRef", "identityArtifactRef", "signedChallengeRef"], ["sessionRef", "persistedSessionRef"]],
    receiz_v124_runtime_authority_session_close: [["sessionRef"], []],
    receiz_v124_runtime_qualify: [[], []],
    receiz_v124_domain_verified_additions: [[], []],
    receiz_v124_domain_verified_replay: [[], []],
    receiz_v124_domain_verified_checkpoint: [[], []],
    receiz_v124_domain_verified_private_additions: [["sessionRef"], ["privateAdditionsRef"]],
    receiz_v124_domain_replay_proof_object_export: [[], []],
    receiz_v124_domain_replay_proof_object_restore: [["sealedReplayProofObjectRef"], []],
    receiz_source_carried_replay_open: [["sealedSourceArtifactRefs"], []],
    receiz_conversation_source_family_open: [["sealedSourceArtifactRefs"], []],
    receiz_conversation_epoch_grants_plan: [["epochSecretRef", "recipientSetRef"], []],
    receiz_material_source_parts_open: [["materialSourceFamilyRef"], []],
    receiz_v124_subject_namespaces_resolve: [[], []],
    receiz_v124_identity_public_recipient_resolve: [["sessionRef"], []],
    receiz_v124_source_publish_sealed: [["sealedSourceArtifactRef", "sessionRef"], []],
});
const artifactEvidence = [
    "exact-artifact-byte-identity", "artifact-digest-match", "payload-digest-binding", "signature-v4",
    "owner-claim-binding", "independent-artifact-verification", "cross-platform-round-trip",
    "legacy-read-compatibility", "release-lock-pass", "zero-network-verification", "local-verifier-result",
    "unified-admission-verdicts", "explicit-permitted-actions", "verified-proof-history",
    "zero-network-read-only-coordinator", "atomic-recovery-commit", "operation-identity-parity",
    "multi-application-convergence",
];
const artifactCompletionFields = [
    "sdk-version", "registry-digest", "artifact-law-version", "artifact-carrier", "signature-version",
    "artifact-digest", "payload-digest", "owner-and-claim-binding", "independent-verification-result",
    "cross-platform-round-trip-result", "legacy-compatibility-result", "release-lock-result",
    "network-calls-during-verification", "local-verifier-result",
    "admission-verdict", "permitted-actions", "proof-history-digest", "recovery-plan-digest",
    "operation-identity", "atomic-commit-result",
];
const artifactCompletionLabels = [
    "SDK version:", "Registry digest:", "Artifact law version:", "Artifact carrier:", "Signature version:",
    "Artifact digest:", "Payload digest:", "Owner and claim binding:", "Independent verification result:",
    "Cross-platform round-trip result:", "Legacy compatibility result:", "Release-lock result:",
    "Network calls during verification: 0", "Local verifier result:",
    "Admission verdict:", "Permitted actions:", "Proof history digest:", "Recovery plan digest:",
    "Operation identity:", "Atomic commit result:",
];
const artifactProhibitions = [
    "Never download an unsealed payload fallback.",
    "Never call an inner payload a Receiz artifact.",
    "Never relabel payload bytes as a Receiz artifact.",
    "Never repack, wrap, recompress, or modify native Record -> Seal bytes.",
    "Never treat shape validation as artifact verification.",
    "Never delete unknown cross-application namespaces.",
    "Never rewrite immutable ownership or provenance history.",
    "Never weaken a failing test to accept payload-only continuity.",
    "Never claim success from UI rendering alone.",
    "Never admit a card-only payload as a Receiz artifact.",
    "Never treat an explanation as proof authority.",
    "Never accept raw capability JSON as recovery authority.",
];
const compatibilityOperationSections = [
    "## Exact SDK operation",
    "## Required authority",
    "## Required proof head",
    "## Idempotency",
    "## Offline behavior",
    "## Conflict behavior",
    "## Receipt verification",
    "## User confirmation",
    "## MCP parity",
    "## Emulator fixture",
];
const livingSubjectSkills = [
    "receiz-living-subject",
    "receiz-subject-twin",
    "receiz-autonomous-mandate",
    "receiz-world-event-runtime",
    "receiz-multi-subject-transaction",
    "receiz-event-derived-memory",
    "receiz-live-proof-character",
];
const currentOutcomeSections = {
    "receiz-identity-profile": [
        "## Exact SDK operation", "## Required authority", "## Required admission", "## Deterministic behavior",
        "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
    ],
    "receiz-bearer-ownership": [
        "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
        "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
    ],
    "receiz-proof-media": [
        "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
        "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
    ],
    "receiz-portable-continuity": [
        "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
        "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
    ],
    "receiz-offline-command": [
        "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
        "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
    ],
    "receiz-cross-app-state": [
        "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
        "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
    ],
    "receiz-receipt-admission": [
        "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
        "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
    ],
};
const currentOutcomeEvidence = {
    "receiz-identity-profile": ["same-account-uid-result"],
    "receiz-bearer-ownership": ["complete-artifact-verification", "native-record-seal"],
    "receiz-proof-media": ["complete-artifact-verification", "native-record-seal", "same-account-uid-result"],
    "receiz-portable-continuity": ["complete-artifact-verification", "native-record-seal", "same-account-uid-result"],
    "receiz-offline-command": ["queued-not-global-admission", "independent-artifact-verification"],
    "receiz-cross-app-state": ["complete-artifact-verification", "native-record-seal", "same-account-uid-result"],
    "receiz-receipt-admission": ["complete-artifact-verification", "independent-artifact-verification"],
};
const requiredSections = [
    "## When To Use This Skill",
    "## When Not To Use This Skill",
    "## Core Receiz Laws",
    "## Required Behavior",
    "## Forbidden Behavior",
    "## MCP Usage Rules",
    "## SDK Usage Rules",
    "## Output Format",
    "## Safety And Security Boundaries",
    "## Examples",
];
const placeholderPattern = /\b(TODO|TBD)\b|lorem ipsum|fake[_ -]?api|placeholder api|someapi|fooapi|barapi/i;
const secretPattern = /(sk-[a-zA-Z0-9]{20,}|xox[baprs]-[a-zA-Z0-9-]{20,}|ghp_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY)/;
const envAssignmentPattern = /\b[A-Z][A-Z0-9_]{2,}\s*=\s*["']?[^"'\s<>]+/;
const liveVerificationPattern = /(live verification|verified live|live-verified|live verified)/i;
const mcpReferencePattern = /(MCP|receiz_[a-z0-9_]+)/;
const failures = [];
function fail(message) {
    failures.push(message);
}
function read(path) {
    return readFileSync(path, "utf8");
}
function markdownFiles(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        const stat = statSync(path);
        if (stat.isDirectory())
            out.push(...markdownFiles(path));
        if (stat.isFile() && entry.endsWith(".md"))
            out.push(path);
    }
    return out;
}
function assertPath(path) {
    if (!existsSync(path))
        fail(`Missing ${relative(process.cwd(), path)}`);
}
function assertMarkdownLinks(file, text) {
    const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
    for (const match of text.matchAll(linkPattern)) {
        const target = match[1]?.trim();
        if (!target || target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#"))
            continue;
        const withoutAnchor = target.split("#")[0] ?? "";
        if (!withoutAnchor || withoutAnchor.startsWith("mailto:"))
            continue;
        const targetPath = normalize(resolve(file, "..", withoutAnchor));
        if (!targetPath.startsWith(root))
            continue;
        if (!existsSync(targetPath))
            fail(`${relative(process.cwd(), file)} links to missing ${target}`);
    }
}
function assertSkill(skill) {
    const skillDir = join(root, skill.name);
    const skillFile = join(skillDir, "SKILL.md");
    assertPath(skillFile);
    for (const resource of skill.resources)
        assertPath(join(skillDir, "resources", resource));
    for (const example of skill.examples)
        assertPath(join(skillDir, "examples", example));
    if (!existsSync(skillFile))
        return;
    const text = read(skillFile);
    if (!text.startsWith("---\n"))
        fail(`${skill.name}/SKILL.md is missing YAML frontmatter`);
    if (!new RegExp(`name:\\s*${skill.name}\\n`).test(text))
        fail(`${skill.name}/SKILL.md frontmatter name mismatch`);
    if (!/description:\s*Use when/.test(text))
        fail(`${skill.name}/SKILL.md description must start with Use when`);
    if (!text.includes(`# ${skill.name}`))
        fail(`${skill.name}/SKILL.md must include the skill name as the H1`);
    for (const section of requiredSections) {
        if (!text.includes(section))
            fail(`${skill.name}/SKILL.md missing section ${section}`);
    }
    if (!text.includes("Never treat a database, server, marketplace, UI, model response, or cache as final authority.")) {
        fail(`${skill.name}/SKILL.md missing final-authority law`);
    }
    assertMarkdownLinks(skillFile, text);
}
function assertConstitutionalSkill(name) {
    const skillDir = join(root, name);
    const skillFile = join(skillDir, "SKILL.md");
    const manifestFile = join(skillDir, "manifest.json");
    assertPath(skillFile);
    assertPath(manifestFile);
    assertPath(join(skillDir, "agents", "openai.yaml"));
    if (!existsSync(skillFile) || !existsSync(manifestFile))
        return;
    const text = read(skillFile);
    const manifest = JSON.parse(read(manifestFile));
    if (!new RegExp(`^---\\nname: ${name}\\ndescription: Use when `).test(text)) {
        fail(`${name}/SKILL.md has invalid discovery frontmatter`);
    }
    for (const section of ["## Constitutional workflow", "## Machine contract", "## Quick reference", "## Common mistakes", "## Completion refusal", "## Example"]) {
        if (!text.includes(section))
            fail(`${name}/SKILL.md missing section ${section}`);
    }
    if (manifest.schema !== currentSchema || manifest.name !== name || manifest.version !== currentVersion) {
        fail(`${name}/manifest.json has invalid schema or name`);
    }
    const serialized = JSON.stringify(manifest);
    for (const required of [
        currentRange,
        artifactRegistryDigest,
        operationMatrixDigest,
        "direct-state-write",
        "history-rewrite",
        "authority-bypass",
        "independent-verifier",
        "release-lock-pass",
        "inspect-plan-scaffold-test",
    ]) {
        if (!serialized.includes(required))
            fail(`${name}/manifest.json missing ${required}`);
    }
    assertMarkdownLinks(skillFile, text);
}
function assertOperationSkill(name) {
    const skillDir = join(root, name);
    const skillFile = join(skillDir, "SKILL.md");
    const manifestFile = join(skillDir, "manifest.json");
    assertPath(skillFile);
    assertPath(manifestFile);
    assertPath(join(skillDir, "agents", "openai.yaml"));
    if (!existsSync(skillFile) || !existsSync(manifestFile))
        return;
    const text = read(skillFile);
    const manifest = JSON.parse(read(manifestFile));
    if (!new RegExp(`^---\\nname: ${name}\\ndescription: Use when `).test(text)) {
        fail(`${name}/SKILL.md has invalid discovery frontmatter`);
    }
    for (const section of currentOutcomeSections[name] ?? compatibilityOperationSections) {
        if (!text.includes(section))
            fail(`${name}/SKILL.md missing section ${section}`);
    }
    if (!/```ts[\s\S]*createReceizClient[\s\S]*```/.test(text))
        fail(`${name}/SKILL.md missing copy-paste TypeScript`);
    if (manifest.schema !== currentSchema || manifest.name !== name || manifest.version !== currentVersion) {
        fail(`${name}/manifest.json has invalid schema, name, or version`);
    }
    const serialized = JSON.stringify(manifest);
    for (const required of [
        currentRange,
        currentVersion,
        artifactRegistryDigest,
        operationMatrixDigest,
        "emulator-conformance",
        "release-lock-pass",
        "inspect-plan-simulate",
    ]) {
        if (!serialized.includes(required))
            fail(`${name}/manifest.json missing ${required}`);
    }
    for (const field of ["sdkOperations", "allowedTools", "requiredScopes", "emulatorFixtures", "requiredEvidence"]) {
        const value = manifest[field];
        const readOnlyLocalScope = field === "requiredScopes" && name === "receiz-receipt-admission";
        if (!Array.isArray(value) || (!readOnlyLocalScope && value.length === 0))
            fail(`${name}/manifest.json missing ${field}`);
    }
    const nativeEvidence = currentOutcomeEvidence[name];
    if (nativeEvidence) {
        for (const required of nativeEvidence) {
            if (!serialized.includes(required))
                fail(`${name}/manifest.json missing ${required}`);
        }
        if (/identity\.getProfile|identity\.restoreAccount|identity\.appendAccountState|continuity\.reconcile|continuity\.commit|offline\.createCommandQueue|offline\.executeOrQueue|proofHead\.get|receipts\.verify|identityKeyId|expectedOwnershipHead|claimantKeyId|receiz_proof_head_get|receiz_receipt_verify|receiz_continuity_sync_plan|receiz_continuity_sync_execute|media\.publishIdentityImage/.test(text + serialized)) {
        fail(`${name} retains a retired obsolete-versioned prerequisite in the active current outcome`);
        }
        if (/## Required proof head|## Receipt verification/.test(text)) {
            fail(`${name}/SKILL.md retains a retired obsolete-versioned current-outcome section`);
        }
    }
    else if (!serialized.includes("receipt-verification")) {
        fail(`${name}/manifest.json missing receipt-verification compatibility evidence`);
    }
    assertMarkdownLinks(skillFile, text);
}
function assertArtifactSkill(name) {
    const skillDir = join(root, name);
    const skillFile = join(skillDir, "SKILL.md");
    const manifestFile = join(skillDir, "manifest.json");
    assertPath(skillFile);
    assertPath(manifestFile);
    if (!existsSync(skillFile) || !existsSync(manifestFile))
        return;
    const text = read(skillFile);
    const manifest = JSON.parse(read(manifestFile));
    const requires = manifest.requires;
    if (!text.includes("A Receiz artifact is the exact byte sequence returned by native Record -> Seal. The inner payload is never an acceptable substitute.")) {
        fail(`${name}/SKILL.md missing binding artifact law`);
    }
    for (const operation of artifactSdkOperations) {
        if (!JSON.stringify(manifest.operationAuthorityMatrix).includes(operation))
            fail(`${name}/manifest.json missing matrix operation ${operation}`);
    }
    for (const label of artifactCompletionLabels) {
        if (!text.includes(label))
            fail(`${name}/SKILL.md missing completion field ${label}`);
    }
    for (const prohibition of artifactProhibitions) {
        if (!text.includes(prohibition))
            fail(`${name}/SKILL.md missing prohibition ${prohibition}`);
    }
    if (!/refuse to (?:call|say|report|claim).*production-ready|refuse production-ready completion/i.test(text)) {
        fail(`${name}/SKILL.md must refuse production-ready completion without evidence`);
    }
    if (manifest.schema !== currentSchema || manifest.name !== name || manifest.version !== currentVersion) {
        fail(`${name}/manifest.json has invalid current schema, name, or version`);
    }
    if (requires?.ruleset !== currentRulesetVersion || requires.registryDigest !== artifactRegistryDigest || requires.operationMatrixDigest !== operationMatrixDigest) {
        fail(`${name}/manifest.json has artifact registry or ruleset skew`);
    }
    if (manifest.artifactLawVersion !== currentRulesetVersion || JSON.stringify(manifest.artifactLaws) !== JSON.stringify(artifactLaws)) {
        fail(`${name}/manifest.json has artifact law version or law-set skew`);
    }
    const evidence = Array.isArray(manifest.requiredEvidence) ? manifest.requiredEvidence : [];
    const forbidden = Array.isArray(manifest.forbiddenOperations) ? manifest.forbiddenOperations : [];
    for (const operation of artifactSdkOperations) {
        if (!JSON.stringify(manifest.operationAuthorityMatrix).includes(operation))
            fail(`${name}/manifest.json missing matrix operation ${operation}`);
    }
    for (const required of artifactEvidence) {
        if (!evidence.includes(required))
            fail(`${name}/manifest.json missing ${required}`);
    }
    for (const required of ["payload-fallback", "payload-relabel-as-artifact", "artifact-repack", "shape-only-verification", "history-rewrite"]) {
        if (!forbidden.includes(required))
            fail(`${name}/manifest.json missing ${required}`);
    }
    if (JSON.stringify(manifest.requiredCompletionFields) !== JSON.stringify(artifactCompletionFields)) {
        fail(`${name}/manifest.json requiredCompletionFields do not match shared artifact law`);
    }
    assertMarkdownLinks(skillFile, text);
}
function assertGlobalReconciliationSkill() {
    const name = "receiz-global-reconciliation";
    const skillDir = join(root, name);
    const skillFile = join(skillDir, "SKILL.md");
    const manifestFile = join(skillDir, "manifest.json");
    assertPath(skillFile);
    assertPath(manifestFile);
    assertPath(join(skillDir, "agents", "openai.yaml"));
    for (const resource of ["reconciliation-flow.md", "divergence-and-recovery.md", "first-paint-and-effects.md", "mcp-tool-map.md"])
        assertPath(join(skillDir, "resources", resource));
    if (!existsSync(skillFile) || !existsSync(manifestFile))
        return;
    const text = read(skillFile);
    const manifest = JSON.parse(read(manifestFile));
    if (manifest.schema !== currentSchema || manifest.version !== currentVersion || manifest.name !== name)
        fail(`${name}/manifest.json has invalid current identity`);
    for (const required of [artifactRegistryDigest, operationMatrixDigest, currentRange])
        if (!JSON.stringify(manifest).includes(required))
            fail(`${name}/manifest.json missing ${required}`);
    assertMarkdownLinks(skillFile, text);
}
function assertV124McpToolMap() {
    const mapFile = join(root, "receiz-mcp-agent-skill", "resources", "v124-runtime-tool-map.json");
    assertPath(mapFile);
    if (!existsSync(mapFile)) return;
    const map = JSON.parse(read(mapFile));
    const expectedNames = v124McpToolContracts.map(([name]) => name);
    if (JSON.stringify(currentMcpV124Tools) !== JSON.stringify(expectedNames))
        fail("skills.json retained V124 MCP inventory mismatch");
    if (map.schema !== "receiz.ai-skills.v124-mcp-tool-map.v1")
        fail("v124 MCP tool map has invalid schema");
    if (map.authority?.mcpIsAuthority !== false
        || map.authority?.grantIsIdentityAuthority !== false
        || map.authority?.bearerIsIdentityAuthority !== false
        || map.authority?.strongerTruth !== "sealed-receiz-proof-object"
        || map.authority?.identityAuthority !== "receiz-identity-artifact"
        || map.authority?.databaseRole !== "sync-and-recovery-only")
        fail("v124 MCP tool map weakens the proof/identity authority hierarchy");
    for (const pinned of ["applicationId", "audience"])
        if (!map.runtimePinnedCoordinates?.includes(pinned)) fail(`v124 MCP tool map must runtime-pin ${pinned}`);
    for (const custodyRule of [
        "handleRef-is-process-local-and-non-authoritative",
        "sessionRef-is-local-or-trusted-host-persisted-and-non-authoritative",
        "trusted-host-persisted-session-is-reverified-by-the-canonical-sdk-server-path",
        "execute-and-cancel-require-custodied-handle-and-session",
        "refresh-rotates-and-close-consumes-session-custody",
        "replay-export-is-an-unsealed-non-authoritative-candidate",
        "replay-candidate-must-be-canonically-sealed-before-restore",
        "restore-accepts-only-sealedReplayProofObjectRef",
        "private-additions-remain-in-trusted-host-custody-behind-privateAdditionsRef",
        "private-additions-exact-result-is-never-returned-to-the-model",
        "source-carried-replay-exact-sources-stay-in-trusted-host-custody",
        "conversation-source-exact-sources-stay-in-trusted-host-custody",
        "conversation-epoch-secret-never-enters-model-output",
        "material-source-locators-and-bytes-stay-in-trusted-host-custody",
        "mcp-never-reconstructs-sdk-authority-from-json",
    ]) if (!map.custodyRules?.includes(custodyRule)) fail(`v124 MCP tool map missing custody rule ${custodyRule}`);
    if (!Array.isArray(map.tools) || map.tools.length !== v124McpToolContracts.length) {
        fail(`v124 MCP tool map must contain exactly ${v124McpToolContracts.length} tools`);
        return;
    }
    if (JSON.stringify(map.tools.map((tool) => tool.name)) !== JSON.stringify(currentMcpV124Tools))
        fail("v124 MCP tool map and skills.json current inventory mismatch");
    for (let index = 0; index < v124McpToolContracts.length; index += 1) {
        const [name, sdkMethod, scopeMode, fixedScopes] = v124McpToolContracts[index];
        const tool = map.tools[index];
        if (tool?.name !== name) fail(`v124 MCP tool map missing exact ordered tool ${name}`);
        if (tool?.sdkMethod !== sdkMethod) fail(`v124 MCP tool map has wrong SDK mapping for ${name}`);
        if (tool?.scopeMode !== scopeMode || JSON.stringify(tool?.fixedScopes) !== JSON.stringify(fixedScopes))
            fail(`v124 MCP tool map has wrong fixed scope contract for ${name}`);
        const conditionalScopes = v124McpConditionalScopeContracts[name] ?? [];
        if (JSON.stringify(tool?.conditionalScopes) !== JSON.stringify(conditionalScopes))
            fail(`v124 MCP tool map has wrong conditional scopes for ${name}`);
        const [inputRefs, outputRefs] = v124McpReferenceContracts[name];
        if (JSON.stringify(tool?.inputRefs) !== JSON.stringify(inputRefs))
            fail(`v124 MCP tool map has wrong input references for ${name}`);
        if (JSON.stringify(tool?.outputRefs) !== JSON.stringify(outputRefs))
            fail(`v124 MCP tool map has wrong output references for ${name}`);
        if (typeof tool?.custody !== "string" || tool.custody.length === 0)
            fail(`v124 MCP tool map missing custody boundary for ${name}`);
        if (typeof tool?.actionClass !== "string" || tool.actionClass.length === 0)
            fail(`v124 MCP tool map missing action class for ${name}`);
    }
}
function assertV125McpToolMap() {
    const mapFile = join(root, "receiz-mcp-agent-skill", "resources", "v125-economy-tool-map.json");
    assertPath(mapFile);
    if (!existsSync(mapFile)) return;
    const map = JSON.parse(read(mapFile));
    if (map.schema !== "receiz.mcp.v125-economy-tool-map.v1" || map.version !== currentVersion)
        fail("v125 MCP economy tool map has invalid current identity");
    if (map.transactionLocation !== "sender-and-receiver-edge"
        || map.serverRole !== "global-sync-only"
        || map.databaseRole !== "global-sync-only")
        fail("v125 MCP economy tool map weakens edge transaction authority");
    if (!Array.isArray(map.tools) || map.tools.length !== currentMcpV125Tools.length) {
        fail(`v125 MCP economy tool map must contain exactly ${currentMcpV125Tools.length} tools`);
        return;
    }
    if (JSON.stringify(map.tools.map((tool) => tool.name)) !== JSON.stringify(currentMcpV125Tools))
        fail("v125 MCP economy tool map and skills.json current inventory mismatch");
    for (const tool of map.tools) {
        if (typeof tool.sdkMethod !== "string" || tool.sdkMethod.length === 0)
            fail(`v125 MCP economy tool map missing canonical SDK method for ${tool.name}`);
        for (const field of ["scopes", "inputRefs", "outputRefs"])
            if (!Array.isArray(tool[field])) fail(`v125 MCP economy tool map missing ${field} for ${tool.name}`);
        if (typeof tool.custody !== "string" || tool.custody.length === 0)
            fail(`v125 MCP economy tool map missing custody boundary for ${tool.name}`);
    }
}
function assertCurrentManifest(name) {
    const manifestFile = join(root, name, "manifest.json");
    if (!existsSync(manifestFile))
        return;
    const manifest = JSON.parse(read(manifestFile));
    for (const tool of manifest.allowedTools ?? []) machineAllowedTools.add(tool);
    for (const operation of manifest.sdkOperations ?? []) machineSdkOperations.add(operation);
    for (const operation of manifest.historicalSdkOperations ?? []) machineHistoricalSdkOperations.add(operation);
    if (currentFocusedSkills.has(name)) {
        if (manifest.schema !== currentSchema || manifest.version !== currentVersion || manifest.name !== name)
            fail(`${name}/manifest.json has invalid focused current identity`);
        for (const field of ["laws", "sdkOperations", "allowedTools", "requiredScopes", "forbiddenOperations", "requiredEvidence"])
            if (!Array.isArray(manifest[field]) || manifest[field].length === 0) fail(`${name}/manifest.json missing ${field}`);
    }
    if (manifest.schema !== currentSchema || manifest.version !== currentVersion || manifest.name !== name)
        fail(`${name}/manifest.json is not current`);
    const requires = manifest.requires ?? {};
    if (requires.sdk !== currentRange || requires.mcp !== currentRange
        || requires.ruleset !== currentRulesetVersion || requires.registryDigest !== artifactRegistryDigest
        || requires.operationMatrixDigest !== operationMatrixDigest)
        fail(`${name}/manifest.json current source binding mismatch`);
    if (manifest.artifactLawVersion !== currentRulesetVersion)
        fail(`${name}/manifest.json current artifact law version mismatch`);
    if (JSON.stringify(manifest.operationAuthorityMatrix?.map((row) => row.operation)) !== JSON.stringify(artifactSdkOperations))
        fail(`${name}/manifest.json current operation matrix mismatch`);
    if (JSON.stringify(manifest.currentMcpArtifactTools) !== JSON.stringify(currentMcpArtifactTools))
        fail(`${name}/manifest.json current nine-tool MCP inventory mismatch`);
    if (JSON.stringify(manifest.currentMcpLivingSubjectTools) !== JSON.stringify(currentMcpLivingSubjectTools))
        fail(`${name}/manifest.json current living-subject MCP inventory mismatch`);
    if (JSON.stringify(manifest.currentMcpTools) !== JSON.stringify(currentMcpTools))
        fail(`${name}/manifest.json complete current MCP inventory mismatch`);
    if (JSON.stringify(manifest.currentMcpV122Tools) !== JSON.stringify(currentMcpV122Tools))
        fail(`${name}/manifest.json current V122 MCP inventory mismatch`);
    if (JSON.stringify(manifest.currentMcpV123Tools) !== JSON.stringify(currentMcpV123Tools))
        fail(`${name}/manifest.json current V123 MCP inventory mismatch`);
    if (JSON.stringify(manifest.currentMcpV124Tools) !== JSON.stringify(currentMcpV124Tools))
        fail(`${name}/manifest.json retained V124 MCP inventory mismatch`);
    if (JSON.stringify(manifest.currentMcpV125Tools) !== JSON.stringify(currentMcpV125Tools))
        fail(`${name}/manifest.json current V125 MCP inventory mismatch`);
    if (manifest.sdkClientCapabilityInventoryDigest !== sdkClientCapabilityInventoryDigest)
        fail(`${name}/manifest.json SDK client capability inventory digest mismatch`);
    if (JSON.stringify(manifest.temporalAuthority) !== JSON.stringify(expectedTemporalAuthority))
        fail(`${name}/manifest.json KKSv1.0 temporal authority mismatch`);
    if (JSON.stringify(manifest.localContinuityAuthority) !== JSON.stringify(expectedLocalContinuityAuthority))
        fail(`${name}/manifest.json local continuity authority mismatch`);
    if (JSON.stringify(manifest.authorityFlow) !== JSON.stringify(expectedAuthorityFlow))
        fail(`${name}/manifest.json forward-only authority flow mismatch`);
    const expectedCapabilityIds = name === "receiz-mcp-agent-skill"
        ? v124_1CapabilityInventory.filter((capability) => capability.mcpTools.length > 0).map((capability) => capability.id)
        : v124_1CapabilityInventory.filter((capability) => capability.aiSkills.includes(name)).map((capability) => capability.id);
    if (JSON.stringify(manifest.v124_1CapabilityIds) !== JSON.stringify(expectedCapabilityIds))
        fail(`${name}/manifest.json V124.1 capability binding mismatch`);
    const expectedV125CapabilityIds = v125CapabilityInventory
        .filter((capability) => capability.aiSkills.includes(name))
        .map((capability) => capability.id);
    if (JSON.stringify(manifest.v125CapabilityIds) !== JSON.stringify(expectedV125CapabilityIds))
        fail(`${name}/manifest.json V125 capability binding mismatch`);
    if (JSON.stringify(manifest.historicalV112McpArtifactTools) !== JSON.stringify(historicalV112McpArtifactTools))
        fail(`${name}/manifest.json historical v112 five-tool inventory mismatch`);
    for (const forbidden of currentForbiddenOperations)
        if (!manifest.forbiddenOperations?.includes(forbidden))
            fail(`${name}/manifest.json missing forbidden operation ${forbidden}`);
    for (const forbidden of requiredLocalContinuityForbiddenOperations)
        if (!manifest.forbiddenOperations?.includes(forbidden))
            fail(`${name}/manifest.json missing local continuity prohibition ${forbidden}`);
    for (const forbidden of requiredAuthorityFlowForbiddenOperations)
        if (!manifest.forbiddenOperations?.includes(forbidden))
            fail(`${name}/manifest.json missing authority-flow prohibition ${forbidden}`);
}
function assertLivingSubjectSkill(name) {
    const skillDir = join(root, name);
    const skillFile = join(skillDir, "SKILL.md");
    const manifestFile = join(skillDir, "manifest.json");
    for (const path of [skillFile, manifestFile, join(skillDir, "agents", "openai.yaml"), join(skillDir, "references", "sdk-map.md"), join(skillDir, "references", "mcp-map.md"), join(skillDir, "references", "examples.md"), join(skillDir, "tests", "contracts.json")])
        assertPath(path);
    if (!existsSync(skillFile) || !existsSync(manifestFile)) return;
    const text = read(skillFile);
    const manifest = JSON.parse(read(manifestFile));
    if (!new RegExp(`^---\\nname: ${name}\\ndescription: Use when `).test(text))
        fail(`${name}/SKILL.md has invalid discovery frontmatter`);
    for (const section of ["## Constitutional workflow", "## Machine contract", "## Quick reference", "## Common mistakes", "## Completion refusal", "## Authority rule"])
        if (!text.includes(section)) fail(`${name}/SKILL.md missing section ${section}`);
    if (manifest.schema !== currentSchema || manifest.name !== name || manifest.version !== currentVersion)
        fail(`${name}/manifest.json has invalid current identity`);
    for (const field of ["laws", "sdkOperations", "allowedTools", "requiredScopes", "emulatorFixtures", "forbiddenOperations", "requiredEvidence"])
        if (!Array.isArray(manifest[field]) || manifest[field].length === 0) fail(`${name}/manifest.json missing ${field}`);
    for (const required of ["model-output-as-world-event", "index-as-proof-authority", "latest-snapshot-wins", "failed-decision-with-writes"])
        if (!manifest.forbiddenOperations.includes(required)) fail(`${name}/manifest.json missing forbidden operation ${required}`);
    assertMarkdownLinks(skillFile, text);
}
assertPath(join(root, "README.md"));
assertPath(join(root, "SKILLS.md"));
assertPath(join(root, "skills.json"));
if (!Array.isArray(currentMcpTools) || currentMcpTools.length !== 221 || new Set(currentMcpTools).size !== 221)
    fail("skills.json must carry exactly 221 unique current MCP tools");
if (!Array.isArray(sdkClientCapabilityInventory) || sdkClientCapabilityInventory.length !== 421
    || new Set(sdkClientCapabilityInventory).size !== 421)
    fail("skills.json must carry exactly 421 unique public SDK client capabilities");
if (createHash("sha256").update(JSON.stringify(sdkClientCapabilityInventory)).digest("hex") !== sdkClientCapabilityInventoryDigest)
    fail("skills.json SDK client capability inventory digest mismatch");
const expectedHistoricalSdkClientCapabilities = [
    "artifacts.admitAndRecover",
    "artifacts.commitRecovery",
    "artifacts.planRecovery",
];
if (JSON.stringify(historicalSdkClientCapabilities) !== JSON.stringify(expectedHistoricalSdkClientCapabilities))
    fail("skills.json historical SDK client capability inventory mismatch");
const expectedV124_1CapabilityIds = [
    "source-carried-replay",
    "receiz-id-conversation",
    "held-material-reconstruction",
    "progressive-range-playback",
    "subject-memory-and-twin",
    "portable-account-continuity",
];
if (!Array.isArray(v124_1CapabilityInventory)
    || JSON.stringify(v124_1CapabilityInventory.map((capability) => capability.id)) !== JSON.stringify(expectedV124_1CapabilityIds))
    fail("skills.json must carry the exact six-family V124.1 capability inventory");
for (const capability of v124_1CapabilityInventory ?? []) {
    for (const field of ["sdkExports", "sdkClientMethods", "mcpTools", "aiSkills"])
        if (!Array.isArray(capability[field])) fail(`skills.json capability ${capability.id} missing ${field}`);
    if (typeof capability.primitive !== "string" || typeof capability.outcome !== "string" || typeof capability.authorityBoundary !== "string")
        fail(`skills.json capability ${capability.id} has incomplete authority contract`);
    for (const tool of capability.mcpTools ?? [])
        if (!currentMcpTools.includes(tool)) fail(`skills.json capability ${capability.id} references unknown MCP tool ${tool}`);
}
const expectedV125CapabilityIds = [
    "lawful-action-derived-settlement",
    "edge-settlement-and-reserve",
    "portable-attestation-and-credential",
    "presence-bound-selective-presentation",
    "proof-native-subject-coordination",
    "typed-external-execution",
];
if (!Array.isArray(v125CapabilityInventory)
    || JSON.stringify(v125CapabilityInventory.map((capability) => capability.id)) !== JSON.stringify(expectedV125CapabilityIds))
    fail("skills.json must carry the exact six-family V125 capability inventory");
for (const capability of v125CapabilityInventory ?? []) {
    for (const field of ["sdkExports", "sdkClientMethods", "mcpTools", "aiSkills"])
        if (!Array.isArray(capability[field]) || capability[field].length === 0)
            fail(`skills.json V125 capability ${capability.id} missing ${field}`);
    if (typeof capability.primitive !== "string" || typeof capability.outcome !== "string" || typeof capability.authorityBoundary !== "string")
        fail(`skills.json V125 capability ${capability.id} has incomplete authority contract`);
    for (const tool of capability.mcpTools)
        if (!currentMcpTools.includes(tool)) fail(`skills.json V125 capability ${capability.id} references unknown MCP tool ${tool}`);
}
for (const [label, inventory, exactLength] of [
    ["artifact", currentMcpArtifactTools, 9],
    ["living-subject", currentMcpLivingSubjectTools, 37],
    ["V122", currentMcpV122Tools, 19],
    ["V123", currentMcpV123Tools, 8],
    ["V124", currentMcpV124Tools, 26],
    ["V125", currentMcpV125Tools, 52],
    ["historical V112", historicalV112McpArtifactTools, 5],
]) {
    if (!Array.isArray(inventory) || inventory.length !== exactLength)
        fail(`skills.json ${label} MCP inventory must contain exactly ${exactLength} tools`);
    for (const tool of inventory ?? [])
        if (!currentMcpTools?.includes(tool)) fail(`skills.json ${label} MCP tool is not current: ${tool}`);
}
if (skillsIndex.skills?.length !== 43 || skillsIndex.skills?.filter((entry) => entry.manifest).length !== 37
    || skillsIndex.skills?.filter((entry) => entry.agent).length !== 34)
    fail("skills.json must preserve 43 skills, 37 manifests, and 34 OpenAI agent prompts");
if (JSON.stringify(skillsIndex.temporalAuthority) !== JSON.stringify(expectedTemporalAuthority))
    fail("skills.json must carry the exact KKSv1.0 temporal authority contract");
if (JSON.stringify(skillsIndex.localContinuityAuthority) !== JSON.stringify(expectedLocalContinuityAuthority))
    fail("skills.json must carry the exact local continuity authority contract");
if (JSON.stringify(skillsIndex.authorityFlow) !== JSON.stringify(expectedAuthorityFlow))
    fail("skills.json must carry the exact forward-only authority flow");
if (!existsSync(join(root, "resources", "kks-v1-temporal-authority.md")))
    fail("AI skills package is missing the KKSv1.0 developer authority resource");
if (!existsSync(join(root, "resources", "verified-owner-local-continuity.md")))
    fail("AI skills package is missing the verified-owner local continuity resource");
if (!existsSync(join(root, "resources", "forward-only-authority-flow.md")))
    fail("AI skills package is missing the forward-only authority-flow resource");
for (const skill of skills)
    assertSkill(skill);
for (const skill of constitutionalSkills)
    assertConstitutionalSkill(skill);
for (const skill of operationSkills)
    assertOperationSkill(skill);
for (const skill of artifactSkills)
    assertArtifactSkill(skill);
assertGlobalReconciliationSkill();
assertV124McpToolMap();
assertV125McpToolMap();
for (const skill of livingSubjectSkills)
    assertLivingSubjectSkill(skill);
for (const entry of skillsIndex.skills ?? [])
    assertCurrentManifest(entry.name);
for (const operation of sdkClientCapabilityInventory)
    if (!machineSdkOperations.has(operation) && !machineHistoricalSdkOperations.has(operation))
        fail(`AI manifests do not bind public SDK client capability ${operation}`);
for (const operation of historicalSdkClientCapabilities) {
    if (!machineHistoricalSdkOperations.has(operation)) fail(`AI manifests do not preserve historical SDK client capability ${operation}`);
    if (machineSdkOperations.has(operation)) fail(`AI manifests incorrectly mark historical SDK client capability current: ${operation}`);
}
for (const tool of machineAllowedTools)
    if (!currentMcpTools?.includes(tool)) fail(`AI manifest admits unknown MCP tool ${tool}`);
for (const tool of currentMcpTools)
    if (!machineAllowedTools.has(tool)) fail(`AI manifests do not bind current MCP tool ${tool}`);
for (const tool of requiredNewMachineAllowedTools)
    if (!machineAllowedTools.has(tool)) fail(`AI manifest machine allowances missing current MCP tool ${tool}`);
for (const tool of removedMachineTools)
    if (machineAllowedTools.has(tool)) fail(`AI manifest still admits removed MCP tool ${tool}`);
const sourceCarriedSkillText = [
    "receiz-architecture/SKILL.md",
    "receiz-event-derived-memory/SKILL.md",
    "receiz-causal-sync/SKILL.md",
    "receiz-portable-artifacts/SKILL.md",
    "receiz-proof-media/SKILL.md",
    "receiz-performance/SKILL.md",
].map((file) => read(join(root, file))).join("\n");
for (const law of [
    "enclosing-proof authority",
    "Receiz-ID participant binding",
    "no fixed total member or history cap",
    "epoch rotation on revoke",
    "bounded grant operations",
    "held-first reconstruction",
    "whole-artifact-required fallback",
    "no-fetch complete custody",
    "non-authoritative MCP projections",
]) if (!sourceCarriedSkillText.includes(law)) fail(`source-carried skills missing ${law}`);
for (const file of markdownFiles(root)) {
    const text = read(file);
    const rel = relative(process.cwd(), file);
    if (placeholderPattern.test(text))
        fail(`${rel} contains placeholder or fake API wording`);
    if (secretPattern.test(text))
        fail(`${rel} contains a secret token pattern`);
    if (envAssignmentPattern.test(text))
        fail(`${rel} contains an environment assignment`);
    if (liveVerificationPattern.test(text) && !mcpReferencePattern.test(text)) {
        fail(`${rel} claims live verification without an MCP/tool reference`);
    }
    assertMarkdownLinks(file, text);
}
if (failures.length > 0) {
    for (const failure of failures)
        console.error(`- ${failure}`);
    process.exit(1);
}
console.log(`ai-skills validation passed for ${skillsIndex.skills.length} skills.`);
