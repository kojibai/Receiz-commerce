#!/usr/bin/env node
import {
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V108_ARTIFACT_LAWS,
  RECEIZ_V108_REGISTRY_DIGEST,
  digestReceizConstitution,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import { runReceizConformance } from "@receiz/sdk/testing";
import { RECEIZ_MCP_TOOLS } from "@receiz/mcp-server";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const expectedVersion = "108.0.0";
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
  "receiz-sdk-108.0.0.tgz": "sha512-LP4bZ/y4Wh8LLtdGMTRg3NeWdeS8PMyBXOWD+pNGXH3XqNgMArP4oGMiibjU7fNCG4YUhyC1QSMmeIOIU7k4Dg==",
  "receiz-mcp-server-108.0.0.tgz": "sha512-F/PwPmjkAAm9hygxSnZN+lU3BfFTNvHpivV5T//o9HxuXDHyPmnSYJBkHGZFShJmQE6i7xNzwtiUBLOeZOZ5OA==",
  "receiz-ai-skills-108.0.0.tgz": "sha512-/bOGln1erqOyJuO3z1hjaE5KhgMHepcgbcahgqBb/W6BVfsRLZe8INDpZDaJt6iOxqQGW0awzNhtfqHrP24zCA==",
};

const checks = [];
const check = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

const pkg = json("package.json");
for (const name of ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"]) {
  check(`package:${name}`, pkg.dependencies?.[name] === expectedVersion, pkg.dependencies?.[name]);
}
for (const [name, file] of Object.entries({
  "@receiz/sdk": "receiz-sdk-108.0.0.tgz",
  "@receiz/mcp-server": "receiz-mcp-server-108.0.0.tgz",
  "@receiz/ai-skills": "receiz-ai-skills-108.0.0.tgz",
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
check("registry:canonical-v108-chain", registryPayload.previousRegistryDigest === RECEIZ_V108_REGISTRY_DIGEST, registryPayload.previousRegistryDigest);
check("registry:artifact-laws", RECEIZ_V108_ARTIFACT_LAWS.length === 10, RECEIZ_V108_ARTIFACT_LAWS.join(","));

const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
for (const name of requiredTools) check(`mcp:${name}`, toolNames.has(name), name);

for (const skill of requiredDoctrineSkills) {
  for (const root of ["ai-skills", "node_modules/@receiz/ai-skills"]) {
    const manifestPath = `${root}/${skill}/manifest.json`;
    const skillPath = `${root}/${skill}/SKILL.md`;
    check(`skill:${root}:${skill}:doctrine`, existsSync(skillPath), existsSync(skillPath) ? "present" : "missing");
    if (!requiredManifestSkills.has(skill)) continue;
    const manifest = existsSync(manifestPath) ? json(manifestPath) : null;
    check(`skill:${root}:${skill}:manifest`, manifest?.requires?.sdk === ">=108.0.0 <109.0.0" && manifest?.requires?.registryDigest === RECEIZ_V108_REGISTRY_DIGEST, manifest?.requires?.registryDigest ?? "missing");
  }
}

const lockfile = readFileSync("pnpm-lock.yaml", "utf8");
for (const file of ["receiz-sdk-108.0.0.tgz", "receiz-mcp-server-108.0.0.tgz", "receiz-ai-skills-108.0.0.tgz"]) {
  check(`lockfile:${file}`, lockfile.includes(file), file);
}

const conformance = await runReceizConformance();
check("conformance", conformance.ok && conformance.summary.failed === 0, `${conformance.summary.passed} passed; ${conformance.summary.failed} failed`);

const ok = checks.every((item) => item.ok);
console.log(JSON.stringify({
  schema: "receiz.app.v108.release-lock.v1",
  ok,
  releaseVersion: RECEIZ_RELEASE_VERSION,
  registryDigest: RECEIZ_V108_REGISTRY_DIGEST,
  appRegistryDigest: registryDigest,
  checks,
  authority: { releaseLockIsAdmission: false, strongerTruth: "sealed-receiz-proof-object" },
}, null, 2));
if (!ok) process.exit(1);
