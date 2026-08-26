#!/usr/bin/env node
import {
  RECEIZ_CURRENT_REGISTRY_DIGEST,
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V124_APP_COMPATIBLE_SDK_RANGE,
  RECEIZ_V124_REGISTRY_DIGEST,
  digestReceizConstitution,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import { RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX, RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST } from "@receiz/sdk/compiler";
import { runReceizConformance, runReceizLivingSubjectConformanceV120 } from "@receiz/sdk/testing";
import { RECEIZ_MCP_TOOLS, RECEIZ_V123_MCP_TOOL_NAMES, RECEIZ_V124_MCP_TOOL_NAMES } from "@receiz/mcp-server";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { scanReceizV124Repository } from "./receiz-v124-authority-scan.mjs";

const PACKAGE_VERSION = "124.0.3";
const RULESET_VERSION = "124.0.0";
const APP_VERSION = "5.2.1";
const RANGE = ">=124.0.0 <125.0.0";
const REGISTRY = "d02429151b0bcebdaeb89485792e377afc55130f9a25e07982c1c88221314247";
const MATRIX = "540d1c1bf39f1b288b257c79a6e020bdcc5e587fc9b7dbf6b7aaa5d082e20ad5";
const APP_REGISTRY = "d11659fd5d1b8c6a218e1cb68afb777bb1695f90dbbf4baf502a364addb7b660";
const INTEGRITIES = Object.freeze({
  "@receiz/sdk": "sha512-kdJicDfB+tcODBVtxdKdmxCV7NKzWhTHPKJcJPiYOadxkNx5LdmUxMuwjhiuRSMLRIEKo0YfPYcIjPzilrERtA==",
  "@receiz/mcp-server": "sha512-dxtpqkW46mC/2DHG+Voxr4wUmSD4wj3Jxq0g2GMyBaYU7dt17l2ZBY/SIFpvRt28VpLB9esTD1io0ptspDwKkg==",
  "@receiz/ai-skills": "sha512-iTSplhw5J/+kCtjZjRNA/dg1/SIEzTCIBDkrhRK+0zp7W9FWECXUpq1nemQ16gIyR0dHZbTZPnjUV3RqdmoV1Q==",
});
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
  for (const file of filesUnder(root).sort((a, b) => a.relative.localeCompare(b.relative))) hash.update(file.relative).update("\0").update(readFileSync(file.path)).update("\0");
  return hash.digest("hex");
};

const pkg = json("package.json");
const lockfile = readFileSync("pnpm-lock.yaml", "utf8");
check("application:version", pkg.version === APP_VERSION, pkg.version);
for (const [name, integrity] of Object.entries(INTEGRITIES)) {
  check(`package:${name}`, pkg.dependencies?.[name] === PACKAGE_VERSION, pkg.dependencies?.[name]);
  check(`override:${name}:absent`, pkg.pnpm?.overrides?.[name] === undefined, pkg.pnpm?.overrides?.[name] ?? "absent");
  check(`integrity:${name}`, lockfile.includes(`integrity: ${integrity}`), integrity);
}
check("identity:sdk-release", RECEIZ_SDK_VERSION === PACKAGE_VERSION && RECEIZ_RELEASE_VERSION === PACKAGE_VERSION, `${RECEIZ_SDK_VERSION}:${RECEIZ_RELEASE_VERSION}`);
check("identity:ruleset-distinct", RECEIZ_RULESET_VERSION === RULESET_VERSION && RULESET_VERSION !== PACKAGE_VERSION, RECEIZ_RULESET_VERSION);
check("identity:registry-range", RECEIZ_CURRENT_REGISTRY_DIGEST === REGISTRY && RECEIZ_V124_REGISTRY_DIGEST === REGISTRY && RECEIZ_V124_APP_COMPATIBLE_SDK_RANGE === RANGE, `${RECEIZ_CURRENT_REGISTRY_DIGEST}:${RECEIZ_V124_APP_COMPATIBLE_SDK_RANGE}`);

const registry = json("receiz.constitution.json");
const appRegistryDigest = await digestReceizConstitution(registry);
check("registry:valid-chain", validateReceizConstitutionRegistry(registry).ok && registry.version === RULESET_VERSION && registry.previousRegistryDigest === REGISTRY, `${registry.version}:${registry.previousRegistryDigest}`);
check("registry:app-digest", appRegistryDigest === APP_REGISTRY, appRegistryDigest);
for (const law of ["v124.representation-never-outranks-source", "v124.json-cannot-mint-runtime-custody", "v124.qualification-before-mutation", "v124.unknown-outcome-resolve-before-retry", "v124.replay-candidate-must-be-sealed", "v124.private-additions-trusted-host-only"]) {
  check(`law:${law}`, registry.laws.some((entry) => entry.id === law), law);
}

