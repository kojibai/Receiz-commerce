import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RECEIZ_SDK_VERSION = "112.0.0";
const RECEIZ_V112_REGISTRY_DIGEST = "1356f8122d0b5fcbe891d7e6ed1e75faca827f15d63d1ed5d950664e11c146ee";

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
  if (result.status !== 0) throw new Error(`receiz_v112_upgrade_inspection_failed:${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

const args = process.argv.slice(2);
const root = resolve(optionValue(args, "--root") ?? process.cwd());
const plan = inspectOfficialUpgrade(root);
const pkg = json(join(root, "package.json"));
const registry = json(join(root, "receiz.constitution.json"));
const attestation = json(join(root, "receiz.migration.v111-v112.json"));
const appRegistryDigest = createHash("sha256").update(canonicalize(registry)).digest("hex");
const packageNames = ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"];

const checks = [
  { id: "official-v112-upgrade-inspection", ok: plan.schema === "receiz.app.upgrade_plan.v1" && plan.targetVersion === RECEIZ_SDK_VERSION },
  { id: "integration-compliant", ok: plan.actions.length === 0 && plan.findings.every((finding) => finding.disposition === "satisfied") },
  { id: "packages-exact", ok: packageNames.every((name) => pkg.dependencies?.[name] === RECEIZ_SDK_VERSION) },
  { id: "registry-valid", ok: registry.schema === "receiz.constitution.registry.v1" && registry.version === RECEIZ_SDK_VERSION && Array.isArray(registry.laws) && registry.laws.length > 0 },
  { id: "registry-chains-canonical-v112", ok: registry.previousRegistryDigest === RECEIZ_V112_REGISTRY_DIGEST },
  { id: "profile-admission-not-authority-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-021" && law.denial?.code === "PROFILE_ADMISSION_IS_NOT_OPERATION_AUTHORITY") },
  { id: "typed-transition-digest-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-022" && law.denial?.code === "TYPED_PORTABLE_TRANSITION_DIGEST_REQUIRED") },
  { id: "actor-plan-capability-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-023" && law.denial?.code === "VERIFIED_ACTOR_PLAN_CAPABILITY_REQUIRED") },
  { id: "transition-history-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-024" && law.denial?.code === "VERIFIED_TRANSITION_HISTORY_REQUIRED") },
  { id: "durable-staging-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-025" && law.denial?.code === "DURABLE_STAGING_AND_INDEPENDENT_RESOLUTION_REQUIRED") },
  { id: "atomic-domain-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-026" && law.denial?.code === "NAMED_DOMAIN_ATOMIC_ACCEPTANCE_REQUIRED") },
  { id: "commit-domain-mismatch-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-027" && law.denial?.code === "COMMIT_DOMAIN_MISMATCH") },
  { id: "idempotency-conflict-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-028" && law.denial?.code === "IDEMPOTENCY_CONFLICT") },
  { id: "report-only-receipt-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-029" && law.denial?.code === "APPEND_RECEIPT_REPORT_ONLY") },
  { id: "fresh-runtime-custody-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-030" && law.denial?.code === "FRESH_RUNTIME_CUSTODY_AND_PROCESS_READMISSION_REQUIRED") },
  { id: "app-registry-attested", ok: attestation.appRegistryDigest === appRegistryDigest },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false },
  { id: "operation-matrix-complete", ok: attestation.operationAuthorityMatrixComplete === true },
  { id: "admission-not-operation-authority", ok: attestation.admissionIsOperationAuthority === false },
  { id: "explicit-admission-profiles", ok: attestation.explicitAdmissionProfilesRequired === true },
  { id: "verified-actor-plan-capability", ok: attestation.verifiedActorPlanCapabilityRequired === true },
  { id: "transition-excludes-coordination", ok: attestation.transitionDigestIncludesCommitDomain === false && attestation.transitionDigestIncludesIdempotencyIdentity === false && attestation.transitionDigestIncludesExternalEffects === false },
  { id: "effects-derived-by-law", ok: attestation.externalEffectsDerivedByRegistryOperationLaw === true },
  { id: "verified-transition-history", ok: attestation.verifiedTransitionHistoryRequired === true },
  { id: "durable-independent-staging", ok: attestation.durableStagingRequired === true && attestation.stagedBytesIndependentlyResolvedAndReverified === true },
  { id: "named-domain-atomic-acceptance", ok: attestation.namedCommitDomainRequired === true && attestation.commitAcceptanceAtomic === true },
  { id: "domain-mismatch-distinct", ok: attestation.commitDomainMismatchDistinctFromIdempotencyConflict === true },
  { id: "receipt-report-only", ok: attestation.appendReceiptIsOperationAuthority === false },
  { id: "process-readmission", ok: attestation.processBoundaryRequiresExactByteReverification === true },
  { id: "browser-store-no-artifacts", ok: attestation.browserAdmissionStoreCarriesProofObjects === false && attestation.browserAdmissionStoreCarriesSealedArtifactBytes === false },
  { id: "unavailable-future-rails", ok: attestation.remoteAdmissionStoreAvailable === false && attestation.offlineReconciliationAvailable === false },
  { id: "zero-network-local-verification", ok: attestation.localArtifactVerificationNetworkCalls === 0 },
  { id: "database-unchanged", ok: attestation.databaseChanged === false },
  { id: "stronger-truth-preserved", ok: attestation.strongerTruth === "sealed-receiz-proof-object" },
];

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v111-v112.migration-verification.v1",
  sdkVersion: RECEIZ_SDK_VERSION,
  mode: "audited-app-upgrade",
  canonicalRegistryDigest: RECEIZ_V112_REGISTRY_DIGEST,
  appRegistryDigest,
  actionsPending: plan.actions.length,
  historyRewritten: false,
  checks,
  authority: {
    admissionIsOperationAuthority: false,
    appendReceiptIsOperationAuthority: false,
    strongerTruth: "sealed-receiz-proof-object",
    registryPayloadIsProofAuthority: false,
  },
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 2;
