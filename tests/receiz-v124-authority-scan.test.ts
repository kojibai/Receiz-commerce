import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scanReceizV124Authority, scanReceizV124Repository } from "../scripts/receiz-v124-authority-scan.mjs";

describe("Receiz v124 negative authority scan", () => {
  it("rejects reconstructed sessions and uncustodied mutation/private replay", () => {
    const findings = scanReceizV124Authority(`
      const session = JSON.parse(raw) as ReceizAuthoritySessionV124;
      await adapter.v124.execution.execute(handle, session);
      await client.domains.verifiedPrivateAdditionsV124(input);
      await client.domains.restoreVerifiedReplayProofObjectV124(candidate);
    `, "src/unsafe.ts");
    assert.deepEqual(findings.map((item) => item.code), [
      "V124_EXECUTION_OUTSIDE_CUSTODIED_RUNTIME_FORBIDDEN",
      "V124_JSON_AUTHORITY_RECONSTRUCTION_FORBIDDEN",
      "V124_PRIVATE_ADDITIONS_OUTSIDE_TRUSTED_HOST_FORBIDDEN",
      "V124_SEALED_SOURCE_CUSTODY_BYPASS_FORBIDDEN",
    ]);
  });

  it("accepts the repository's custodied source-first implementation", () => {
    const report = scanReceizV124Repository();
    assert.equal(report.ok, true, JSON.stringify(report.findings));
  });
});
