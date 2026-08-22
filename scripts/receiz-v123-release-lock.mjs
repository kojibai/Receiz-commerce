#!/usr/bin/env node
import {
  RECEIZ_CURRENT_REGISTRY_DIGEST,
  RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST,
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V123_APP_COMPATIBLE_SDK_RANGE,
  RECEIZ_V123_REGISTRY_DIGEST,
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
  RECEIZ_V123_MCP_TOOL_NAMES,
} from "@receiz/mcp-server";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { scanReceizV123Repository } from "./receiz-v123-authority-scan.mjs";

const EXPECTED_VERSION = "123.0.0";
const EXPECTED_APPLICATION_VERSION = "5.1.0";
const EXPECTED_RANGE = ">=123.0.0 <124.0.0";
const EXPECTED_REGISTRY = "945a581d1fc49c2dc18fbe8c129771ef464b8a58b96188bce561e88ae8b6ceeb";
const EXPECTED_MATRIX = "e08cec3e3ad22c20ddd6c08169ece19f094c366214d6d6b4dc432cd97558e2c5";
const EXPECTED_APP_REGISTRY = "1578feacfe0dc124bf3de654e291897dce069e399f8d9e7f62ad87d4b897c219";
const EXPECTED_REDUCER = "5694662e2acc8b886ac9697ffad202b411d7e66c5f26f9106ee0768df7c7b8c8";
const EXPECTED_INTEGRITIES = Object.freeze({
  "@receiz/sdk": "sha512-GLpd6TpvDW8pbTWVNRu3TXYu2Dp93UaPKXwnHz/ZRtVexm6awThA31AQJLP/AhZgpqRJ7wM5f8LbmFk1oOQ45w==",
  "@receiz/mcp-server": "sha512-9VFgp2r0kjkX9/CZeng/HXoZQoVOYjVZ69C16IgcUR1CjOLB1QdNGz9GT5erTLIqtAAIz97mNJnM+9026Q/VPQ==",
  "@receiz/ai-skills": "sha512-3mRPoSnp5AWy2WWY/BpNFzQ8yruJPZiCTNFF2R9G3MJ5x8EMORlhrumUjMk7OnvhHRNHDSk+UB4wxepRSJCqXg==",
});
const RELEASE_MARKERS = Object.freeze([
  EXPECTED_VERSION,
  EXPECTED_REGISTRY,
  EXPECTED_MATRIX,
  "Representation never outranks source",
  "institution-independent",
  "Network calls during independent verification: `0`",
  "MCP authority: `false`",
  "Failed-decision writes: `0`",
  "Proof-authority bearer persistence: `0`",
  "Settlement and Reserve remain distinct",
  "lookup before retry",
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
check("identity:registry", RECEIZ_CURRENT_REGISTRY_DIGEST === EXPECTED_REGISTRY && RECEIZ_V123_REGISTRY_DIGEST === EXPECTED_REGISTRY, RECEIZ_CURRENT_REGISTRY_DIGEST);
check("identity:range", RECEIZ_V123_APP_COMPATIBLE_SDK_RANGE === EXPECTED_RANGE, RECEIZ_V123_APP_COMPATIBLE_SDK_RANGE);

const registry = json("receiz.constitution.json");
const registryValidation = validateReceizConstitutionRegistry(registry);
const appRegistryDigest = await digestReceizConstitution(registry);
check("registry:valid", registryValidation.ok, registryValidation.ok ? "valid" : registryValidation.issues.join(","));
check("registry:canonical-v123-chain", registry.version === EXPECTED_VERSION && registry.previousRegistryDigest === EXPECTED_REGISTRY, `${registry.version}:${registry.previousRegistryDigest}`);
check("registry:app-overlay", appRegistryDigest === EXPECTED_APP_REGISTRY, appRegistryDigest);
check("living-subject:reducer", RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST === EXPECTED_REDUCER, RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST);
check("operation-matrix:count", RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length === 36, String(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length));
check("operation-matrix:digest", RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST === EXPECTED_MATRIX, RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST);

const app = json("receiz.app.json");
const generated = json("receiz.generated.json");
check("operation-matrix:app-parity", JSON.stringify(app.operations) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX), String(app.operations?.length));
check("operation-matrix:generated-parity", JSON.stringify(generated.operationAuthorityMatrix) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX), String(generated.operationAuthorityMatrix?.length));
check("operation-matrix:generated-range", generated.compatibleSdkRange === EXPECTED_RANGE, generated.compatibleSdkRange);
const boundaries = readFileSync("receiz/receiz.boundaries.ts", "utf8");
check("operation-matrix:boundary-range", (boundaries.match(/>=123\.0\.0 <124\.0\.0/g) ?? []).length === 36 && !boundaries.includes(">=122.0.0 <123.0.0"), EXPECTED_RANGE);

