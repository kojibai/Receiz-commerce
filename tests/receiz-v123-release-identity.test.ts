import { RECEIZ_CURRENT_REGISTRY_DIGEST, RECEIZ_RELEASE_VERSION, RECEIZ_RULESET_VERSION, RECEIZ_SDK_VERSION } from "@receiz/sdk";
import {
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX,
  RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
} from "@receiz/sdk/compiler";
import { RECEIZ_MCP_TOOLS, RECEIZ_V123_MCP_TOOL_NAMES } from "@receiz/mcp-server";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const VERSION = "123.0.0";
const REGISTRY = "945a581d1fc49c2dc18fbe8c129771ef464b8a58b96188bce561e88ae8b6ceeb";
const MATRIX = "e08cec3e3ad22c20ddd6c08169ece19f094c366214d6d6b4dc432cd97558e2c5";

describe("Receiz v123 coordinated release identity", () => {
  it("pins the SDK, ruleset, registry, and complete operation matrix", () => {
    assert.equal(RECEIZ_SDK_VERSION, VERSION);
    assert.equal(RECEIZ_RELEASE_VERSION, VERSION);
    assert.equal(RECEIZ_RULESET_VERSION, VERSION);
    assert.equal(RECEIZ_CURRENT_REGISTRY_DIGEST, REGISTRY);
    assert.equal(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST, MATRIX);
    assert.equal(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length, 36);
  });

  it("ships every MCP tool and every v123 MCP outcome", () => {
    assert.equal(RECEIZ_MCP_TOOLS.length, 141);
    assert.equal(RECEIZ_V123_MCP_TOOL_NAMES.length, 8);
    const names = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
    assert.equal(RECEIZ_V123_MCP_TOOL_NAMES.every((name) => names.has(name)), true);
  });

  it("ships the exact 42-skill v123 doctrine", () => {
    const skills = JSON.parse(readFileSync("ai-skills/skills.json", "utf8")) as {
      schema: string;
      version: string;
      registryDigest: string;
      operationMatrixDigest: string;
      counts: { skills: number };
      skills: Array<{ name: string }>;
    };
    assert.equal(skills.schema, "receiz.ai-skills-index.v123");
    assert.equal(skills.version, VERSION);
    assert.equal(skills.registryDigest, REGISTRY);
    assert.equal(skills.operationMatrixDigest, MATRIX);
    assert.equal(skills.counts.skills, 42);
    assert.equal(skills.skills.some((skill) => skill.name === "receiz-proof-authority"), true);
    assert.equal(skills.skills.some((skill) => skill.name === "receiz-value-execution"), true);
  });
});
