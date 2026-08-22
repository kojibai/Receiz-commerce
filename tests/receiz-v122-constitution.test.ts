import { RECEIZ_MCP_TOOLS } from "@receiz/mcp-server";
import { RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST } from "@receiz/sdk/compiler";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter";

const V122_REGISTRY = "ed65956a16dd5f0d76d04db2f4a651fc43eb0a71cef64afd53576aa782dc9896";
const V122_MATRIX = "bd1d7ccf1543e2484df68e3025c7376f8ae37cafe1ca0d7c9cd9f52f6342b325";
const V122_MCP_TOOLS = [
  "receiz_v122_subject_admit",
  "receiz_v122_subject_state",
  "receiz_v122_subject_export_edge_bundle",
  "receiz_v122_subject_import_edge_bundle",
  "receiz_v122_subject_access_binding",
  "receiz_v122_subject_access_key_publish",
  "receiz_v122_world_plan_private",
  "receiz_v122_world_validate_transaction",
  "receiz_v122_world_execute_transaction",
  "receiz_v122_world_execution",
  "receiz_v122_world_execution_by_idempotency",
  "receiz_v122_world_additions",
  "receiz_v122_mandate_issue",
  "receiz_v122_mandate_state",
  "receiz_v122_mandate_revoke",
  "receiz_v122_multi_world_plan",
  "receiz_v122_multi_world_execute",
  "receiz_v122_value_plan_settlement",
  "receiz_v122_value_plan_reserve",
] as const;

describe("Receiz v122 coordinated identity", () => {
  it("rejects a partial upgrade across SDK, registry, matrix, MCP, and AI skills", () => {
    const adapter = createReceizCommerceAdapter({ baseUrl: "https://receiz.invalid" });
    const skills = JSON.parse(readFileSync("ai-skills/skills.json", "utf8")) as {
      version: string;
      registryDigest: string;
      operationMatrixDigest: string;
      counts: { skills: number };
    };
    const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));

    assert.equal(adapter.sdkVersion, "122.0.0");
    assert.equal(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST, V122_MATRIX);
    assert.equal(skills.version, "122.0.0");
    assert.equal(skills.registryDigest, V122_REGISTRY);
    assert.equal(skills.operationMatrixDigest, V122_MATRIX);
    assert.equal(skills.counts.skills, 40);
    assert.equal(V122_MCP_TOOLS.length, 19);
    for (const name of V122_MCP_TOOLS) assert.equal(toolNames.has(name), true, name);
  });
});
