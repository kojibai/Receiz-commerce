import { createReceizSubjectAccessKeyV122, planReceizMultiWorldTransactionV122, type ReceizWorldTransactionV122 } from "@receiz/sdk";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  persistReceizExactPlannedTransaction,
  resolveUnknownExecutionBeforeRetry,
  restoreReceizExactPlannedTransaction,
} from "../src/lib/receiz/v122/world-request";
import { planWildsPrivateCommand } from "../src/features/play/receiz-v122-world";

const transaction = (worldId: string): ReceizWorldTransactionV122 => ({
  schema: "receiz.world.transaction.v122",
  transactionId: `tx-${worldId}`,
  worldId,
  expectedWorldHead: `head-${worldId}`,
  participantHeads: {},
  commands: [],
  registryDigest: "registry",
  reducerDigest: "reducer",
  idempotencyKey: `idem-${worldId}`,
  transactionDigest: `digest-${worldId}`,
});

describe("Receiz v122 private and atomic world law", () => {
  it("keeps private plaintext at the edge and round-trips exact planned bytes", async () => {
    const key = await createReceizSubjectAccessKeyV122({ subjectId: "subject-a", subjectHead: "head-a", edgeWrappingKey: new Uint8Array(32).fill(9) });
    const plan = await planWildsPrivateCommand({
      worldId: "world-a",
      publicPayload: { command: "wilds.explore" },
      privatePayload: { secret: "never-serialize-me" },
      visibility: { mode: "invited", recipientSubjectIds: ["subject-a"] },
      recipientBindings: [key.publicBinding],
    });
    assert.equal(typeof plan.privateEnvelope.ciphertextB64u, "string");
    assert.equal(plan.privateEnvelope.recipientWraps.length, 1);
    assert.equal(JSON.stringify(plan).includes("never-serialize-me"), false);

    const values = new Map<string, string>();
    const store = { put: async (key: string, value: string) => { values.set(key, value); }, get: async (key: string) => values.get(key) ?? null };
    const planned = transaction("world-a");
    await persistReceizExactPlannedTransaction(store, planned);
    assert.deepEqual(await restoreReceizExactPlannedTransaction(store, planned.transactionId), planned);
  });

  it("resolves unknown before retry and canonicalizes multi-world order", async () => {
    let lookups = 0;
    const resolved = await resolveUnknownExecutionBeforeRetry({ status: "unknown" }, async () => {
      lookups += 1;
      return { status: "zero-write", failure: { code: "participant_head_mismatch", writes: 0 }, currentHeads: {}, worldHead: "head" };
    });
    assert.equal(lookups, 1);
    assert.equal(resolved.status, "zero-write");
    const plan = await planReceizMultiWorldTransactionV122({
      worlds: [
        { worldId: "world-z", expectedWorldHead: "head-world-z", transaction: transaction("world-z") },
        { worldId: "world-a", expectedWorldHead: "head-world-a", transaction: transaction("world-a") },
      ],
      idempotencyKey: "multi-1",
    });
    assert.deepEqual(plan.worlds.map((world) => world.worldId), ["world-a", "world-z"]);
  });
});
