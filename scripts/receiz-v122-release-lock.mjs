#!/usr/bin/env node
import {
  RECEIZ_GENERATED_V122_REGISTRY_DIGEST,
  RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST,
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V122_REGISTRY_DIGEST,
  digestReceizConstitution,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import {
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX,
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
} from "@receiz/sdk/compiler";
import { runReceizConformance, runReceizLivingSubjectConformanceV120 } from "@receiz/sdk/testing";
import {
  RECEIZ_MCP_TOOLS,
  RECEIZ_V120_LIVING_SUBJECT_MCP_TOOL_NAMES,
  RECEIZ_V122_MCP_TOOL_NAMES,
} from "@receiz/mcp-server";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { scanReceizV122Repository } from "./receiz-v122-authority-scan.mjs";

const EXPECTED_VERSION = "122.0.0";
const EXPECTED_APPLICATION_VERSION = "5.0.0";
const EXPECTED_RANGE = ">=122.0.0 <123.0.0";
const EXPECTED_REGISTRY = "ed65956a16dd5f0d76d04db2f4a651fc43eb0a71cef64afd53576aa782dc9896";
const EXPECTED_MATRIX = "bd1d7ccf1543e2484df68e3025c7376f8ae37cafe1ca0d7c9cd9f52f6342b325";
const EXPECTED_REDUCER = "5694662e2acc8b886ac9697ffad202b411d7e66c5f26f9106ee0768df7c7b8c8";
const EXPECTED_INTEGRITIES = Object.freeze({
  "@receiz/sdk": "sha512-z29p3Q67L++p+gSClu+cz4m6Knf7e/Cl3vXzCE8LwK0/vm8Lx7hPWi1J7ZG2h7C43RetXzGYGjkkRC1tx/L+zQ==",
  "@receiz/mcp-server": "sha512-WwnrAJmL9eg6tzBDs7ZluIABt0IPeaLkDVsPT2SvMUvQIcMfkPFlX4T87fkqwDerXNnrW1VwVUMPHXoVW2DC5g==",
  "@receiz/ai-skills": "sha512-5s1exUwz8WLEu0nTS0wQ0d4iwoHgr4hs/QKreBldrEbpI7Ff1foZi977hNa/SQK7qcXXcts3ORaZoNQ1y0xI8Q==",
});
const REQUIRED_ARTIFACT_TOOLS = Object.freeze([
  "receiz_artifact_verify",
  "receiz_artifact_admit",
  "receiz_artifact_append_plan",
  "receiz_artifact_transition_seal_and_stage",
  "receiz_artifact_transition_commit",
  "receiz_artifact_global_resolve",
  "receiz_artifact_reconcile_plan",
  "receiz_artifact_reconcile_stage",
  "receiz_artifact_reconcile_commit",
]);
const RELEASE_MARKERS = Object.freeze([
  EXPECTED_VERSION,
  EXPECTED_REGISTRY,
  EXPECTED_MATRIX,
  "Representation never outranks source",
  "Network calls during independent verification: `0`",
  "MCP authority: `false`",
  "Failed-decision writes: `0`",
  "Settlement and Reserve remain distinct",
]);

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
check("application:release", pkg.version === EXPECTED_APPLICATION_VERSION, pkg.version);
for (const [name, integrity] of Object.entries(EXPECTED_INTEGRITIES)) {
  check(`package:${name}`, pkg.dependencies?.[name] === EXPECTED_VERSION, pkg.dependencies?.[name]);
  check(`override:${name}:absent`, pkg.pnpm?.overrides?.[name] === undefined, pkg.pnpm?.overrides?.[name] ?? "absent");
  check(`integrity:${name}`, lockfile.includes(`integrity: ${integrity}`), integrity);
}
check("identity:sdk", RECEIZ_SDK_VERSION === EXPECTED_VERSION, RECEIZ_SDK_VERSION);
check("identity:release", RECEIZ_RELEASE_VERSION === EXPECTED_VERSION, RECEIZ_RELEASE_VERSION);
check("identity:ruleset", RECEIZ_RULESET_VERSION === EXPECTED_VERSION, RECEIZ_RULESET_VERSION);
check("identity:registry", RECEIZ_GENERATED_V122_REGISTRY_DIGEST === EXPECTED_REGISTRY && RECEIZ_V122_REGISTRY_DIGEST === EXPECTED_REGISTRY, RECEIZ_GENERATED_V122_REGISTRY_DIGEST);

const registry = json("receiz.constitution.json");
const registryValidation = validateReceizConstitutionRegistry(registry);
const appRegistryDigest = await digestReceizConstitution(registry);
check("registry:valid", registryValidation.ok, registryValidation.ok ? "valid" : registryValidation.issues.join(","));
check("registry:canonical-v122-chain", registry.version === EXPECTED_VERSION && registry.previousRegistryDigest === EXPECTED_REGISTRY, `${registry.version}:${registry.previousRegistryDigest}`);
check("registry:app-overlay", appRegistryDigest === "caa058755f8199b1132add02d2ea4452e86656709e20c40e4f6f89a22ae50122", appRegistryDigest);
check("living-subject:reducer", RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST === EXPECTED_REDUCER, RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST);
check("operation-matrix:count", RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length === 30, String(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length));
check("operation-matrix:digest", RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST === EXPECTED_MATRIX, RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST);

const app = json("receiz.app.json");
const generated = json("receiz.generated.json");
check("operation-matrix:app-parity", JSON.stringify(app.operations) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX), String(app.operations?.length));
check("operation-matrix:generated-parity", JSON.stringify(generated.operationAuthorityMatrix) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX), String(generated.operationAuthorityMatrix?.length));
const boundaries = readFileSync("receiz/receiz.boundaries.ts", "utf8");
check("operation-matrix:generated-boundary-range", boundaries.includes(EXPECTED_RANGE) && !boundaries.includes(">=121.0.0 <122.0.0"), EXPECTED_RANGE);