const app = json("receiz.app.json");
const generated = json("receiz.generated.json");
check("matrix:identity", RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length === 53 && RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST === MATRIX, `${RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length}:${RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST}`);
check("matrix:app", JSON.stringify(app.operations) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX), String(app.operations?.length));
check("matrix:generated", JSON.stringify(generated.operationAuthorityMatrix) === JSON.stringify(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX) && generated.compatibleSdkRange === RANGE, `${generated.operationAuthorityMatrix?.length}:${generated.compatibleSdkRange}`);
const boundaries = readFileSync("receiz/receiz.boundaries.ts", "utf8");
check("matrix:boundaries", (boundaries.match(/>=124\.0\.0 <125\.0\.0/g) ?? []).length === 53, String((boundaries.match(/>=124\.0\.0 <125\.0\.0/g) ?? []).length));

const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
check("mcp:inventory", RECEIZ_MCP_TOOLS.length === 165 && RECEIZ_V124_MCP_TOOL_NAMES.length === 22 && RECEIZ_V124_MCP_TOOL_NAMES.every((name) => toolNames.has(name)), `${RECEIZ_MCP_TOOLS.length}:${RECEIZ_V124_MCP_TOOL_NAMES.length}`);
check("mcp:portable-presentation", ["receiz_material_url_open", "receiz_sealed_kai_moment"].every((name) => toolNames.has(name)), "2");
check("mcp:v123-retained", RECEIZ_V123_MCP_TOOL_NAMES.length === 8 && RECEIZ_V123_MCP_TOOL_NAMES.every((name) => toolNames.has(name)), String(RECEIZ_V123_MCP_TOOL_NAMES.length));
const toolMap = json("ai-skills/receiz-mcp-agent-skill/resources/v124-runtime-tool-map.json");
check("mcp:tool-map", JSON.stringify(toolMap.tools.map((tool) => tool.name)) === JSON.stringify(RECEIZ_V124_MCP_TOOL_NAMES) && toolMap.authority.mcpIsAuthority === false && toolMap.custodyRules.includes("mcp-never-reconstructs-sdk-authority-from-json"), String(toolMap.tools?.length));

const skills = json("ai-skills/skills.json");
check("skills:index", skills.schema === "receiz.ai-skills-index.v124" && skills.version === PACKAGE_VERSION && skills.rulesetVersion === RULESET_VERSION && skills.registryDigest === REGISTRY && skills.operationMatrixDigest === MATRIX, `${skills.schema}:${skills.version}:${skills.rulesetVersion}`);
check("skills:counts", skills.counts?.skills === 42 && skills.counts?.manifests === 36 && skills.counts?.openaiAgentPrompts === 33, JSON.stringify(skills.counts));
check("skills:tree-parity", treeDigest("ai-skills") === treeDigest("node_modules/@receiz/ai-skills"), `${treeDigest("ai-skills")}:${treeDigest("node_modules/@receiz/ai-skills")}`);
for (const entry of skills.skills ?? []) {
  if (!entry.manifest) continue;
  const manifest = json(`ai-skills/${entry.manifest}`);
  check(`skill:${entry.name}`, manifest.schema === "receiz.ai-skill-contract.v124" && manifest.version === PACKAGE_VERSION && manifest.requires?.sdk === RANGE && manifest.requires?.mcp === RANGE && manifest.requires?.ruleset === RULESET_VERSION && manifest.requires?.registryDigest === REGISTRY && manifest.requires?.operationMatrixDigest === MATRIX, `${manifest.schema}:${manifest.version}`);
}
const allowedV124 = (name) => json(`ai-skills/${name}/manifest.json`).allowedTools.filter((tool) => tool.startsWith("receiz_v124_"));
check("skills:build-grants", JSON.stringify(allowedV124("receiz-build-production-system")) === JSON.stringify(RECEIZ_V124_MCP_TOOL_NAMES), String(allowedV124("receiz-build-production-system").length));
check("skills:focused-grants", allowedV124("receiz-proof-authority").length === 6 && allowedV124("receiz-value-execution").length === 7 && allowedV124("receiz-deterministic-replay").length === 6, "6/7/6");
const proofMediaTools = json("ai-skills/receiz-proof-media/manifest.json").allowedTools;
check("skills:portable-presentation-grants", ["receiz_material_url_open", "receiz_sealed_kai_moment"].every((tool) => proofMediaTools.includes(tool)), "receiz-proof-media:2");