const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
check("mcp:total", RECEIZ_MCP_TOOLS.length === 141, String(RECEIZ_MCP_TOOLS.length));
check("mcp:living-subject-retained", RECEIZ_V120_LIVING_SUBJECT_MCP_TOOL_NAMES.length === 37 && RECEIZ_V120_LIVING_SUBJECT_MCP_TOOL_NAMES.every((name) => toolNames.has(name)), String(RECEIZ_V120_LIVING_SUBJECT_MCP_TOOL_NAMES.length));
check("mcp:v122-retained", RECEIZ_V122_MCP_TOOL_NAMES.length === 19 && RECEIZ_V122_MCP_TOOL_NAMES.every((name) => toolNames.has(name)), String(RECEIZ_V122_MCP_TOOL_NAMES.length));
check("mcp:v123-count", RECEIZ_V123_MCP_TOOL_NAMES.length === 8 && RECEIZ_V123_MCP_TOOL_NAMES.every((name) => toolNames.has(name)), String(RECEIZ_V123_MCP_TOOL_NAMES.length));

const skills = json("ai-skills/skills.json");
check("skills:index", skills.schema === "receiz.ai-skills-index.v123" && skills.version === EXPECTED_VERSION, `${skills.schema}:${skills.version}`);
check("skills:counts", skills.counts?.skills === 42 && skills.counts?.manifests === 36 && skills.counts?.openaiAgentPrompts === 33, JSON.stringify(skills.counts));
check("skills:registry-matrix", skills.registryDigest === EXPECTED_REGISTRY && skills.operationMatrixDigest === EXPECTED_MATRIX, `${skills.registryDigest}:${skills.operationMatrixDigest}`);
check("skills:v123-tools", JSON.stringify(skills.currentMcpV123Tools) === JSON.stringify(RECEIZ_V123_MCP_TOOL_NAMES), String(skills.currentMcpV123Tools?.length));
check("skills:tree-parity", treeDigest("ai-skills") === treeDigest("node_modules/@receiz/ai-skills"), `${treeDigest("ai-skills")}:${treeDigest("node_modules/@receiz/ai-skills")}`);
for (const entry of skills.skills ?? []) {
  if (!entry.manifest) continue;
  const manifest = json(`ai-skills/${entry.manifest}`);
  check(`skill:${entry.name}`, manifest.schema === "receiz.ai-skill-contract.v123"
    && manifest.version === EXPECTED_VERSION
    && manifest.requires?.sdk === EXPECTED_RANGE
    && manifest.requires?.mcp === EXPECTED_RANGE
    && manifest.requires?.registryDigest === EXPECTED_REGISTRY
    && manifest.requires?.operationMatrixDigest === EXPECTED_MATRIX, `${manifest.schema}:${manifest.version}`);
}

const attestation = json("receiz.migration.v122-v123.json");
check("migration:attestation", attestation.targetVersion === EXPECTED_VERSION && attestation.applicationReleaseVersion === EXPECTED_APPLICATION_VERSION && attestation.historyRewritten === false && attestation.productionDataMigrated === false, attestation.schema);
check("migration:registry-matrix", attestation.canonicalRegistryDigest === EXPECTED_REGISTRY && attestation.operationMatrixDigest === EXPECTED_MATRIX && attestation.appRegistryDigest === appRegistryDigest, `${attestation.canonicalRegistryDigest}:${attestation.operationMatrixDigest}`);
check("migration:inventories", attestation.applicationOperationCount === 36 && attestation.mcpToolCount === 141 && attestation.mcpV123ToolCount === 8 && attestation.aiSkillCount === 42, "36/141/8/42");
check("migration:authority", attestation.representationCanOutrankSource === false && attestation.mcpAuthority === false && attestation.modelOutputIsAuthority === false, "representation/mcp/model false");
check("migration:v123-law", attestation.privateIdentityArtifactLeavesEdge === false && attestation.proofAuthorityBearerPersisted === false && attestation.explicitApplicationConsentRequired === true && attestation.sdkOwnsGeneratedSecurityFields === true && attestation.exactIntentPersistedBeforeValueExecution === true && attestation.unknownOutcomeRequiresLookupBeforeRetry === true, "edge/consent/SDK/persist/recovery");
for (const [name, integrity] of Object.entries(EXPECTED_INTEGRITIES)) check(`migration:integrity:${name}`, attestation.publicPackageIntegrities?.[name] === integrity, attestation.publicPackageIntegrities?.[name]);

