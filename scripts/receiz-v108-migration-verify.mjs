import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RECEIZ_SDK_VERSION = "108.0.0";
const RECEIZ_V108_REGISTRY_DIGEST = "126ca9283fee4ef4c398dbcb958e861cbea191724fdab8eb08df55ff0c14bb79";

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
  const result = spawnSync(process.execPath, [cli, "app", "upgrade", "--root", root, "--json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`receiz_v108_upgrade_inspection_failed:${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

const args = process.argv.slice(2);
const root = resolve(optionValue(args, "--root") ?? process.cwd());
const plan = inspectOfficialUpgrade(root);
const pkg = json(join(root, "package.json"));
const registry = json(join(root, "receiz.constitution.json"));
const attestation = json(join(root, "receiz.migration.v107-v108.json"));
const appRegistryDigest = createHash("sha256").update(canonicalize(registry)).digest("hex");
const packageNames = ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"];

const checks = [
  { id: "official-v108-upgrade-inspection", ok: plan.schema === "receiz.app.upgrade_plan.v1" && plan.targetVersion === "108.0.0" },
  { id: "integration-compliant", ok: plan.actions.length === 0 && plan.findings.every((finding) => finding.disposition === "satisfied") },
  { id: "packages-exact", ok: packageNames.every((name) => pkg.dependencies?.[name] === "108.0.0") },
  { id: "registry-valid", ok: registry.schema === "receiz.constitution.registry.v1" && registry.version === "108.0.0" && Array.isArray(registry.laws) && registry.laws.length > 0 },
  { id: "registry-chains-canonical-v108", ok: registry.previousRegistryDigest === RECEIZ_V108_REGISTRY_DIGEST },
  { id: "app-registry-attested", ok: attestation.appRegistryDigest === appRegistryDigest },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false },
  { id: "complete-artifact-custody", ok: attestation.completeArtifactCustody === true },
  { id: "verify-before-extract", ok: attestation.verifyBeforeExtract === true },
  { id: "cross-platform-continuity", ok: attestation.crossPlatformContinuity === true },
  { id: "retired-v107-defaults-disabled", ok: attestation.legacyV107OperationsDefault === false },
  { id: "stronger-truth-preserved", ok: attestation.strongerTruth === "sealed-receiz-proof-object" },
];

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v107-v108.migration-verification.v1",
  sdkVersion: RECEIZ_SDK_VERSION,
  mode: "audited-app-upgrade",
  canonicalRegistryDigest: RECEIZ_V108_REGISTRY_DIGEST,
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
