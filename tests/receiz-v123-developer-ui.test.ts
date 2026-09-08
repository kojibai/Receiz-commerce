import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";

it("publishes v124 SDK, MCP, and AI doctrine beneath source authority", () => {
  const publicPage = readFileSync("app/developers/receiz/page.tsx", "utf8");
  const operator = readFileSync("src/features/admin/ReceizOperationsPanel.tsx", "utf8");
  assert.match(publicPage, /RECEIZ_V124_DOCTRINE/);
  assert.match(publicPage, /operationCount/);
  assert.match(publicPage, /mcpToolCount/);
  assert.match(publicPage, /43 AI skills/);
  assert.match(publicPage, /institution-independent/i);
  assert.match(publicPage, /representation.*never.*outrank/i);
  assert.match(operator, /Receiz v12[34]/);
  assert.doesNotMatch(operator, /verified by MCP/i);
});