const authorityScan = scanReceizV123Repository();
check("authority-scan", authorityScan.ok && authorityScan.findings.length === 0, JSON.stringify(authorityScan.findings));
const contract = readFileSync("src/lib/receiz/v123/contract.ts", "utf8");
const doctrine = readFileSync("src/lib/receiz/v123/doctrine.ts", "utf8");
check("client-contract:source-parity", contract.includes(EXPECTED_VERSION) && contract.includes(EXPECTED_REGISTRY) && contract.includes(EXPECTED_MATRIX) && !/from ["']@receiz\//.test(contract), "exact v123 projection; no package runtime import");
check("doctrine:client-safe", !/from ["']@receiz\//.test(doctrine), "no package runtime import");
check("doctrine:inventory", RECEIZ_V123_MCP_TOOL_NAMES.every((name) => doctrine.includes(`mcpTool: \"${name}\"`)), String(RECEIZ_V123_MCP_TOOL_NAMES.length));
check("doctrine:mcp-authority", (doctrine.match(/mcpAuthority: false/g) ?? []).length >= 8, String((doctrine.match(/mcpAuthority: false/g) ?? []).length));

const proofAuthority = readFileSync("src/lib/receiz/v123/proof-authority.ts", "utf8");
const consent = readFileSync("src/lib/receiz/v123/consent.ts", "utf8");
const valueExecution = readFileSync("src/lib/receiz/v123/value-execution.ts", "utf8");
const planning = readFileSync("src/lib/receiz/v123/planning.ts", "utf8");
const valueRoute = readFileSync("app/api/receiz/v123/value/route.ts", "utf8");
check(
  "proof-authority:edge-only",
  proofAuthority.includes("let heldAuthority")
    && proofAuthority.includes("V123_EDGE_EXPLICIT_CONSENT_REQUIRED")
    && proofAuthority.includes("grantedScopes(authority.accessToken)")
    && !proofAuthority.includes("localStorage"),
  "closure custody and exact scopes",
);
check("consent:exact-challenge", consent.includes("proofAuthorityChallengeBasisV123") && consent.includes("approved: true") && consent.includes("challenge.audience !== applicationId") && !/invent.*(?:Kai|Chronos)/i.test(consent), "exact application challenge");
check("planning:sdk-canonical", planning.includes("GENERATED_SECURITY_FIELDS") && planning.includes("V123_SDK_CANONICAL_SECURITY_VALUE_FORBIDDEN") && planning.includes("V123_NAMESPACE_EXACT_HEAD_REQUIRED"), "SDK owns security fields; exact head");
check("value:persist-before-execute", valueExecution.indexOf("persistReceizExactValueIntentV123(store, value)") < valueExecution.indexOf("session.execute(persisted)") && valueExecution.includes("runtimePersistedIntents") && valueExecution.includes("V123_VALUE_RETRY_REQUIRES_RECOVERY"), "canonical persistence before branded execution");
check("value:server-recovery-only", valueRoute.includes("export async function GET") && !valueRoute.includes("export async function POST") && !valueRoute.includes("exchangeProofAuthority") && !valueRoute.includes("executeSettlement") && !valueRoute.includes("executeReserve"), "GET lookup only");

const focusedTests = [
  "tests/receiz-v123-release-identity.test.ts",
  "tests/receiz-v123-adapter.test.ts",
  "tests/receiz-v123-proof-authority.test.ts",
  "tests/receiz-v123-planning.test.ts",
  "tests/receiz-v123-routes.test.ts",
  "tests/receiz-v123-value-execution.test.ts",
  "tests/receiz-v123-value-ui.test.ts",
  "tests/receiz-v123-contract.test.ts",
  "tests/receiz-v123-developer-ui.test.ts",
  "tests/receiz-v123-authority-scan.test.ts",
  "tests/receiz-v122-edge-custody.test.ts",
  "tests/receiz-v122-world.test.ts",
  "tests/receiz-v122-value-rails.test.ts",
];
const focused = spawnSync(process.execPath, ["--import", "tsx", "--test", ...focusedTests], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
check("v123:negative-and-integration-tests", focused.status === 0, focused.status === 0 ? "passed" : focused.stderr || focused.stdout);

const auditPath = "docs/releases/2026-08-22-v123-lawful-action-release.md";
check("release:audit", existsSync(auditPath), auditPath);
if (existsSync(auditPath)) {
  const audit = readFileSync(auditPath, "utf8");
  for (const marker of RELEASE_MARKERS) check(`release:audit:${createHash("sha256").update(marker).digest("hex").slice(0, 12)}`, audit.includes(marker), marker);
}

const conformance = await runReceizConformance();
check("conformance", conformance.ok && conformance.summary.passed === 15 && conformance.summary.failed === 0 && conformance.summary.networkCalls === 0 && conformance.summary.dbCalls === 0, `${conformance.summary.passed} passed; ${conformance.summary.failed} failed; ${conformance.summary.networkCalls} network; ${conformance.summary.dbCalls} db`);
const living = await runReceizLivingSubjectConformanceV120();
check("living-subject:conformance", living.ok && living.summary.passed === 19 && living.summary.failed === 0 && living.summary.writesOnFailure === 0 && living.summary.networkCalls === 0 && living.summary.dbCalls === 0, `${living.summary.passed} passed; ${living.summary.failed} failed; ${living.summary.writesOnFailure} failed-decision writes`);

const ok = checks.every((item) => item.ok);
console.log(JSON.stringify({
  schema: "receiz.app.v123.release-lock.v1",
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
    proofAuthorityBearerPersistence: 0,
  },
}, null, 2));
if (!ok) process.exitCode = 1;
