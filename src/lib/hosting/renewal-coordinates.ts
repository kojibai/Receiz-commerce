import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { PaymentContinuation } from "../checkout/payment-continuation";
import { createWalletFirstReceizSettlement } from "../checkout/receiz-settlement";
import { reserveContext } from "../checkout/native-reserve-request";
import type { ReceizCommerceAdapter } from "../receiz/adapter";
import { receizOAuthSecret } from "../receiz/oauth-state";
import type { BillingConfig, HostingConfig } from "../../types/domain";
import { hostingPeriodStatus, validateHostingRenewalPeriod, type HostingRenewalPeriod } from "./renewal-period";
import { platformOperationFromContinuation } from "./platform-operation";
import { hostingBillingFromPlatformPayment } from "./platform-billing";

const PURPOSE = "receiz-hosting-renewal-coordinates:v1";
export const MAX_HOSTING_RECOVERY_TOKEN_LENGTH = 2_100_000;
export type HostingRenewalCoordinates = Readonly<{
  schema: "receiz.app.hosting_renewal_coordinates.v1";
  quote: PaymentContinuation;
  payerUserId: string;
  period: HostingRenewalPeriod;
  plan: Exclude<HostingConfig["plan"], "starter">;
  previous?: Omit<HostingRenewalCoordinates, "previous">;
}>;

function key(secret: string) {
  if (!secret.trim()) throw new Error("hosting_recovery_secret_required");
  return createHash("sha256").update(PURPOSE).update("\0").update(secret).digest();
}

function validate(value: unknown, allowPrevious = true): HostingRenewalCoordinates {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("hosting_recovery_invalid");
  const record = value as HostingRenewalCoordinates;
  if (record.schema !== "receiz.app.hosting_renewal_coordinates.v1" || !["pro", "scale"].includes(record.plan) ||
    typeof record.payerUserId !== "string" || !record.payerUserId.trim() || !record.quote || record.quote.purpose !== "hosting_plan") {
    throw new Error("hosting_recovery_invalid");
  }
  const quote = record.quote;
  if ([quote.tenantHost, quote.actorReceizId, quote.merchantUsername, quote.referenceId, quote.checkoutSessionId].some(v => typeof v !== "string" || !v.trim())) {
    throw new Error("hosting_recovery_invalid");
  }
  const period = validateHostingRenewalPeriod(record.period);
  const operation = platformOperationFromContinuation(quote, {
    id: quote.referenceId, kind: "hosting_plan", merchantReceizId: quote.actorReceizId!, tenantHost: quote.tenantHost, plan: record.plan,
  });
  if (!operation.period || operation.period.startsAt !== period.startsAt || operation.period.paidThrough !== period.paidThrough) {
    throw new Error("hosting_recovery_period_mismatch");
  }
  if (record.previous !== undefined) {
    if (!allowPrevious) throw new Error("hosting_recovery_invalid");
    const previous = validate(record.previous, false);
    if (previous.payerUserId !== record.payerUserId || previous.plan !== record.plan ||
      previous.quote.actorReceizId !== quote.actorReceizId || previous.period.paidThrough !== period.startsAt) {
      throw new Error("hosting_recovery_period_mismatch");
    }
    return Object.freeze({ ...record, period, previous });
  }
  return Object.freeze({ ...record, period });
}

/** Private transport coordinates carried in the store source. This envelope
 * asserts neither payment nor entitlement; each use rechecks the SDK session. */
export function encodeHostingRenewalCoordinates(value: HostingRenewalCoordinates, secret = receizOAuthSecret()) {
  const validated = validate(value);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  cipher.setAAD(Buffer.from(PURPOSE));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(validated), "utf8"), cipher.final()]);
  const token = ["hr1", iv.toString("base64url"), ciphertext.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
  if (token.length > MAX_HOSTING_RECOVERY_TOKEN_LENGTH) throw new Error("hosting_recovery_too_large");
  return token;
}

export function readHostingRenewalCoordinates(token: string, binding: { merchantReceizId: string; payerUserId?: string; plan?: HostingConfig["plan"] }, secret = receizOAuthSecret()) {
  if (typeof token !== "string" || token.length > MAX_HOSTING_RECOVERY_TOKEN_LENGTH) throw new Error("hosting_recovery_invalid");
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "hr1" || parts.slice(1).some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw new Error("hosting_recovery_invalid");
  let value: unknown;
  try {
    const iv = Buffer.from(parts[1], "base64url"), tag = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16) throw new Error("invalid_envelope");
    const decipher = createDecipheriv("aes-256-gcm", key(secret), iv);
    decipher.setAAD(Buffer.from(PURPOSE));
    decipher.setAuthTag(tag);
    value = JSON.parse(Buffer.concat([decipher.update(Buffer.from(parts[2], "base64url")), decipher.final()]).toString("utf8"));
  } catch { throw new Error("hosting_recovery_invalid"); }
  const coordinates = validate(value);
  if (coordinates.quote.actorReceizId !== binding.merchantReceizId ||
    (binding.payerUserId !== undefined && coordinates.payerUserId !== binding.payerUserId) ||
    (binding.plan !== undefined && coordinates.plan !== binding.plan)) throw new Error("hosting_recovery_owner_mismatch");
  return coordinates;
}