const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
check("mcp:total", RECEIZ_MCP_TOOLS.length === 133, String(RECEIZ_MCP_TOOLS.length));
check("mcp:artifact-count", REQUIRED_ARTIFACT_TOOLS.length === 9 && REQUIRED_ARTIFACT_TOOLS.every((name) => toolNames.has(name)), String(REQUIRED_ARTIFACT_TOOLS.length));
check("mcp:living-subject-count", RECEIZ_V120_LIVING_SUBJECT_MCP_TOOL_NAMES.length === 37 && RECEIZ_V120_LIVING_SUBJECT_MCP_TOOL_NAMES.every((name) => toolNames.has(name)), String(RECEIZ_V120_LIVING_SUBJECT_MCP_TOOL_NAMES.length));
check("mcp:v122-count", RECEIZ_V122_MCP_TOOL_NAMES.length === 19 && RECEIZ_V122_MCP_TOOL_NAMES.every((name) => toolNames.has(name)), String(RECEIZ_V122_MCP_TOOL_NAMES.length));

const skills = json("ai-skills/skills.json");
check("skills:index", skills.schema === "receiz.ai-skills-index.v122" && skills.version === EXPECTED_VERSION, `${skills.schema}:${skills.version}`);
check("skills:counts", skills.counts?.skills === 40 && skills.counts?.manifests === 34 && skills.counts?.openaiAgentPrompts === 31, JSON.stringify(skills.counts));
check("skills:registry-matrix", skills.registryDigest === EXPECTED_REGISTRY && skills.operationMatrixDigest === EXPECTED_MATRIX, `${skills.registryDigest}:${skills.operationMatrixDigest}`);
check("skills:tree-parity", treeDigest("ai-skills") === treeDigest("node_modules/@receiz/ai-skills"), `${treeDigest("ai-skills")}:${treeDigest("node_modules/@receiz/ai-skills")}`);
for (const entry of skills.skills ?? []) {
  if (!entry.manifest) continue;
  const manifest = json(`ai-skills/${entry.manifest}`);
  check(`skill:${entry.name}`, manifest.schema === "receiz.ai-skill-contract.v122"
    && manifest.version === EXPECTED_VERSION
    && manifest.requires?.sdk === EXPECTED_RANGE
    && manifest.requires?.mcp === EXPECTED_RANGE
    && manifest.requires?.registryDigest === EXPECTED_REGISTRY
    && manifest.requires?.operationMatrixDigest === EXPECTED_MATRIX, `${manifest.schema}:${manifest.version}`);
}

