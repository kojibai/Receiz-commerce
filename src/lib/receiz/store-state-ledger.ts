import {
  isStoreStateRecord,
  storeStateRecordMatchesTenantHost,
  type StoreStateRecord
} from "./proof-state";
import type { ProofStateStore } from "./proof-state-store";

const DEFAULT_LEDGER_LIMIT = 500;

function ledgerLimit() {
  const parsed = Number.parseInt(process.env.RECEIZ_STORE_STATE_LEDGER_LIMIT ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 500) : DEFAULT_LEDGER_LIMIT;
}

export function extractStoreStateRecords(value: unknown, depth = 0, seen = new WeakSet<object>()): StoreStateRecord[] {
  if (depth > 8 || value === null || value === undefined) return [];

  if (isStoreStateRecord(value)) return [value];

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractStoreStateRecords(item, depth + 1, seen));
  }

  if (typeof value !== "object") return [];
  if (seen.has(value)) return [];
  seen.add(value);

  return Object.values(value).flatMap((item) => extractStoreStateRecords(item, depth + 1, seen));
}

export async function recoverReceizStoreStateRecords(tenantHost: string) {
  try {
    const { createReceizCommerceAdapter } = await import("./adapter");
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL
    });
    const ledger = await receiz.actionLedger({ limit: ledgerLimit() });

    return extractStoreStateRecords(ledger).filter((record) =>
      storeStateRecordMatchesTenantHost(record, tenantHost)
    );
  } catch {
    return [];
  }
}

export async function hydrateProofStoreFromReceizStoreState(proofStore: ProofStateStore, tenantHost: string) {
  if (proofStore.records().some((record) => isStoreStateRecord(record) && storeStateRecordMatchesTenantHost(record, tenantHost))) {
    return { admitted: 0, recovered: 0 };
  }

  const recovered = await recoverReceizStoreStateRecords(tenantHost);

  for (const record of recovered) {
    await proofStore.admitStoreRecord(record);
  }

  return { admitted: recovered.length, recovered: recovered.length };
}
