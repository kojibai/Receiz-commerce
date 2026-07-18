import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RECEIZ_SDK_VERSION = "110.0.0";
const RECEIZ_V110_REGISTRY_DIGEST = "824aa4af849c4840ba94535798eab36e45d514703b6ae0cd30d4aa53f3c896e4";

function canonicalize(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

function optionValue(args, option) {
  const index = args.indexOf(option);
  return index === -1 ? undefined : args[index + 1];
}

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function inspectOfficialUpgrade(root) {
  const cli = resolve(root, "node_modules", "@receiz", "sdk", "dist", "cli.js");
  if (!existsSync(cli)) throw new Error("receiz_cli_binary_missing");
  const result = spawnSync(process.execPath, [cli, "app", "upgrade", "--root", root, "--target", RECEIZ_SDK_VERSION, "--json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`receiz_v110_upgrade_inspection_failed:${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

const args = process.argv.slice(2);
const root = resolve(optionValue(args, "--root") ?? process.cwd());
const plan = inspectOfficialUpgrade(root);
const pkg = json(join(root, "package.json"));
const registry = json(join(root, "receiz.constitution.json"));
const attestation = json(join(root, "receiz.migration.v109-v110.json"));
const appRegistryDigest = createHash("sha256").update(canonicalize(registry)).digest("hex");
const packageNames = ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"];

const checks = [
  { id: "official-v110-upgrade-inspection", ok: plan.schema === "receiz.app.upgrade_plan.v1" && plan.targetVersion === RECEIZ_SDK_VERSION },
  { id: "integration-compliant", ok: plan.actions.length === 0 && plan.findings.every((finding) => finding.disposition === "satisfied") },
  { id: "packages-exact", ok: packageNames.every((name) => pkg.dependencies?.[name] === RECEIZ_SDK_VERSION) },
  { id: "registry-valid", ok: registry.schema === "receiz.constitution.registry.v1" && registry.version === RECEIZ_SDK_VERSION && Array.isArray(registry.laws) && registry.laws.length > 0 },
  { id: "registry-chains-canonical-v110", ok: registry.previousRegistryDigest === RECEIZ_V110_REGISTRY_DIGEST },
  { id: "unified-artifact-admission-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-012" && law.denial?.code === "COMPLETE_ARTIFACT_ADMISSION_REQUIRED") },
  { id: "bearer-authority-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-013" && law.denial?.code === "BEARER_AUTHORITY_ESCALATION_FORBIDDEN") },
  { id: "atomic-recovery-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-014" && law.denial?.code === "ATOMIC_CAPABILITY_RECOVERY_COMMIT_REQUIRED") },
  { id: "explanation-authority-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-015" && law.denial?.code === "PROOF_EXPLANATION_NOT_AUTHORITY") },
  { id: "app-registry-attested", ok: attestation.appRegistryDigest === appRegistryDigest },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false },
  { id: "unified-artifact-admission", ok: attestation.unifiedArtifactAdmission === true },
  { id: "verify-before-classification", ok: attestation.completeArtifactVerifiedBeforeClassification === true },
  { id: "bearer-authority-not-escalated", ok: attestation.bearerAuthorityEscalationAllowed === false },
  { id: "recovery-plan-not-authority", ok: attestation.recoveryPlanIsProofAuthority === false },
  { id: "proof-explanation-not-authority", ok: attestation.proofExplanationIsProofAuthority === false },
  { id: "recovery-capability-required", ok: attestation.recoveryCommitRequiresVerifiedCapability === true },
  { id: "recovery-idempotency-required", ok: attestation.recoveryCommitRequiresStableIdempotencyKey === true },
  { id: "recovery-atomic", ok: attestation.recoveryCommitAtomic === true },
  { id: "zero-network-local-verification", ok: attestation.localArtifactVerificationNetworkCalls === 0 },
  { id: "database-unchanged", ok: attestation.databaseChanged === false },
  { id: "stronger-truth-preserved", ok: attestation.strongerTruth === "sealed-receiz-proof-object" },
];

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v109-v110.migration-verification.v1",
  sdkVersion: RECEIZ_SDK_VERSION,
  mode: "audited-app-upgrade",
  canonicalRegistryDigest: RECEIZ_V110_REGISTRY_DIGEST,
  appRegistryDigest,
  actionsPending: plan.actions.length,
  historyRewritten: false,
  checks,
  authority: {
    recoveryPlanIsProofAuthority: false,
    proofExplanationIsProofAuthority: false,
    strongerTruth: "sealed-receiz-proof-object",
    registryPayloadIsProofAuthority: false,
  },
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 2;
