import { platform } from "../platform";
import { buildStoreStateConnectRecord, type StoreStateRecord } from "./proof-state";
import type { ProofStateStore } from "./proof-state-store";
import { type JsonObject, type ReceizKeyFile } from "@receiz/sdk";

type StoreStatePublishProof = {
  keyFile?: unknown;
  passphrase?: string;
};

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

function auxiliaryConnectSkipped() {
  return {
    ok: true,
    skipped: true,
    reason: "connect_record_delegated_transport_unavailable",
    message: "Auxiliary Connect event write skipped; public store-state projection is the durable append rail."
  };
}

async function writeAuxiliaryConnectRecord(
  accessToken: string | undefined,
  connectRecord: JsonObject,
  connect: (body: JsonObject) => Promise<JsonObject>
) {
  if (!accessToken) return auxiliaryConnectSkipped();

  try {
    return await connect(connectRecord);
  } catch (error) {
    return {
      ok: false,
      auxiliary: true,
      error: receizError(error)
    };
  }
}

function failedReceizResponse(value: unknown) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && (value as { ok?: unknown }).ok === false;
}

function skippedReceizSync(value: unknown) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && (value as { skipped?: unknown }).skipped === true;
}

function isReceizKeyFile(value: unknown): value is ReceizKeyFile {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function publicStorePublishInput(host: string, record: StoreStateRecord, connectRecord: JsonObject) {
  return {
    id: `store_state:${host}`,
    tenantHost: host,
    merchantReceizId: record.merchantReceizId,
    title: `${record.state.brand.name} storefront`,
    sourceUrl: hostUrl(host),
    namespace: host,
    projectionState: "published",
    platform: platform.productName,
    record: record as unknown as JsonObject,
    data: {
      storeStateRecord: record,
      storeStateConnectRecord: connectRecord
    } as unknown as JsonObject
  };
}

export function receizStoreStateWriteSucceeded(result: unknown) {
  return !failedReceizResponse(result) && !skippedReceizSync(result);
}

export function receizStoreStateSyncCompleted(result: unknown) {
  return receizStoreStateWriteSucceeded(result);
}

export async function publishReceizStoreState(
  accessToken: string | undefined,
  record: StoreStateRecord,
  proof: StoreStatePublishProof = {}
) {
  const connectRecord = buildStoreStateConnectRecord(record);
  const hosts = [...publicStoreHostsForStoreState(record)];
  const keyFile = isReceizKeyFile(proof.keyFile) ? proof.keyFile : undefined;

  try {
    const { createReceizCommerceAdapter } = await import("./adapter");
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });
    const connect = await writeAuxiliaryConnectRecord(accessToken, connectRecord as JsonObject, (body) =>
      receiz.connectRecord(body)
    );
    const publicStore = await Promise.all(
      hosts.map(async (host) => {
        const idempotencyKey = `store-state:${record.id}:${host}`;
        const input = publicStorePublishInput(host, record, connectRecord as JsonObject);

        if (keyFile) {
          const signed = await receiz.client.publicStore.signPublish({
            ...input,
            storeStateRecord: record as unknown as JsonObject,
            keyFile,
            passphrase: proof.passphrase
          });

          return receiz.client.publicStore.publishSigned(signed, { idempotencyKey });
        }

        return receiz.client.publicStore.publish(
          {
            ...input,
            state: record as unknown as JsonObject
          },
          { idempotencyKey }
        );
      })
    );

    if (publicStore.some(failedReceizResponse)) {
      return {
        ok: false,
        error: "receiz_store_state_publication_failed",
        connect,
        publicStore
      };
    }

    return {
      ok: true,
      connect,
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

export async function publishAndAdmitReceizStoreState({
  accessToken,
  proofStore,
  publish = publishReceizStoreState,
  proof,
  record
}: {
  accessToken: string | undefined;
  proofStore: ProofStateStore;
  publish?: (accessToken: string | undefined, record: StoreStateRecord, proof?: StoreStatePublishProof) => Promise<unknown>;
  proof?: StoreStatePublishProof;
  record: StoreStateRecord;
}) {
  await proofStore.admitStoreRecord(record);
  const receizRecord = await publish(accessToken, record, proof);

  return receizRecord;
}
