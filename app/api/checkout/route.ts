import { NextRequest, NextResponse } from "next/server";
import { checkoutCommerceEvent, type CheckoutCommerceEventInput } from "@/lib/checkout/commerce-event";
import { validShippingAddress } from "@/lib/checkout/customer-purchase";
import {
  authoritativeCheckoutQuote,
  canonicalOrderId,
  settlementIdempotencyKey
} from "@/lib/checkout/checkout-authority";
import { mockCheckout } from "@/lib/checkout/mock-checkout";
import { checkoutModeForAuthority, checkoutWalletAuthority } from "@/lib/checkout/wallet-authority";
import { createWalletFirstReceizSettlement } from "@/lib/checkout/receiz-settlement";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { receizAuthorityRequired, receizRequestSession } from "@/lib/receiz/session";
import { platform } from "@/lib/platform";
import { mockStorage } from "@/lib/storage/mock-storage";
import { hydrateProofStoreFromReceizStoreState } from "@/lib/receiz/store-state-ledger";
import { buildExchangeTradePreview, stateWithExchangeTrade } from "@/lib/storefront/proof-exchange";
import { buildStoreStateRecord, storeStateProjectionSource } from "@/lib/receiz/proof-state";
import {
  publishAndAdmitReceizStoreState,
  receizStoreStateSyncCompleted,
  receizStoreStateWriteSucceeded,
  summarizeReceizStoreStatePublicationResult
} from "@/lib/receiz/store-state-publication";
import type { CommerceState, Order } from "@/types/domain";
import { settleSandboxExchangeTrade } from "@/lib/exchange/sandbox-settlement";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function paymentRails(merchantReceizId: string) {
  return {
    preferred: "receiz_wallet" as const,
    fallback: "credit_card" as const,
    settlement: "merchant_receiz_reserve" as const,
    merchantReceizId
  };
}

function stringFromBody(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function returnToFromRequest(request: NextRequest) {
  const referer = request.headers.get("referer");
  if (!referer) return "/";

  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}

function shippingFromBody(value: unknown): Order["shipping"] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const shipping = value as Order["shipping"];
  return validShippingAddress(shipping) ? shipping : undefined;
}

function fulfillmentFromBody(value: unknown): Order["fulfillment"] | undefined {
  if (!isRecord(value)) return undefined;
  const kind = value.kind === "physical_shipping" || value.kind === "mixed" || value.kind === "digital_delivery"
    ? value.kind
    : "digital_delivery";
  const deliveryRails = Array.isArray(value.deliveryRails)
    ? value.deliveryRails.filter((rail): rail is "receiz_communications" | "email" => rail === "receiz_communications" || rail === "email")
    : undefined;

  return {
    kind,
    status: "payment_required",
    message: "Payment must settle before fulfillment starts.",
    deliveryRails
  };
}

function checkoutFulfillmentForFunding(input: {
  funding: NonNullable<Order["funding"]>;
  submitted?: Order["fulfillment"];
  shipping?: Order["shipping"];
}): Order["fulfillment"] {
  const kind = input.submitted?.kind ?? "digital_delivery";
  const deliveryRails = input.submitted?.deliveryRails;

  if (input.funding.cardRequired) {
    return {
      kind,
      status: "payment_required",
      message: "Collect the card delta before creating the paid order.",
      deliveryRails
    };
  }

  if ((kind === "physical_shipping" || kind === "mixed") && !input.shipping) {
    return {
      kind,
      status: "shipping_required",
      message: "Payment received. Add shipping details to finish fulfillment.",
      deliveryRails
    };
  }

  if (kind === "physical_shipping" || kind === "mixed") {
    return {
      kind,
      status: "ready_to_ship",
      message: "Payment and shipping are attached. Merchant fulfillment is ready.",
      deliveryRails
    };
  }

  return {
    kind,
    status: "delivery_queued",
    message: "Digital delivery queued through Receiz communications and email.",
    deliveryRails: deliveryRails?.length ? deliveryRails : ["receiz_communications", "email"]
  };
}

