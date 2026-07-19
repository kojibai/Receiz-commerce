import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Receiz v112 application contract", () => {
  it("compiles the complete app contract through the v112 SDK", async () => {
    const compiler = await import("@receiz/sdk/compiler");
    assert.equal(typeof compiler.defineReceizApp, "function");
    assert.equal(typeof compiler.compileReceizAppContract, "function");

    const input = JSON.parse(readFileSync("receiz.app.json", "utf8"));
    const contract = compiler.defineReceizApp(input);
    const plan = compiler.compileReceizAppContract(contract, { targetSdkVersion: "112.0.0" });

    assert.equal(plan.targetSdkVersion, "112.0.0");
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
    assert.deepEqual(contract.operations, compiler.RECEIZ_V112_APPLICATION_OPERATION_MATRIX);
    assert.ok(plan.verificationCommands.length > 0);
  });

  it("passes the v112 integration check with verified production rails", async () => {
    const compiler = await import("@receiz/sdk/compiler");
    const generated = JSON.parse(readFileSync("receiz.generated.json", "utf8"));

    assert.equal(generated.adapterCreated, true);
    assert.equal(generated.webhookVerification, true);
    assert.equal(generated.proofMemoryPersistence, "durable");
    assert.equal(generated.continuityVerification, true);
    assert.equal(generated.idempotency, true);

    const result = await compiler.checkReceizIntegration({
      root: process.cwd(),
      targetSdkVersion: "112.0.0",
    });
    assert.deepEqual(result.blockingFindings, []);
    assert.equal(result.ok, true);
  });
});
