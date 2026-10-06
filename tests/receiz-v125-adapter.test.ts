import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter";
import { inAppPermissionChallenge } from "../src/lib/receiz/in-app-permission";

// Controlled SDK contract inputs only. These heads do not admit a source,
// spend Reserve, seal a transition, or establish a completed purchase.
function edgeInput() {
  return {
    applicationId: "receiz-commerce-kit",
    amountPhiMicro: "1250000",
    sourceProofObjectId: "fixture:reserve:source",
    sourceValueHead: "11".repeat(32),
    destinationSubjectId: "fixture:merchant:receiver",
    expectedDestinationHead: "22".repeat(32),
    usdPerPhiMicrocents: "100000000",
    priceBasis: { schema: "fixture.price-basis.v1", kai: "14000000" },
    idempotencyKey: "fixture:reserve:checkout:1",
    attemptId: "fixture:reserve:checkout:attempt:1",
  } as const;
}

describe("Installed Receiz v125 edge integration", () => {
  it("exposes the published SDK edge lifecycle without replacing its primitives", () => {
    const adapter = createReceizCommerceAdapter({ fetchImpl: async () => { throw new Error("unexpected_http"); } });
    const edge = adapter.v125.value.edge;
    assert.equal(Object.isFrozen(edge), true);
    for (const key of Object.keys(adapter.client.value.edge) as Array<keyof typeof edge>) {
      assert.equal(edge[key], adapter.client.value.edge[key]);
    }
    for (const key of ["planReserve", "inspect", "verifyTransitionSet", "prepareCommitSet", "createRecovery", "confirmReserveSend", "receiveReserve"] as const) {
      assert.equal(typeof edge[key], "function");
    }
  });

  it("keeps the OAuth client binding separate from the exact local edge application namespace", async () => {
    const previousClient = process.env.RECEIZ_CLIENT_ID;
    const previousApplication = process.env.RECEIZ_APPLICATION_ID;
    process.env.RECEIZ_CLIENT_ID = "rc_AbCdef_0123456789XYZ-abC";
    delete process.env.RECEIZ_APPLICATION_ID;
    let calls = 0;
    try {
      const adapter = createReceizCommerceAdapter({ fetchImpl: async () => { calls += 1; throw new Error("unexpected_http"); } });
      const permission = await inAppPermissionChallenge({
        applicationId: process.env.RECEIZ_CLIENT_ID,
        artifactDigest: "a".repeat(64),
        purpose: "wallet_checkout",
        tenantHost: "merchant.example",
      });
      assert.equal(permission.applicationId, process.env.RECEIZ_CLIENT_ID);
      assert.equal(permission.challenge.audience, process.env.RECEIZ_CLIENT_ID);

      const planned = await adapter.v125.value.edge.planReserve(edgeInput());
      const sender = await adapter.v125.value.edge.inspect(planned.plan, { participantId: planned.sourceParticipantId, expectedRail: "reserve" });
      const receiver = await adapter.v125.value.edge.inspect(planned.plan, { participantId: planned.destinationParticipantId, expectedRail: "reserve" });
      assert.equal(planned.plan.applicationId, "receiz-commerce-kit");
      assert.equal(planned.rail, "reserve");
      assert.equal(planned.expectedParticipantHeads[planned.sourceParticipantId], edgeInput().sourceValueHead);
      assert.equal(planned.expectedParticipantHeads[planned.destinationParticipantId], edgeInput().expectedDestinationHead);
      assert.equal(sender.role, "sender");
      assert.equal(receiver.role, "receiver");
      assert.equal(sender.intent.valueIntentDigest, receiver.intent.valueIntentDigest);
      assert.equal(planned.authority.planIsTransactionAuthority, false);
      assert.equal(planned.authority.serverRole, "global-sync-only");
      assert.equal(calls, 0);
    } finally {
      if (previousClient === undefined) delete process.env.RECEIZ_CLIENT_ID;
      else process.env.RECEIZ_CLIENT_ID = previousClient;
      if (previousApplication === undefined) delete process.env.RECEIZ_APPLICATION_ID;
      else process.env.RECEIZ_APPLICATION_ID = previousApplication;
    }
  });

  it("rejects a receiver or rail substitution in the unchanged installed SDK", async () => {
    const adapter = createReceizCommerceAdapter({ fetchImpl: async () => { throw new Error("unexpected_http"); } });
    const planned = await adapter.v125.value.edge.planReserve(edgeInput());
    await assert.rejects(adapter.v125.value.edge.inspect(planned.plan, { participantId: "fixture:other-receiver", expectedRail: "reserve" }), /PARTICIPANT_MISMATCH/);
    await assert.rejects(adapter.v125.value.edge.inspect(planned.plan, { participantId: planned.destinationParticipantId, expectedRail: "settlement" }), /RAIL_MISMATCH/);
  });

  it("does not accept a caller-created paid receipt as a committed edge recovery", async () => {
    const adapter = createReceizCommerceAdapter({ fetchImpl: async () => { throw new Error("unexpected_http"); } });
    await assert.rejects(adapter.v125.value.edge.receiveReserve({ paid: true, receiptId: "fixture:claimed-paid" }, {
      applicationId: "receiz-commerce-kit", participantId: "fixture:merchant:receiver",
    }));
  });
});
