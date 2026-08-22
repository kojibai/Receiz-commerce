import {
  normalizeReceizNamespaceNamesV123,
  type ReceizSubjectNamespaceResolutionInputV123,
  type ReceizWorldCommandPlanInputV122,
  type ReceizWorldCommandV122,
  type ReceizWorldTransactionPlanInputV122,
  type ReceizWorldTransactionV122,
} from "@receiz/sdk";
import type { ReceizCommerceAdapter } from "../adapter";

const COMMAND_INPUT_FIELDS = new Set([
  "commandId",
  "worldId",
  "expectedWorldHead",
  "actorSubjectId",
  "participantSubjectIds",
  "causalParents",
  "command",
  "authority",
  "mandateDigest",
]);
const TRANSACTION_INPUT_FIELDS = new Set([
  "worldId",
  "expectedWorldHead",
  "participantHeads",
  "commands",
  "registryDigest",
  "reducerDigest",
  "idempotencyKey",
]);
const GENERATED_SECURITY_FIELDS = new Set([
  "authorityDigest",
  "commandDigest",
  "exactCommandBytesB64u",
  "planDigest",
  "transactionDigest",
  "transactionId",
]);
const NAMESPACE_FIELDS = new Set(["subjectId", "atHead", "names"]);
const AUTHORITY_OVERRIDE_FIELDS = new Set([
  "artifact",
  "capability",
  "privateKey",
  "receipt",
  "verification",
  "verifier",
  "wrappingKey",
]);

function record(value: unknown, code: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(code);
  return value as Record<string, unknown>;
}

function exactInput(value: unknown, allowed: ReadonlySet<string>, code: string): Record<string, unknown> {
  const input = record(value, code);
  if (Object.keys(input).some((key) => GENERATED_SECURITY_FIELDS.has(key))) {
    throw new TypeError("V123_SDK_CANONICAL_SECURITY_VALUE_FORBIDDEN");
  }
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) throw new TypeError(code);
  }
  return input;
}

export async function planReceizWorldCommandCanonicalV123(
  adapter: ReceizCommerceAdapter,
  value: unknown,
): Promise<ReceizWorldCommandV122> {
  const input = exactInput(value, COMMAND_INPUT_FIELDS, "V123_WORLD_COMMAND_INPUT_INVALID");
  return adapter.v123.world.planCommandV122(input as ReceizWorldCommandPlanInputV122);
}

export async function planReceizWorldTransactionCanonicalV123(
  adapter: ReceizCommerceAdapter,
  value: unknown,
): Promise<ReceizWorldTransactionV122> {
  const input = exactInput(value, TRANSACTION_INPUT_FIELDS, "V123_WORLD_TRANSACTION_INPUT_INVALID");
  return adapter.v123.world.planTransactionV122(input as ReceizWorldTransactionPlanInputV122);
}

export function parseReceizNamespaceResolutionV123(value: unknown): ReceizSubjectNamespaceResolutionInputV123 {
  const input = record(value, "V123_NAMESPACE_INPUT_INVALID");
  for (const key of Object.keys(input)) {
    if (AUTHORITY_OVERRIDE_FIELDS.has(key)) throw new TypeError("V123_NAMESPACE_AUTHORITY_FIELD_FORBIDDEN");
    if (!NAMESPACE_FIELDS.has(key)) throw new TypeError("V123_NAMESPACE_INPUT_INVALID");
  }
  if (typeof input.subjectId !== "string"
    || !/^receiz:subject:[0-9a-f]{64}$/.test(input.subjectId)
    || typeof input.atHead !== "string"
    || !/^[0-9a-f]{64}$/.test(input.atHead)) {
    throw new TypeError("V123_NAMESPACE_EXACT_HEAD_REQUIRED");
  }
  return Object.freeze({
    subjectId: input.subjectId,
    atHead: input.atHead,
    names: normalizeReceizNamespaceNamesV123(input.names as readonly string[]),
  });
}
