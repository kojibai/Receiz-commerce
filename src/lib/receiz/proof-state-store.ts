import {
  createReceizInMemoryProofMemoryStorage,
  createReceizProofMemory,
  type JsonObject,
  type ReceizProofMemory,
  type ReceizProofMemoryAdditionsQuery,
  type ReceizProofMemoryStorage,
  type ReceizProofRegisterEntry,
  type ReceizProofRegisterSnapshot
} from "@receiz/sdk";
import type { CommerceState } from "../../types/domain";
import {
  ADMITTED_STORE_STATE_SCHEMA,
  STORE_STATE_SCHEMA,
  admitCommerceEvent as admitCommerceEventProjection,
  isCommerceEventRecord,
  isStoreStateRecord,
  projectCommerceEventsFromRecords,
  projectLegacyStoreStateRecord,
  projectStoreStateFromRecords,
  storeStateRecordMatchesTenantHost,
  type AdmittedStoreStateRecord,
  type CommerceEventRecord,
  type StoreStateRecord
} from "./proof-state";

export type ProofStateStore = {
  admitStoreRecord(record: StoreStateRecord): Promise<StoreStateRecord>;
  admitCommerceEvent(
    state: CommerceState,
    event: CommerceEventRecord
  ): Promise<{ admitted: boolean; state: CommerceState }>;
  projectHost(baseState: CommerceState, tenantHost: string): CommerceState;
  records(): Array<StoreStateRecord | CommerceEventRecord>;
  snapshot(): ReceizProofRegisterSnapshot;
  knownHead(limit?: number): ReceizProofMemoryAdditionsQuery;
  flush(): Promise<void>;
};

function entryFromStoreRecord(record: StoreStateRecord, canonicalAppendOrdinal: number): ReceizProofRegisterEntry {
  return {
    id: record.id,
    kind: STORE_STATE_SCHEMA,
    createdAt: record.recordedAt,
    kaiUpulse: null,
    proof: null,
    payload: record as unknown as JsonObject,
    projection: {
      schema: "receiz.app.store_state_projection.v1",
      tenantHost: record.tenantHost,
      tenantSlug: record.tenantSlug,
      merchantReceizId: record.merchantReceizId,
      brandName: record.state.brand.name,
      productCount: record.state.products.length,
      published: record.state.hosting.published,
      admissionSchema: ADMITTED_STORE_STATE_SCHEMA,
      canonicalAppendOrdinal,
      authorityKind: "canonical_append"
    }
  };
}

function entryFromCommerceEvent(event: CommerceEventRecord): ReceizProofRegisterEntry {
  return {
    id: event.id,
    kind: event.schema,
    createdAt: event.createdAt,
    payload: event as unknown as JsonObject,
    projection: {
      schema: "receiz.app.commerce_event_projection.v1",
      tenantHost: event.tenantHost,
      merchantReceizId: event.merchantReceizId,
      type: event.type,
      orderId: event.data.orderId ?? null,
      checkoutSessionId: event.data.checkoutSessionId ?? null,
      settlementStatus: event.data.settlementStatus ?? null
    }
  };
}

function payloadEntries(memory: ReceizProofMemory) {
  return memory
    .entries()
    .map((entry) => entry.payload)
    .filter((payload): payload is StoreStateRecord | CommerceEventRecord => isStoreStateRecord(payload) || isCommerceEventRecord(payload));
}

function canonicalAppendOrdinal(entry: ReceizProofRegisterEntry) {
  if (entry.kind !== STORE_STATE_SCHEMA) return null;
  if (entry.projection?.admissionSchema !== ADMITTED_STORE_STATE_SCHEMA) return null;
  if (entry.projection.authorityKind !== "canonical_append" && entry.projection.authorityKind !== "verified_kai") {
    return null;
  }

  const ordinal = entry.projection?.canonicalAppendOrdinal;
  return typeof ordinal === "number" && Number.isSafeInteger(ordinal) && ordinal > 0 ? ordinal : null;
}

function nextCanonicalAppendOrdinal(memory: ReceizProofMemory) {
  return memory
    .entries()
    .map(canonicalAppendOrdinal)
    .reduce<number>((highest, ordinal) => Math.max(highest, ordinal ?? 0), 0) + 1;
}

function admittedStoreStateRecords(memory: ReceizProofMemory): AdmittedStoreStateRecord[] {
  return memory.entries().flatMap((entry) => {
    if (!isStoreStateRecord(entry.payload)) return [];
    const ordinal = canonicalAppendOrdinal(entry);
    if (ordinal === null) return [];

    return [
      {
        schema: ADMITTED_STORE_STATE_SCHEMA,
        record: entry.payload,
        authority: {
          kind: "canonical_append",
          entryId: entry.id,
          canonicalAppendOrdinal: ordinal,
          verifiedKaiUpulse: entry.kaiUpulse ?? null
        }
      }
    ];
  });
}

function legacyStoreStateRecords(memory: ReceizProofMemory) {
  return memory
    .entries()
    .filter((entry) => isStoreStateRecord(entry.payload) && canonicalAppendOrdinal(entry) === null);
}