async function verifyOriginalPayment(receiz: ReceizCommerceAdapter, coordinates: HostingRenewalCoordinates) {
  const { quote } = coordinates;
  const reserve = reserveContext(quote);
  const operation = platformOperationFromContinuation(quote, {
    id: quote.referenceId, kind: "hosting_plan", merchantReceizId: quote.actorReceizId!, tenantHost: quote.tenantHost, plan: coordinates.plan,
  });
  return createWalletFirstReceizSettlement({
    receiz, amountUsd: quote.amountUsd, tenantHost: quote.tenantHost,
    recipientUserId: operation.recipientUserId, merchantUsername: quote.merchantUsername,
    buyerAuthenticated: false, idempotencyKey: reserve.originalReserveQuote?.idempotencyKey ?? quote.referenceId, orderId: quote.referenceId,
    note: "Recover the original hosting month", resume: { checkoutSessionId: quote.checkoutSessionId, funding: quote.funding },
    ...reserve,
  });
}

export async function recoverHostingRenewal(input: {
  receiz: ReceizCommerceAdapter;
  token: string;
  merchantReceizId: string;
  payerUserId?: string;
  plan?: HostingConfig["plan"];
  secret?: string;
  now?: number;
}) {
  const coordinates = readHostingRenewalCoordinates(input.token, input, input.secret);
  const settlement = await verifyOriginalPayment(input.receiz, coordinates);
  let status = settlement.paid ? hostingPeriodStatus(coordinates.period, input.now) : "payment_pending" as const;
  let accessPayment = settlement.paid && status === "active" ? { coordinates, settlement } : undefined;
  if ((status === "scheduled" || status === "payment_pending") && coordinates.previous) {
    const previous = await verifyOriginalPayment(input.receiz, coordinates.previous);
    if (previous.paid && hostingPeriodStatus(coordinates.previous.period, input.now) === "active") {
      status = "active";
      accessPayment = { coordinates: coordinates.previous, settlement: previous };
    }
  }
  return Object.freeze({ coordinates, settlement, status, accessPayment });
}

/** Project only after recovery has rechecked the original SDK payment. */
export function projectRecoveredHostingRenewal(hosting: HostingConfig, currentBilling: BillingConfig,
  recovered: Awaited<ReturnType<typeof recoverHostingRenewal>>, token: string) {
  const { coordinates, settlement, accessPayment, status } = recovered;
  const paid = settlement.paid ? { coordinates, settlement } : accessPayment;
  const billing = hostingBillingFromPlatformPayment(currentBilling, paid?.coordinates.plan ?? coordinates.plan, {
    ...(paid?.settlement ?? settlement), mode: "live", amountUsd: paid?.coordinates.quote.amountUsd ?? coordinates.quote.amountUsd,
    period: paid?.coordinates.period, referenceId: paid?.coordinates.quote.referenceId ?? coordinates.quote.referenceId,
  });
  billing.status = status === "active" ? "active" : status === "past_due" ? "past_due" : "trial";
  return {
    billing,
    hosting: { ...hosting, plan: status === "active" ? coordinates.plan : "starter" as const,
      billingRenewalToken: settlement.paid ? token : hosting.billingRenewalToken,
      pendingBillingRenewalToken: settlement.paid ? undefined : token,
      pendingBillingPlan: settlement.paid ? undefined : coordinates.plan,
      pendingBillingPeriod: settlement.paid ? undefined : coordinates.period },
  };
}

export async function requireActiveHostingRenewal(input: {
  receiz: ReceizCommerceAdapter; hosting: HostingConfig; merchantReceizId: string; payerUserId?: string; secret?: string; now?: number;
}) {
  const token = input.hosting.billingRenewalToken;
  if (!token) throw new Error("hosting_month_payment_required");
  const recovered = await recoverHostingRenewal({ ...input, token });
  if (recovered.status !== "active") throw new Error("hosting_month_renewal_required");
  return recovered;
}
