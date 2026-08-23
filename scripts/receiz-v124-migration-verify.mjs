#!/usr/bin/env node
import {
  RECEIZ_CURRENT_REGISTRY_DIGEST,
  RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST,
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V124_REGISTRY_DIGEST,
  digestReceizConstitution,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import { RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX, RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST } from "@receiz/sdk/compiler";
import { RECEIZ_MCP_TOOLS, RECEIZ_V124_MCP_TOOL_NAMES } from "@receiz/mcp-server";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const PACKAGE_VERSION = "124.0.1";
const RULESET_VERSION = "124.0.0";
const APPLICATION_VERSION = "5.2.0";
const RANGE = ">=124.0.0 <125.0.0";
const REGISTRY = "d02429151b0bcebdaeb89485792e377afc55130f9a25e07982c1c88221314247";
const MATRIX = "540d1c1bf39f1b288b257c79a6e020bdcc5e587fc9b7dbf6b7aaa5d082e20ad5";
const APP_REGISTRY = "f8f76ecf9b7c7803cbd2a18a4b97a5ba406bfb217a80d76d311167f70ee5e5f9";
const INTEGRITIES = Object.freeze({
  "@receiz/sdk": "sha512-Q6C/R2fMSisQsdWLiaYp98kk1iEthFYtx2WMYrspz7xwq0EP5LLE26NvTW6ddsNKdP3AUcTrmkWDDKCac1NCgQ==",
  "@receiz/mcp-server": "sha512-BG+U6gZw+Mnz9ClRez36524uXfzYEs6LSLVJgB9vDRTx51VkyCmgJB1E4mpuzcdG34dZUuBRfJ3MncPP5jyt1w==",
  "@receiz/ai-skills": "sha512-CCEaO/tmxCt7rpQbwoHI77BiA1PS9ca7q/vgn27/M+PiXC0aUE7z3OYaGsHIVU9gZamxBgi9xF7CU8DYnYWBGQ==",
});

const optionValue = (args, option) => { const index = args.indexOf(option); return index === -1 ? undefined : args[index + 1]; };
const root = resolve(optionValue(process.argv.slice(2), "--root") ?? process.cwd());
const json = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const filesUnder = (directory, prefix = "") => readdirSync(directory).flatMap((name) => {
  if (name === "package.json") return [];
  const path = join(directory, name);
  const relative = prefix ? `${prefix}/${name}` : name;
  return statSync(path).isDirectory() ? filesUnder(path, relative) : [{ path, relative }];
});
const treeDigest = (directory) => {
  const hash = createHash("sha256");
  for (const file of filesUnder(directory).sort((a, b) => a.relative.localeCompare(b.relative))) hash.update(file.relative).update("\0").update(readFileSync(file.path)).update("\0");
  return hash.digest("hex");
};

const cli = resolve(root, "node_modules", "@receiz", "sdk", "dist", "cli.js");
if (!existsSync(cli)) throw new Error("receiz_cli_binary_missing");
const upgrade = spawnSync(process.execPath, [cli, "app", "upgrade", "--root", root, "--target", PACKAGE_VERSION, "--json"], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
if (upgrade.status !== 0) throw new Error(`receiz_v124_upgrade_inspection_failed:${upgrade.stderr || upgrade.stdout}`);

const plan = JSON.parse(upgrade.stdout);
const productionActions = plan.actions.filter((action) => !action.path?.startsWith(".test-build/"));
const pkg = json("package.json");
const registry = json("receiz.constitution.json");
const app = json("receiz.app.json");
const generated = json("receiz.generated.json");
const attestation = json("receiz.migration.v123-v124.json");
const skills = json("ai-skills/skills.json");
const lockfile = readFileSync(join(root, "pnpm-lock.yaml"), "utf8");
const appRegistryDigest = await digestReceizConstitution(registry);
const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
const checks = [
  { id: "official-v124-upgrade-inspection", ok: plan.targetVersion === PACKAGE_VERSION && productionActions.length === 0 },
  { id: "packages-exact", ok: Object.keys(INTEGRITIES).every((name) => pkg.dependencies?.[name] === PACKAGE_VERSION) },
  { id: "package-release-ruleset-distinct", ok: RECEIZ_SDK_VERSION === PACKAGE_VERSION && RECEIZ_RELEASE_VERSION === PACKAGE_VERSION && RECEIZ_RULESET_VERSION === RULESET_VERSION },
  { id: "application-release", ok: pkg.version === APPLICATION_VERSION && attestation.applicationReleaseVersion === APPLICATION_VERSION },
  { id: "registry", ok: validateReceizConstitutionRegistry(registry).ok && registry.version === RULESET_VERSION && registry.previousRegistryDigest === REGISTRY && RECEIZ_CURRENT_REGISTRY_DIGEST === REGISTRY && RECEIZ_V124_REGISTRY_DIGEST === REGISTRY },
  { id: "app-registry", ok: appRegistryDigest === APP_REGISTRY && attestation.appRegistryDigest === APP_REGISTRY },
  { id: "matrix", ok: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length === 53 && RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST === MATRIX && JSON.stringify(app.operations) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX) && JSON.stringify(generated.operationAuthorityMatrix) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX) },
  { id: "mcp", ok: RECEIZ_MCP_TOOLS.length === 163 && RECEIZ_V124_MCP_TOOL_NAMES.length === 22 && RECEIZ_V124_MCP_TOOL_NAMES.every((name) => toolNames.has(name)) },
  { id: "ai-skills", ok: skills.schema === "receiz.ai-skills-index.v124" && skills.version === PACKAGE_VERSION && skills.rulesetVersion === RULESET_VERSION && skills.registryDigest === REGISTRY && skills.operationMatrixDigest === MATRIX && skills.counts?.skills === 42 && skills.counts?.manifests === 36 && skills.counts?.openaiAgentPrompts === 33 },
  { id: "ai-tree-parity", ok: treeDigest(join(root, "ai-skills")) === treeDigest(join(root, "node_modules", "@receiz", "ai-skills")) },
  { id: "integrities", ok: Object.entries(INTEGRITIES).every(([name, integrity]) => attestation.publicPackageIntegrities?.[name] === integrity && lockfile.includes(`integrity: ${integrity}`)) },
  { id: "authority", ok: attestation.representationCanOutrankSource === false && attestation.jsonCanMintRuntimeCustody === false && attestation.mutationRequiresOperationalQualification === true && attestation.unknownOutcomeRequiresLookupBeforeRetry === true && attestation.exactPrivateAdditionsLeaveTrustedHost === false && attestation.sealedReplayProofObjectRequiredForRestore === true },
  { id: "history", ok: attestation.historyRewritten === false && attestation.productionDataMigrated === false },
  { id: "living-subject-reducer-retained", ok: attestation.livingSubjectReducerDigest === RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST },
  { id: "compatible-range", ok: generated.compatibleSdkRange === RANGE },
];

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v123-v124.migration-verification.v1",
  packageVersion: PACKAGE_VERSION,
  rulesetVersion: RULESET_VERSION,
  registryDigest: REGISTRY,
  operationMatrixDigest: MATRIX,
  appRegistryDigest,
  operations: 53,
  mcpTools: 163,
  v124McpTools: 22,
  aiSkills: 42,
  historyRewritten: false,
  checks,
  authority: { strongerTruth: "sealed-receiz-proof-object", representationCanOutrankSource: false, mcpAuthority: false },
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 2;
