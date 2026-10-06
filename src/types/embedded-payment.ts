export type EmbeddedPaymentPurpose = "storefront_checkout" | "hosting_plan" | "custom_domain" | "exchange_trade";

export type EmbeddedPaymentSession = {
  purpose: EmbeddedPaymentPurpose;
  title: string;
  checkoutSessionId?: string;
  checkoutUrl?: string;
  clientSecret?: string;
  status?: string;
  paymentOrigin?: string;
  merchantUsername?: string;
  continuationToken?: string;
  recoveryToken?: string;
  servicePeriodLabel?: string;
  walletAppliedLabel?: string;
  cardDeltaLabel?: string;
  resumeDomain?: string;
  resumePlan?: "starter" | "pro" | "scale";
  resumeProductId?: string;
  resumeReferenceId?: string;
  resumeExchangeAssetId?: string;
  resumeExchangeSide?: "buy" | "sell";
  resumeExchangeShares?: number;
  reserveRequest?: NativeReserveQuote;
  reserveResolutionRequired?: boolean;
  reserveAttempt?: NativeReserveExecutionTransport;
};
import type { NativeReserveQuote } from "../lib/checkout/native-reserve-execution";
import type { NativeReserveExecutionTransport } from "../lib/checkout/browser-reserve-payment";
