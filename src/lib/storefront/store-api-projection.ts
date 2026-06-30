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

const objectFields = ["brand", "storefront", "hosting", "game", "checkout", "receiz"] as const;

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
