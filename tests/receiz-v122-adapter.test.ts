import assert from "node:assert/strict";
import { it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter";

it("exposes every v122 primitive through the sole SDK client boundary", () => {
  const adapter = createReceizCommerceAdapter({ baseUrl: "https://receiz.invalid" });
  assert.equal(typeof adapter.v122.subjects.admit, "function");
  assert.equal(typeof adapter.v122.subjects.exportEdgeBundle, "function");
  assert.equal(typeof adapter.v122.subjects.importEdgeBundle, "function");
  assert.equal(typeof adapter.v122.subjects.publishAccessKey, "function");
  assert.equal(typeof adapter.v122.mandates.issue, "function");
  assert.equal(typeof adapter.v122.mandates.revoke, "function");
  assert.equal(typeof adapter.v122.world.planPrivateCommand, "function");
  assert.equal(typeof adapter.v122.world.executeMultiWorldTransaction, "function");
  assert.equal(typeof adapter.v122.value.planSettlement, "function");
  assert.equal(typeof adapter.v122.value.planReserve, "function");
});
