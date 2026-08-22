import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { RECEIZ_V123_CONTRACT } from "../src/lib/receiz/v123/contract";
import { RECEIZ_V123_DOCTRINE } from "../src/lib/receiz/v123/doctrine";

const tools = [
  "receiz_v123_world_plan_command_v122",
  "receiz_v123_world_plan_transaction_v122",
  "receiz_v123_value_execute_settlement",
  "receiz_v123_value_execute_reserve",
  "receiz_v123_value_execution_by_idempotency",
  "receiz_v123_subject_resolve_namespaces",
  "receiz_v123_identity_exchange_proof_authority",
  "receiz_v123_auth_granted_scopes",
];

describe("Receiz v123 source-first developer contract", () => {
  it("maps all eight MCP outcomes without granting representation authority", () => {
    assert.equal(RECEIZ_V123_CONTRACT.sdkVersion, "123.0.0");
    assert.equal(RECEIZ_V123_CONTRACT.registryDigest, "945a581d1fc49c2dc18fbe8c129771ef464b8a58b96188bce561e88ae8b6ceeb");
    assert.equal(RECEIZ_V123_CONTRACT.operationMatrixDigest, "e08cec3e3ad22c20ddd6c08169ece19f094c366214d6d6b4dc432cd97558e2c5");
    assert.deepEqual(RECEIZ_V123_CONTRACT.mcpTools, tools);
    assert.equal(RECEIZ_V123_DOCTRINE.length, 8);
    assert.equal(RECEIZ_V123_DOCTRINE.every((entry) => entry.mcpAuthority === false), true);
    assert.equal(RECEIZ_V123_CONTRACT.authority.representationCanAuthorize, false);
  });

  it("keeps client doctrine independent of package runtime imports", () => {
    const contract = readFileSync("src/lib/receiz/v123/contract.ts", "utf8");
    const doctrine = readFileSync("src/lib/receiz/v123/doctrine.ts", "utf8");
    assert.doesNotMatch(contract, /from ["']@receiz\//);
    assert.doesNotMatch(doctrine, /from ["']@receiz\//);
    assert.match(doctrine, /proof object/i);
    assert.match(doctrine, /lookup before retry/i);
    assert.match(doctrine, /explicit consent/i);
  });
});
