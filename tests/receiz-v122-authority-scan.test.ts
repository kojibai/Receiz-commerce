import assert from "node:assert/strict";
import { it } from "node:test";
import { scanReceizV122Authority } from "../scripts/receiz-v122-authority-scan.mjs";

it("rejects representation used as source authority", () => {
  const findings = scanReceizV122Authority(`
    state.ownerId = apiProjection.ownerId;
    const amountPhiMicro = body.amountUsdCents;
    await execute({ privatePayload: body.privatePayload });
  `, "app/api/fixture.ts");
  assert.deepEqual(findings.map((finding) => finding.code).sort(), [
    "PRIVATE_WORLD_PLAINTEXT_TRANSPORT_FORBIDDEN",
    "PROJECTION_AS_AUTHORITY_FORBIDDEN",
    "USD_AS_MOVED_AUTHORITY_FORBIDDEN",
  ]);
});

it("rejects unauthorized clients, unknown normalization, and direct model mutation", () => {
  const findings = scanReceizV122Authority(`
    const client = createReceizClient({});
    const status = outcome.status === "unknown" ? "zero-write" : outcome.status;
    events.push(modelOutput);
  `, "src/features/unsafe.ts");
  assert.deepEqual(findings.map((finding) => finding.code).sort(), [
    "AI_OUTPUT_DIRECT_EVENT_FORBIDDEN",
    "SDK_CLIENT_BOUNDARY_FORBIDDEN",
    "UNKNOWN_OUTCOME_NORMALIZATION_FORBIDDEN",
  ]);
});
