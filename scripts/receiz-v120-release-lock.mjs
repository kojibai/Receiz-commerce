#!/usr/bin/env node
import {
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST,
  RECEIZ_V120_ARTIFACT_LAWS,
  RECEIZ_V120_REGISTRY_DIGEST,
  digestReceizConstitution,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import {
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX,
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
} from "@receiz/sdk/compiler";
import { runReceizConformance, runReceizLivingSubjectConformanceV120 } from "@receiz/sdk/testing";
import { RECEIZ_MCP_TOOLS, RECEIZ_V120_LIVING_SUBJECT_MCP_TOOL_NAMES } from "@receiz/mcp-server";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

const EXPECTED_VERSION = "120.0.0";
const EXPECTED_RANGE = ">=120.0.0 <121.0.0";
const EXPECTED_REGISTRY = "0728651789b26e1d10c1991ec1c06c1ea4a576f0c6520537b250b171f8857073";
const EXPECTED_MATRIX = "1c779ee5ade4b877ae9c6922ab02ba96fffffeb7580f1cf105a59fbb4424f351";
const EXPECTED_REDUCER = "5694662e2acc8b886ac9697ffad202b411d7e66c5f26f9106ee0768df7c7b8c8";
const EXPECTED_INTEGRITIES = {
  "@receiz/sdk": "sha512-pParTNrsm0ak9HIPfH/nnClJBC/88o2mb9s5SN6F7jiDuO2LnllR2llKqMPWtrXzVJOYqZ4WdPy3mmmg/aLEmA==",
  "@receiz/mcp-server": "sha512-8Wpkg+jAuzhetTnLzXkg5JE/wBbzwu8jOhAJtiDABM4GaeLNSZG65EKghJ2HYWJTd7MRU4bidz6NvLClch04ew==",
  "@receiz/ai-skills": "sha512-xGd6m9wnqHut/cjQP2/MMYc03JD2TrVAN1T5vqfXjd5ta+XfCW61eUhOQ5FmzmyzieSnrpQBCpvLlJlC30tQhA==",
};
const REQUIRED_MCP_TOOLS = [
  "receiz_artifact_verify",
  "receiz_artifact_admit",
  "receiz_artifact_append_plan",
  "receiz_artifact_transition_seal_and_stage",
  "receiz_artifact_transition_commit",
  "receiz_artifact_global_resolve",
  "receiz_artifact_reconcile_plan",
  "receiz_artifact_reconcile_stage",
  "receiz_artifact_reconcile_commit",
];

const checks = [];
const check = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const filesUnder = (root, prefix = "") => readdirSync(root).flatMap((name) => {
  if (name === "package.json") return [];
  const path = `${root}/${name}`;
  const relative = prefix ? `${prefix}/${name}` : name;
  return statSync(path).isDirectory() ? filesUnder(path, relative) : [{ path, relative }];
});
const treeDigest = (root) => {
  const hash = createHash("sha256");
  for (const file of filesUnder(root).sort((left, right) => left.relative.localeCompare(right.relative))) {
    hash.update(file.relative);
    hash.update("\0");
    hash.update(readFileSync(file.path));
    hash.update("\0");
  }
  return hash.digest("hex");
};

const pkg = json("package.json");
const lockfile = readFileSync("pnpm-lock.yaml", "utf8");
for (const name of Object.keys(EXPECTED_INTEGRITIES)) {
  check(`package:${name}`, pkg.dependencies?.[name] === EXPECTED_VERSION, pkg.dependencies?.[name]);
  check(`override:${name}:absent`, pkg.pnpm?.overrides?.[name] === undefined, pkg.pnpm?.overrides?.[name] ?? "absent");
  check(`integrity:${name}`, lockfile.includes(EXPECTED_INTEGRITIES[name]), EXPECTED_INTEGRITIES[name]);
}
check("identity:sdk", RECEIZ_SDK_VERSION === EXPECTED_VERSION, RECEIZ_SDK_VERSION);
check("identity:release", RECEIZ_RELEASE_VERSION === EXPECTED_VERSION, RECEIZ_RELEASE_VERSION);
check("identity:ruleset", RECEIZ_RULESET_VERSION === EXPECTED_VERSION, RECEIZ_RULESET_VERSION);

const registry = json("receiz.constitution.json");
const registryValidation = validateReceizConstitutionRegistry(registry);
const appRegistryDigest = await digestReceizConstitution(registry);
check("registry:valid", registryValidation.ok, registryValidation.ok ? "valid" : registryValidation.issues.join(","));
check("registry:canonical-v120-chain", registry.previousRegistryDigest === RECEIZ_V120_REGISTRY_DIGEST && RECEIZ_V120_REGISTRY_DIGEST === EXPECTED_REGISTRY, registry.previousRegistryDigest);
check("registry:artifact-laws", RECEIZ_V120_ARTIFACT_LAWS.length === 61 && RECEIZ_V120_ARTIFACT_LAWS.includes("receiz.subject.performance-noncanonical.v120"), String(RECEIZ_V120_ARTIFACT_LAWS.length));
check("living-subject:reducer", RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST === EXPECTED_REDUCER, RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST);
check("operation-matrix:count", RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length === 30, String(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length));
check("operation-matrix:digest", RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST === EXPECTED_MATRIX, RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST);

const app = json("receiz.app.json");
check("operation-matrix:app-parity", JSON.stringify(app.operations) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX), String(app.operations?.length));
const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
for (const name of REQUIRED_MCP_TOOLS) check(`mcp:${name}`, toolNames.has(name), name);
check("mcp:living-subject-count", RECEIZ_V120_LIVING_SUBJECT_MCP_TOOL_NAMES.length === 37, String(RECEIZ_V120_LIVING_SUBJECT_MCP_TOOL_NAMES.length));
for (const name of RECEIZ_V120_LIVING_SUBJECT_MCP_TOOL_NAMES) check(`mcp:${name}`, toolNames.has(name), name);

