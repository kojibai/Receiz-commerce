import {
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V109_ARTIFACT_LAWS,
  RECEIZ_V109_REGISTRY_DIGEST,
  createReceizAdmissionEngine,
  createReceizCausalHistory,
  describeReceizCapabilities,
  describeReceizError,
  evaluateReceizLawSet,
  validateReceizConstitutionRegistry,
} from "@receiz/sdk";
import { createReceizEmulator, runReceizConformance } from "@receiz/sdk/testing";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Receiz v109 dependency contract", () => {
  it("pins the supported v109 SDK, MCP, AI skills, registry, and vendored publication bridge", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
      scripts?: Record<string, string>;
      pnpm?: { overrides?: Record<string, string> };
    };

    assert.equal(RECEIZ_SDK_VERSION, "109.0.0");
    assert.equal(RECEIZ_RELEASE_VERSION, "109.0.0");
    assert.equal(RECEIZ_RULESET_VERSION, "109.0.0");
    assert.equal(RECEIZ_V109_REGISTRY_DIGEST, "17f76b37c9fcd46f710239b5c1660b03cc34ec64bed30d1cc45c18d5d40eab70");
    assert.deepEqual(RECEIZ_V109_ARTIFACT_LAWS, ["ARTIFACT-001", "ARTIFACT-002", "ARTIFACT-003", "ARTIFACT-004", "ARTIFACT-005", "ARTIFACT-006", "ARTIFACT-007", "ARTIFACT-008", "ARTIFACT-009", "ARTIFACT-010", "ARTIFACT-011"]);
    assert.equal(pkg.dependencies["@receiz/sdk"], "109.0.0");
    assert.equal(pkg.dependencies["@receiz/mcp-server"], "109.0.0");
    assert.equal(pkg.dependencies["@receiz/ai-skills"], "109.0.0");
    assert.equal(pkg.scripts?.["receiz:check"], "receiz app check --target 109.0.0 --json");
    assert.equal(pkg.scripts?.["receiz:conformance"], "receiz conformance");
    assert.equal(pkg.scripts?.["validate:ai-skills"], "node --import tsx ai-skills/scripts/validate-skills.ts");
    assert.equal(pkg.pnpm?.overrides?.postcss, ">=8.5.10");
    assert.equal(pkg.pnpm?.overrides?.["@receiz/sdk"], "file:vendor/receiz-sdk-109.0.0.tgz");
    assert.equal(pkg.pnpm?.overrides?.["@receiz/mcp-server"], "file:vendor/receiz-mcp-server-109.0.0.tgz");
    assert.equal(pkg.pnpm?.overrides?.["@receiz/ai-skills"], "file:vendor/receiz-ai-skills-109.0.0.tgz");
  });

  it("documents the supported MCP pair and authoritative theme publication", () => {
    const readme = readFileSync("README.md", "utf8");
    const rails = readFileSync("docs/SDK_RAILS.md", "utf8");
    const skillsReadme = readFileSync("ai-skills/README.md", "utf8");
    const mcpToolMap = readFileSync("ai-skills/receiz-mcp-agent-skill/resources/mcp-tool-map.md", "utf8");
    const adapter = readFileSync("src/lib/receiz/adapter.ts", "utf8");

    assert.match(readme, /@receiz\/mcp-server@109\.0\.0/);
    assert.match(readme, /@receiz\/ai-skills@109\.0\.0/);
    assert.match(readme, /Publish theme/);
    assert.match(rails, /@receiz\/sdk@109\.0\.0/);
    assert.match(rails, /authoritative public-store revision/);
    assert.match(rails, /native Record projection before sealing/);
    assert.match(skillsReadme, /published as `@receiz\/ai-skills`/);
    assert.match(mcpToolMap, /receiz_inspect_offline_file/);
    assert.match(mcpToolMap, /receiz_release_qualify/);
    assert.doesNotMatch(mcpToolMap, new RegExp(["receiz", "verify", "offline", "file"].join("_")));
    assert.match(adapter, /createProofObject/);
    assert.match(adapter, /ReceizProofObjectCreateInput/);
    assert.match(adapter, /verifyAndOpenArtifact/);
    assert.match(adapter, /downloadArtifact/);
    assert.match(adapter, /claimBearerArtifact/);
    assert.match(adapter, /updateIdentityProfile/);
    assert.doesNotMatch(adapter, /ReceizPortableAsset/);
    assert.doesNotMatch(adapter, /sealArtifact/);
  });

  it("keeps the v109 Node-only compiler outside browser bundles", () => {
    const nextConfig = readFileSync("next.config.mjs", "utf8");
    const sdkPackage = JSON.parse(readFileSync("node_modules/@receiz/sdk/package.json", "utf8")) as {
      exports?: Record<string, unknown>;
    };
    const sdkRuntime = readFileSync("node_modules/@receiz/sdk/dist/index.js", "utf8");

    assert.ok(sdkPackage.exports?.["./compiler"]);
    assert.ok(sdkPackage.exports?.["./testing"]);
    assert.doesNotMatch(sdkRuntime, /projectInspection|projectApply|node:fs|node:path/);
    assert.doesNotMatch(nextConfig, /NormalModuleReplacementPlugin|"fs\/promises": false/);
  });

  it("exposes canonical v109 constitution, admission, causal history, capabilities, errors, emulator, and zero-network conformance", async () => {
    assert.equal(typeof describeReceizCapabilities, "function");
    assert.equal(typeof describeReceizError, "function");
    assert.equal(typeof createReceizEmulator, "function");
    assert.equal(typeof runReceizConformance, "function");
    assert.equal(typeof validateReceizConstitutionRegistry, "function");
    assert.equal(typeof evaluateReceizLawSet, "function");
    assert.equal(typeof createReceizAdmissionEngine, "function");
    assert.equal(typeof createReceizCausalHistory, "function");

    const descriptor = describeReceizCapabilities();
    assert.equal(descriptor.schema, "receiz.sdk.capability_descriptor.v1");
    assert.equal(descriptor.packageCompatibility.sdk, ">=109.0.0 <110.0.0");

    const report = await runReceizConformance();
    assert.equal(report.schema, "receiz.sdk.conformance_report.v1");
    assert.equal(report.sdkVersion, "109.0.0");
    assert.equal(report.ok, true);
    assert.equal(report.summary.failed, 0);
    assert.equal(report.summary.networkCalls, 0);
    assert.equal(report.summary.dbCalls, 0);
  });
});
