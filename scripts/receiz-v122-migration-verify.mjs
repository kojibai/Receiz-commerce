import {
  RECEIZ_GENERATED_V122_REGISTRY_DIGEST,
  RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V122_REGISTRY_DIGEST,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import {
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX,
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
} from "@receiz/sdk/compiler";
import { RECEIZ_MCP_TOOLS, RECEIZ_V122_MCP_TOOL_NAMES } from "@receiz/mcp-server";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const EXPECTED_VERSION = "122.0.0";
const EXPECTED_APPLICATION_VERSION = "5.0.0";
const EXPECTED_PREVIEW_DIGEST = "c3c537122ea5778355a3575e7665619caa0b39b9fac8707023a47902de40171c";
const EXPECTED_REGISTRY = "ed65956a16dd5f0d76d04db2f4a651fc43eb0a71cef64afd53576aa782dc9896";
const EXPECTED_MATRIX = "bd1d7ccf1543e2484df68e3025c7376f8ae37cafe1ca0d7c9cd9f52f6342b325";
const EXPECTED_REDUCER = "5694662e2acc8b886ac9697ffad202b411d7e66c5f26f9106ee0768df7c7b8c8";
const EXPECTED_INTEGRITIES = Object.freeze({
  "@receiz/sdk": "sha512-z29p3Q67L++p+gSClu+cz4m6Knf7e/Cl3vXzCE8LwK0/vm8Lx7hPWi1J7ZG2h7C43RetXzGYGjkkRC1tx/L+zQ==",
  "@receiz/mcp-server": "sha512-WwnrAJmL9eg6tzBDs7ZluIABt0IPeaLkDVsPT2SvMUvQIcMfkPFlX4T87fkqwDerXNnrW1VwVUMPHXoVW2DC5g==",
  "@receiz/ai-skills": "sha512-5s1exUwz8WLEu0nTS0wQ0d4iwoHgr4hs/QKreBldrEbpI7Ff1foZi977hNa/SQK7qcXXcts3ORaZoNQ1y0xI8Q==",
});

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
if (upgrade.status !== 0) throw new Error(`receiz_v122_upgrade_inspection_failed:${upgrade.stderr || upgrade.stdout}`);

const plan = JSON.parse(upgrade.stdout);
const pkg = json(join(root, "package.json"));
const registry = json(join(root, "receiz.constitution.json"));
const app = json(join(root, "receiz.app.json"));
const attestation = json(join(root, "receiz.migration.v121-v122.json"));
const skills = json(join(root, "ai-skills", "skills.json"));
const lock = readFileSync(join(root, "pnpm-lock.yaml"), "utf8");
const appRegistryDigest = createHash("sha256").update(canonicalize(registry)).digest("hex");
const packages = ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"];
const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
const checks = [
  { id: "official-v122-upgrade-inspection", ok: plan.schema === "receiz.app.upgrade_plan.v1" && plan.targetVersion === EXPECTED_VERSION },
  { id: "integration-compliant", ok: plan.actions.length === 0 && plan.findings.every((finding) => finding.disposition === "satisfied") },
  { id: "packages-exact", ok: packages.every((name) => pkg.dependencies?.[name] === EXPECTED_VERSION) },
  { id: "application-release", ok: pkg.version === EXPECTED_APPLICATION_VERSION && attestation.applicationReleaseVersion === EXPECTED_APPLICATION_VERSION },
  { id: "installed-identities", ok: RECEIZ_SDK_VERSION === EXPECTED_VERSION && RECEIZ_RULESET_VERSION === EXPECTED_VERSION },
  { id: "registry-valid", ok: validateReceizConstitutionRegistry(registry).ok && registry.version === EXPECTED_VERSION },
  { id: "registry-chains-v122", ok: registry.previousRegistryDigest === RECEIZ_V122_REGISTRY_DIGEST && RECEIZ_GENERATED_V122_REGISTRY_DIGEST === EXPECTED_REGISTRY },
  { id: "operation-matrix-complete", ok: app.operations?.length === 30 && JSON.stringify(app.operations) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX) },
  { id: "operation-matrix-digest", ok: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST === EXPECTED_MATRIX && attestation.operationMatrixDigest === EXPECTED_MATRIX },
  { id: "app-registry-attested", ok: attestation.appRegistryDigest === appRegistryDigest },
  { id: "v122-mcp-inventory", ok: RECEIZ_V122_MCP_TOOL_NAMES.length === 19 && RECEIZ_V122_MCP_TOOL_NAMES.every((name) => toolNames.has(name)) },
  { id: "v122-ai-skills", ok: skills.version === EXPECTED_VERSION && skills.counts?.skills === 40 && skills.registryDigest === EXPECTED_REGISTRY && skills.operationMatrixDigest === EXPECTED_MATRIX },
  { id: "package-integrities", ok: Object.entries(EXPECTED_INTEGRITIES).every(([name, integrity]) => attestation.publicPackageIntegrities?.[name] === integrity && lock.includes(`integrity: ${integrity}`)) },
  { id: "upgrade-plan-zero-actions", ok: attestation.upgradePlanActions === 0 },
  { id: "generator-preview-confirmed-and-corrected", ok: attestation.integrationPreviewChanges === 4 && attestation.integrationWritesPerformed === 4 && attestation.generatorPreviewConfirmed === true && attestation.generatorPreviewDigest === EXPECTED_PREVIEW_DIGEST && pkg.dependencies?.["@receiz/sdk"] === EXPECTED_VERSION && pkg.devDependencies?.["@receiz/mcp-server"] === undefined },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false && attestation.productionDataMigrated === false },
  { id: "authority-order", ok: attestation.strongerTruth === "sealed-receiz-proof-object" && attestation.representationCanOutrankSource === false && attestation.mcpAuthority === false && attestation.modelOutputIsAuthority === false },
  { id: "v122-zero-write-and-edge-law", ok: attestation.failedDecisionsWriteZero === true && attestation.privateWorldPlaintextLeavesEdge === false },
  { id: "v122-value-law", ok: attestation.settlementAndReserveRemainDistinct === true && attestation.usdIsMovedAuthority === false },
  { id: "living-subject-reducer", ok: RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST === EXPECTED_REDUCER && attestation.livingSubjectReducerDigest === EXPECTED_REDUCER },
];

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v121-v122.migration-verification.v1",
  sdkVersion: RECEIZ_SDK_VERSION,
  canonicalRegistryDigest: EXPECTED_REGISTRY,
  operationMatrixDigest: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
  appRegistryDigest,
  mcpV122Tools: RECEIZ_V122_MCP_TOOL_NAMES.length,
  aiSkills: skills.counts?.skills,
  actionsPending: plan.actions.length,
  historyRewritten: false,
  checks,
  authority: { mcpAuthority: false, receiptIsProofAuthority: false, strongerTruth: "sealed-receiz-proof-object" },
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 2;
