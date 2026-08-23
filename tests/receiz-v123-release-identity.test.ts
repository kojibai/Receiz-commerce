import { RECEIZ_MCP_TOOLS, RECEIZ_V123_MCP_TOOL_NAMES } from "@receiz/mcp-server";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("Receiz v123 compatibility retained by v124", () => {
  it("retains every v123 MCP outcome in the larger current inventory", () => {
    assert.equal(RECEIZ_MCP_TOOLS.length, 163);
    assert.equal(RECEIZ_V123_MCP_TOOL_NAMES.length, 8);
    const names = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
    assert.equal(RECEIZ_V123_MCP_TOOL_NAMES.every((name) => names.has(name)), true);
  });
});
