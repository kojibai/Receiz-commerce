// @receiz-generated receiz.app.contract.v1
// Regenerate with receiz app apply; do not edit directly.

import assert from "node:assert/strict";
import test from "node:test";
import contract from "../receiz.app.json" with { type: "json" };
test("Receiz authority remains artifact-first", () => {
  assert.equal(contract.authority.mode, "artifact-first");
  assert.equal(contract.authority.allowDatabaseAuthority, false);
  assert.equal(contract.operations.length, 53);
  assert.equal(contract.operations[0].compatibleSdkRange, ">=124.0.0 <125.0.0");
});
