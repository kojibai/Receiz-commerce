import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Receiz v104 application contract", () => {
  it("compiles the complete app contract through the v104 SDK", async () => {
    const sdk = await import("@receiz/sdk");
    assert.equal(typeof sdk.defineReceizApp, "function");
    assert.equal(typeof sdk.compileReceizAppContract, "function");

    const input = JSON.parse(readFileSync("receiz.app.json", "utf8"));
    const contract = sdk.defineReceizApp(input);
    const plan = sdk.compileReceizAppContract(contract, { targetSdkVersion: "104.0.0" });

    assert.equal(plan.targetSdkVersion, "104.0.0");
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
    assert.ok(plan.verificationCommands.length > 0);
  });

  it("passes the v104 integration check with verified production rails", async () => {
    const sdk = await import("@receiz/sdk");
    const generated = JSON.parse(readFileSync("receiz.generated.json", "utf8"));

    assert.equal(generated.adapterCreated, true);
    assert.equal(generated.webhookVerification, true);
    assert.equal(generated.proofMemoryPersistence, "durable");
    assert.equal(generated.continuityVerification, true);
    assert.equal(generated.idempotency, true);

    const result = await sdk.checkReceizIntegration({
      root: process.cwd(),
      targetSdkVersion: "104.0.0",
    });
    assert.deepEqual(result.blockingFindings, []);
    assert.equal(result.ok, true);
  });
});
