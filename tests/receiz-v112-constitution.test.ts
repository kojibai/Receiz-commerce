import {
  RECEIZ_V112_REGISTRY_DIGEST,
  createReceizCausalRecord,
  digestReceizConstitution,
  evaluateReceizLawSet,
  validateReceizConstitutionRegistry,
  type ReceizConstitutionRegistry,
} from "@receiz/sdk";
import { RECEIZ_MCP_TOOLS, createReceizConstitutionalContext, scanReceizAuthorityBypass } from "@receiz/mcp-server";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  RECEIZ_APP_CONSTITUTION,
  checkpointReceizAppCausalHistory,
  createReceizAppCausalHistory,
  evaluateReceizAppLaws,
  verifyReceizAppConstitution,
  verifyReceizAppCausalCheckpoint,
} from "../src/lib/receiz/constitution";

const registry = JSON.parse(readFileSync("receiz.constitution.json", "utf8")) as ReceizConstitutionRegistry;

describe("Receiz v112 constitutional alignment", () => {
  it("pins the exact validated registry digest used by SDK, MCP, and the app", async () => {
    assert.equal(validateReceizConstitutionRegistry(registry).ok, true);
    const appRegistryDigest = await digestReceizConstitution(registry);
    assert.equal(registry.previousRegistryDigest, RECEIZ_V112_REGISTRY_DIGEST);
    const context = createReceizConstitutionalContext({
      registryDigest: RECEIZ_V112_REGISTRY_DIGEST,
      applicableLaws: registry.laws.map((law) => law.id),
      authorityBoundary: { profile: "global-shared", tenantRequired: true },
      stateMachine: { initial: "claimed", states: ["claimed", "admitted", "denied"], transitions: [{ command: "wilds.arena.sync", from: "claimed", to: "admitted" }] },
      allowedCommands: ["wilds.arena.sync"],
    });
    assert.equal(context.registryDigest, RECEIZ_V112_REGISTRY_DIGEST);
    assert.deepEqual(context.forbiddenMutations, ["direct-state-write", "history-rewrite", "authority-bypass"]);
    assert.deepEqual(await verifyReceizAppConstitution(), {
      ok: true,
      registryDigest: RECEIZ_V112_REGISTRY_DIGEST,
      appRegistryDigest,
      rulesetVersion: "112.0.0",
    });
    assert.equal(RECEIZ_APP_CONSTITUTION.version, "112.0.0");
  });

  it("enforces retirement, command-only mutation, and local verification through executable law", async () => {
    const retirement = await evaluateReceizLawSet({ registry, phase: "merge", budget: 1_000, context: { previous: { life: "dead" }, proposed: { life: "alive" }, mutation: { mode: "admitted-command" } } });
    assert.equal(retirement.allowed, false);
    assert.equal(retirement.denials.some((denial) => denial.code === "RETIREMENT_IS_FINAL"), true);
    const direct = await evaluateReceizLawSet({ registry, phase: "command", budget: 1_000, context: { tenant: { id: "tenant-1" }, mutation: { mode: "direct-write" } } });
    assert.equal(direct.allowed, false);
    assert.equal(direct.denials.some((denial) => denial.code === "DIRECT_STATE_WRITE_FORBIDDEN"), true);
    const appDecision = await evaluateReceizAppLaws({ phase: "command", context: { mutation: { mode: "direct-write" } } });
    assert.equal(appDecision.allowed, false);
    const networkDependentVerification = await evaluateReceizAppLaws({ phase: "command", context: { operation: { kind: "sdk-artifact-verify-or-open", requiresWeakerState: true } } });
    assert.equal(networkDependentVerification.allowed, false);
    assert.equal(networkDependentVerification.denials.some((denial) => denial.code === "LOCAL_ARTIFACT_VERIFICATION_MUST_NOT_REQUIRE_WEAKER_STATE"), true);

    const preclassified = await evaluateReceizAppLaws({ phase: "admission", context: { operation: { kind: "artifact-admit" }, evidence: { completeArtifactBytesVerified: false }, proposed: { payloadClassifiedBeforeArtifactVerification: true } } });
    assert.equal(preclassified.denials.some((denial) => denial.code === "COMPLETE_ARTIFACT_ADMISSION_REQUIRED"), true);
    const bearerEscalation = await evaluateReceizAppLaws({ phase: "admission", context: { admission: { verdict: "bearer-recovery" }, proposed: { canSign: true } } });
    assert.equal(bearerEscalation.denials.some((denial) => denial.code === "BEARER_AUTHORITY_ESCALATION_FORBIDDEN"), true);
    const unsafeCommit = await evaluateReceizAppLaws({ phase: "command", context: { operation: { kind: "artifact-recovery-commit" }, evidence: { sdkIssuedPlan: false, verifiedCapability: false, stableIdempotencyKey: false }, proposed: { atomicUnitOfWork: false } } });
    assert.equal(unsafeCommit.denials.some((denial) => denial.code === "ATOMIC_CAPABILITY_RECOVERY_COMMIT_REQUIRED"), true);
    const authoritativeExplanation = await evaluateReceizAppLaws({ phase: "merge", context: { proposed: { explanationIsProofAuthority: true } } });
    assert.equal(authoritativeExplanation.denials.some((denial) => denial.code === "PROOF_EXPLANATION_NOT_AUTHORITY"), true);

    const structuralAuthority = await evaluateReceizAppLaws({ phase: "admission", context: { operation: { kind: "artifact-recovery" }, evidence: { admissionDerivedFromCanonicalExactByteVerification: false, admissionBasisIndependentlyRecomputed: false }, proposed: { structuralObjectCreatesAuthority: true } } });
    assert.equal(structuralAuthority.denials.some((denial) => denial.code === "STRUCTURAL_ADMISSION_AUTHORITY_FORBIDDEN"), true);
    const unverifiedHistory = await evaluateReceizAppLaws({ phase: "merge", context: { operation: { kind: "artifact-recovery" }, evidence: { everyRecoveryHistoryNodeHasIndependentStrongerEvidenceRoot: false }, proposed: { callerNormalizedHistoryCreatesAuthority: true, divergentVerifiedHeadsResolvedByPreference: true } } });
    assert.equal(unverifiedHistory.denials.some((denial) => denial.code === "VERIFIED_HISTORY_EVIDENCE_REQUIRED"), true);
    const incompleteIdentity = await evaluateReceizAppLaws({ phase: "admission", context: { evidence: { enclosingOwnerMatchesIdentityOwner: true, keyIdentityVerified: false, domainSeparatedPrivateKeyChallengeVerified: false }, proposed: { verdict: "canonical-identity" } } });
    assert.equal(incompleteIdentity.denials.some((denial) => denial.code === "COMPLETE_CANONICAL_IDENTITY_BINDING_REQUIRED"), true);
    const staleAuthority = await evaluateReceizAppLaws({ phase: "command", context: { operation: { requestsCurrentAuthority: true }, evidence: { registryDigest: "stale" }, current: { registryDigest: RECEIZ_V112_REGISTRY_DIGEST } } });
    assert.equal(staleAuthority.denials.some((denial) => denial.code === "STALE_OPERATIONAL_RELEASE_AUTHORITY"), true);
    const reusedConfirmation = await evaluateReceizAppLaws({ phase: "command", context: { proposed: { mcpConfirmationReusedAfterCommit: true, mcpConfirmationReusedAfterFailure: false, planIdentityEqualsAttemptIdentity: false } } });
    assert.equal(reusedConfirmation.denials.some((denial) => denial.code === "FRESH_MCP_ATTEMPT_IDENTITY_REQUIRED"), true);

    const v112LawCodes = new Map(registry.laws.map((law) => [law.id, law.denial.code]));
    assert.deepEqual(
      Array.from({ length: 10 }, (_, index) => v112LawCodes.get(`ARTIFACT-${String(index + 21).padStart(3, "0")}`)),
      [
        "PROFILE_ADMISSION_IS_NOT_OPERATION_AUTHORITY",
        "TYPED_PORTABLE_TRANSITION_DIGEST_REQUIRED",
        "VERIFIED_ACTOR_PLAN_CAPABILITY_REQUIRED",
        "VERIFIED_TRANSITION_HISTORY_REQUIRED",
        "DURABLE_STAGING_AND_INDEPENDENT_RESOLUTION_REQUIRED",
        "NAMED_DOMAIN_ATOMIC_ACCEPTANCE_REQUIRED",
        "COMMIT_DOMAIN_MISMATCH",
        "IDEMPOTENCY_CONFLICT",
        "APPEND_RECEIPT_REPORT_ONLY",
        "FRESH_RUNTIME_CUSTODY_AND_PROCESS_READMISSION_REQUIRED",
      ],
    );
    const admissionAsAuthority = await evaluateReceizAppLaws({
      phase: "admission",
      context: {
        operation: { kind: "artifact.admit" },
        input: { profile: "document" },
        evidence: { admissionDerivedFromCanonicalExactByteVerification: true, admissionBasisIndependentlyRecomputed: true },
        proposed: { admissionGrantsOperationAuthority: true },
      },
    });
    assert.equal(admissionAsAuthority.denials.some((denial) => denial.code === "PROFILE_ADMISSION_IS_NOT_OPERATION_AUTHORITY"), true);
  });

  it("binds causal history and resumable checkpoints to the same v112 registry", async () => {
    const history = createReceizAppCausalHistory({ verifyAdmissionReceipt: () => false });
    assert.equal(history.registryDigest, RECEIZ_V112_REGISTRY_DIGEST);
    assert.deepEqual(history.records(), []);
    assert.deepEqual(history.heads(), []);
    assert.equal(await history.historyRoot(), await digestReceizConstitution({ schema: "receiz.causal.history-root.v1", registryDigest: RECEIZ_V112_REGISTRY_DIGEST, records: [], heads: [] }));
    const checkpoint = await checkpointReceizAppCausalHistory(history);
    const resumed = await verifyReceizAppCausalCheckpoint(checkpoint, history);
    assert.equal(resumed.ok, true);
    assert.equal((resumed as { checkpoint: { historyRoot: string } }).checkpoint.historyRoot, checkpoint.historyRoot);
    const record = await createReceizCausalRecord({
      registryDigest: RECEIZ_V112_REGISTRY_DIGEST,
      aggregateId: "card:living-1",
      kaiPulse: "1",
      parentDigests: [],
      receipt: { schema: "receiz.admission.receipt.v1", commandId: "unverified" },
      event: { type: "asset.alive", assetId: "living-1" },
    });
    await assert.rejects(history.import(record), /CAUSAL_ADMISSION_UNVERIFIED/);
  });

  it("ships all constitutional MCP operations and all machine-readable production skills", () => {
    const mcpTools = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
    for (const tool of ["receiz_architecture_inspect", "receiz_law_coverage", "receiz_command_simulate", "receiz_receipt_replay", "receiz_history_trace", "receiz_merge_simulate", "receiz_bypass_scan", "receiz_conformance_run", "receiz_release_verify", "receiz_mcp_execute_command", "receiz_artifact_verify", "receiz_artifact_admit", "receiz_artifact_append_plan", "receiz_artifact_transition_seal_and_stage", "receiz_artifact_transition_commit"]) assert.equal(mcpTools.has(tool), true, tool);
    for (const retiredTool of ["receiz_artifact_recovery_plan", "receiz_artifact_admit_and_recover", "receiz_artifact_recovery_commit"]) assert.equal(mcpTools.has(retiredTool), false, retiredTool);
    for (const skill of ["receiz-architecture", "receiz-authority-security", "receiz-build-production-system", "receiz-causal-sync", "receiz-command-builder", "receiz-constitutional-laws", "receiz-deterministic-replay", "receiz-domain-builder", "receiz-migrations", "receiz-observability", "receiz-offline-first", "receiz-performance", "receiz-portable-artifacts", "receiz-release", "receiz-testing"]) {
      assert.equal(existsSync(`node_modules/@receiz/ai-skills/${skill}/SKILL.md`), true);
      assert.equal(existsSync(`node_modules/@receiz/ai-skills/${skill}/manifest.json`), true);
    }
  });

  it("detects direct authority bypasses instead of normalizing them", () => {
    const result = scanReceizAuthorityBypass("state.ownerId = claimedOwner; history.splice(0, 1);");
    assert.equal(result.ok, false);
    assert.equal(result.findings.length > 0, true);
  });
});
