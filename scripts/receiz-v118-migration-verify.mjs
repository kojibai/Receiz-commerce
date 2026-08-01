import {
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V118_REGISTRY_DIGEST,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import {
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX,
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
} from "@receiz/sdk/compiler";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const EXPECTED_VERSION = "118.0.0";
const EXPECTED_REGISTRY_DIGEST = "c284bd39a891c1a828b532523bd548507570819c32e307d79b8043f06d2d3360";
const EXPECTED_MATRIX_DIGEST = "153b2472830567ec3b445c2c1b4102e4c036ed4c45cc374d40d0079096a40f54";
const EXPECTED_PREVIEW_DIGEST = "a51de97f887b58eaf949623a4b3bb87a1b527922581cb57241e6f067b8d1feb3";

const canonicalize = (value) => {
  if (value === null || ["string", "boolean", "number"].includes(typeof value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
};
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const optionValue = (args, option) => {
  const index = args.indexOf(option);
  return index === -1 ? undefined : args[index + 1];
};

const root = resolve(optionValue(process.argv.slice(2), "--root") ?? process.cwd());
const cli = resolve(root, "node_modules", "@receiz", "sdk", "dist", "cli.js");
if (!existsSync(cli)) throw new Error("receiz_cli_binary_missing");
const upgrade = spawnSync(process.execPath, [cli, "app", "upgrade", "--root", root, "--target", EXPECTED_VERSION, "--json"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
if (upgrade.status !== 0) throw new Error(`receiz_v118_upgrade_inspection_failed:${upgrade.stderr || upgrade.stdout}`);

const plan = JSON.parse(upgrade.stdout);
const pkg = json(join(root, "package.json"));
const registry = json(join(root, "receiz.constitution.json"));
const app = json(join(root, "receiz.app.json"));
const attestation = json(join(root, "receiz.migration.v116-v118.json"));
const appRegistryDigest = createHash("sha256").update(canonicalize(registry)).digest("hex");
const packages = ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"];
const checks = [
  { id: "official-v118-upgrade-inspection", ok: plan.schema === "receiz.app.upgrade_plan.v1" && plan.targetVersion === EXPECTED_VERSION },
  { id: "integration-compliant", ok: plan.actions.length === 0 && plan.findings.every((finding) => finding.disposition === "satisfied") },
  { id: "packages-exact", ok: packages.every((name) => pkg.dependencies?.[name] === EXPECTED_VERSION) },
  { id: "installed-identities", ok: RECEIZ_SDK_VERSION === EXPECTED_VERSION && RECEIZ_RULESET_VERSION === EXPECTED_VERSION },
  { id: "registry-valid", ok: validateReceizConstitutionRegistry(registry).ok && registry.version === EXPECTED_VERSION },
  { id: "registry-chains-canonical-v118", ok: registry.previousRegistryDigest === RECEIZ_V118_REGISTRY_DIGEST && RECEIZ_V118_REGISTRY_DIGEST === EXPECTED_REGISTRY_DIGEST },
  { id: "operation-matrix-complete", ok: app.operations?.length === 16 && JSON.stringify(app.operations) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX) },
  { id: "operation-matrix-digest", ok: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST === EXPECTED_MATRIX_DIGEST && attestation.operationMatrixDigest === EXPECTED_MATRIX_DIGEST },
  { id: "app-registry-attested", ok: attestation.appRegistryDigest === appRegistryDigest },
  { id: "confirmed-preview-attested", ok: attestation.integrationPreviewDigest === EXPECTED_PREVIEW_DIGEST && attestation.integrationWritesPerformed === 6 },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false && attestation.productionDataMigrated === false },
  { id: "stronger-truth-preserved", ok: attestation.strongerTruth === "sealed-receiz-proof-object" && attestation.databaseManufacturesArtifactTruth === false },
  { id: "zero-network-local-verification", ok: attestation.localArtifactVerificationNetworkCalls === 0 },
];

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v116-v118.migration-verification.v1",
  sdkVersion: RECEIZ_SDK_VERSION,
  canonicalRegistryDigest: EXPECTED_REGISTRY_DIGEST,
  operationMatrixDigest: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
  appRegistryDigest,
  actionsPending: plan.actions.length,
  historyRewritten: false,
  checks,
  authority: {
    receiptIsProofAuthority: false,
    strongerTruth: "sealed-receiz-proof-object",
  },
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 2;
