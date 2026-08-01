import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Receiz v118 application contract", () => {
  it("compiles the complete app contract through the v118 SDK", async () => {
    const compiler = await import("@receiz/sdk/compiler");
    assert.equal(typeof compiler.defineReceizApp, "function");
    assert.equal(typeof compiler.compileReceizAppContract, "function");

    const input = JSON.parse(readFileSync("receiz.app.json", "utf8"));
    const contract = compiler.defineReceizApp(input);
    const plan = compiler.compileReceizAppContract(contract, { targetSdkVersion: "118.0.0" });

    assert.equal(plan.targetSdkVersion, "118.0.0");
    assert.deepEqual(contract.features, [
      "identity",
      "proof",
      "proofMemory",
      "publicStore",
      "commerce",
      "media",
      "webhooks",
      "world",
    ]);
    assert.equal(contract.authority.mode, "artifact-first");
    assert.equal(contract.authority.allowDatabaseAuthority, false);
    assert.deepEqual(contract.operations, compiler.RECEIZ_V118_APPLICATION_OPERATION_MATRIX);
    assert.equal(contract.operations.length, 16);
    assert.equal(compiler.RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST, "153b2472830567ec3b445c2c1b4102e4c036ed4c45cc374d40d0079096a40f54");
    assert.ok(plan.verificationCommands.length > 0);
  });

  it("passes the v118 integration check with verified production rails", async () => {
    const compiler = await import("@receiz/sdk/compiler");
    const generated = JSON.parse(readFileSync("receiz.generated.json", "utf8"));

    assert.equal(generated.adapterCreated, true);
    assert.equal(generated.webhookVerification, true);
    assert.equal(generated.proofMemoryPersistence, "durable");
    assert.equal(generated.continuityVerification, true);
    assert.equal(generated.idempotency, true);

    const result = await compiler.checkReceizIntegration({
      root: process.cwd(),
      targetSdkVersion: "118.0.0",
    });
    assert.deepEqual(result.blockingFindings, []);
    assert.equal(result.ok, true);
  });
});
