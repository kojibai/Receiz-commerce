import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { RECEIZ_V122_MCP_TOOL_NAMES } from "@receiz/mcp-server";
import { RECEIZ_V122_CONTRACT } from "../src/lib/receiz/v122/contract";

describe("Receiz v105 capability discovery", () => {
  it("derives optional UI rails from the canonical SDK descriptor", () => {
    const source = readFileSync("src/lib/receiz/capabilities.ts", "utf8");

    assert.match(source, /describeReceizCapabilities/);
    assert.doesNotMatch(source, /createReceizClient|sdkNamespaceReady/);
  });
});

describe("Receiz v122 mechanical authority boundary", () => {
  it("maps every maintained MCP operation while hardcoding MCP beneath source", () => {
    assert.deepEqual([...RECEIZ_V122_CONTRACT.mcpTools].sort(), [...RECEIZ_V122_MCP_TOOL_NAMES].sort());
    assert.equal(RECEIZ_V122_CONTRACT.authority.mcpAuthority, false);
    const source = readFileSync("src/lib/receiz/v122/authority-report.ts", "utf8");
    assert.match(source, /mcpAuthority:\s*false/);
    assert.doesNotMatch(source, /mcpAuthority:\s*(?:boolean|true)/);
  });

  it("keeps v122 routes free of direct client construction and verified projection claims", () => {
    for (const path of [
      "app/api/receiz/v122/subjects/route.ts",
      "app/api/receiz/v122/mandates/route.ts",
      "app/api/receiz/v122/world/route.ts",
      "app/api/receiz/v122/value/route.ts",
    ]) {
      const source = readFileSync(path, "utf8");
      assert.doesNotMatch(source, /createReceizClient/);
      assert.doesNotMatch(source, /projection[^\n]{0,80}verified\s*:\s*true/i);
    }
  });
});