export async function createProofStateStore(options: {
  ownerId?: string;
  storage?: ReceizProofMemoryStorage;
} = {}): Promise<ProofStateStore> {
  const memory = await createReceizProofMemory({
    ownerId: options.ownerId,
    storage: options.storage,
    autoPersist: true
  });

  return {
    async admitStoreRecord(record) {
      if (!memory.has(record.id)) {
        memory.append(entryFromStoreRecord(record, nextCanonicalAppendOrdinal(memory)));
        await memory.flush();
      }

      return payloadEntries(memory).filter(isStoreStateRecord).find((entry) => entry.id === record.id) ?? record;
    },
    async admitCommerceEvent(state, event) {
      if (memory.has(event.id)) {
        return { admitted: false, state };
      }

      const result = admitCommerceEventProjection(state, event);
      if (result.admitted) {
        memory.append(entryFromCommerceEvent(event));
        await memory.flush();
      }

      return result;
    },
    projectHost(baseState, tenantHost) {
      const admittedRecords = admittedStoreStateRecords(memory);
      const hasCanonicalState = admittedRecords.some((admission) =>
        storeStateRecordMatchesTenantHost(admission.record, tenantHost)
      );
      const legacyMatches = legacyStoreStateRecords(memory)
        .map((entry) => entry.payload)
        .filter(isStoreStateRecord)
        .filter((record) => storeStateRecordMatchesTenantHost(record, tenantHost));
      const publishedState = hasCanonicalState
        ? projectStoreStateFromRecords(baseState, admittedRecords, tenantHost)
        : legacyMatches.length === 1
          ? projectLegacyStoreStateRecord(baseState, legacyMatches[0], tenantHost)
          : baseState;
      const records = payloadEntries(memory);
      return projectCommerceEventsFromRecords(publishedState, records, tenantHost);
    },
    records() {
      return payloadEntries(memory);
    },
    snapshot() {
      return memory.snapshot();
    },
    knownHead(limit) {
      return memory.knownHead(limit);
    },
    flush() {
      return memory.flush();
    }
  };
}

export function createInMemoryProofStateStore(ownerId?: string, initialValue?: ReceizProofRegisterSnapshot) {
  return createProofStateStore({
    ownerId,
    storage: createReceizInMemoryProofMemoryStorage(initialValue)
  });
}

let serverProofStateStore: Promise<ProofStateStore> | null = null;

export const DEFAULT_SERVER_PROOF_OWNER = "receiz-app-commerce";

export type ServerProofStateStoreRegistry = {
  storeForOwner(ownerId?: string): Promise<ProofStateStore>;
};

function normalizeOwnerId(ownerId?: string, fallback = DEFAULT_SERVER_PROOF_OWNER) {
  return ownerId?.trim() || fallback;
}

async function createMirroredProofStateStore(ownerId: string, publicStorePromise: Promise<ProofStateStore>) {
  const ownerStore = await createInMemoryProofStateStore(ownerId);
  const publicStore = await publicStorePromise;

  return {
    async admitStoreRecord(record: StoreStateRecord) {
      await ownerStore.admitStoreRecord(record);
      await publicStore.admitStoreRecord(record);
      return record;
    },
    async admitCommerceEvent(state: CommerceState, event: CommerceEventRecord) {
      const result = await ownerStore.admitCommerceEvent(state, event);

      if (result.admitted) {
        await publicStore.admitCommerceEvent(state, event);
      }

      return result;
    },
    projectHost(baseState: CommerceState, tenantHost: string) {
      return ownerStore.projectHost(baseState, tenantHost);
    },
    records() {
      return ownerStore.records();
    },
    snapshot() {
      return ownerStore.snapshot();
    },
    knownHead(limit?: number) {
      return ownerStore.knownHead(limit);
    },
    flush() {
      return ownerStore.flush();
    }
  } satisfies ProofStateStore;
}

export function createServerProofStateStoreRegistry(
  defaultOwnerId = DEFAULT_SERVER_PROOF_OWNER
): ServerProofStateStoreRegistry {
  const publicOwnerId = normalizeOwnerId(defaultOwnerId);
  const stores = new Map<string, Promise<ProofStateStore>>();
  const publicStore = createInMemoryProofStateStore(publicOwnerId);
  stores.set(publicOwnerId, publicStore);

  return {
    storeForOwner(ownerId = publicOwnerId) {
      const normalizedOwnerId = normalizeOwnerId(ownerId, publicOwnerId);

      if (normalizedOwnerId === publicOwnerId) {
        return publicStore;
      }

      const existing = stores.get(normalizedOwnerId);
      if (existing) return existing;

      const mirroredStore = createMirroredProofStateStore(normalizedOwnerId, publicStore);
      stores.set(normalizedOwnerId, mirroredStore);
      return mirroredStore;
    }
  };
}

const serverProofStateRegistry = createServerProofStateStoreRegistry();

export function getServerProofStateStore(ownerId = DEFAULT_SERVER_PROOF_OWNER) {
  if (normalizeOwnerId(ownerId) === DEFAULT_SERVER_PROOF_OWNER) {
    serverProofStateStore ??= serverProofStateRegistry.storeForOwner(DEFAULT_SERVER_PROOF_OWNER);
    return serverProofStateStore;
  }

  return serverProofStateRegistry.storeForOwner(ownerId);
}
