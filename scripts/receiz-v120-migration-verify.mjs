import {
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST,
  RECEIZ_V120_REGISTRY_DIGEST,
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

const EXPECTED_VERSION = "120.0.0";
const EXPECTED_REGISTRY_DIGEST = "0728651789b26e1d10c1991ec1c06c1ea4a576f0c6520537b250b171f8857073";
const EXPECTED_MATRIX_DIGEST = "1c779ee5ade4b877ae9c6922ab02ba96fffffeb7580f1cf105a59fbb4424f351";
const EXPECTED_REDUCER_DIGEST = "5694662e2acc8b886ac9697ffad202b411d7e66c5f26f9106ee0768df7c7b8c8";

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
if (upgrade.status !== 0) throw new Error(`receiz_v120_upgrade_inspection_failed:${upgrade.stderr || upgrade.stdout}`);

const plan = JSON.parse(upgrade.stdout);
const pkg = json(join(root, "package.json"));
const registry = json(join(root, "receiz.constitution.json"));
const app = json(join(root, "receiz.app.json"));
const attestation = json(join(root, "receiz.migration.v119-v120.json"));
const appRegistryDigest = createHash("sha256").update(canonicalize(registry)).digest("hex");
const packages = ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"];
const checks = [
  { id: "official-v120-upgrade-inspection", ok: plan.schema === "receiz.app.upgrade_plan.v1" && plan.targetVersion === EXPECTED_VERSION },
  { id: "integration-compliant", ok: plan.actions.length === 0 && plan.findings.every((finding) => finding.disposition === "satisfied") },
  { id: "packages-exact", ok: packages.every((name) => pkg.dependencies?.[name] === EXPECTED_VERSION) },
  { id: "installed-identities", ok: RECEIZ_SDK_VERSION === EXPECTED_VERSION && RECEIZ_RULESET_VERSION === EXPECTED_VERSION },
  { id: "registry-valid", ok: validateReceizConstitutionRegistry(registry).ok && registry.version === EXPECTED_VERSION },
  { id: "registry-chains-canonical-v120", ok: registry.previousRegistryDigest === RECEIZ_V120_REGISTRY_DIGEST && RECEIZ_V120_REGISTRY_DIGEST === EXPECTED_REGISTRY_DIGEST },
  { id: "operation-matrix-complete", ok: app.operations?.length === 30 && JSON.stringify(app.operations) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX) },
  { id: "operation-matrix-digest", ok: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST === EXPECTED_MATRIX_DIGEST && attestation.operationMatrixDigest === EXPECTED_MATRIX_DIGEST },
  { id: "app-registry-attested", ok: attestation.appRegistryDigest === appRegistryDigest },
  { id: "upgrade-plan-zero-actions", ok: attestation.upgradePlanActions === 0 },
  { id: "confirmed-integration-preview", ok: attestation.integrationPreviewChanges === 5 && attestation.integrationWritesPerformed === 5 && attestation.integrationPreviewDigest === "bd7c4d1e88c8c5f11a8d6c627ba2279e68690798a8a9ce704c5435a0e0fc0c4c" },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false && attestation.productionDataMigrated === false },
  { id: "stronger-truth-preserved", ok: attestation.strongerTruth === "sealed-receiz-proof-object" && attestation.databaseManufacturesArtifactTruth === false },
  { id: "recursive-continuity-preserved", ok: attestation.kaiSelectsCausalHead === true && attestation.merkleCommitsExactAppends === true && attestation.fibonacciProvidesSparseAncestry === true },
  { id: "living-subject-reducer", ok: RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST === EXPECTED_REDUCER_DIGEST && attestation.livingSubjectReducerDigest === EXPECTED_REDUCER_DIGEST },
  { id: "living-subject-authority", ok: attestation.modelOutputIsAuthority === false && attestation.failedDecisionsWriteZeroIncludingKai === true && attestation.multiSubjectEffectsAreAtomic === true },
  { id: "zero-network-local-verification", ok: attestation.localArtifactVerificationNetworkCalls === 0 },
];

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v119-v120.migration-verification.v1",
  sdkVersion: RECEIZ_SDK_VERSION,
  canonicalRegistryDigest: EXPECTED_REGISTRY_DIGEST,
  operationMatrixDigest: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
  livingSubjectReducerDigest: RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST,
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
