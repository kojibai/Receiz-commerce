import { createReceizSubjectMandateV122 } from "@receiz/sdk";
import assert from "node:assert/strict";
import { it } from "node:test";
import { validateWildsMandateUse } from "../src/features/play/receiz-v122-world";

it("revocation-head mismatch rejects autonomous execution with zero writes", async () => {
  const mandate = await createReceizSubjectMandateV122({
    ownerSubjectId: "owner",
    workerSubjectId: "worker",
    allowedCommandKinds: ["wilds.explore"],
    worldIds: ["world-a"],
    regionIds: ["region-a"],
    maximumResourcePhiMicro: "1000",
    maximumGeometryUnits: "25",
    expiresAtKai: "500",
    nonce: "nonce-1",
    expectedOwnerHead: "owner-head",
    expectedWorkerHead: "worker-head",
    revocationHead: "revocation-1",
  });
  const result = await validateWildsMandateUse({
    mandate,
    commandKind: "wilds.explore",
    worldId: "world-a",
    regionId: "region-a",
    resourcePhiMicro: "1",
    geometryUnits: "1",
    currentKai: "100",
    ownerHead: "owner-head",
    workerHead: "worker-head",
    revocationHead: "revocation-2",
  });
  assert.deepEqual(result, { ok: false, code: "mandate_revoked_or_stale", writesOnFailure: 0 });
});
