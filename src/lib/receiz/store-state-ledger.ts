import {
  isStoreStateRecord,
  storeStateRecordHostAliases,
  storeStateRecordMatchesTenantHost,
  storeStateRecordsForTenantHost,
  type StoreStateRecord
} from "./proof-state";
import type { ProofStateStore } from "./proof-state-store";
import { RECEIZ_PUBLIC_STORE_STATE_PROJECTION_SCHEMA } from "@receiz/sdk";

const DEFAULT_LEDGER_LIMIT = 500;

function ledgerLimit() {
  const parsed = Number.parseInt(process.env.RECEIZ_STORE_STATE_LEDGER_LIMIT ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 500) : DEFAULT_LEDGER_LIMIT;
}

function uniqueRecords(records: StoreStateRecord[]) {
  const unique = new Map<string, StoreStateRecord>();

  for (const record of records) {
    unique.set(record.id, record);
  }

  return [...unique.values()];
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
  return uniqueRecords(collectStoreStateRecords(value));
}

async function recoverReceizPublicProofStoreStateRecordsForHost(tenantHost: string) {
  const { createReceizCommerceAdapter } = await import("./adapter");
  const receiz = createReceizCommerceAdapter({
    baseUrl: process.env.RECEIZ_BASE_URL
  });
  const normalizedHost = tenantHost.trim().toLowerCase();
  const urls = [`https://${normalizedHost}`, `https://${normalizedHost}/`];
  const records: StoreStateRecord[] = [];

  try {
    const restored = await receiz.client.publicStore.resolve({
      host: normalizedHost
    });
    records.push(...extractStoreStateRecords(restored));
  } catch {
    // Continue through the other SDK public projection reads; incomplete records are filtered below.
  }

  try {
    const restored = await receiz.resolveTenant(normalizedHost, {
      schema: RECEIZ_PUBLIC_STORE_STATE_PROJECTION_SCHEMA,
      state: "published",
      requiredDataKey: "storeStateRecord"
    });
    records.push(...extractStoreStateRecords(restored));
  } catch {
    // Continue through URL-addressed SDK public projection reads.
  }

  for (const url of urls) {
    try {
      const appState = await receiz.client.appState.byUrl(url);
      records.push(...extractStoreStateRecords(appState));
    } catch {
      // Missing public projections are expected for unpublished stores.
    }
  }

  return records;
}

async function recoverReceizPublicProofStoreStateRecords(tenantHost: string) {
  const normalizedHost = tenantHost.trim().toLowerCase();
  const queue = [normalizedHost];
  const queued = new Set(queue);
  const records: StoreStateRecord[] = [];

  while (queue.length) {
    const host = queue.shift();
    if (!host) continue;

    records.push(...(await recoverReceizPublicProofStoreStateRecordsForHost(host)));

    for (const record of storeStateRecordsForTenantHost(records, tenantHost)) {
      for (const alias of storeStateRecordHostAliases(record)) {
        if (!queued.has(alias) && queued.size < 12) {
          queued.add(alias);
          queue.push(alias);
        }
      }
    }
  }

  return storeStateRecordsForTenantHost(uniqueRecords(records), tenantHost);
}

export async function recoverReceizStoreStateRecords(tenantHost: string) {
  const records: StoreStateRecord[] = [];

  try {
    const { createReceizCommerceAdapter } = await import("./adapter");
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL
    });
    const ledger = await receiz.actionLedger({ limit: ledgerLimit() });

    records.push(...storeStateRecordsForTenantHost(extractStoreStateRecords(ledger), tenantHost));
  } catch {
    // The public action ledger is additive only. Public-proof recovery below is the durable storefront path.
  }

  try {
    records.push(...(await recoverReceizPublicProofStoreStateRecords(tenantHost)));
  } catch {
    // Keep tenant rendering resilient if Receiz public proof is temporarily unavailable.
  }

  return uniqueRecords(records);
}

export async function admitRecoveredStoreStateRecords(
  proofStore: ProofStateStore,
  tenantHost: string,
  recovered: StoreStateRecord[]
) {
  const knownRecordIds = new Set(
    storeStateRecordsForTenantHost(proofStore.records(), tenantHost).map((record) => record.id)
  );
  const matchingRecords = storeStateRecordsForTenantHost(recovered, tenantHost);
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
