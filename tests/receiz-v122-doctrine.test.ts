import assert from "node:assert/strict";
import { it } from "node:test";
import { RECEIZ_V122_DOCTRINE } from "../src/lib/receiz/v122/doctrine";

it("teaches every v122 MCP operation with source-first evidence", () => {
  assert.equal(RECEIZ_V122_DOCTRINE.length, 19);
  assert.equal(new Set(RECEIZ_V122_DOCTRINE.map((entry) => entry.mcpTool)).size, 19);
  for (const entry of RECEIZ_V122_DOCTRINE) {
    assert.equal(entry.mcpAuthority, false);
    assert.ok(entry.strongestSource.length > 0);
    assert.ok(entry.sdkOperation.length > 0);
    assert.ok(entry.mcpTool.startsWith("receiz_v122_"));
    assert.ok(entry.prohibitedShortcut.length > 0);
    assert.ok(entry.requiredEvidence.length > 0);
  }
});