const skillsIndex = json("ai-skills/skills.json");
check("skills:index", skillsIndex.schema === "receiz.ai-skills-index.v120" && skillsIndex.version === EXPECTED_VERSION, `${skillsIndex.schema}:${skillsIndex.version}`);
check("skills:counts", skillsIndex.counts?.skills === 39 && skillsIndex.counts?.manifests === 33 && skillsIndex.counts?.openaiAgentPrompts === 30, JSON.stringify(skillsIndex.counts));
check("skills:registry", skillsIndex.registryDigest === EXPECTED_REGISTRY, skillsIndex.registryDigest);
check("skills:matrix", skillsIndex.operationMatrixDigest === EXPECTED_MATRIX, skillsIndex.operationMatrixDigest);
check("skills:tree-parity", treeDigest("ai-skills") === treeDigest("node_modules/@receiz/ai-skills"), `${treeDigest("ai-skills")}:${treeDigest("node_modules/@receiz/ai-skills")}`);
for (const entry of skillsIndex.skills ?? []) {
  if (!entry.manifest) continue;
  const manifest = json(`ai-skills/${entry.manifest}`);
  check(`skill:${entry.name}`, manifest.schema === "receiz.ai-skill-contract.v120"
    && manifest.version === EXPECTED_VERSION
    && manifest.requires?.sdk === EXPECTED_RANGE
    && manifest.requires?.mcp === EXPECTED_RANGE
    && manifest.requires?.registryDigest === EXPECTED_REGISTRY
    && manifest.requires?.operationMatrixDigest === EXPECTED_MATRIX, manifest.version);
}

const attestation = json("receiz.migration.v119-v120.json");
check("migration:attestation", attestation.targetVersion === EXPECTED_VERSION && attestation.historyRewritten === false, attestation.schema);
check("migration:registry", attestation.canonicalRegistryDigest === EXPECTED_REGISTRY && attestation.appRegistryDigest === appRegistryDigest, attestation.appRegistryDigest);
check("migration:upgrade-zero-actions", attestation.upgradePlanActions === 0, String(attestation.upgradePlanActions));
check("migration:confirmed-preview", attestation.integrationPreviewChanges === 5 && attestation.integrationWritesPerformed === 5 && attestation.integrationPreviewDigest === "bd7c4d1e88c8c5f11a8d6c627ba2279e68690798a8a9ce704c5435a0e0fc0c4c", `${attestation.integrationPreviewChanges}:${attestation.integrationWritesPerformed}:${attestation.integrationPreviewDigest}`);
for (const [name, integrity] of Object.entries(EXPECTED_INTEGRITIES)) {
  check(`migration:integrity:${name}`, attestation.publicPackageIntegrities?.[name] === integrity, attestation.publicPackageIntegrities?.[name]);
}
const auditPath = "docs/releases/2026-08-17-v120-living-subjects-release.md";
check("release:audit", existsSync(auditPath), auditPath);
if (existsSync(auditPath)) {
  const audit = readFileSync(auditPath, "utf8");
  for (const marker of [EXPECTED_VERSION, EXPECTED_REGISTRY, EXPECTED_MATRIX, appRegistryDigest, "Network calls during verification: `0`"]) {
    check(`release:audit:${marker.slice(0, 16)}`, audit.includes(marker), marker);
  }
}

const conformance = await runReceizConformance();
check("conformance", conformance.ok && conformance.summary.failed === 0 && conformance.summary.networkCalls === 0 && conformance.summary.dbCalls === 0, `${conformance.summary.passed} passed; ${conformance.summary.failed} failed; ${conformance.summary.networkCalls} network; ${conformance.summary.dbCalls} db`);
const livingConformance = await runReceizLivingSubjectConformanceV120();
check("living-subject:conformance", livingConformance.ok && livingConformance.summary.passed === 19 && livingConformance.summary.failed === 0 && livingConformance.summary.writesOnFailure === 0 && livingConformance.summary.networkCalls === 0 && livingConformance.summary.dbCalls === 0, `${livingConformance.summary.passed} passed; ${livingConformance.summary.failed} failed; ${livingConformance.summary.writesOnFailure} failed-decision writes`);
const ok = checks.every((item) => item.ok);
console.log(JSON.stringify({
  schema: "receiz.app.v120.release-lock.v1",
  ok,
  releaseVersion: RECEIZ_RELEASE_VERSION,
  registryDigest: RECEIZ_V120_REGISTRY_DIGEST,
  operationMatrixDigest: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
  livingSubjectReducerDigest: RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST,
  appRegistryDigest,
  checks,
  authority: {
    releaseLockIsAdmission: false,
    networkCallsDuringVerification: conformance.summary.networkCalls,
    livingSubjectConformanceIsProofAuthority: false,
    strongerTruth: "sealed-receiz-proof-object",
  },
}, null, 2));
if (!ok) process.exit(1);
