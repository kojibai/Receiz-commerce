import { RECEIZ_MCP_TOOLS } from "@receiz/mcp-server";
import { RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST } from "@receiz/sdk/compiler";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter";

const V124_REGISTRY = "d02429151b0bcebdaeb89485792e377afc55130f9a25e07982c1c88221314247";
const V124_MATRIX = "540d1c1bf39f1b288b257c79a6e020bdcc5e587fc9b7dbf6b7aaa5d082e20ad5";
const V123_MCP_TOOLS = [
  "receiz_v123_world_plan_command_v122",
  "receiz_v123_world_plan_transaction_v122",
  "receiz_v123_value_execute_settlement",
  "receiz_v123_value_execute_reserve",
  "receiz_v123_value_execution_by_idempotency",
  "receiz_v123_subject_resolve_namespaces",
  "receiz_v123_identity_exchange_proof_authority",
  "receiz_v123_auth_granted_scopes",
] as const;

describe("Receiz v124 coordinated identity", () => {
  it("rejects a partial upgrade across SDK, registry, matrix, MCP, and AI skills", () => {
    const adapter = createReceizCommerceAdapter({ baseUrl: "https://receiz.invalid" });
    const skills = JSON.parse(readFileSync("ai-skills/skills.json", "utf8")) as {
      version: string;
      registryDigest: string;
      operationMatrixDigest: string;
      counts: { skills: number };
    };
    const toolNames = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));

    assert.equal(adapter.sdkVersion, "124.0.1");
    assert.equal(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST, V124_MATRIX);
    assert.equal(skills.version, "124.0.1");
    assert.equal(skills.registryDigest, V124_REGISTRY);
    assert.equal(skills.operationMatrixDigest, V124_MATRIX);
    assert.equal(skills.counts.skills, 42);
    assert.equal(V123_MCP_TOOLS.length, 8);
    for (const name of V123_MCP_TOOLS) assert.equal(toolNames.has(name), true, name);
  });
});
