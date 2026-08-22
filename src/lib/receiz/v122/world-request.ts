import {
  canonicalizeReceizV122,
  type ReceizExecutionOutcomeV122,
  type ReceizMultiWorldTransactionV122,
  type ReceizWorldTransactionV122,
} from "@receiz/sdk";

export type ReceizWorldOperation =
  | Readonly<{ action: "validate"; transaction: ReceizWorldTransactionV122 }>
  | Readonly<{ action: "execute"; transaction: ReceizWorldTransactionV122 }>
  | Readonly<{ action: "execution"; worldId: string; transactionId: string }>
  | Readonly<{ action: "executionByIdempotency"; worldId: string; idempotencyKey: string }>
  | Readonly<{ action: "additions"; worldId: string; afterHead?: string }>
  | Readonly<{ action: "planMultiWorld"; worlds: ReceizMultiWorldTransactionV122["worlds"]; idempotencyKey: string }>
  | Readonly<{ action: "executeMultiWorld"; plan: ReceizMultiWorldTransactionV122 }>;

export type ReceizExactPlanStore = Readonly<{
  put(key: string, exactPlanJson: string): Promise<void>;
  get(key: string): Promise<string | null>;
}>;

const transactionStorageKey = (transactionId: string) => `receiz:v122:world-plan:${transactionId}`;

export async function persistReceizExactPlannedTransaction(
  store: ReceizExactPlanStore,
  transaction: ReceizWorldTransactionV122,
): Promise<void> {
  await store.put(transactionStorageKey(transaction.transactionId), canonicalizeReceizV122(transaction));
}

export async function restoreReceizExactPlannedTransaction(
  store: ReceizExactPlanStore,
  transactionId: string,
): Promise<ReceizWorldTransactionV122 | null> {
  const exactJson = await store.get(transactionStorageKey(transactionId));
  if (exactJson === null) return null;
  const value: unknown = JSON.parse(exactJson);
  if (!value || typeof value !== "object" || Array.isArray(value) || (value as Record<string, unknown>).schema !== "receiz.world.transaction.v122") {
    throw new Error("receiz_exact_world_plan_invalid");
  }
  if (canonicalizeReceizV122(value) !== exactJson) throw new Error("receiz_exact_world_plan_bytes_changed");
  return value as ReceizWorldTransactionV122;
}

export async function resolveUnknownExecutionBeforeRetry(
  outcome: ReceizExecutionOutcomeV122,
  lookup: () => Promise<ReceizExecutionOutcomeV122>,
): Promise<ReceizExecutionOutcomeV122> {
  if (outcome.status !== "unknown") return outcome;
  const resolved = await lookup();
  if (resolved.status === "unknown") throw new Error("receiz_execution_still_unknown_retry_forbidden");
  return resolved;
}

const FORBIDDEN_PRIVATE_KEYS = new Set([
  "accessKit", "authority", "capability", "decryptedEnvelope", "edgeWrappingKey", "privateKey", "privatePayload", "receipt", "verification",
]);

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("receiz_world_request_invalid");
  return value as Record<string, unknown>;
}

function rejectPrivateMaterial(value: unknown): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach(rejectPrivateMaterial);
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_PRIVATE_KEYS.has(key)) throw new Error("receiz_world_private_material_forbidden");
    rejectPrivateMaterial(child);
  }
}

export function parseReceizWorldOperation(value: unknown): ReceizWorldOperation {
  rejectPrivateMaterial(value);
  const input = record(value);
  switch (input.action) {
    case "validate":
    case "execute":
      if (record(input.transaction).schema !== "receiz.world.transaction.v122") throw new Error("receiz_world_transaction_invalid");
      return { action: input.action, transaction: input.transaction as ReceizWorldTransactionV122 };
    case "execution":
      if (typeof input.worldId !== "string" || typeof input.transactionId !== "string") throw new Error("receiz_world_execution_lookup_invalid");
      return { action: input.action, worldId: input.worldId, transactionId: input.transactionId };
    case "executionByIdempotency":
      if (typeof input.worldId !== "string" || typeof input.idempotencyKey !== "string") throw new Error("receiz_world_execution_lookup_invalid");
      return { action: input.action, worldId: input.worldId, idempotencyKey: input.idempotencyKey };
    case "additions":
      if (typeof input.worldId !== "string" || (input.afterHead !== undefined && typeof input.afterHead !== "string")) throw new Error("receiz_world_additions_invalid");
      return { action: input.action, worldId: input.worldId, ...(typeof input.afterHead === "string" ? { afterHead: input.afterHead } : {}) };
    case "planMultiWorld":
      if (!Array.isArray(input.worlds) || typeof input.idempotencyKey !== "string") throw new Error("receiz_multi_world_plan_invalid");
      return { action: input.action, worlds: input.worlds as ReceizMultiWorldTransactionV122["worlds"], idempotencyKey: input.idempotencyKey };
    case "executeMultiWorld":
      if (record(input.plan).schema !== "receiz.multi-world-transaction.v122") throw new Error("receiz_multi_world_plan_invalid");
      return { action: input.action, plan: input.plan as ReceizMultiWorldTransactionV122 };
    default:
      throw new Error("receiz_world_action_invalid");
  }
}
