import {
  RECEIZ_CURRENT_REGISTRY_DIGEST,
  RECEIZ_RELEASE_VERSION,
  RECEIZ_RULESET_VERSION,
  RECEIZ_SDK_VERSION,
  RECEIZ_V124_APP_COMPATIBLE_SDK_RANGE,
  RECEIZ_V124_REGISTRY_DIGEST,
} from "@receiz/sdk";
import { RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX, RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST } from "@receiz/sdk/compiler";
import { RECEIZ_MCP_TOOLS, RECEIZ_V124_MCP_TOOL_NAMES } from "@receiz/mcp-server";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { RECEIZ_V124_CONTRACT } from "../src/lib/receiz/v124/contract";

describe("Receiz v124.0.1 coordinated release identity", () => {
  it("keeps package, release, ruleset, registry, and matrix coordinates distinct and exact", () => {
    assert.equal(RECEIZ_SDK_VERSION, "124.0.1");
    assert.equal(RECEIZ_RELEASE_VERSION, "124.0.1");
    assert.equal(RECEIZ_RULESET_VERSION, "124.0.0");
    assert.equal(RECEIZ_V124_APP_COMPATIBLE_SDK_RANGE, ">=124.0.0 <125.0.0");
    assert.equal(RECEIZ_CURRENT_REGISTRY_DIGEST, RECEIZ_V124_REGISTRY_DIGEST);
    assert.equal(RECEIZ_CURRENT_REGISTRY_DIGEST, RECEIZ_V124_CONTRACT.registryDigest);
    assert.equal(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST, RECEIZ_V124_CONTRACT.operationMatrixDigest);
    assert.equal(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length, 53);
  });

  it("ships the complete 163-tool server and all 22 v124 tools", () => {
    const names = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
    assert.equal(RECEIZ_MCP_TOOLS.length, 163);
    assert.equal(RECEIZ_V124_MCP_TOOL_NAMES.length, 22);
    assert.deepEqual(RECEIZ_V124_MCP_TOOL_NAMES, RECEIZ_V124_CONTRACT.mcpTools);
    assert.equal(RECEIZ_V124_MCP_TOOL_NAMES.every((name) => names.has(name)), true);
  });

  it("mirrors the exact v124.0.1 AI doctrine", () => {
    const skills = JSON.parse(readFileSync("ai-skills/skills.json", "utf8"));
    assert.equal(skills.schema, "receiz.ai-skills-index.v124");
    assert.equal(skills.version, "124.0.1");
    assert.equal(skills.rulesetVersion, "124.0.0");
    assert.equal(skills.registryDigest, RECEIZ_V124_CONTRACT.registryDigest);
    assert.equal(skills.operationMatrixDigest, RECEIZ_V124_CONTRACT.operationMatrixDigest);
    assert.deepEqual(skills.currentMcpV124Tools, RECEIZ_V124_MCP_TOOL_NAMES);
    assert.deepEqual(skills.counts, { skills: 42, manifests: 36, openaiAgentPrompts: 33 });
  });
});
