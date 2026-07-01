import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "./adapter";
import { buildStoreStateConnectRecord, type StoreStateRecord } from "./proof-state";
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

export async function publishReceizStoreState(accessToken: string | undefined, record: StoreStateRecord) {
  if (!accessToken) {
    return { ok: false, skipped: true, error: "receiz_authority_required" };
  }

  const receiz = createReceizCommerceAdapter({
    baseUrl: process.env.RECEIZ_BASE_URL,
    accessToken
  });
  const connectRecord = buildStoreStateConnectRecord(record);
  const hosts = [...publicStoreHostsForStoreState(record)];

  try {
    const connect = await receiz.connectRecord(connectRecord);
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
            idempotencyKey: `store-state:${record.id}:${host}`
          }
        )
      )
    );

    if (failedReceizResponse(connect) || publicStore.some(failedReceizResponse)) {
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
