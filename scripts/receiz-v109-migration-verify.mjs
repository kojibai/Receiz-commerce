import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RECEIZ_SDK_VERSION = "109.0.0";
const RECEIZ_V109_REGISTRY_DIGEST = "17f76b37c9fcd46f710239b5c1660b03cc34ec64bed30d1cc45c18d5d40eab70";

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
  if (result.status !== 0) throw new Error(`receiz_v109_upgrade_inspection_failed:${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

const args = process.argv.slice(2);
const root = resolve(optionValue(args, "--root") ?? process.cwd());
const plan = inspectOfficialUpgrade(root);
const pkg = json(join(root, "package.json"));
const registry = json(join(root, "receiz.constitution.json"));
const attestation = json(join(root, "receiz.migration.v108-v109.json"));
const appRegistryDigest = createHash("sha256").update(canonicalize(registry)).digest("hex");
const packageNames = ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"];

const checks = [
  { id: "official-v109-upgrade-inspection", ok: plan.schema === "receiz.app.upgrade_plan.v1" && plan.targetVersion === RECEIZ_SDK_VERSION },
  { id: "integration-compliant", ok: plan.actions.length === 0 && plan.findings.every((finding) => finding.disposition === "satisfied") },
  { id: "packages-exact", ok: packageNames.every((name) => pkg.dependencies?.[name] === RECEIZ_SDK_VERSION) },
  { id: "registry-valid", ok: registry.schema === "receiz.constitution.registry.v1" && registry.version === RECEIZ_SDK_VERSION && Array.isArray(registry.laws) && registry.laws.length > 0 },
  { id: "registry-chains-canonical-v109", ok: registry.previousRegistryDigest === RECEIZ_V109_REGISTRY_DIGEST },
  { id: "local-verification-law", ok: registry.laws.some((law) => law.id === "ARTIFACT-011" && law.denial?.code === "LOCAL_ARTIFACT_VERIFICATION_MUST_NOT_REQUIRE_WEAKER_STATE") },
  { id: "app-registry-attested", ok: attestation.appRegistryDigest === appRegistryDigest },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false },
  { id: "complete-artifact-custody", ok: attestation.completeArtifactCustody === true },
  { id: "verify-before-extract", ok: attestation.verifyBeforeExtract === true },
  { id: "zero-network-local-verification", ok: attestation.localArtifactVerificationNetworkCalls === 0 },
  { id: "database-unchanged", ok: attestation.databaseChanged === false },
  { id: "cross-platform-continuity", ok: attestation.crossPlatformContinuity === true },
  { id: "obsolete-versioned-exports-disabled", ok: attestation.obsoleteVersionedDeveloperExports === false },
  { id: "stronger-truth-preserved", ok: attestation.strongerTruth === "sealed-receiz-proof-object" },
];

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v108-v109.migration-verification.v1",
  sdkVersion: RECEIZ_SDK_VERSION,
  mode: "audited-app-upgrade",
  canonicalRegistryDigest: RECEIZ_V109_REGISTRY_DIGEST,
  appRegistryDigest,
  actionsPending: plan.actions.length,
  historyRewritten: false,
  checks,
  authority: {
    verificationIsAdmission: false,
    strongerTruth: "sealed-receiz-proof-object",
    registryPayloadIsProofAuthority: false,
  },
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 2;
