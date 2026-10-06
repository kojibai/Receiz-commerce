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
  const key = storageKey(intent.idempotencyKey!);
  const existing = await store.get(key);
  if (existing !== null && existing !== exactIntentJson) throw new TypeError("V123_VALUE_IDEMPOTENCY_INTENT_CHANGED");
  if (existing === null) await store.put(key, exactIntentJson);
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
  const bindOutcome = (outcome: ReceizValueExecutionOutcomeV123, exactIntentJson: string) => {
    if (outcome.status === "committed" && canonicalizeReceizV122(outcome.intent) !== exactIntentJson) {
      throw new TypeError("V123_VALUE_RECOVERED_INTENT_MISMATCH");
    }
    return outcome;
  };
  return Object.freeze({
    async execute(value: unknown): Promise<Readonly<{
      outcome: ReceizValueExecutionOutcomeV123;
      recoveryPerformed: boolean;
    }>> {
      const candidate = await validateIntent(value);
      const key = candidate.idempotencyKey!;
      if (submittedKeys.has(key)) {
        throw new TypeError("V123_VALUE_RETRY_REQUIRES_RECOVERY");
      }
      // Claim this coordinate before any storage await so two clicks cannot
      // both pass the submission guard. Restored custody always resolves first.
      submittedKeys.add(key);
      const restored = await restoreReceizExactValueIntentV123(store, key);
      if (restored) {
        if (restored.exactIntentJson !== canonicalizeReceizV122(candidate)) throw new TypeError("V123_VALUE_IDEMPOTENCY_INTENT_CHANGED");
        return Object.freeze({ outcome: bindOutcome(await session.recover(key), restored.exactIntentJson), recoveryPerformed: true });
      }
      const persisted = await persistReceizExactValueIntentV123(store, candidate);
      const outcome = bindOutcome(await session.execute(persisted), persisted.exactIntentJson);
      if (outcome.status !== "unknown") return Object.freeze({ outcome, recoveryPerformed: false });
      const recovered = bindOutcome(await session.recover(key), persisted.exactIntentJson);
      return Object.freeze({ outcome: recovered, recoveryPerformed: true });
    },

    async recover(idempotencyKey: string) {
      const persisted = await restoreReceizExactValueIntentV123(store, idempotencyKey);
      if (!persisted) throw new TypeError("V123_VALUE_PERSISTED_INTENT_REQUIRED");
      return bindOutcome(await session.recover(idempotencyKey), persisted.exactIntentJson);
    },
  });
}
