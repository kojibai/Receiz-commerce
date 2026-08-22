import {
  canonicalizeReceizV122,
  validateReceizValueIntentV122,
  type ReceizValueExecutionOutcomeV123,
  type ReceizWorldValueIntentV122,
} from "@receiz/sdk";

export type ReceizExactValueIntentStoreV123 = Readonly<{
  put(key: string, exactIntentJson: string): Promise<void>;
  get(key: string): Promise<string | null>;
}>;

export type ReceizPersistedValueIntentV123 = Readonly<{
  schema: "receiz.value.persisted-intent.v123";
  storageKey: string;
  exactIntentJson: string;
  intent: ReceizWorldValueIntentV122;
  authority: Readonly<{
    persistenceIsProofAuthority: false;
    strongerTruth: "source-proof-object-and-exact-heads";
  }>;
}>;

export type ReceizValueAuthoritySessionV123 = Readonly<{
  execute(persisted: ReceizPersistedValueIntentV123): Promise<ReceizValueExecutionOutcomeV123>;
  recover(idempotencyKey: string): Promise<ReceizValueExecutionOutcomeV123>;
}>;

const runtimePersistedIntents = new WeakSet<object>();

const storageKey = (idempotencyKey: string) => `receiz:v123:value-intent:${encodeURIComponent(idempotencyKey)}`;

async function validateIntent(value: unknown): Promise<ReceizWorldValueIntentV122> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("V123_VALUE_INTENT_INVALID");
  if ("amountUsdCents" in value) throw new TypeError("V123_PHI_IS_ONLY_MOVED_VALUE");
  const intent = value as ReceizWorldValueIntentV122;
  if (!intent.idempotencyKey?.trim()) throw new TypeError("V123_VALUE_IDEMPOTENCY_KEY_REQUIRED");
  if (!(await validateReceizValueIntentV122(intent))) throw new TypeError("V123_VALUE_INTENT_INVALID");
  return intent;
}

function custody(intent: ReceizWorldValueIntentV122, exactIntentJson: string): ReceizPersistedValueIntentV123 {
  const persisted = Object.freeze({
    schema: "receiz.value.persisted-intent.v123" as const,
    storageKey: storageKey(intent.idempotencyKey!),
    exactIntentJson,
    intent,
    authority: Object.freeze({
      persistenceIsProofAuthority: false as const,
      strongerTruth: "source-proof-object-and-exact-heads" as const,
    }),
  });
  runtimePersistedIntents.add(persisted);
  return persisted;
}

export async function persistReceizExactValueIntentV123(
  store: ReceizExactValueIntentStoreV123,
  value: unknown,
): Promise<ReceizPersistedValueIntentV123> {
  const intent = await validateIntent(value);
  const exactIntentJson = canonicalizeReceizV122(intent);
  await store.put(storageKey(intent.idempotencyKey!), exactIntentJson);
  return custody(intent, exactIntentJson);
}

export async function restoreReceizExactValueIntentV123(
  store: ReceizExactValueIntentStoreV123,
  idempotencyKey: string,
): Promise<ReceizPersistedValueIntentV123 | null> {
  if (!idempotencyKey.trim()) throw new TypeError("V123_VALUE_IDEMPOTENCY_KEY_REQUIRED");
  const exactIntentJson = await store.get(storageKey(idempotencyKey));
  if (exactIntentJson === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(exactIntentJson);
  } catch {
    throw new TypeError("V123_VALUE_EXACT_INTENT_BYTES_CHANGED");
  }
  const intent = await validateIntent(value);
  if (intent.idempotencyKey !== idempotencyKey || canonicalizeReceizV122(intent) !== exactIntentJson) {
    throw new TypeError("V123_VALUE_EXACT_INTENT_BYTES_CHANGED");
  }
  return custody(intent, exactIntentJson);
}

export function unwrapReceizPersistedValueIntentV123(value: unknown): ReceizWorldValueIntentV122 {
  if (!value || typeof value !== "object" || !runtimePersistedIntents.has(value)) {
    throw new TypeError("V123_VALUE_PERSISTED_INTENT_REQUIRED");
  }
  return (value as ReceizPersistedValueIntentV123).intent;
}

export function createReceizValueExecutionCoordinatorV123(
  store: ReceizExactValueIntentStoreV123,
  session: ReceizValueAuthoritySessionV123,
) {
  const submittedKeys = new Set<string>();
  return Object.freeze({
    async execute(value: unknown): Promise<Readonly<{
      outcome: ReceizValueExecutionOutcomeV123;
      recoveryPerformed: boolean;
    }>> {
      const candidate = value as Partial<ReceizWorldValueIntentV122>;
      const key = candidate?.idempotencyKey;
      if (typeof key === "string" && submittedKeys.has(key)) {
        throw new TypeError("V123_VALUE_RETRY_REQUIRES_RECOVERY");
      }
      const persisted = await persistReceizExactValueIntentV123(store, value);
      submittedKeys.add(persisted.intent.idempotencyKey!);
      const outcome = await session.execute(persisted);
      if (outcome.status !== "unknown") return Object.freeze({ outcome, recoveryPerformed: false });
      const recovered = await session.recover(persisted.intent.idempotencyKey!);
      return Object.freeze({ outcome: recovered, recoveryPerformed: true });
    },

    recover(idempotencyKey: string) {
      return session.recover(idempotencyKey);
    },
  });
}
