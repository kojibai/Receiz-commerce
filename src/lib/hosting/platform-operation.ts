import type { CommerceState, HostingConfig } from "@/types/domain";
import { hostingBillingFromPlatformPayment } from "./platform-billing";

export const PLATFORM_OPERATION_SCHEMA = "receiz.app.platform_operation.v1" as const;

export type PlatformOperationIntent = {
  id: string;
  kind: "hosting_plan" | "custom_domain";
  merchantReceizId: string;
  tenantHost: string;
  amountUsd: string;
  recipientUserId: string;
  plan?: HostingConfig["plan"];
  domain?: string;
};

export type SettledPlatformOperation = PlatformOperationIntent & {
  receiptId: string;
  settledAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function cents(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.round(number) : -1;
}

export function platformOperationMetadata(operation: PlatformOperationIntent) {
  return {
    schema: PLATFORM_OPERATION_SCHEMA,
    operationId: operation.id,
    operationKind: operation.kind,
    merchantReceizId: operation.merchantReceizId,
    tenantHost: operation.tenantHost,
    expectedAmountUsd: Number(operation.amountUsd).toFixed(2),
    recipientUserId: operation.recipientUserId,
    ...(operation.plan ? { plan: operation.plan } : {}),
    ...(operation.domain ? { domain: operation.domain } : {})
  };
}

export function platformOperationIntentFromUnknown(value: unknown): PlatformOperationIntent | null {
  if (!isRecord(value)) return null;
  const data = isRecord(value.data) ? value.data : value;
  const metadata = data.schema === PLATFORM_OPERATION_SCHEMA
    ? data
    : isRecord(data.metadata) && data.metadata.schema === PLATFORM_OPERATION_SCHEMA
      ? data.metadata
      : null;
  if (!metadata) return null;

  const id = text(metadata, "operationId");
  const kind = text(metadata, "operationKind");
  const merchantReceizId = text(metadata, "merchantReceizId");
  const tenantHost = text(metadata, "tenantHost").toLowerCase();
  const amountUsd = text(metadata, "expectedAmountUsd");
  const recipientUserId = text(metadata, "recipientUserId");
  if (!id || !merchantReceizId || !tenantHost || !amountUsd || !recipientUserId) return null;

  if (kind === "hosting_plan") {
    const plan = text(metadata, "plan") as HostingConfig["plan"];
    if (!(["starter", "pro", "scale"] as string[]).includes(plan)) return null;
    return { id, kind, merchantReceizId, tenantHost, amountUsd, recipientUserId, plan };
  }
  if (kind === "custom_domain") {
    const domain = text(metadata, "domain").toLowerCase();
    return domain ? { id, kind, merchantReceizId, tenantHost, amountUsd, recipientUserId, domain } : null;
  }
  return null;
}

export function platformOperationIdFromWebhook(payload: unknown) {
  if (!isRecord(payload)) return "";
  const data = isRecord(payload.data) ? payload.data : payload;
  const reference = text(data, "clientNonce", "client_nonce", "referenceId", "reference_id", "orderId", "order_id");
  return reference.replace(/:(?:wallet|card)$/i, "");
}

export function findPlatformOperationIntent(value: unknown, operationId: string, depth = 0): PlatformOperationIntent | null {
  if (depth > 8 || value === null || value === undefined) return null;
  const direct = platformOperationIntentFromUnknown(value);
  if (direct?.id === operationId) return direct;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findPlatformOperationIntent(item, operationId, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(value)) return null;
  for (const item of Object.values(value)) {
    const found = findPlatformOperationIntent(item, operationId, depth + 1);
    if (found) return found;
  }
  return null;
}

export function settledPlatformOperationFromWebhook(
  payload: unknown,
  expected: { recipientUserId: string }
): SettledPlatformOperation | null {
  if (!isRecord(payload)) return null;
  const data = isRecord(payload.data) ? payload.data : payload;
  const metadata = isRecord(data.metadata)
    ? data.metadata
    : isRecord(payload.metadata)
      ? payload.metadata
      : null;
  if (!metadata || metadata.schema !== PLATFORM_OPERATION_SCHEMA) return null;

  const eventType = text(payload, "type", "event", "eventType", "event_type").toLowerCase();
  if (!["payment.settled", "payment.succeeded", "checkout.session.completed", "wallet.transfer.completed"].includes(eventType)) return null;

  const operationId = text(metadata, "operationId");
  const operationKind = text(metadata, "operationKind");
  const merchantReceizId = text(metadata, "merchantReceizId");
  const tenantHost = text(metadata, "tenantHost").toLowerCase();
  const amountUsd = text(metadata, "expectedAmountUsd");
  const recipientUserId = text(metadata, "recipientUserId");
  const actualRecipient = text(data, "recipientUserId", "recipient_user_id", "destinationUserId", "destination_user_id", "destinationReceizId", "destination_receiz_id");
  const actualAmountCents = cents(data.totalUsdCents ?? data.total_usd_cents ?? data.amountCents ?? data.amount_cents);
  const expectedAmountCents = Math.round(Number(amountUsd) * 100);
  const receiptId = text(data, "receiptId", "receipt_id", "paymentId", "payment_id", "transferId", "transfer_id", "id") || text(payload, "id");
  const settledAt = text(payload, "createdAt", "created_at", "timestamp", "occurredAt", "occurred_at") || new Date().toISOString();

  if (
    !operationId ||
    !merchantReceizId ||
    !tenantHost ||
    !receiptId ||
    !Number.isFinite(expectedAmountCents) ||
    actualAmountCents !== expectedAmountCents ||
    recipientUserId !== expected.recipientUserId ||
    actualRecipient !== expected.recipientUserId
  ) return null;

  if (operationKind === "hosting_plan") {
    const plan = text(metadata, "plan") as HostingConfig["plan"];
    if (!(["starter", "pro", "scale"] as string[]).includes(plan)) return null;
    return { id: operationId, kind: operationKind, merchantReceizId, tenantHost, amountUsd, recipientUserId, plan, receiptId, settledAt };
  }

  if (operationKind === "custom_domain") {
    const domain = text(metadata, "domain").toLowerCase();
    if (!domain) return null;
    return { id: operationId, kind: operationKind, merchantReceizId, tenantHost, amountUsd, recipientUserId, domain, receiptId, settledAt };
  }

  return null;
}

export function stateWithSettledPlatformOperation(
  state: CommerceState,
  operation: SettledPlatformOperation
): CommerceState {
  const proofEventId = `platform-operation:${operation.receiptId}`;
  if (state.proofEvents.some((event) => event.id === proofEventId)) return state;

  const hosting = operation.kind === "hosting_plan" && operation.plan
    ? { ...state.hosting, plan: operation.plan }
    : state.hosting;
  const billing = operation.kind === "hosting_plan" && operation.plan
    ? hostingBillingFromPlatformPayment(state.billing, operation.plan, {
        ok: true,
        mode: "live",
        paid: true,
        amountUsd: operation.amountUsd,
        message: "Signed Receiz settlement recovered"
      })
    : state.billing;

  return {
    ...state,
    hosting,
    billing,
    proofEvents: [
      {
        id: proofEventId,
        type: "OBJECT_VERIFIED",
        title: "PLATFORM_PAYMENT_SETTLED",
        detail: `${operation.kind} · ${operation.receiptId} · ${operation.amountUsd}`,
        status: "verified",
        timestampLabel: "now",
        createdAt: operation.settledAt
      },
      ...state.proofEvents
    ]
  };
}
