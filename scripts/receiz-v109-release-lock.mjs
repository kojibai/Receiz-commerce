#!/usr/bin/env node
import {
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V109_ARTIFACT_LAWS,
  RECEIZ_V109_REGISTRY_DIGEST,
  digestReceizConstitution,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import { runReceizConformance } from "@receiz/sdk/testing";
import { RECEIZ_MCP_TOOLS } from "@receiz/mcp-server";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const expectedVersion = "109.0.0";
const requiredDoctrineSkills = [
  "receiz-app-builder-skill",
  "receiz-architecture",
  "receiz-authority-security",
  "receiz-bearer-ownership",
  "receiz-build-production-system",
  "receiz-builder-skill",
  "receiz-causal-sync",
  "receiz-command-builder",
  "receiz-commerce-skill",
  "receiz-constitutional-laws",
  "receiz-cross-app-state",
  "receiz-deterministic-replay",
  "receiz-domain-builder",
  "receiz-distribution-skill",
  "receiz-identity-profile",
  "receiz-mcp-agent-skill",
  "receiz-migrations",
  "receiz-observability",
  "receiz-offline-command",
  "receiz-offline-first",
  "receiz-offline-verifier-skill",
  "receiz-performance",
  "receiz-portable-artifacts",
  "receiz-portable-continuity",
  "receiz-proof-media",
  "receiz-proof-skill",
  "receiz-receipt-admission",
  "receiz-release",
  "receiz-skill-bundle",
  "receiz-sports-card-skill",
  "receiz-testing",
];
const requiredManifestSkills = new Set([
  "receiz-app-builder-skill",
  "receiz-architecture",
  "receiz-authority-security",
  "receiz-bearer-ownership",
  "receiz-build-production-system",
  "receiz-causal-sync",
  "receiz-command-builder",
  "receiz-constitutional-laws",
  "receiz-cross-app-state",
  "receiz-deterministic-replay",
  "receiz-domain-builder",
  "receiz-identity-profile",
  "receiz-migrations",
  "receiz-observability",
  "receiz-offline-command",
  "receiz-offline-first",
  "receiz-offline-verifier-skill",
  "receiz-performance",
  "receiz-portable-artifacts",
  "receiz-portable-continuity",
  "receiz-proof-media",
  "receiz-proof-skill",
  "receiz-receipt-admission",
  "receiz-release",
  "receiz-testing",
]);
const requiredTools = [
  "receiz_architecture_inspect",
  "receiz_domain_scaffold",
  "receiz_command_scaffold",
  "receiz_law_define",
  "receiz_law_explain",
  "receiz_law_coverage",
  "receiz_authority_inspect",
  "receiz_command_simulate",
  "receiz_receipt_replay",
  "receiz_history_trace",
  "receiz_merge_simulate",
  "receiz_bypass_scan",
  "receiz_conformance_run",
  "receiz_release_verify",
  "receiz_mcp_execute_command",
  "receiz_identity_profile_update_plan",
  "receiz_identity_profile_update_execute",
  "receiz_bearer_asset_claim_plan",
  "receiz_bearer_asset_claim_execute",
  "receiz_artifact_record_seal_plan",
  "receiz_artifact_record_seal_execute",
  "receiz_artifact_verify",
  "receiz_artifact_extract_verified",
  "receiz_artifact_round_trip_check",
  "receiz_artifact_explain",
];
const expectedArchiveIntegrity = {
  "receiz-sdk-109.0.0.tgz": "sha512-1a/v66zJgWA5E065L4JHlIi87FzQPVy9fUwRhTbBRsN3ObMt8GKzhhDSwXoj37CIkDO7bNZ1wiGdtj7JNUJSAw==",
  "receiz-mcp-server-109.0.0.tgz": "sha512-gqJap6tFwohM/DmTaZxl4fP5jBmPRX+RRcZRvmyWbKaSsW5UIRNNexVCKp3WOKhTskRk/wzhQaRQ3VwTLLJiqg==",
  "receiz-ai-skills-109.0.0.tgz": "sha512-ntvb74RcKDYwRh1uZmxnzpHkpCBvrPguxm9NJk+Liv8ozIpVYyjsQsIuywG2ffzKUzJAC62WswmaVN7eMVq0hQ==",
};

const checks = [];
const check = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

const pkg = json("package.json");
for (const name of ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"]) {
  check(`package:${name}`, pkg.dependencies?.[name] === expectedVersion, pkg.dependencies?.[name]);
}
for (const [name, file] of Object.entries({
  "@receiz/sdk": "receiz-sdk-109.0.0.tgz",
  "@receiz/mcp-server": "receiz-mcp-server-109.0.0.tgz",
  "@receiz/ai-skills": "receiz-ai-skills-109.0.0.tgz",
})) {
  const override = pkg.pnpm?.overrides?.[name];
  check(`override:${name}`, override === `file:vendor/${file}` && existsSync(`vendor/${file}`), override);
  const integrity = existsSync(`vendor/${file}`)
    ? `sha512-${createHash("sha512").update(readFileSync(`vendor/${file}`)).digest("base64")}`
    : "missing";
  check(`integrity:${name}`, integrity === expectedArchiveIntegrity[file], integrity);
}

check("identity:sdk", RECEIZ_SDK_VERSION === expectedVersion, RECEIZ_SDK_VERSION);
check("identity:release", RECEIZ_RELEASE_VERSION === expectedVersion, RECEIZ_RELEASE_VERSION);
check("identity:ruleset", RECEIZ_RULESET_VERSION === expectedVersion, RECEIZ_RULESET_VERSION);

const registryPayload = json("receiz.constitution.json");
const registryValidation = validateReceizConstitutionRegistry(registryPayload);
check("registry:valid", registryValidation.ok, registryValidation.ok ? "valid" : registryValidation.issues.join(","));
const registryDigest = await digestReceizConstitution(registryPayload);
check("registry:canonical-v109-chain", registryPayload.previousRegistryDigest === RECEIZ_V109_REGISTRY_DIGEST, registryPayload.previousRegistryDigest);
check("registry:artifact-laws", RECEIZ_V109_ARTIFACT_LAWS.length === 11 && RECEIZ_V109_ARTIFACT_LAWS.at(-1) === "ARTIFACT-011", RECEIZ_V109_ARTIFACT_LAWS.join(","));
check("registry:local-verification-law", registryPayload.laws.some((law) => law.id === "ARTIFACT-011" && law.denial?.code === "LOCAL_ARTIFACT_VERIFICATION_MUST_NOT_REQUIRE_WEAKER_STATE"), "ARTIFACT-011");

const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
for (const name of requiredTools) check(`mcp:${name}`, toolNames.has(name), name);

for (const skill of requiredDoctrineSkills) {
  for (const root of ["ai-skills", "node_modules/@receiz/ai-skills"]) {
    const manifestPath = `${root}/${skill}/manifest.json`;
    const skillPath = `${root}/${skill}/SKILL.md`;
    check(`skill:${root}:${skill}:doctrine`, existsSync(skillPath), existsSync(skillPath) ? "present" : "missing");
    if (!requiredManifestSkills.has(skill)) continue;
    const manifest = existsSync(manifestPath) ? json(manifestPath) : null;
    check(`skill:${root}:${skill}:manifest`, manifest?.requires?.sdk === ">=109.0.0 <110.0.0" && manifest?.requires?.registryDigest === RECEIZ_V109_REGISTRY_DIGEST, manifest?.requires?.registryDigest ?? "missing");
  }
}

const lockfile = readFileSync("pnpm-lock.yaml", "utf8");
for (const file of ["receiz-sdk-109.0.0.tgz", "receiz-mcp-server-109.0.0.tgz", "receiz-ai-skills-109.0.0.tgz"]) {
  check(`lockfile:${file}`, lockfile.includes(file), file);
}

const conformance = await runReceizConformance();
check("conformance", conformance.ok && conformance.summary.failed === 0, `${conformance.summary.passed} passed; ${conformance.summary.failed} failed`);

const ok = checks.every((item) => item.ok);
console.log(JSON.stringify({
  schema: "receiz.app.v109.release-lock.v1",
  ok,
  releaseVersion: RECEIZ_RELEASE_VERSION,
  registryDigest: RECEIZ_V109_REGISTRY_DIGEST,
  appRegistryDigest: registryDigest,
  checks,
  authority: { releaseLockIsAdmission: false, strongerTruth: "sealed-receiz-proof-object" },
}, null, 2));
if (!ok) process.exit(1);
