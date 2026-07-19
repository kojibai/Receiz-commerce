#!/usr/bin/env node
import {
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V112_ARTIFACT_LAWS,
  RECEIZ_V112_REGISTRY_DIGEST,
  digestReceizConstitution,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import { runReceizConformance } from "@receiz/sdk/testing";
import { RECEIZ_MCP_TOOLS } from "@receiz/mcp-server";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const expectedVersion = "112.0.0";
const expectedRange = ">=112.0.0 <113.0.0";
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
  "receiz_artifact_verify",
  "receiz_artifact_admit",
  "receiz_artifact_append_plan",
  "receiz_artifact_transition_seal_and_stage",
  "receiz_artifact_transition_commit",
];
const expectedArchiveIntegrity = {
  "receiz-sdk-112.0.0.tgz": "sha512-xak1lr5Ho1ywmDRA0+dXAOTM7GvTor7grvjWCbTpgTuJ+B3QW46VSYHFq2B+N6DmwKSYgtGgGsdqz1+8+QBdMQ==",
  "receiz-mcp-server-112.0.0.tgz": "sha512-BpAgNCxlDgKJn42+CTRf0d1yhrykM7Q+t5dpoqEyNn09ozB33KQhwP+8/lvg4bdimiS4zrVAi5tCwxEpxU5MZA==",
  "receiz-ai-skills-112.0.0.tgz": "sha512-zw0RtkXxdCBNKngIFxNh3E56H432L1oBAbQFBnVPYfWjn4cdOXTJ7VpZKD9yIh+Z7lN5JFlSdF+xYb5jEoQkRA==",
};

const checks = [];
const check = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

const pkg = json("package.json");
for (const name of ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"]) {
  check(`package:${name}`, pkg.dependencies?.[name] === expectedVersion, pkg.dependencies?.[name]);
}
for (const [name, file] of Object.entries({
  "@receiz/sdk": "receiz-sdk-112.0.0.tgz",
  "@receiz/mcp-server": "receiz-mcp-server-112.0.0.tgz",
  "@receiz/ai-skills": "receiz-ai-skills-112.0.0.tgz",
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
check("registry:canonical-v112-chain", registryPayload.previousRegistryDigest === RECEIZ_V112_REGISTRY_DIGEST, registryPayload.previousRegistryDigest);
check("registry:artifact-laws", RECEIZ_V112_ARTIFACT_LAWS.length === 30 && RECEIZ_V112_ARTIFACT_LAWS.at(-1) === "ARTIFACT-030", RECEIZ_V112_ARTIFACT_LAWS.join(","));
for (const [id, code] of Object.entries({
  "ARTIFACT-021": "PROFILE_ADMISSION_IS_NOT_OPERATION_AUTHORITY",
  "ARTIFACT-022": "TYPED_PORTABLE_TRANSITION_DIGEST_REQUIRED",
  "ARTIFACT-023": "VERIFIED_ACTOR_PLAN_CAPABILITY_REQUIRED",
  "ARTIFACT-024": "VERIFIED_TRANSITION_HISTORY_REQUIRED",
  "ARTIFACT-025": "DURABLE_STAGING_AND_INDEPENDENT_RESOLUTION_REQUIRED",
  "ARTIFACT-026": "NAMED_DOMAIN_ATOMIC_ACCEPTANCE_REQUIRED",
  "ARTIFACT-027": "COMMIT_DOMAIN_MISMATCH",
  "ARTIFACT-028": "IDEMPOTENCY_CONFLICT",
  "ARTIFACT-029": "APPEND_RECEIPT_REPORT_ONLY",
  "ARTIFACT-030": "FRESH_RUNTIME_CUSTODY_AND_PROCESS_READMISSION_REQUIRED",
})) check(`registry:${id}`, registryPayload.laws.some((law) => law.id === id && law.denial?.code === code), code);

const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
for (const name of requiredTools) check(`mcp:${name}`, toolNames.has(name), name);

for (const skill of requiredDoctrineSkills) {
  for (const root of ["ai-skills", "node_modules/@receiz/ai-skills"]) {
    const manifestPath = `${root}/${skill}/manifest.json`;
    const skillPath = `${root}/${skill}/SKILL.md`;
    check(`skill:${root}:${skill}:doctrine`, existsSync(skillPath), existsSync(skillPath) ? "present" : "missing");
    if (!requiredManifestSkills.has(skill)) continue;
    const manifest = existsSync(manifestPath) ? json(manifestPath) : null;
    check(`skill:${root}:${skill}:manifest`, manifest?.schema === "receiz.ai-skill-contract.v112" && manifest?.version === expectedVersion && manifest?.requires?.sdk === expectedRange && manifest?.requires?.mcp === expectedRange && manifest?.requires?.ruleset === expectedVersion && manifest?.requires?.registryDigest === RECEIZ_V112_REGISTRY_DIGEST, manifest?.requires?.registryDigest ?? "missing");
  }
}

const lockfile = readFileSync("pnpm-lock.yaml", "utf8");
for (const file of ["receiz-sdk-112.0.0.tgz", "receiz-mcp-server-112.0.0.tgz", "receiz-ai-skills-112.0.0.tgz"]) {
  check(`lockfile:${file}`, lockfile.includes(file), file);
}

const conformance = await runReceizConformance();
check("conformance", conformance.ok && conformance.summary.failed === 0, `${conformance.summary.passed} passed; ${conformance.summary.failed} failed`);

const ok = checks.every((item) => item.ok);
console.log(JSON.stringify({
  schema: "receiz.app.v112.release-lock.v1",
  ok,
  releaseVersion: RECEIZ_RELEASE_VERSION,
  registryDigest: RECEIZ_V112_REGISTRY_DIGEST,
  appRegistryDigest: registryDigest,
  checks,
  authority: { releaseLockIsAdmission: false, strongerTruth: "sealed-receiz-proof-object" },
}, null, 2));
if (!ok) process.exit(1);
