import {
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V112_ARTIFACT_LAWS,
  RECEIZ_V113_GLOBAL_COMMIT_DOMAIN,
  RECEIZ_V114_PROTOCOL_LIMITS,
  RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST,
  RECEIZ_LIVING_SUBJECT_SCHEMAS,
  RECEIZ_V123_REGISTRY_DIGEST,
  admitReceizArtifact,
  commitArtifactTransition,
  createPublicProofProjection,
  createReceizLivingSubjectRuntime,
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
import { createReceizEmulator, runReceizConformance, runReceizLivingSubjectConformanceV120 } from "@receiz/sdk/testing";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Receiz v123 dependency contract", () => {
  it("pins the supported public v123 SDK, MCP, AI skills, and registry contract", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
      scripts?: Record<string, string>;
      pnpm?: { overrides?: Record<string, string> };
    };

    assert.equal(RECEIZ_SDK_VERSION, "123.0.0");
    assert.equal(RECEIZ_RELEASE_VERSION, "123.0.0");
    assert.equal(RECEIZ_RULESET_VERSION, "123.0.0");
    assert.equal(RECEIZ_V123_REGISTRY_DIGEST, "945a581d1fc49c2dc18fbe8c129771ef464b8a58b96188bce561e88ae8b6ceeb");
    assert.equal(RECEIZ_LIVING_SUBJECT_REDUCER_DIGEST, "5694662e2acc8b886ac9697ffad202b411d7e66c5f26f9106ee0768df7c7b8c8");
    assert.equal(Object.keys(RECEIZ_LIVING_SUBJECT_SCHEMAS).length, 30);
    assert.deepEqual(RECEIZ_V112_ARTIFACT_LAWS, Array.from({ length: 30 }, (_, index) => `ARTIFACT-${String(index + 1).padStart(3, "0")}`));
    assert.equal(pkg.dependencies["@receiz/sdk"], "123.0.0");
    assert.equal(pkg.dependencies["@receiz/mcp-server"], "123.0.0");
    assert.equal(pkg.dependencies["@receiz/ai-skills"], "123.0.0");
    assert.equal(pkg.scripts?.["receiz:check"], "receiz app check --target 123.0.0 --json");
    assert.equal(pkg.scripts?.["receiz:conformance"], "receiz conformance");
    assert.equal(pkg.scripts?.["validate:ai-skills"], "node ai-skills/scripts/validate-skills.mjs");
    assert.equal(pkg.pnpm?.overrides?.postcss, ">=8.5.10");
    assert.equal(pkg.pnpm?.overrides?.["@receiz/sdk"], undefined);
    assert.equal(pkg.pnpm?.overrides?.["@receiz/mcp-server"], undefined);
    assert.equal(pkg.pnpm?.overrides?.["@receiz/ai-skills"], undefined);
  });

  it("mirrors the published v123 AI-skills contract into the repository", () => {
    const skillsIndex = JSON.parse(readFileSync("ai-skills/skills.json", "utf8")) as {
      schema?: string;
      version?: string;
      registryDigest?: string;
      operationMatrixDigest?: string;
      skills?: unknown[];
    };

    assert.equal(skillsIndex.schema, "receiz.ai-skills-index.v123");
    assert.equal(skillsIndex.version, "123.0.0");
    assert.equal(skillsIndex.registryDigest, "945a581d1fc49c2dc18fbe8c129771ef464b8a58b96188bce561e88ae8b6ceeb");
    assert.equal(skillsIndex.operationMatrixDigest, "e08cec3e3ad22c20ddd6c08169ece19f094c366214d6d6b4dc432cd97558e2c5");
    assert.equal(skillsIndex.skills?.length, 42);
  });

  it("documents the supported MCP pair and authoritative theme publication", () => {
    const readme = readFileSync("README.md", "utf8");
    const rails = readFileSync("docs/SDK_RAILS.md", "utf8");
    const skillsReadme = readFileSync("ai-skills/README.md", "utf8");
    const mcpToolMap = readFileSync("ai-skills/receiz-mcp-agent-skill/resources/mcp-tool-map.md", "utf8");
    const adapter = readFileSync("src/lib/receiz/adapter.ts", "utf8");

    assert.match(readme, /@receiz\/mcp-server@123\.0\.0/);
    assert.match(readme, /@receiz\/ai-skills@123\.0\.0/);
    assert.match(readme, /Publish theme/);
    assert.match(rails, /@receiz\/sdk@123\.0\.0/);
    assert.match(rails, /signed public-store append/);
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

  it("keeps the v123 Node-only compiler outside browser bundles", () => {
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

  it("exposes canonical v123 runtime verification while retaining the upstream conformance schema label", async () => {
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
    assert.equal(typeof createReceizLivingSubjectRuntime, "function");
    assert.equal(typeof runReceizLivingSubjectConformanceV120, "function");

    const descriptor = describeReceizCapabilities();
    assert.equal(descriptor.schema, "receiz.sdk.capability_descriptor.v1");
    assert.equal(descriptor.packageCompatibility.sdk, ">=123.0.0 <124.0.0");
    assert.equal(RECEIZ_V113_GLOBAL_COMMIT_DOMAIN.value, "receiz.com/global/v1");
    assert.equal(RECEIZ_V114_PROTOCOL_LIMITS.reconciliationAdditions, 64);

    const report = await runReceizConformance();
    assert.equal(report.schema, "receiz.sdk.conformance_report.v1");
    assert.equal(report.sdkVersion, "121.0.0");
    assert.equal(report.ok, true);
    assert.equal(report.summary.failed, 0);
    assert.equal(report.summary.networkCalls, 0);
    assert.equal(report.summary.dbCalls, 0);

    const livingReport = await runReceizLivingSubjectConformanceV120();
    assert.equal(livingReport.schema, "receiz.living-subject.conformance.v120");
    assert.equal(livingReport.ok, true);
    assert.equal(livingReport.summary.passed, 19);
    assert.equal(livingReport.summary.failed, 0);
    assert.equal(livingReport.summary.writesOnFailure, 0);
    assert.equal(livingReport.summary.networkCalls, 0);
    assert.equal(livingReport.summary.dbCalls, 0);
  });
});
