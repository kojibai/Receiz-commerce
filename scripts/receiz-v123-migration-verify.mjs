#!/usr/bin/env node
import {
  RECEIZ_CURRENT_REGISTRY_DIGEST,
  RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V123_REGISTRY_DIGEST,
  digestReceizConstitution,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import {
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX,
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
} from "@receiz/sdk/compiler";
import { RECEIZ_MCP_TOOLS, RECEIZ_V123_MCP_TOOL_NAMES } from "@receiz/mcp-server";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const EXPECTED_VERSION = "123.0.0";
const EXPECTED_APPLICATION_VERSION = "5.1.0";
const EXPECTED_REGISTRY = "945a581d1fc49c2dc18fbe8c129771ef464b8a58b96188bce561e88ae8b6ceeb";
const EXPECTED_MATRIX = "e08cec3e3ad22c20ddd6c08169ece19f094c366214d6d6b4dc432cd97558e2c5";
const EXPECTED_REDUCER = "5694662e2acc8b886ac9697ffad202b411d7e66c5f26f9106ee0768df7c7b8c8";
const EXPECTED_INTEGRITIES = Object.freeze({
  "@receiz/sdk": "sha512-GLpd6TpvDW8pbTWVNRu3TXYu2Dp93UaPKXwnHz/ZRtVexm6awThA31AQJLP/AhZgpqRJ7wM5f8LbmFk1oOQ45w==",
  "@receiz/mcp-server": "sha512-9VFgp2r0kjkX9/CZeng/HXoZQoVOYjVZ69C16IgcUR1CjOLB1QdNGz9GT5erTLIqtAAIz97mNJnM+9026Q/VPQ==",
  "@receiz/ai-skills": "sha512-3mRPoSnp5AWy2WWY/BpNFzQ8yruJPZiCTNFF2R9G3MJ5x8EMORlhrumUjMk7OnvhHRNHDSk+UB4wxepRSJCqXg==",
});

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
if (upgrade.status !== 0) throw new Error(`receiz_v123_upgrade_inspection_failed:${upgrade.stderr || upgrade.stdout}`);

const plan = JSON.parse(upgrade.stdout);
const pkg = json(join(root, "package.json"));
const registry = json(join(root, "receiz.constitution.json"));
const app = json(join(root, "receiz.app.json"));
const generated = json(join(root, "receiz.generated.json"));
const attestation = json(join(root, "receiz.migration.v122-v123.json"));
const skills = json(join(root, "ai-skills", "skills.json"));
const lock = readFileSync(join(root, "pnpm-lock.yaml"), "utf8");
const appRegistryDigest = await digestReceizConstitution(registry);
const packages = Object.keys(EXPECTED_INTEGRITIES);
const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
const checks = [
  { id: "official-v123-upgrade-inspection", ok: plan.schema === "receiz.app.upgrade_plan.v1" && plan.targetVersion === EXPECTED_VERSION },
  { id: "integration-compliant", ok: plan.actions.length === 0 && plan.findings.every((finding) => finding.disposition === "satisfied") },
  { id: "packages-exact", ok: packages.every((name) => pkg.dependencies?.[name] === EXPECTED_VERSION) },
  { id: "application-release", ok: pkg.version === EXPECTED_APPLICATION_VERSION && attestation.applicationReleaseVersion === EXPECTED_APPLICATION_VERSION },
  { id: "installed-identities", ok: RECEIZ_SDK_VERSION === EXPECTED_VERSION && RECEIZ_RULESET_VERSION === EXPECTED_VERSION },
  { id: "registry-valid", ok: validateReceizConstitutionRegistry(registry).ok && registry.version === EXPECTED_VERSION },
  { id: "registry-chains-v123", ok: registry.previousRegistryDigest === RECEIZ_V123_REGISTRY_DIGEST && RECEIZ_CURRENT_REGISTRY_DIGEST === EXPECTED_REGISTRY },
  { id: "operation-matrix-app", ok: app.operations?.length === 36 && JSON.stringify(app.operations) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX) },
  { id: "operation-matrix-generated", ok: generated.operationAuthorityMatrix?.length === 36 && JSON.stringify(generated.operationAuthorityMatrix) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX) },
  { id: "operation-matrix-digest", ok: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST === EXPECTED_MATRIX && attestation.operationMatrixDigest === EXPECTED_MATRIX },
  { id: "app-registry-attested", ok: attestation.appRegistryDigest === appRegistryDigest },
  { id: "v123-mcp-inventory", ok: RECEIZ_MCP_TOOLS.length === 141 && RECEIZ_V123_MCP_TOOL_NAMES.length === 8 && RECEIZ_V123_MCP_TOOL_NAMES.every((name) => toolNames.has(name)) },
  { id: "v123-ai-skills", ok: skills.version === EXPECTED_VERSION && skills.counts?.skills === 42 && skills.counts?.manifests === 36 && skills.counts?.openaiAgentPrompts === 33 && skills.registryDigest === EXPECTED_REGISTRY && skills.operationMatrixDigest === EXPECTED_MATRIX },
  { id: "package-integrities", ok: Object.entries(EXPECTED_INTEGRITIES).every(([name, integrity]) => attestation.publicPackageIntegrities?.[name] === integrity && lock.includes(`integrity: ${integrity}`)) },
  { id: "upgrade-plan-zero-actions", ok: attestation.officialUpgradePlanActions === 0 && attestation.officialUpgradeInspectionSatisfied === true },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false && attestation.productionDataMigrated === false },
  { id: "authority-order", ok: attestation.strongerTruth === "sealed-receiz-proof-object" && attestation.representationCanOutrankSource === false && attestation.mcpAuthority === false && attestation.modelOutputIsAuthority === false },
  { id: "v123-edge-consent", ok: attestation.privateIdentityArtifactLeavesEdge === false && attestation.proofAuthorityBearerPersisted === false && attestation.explicitApplicationConsentRequired === true },
  { id: "v123-planning-and-value", ok: attestation.sdkOwnsGeneratedSecurityFields === true && attestation.exactIntentPersistedBeforeValueExecution === true && attestation.unknownOutcomeRequiresLookupBeforeRetry === true },
  { id: "v123-zero-write-and-value-law", ok: attestation.failedDecisionsWriteZero === true && attestation.settlementAndReserveRemainDistinct === true && attestation.usdIsMovedAuthority === false },
  { id: "living-subject-reducer", ok: RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST === EXPECTED_REDUCER && attestation.livingSubjectReducerDigest === EXPECTED_REDUCER },
];

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v122-v123.migration-verification.v1",
  sdkVersion: RECEIZ_SDK_VERSION,
  canonicalRegistryDigest: EXPECTED_REGISTRY,
  operationMatrixDigest: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
  appRegistryDigest,
  mcpV123Tools: RECEIZ_V123_MCP_TOOL_NAMES.length,
  aiSkills: skills.counts?.skills,
  actionsPending: plan.actions.length,
  historyRewritten: false,
  checks,
  authority: { mcpAuthority: false, representationCanOutrankSource: false, strongerTruth: "sealed-receiz-proof-object" },
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 2;
