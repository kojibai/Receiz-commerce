import { canonicalizeReceizV122, planReceizSettlementV122, type ReceizValueExecutionOutcomeV123 } from "@receiz/sdk";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createReceizValueExecutionCoordinatorV123,
  persistReceizExactValueIntentV123,
  restoreReceizExactValueIntentV123,
  unwrapReceizPersistedValueIntentV123,
  type ReceizExactValueIntentStoreV123,
} from "../src/lib/receiz/v123/value-execution";

const hash = (character: string) => character.repeat(64);
const intent = () => planReceizSettlementV122({
  amountPhiMicro: "500000",
  sourceProofObjectId: "proof:source",
  sourceValueHead: hash("a"),
  destinationSubjectId: `receiz:subject:${hash("b")}`,
  expectedDestinationHead: hash("c"),
  usdPerPhiMicrocents: "2",
  priceBasis: { source: "canonical", atKai: 100 },
  idempotencyKey: "settlement-500000-1",
});

function memoryStore(): ReceizExactValueIntentStoreV123 & { values: Map<string, string>; order: string[] } {
  const values = new Map<string, string>();
  const order: string[] = [];
  return {
    values,
    order,
    async put(key, exactJson) {
      order.push("persist");
      values.set(key, exactJson);
    },
    async get(key) {
      return values.get(key) ?? null;
    },
  };
}

describe("Receiz v123 exact Phi execution custody", () => {
  it("persists and revalidates the canonical intent before it can execute", async () => {
    const store = memoryStore();
    const planned = await intent();
    assert.throws(() => unwrapReceizPersistedValueIntentV123(planned), /PERSISTED_INTENT_REQUIRED/);
    const persisted = await persistReceizExactValueIntentV123(store, planned);
    assert.equal(store.values.get(persisted.storageKey), canonicalizeReceizV122(planned));
    assert.equal(unwrapReceizPersistedValueIntentV123(persisted), planned);
    const restored = await restoreReceizExactValueIntentV123(store, planned.idempotencyKey!);
    assert.deepEqual(restored?.intent, planned);
  });

  it("rejects altered storage bytes and USD movement fields", async () => {
    const store = memoryStore();
    const planned = await intent();
    const persisted = await persistReceizExactValueIntentV123(store, planned);
    store.values.set(persisted.storageKey, JSON.stringify({ ...planned, amountPhiMicro: "600000" }));
    await assert.rejects(() => restoreReceizExactValueIntentV123(store, planned.idempotencyKey!), /EXACT_INTENT_BYTES_CHANGED|INTENT_INVALID/);
    await assert.rejects(
      () => persistReceizExactValueIntentV123(store, { ...planned, amountUsdCents: "10" }),
      /PHI_IS_ONLY_MOVED_VALUE/,
    );
  });

  it("persists before submit and resolves unknown exactly once before forbidding retry", async () => {
    const store = memoryStore();
    const planned = await intent();
    const calls: string[] = [];
    const unknown = Object.freeze({ status: "unknown" }) as ReceizValueExecutionOutcomeV123;
    const coordinator = createReceizValueExecutionCoordinatorV123(store, {
      async execute(persisted) {
        assert.equal(store.values.has(persisted.storageKey), true);
        calls.push("execute");
        return unknown;
      },
      async recover(key) {
        assert.equal(key, planned.idempotencyKey);
        calls.push("recover");
        return unknown;
      },
    });
    const result = await coordinator.execute(planned);
    assert.deepEqual(store.order, ["persist"]);
    assert.deepEqual(calls, ["execute", "recover"]);
    assert.equal(result.outcome.status, "unknown");
    assert.equal(result.recoveryPerformed, true);
    await assert.rejects(() => coordinator.execute(planned), /RETRY_REQUIRES_RECOVERY/);
  });
});