const attestation = json("receiz.migration.v121-v122.json");
check("migration:attestation", attestation.targetVersion === EXPECTED_VERSION && attestation.applicationReleaseVersion === EXPECTED_APPLICATION_VERSION && attestation.historyRewritten === false && attestation.productionDataMigrated === false, attestation.schema);
check("migration:confirmed-generator", attestation.integrationPreviewChanges === 4 && attestation.integrationWritesPerformed === 4 && attestation.generatorPreviewConfirmed === true && attestation.generatorPreviewDigest === "c3c537122ea5778355a3575e7665619caa0b39b9fac8707023a47902de40171c", `${attestation.integrationPreviewChanges}:${attestation.integrationWritesPerformed}:${attestation.generatorPreviewDigest}`);
check("migration:registry-matrix", attestation.canonicalRegistryDigest === EXPECTED_REGISTRY && attestation.operationMatrixDigest === EXPECTED_MATRIX && attestation.appRegistryDigest === appRegistryDigest, `${attestation.canonicalRegistryDigest}:${attestation.operationMatrixDigest}`);
check("migration:authority", attestation.representationCanOutrankSource === false && attestation.mcpAuthority === false && attestation.modelOutputIsAuthority === false, "representation/mcp/model false");
check("migration:private-zero-write", attestation.privateWorldPlaintextLeavesEdge === false && attestation.failedDecisionsWriteZero === true, "edge false; zero-write true");
check("migration:value", attestation.settlementAndReserveRemainDistinct === true && attestation.usdIsMovedAuthority === false, "distinct true; USD authority false");
for (const [name, integrity] of Object.entries(EXPECTED_INTEGRITIES)) check(`migration:integrity:${name}`, attestation.publicPackageIntegrities?.[name] === integrity, attestation.publicPackageIntegrities?.[name]);