const adapter = readFileSync("src/lib/receiz/adapter.ts", "utf8");
const materialAdapter = readFileSync("src/lib/receiz/v124/material.ts", "utf8");
const runtime = readFileSync("src/lib/receiz/v124/production-runtime.ts", "utf8");
const publicRoute = readFileSync("app/api/receiz/v124/runtime/route.ts", "utf8");
for (const method of toolMap.tools.map((tool) => tool.sdkMethod.split(".").at(-1))) check(`adapter:${method}`, adapter.includes(method) || runtime.includes(method), method);
check("runtime:opaque-custody", (runtime.match(/new WeakMap/g) ?? []).length >= 6 && runtime.includes("RECEIZ_V124_SESSION_CUSTODY_REQUIRED") && runtime.includes("RECEIZ_V124_EXECUTION_HANDLE_CUSTODY_REQUIRED"), String((runtime.match(/new WeakMap/g) ?? []).length));
check("runtime:qualification-gate", runtime.indexOf("await qualifyForMutation") < runtime.indexOf("adapter.v124.execution.stage(plan)"), "qualify before stage");
check("runtime:private-projection", runtime.includes("exactPrivateAdditionsLeaveTrustedHost: false") && !/privateAdditionsRef[\s\S]{0,160}\badditions\s*:/.test(runtime), "trusted-host only");
check("runtime:sealed-replay", runtime.includes("candidateForCanonicalSeal") && runtime.includes("RECEIZ_V124_SEALED_REPLAY_SOURCE_REQUIRED"), "Record -> Seal required");
check("route:sanitized-report", publicRoute.includes("projectReceizV124Qualification") && !publicRoute.includes("actualGrantedScopes") && !publicRoute.includes("publicDependencyHeads"), "no scopes or heads");
check("material:adapter", ["openVerifiedReceizMaterialUrl", "createReceizPlayableMaterialObjectUrl", "buildReceizMaterialCompositeTransport"].every((method) => materialAdapter.includes(method)) && adapter.includes("receizKaiMomentFromSealedPulse"), "4");
const materialViewer = readFileSync("src/features/verify/MaterialProofViewer.tsx", "utf8");
check("material:verify-before-play", materialViewer.indexOf("openVerifiedUrl(window.location.href)") < materialViewer.indexOf("createPlayableObjectUrl(verified)") && materialViewer.includes("playable.revoke()") && materialViewer.includes("canonicalReceizUrl"), "verified local projection");
const upstreamGaps = json("receiz.upstream-gaps.json");
check("upstream:streaming-verifier-export-gap", upstreamGaps.gaps?.some((gap) => gap.id === "sdk.streaming-verifier-public-export" && gap.observedPackage === "@receiz/sdk@124.0.3" && gap.nextReleaseRequired === true && gap.publicDocumentation === false), "private next-release gate");

const scan = scanReceizV124Repository();
check("authority-scan", scan.ok && scan.findings.length === 0, JSON.stringify(scan.findings));
const migration = spawnSync(process.execPath, ["scripts/receiz-v124-migration-verify.mjs", "--root", "."], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
check("migration", migration.status === 0, migration.status === 0 ? "passed" : migration.stderr || migration.stdout);

const focusedTests = [
  "tests/receiz-v124-release-identity.test.ts",
  "tests/receiz-v124-adapter.test.ts",
  "tests/receiz-v124-production-runtime.test.ts",
  "tests/receiz-v124-authority-scan.test.ts",
  "tests/receiz-v124-developer-ui.test.ts",
  "tests/receiz-v124-material-ui.test.ts",
  "tests/receiz-v124-upstream-export-gap.test.ts",
  "tests/receiz-app-contract.test.ts",
  "tests/receiz-v123-proof-authority.test.ts",
  "tests/receiz-v123-value-execution.test.ts",
  "tests/receiz-v122-world.test.ts",
];
const focused = spawnSync(process.execPath, ["--import", "tsx", "--test", ...focusedTests], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
check("tests:focused", focused.status === 0, focused.status === 0 ? "passed" : focused.stderr || focused.stdout);

const auditPath = "docs/releases/2026-08-25-v124.0.3-portable-material-release.md";
check("release:audit", existsSync(auditPath), auditPath);
if (existsSync(auditPath)) {
  const audit = readFileSync(auditPath, "utf8");
  for (const marker of [APP_VERSION, PACKAGE_VERSION, RULESET_VERSION, REGISTRY, MATRIX, "Reality Becomes Infrastructure", "Representation never outranks source", "Network calls during independent verification: `0`", "MCP authority: `false`", "Failed-decision writes: `0`", "JSON reconstruction cannot mint custody", "Settlement and Reserve remain distinct"]) check(`release:${createHash("sha256").update(marker).digest("hex").slice(0, 12)}`, audit.includes(marker), marker);
}

const conformance = await runReceizConformance();
check("conformance", conformance.ok && conformance.summary.passed === 15 && conformance.summary.failed === 0 && conformance.summary.networkCalls === 0 && conformance.summary.dbCalls === 0, JSON.stringify(conformance.summary));
const living = await runReceizLivingSubjectConformanceV120();
check("living-subject-conformance", living.ok && living.summary.passed === 19 && living.summary.failed === 0 && living.summary.writesOnFailure === 0, JSON.stringify(living.summary));

const ok = checks.every((entry) => entry.ok);
console.log(JSON.stringify({
  schema: "receiz.app.v124.release-lock.v1",
  ok,
  applicationVersion: APP_VERSION,
  packageVersion: PACKAGE_VERSION,
  rulesetVersion: RULESET_VERSION,
  registryDigest: REGISTRY,
  operationMatrixDigest: MATRIX,
  appRegistryDigest,
  checks,
  authority: { strongerTruth: "sealed-receiz-proof-object", representationCanOutrankSource: false, mcpAuthority: false, networkCallsDuringIndependentVerification: 0, failedDecisionWrites: 0 },
}, null, 2));
if (!ok) process.exitCode = 1;
