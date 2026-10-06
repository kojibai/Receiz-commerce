import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Order } from "../../types/domain";
import type { ReceizCommerceAdapter } from "../receiz/adapter";
import { receizOAuthSecret } from "../receiz/oauth-state";
import type { PaymentContinuation } from "./payment-continuation";
import type { authoritativeCheckoutQuote } from "./checkout-authority";
import { merchantCheckoutUsername } from "./payment-contract";
import { checkoutCompletionState, checkoutOrderFulfillment, validShippingAddress } from "./customer-purchase";
import { createWalletFirstReceizSettlement } from "./receiz-settlement";

const PURPOSE = "receiz-storefront-order-coordinates:v1";
const MAX_TOKEN_LENGTH = 64_000;
export type OrderRecoveryCoordinates = Readonly<{
  schema: "receiz.app.order_recovery_coordinates.v1";
  payment: PaymentContinuation;
  payerUserId?: string;
  createdAt: string;
}>;

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function key(secret: string) {
  if (!secret.trim()) throw new Error("order_recovery_secret_required");
  return createHash("sha256").update(PURPOSE).update("\0").update(secret).digest();
}

function validate(value: unknown): OrderRecoveryCoordinates {
  if (!record(value) || value.schema !== "receiz.app.order_recovery_coordinates.v1" || !record(value.payment)) {
    throw new Error("order_recovery_invalid");
  }
  const coordinates = value as OrderRecoveryCoordinates;
  const payment = coordinates.payment;
  if (payment.purpose !== "storefront_checkout" ||
    [payment.tenantHost, payment.merchantUsername, payment.referenceId, payment.checkoutSessionId].some(v => typeof v !== "string" || !v.trim()) ||
    !/^\d+(?:\.\d{1,2})?$/.test(payment.amountUsd) || !record(payment.funding) || !record(payment.context) ||
    typeof coordinates.createdAt !== "string" || !Number.isFinite(Date.parse(coordinates.createdAt))) throw new Error("order_recovery_invalid");
  if (payment.actorReceizId !== undefined && (typeof payment.actorReceizId !== "string" || !payment.actorReceizId.trim() ||
    typeof coordinates.payerUserId !== "string" || !coordinates.payerUserId.trim())) throw new Error("order_recovery_invalid");
  if (coordinates.payerUserId !== undefined && (typeof coordinates.payerUserId !== "string" || !coordinates.payerUserId.trim() || !payment.actorReceizId)) {
    throw new Error("order_recovery_invalid");
  }
  const { totalUsdCents, walletBalanceUsdCents, walletAppliedUsdCents, cardDeltaUsdCents } = payment.funding;
  if ([totalUsdCents, walletBalanceUsdCents, walletAppliedUsdCents, cardDeltaUsdCents].some(v => !Number.isSafeInteger(v) || v < 0) ||
    totalUsdCents <= 0 || totalUsdCents !== Math.round(Number(payment.amountUsd) * 100) ||
    walletAppliedUsdCents !== Math.min(totalUsdCents, walletBalanceUsdCents) || cardDeltaUsdCents !== totalUsdCents - walletAppliedUsdCents) {
    throw new Error("order_recovery_invalid");
  }
  const quote = payment.context.quote as ReturnType<typeof authoritativeCheckoutQuote>;
  if (!record(quote) || typeof quote.merchantReceizId !== "string" || typeof quote.recipientUserId !== "string" || !quote.recipientUserId.trim() ||
    merchantCheckoutUsername(quote.merchantReceizId) !== payment.merchantUsername || quote.amountUsd !== payment.amountUsd ||
    quote.totalUsdCents !== totalUsdCents || !Array.isArray(quote.items) || !quote.items.length || quote.items.length > 100 ||
    quote.items.some(item => !record(item) || typeof item.id !== "string" || !item.id.trim() ||
      !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 || typeof item.amountUsd !== "string" ||
      !/^\d+(?:\.\d{1,2})?$/.test(item.amountUsd)) ||
    quote.items.reduce((total, item) => total + Math.round(Number(item.amountUsd) * 100), 0) !== totalUsdCents ||
    quote.items.reduce((total, item) => total + item.quantity, 0) !== quote.itemCount ||
    !record(payment.context.customer) || !record(payment.context.customer.fulfillment) ||
    !["physical_shipping", "digital_delivery", "mixed"].includes(String(payment.context.customer.fulfillment.kind))) {
    throw new Error("order_recovery_quote_mismatch");
  }
  return coordinates;
}

