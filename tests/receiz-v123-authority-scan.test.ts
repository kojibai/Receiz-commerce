import assert from "node:assert/strict";
import { it } from "node:test";
import { scanReceizV123Authority } from "../scripts/receiz-v123-authority-scan.mjs";

it("blocks persisted bearer authority and server-side proof-object exchange", () => {
  const findings = scanReceizV123Authority(`
    localStorage.setItem("authority", proofAuthority.accessToken);
    await client.identity.exchangeProofAuthority({ artifactBytes, challenge });
  `, "app/api/unsafe/route.ts");
  assert.deepEqual(findings.map((finding) => finding.code).sort(), [
    "BEARER_AUTHORITY_PERSISTENCE_FORBIDDEN",
    "PROOF_AUTHORITY_EXCHANGE_OUTSIDE_EDGE_FORBIDDEN",
  ]);
});

it("blocks caller-generated planning security fields and retry-before-lookup", () => {
  const findings = scanReceizV123Authority(`
    const plan = await planCommand({ ...body, commandDigest: body.commandDigest });
    if (outcome.status === "unknown") await execute(intent);
  `, "src/features/unsafe.ts");
  assert.deepEqual(findings.map((finding) => finding.code).sort(), [
    "CALLER_GENERATED_SECURITY_FIELD_FORBIDDEN",
    "UNKNOWN_VALUE_RETRY_BEFORE_LOOKUP_FORBIDDEN",
  ]);
});
