import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { RECEIZ_V124_MCP_TOOLS } from "../src/lib/receiz/v124/contract";

it("publishes the complete v124 source-first developer doctrine", () => {
  const page = readFileSync("app/developers/receiz/page.tsx", "utf8");
  const contract = readFileSync("src/lib/receiz/v124/contract.ts", "utf8");
  const doctrine = readFileSync("src/lib/receiz/v124/doctrine.ts", "utf8");
  const runtime = readFileSync("src/lib/receiz/v124/production-runtime.ts", "utf8");
  assert.match(page, /Reality Becomes Infrastructure/);
  assert.match(page, /Representation must never outrank the source/);
  assert.match(page, /not immunity from applicable law/i);
  assert.match(page, /All 22 v124 runtime tools/);
  assert.match(page, /Portable proof presentation/);
  assert.match(page, /receiz_material_url_open/);
  assert.match(page, /receiz_sealed_kai_moment/);
  for (const tool of RECEIZ_V124_MCP_TOOLS) assert.match(contract, new RegExp(tool));
  assert.match(doctrine, /RECEIZ_V124_MCP_TOOLS\.map/);
  assert.match(runtime, /WeakMap/);
  assert.match(runtime, /RECEIZ_V124_OPERATION_NOT_QUALIFIED/);
  assert.match(runtime, /RECEIZ_V124_SEALED_REPLAY_SOURCE_REQUIRED/);
});
