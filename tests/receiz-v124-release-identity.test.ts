import {
  RECEIZ_CURRENT_REGISTRY_DIGEST,
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  describeReceizCapabilities,
} from "@receiz/sdk";
import { RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX, RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST } from "@receiz/sdk/compiler";
import { RECEIZ_MCP_TOOLS, RECEIZ_V124_MCP_TOOL_NAMES } from "@receiz/mcp-server";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { RECEIZ_V124_CONTRACT } from "../src/lib/receiz/v124/contract";

describe("Receiz v126.0.0 coordinated release identity", () => {
  it("keeps package, release, ruleset, registry, and matrix coordinates distinct and exact", () => {
    assert.equal(RECEIZ_SDK_VERSION, "126.0.0");
    assert.equal(RECEIZ_RELEASE_VERSION, "126.0.0");
    assert.equal(RECEIZ_RULESET_VERSION, "126.0.0");
    assert.equal(describeReceizCapabilities().packageCompatibility.sdk, ">=126.0.0 <127.0.0");
    assert.equal(RECEIZ_CURRENT_REGISTRY_DIGEST, RECEIZ_V124_CONTRACT.registryDigest);
    assert.equal(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST, RECEIZ_V124_CONTRACT.operationMatrixDigest);
    assert.equal(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length, 60);
  });

  it("ships the complete 221-tool server and retained v124 runtime tools", () => {
    const names = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
    assert.equal(RECEIZ_MCP_TOOLS.length, 221);
    assert.equal(RECEIZ_V124_MCP_TOOL_NAMES.length, 26);
    assert.ok(RECEIZ_V124_CONTRACT.mcpTools.every((name) => names.has(name)));
    assert.equal(RECEIZ_V124_MCP_TOOL_NAMES.every((name) => names.has(name)), true);
    assert.equal(names.has("receiz_material_url_open"), true);
    assert.equal(names.has("receiz_sealed_kai_moment"), true);
  });

  it("mirrors the exact v126.0.0 AI doctrine", () => {
    const skills = JSON.parse(readFileSync("ai-skills/skills.json", "utf8"));
    assert.equal(skills.schema, "receiz.ai-skills-index.v126");
    assert.equal(skills.version, "126.0.0");
    assert.equal(skills.rulesetVersion, "126.0.0");
    assert.equal(skills.registryDigest, RECEIZ_V124_CONTRACT.registryDigest);
    assert.equal(skills.operationMatrixDigest, RECEIZ_V124_CONTRACT.operationMatrixDigest);
    assert.deepEqual(skills.currentMcpV124Tools, RECEIZ_V124_MCP_TOOL_NAMES);
    assert.deepEqual(skills.counts, { skills: 42, manifests: 36, openaiAgentPrompts: 33 });
  });
});