const authorityScan = scanReceizV122Repository();
check("authority-scan", authorityScan.ok && authorityScan.findings.length === 0, JSON.stringify(authorityScan.findings));
const clientContract = readFileSync("src/lib/receiz/v122/contract.ts", "utf8");
check("client-projection:source-parity", clientContract.includes(EXPECTED_VERSION)
  && clientContract.includes(EXPECTED_REGISTRY)
  && clientContract.includes(EXPECTED_MATRIX)
  && !/from ["']@receiz\//.test(clientContract), "exact v122 projection; no package runtime import");
const doctrine = readFileSync("src/lib/receiz/v122/doctrine.ts", "utf8");
check("doctrine:client-safe", !/from ["']@receiz\//.test(doctrine), "no Node-only package runtime import");
check("doctrine:inventory", RECEIZ_V122_MCP_TOOL_NAMES.every((name) => doctrine.includes(`mcpTool: \"${name}\"`)), String(RECEIZ_V122_MCP_TOOL_NAMES.length));
check("doctrine:mcp-authority", (doctrine.match(/mcpAuthority: false/g) ?? []).length >= 19, String((doctrine.match(/mcpAuthority: false/g) ?? []).length));
const worldRequest = readFileSync("src/lib/receiz/v122/world-request.ts", "utf8");
check("outcomes:lookup-before-retry", worldRequest.includes("receiz_execution_still_unknown_retry_forbidden") && worldRequest.includes("if (outcome.status !== \"unknown\")"), "unknown remains unresolved");
const valueRequest = readFileSync("src/lib/receiz/v122/value-request.ts", "utf8");
check("value:phi-only", valueRequest.includes("amountPhiMicro_is_the_only_movement_authority") && valueRequest.includes("planReceizSettlementV122") && valueRequest.includes("planReceizReserveV122"), "Phi-only distinct planners");
const subjectRoute = readFileSync("app/api/receiz/v122/subjects/route.ts", "utf8");
check("private:edge-exclusion", !subjectRoute.includes("encryptedPrivateKeyB64u") && !subjectRoute.includes("edgeWrappingKey") && !subjectRoute.includes("privateKey"), "private material absent");

const focused = spawnSync(process.execPath, ["--import", "tsx", "--test",
  "tests/receiz-v122-edge-custody.test.ts", "tests/receiz-v122-subject-route.test.ts",
  "tests/receiz-v122-mandates.test.ts", "tests/receiz-v122-world.test.ts",
  "tests/receiz-v122-value-rails.test.ts", "tests/receiz-v122-authority-scan.test.ts",
  "tests/receiz-v122-doctrine.test.ts"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
check("v122:negative-and-conformance-tests", focused.status === 0, focused.status === 0 ? "passed" : focused.stderr || focused.stdout);

const auditPath = "docs/releases/2026-08-21-v122-constitutional-core-release.md";
check("release:audit", existsSync(auditPath), auditPath);
if (existsSync(auditPath)) {
  const audit = readFileSync(auditPath, "utf8");
  for (const marker of RELEASE_MARKERS) check(`release:audit:${createHash("sha256").update(marker).digest("hex").slice(0, 12)}`, audit.includes(marker), marker);
  check("release:upstream-skew-disclosed", audit.includes("non-operative qualification-label skew") && audit.includes("c3c537122ea5778355a3575e7665619caa0b39b9fac8707023a47902de40171c"), "documented");
}

const conformance = await runReceizConformance();
check("conformance", conformance.ok && conformance.summary.passed === 15 && conformance.summary.failed === 0 && conformance.summary.networkCalls === 0 && conformance.summary.dbCalls === 0, `${conformance.summary.passed} passed; ${conformance.summary.failed} failed; ${conformance.summary.networkCalls} network; ${conformance.summary.dbCalls} db`);
check("conformance:stale-label-disclosed", conformance.sdkVersion === "121.0.0" && readFileSync(auditPath, "utf8").includes("reports `sdkVersion: 121.0.0`"), conformance.sdkVersion);
const living = await runReceizLivingSubjectConformanceV120();
check("living-subject:conformance", living.ok && living.summary.passed === 19 && living.summary.failed === 0 && living.summary.writesOnFailure === 0 && living.summary.networkCalls === 0 && living.summary.dbCalls === 0, `${living.summary.passed} passed; ${living.summary.failed} failed; ${living.summary.writesOnFailure} failed-decision writes`);

const ok = checks.every((item) => item.ok);
console.log(JSON.stringify({
  schema: "receiz.app.v122.release-lock.v1",
  ok,
  applicationReleaseVersion: EXPECTED_APPLICATION_VERSION,
  releaseVersion: EXPECTED_VERSION,
  registryDigest: EXPECTED_REGISTRY,
  operationMatrixDigest: EXPECTED_MATRIX,
  livingSubjectReducerDigest: EXPECTED_REDUCER,
  appRegistryDigest,
  checks,
  authority: {
    strongerTruth: "sealed-receiz-proof-object",
    mcpAuthority: false,
    representationCanOutrankSource: false,
    networkCallsDuringIndependentVerification: 0,
    failedDecisionWrites: 0,
  },
}, null, 2));
if (!ok) process.exitCode = 1;
