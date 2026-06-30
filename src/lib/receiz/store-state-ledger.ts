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

function collectStoreStateRecords(value: unknown, depth = 0, seen = new WeakSet<object>()): StoreStateRecord[] {
  if (depth > 8 || value === null || value === undefined) return [];

  if (isStoreStateRecord(value)) return [value];

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStoreStateRecords(item, depth + 1, seen));
  }

  if (typeof value !== "object") return [];
  if (seen.has(value)) return [];
  seen.add(value);

  return Object.values(value).flatMap((item) => collectStoreStateRecords(item, depth + 1, seen));
}

export function extractStoreStateRecords(value: unknown): StoreStateRecord[] {
  const uniqueRecords = new Map<string, StoreStateRecord>();

  for (const record of collectStoreStateRecords(value)) {
    uniqueRecords.set(record.id, record);
  }

  return [...uniqueRecords.values()];
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

export async function admitRecoveredStoreStateRecords(
  proofStore: ProofStateStore,
  tenantHost: string,
  recovered: StoreStateRecord[]
) {
  const knownRecordIds = new Set(
    proofStore
      .records()
      .filter((record) => isStoreStateRecord(record) && storeStateRecordMatchesTenantHost(record, tenantHost))
      .map((record) => record.id)
  );
  const matchingRecords = recovered.filter((record) => storeStateRecordMatchesTenantHost(record, tenantHost));
  let admitted = 0;

  for (const record of matchingRecords) {
    if (!knownRecordIds.has(record.id)) admitted += 1;
    await proofStore.admitStoreRecord(record);
  }

  return { admitted, recovered: matchingRecords.length };
}

export async function hydrateProofStoreFromReceizStoreState(proofStore: ProofStateStore, tenantHost: string) {
  const recovered = await recoverReceizStoreStateRecords(tenantHost);

  return admitRecoveredStoreStateRecords(proofStore, tenantHost, recovered);
}
