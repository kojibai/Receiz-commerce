import { cleanHost } from "../hosting/domain-utils";
import { COMMERCE_EVENT_SCHEMA, type CommerceEventRecord, type CommerceEventType } from "../receiz/proof-state";
import type { Order } from "../../types/domain";

export type CheckoutCommerceEventInput = {
  checkoutSessionId?: string;
  createdAt?: string;
  customerEmail?: string;
  customerId?: string;
  customerName?: string;
  funding?: Order["funding"];
  itemCount?: number;
  merchantReceizId?: string;
  orderId?: string;
  paymentRail?: Order["paymentRail"];
  proofBundle?: Record<string, unknown> | null;
  receiptId?: string;
  settlementStatus?: Order["settlementStatus"];
  fulfillment?: Order["fulfillment"];
  shipping?: Order["shipping"];
  tenantHost: string;
  totalLabel?: string;
};

function fallbackMerchantReceizId(tenantHost: string) {
  const slug = cleanHost(tenantHost).split(".")[0] || "merchant";
  return `${slug}.receiz.id`;
}

function eventTypeForSettlement(status: Order["settlementStatus"] | undefined): CommerceEventType {
  if (status === "card_required") return "checkout.requires_card";
  if (status === "pending") return "checkout.created";
  return "checkout.settled";
}

function stableEventId(input: CheckoutCommerceEventInput) {
  const tenantHost = cleanHost(input.tenantHost) || "tenant";
  const checkoutId = input.checkoutSessionId || input.orderId || `${Date.now()}`;
  return `checkout:${tenantHost}:${checkoutId}`;
}

export function checkoutCommerceEvent(input: CheckoutCommerceEventInput): CommerceEventRecord {
  const tenantHost = cleanHost(input.tenantHost);
  const merchantReceizId = input.merchantReceizId?.trim() || fallbackMerchantReceizId(tenantHost);
  const checkoutSessionId = input.checkoutSessionId || input.orderId || stableEventId(input);
  const orderId = input.orderId || checkoutSessionId;

  return {
    schema: COMMERCE_EVENT_SCHEMA,
    id: stableEventId({ ...input, checkoutSessionId, orderId }),
    type: eventTypeForSettlement(input.settlementStatus),
    createdAt: input.createdAt ?? new Date().toISOString(),
    tenantHost,
    merchantReceizId,
    data: {
      checkoutSessionId,
      customerEmail: input.customerEmail,
      customerId: input.customerId,
      customerName: input.customerName,
      funding: input.funding,
      itemCount: input.itemCount,
      orderId,
      paymentRail: input.paymentRail,
      proofBundle: input.proofBundle ?? null,
      receiptId: input.receiptId,
      settlementStatus: input.settlementStatus,
      fulfillment: input.fulfillment,
      shipping: input.shipping,
      totalLabel: input.totalLabel
    }
  };
}
