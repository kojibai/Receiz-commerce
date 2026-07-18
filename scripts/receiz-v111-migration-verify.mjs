import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RECEIZ_SDK_VERSION = "111.0.0";
const RECEIZ_V111_REGISTRY_DIGEST = "cf02d0bce6ad1541cfe84e27bfb1036777b29616bf8a1e5aeafb899a945e359a";

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
  if (result.status !== 0) throw new Error(`receiz_v111_upgrade_inspection_failed:${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

const args = process.argv.slice(2);
const root = resolve(optionValue(args, "--root") ?? process.cwd());
const plan = inspectOfficialUpgrade(root);
const pkg = json(join(root, "package.json"));
const registry = json(join(root, "receiz.constitution.json"));
const attestation = json(join(root, "receiz.migration.v110-v111.json"));
const appRegistryDigest = createHash("sha256").update(canonicalize(registry)).digest("hex");
const packageNames = ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"];

const checks = [
  { id: "official-v111-upgrade-inspection", ok: plan.schema === "receiz.app.upgrade_plan.v1" && plan.targetVersion === RECEIZ_SDK_VERSION },
  { id: "integration-compliant", ok: plan.actions.length === 0 && plan.findings.every((finding) => finding.disposition === "satisfied") },
  { id: "packages-exact", ok: packageNames.every((name) => pkg.dependencies?.[name] === RECEIZ_SDK_VERSION) },
  { id: "registry-valid", ok: registry.schema === "receiz.constitution.registry.v1" && registry.version === RECEIZ_SDK_VERSION && Array.isArray(registry.laws) && registry.laws.length > 0 },
  { id: "registry-chains-canonical-v111", ok: registry.previousRegistryDigest === RECEIZ_V111_REGISTRY_DIGEST },
  { id: "structural-authority-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-016" && law.denial?.code === "STRUCTURAL_ADMISSION_AUTHORITY_FORBIDDEN") },
  { id: "verified-history-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-017" && law.denial?.code === "VERIFIED_HISTORY_EVIDENCE_REQUIRED") },
  { id: "canonical-identity-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-018" && law.denial?.code === "COMPLETE_CANONICAL_IDENTITY_BINDING_REQUIRED") },
  { id: "current-registry-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-019" && law.denial?.code === "STALE_OPERATIONAL_RELEASE_AUTHORITY") },
  { id: "fresh-mcp-attempt-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-020" && law.denial?.code === "FRESH_MCP_ATTEMPT_IDENTITY_REQUIRED") },
  { id: "app-registry-attested", ok: attestation.appRegistryDigest === appRegistryDigest },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false },
  { id: "canonical-exact-byte-admission", ok: attestation.admissionDerivedFromCanonicalExactBytes === true },
  { id: "admission-basis-recomputed", ok: attestation.admissionBasisIndependentlyRecomputed === true },
  { id: "verified-history-evidence-roots", ok: attestation.recoveryHistoryRequiresIndependentEvidenceRoots === true },
  { id: "divergent-heads-fail-closed", ok: attestation.divergentVerifiedHeadsResolvedByPreference === false },
  { id: "canonical-identity-signing-challenge", ok: attestation.canonicalIdentityRequiresSigningChallenge === true },
  { id: "current-registry-required", ok: attestation.currentAuthorityRequiresCurrentRegistryDigest === true },
  { id: "plan-attempt-identity-distinct", ok: attestation.planIdentityDistinctFromAttemptIdentity === true },
  { id: "terminal-confirmation-not-reusable", ok: attestation.terminalMcpAttemptConfirmationReusable === false },
  { id: "recovery-plan-not-authority", ok: attestation.recoveryPlanIsProofAuthority === false },
  { id: "proof-explanation-not-authority", ok: attestation.proofExplanationIsProofAuthority === false },
  { id: "recovery-capability-required", ok: attestation.recoveryCommitRequiresVerifiedCapability === true },
  { id: "recovery-atomic", ok: attestation.recoveryCommitAtomic === true },
  { id: "zero-network-local-verification", ok: attestation.localArtifactVerificationNetworkCalls === 0 },
  { id: "database-unchanged", ok: attestation.databaseChanged === false },
  { id: "stronger-truth-preserved", ok: attestation.strongerTruth === "sealed-receiz-proof-object" },
];

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v110-v111.migration-verification.v1",
  sdkVersion: RECEIZ_SDK_VERSION,
  mode: "audited-app-upgrade",
  canonicalRegistryDigest: RECEIZ_V111_REGISTRY_DIGEST,
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
