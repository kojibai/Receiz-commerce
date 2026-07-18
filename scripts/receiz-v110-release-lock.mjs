#!/usr/bin/env node
import {
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V110_ARTIFACT_LAWS,
  RECEIZ_V110_REGISTRY_DIGEST,
  digestReceizConstitution,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import { runReceizConformance } from "@receiz/sdk/testing";
import { RECEIZ_MCP_TOOLS } from "@receiz/mcp-server";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const expectedVersion = "110.0.0";
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
  "receiz_artifact_admit",
  "receiz_artifact_recovery_plan",
  "receiz_artifact_admit_and_recover",
  "receiz_artifact_recovery_commit",
];
const expectedArchiveIntegrity = {
  "receiz-sdk-110.0.0.tgz": "sha512-sQ2NWKFJBVr321cpHYPgyjlnWFEmjwU/a7mHWTyWprgOdQMz0odkwVWRRhFKGX+hLDIbpOIz7E0QcYArWOv3KQ==",
  "receiz-mcp-server-110.0.0.tgz": "sha512-+/cCjruSzYw2wFjjDKhe14HXvP5pfdgXS/jsIChZBk2eyXPCbwlAb10K149Xl+1ZFaWGdTaPClqp9I82UWRWbw==",
  "receiz-ai-skills-110.0.0.tgz": "sha512-rcDDDs4Bz94wFV5HSWoc12X7YQY5iRitLaw2ryVPOonVMW13Wi2v9v7fniQ5y0aV+YuAtivojSWtonkfWkFroA==",
};

const checks = [];
const check = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

const pkg = json("package.json");
for (const name of ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"]) {
  check(`package:${name}`, pkg.dependencies?.[name] === expectedVersion, pkg.dependencies?.[name]);
}
for (const [name, file] of Object.entries({
  "@receiz/sdk": "receiz-sdk-110.0.0.tgz",
  "@receiz/mcp-server": "receiz-mcp-server-110.0.0.tgz",
  "@receiz/ai-skills": "receiz-ai-skills-110.0.0.tgz",
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
check("registry:canonical-v110-chain", registryPayload.previousRegistryDigest === RECEIZ_V110_REGISTRY_DIGEST, registryPayload.previousRegistryDigest);
check("registry:artifact-laws", RECEIZ_V110_ARTIFACT_LAWS.length === 15 && RECEIZ_V110_ARTIFACT_LAWS.at(-1) === "ARTIFACT-015", RECEIZ_V110_ARTIFACT_LAWS.join(","));
for (const [id, code] of Object.entries({
  "ARTIFACT-012": "COMPLETE_ARTIFACT_ADMISSION_REQUIRED",
  "ARTIFACT-013": "BEARER_AUTHORITY_ESCALATION_FORBIDDEN",
  "ARTIFACT-014": "ATOMIC_CAPABILITY_RECOVERY_COMMIT_REQUIRED",
  "ARTIFACT-015": "PROOF_EXPLANATION_NOT_AUTHORITY",
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
    check(`skill:${root}:${skill}:manifest`, manifest?.requires?.sdk === ">=110.0.0 <111.0.0" && manifest?.requires?.registryDigest === RECEIZ_V110_REGISTRY_DIGEST, manifest?.requires?.registryDigest ?? "missing");
  }
}

const lockfile = readFileSync("pnpm-lock.yaml", "utf8");
for (const file of ["receiz-sdk-110.0.0.tgz", "receiz-mcp-server-110.0.0.tgz", "receiz-ai-skills-110.0.0.tgz"]) {
  check(`lockfile:${file}`, lockfile.includes(file), file);
}

const conformance = await runReceizConformance();
check("conformance", conformance.ok && conformance.summary.failed === 0, `${conformance.summary.passed} passed; ${conformance.summary.failed} failed`);

const ok = checks.every((item) => item.ok);
console.log(JSON.stringify({
  schema: "receiz.app.v110.release-lock.v1",
  ok,
  releaseVersion: RECEIZ_RELEASE_VERSION,
  registryDigest: RECEIZ_V110_REGISTRY_DIGEST,
  appRegistryDigest: registryDigest,
  checks,
  authority: { releaseLockIsAdmission: false, strongerTruth: "sealed-receiz-proof-object" },
}, null, 2));
if (!ok) process.exit(1);