/** Encrypted original-session coordinates, never a proof object, paid flag,
 * debit permission, or fulfillment grant. Every recovery rechecks the SDK rail. */
export function encodeOrderRecoveryCoordinates(value: OrderRecoveryCoordinates, secret = receizOAuthSecret()) {
  const coordinates = validate(value);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  cipher.setAAD(Buffer.from(PURPOSE));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(coordinates), "utf8"), cipher.final()]);
  const token = ["or1", iv.toString("base64url"), ciphertext.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
  if (token.length > MAX_TOKEN_LENGTH) throw new Error("order_recovery_too_large");
  return token;
}

export function readOrderRecoveryCoordinates(token: string, tenantHost: string, secret = receizOAuthSecret()) {
  if (typeof token !== "string" || token.length > MAX_TOKEN_LENGTH) throw new Error("order_recovery_invalid");
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "or1" || parts.slice(1).some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw new Error("order_recovery_invalid");
  let value: unknown;
  try {
    const iv = Buffer.from(parts[1], "base64url"), tag = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16) throw new Error("invalid_envelope");
    const decipher = createDecipheriv("aes-256-gcm", key(secret), iv);
    decipher.setAAD(Buffer.from(PURPOSE));
    decipher.setAuthTag(tag);
    value = JSON.parse(Buffer.concat([decipher.update(Buffer.from(parts[2], "base64url")), decipher.final()]).toString("utf8"));
  } catch { throw new Error("order_recovery_invalid"); }
  const coordinates = validate(value);
  if (coordinates.payment.tenantHost !== tenantHost) throw new Error("order_recovery_tenant_mismatch");
  return coordinates;
}

export function assertOrderRecoveryReader(coordinates: OrderRecoveryCoordinates, reader: { handle?: string; userId?: string }) {
  const quote = coordinates.payment.context.quote as ReturnType<typeof authoritativeCheckoutQuote>;
  if (reader.handle && merchantCheckoutUsername(reader.handle) === coordinates.payment.merchantUsername &&
    (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(quote.recipientUserId) || reader.userId === quote.recipientUserId)) return "merchant" as const;
  if (coordinates.payment.actorReceizId && (reader.handle !== coordinates.payment.actorReceizId || reader.userId !== coordinates.payerUserId)) {
    throw new Error("order_recovery_identity_required");
  }
  return "buyer" as const;
}

export async function recoverOriginalOrder(input: {
  receiz: ReceizCommerceAdapter; coordinates: OrderRecoveryCoordinates; reader: { handle?: string; userId?: string };
}) {
  const coordinates = validate(input.coordinates);
  const role = assertOrderRecoveryReader(coordinates, input.reader);
  const payment = coordinates.payment;
  const quote = payment.context.quote as ReturnType<typeof authoritativeCheckoutQuote>;
  const settlement = await createWalletFirstReceizSettlement({
    receiz: input.receiz, tenantHost: payment.tenantHost, merchantUsername: payment.merchantUsername,
    recipientUserId: quote.recipientUserId, amountUsd: payment.amountUsd, orderId: payment.referenceId,
    idempotencyKey: payment.referenceId, buyerAuthenticated: false, note: "Recover the original store order",
    resume: { checkoutSessionId: payment.checkoutSessionId, funding: payment.funding }
  });
  const customer = payment.context.customer as Record<string, unknown>;
  const shipping = validShippingAddress(customer.shipping as Order["shipping"]) ? customer.shipping as Order["shipping"] : undefined;
  const completion = checkoutCompletionState({ funding: settlement.funding, products: [], shipping,
    fulfillmentKind: (customer.fulfillment as NonNullable<Order["fulfillment"]>).kind });
  const order: Order | null = settlement.paid ? {
    id: payment.referenceId, customerId: payment.actorReceizId || `guest:${payment.referenceId}`,
    customerEmail: typeof customer.customerEmail === "string" ? customer.customerEmail : undefined,
    itemCount: quote.itemCount, totalLabel: settlement.funding.totalLabel,
    createdAt: coordinates.createdAt, merchantReceizId: quote.merchantReceizId, tenantHost: payment.tenantHost,
    checkoutSessionId: payment.checkoutSessionId, paymentRail: settlement.paymentRail,
    settlementStatus: settlement.settlementStatus, status: completion.orderStatus, sealed: false,
    funding: settlement.funding, shipping, fulfillment: checkoutOrderFulfillment(completion)
  } : null;
  return { role, settlement, quote, order };
}
