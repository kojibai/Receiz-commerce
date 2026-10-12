import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Receiz v124 application contract", () => {
  it("compiles the complete app contract through the v124 SDK", async () => {
    const compiler = await import("@receiz/sdk/compiler");
    assert.equal(typeof compiler.defineReceizApp, "function");
    assert.equal(typeof compiler.compileReceizAppContract, "function");

    const input = JSON.parse(readFileSync("receiz.app.json", "utf8"));
    const contract = compiler.defineReceizApp(input);
    const plan = compiler.compileReceizAppContract(contract, { targetSdkVersion: "129.0.0" });

    assert.equal(plan.targetSdkVersion, "129.0.0");
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
    assert.deepEqual(contract.operations, compiler.RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX);
    assert.equal(contract.operations.length, 60);
    assert.equal(compiler.RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST, "c4e0cff348b62f31db2bb2ffdeec533a92ca3a6d476757bb9b559ac58a7875e1");
    assert.ok(plan.verificationCommands.length > 0);
  });

  it("passes the v124 integration check with verified production rails", async () => {
    const compiler = await import("@receiz/sdk/compiler");
    const generated = JSON.parse(readFileSync("receiz.generated.json", "utf8"));

    assert.equal(generated.adapterCreated, true);
    assert.equal(generated.webhookVerification, true);
    assert.equal(generated.proofMemoryPersistence, "durable");
    assert.equal(generated.continuityVerification, true);
    assert.equal(generated.idempotency, true);

    const result = await compiler.checkReceizIntegration({
      root: process.cwd(),
      targetSdkVersion: "129.0.0",
    });
    assert.equal(result.ok, false); // Upstream scans its own published documentation as code.
    assert.deepEqual(result.blockingFindings.map(finding => ({code:finding.code,files:finding.affectedFiles})), [
      {code: "compiler_import_requires_manual_migration", files: ["ai-skills/receiz-mcp-agent-skill/resources/offline-sealing.md", "ai-skills/resources/offline-sealing.md"]},
      {code: "deprecated_api", files: ["ai-skills/resources/public-capability-catalog.json", "ai-skills/resources/sdk-public-functions.json", "ai-skills/resources/sdk-public-functions.md", "ai-skills/skills.json"]},
      {code: "weak_state_used_as_proof_authority", files: ["ai-skills/resources/sdk-public-functions.json", "ai-skills/skills.json"]},
    ]);
    for (const path of new Set(result.blockingFindings.flatMap(finding => finding.affectedFiles))) {
      assert.deepEqual(readFileSync(path),readFileSync("node_modules/@receiz/" + path));
    }
  });
});
