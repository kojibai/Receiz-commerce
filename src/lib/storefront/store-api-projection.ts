import type { CommerceState, ReceizStoreProofHead } from "@/types/domain";
import { compareStoreStateKaiUpulse } from "../receiz/proof-state";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const arrayFields = [
  "navigation",
  "pages",
  "blogPosts",
  "collections",
  "products",
  "rewards",
  "rewardRules",
  "assets",
  "listings",
  "qualifiers",
  "campaigns",
  "orders",
  "customers",
  "proofEvents"
] as const;

const objectFields = ["brand", "storefront", "hosting", "game", "checkout", "receiz"] as const;

function proofHeadFromInput(input: Record<string, unknown>): ReceizStoreProofHead | null {
  const proofMemory = input.proofMemory;
  if (!isRecord(proofMemory)) return null;

  const knownHead = proofMemory.knownHead;
  if (!isRecord(knownHead)) return null;

  return {
    afterEntryId: typeof knownHead.afterEntryId === "string" ? knownHead.afterEntryId : null,
    afterKaiUpulse:
      typeof knownHead.afterKaiUpulse === "string" || typeof knownHead.afterKaiUpulse === "number"
        ? knownHead.afterKaiUpulse
        : null,
    afterCreatedAt: typeof knownHead.afterCreatedAt === "string" ? knownHead.afterCreatedAt : null
  };
}

function hasKaiUpulse(value: unknown): value is string | number {
  return typeof value === "string" || typeof value === "number";
}

function compareProofHeads(left?: ReceizStoreProofHead | null, right?: ReceizStoreProofHead | null) {
  if (!hasKaiUpulse(left?.afterKaiUpulse) || !hasKaiUpulse(right?.afterKaiUpulse)) return 0;
  return compareStoreStateKaiUpulse(left.afterKaiUpulse, right.afterKaiUpulse);
}

export function mergeStoreApiProjection(baseState: CommerceState, input: unknown): CommerceState | null {
  if (!isRecord(input) || input.ok !== true || input.publishedState !== true) return null;
  const incomingProofHead = proofHeadFromInput(input);
  const currentProofHead = baseState.hosting.storeProofHead;

  if (!hasKaiUpulse(incomingProofHead?.afterKaiUpulse)) return null;
  if (incomingProofHead && currentProofHead && compareProofHeads(incomingProofHead, currentProofHead) < 0) {
    return null;
  }

  let next: CommerceState = { ...baseState };

  for (const field of objectFields) {
    const value = input[field];
    if (isRecord(value)) {
      next = {
        ...next,
        [field]: {
          ...next[field],
          ...value
        }
      };
    }
  }

  for (const field of arrayFields) {
    const value = input[field];
    if (Array.isArray(value)) {
      next = {
        ...next,
        [field]: value
      };
    }
  }

  return incomingProofHead
    ? {
        ...next,
        hosting: {
          ...next.hosting,
          storeProofHead: incomingProofHead
        }
      }
    : next;
}

function mergeById<T extends { id: string }>(remote: T[], local: T[]) {
  const remoteIds = new Set(remote.map((item) => item.id));
  return [...remote, ...local.filter((item) => !remoteIds.has(item.id))];
}

export function mergeStoreCommerceProjection(baseState: CommerceState, input: unknown): CommerceState | null {
  if (!isRecord(input) || input.ok !== true || input.publishedState !== true) return null;

  const orders = Array.isArray(input.orders) ? (input.orders as CommerceState["orders"]) : baseState.orders;
  const customers = Array.isArray(input.customers) ? (input.customers as CommerceState["customers"]) : baseState.customers;
  const proofEvents = Array.isArray(input.proofEvents)
    ? (input.proofEvents as CommerceState["proofEvents"])
    : baseState.proofEvents;

  return {
    ...baseState,
    customers,
    orders,
    proofEvents: mergeById(proofEvents, baseState.proofEvents)
  };
}
