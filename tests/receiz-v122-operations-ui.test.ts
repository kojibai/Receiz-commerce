import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";

it("ships public doctrine and a non-authoritative operator evidence surface", () => {
  const publicPage = readFileSync("app/developers/receiz/page.tsx", "utf8");
  const operator = readFileSync("src/features/admin/ReceizOperationsPanel.tsx", "utf8");
  const contract = readFileSync("src/lib/receiz/v123/contract.ts", "utf8");
  const doctrine = readFileSync("src/lib/receiz/v123/doctrine.ts", "utf8");
  assert.match(publicPage, /proof object/i);
  assert.match(publicPage, /representation.*never.*outrank/i);
  assert.match(publicPage, /RECEIZ_V123_DOCTRINE/);
  assert.match(operator, /Operator UI is not proof authority/i);
  assert.match(operator, /exact plan.*confirmation/i);
  assert.doesNotMatch(operator, /verified by MCP/i);
  assert.doesNotMatch(contract, /from ["']@receiz\//);
  assert.doesNotMatch(doctrine, /from ["']@receiz\//);
});
