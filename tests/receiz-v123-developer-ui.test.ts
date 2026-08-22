import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";

it("publishes v123 SDK, MCP, and AI doctrine beneath source authority", () => {
  const publicPage = readFileSync("app/developers/receiz/page.tsx", "utf8");
  const operator = readFileSync("src/features/admin/ReceizOperationsPanel.tsx", "utf8");
  assert.match(publicPage, /RECEIZ_V123_DOCTRINE/);
  assert.match(publicPage, /36 operations/);
  assert.match(publicPage, /141 MCP tools/);
  assert.match(publicPage, /42 AI skills/);
  assert.match(publicPage, /institution-independent/i);
  assert.match(publicPage, /representation.*never.*outrank/i);
  assert.match(operator, /Receiz v123/);
  assert.match(operator, /8 mapped/);
  assert.doesNotMatch(operator, /verified by MCP/i);
});
