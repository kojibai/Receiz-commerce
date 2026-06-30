import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "./adapter";
import { buildStoreStateConnectRecord, type StoreStateRecord } from "./proof-state";

function hostUrl(host: string) {
  return `https://${host.trim().toLowerCase()}`;
}

function publicProofRecordsForStoreState(record: StoreStateRecord) {
  const hosts = new Set(
    [record.state.hosting.subdomain, record.state.hosting.customDomain.domain, record.tenantHost]
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  );
  const connectRecord = buildStoreStateConnectRecord(record);

  return [...hosts].map((host) => ({
    id: `${record.id}:${host}`,
    sourceUrl: hostUrl(host),
    externalCreatorId: record.merchantReceizId,
    title: `${record.state.brand.name} storefront`,
    state: "published",
    platform: platform.productName,
    schema: "receiz.app.public_store_state_projection.v1",
    record,
    data: {
      storeStateRecord: record,
      storeStateConnectRecord: connectRecord
    }
  }));
}

function receizError(error: unknown) {
  return error instanceof Error ? error.message : "Receiz store-state publication failed";
}

function failedReceizResponse(value: unknown) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && (value as { ok?: unknown }).ok === false;
}

export async function publishReceizStoreState(accessToken: string | undefined, record: StoreStateRecord) {
  if (!accessToken) {
    return { ok: false, skipped: true, error: "receiz_login_required" };
  }

  const receiz = createReceizCommerceAdapter({
    baseUrl: process.env.RECEIZ_BASE_URL,
    accessToken
  });
  const connectRecord = buildStoreStateConnectRecord(record);
  const publicProofFeed = {
    schema: "receiz.app.public_store_state_registry_feed.v1",
    records: publicProofRecordsForStoreState(record)
  };

  try {
    const connect = await receiz.connectRecord(connectRecord);
    const publicProof = await receiz.client.publicProof.registryFeed(publicProofFeed);

    if (failedReceizResponse(connect) || failedReceizResponse(publicProof)) {
      return {
        ok: false,
        error: "receiz_store_state_publication_failed",
        connect,
        publicProof
      };
    }

    return {
      ok: true,
      connect,
      publicProof
    };
  } catch (error) {
    return {
      ok: false,
      error: receizError(error)
    };
  }
}
