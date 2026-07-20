import {
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V112_ARTIFACT_LAWS,
  RECEIZ_V113_GLOBAL_COMMIT_DOMAIN,
  RECEIZ_V113_PROTOCOL_LIMITS,
  RECEIZ_V113_REGISTRY_DIGEST,
  admitReceizArtifact,
  commitArtifactTransition,
  createPublicProofProjection,
  createReceizArtifactAdmissionEngine,
  createReceizAdmissionEngine,
  createReceizBrowserAdmissionStore,
  createReceizCausalHistory,
  createReceizRemoteDomain,
  describeReceizCapabilities,
  describeReceizError,
  digestReceizAuthority,
  evaluateReceizLawSet,
  loadReceizCurrentRegistry,
  planArtifactAppend,
  sealArtifactTransitionCandidate,
  signReceizCapability,
  validateReceizConstitutionRegistry,
  verifyReceizArtifactAdmission,
} from "@receiz/sdk";
import { createReceizEmulator, runReceizConformance } from "@receiz/sdk/testing";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Receiz v113 dependency contract", () => {
  it("pins the supported v113 SDK, MCP, AI skills, registry, and vendored publication bridge", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
      scripts?: Record<string, string>;
      pnpm?: { overrides?: Record<string, string> };
    };

    assert.equal(RECEIZ_SDK_VERSION, "113.0.0");
    assert.equal(RECEIZ_RELEASE_VERSION, "113.0.0");
    assert.equal(RECEIZ_RULESET_VERSION, "113.0.0");
    assert.equal(RECEIZ_V113_REGISTRY_DIGEST, "4c4aa85f9785d205dcf7e4e5109837a83f8c3bf8e166130ae7e87353f299c637");
    assert.deepEqual(RECEIZ_V112_ARTIFACT_LAWS, Array.from({ length: 30 }, (_, index) => `ARTIFACT-${String(index + 1).padStart(3, "0")}`));
    assert.equal(pkg.dependencies["@receiz/sdk"], "113.0.0");
    assert.equal(pkg.dependencies["@receiz/mcp-server"], "113.0.0");
    assert.equal(pkg.dependencies["@receiz/ai-skills"], "113.0.0");
    assert.equal(pkg.scripts?.["receiz:check"], "receiz app check --target 113.0.0 --json");
    assert.equal(pkg.scripts?.["receiz:conformance"], "receiz conformance");
    assert.equal(pkg.scripts?.["validate:ai-skills"], "node ai-skills/scripts/validate-skills.mjs");
    assert.equal(pkg.pnpm?.overrides?.postcss, ">=8.5.10");
    assert.equal(pkg.pnpm?.overrides?.["@receiz/sdk"], "file:vendor/receiz-sdk-113.0.0.tgz");
    assert.equal(pkg.pnpm?.overrides?.["@receiz/mcp-server"], "file:vendor/receiz-mcp-server-113.0.0.tgz");
    assert.equal(pkg.pnpm?.overrides?.["@receiz/ai-skills"], "file:vendor/receiz-ai-skills-113.0.0.tgz");
  });

  it("documents the supported MCP pair and authoritative theme publication", () => {
    const readme = readFileSync("README.md", "utf8");
    const rails = readFileSync("docs/SDK_RAILS.md", "utf8");
    const skillsReadme = readFileSync("ai-skills/README.md", "utf8");
    const mcpToolMap = readFileSync("ai-skills/receiz-mcp-agent-skill/resources/mcp-tool-map.md", "utf8");
    const adapter = readFileSync("src/lib/receiz/adapter.ts", "utf8");

    assert.match(readme, /@receiz\/mcp-server@113\.0\.0/);
    assert.match(readme, /@receiz\/ai-skills@113\.0\.0/);
    assert.match(readme, /Publish theme/);
    assert.match(rails, /@receiz\/sdk@113\.0\.0/);
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
    assert.match(adapter, /admitArtifact/);
    assert.match(adapter, /signIdentityCapability/);
    assert.match(adapter, /createBrowserAdmissionStore/);
    assert.match(adapter, /planArtifactAppend/);
    assert.match(adapter, /sealArtifactTransitionCandidate/);
    assert.match(adapter, /commitArtifactTransition/);
    assert.match(adapter, /createRemoteCoordinationDomain/);
    assert.doesNotMatch(adapter, /planArtifactRecovery/);
    assert.doesNotMatch(adapter, /commitArtifactRecovery/);
    assert.doesNotMatch(adapter, /ReceizPortableAsset/);
    assert.doesNotMatch(adapter, /\bsealArtifact\(/);
  });

  it("keeps the v113 Node-only compiler outside browser bundles", () => {
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

  it("exposes canonical v113 verification, global coordination, projections, capabilities, errors, emulator, and zero-network conformance", async () => {
    assert.equal(typeof describeReceizCapabilities, "function");
    assert.equal(typeof describeReceizError, "function");
    assert.equal(typeof createReceizEmulator, "function");
    assert.equal(typeof runReceizConformance, "function");
    assert.equal(typeof validateReceizConstitutionRegistry, "function");
    assert.equal(typeof evaluateReceizLawSet, "function");
    assert.equal(typeof createReceizAdmissionEngine, "function");
    assert.equal(typeof createReceizCausalHistory, "function");
    assert.equal(typeof createReceizArtifactAdmissionEngine, "function");
    assert.equal(typeof createReceizBrowserAdmissionStore, "function");
    assert.equal(typeof createReceizRemoteDomain, "function");
    assert.equal(typeof admitReceizArtifact, "function");
    assert.equal(typeof planArtifactAppend, "function");
    assert.equal(typeof signReceizCapability, "function");
    assert.equal(typeof sealArtifactTransitionCandidate, "function");
    assert.equal(typeof commitArtifactTransition, "function");
    assert.equal(typeof loadReceizCurrentRegistry, "function");
    assert.equal(typeof createPublicProofProjection, "function");
    assert.equal(typeof verifyReceizArtifactAdmission, "function");
    assert.equal(typeof digestReceizAuthority, "function");

    const descriptor = describeReceizCapabilities();
    assert.equal(descriptor.schema, "receiz.sdk.capability_descriptor.v1");
    assert.equal(descriptor.packageCompatibility.sdk, ">=113.0.0 <114.0.0");
    assert.equal(RECEIZ_V113_GLOBAL_COMMIT_DOMAIN.value, "receiz.com/global/v1");
    assert.equal(RECEIZ_V113_PROTOCOL_LIMITS.reconciliationAdditions, 64);

    const report = await runReceizConformance();
    assert.equal(report.schema, "receiz.sdk.conformance_report.v1");
    // The official v113 package retains the v112 conformance-vector schema for compatibility.
    assert.equal(report.sdkVersion, "112.0.0");
    assert.equal(report.ok, true);
    assert.equal(report.summary.failed, 0);
    assert.equal(report.summary.networkCalls, 0);
    assert.equal(report.summary.dbCalls, 0);
  });
});
