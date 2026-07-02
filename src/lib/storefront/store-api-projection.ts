import type { CommerceState } from "@/types/domain";

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

const objectFields = ["brand", "storefront", "hosting", "exchange", "game", "checkout", "receiz"] as const;

export function mergeStoreApiProjection(baseState: CommerceState, input: unknown): CommerceState | null {
  if (!isRecord(input) || input.ok !== true || input.publishedState !== true) return null;

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

  return next;
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
