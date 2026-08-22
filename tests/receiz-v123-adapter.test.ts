import assert from "node:assert/strict";
import { it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter";

it("exposes every v123 lawful-action primitive through the sole SDK client boundary", () => {
  const adapter = createReceizCommerceAdapter({ baseUrl: "https://receiz.invalid" });
  assert.equal(typeof adapter.v123.identity.exchangeProofAuthority, "function");
  assert.equal(typeof adapter.v123.auth.grantedScopes, "function");
  assert.equal(typeof adapter.v123.auth.scopesForRails, "function");
  assert.equal(typeof adapter.v123.auth.missingScopesForRails, "function");
  assert.equal(typeof adapter.v123.auth.canUseRails, "function");
  assert.equal(typeof adapter.v123.world.planCommandV122, "function");
  assert.equal(typeof adapter.v123.world.planTransactionV122, "function");
  assert.equal(typeof adapter.v123.subjects.resolveNamespaces, "function");
  assert.equal(typeof adapter.v123.value.executeSettlement, "function");
  assert.equal(typeof adapter.v123.value.executeReserve, "function");
  assert.equal(typeof adapter.v123.value.executionByIdempotencyKey, "function");
  assert.equal(typeof adapter.v122.value.planSettlement, "function");
  assert.equal(Object.isFrozen(adapter.v123), true);
});