async function recordCheckoutCommerceEvent(input: CheckoutCommerceEventInput) {
  try {
    const event = checkoutCommerceEvent(input);
    const proofStore = await getServerProofStateStore(event.merchantReceizId);
    const result = await proofStore.admitCommerceEvent(mockStorage.getState(), event);

    return {
      admitted: result.admitted,
      event,
      proofMemory: {
        knownHead: proofStore.knownHead(100),
        entries: proofStore.snapshot().head.count
      }
    };
  } catch (error) {
    console.error("[checkout] commerce event projection failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  }
}

async function canonicalExchangeTrade(input: {
  actorReceizId: string;
  assetId: string;
  proofStore: Awaited<ReturnType<typeof getServerProofStateStore>>;
  shares: number;
  side: "buy" | "sell";
  state: CommerceState;
  tenantHost: string;
}) {
  const asset = input.state.exchange.assets.find((candidate) => candidate.id === input.assetId);
  if (!asset) throw new Error("exchange_asset_not_found");
  if (input.side === "sell" && asset.ownerReceizId !== input.actorReceizId) {
    throw new Error("exchange_sell_authority_required");
  }

  const preview = buildExchangeTradePreview(asset, input.side, input.shares, input.state.exchange.walletBalanceCents);
  if (!preview.shares || !preview.counterpartyReceizId || !preview.matchedOrderId) {
    throw new Error(input.side === "buy" ? "exchange_ask_unavailable" : "exchange_bid_unavailable");
  }

  return { preview, proofStore: input.proofStore, state: input.state };
}

async function publishedCheckoutState(tenantHost: string) {
  const proofStore = await getServerProofStateStore();
  await hydrateProofStoreFromReceizStoreState(proofStore, tenantHost);
  if (storeStateProjectionSource(proofStore.records(), tenantHost) !== "published") {
    throw new Error("store_not_published");
  }

  return {
    proofStore,
    state: proofStore.projectHost(mockStorage.getState(), tenantHost)
  };
}

async function publishSettledExchangeTrade(input: {
  accessToken: string;
  actorReceizId: string;
  assetId: string;
  merchantReceizId: string;
  proofStore: Awaited<ReturnType<typeof getServerProofStateStore>>;
  settlementLedgerEventId: string;
  shares: number;
  side: "buy" | "sell";
  state: CommerceState;
  tenantHost: string;
}) {
  const state = stateWithExchangeTrade(input.state, {
    actorReceizId: input.actorReceizId,
    assetId: input.assetId,
    recordedAt: new Date().toISOString(),
    settlementLedgerEventId: input.settlementLedgerEventId,
    shares: input.shares,
    side: input.side
  });
  const record = buildStoreStateRecord(state, {
    actorReceizId: input.actorReceizId,
    reason: "sync",
    tenantHost: input.tenantHost
  });
  const publication = await publishAndAdmitReceizStoreState({
    accessToken: input.accessToken,
    proofStore: input.proofStore,
    record
  });

  return {
    state,
    storeStateSync: {
      ok: receizStoreStateWriteSucceeded(publication),
      synced: receizStoreStateSyncCompleted(publication),
      result: summarizeReceizStoreStatePublicationResult(publication)
    }
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const requestSession = receizRequestSession(request);
  const accessToken = requestSession.cookieAccessToken;
  const sessionScope = requestSession.sessionScope;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(host);
  const hasScopedReceizAccess = Boolean(accessToken && sessionScope === hostContext.storageKey);
  const walletAuthority = checkoutWalletAuthority({
    scopedReceizAccess: hasScopedReceizAccess,
    proofObject: isRecord(body) ? body.merchantProof ?? body.merchantSession ?? body.state : null,
    handle: stringFromBody(body, "customerReceizId") ?? stringFromBody(body, "merchantReceizId")
  });
  const configuredCheckoutMode =
    process.env.RECEIZ_CHECKOUT_MODE ??
    process.env.CHECKOUT_PROVIDER ??
    process.env.NEXT_PUBLIC_CHECKOUT_MODE;
  const checkoutMode = checkoutModeForAuthority({
    configuredCheckoutMode,
    tenantSurface: hostContext.surface === "tenant",
    authMode: process.env.NEXT_PUBLIC_AUTH_MODE,
    scopedReceizAccess: hasScopedReceizAccess,
    proofObjectAuthorized: walletAuthority.ok && walletAuthority.source === "proof_object"
  });
  if (checkoutMode === "receiz" || checkoutMode === "live") {
    if (!hasScopedReceizAccess || !accessToken) {
      return NextResponse.json(
        {
          ...receizAuthorityRequired(returnToFromRequest(request)),
          message: "Connect Receiz ID before checkout so Receiz can move wallet funds and open card payment for any delta."
        },
        { status: 401 }
      );
    }

    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });
    const tenantHost = hostContext.tenantHost ?? hostContext.host;
    let published: Awaited<ReturnType<typeof publishedCheckoutState>>;
    let actorReceizId: string;
    try {
      const [publishedState, profile] = await Promise.all([
        publishedCheckoutState(tenantHost),
        loadReceizConnectProfile(accessToken)
      ]);
      if (!profile?.handle) throw new Error("checkout_identity_unavailable");
      published = publishedState;
      actorReceizId = profile.handle;
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "checkout_authority_unavailable" },
        { status: 409 }
      );
    }
    const merchantReceizId = published.state.hosting.merchantReceizId.trim();
    const orderId = canonicalOrderId(body.referenceId ?? body.orderId);
    const commerceAction = stringFromBody(body, "commerceAction");
    const exchangeSide = body.side === "sell" ? "sell" : "buy";
    let exchangeTrade: Awaited<ReturnType<typeof canonicalExchangeTrade>> | null = null;
    if (commerceAction === "exchange_trade") {
      try {
        exchangeTrade = await canonicalExchangeTrade({
          actorReceizId,
          assetId: String(body.assetId ?? ""),
          proofStore: published.proofStore,
          shares: Number(body.shares ?? 0),
          side: exchangeSide,
          state: published.state,
          tenantHost
        });
      } catch (error) {
        return NextResponse.json(
          {
            ok: false,
            error: error instanceof Error ? error.message : "exchange_trade_unavailable"
          },
          { status: 409 }
        );
      }
    }
    let quote: ReturnType<typeof authoritativeCheckoutQuote> | null = null;
    try {
      quote = exchangeTrade ? null : authoritativeCheckoutQuote(published.state, body.cartLines);
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "checkout_quote_invalid" },
        { status: 409 }
      );
    }
    const amountUsd = exchangeTrade ? (exchangeTrade.preview.totalCents / 100).toFixed(2) : quote!.amountUsd;
    const recipientUserId = exchangeTrade?.preview.counterpartyReceizId ?? quote!.recipientUserId;
    const idempotencyKey = settlementIdempotencyKey({
      actorReceizId,
      amountUsd,
      merchantReceizId,
      operation: exchangeTrade ? (exchangeSide === "sell" ? "exchange_sell" : "exchange_buy") : "checkout",
      orderId,
      recipientUserId,
      tenantHost
    });
    const settlement = await createWalletFirstReceizSettlement({
      receiz,
      tenantHost,
      orderId,
      amountUsd,
      recipientUserId,
      note: String(body.description ?? "Receiz.app proof-sealed order"),
      description: String(body.description ?? "Receiz.app proof-sealed order"),
      customerEmail: typeof body.customerEmail === "string" ? body.customerEmail : undefined,
      successUrl: typeof body.successUrl === "string" ? body.successUrl : undefined,
      cancelUrl: typeof body.cancelUrl === "string" ? body.cancelUrl : undefined,
      idempotencyKey,
      cart: {
        items: quote?.items ?? [{
          id: exchangeTrade ? String(body.assetId ?? "") : "receiz-commerce-cart",
          title: exchangeTrade ? "Receiz Exchange trade" : "Receiz.app proof-sealed order",
          quantity: exchangeTrade?.preview.shares ?? 1,
          amountUsd
        }]
      }
    });
    const funding = settlement.funding;
    const shipping = shippingFromBody(body.shipping);
    const fulfillment = checkoutFulfillmentForFunding({
      funding,
      submitted: fulfillmentFromBody(body.fulfillment),
      shipping
    });
    const session = settlement.checkoutSession ?? {
      ok: settlement.ok,
      checkoutSessionId: settlement.walletTransfer?.ledgerEventId ?? settlement.walletTransfer?.transferId ?? `receiz_${Date.now()}`,
      status: settlement.settlementStatus
    };
    const commerceProjection = await recordCheckoutCommerceEvent({
      checkoutSessionId: session.checkoutSessionId,
      customerEmail: stringFromBody(body, "customerEmail"),
      customerId: stringFromBody(body, "customerId"),
      customerName: stringFromBody(body, "customerName"),
      funding,
      itemCount: quote?.itemCount ?? exchangeTrade?.preview.shares ?? 1,
      merchantReceizId,
      orderId: stringFromBody(body, "referenceId") ?? stringFromBody(body, "orderId") ?? session.checkoutSessionId,
      paymentRail: settlement.paymentRail,
      proofBundle: settlement.proofBundle,
      receiptId: settlement.receiptId,
      settlementStatus: settlement.settlementStatus,
      fulfillment,
      shipping,
      tenantHost,
      totalLabel: funding.totalLabel
    });
    const settlementLedgerEventId =
      settlement.receiptId ??
      settlement.walletTransfer?.ledgerEventId ??
      settlement.walletTransfer?.transferId ??
      session.checkoutSessionId ??
      orderId;
    const exchange = exchangeTrade && settlement.paid
      ? await publishSettledExchangeTrade({
          accessToken,
          actorReceizId,
          assetId: String(body.assetId ?? ""),
          merchantReceizId,
          proofStore: exchangeTrade.proofStore,
          settlementLedgerEventId,
          shares: exchangeTrade.preview.shares,
          side: exchangeSide,
          state: exchangeTrade.state,
          tenantHost
        })
      : null;

    return NextResponse.json({
      ok: true,
      mode: "receiz",
      paid: settlement.paid,
      wallet: settlement.wallet,
      walletTransfer: settlement.walletTransfer,
      paymentRails: paymentRails(merchantReceizId),
      funding,
      session,
      commerceEvent: commerceProjection?.event,
      exchange,
      proofMemory: commerceProjection?.proofMemory
    });
  }

  const order = mockCheckout.confirmMockCheckout({
    customerId: String(body.customerId ?? "customer-lena"),
    totalLabel: String(body.totalLabel ?? "$18.00"),
    status: "mock_paid",
    itemCount: Number(body.itemCount ?? 1)
  });
  const merchantReceizId =
    typeof body.merchantReceizId === "string" && body.merchantReceizId.trim()
      ? body.merchantReceizId.trim()
      : hostContext.tenantSlug
        ? `${hostContext.tenantSlug}.receiz.id`
        : process.env.RECEIZ_DEFAULT_MERCHANT_RECEIZ_ID ?? "merchant.receiz.id";
  if (stringFromBody(body, "commerceAction") === "exchange_trade") {
    try {
      const actorReceizId = stringFromBody(body, "customerReceizId") ?? "sandbox-buyer.receiz.id";
      const referenceId = stringFromBody(body, "referenceId") ?? order.id;
      const settled = settleSandboxExchangeTrade(mockStorage.getState(), {
        actorReceizId,
        assetId: String(body.assetId ?? ""),
        settlementLedgerEventId: `sandbox:${referenceId}`,
        shares: Number(body.shares ?? 0),
        side: body.side === "sell" ? "sell" : "buy"
      });
      mockStorage.replaceState(settled.state);
      return NextResponse.json({
        ok: true,
        mode: "sandbox",
        paid: true,
        order,
        funding: {
          strategy: "receiz_wallet_first",
          totalLabel: settled.preview.totalLabel,
          walletAppliedLabel: settled.preview.walletAppliedLabel,
          cardDeltaLabel: settled.preview.cardDeltaLabel,
          cardRequired: false
        },
        exchange: {
          state: settled.state,
          storeStateSync: { ok: true, synced: true, result: "sandbox_settled" }
        }
      });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "exchange_trade_unavailable" },
        { status: 409 }
      );
    }
  }
  const commerceProjection = await recordCheckoutCommerceEvent({
    checkoutSessionId: order.checkoutSessionId,
    customerEmail: stringFromBody(body, "customerEmail"),
    customerId: order.customerId,
    customerName: stringFromBody(body, "customerName"),
    itemCount: order.itemCount,
    merchantReceizId,
    orderId: order.id,
    paymentRail: "sandbox",
    settlementStatus: "sandbox",
    fulfillment: checkoutFulfillmentForFunding({
      funding: {
        strategy: "receiz_wallet_first",
        totalLabel: order.totalLabel,
        walletAppliedLabel: order.totalLabel,
        cardDeltaLabel: "$0.00",
        cardRequired: false
      },
      submitted: fulfillmentFromBody(body.fulfillment),
      shipping: shippingFromBody(body.shipping)
    }),
    shipping: shippingFromBody(body.shipping),
    tenantHost: String(body.tenantHost ?? hostContext.tenantHost ?? host),
    totalLabel: order.totalLabel
  });

  return NextResponse.json({
    ok: true,
    order,
    commerceEvent: commerceProjection?.event,
    proofMemory: commerceProjection?.proofMemory
  });
}
