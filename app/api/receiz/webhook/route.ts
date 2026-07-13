import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import {
  findPlatformOperationIntent,
  platformOperationIdFromWebhook,
  platformOperationMetadata,
  settledPlatformOperationFromWebhook,
  stateWithSettledPlatformOperation
} from "@/lib/hosting/platform-operation";
import { addProjectDomain, customDomainStatusFromVercel } from "@/lib/hosting/vercel-domains";
import { checkVercelDomainDns } from "@/lib/hosting/dns-check";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { buildStoreStateRecord, commerceEventFromUnknown, storeStateProjectionSource } from "@/lib/receiz/proof-state";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { hydrateProofStoreFromReceizStoreState } from "@/lib/receiz/store-state-ledger";
import {
  publishAndAdmitReceizStoreState,
  receizStoreStateSyncCompleted,
  summarizeReceizStoreStatePublicationResult
} from "@/lib/receiz/store-state-publication";
import { mockStorage } from "@/lib/storage/mock-storage";
import {
  commerceWebhookAuthorityIsComplete,
  explicitWebhookEventId,
  webhookTimestampIsFresh
} from "@/lib/receiz/webhook-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown webhook error";
}

async function verifyWebhookBody(bodyText: string, request: NextRequest) {
  const secret = process.env.RECEIZ_WEBHOOK_SECRET;
  if (!secret) return { ok: false, error: "webhook_secret_not_configured" };

  const signature = request.headers.get("x-receiz-signature") ?? "";
  const timestamp = request.headers.get("x-receiz-timestamp") ?? "";
  if (!signature || !timestamp) return { ok: false, error: "missing_signature" };
  if (!webhookTimestampIsFresh(timestamp)) return { ok: false, error: "stale_signature" };

  const receiz = createReceizCommerceAdapter({
    baseUrl: process.env.RECEIZ_BASE_URL
  });
  const ok = await receiz.verifyWebhookSignature({
    secret,
    timestamp,
    signature,
    body: bodyText
  });

  return ok ? { ok: true, mode: "signed" } : { ok: false, error: "invalid_signature" };
}

async function resumePlatformOperation(payload: unknown) {
  const recipientUserId = process.env.RECEIZ_PLATFORM_ACCOUNT_ID ?? process.env.RECEIZ_PLATFORM_USER_ID;
  if (!recipientUserId) return null;
  const operationId = platformOperationIdFromWebhook(payload);
  const accessToken = process.env.RECEIZ_ACCESS_TOKEN ?? process.env.RECEIZ_CONNECT_ACCESS_TOKEN;
  if (!operationId || !accessToken) return null;
  const receiz = createReceizCommerceAdapter({ baseUrl: process.env.RECEIZ_BASE_URL, accessToken });
  const ledger = await receiz.actionLedger({ limit: 500 });
  const intent = findPlatformOperationIntent(ledger, operationId);
  if (!intent) return null;
  const webhookRecord = payload && typeof payload === "object" && !Array.isArray(payload) ? payload as Record<string, unknown> : {};
  const data = webhookRecord.data && typeof webhookRecord.data === "object" && !Array.isArray(webhookRecord.data)
    ? webhookRecord.data as Record<string, unknown>
    : {};
  const operation = settledPlatformOperationFromWebhook(
    { ...webhookRecord, data: { ...data, metadata: platformOperationMetadata(intent) } },
    { recipientUserId }
  );
  if (!operation) return null;

  const proofStore = await getServerProofStateStore(operation.merchantReceizId);
  await hydrateProofStoreFromReceizStoreState(proofStore, operation.tenantHost);
  let state = stateWithSettledPlatformOperation(
    proofStore.projectHost(mockStorage.getState(), operation.tenantHost),
    operation
  );

  if (operation.kind === "custom_domain" && operation.domain) {
    const vercelDomain = await addProjectDomain(operation.domain);
    const dns = await checkVercelDomainDns(operation.domain);
    const customDomain = customDomainStatusFromVercel(operation.domain, vercelDomain, dns);
    const live = Boolean(customDomain.verified && customDomain.dnsResolved && customDomain.sslStatus === "valid");
    state = {
      ...state,
      hosting: {
        ...state.hosting,
        mode: "hosted_platform",
        customDomain,
        liveUrl: live ? customDomain.liveUrl ?? `https://${operation.domain}` : `https://${state.hosting.subdomain}`
      }
    };
  }

  const storeRecord = buildStoreStateRecord(state, {
    actorReceizId: operation.merchantReceizId,
    tenantHost: operation.tenantHost,
    reason: "sync",
    recordedAt: operation.settledAt
  });
  const publication = await publishAndAdmitReceizStoreState({ accessToken, proofStore, record: storeRecord });
  if (!receizStoreStateSyncCompleted(publication)) {
    throw new Error("Recovered platform operation could not be published to Receiz public store state.");
  }

  return {
    resumed: true,
    operationId: operation.id,
    operationKind: operation.kind,
    receiptId: operation.receiptId,
    storeState: summarizeReceizStoreStatePublicationResult(publication)
  };
}

export async function POST(request: NextRequest) {
  const bodyText = await request.text();
  const signature = await verifyWebhookBody(bodyText, request);

  if (!signature.ok) {
    return NextResponse.json({ ok: false, error: signature.error }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (signature.mode === "signed") {
    try {
      const platformOperation = await resumePlatformOperation(payload);
      if (platformOperation) {
        return NextResponse.json({ ok: true, signature, platformOperation });
      }
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: "platform_operation_recovery_failed", message: errorMessage(error) },
        { status: 503 }
      );
    }
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(host);
  const event = commerceEventFromUnknown(payload, hostContext.tenantHost ?? hostContext.host);

  if (!event) {
    return NextResponse.json({
      ok: true,
      signature,
      admitted: false,
      ignored: true,
      reason: "unsupported_webhook_payload"
    });
  }
  if (!commerceWebhookAuthorityIsComplete(event, explicitWebhookEventId(payload))) {
    return NextResponse.json(
      { ok: false, error: "webhook_event_authority_incomplete" },
      { status: 422 }
    );
  }

  try {
    const proofStore = await getServerProofStateStore();
    await hydrateProofStoreFromReceizStoreState(proofStore, event.tenantHost);
    if (storeStateProjectionSource(proofStore.records(), event.tenantHost) !== "published") {
      return NextResponse.json({ ok: false, error: "webhook_tenant_not_published" }, { status: 409 });
    }
    const state = proofStore.projectHost(mockStorage.getState(), event.tenantHost);
    if (state.hosting.merchantReceizId !== event.merchantReceizId) {
      return NextResponse.json({ ok: false, error: "webhook_merchant_mismatch" }, { status: 403 });
    }
    const result = await proofStore.admitCommerceEvent(mockStorage.getState(), event);

    return NextResponse.json({
      ok: true,
      signature,
      admitted: result.admitted,
      eventId: event.id,
      proofMemory: {
        knownHead: proofStore.knownHead(100),
        entries: proofStore.snapshot().head.count
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "webhook_admission_failed",
        message: errorMessage(error)
      },
      { status: 500 }
    );
  }
}
