#!/usr/bin/env node
import {
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V119_ARTIFACT_LAWS,
  RECEIZ_V119_REGISTRY_DIGEST,
  digestReceizConstitution,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import {
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX,
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
} from "@receiz/sdk/compiler";
import { runReceizConformance } from "@receiz/sdk/testing";
import { RECEIZ_MCP_TOOLS } from "@receiz/mcp-server";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

const EXPECTED_VERSION = "119.0.0";
const EXPECTED_RANGE = ">=119.0.0 <120.0.0";
const EXPECTED_REGISTRY = "49c167a437ec7c0e486412dd62c54af4abdf94eda1ebc18d263a027d105cecd9";
const EXPECTED_MATRIX = "53cf9d6862b2396e2fe7864f8607c00c4e3b6e31b082ab5c5c8dff088fcb52c1";
const EXPECTED_INTEGRITIES = {
  "@receiz/sdk": "sha512-vngyBn1dXcd/U7iUnMYeFKYJTsFje2YOzEbqWR0+c6sbNXaeQysEdEE9LWrhBlLoMtC0Vvl9ec46D2bFeaOlAw==",
  "@receiz/mcp-server": "sha512-pLeKOMTD2vijTjsZcH93oX2bB6Kf0UEx/E3NpzO5gFeLhlOySlvKyd0SD3g5flT0Abl6FfaGSQuYlfH8XZCyTg==",
  "@receiz/ai-skills": "sha512-qsLCUq6e+kVA3n5355mM25aChHGovOr09HWyubDt3xFc0W6VZiuBEbV2DmLewjShxNRErDO4X2vVsdnv3uQUeg==",
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
check("registry:canonical-v119-chain", registry.previousRegistryDigest === RECEIZ_V119_REGISTRY_DIGEST && RECEIZ_V119_REGISTRY_DIGEST === EXPECTED_REGISTRY, registry.previousRegistryDigest);
check("registry:artifact-laws", RECEIZ_V119_ARTIFACT_LAWS.length === 48 && RECEIZ_V119_ARTIFACT_LAWS.includes("ARTIFACT-030"), String(RECEIZ_V119_ARTIFACT_LAWS.length));
check("operation-matrix:count", RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length === 16, String(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length));
check("operation-matrix:digest", RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST === EXPECTED_MATRIX, RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST);

const app = json("receiz.app.json");
check("operation-matrix:app-parity", JSON.stringify(app.operations) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX), String(app.operations?.length));
const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
for (const name of REQUIRED_MCP_TOOLS) check(`mcp:${name}`, toolNames.has(name), name);

const skillsIndex = json("ai-skills/skills.json");
check("skills:index", skillsIndex.schema === "receiz.ai-skills-index.v119" && skillsIndex.version === EXPECTED_VERSION, `${skillsIndex.schema}:${skillsIndex.version}`);
check("skills:registry", skillsIndex.registryDigest === EXPECTED_REGISTRY, skillsIndex.registryDigest);
check("skills:matrix", skillsIndex.operationMatrixDigest === EXPECTED_MATRIX, skillsIndex.operationMatrixDigest);
check("skills:tree-parity", treeDigest("ai-skills") === treeDigest("node_modules/@receiz/ai-skills"), `${treeDigest("ai-skills")}:${treeDigest("node_modules/@receiz/ai-skills")}`);
for (const entry of skillsIndex.skills ?? []) {
  if (!entry.manifest) continue;
  const manifest = json(`ai-skills/${entry.manifest}`);
  check(`skill:${entry.name}`, manifest.schema === "receiz.ai-skill-contract.v119"
    && manifest.version === EXPECTED_VERSION
    && manifest.requires?.sdk === EXPECTED_RANGE
    && manifest.requires?.mcp === EXPECTED_RANGE
    && manifest.requires?.registryDigest === EXPECTED_REGISTRY
    && manifest.requires?.operationMatrixDigest === EXPECTED_MATRIX, manifest.version);
}

const attestation = json("receiz.migration.v118-v119.json");
check("migration:attestation", attestation.targetVersion === EXPECTED_VERSION && attestation.historyRewritten === false, attestation.schema);
check("migration:registry", attestation.canonicalRegistryDigest === EXPECTED_REGISTRY && attestation.appRegistryDigest === appRegistryDigest, attestation.appRegistryDigest);
check("migration:zero-writes", attestation.integrationPlanActions === 0 && attestation.integrationWritesPerformed === 0, `${attestation.integrationPlanActions}:${attestation.integrationWritesPerformed}`);
for (const [name, integrity] of Object.entries(EXPECTED_INTEGRITIES)) {
  check(`migration:integrity:${name}`, attestation.publicPackageIntegrities?.[name] === integrity, attestation.publicPackageIntegrities?.[name]);
}
const auditPath = "docs/releases/2026-08-14-v119-migration-release-audit.md";
check("release:audit", existsSync(auditPath), auditPath);
if (existsSync(auditPath)) {
  const audit = readFileSync(auditPath, "utf8");
  for (const marker of [EXPECTED_VERSION, EXPECTED_REGISTRY, EXPECTED_MATRIX, appRegistryDigest, "Network calls during verification: `0`"]) {
    check(`release:audit:${marker.slice(0, 16)}`, audit.includes(marker), marker);
  }
}

const conformance = await runReceizConformance();
check("conformance", conformance.ok && conformance.summary.failed === 0 && conformance.summary.networkCalls === 0 && conformance.summary.dbCalls === 0, `${conformance.summary.passed} passed; ${conformance.summary.failed} failed; ${conformance.summary.networkCalls} network; ${conformance.summary.dbCalls} db`);
const ok = checks.every((item) => item.ok);
console.log(JSON.stringify({
  schema: "receiz.app.v119.release-lock.v1",
  ok,
  releaseVersion: RECEIZ_RELEASE_VERSION,
  registryDigest: RECEIZ_V119_REGISTRY_DIGEST,
  operationMatrixDigest: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
  appRegistryDigest,
  checks,
  authority: {
    releaseLockIsAdmission: false,
    networkCallsDuringVerification: conformance.summary.networkCalls,
    strongerTruth: "sealed-receiz-proof-object",
  },
}, null, 2));
if (!ok) process.exit(1);
