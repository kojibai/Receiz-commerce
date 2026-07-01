import { platform } from "../platform";
import {
  STORE_STATE_CONNECT_SCHEMA,
  buildStoreStateConnectRecord,
  buildStoreStateRecord,
  publishedStoreStateFromCommerceState,
  type StoreStateRecord
} from "./proof-state";
import type { CommerceState } from "../../types/domain";
import { type JsonObject } from "@receiz/sdk";

function hostUrl(host: string) {
  return `https://${host.trim().toLowerCase()}`;
}

function publicStoreHostsForStoreState(record: StoreStateRecord) {
  return new Set(
    [record.state.hosting.subdomain, record.state.hosting.customDomain.domain, record.tenantHost]
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  );
}

function receizError(error: unknown) {
  return error instanceof Error ? error.message : "Receiz store-state publication failed";
}

function failedReceizResponse(value: unknown) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && (value as { ok?: unknown }).ok === false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function kaiValue(value: unknown): string | number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return stringValue(value);
}

function proofObject(value: Record<string, unknown>): JsonObject | null {
  for (const key of ["proofBundle", "proof", "appendProof"]) {
    const candidate = value[key];
    if (isRecord(candidate)) return candidate as JsonObject;
  }

  return value.kind === "receiz.proof_bundle" ? (value as JsonObject) : null;
}

function candidateObjects(value: unknown, depth = 0): Record<string, unknown>[] {
  if (!isRecord(value) || depth > 4) return [];

  const nestedKeys = [
    "result",
    "data",
    "record",
    "append",
    "appendRecord",
    "proof",
    "proofBundle",
    "anchor",
    "event"
  ];

  return [
    value,
    ...nestedKeys.flatMap((key) => candidateObjects(value[key], depth + 1))
  ];
}

function firstKaiValue(value: unknown) {
  for (const candidate of candidateObjects(value)) {
    const result =
      kaiValue(candidate.kaiUpulse) ??
      kaiValue(candidate.kaiPulse) ??
      kaiValue(candidate.kaiPulseEternal);
    if (result) return result;
  }

  return null;
}

function firstStringKey(value: unknown, keys: string[]) {
  for (const candidate of candidateObjects(value)) {
    for (const key of keys) {
      const result = stringValue(candidate[key]);
      if (result) return result;
    }
  }

  return null;
}

function firstProofObject(value: unknown) {
  for (const candidate of candidateObjects(value)) {
    const result = proofObject(candidate);
    if (result) return result;
  }

  return null;
}

export function extractReceizStoreAppendCoordinate(value: unknown) {
  for (const candidate of candidateObjects(value)) {
    const kaiUpulse =
      kaiValue(candidate.kaiUpulse) ??
      kaiValue(candidate.kaiPulse) ??
      kaiValue(candidate.kaiPulseEternal) ??
      firstKaiValue(candidate.proofBundle) ??
      firstKaiValue(candidate.proof) ??
      firstKaiValue(candidate.appendProof);
    if (!kaiUpulse) continue;

    const anchorId =
      stringValue(candidate.anchorId) ??
      stringValue(candidate.anchorHash) ??
      stringValue(candidate.appendId) ??
      stringValue(candidate.id) ??
      firstStringKey(candidate.anchor, ["anchorId", "id", "hash"]) ??
      firstStringKey(candidate.proofBundle, ["anchorId", "anchorHash", "appendId"]) ??
      firstStringKey(candidate.proof, ["anchorId", "anchorHash", "appendId"]);
    if (!anchorId) continue;

    const recordedAt =
      stringValue(candidate.recordedAt) ??
      stringValue(candidate.createdAt) ??
      stringValue(candidate.ts) ??
      stringValue(candidate.observedAt) ??
      firstStringKey(candidate.proofBundle, ["recordedAt", "createdAt", "ts", "observedAt"]) ??
      firstStringKey(candidate.proof, ["recordedAt", "createdAt", "ts", "observedAt"]);
    if (!recordedAt) continue;

    return {
      kaiUpulse,
      anchorId,
      recordedAt,
      proof: proofObject(candidate) ?? firstProofObject(candidate.proofBundle) ?? firstProofObject(candidate.proof)
    };
  }

  return null;
}

function buildStoreStateAppendRequest(
  state: CommerceState,
  input: {
    actorReceizId: string;
    tenantHost: string;
    reason?: StoreStateRecord["reason"];
  }
) {
  return {
    schema: STORE_STATE_CONNECT_SCHEMA,
    event: "store.state.published",
    platform: platform.productName,
    tenantHost: input.tenantHost,
    tenantSlug: state.hosting.tenantSlug,
    merchantReceizId: state.hosting.merchantReceizId || input.actorReceizId,
    data: {
      action: "store.published",
      reason: input.reason ?? "publish",
      state: publishedStoreStateFromCommerceState(state)
    }
  } as unknown as JsonObject;
}

export async function publishReceizStoreState(
  accessToken: string | undefined,
  state: CommerceState,
  input: {
    actorReceizId: string;
    tenantHost: string;
    reason?: StoreStateRecord["reason"];
  }
) {
  if (!accessToken) {
    return { ok: false, skipped: true, error: "receiz_authority_required" };
  }

  const { createReceizCommerceAdapter } = await import("./adapter");
  const receiz = createReceizCommerceAdapter({
    baseUrl: process.env.RECEIZ_BASE_URL,
    accessToken
  });

  try {
    const connect = await receiz.connectRecord(buildStoreStateAppendRequest(state, input));
    if (failedReceizResponse(connect)) {
      return {
        ok: false,
        error: "receiz_store_state_append_failed",
        connect
      };
    }

    const appendCoordinate = extractReceizStoreAppendCoordinate(connect);
    if (!appendCoordinate) {
      return {
        ok: false,
        error: "receiz_store_state_append_coordinate_missing",
        message: "Receiz append response did not include kaiUpulse, anchorId, and recordedAt.",
        connect
      };
    }

    const record = buildStoreStateRecord(state, {
      actorReceizId: input.actorReceizId,
      tenantHost: input.tenantHost,
      reason: input.reason ?? "publish",
      recordedAt: appendCoordinate.recordedAt,
      updatedKaiUpulse: appendCoordinate.kaiUpulse,
      appendAnchorId: appendCoordinate.anchorId,
      appendProof: appendCoordinate.proof
    });
    const connectRecord = buildStoreStateConnectRecord(record);
    const hosts = [...publicStoreHostsForStoreState(record)];
    const publicStore = await Promise.all(
      hosts.map((host) =>
        receiz.client.publicStore.publish(
          {
            id: `store_state:${host}`,
            tenantHost: host,
            merchantReceizId: record.merchantReceizId,
            title: `${record.state.brand.name} storefront`,
            sourceUrl: hostUrl(host),
            namespace: host,
            projectionState: "published",
            platform: platform.productName,
            state: record as unknown as JsonObject,
            record: record as unknown as JsonObject,
            data: {
              storeStateRecord: record,
              storeStateConnectRecord: connectRecord
            } as unknown as JsonObject
          },
          {
            idempotencyKey: `storefront:${record.updatedKaiUpulse}:${host}`
          }
        )
      )
    );

    if (publicStore.some(failedReceizResponse)) {
      return {
        ok: false,
        error: "receiz_store_state_publication_failed",
        record,
        connect,
        publicStore
      };
    }

    return {
      ok: true,
      connect,
      record,
      appendCoordinate,
      appState: publicStore,
      publicStore
    };
  } catch (error) {
    return {
      ok: false,
      error: receizError(error)
    };
  }
}
