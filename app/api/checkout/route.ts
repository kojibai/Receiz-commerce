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
import { merchantCheckoutUsername } from "@/lib/checkout/payment-contract";
import { issuePaymentContinuation, readPaymentContinuation, readPaymentStatusContinuation } from "@/lib/checkout/payment-continuation";
import { receizOAuthSecret } from "@/lib/receiz/oauth-state";
import { encodeOrderRecoveryCoordinates, readOrderRecoveryCoordinates, assertOrderRecoveryReader, recoverOriginalOrder } from "@/lib/checkout/order-recovery";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { requireActiveHostingRenewal } from "@/lib/hosting/renewal-coordinates";
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
  paid: boolean;
  funding: NonNullable<Order["funding"]>;
  submitted?: Order["fulfillment"];
  shipping?: Order["shipping"];
}): Order["fulfillment"] {
  const kind = input.submitted?.kind ?? "digital_delivery";
  const deliveryRails = input.submitted?.deliveryRails;

  if (!input.paid) {
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
    status: "delivery_pending",
    message: "Payment received. Your purchased content is awaiting merchant delivery."
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

async function publishSettledWildsSales(input: {
  accessToken: string;
  actorReceizId: string;
  merchantReceizId: string;
  proofStore: Awaited<ReturnType<typeof getServerProofStateStore>>;
  sales: Array<{
    productId: string;
    schema: "receiz.wilds_store_product.v1";
    assetId: string;
    proofDigest: string;
    ownerReceizId: string;
  }>;
  settlementLedgerEventId: string;
  state: CommerceState;
  tenantHost: string;
}) {
  const receiz = createReceizCommerceAdapter({ accessToken: input.accessToken });
  const transferredAt = new Date().toISOString();
  const transfers = [];
  for (const sale of input.sales) {
    const append = await receiz.connectRecord({
      schema: "receiz.wilds_ownership_append.v1",
      action: "ownership.transferred",
      assetId: sale.assetId,
      proofDigest: sale.proofDigest,
      previousOwnerReceizId: sale.ownerReceizId,
      ownerReceizId: input.actorReceizId,
      merchantReceizId: input.merchantReceizId,
      settlementLedgerEventId: input.settlementLedgerEventId,
      transferredAt
    });
    transfers.push({ ...sale, ownerReceizId: input.actorReceizId, transferredAt, append });
  }

  const soldProductIds = new Set(input.sales.map((sale) => sale.productId));
  const soldAssetIds = new Set(input.sales.map((sale) => sale.assetId));
  const transferredAssets = input.sales.map((sale) => ({
    id: sale.assetId,
    name: input.state.products.find((product) => product.id === sale.productId)?.name ?? "Wilds Card",
    type: "claim" as const,
    ownerId: input.actorReceizId,
    status: "owned" as const,
    priceLabel: input.state.products.find((product) => product.id === sale.productId)?.priceLabel ?? "$0.00",
    proofSource: sale.proofDigest
  }));
  const state: CommerceState = {
    ...input.state,
    products: input.state.products.map((product) => soldProductIds.has(product.id)
      ? { ...product, status: "draft", inventoryLabel: "Sold" }
      : product),
    assets: [...input.state.assets.filter((asset) => !soldAssetIds.has(asset.id)), ...transferredAssets]
  };
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
    transfers,
    state,
    storeStateSync: {
      ok: receizStoreStateWriteSucceeded(publication),
      synced: receizStoreStateSyncCompleted(publication),
      result: summarizeReceizStoreStatePublicationResult(publication)
    }
  };
}

async function handleCheckout(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (!isRecord(body)) return NextResponse.json({ ok: false, error: "checkout_payload_invalid" }, { status: 400 });
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
    if (body.commerceAction === "exchange_trade" && (!hasScopedReceizAccess || !accessToken)) {
      return NextResponse.json(
        {
          ...receizAuthorityRequired(returnToFromRequest(request), "wallet_checkout"),
          message: "Connect Receiz ID before checkout so Receiz can move wallet funds and open card payment for any delta."
        },
        { status: 401 }
      );
    }

    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken: hasScopedReceizAccess ? accessToken : undefined
    });
    const tenantHost = hostContext.tenantHost ?? hostContext.host;
    if (body.commerceAction === "recover_order") {
      const token = typeof body.recoveryToken === "string" ? body.recoveryToken : "";
      const coordinates = readOrderRecoveryCoordinates(token, tenantHost);
      const profile = hasScopedReceizAccess ? await loadReceizConnectProfile(accessToken).catch(() => null) : null;
      const reader = { handle: profile?.handle, userId: profile?.id };
      try { assertOrderRecoveryReader(coordinates, reader); } catch {
        return NextResponse.json({ ...receizAuthorityRequired(returnToFromRequest(request), "wallet_checkout"),
          message: "Open the Identity Seal for the original buyer or receiving merchant to recover this order." }, { status: 401 });
      }
      const recovered = await recoverOriginalOrder({ receiz, coordinates, reader });
      const order = recovered.order;
      if (order) await recordCheckoutCommerceEvent({
        ...order, orderId: order.id, proofBundle: recovered.settlement.proofBundle,
        receiptId: recovered.settlement.receiptId, tenantHost, createdAt: coordinates.createdAt
      });
      // Recovery has no dependency on today's catalog, current hosting plan,
      // wallet balance, or a server process retaining the earlier projection.
      return NextResponse.json({ ok: true, paid: recovered.settlement.paid, role: recovered.role,
        order: recovered.order ? { ...recovered.order, recoveryToken: token } : null,
        session: recovered.settlement.checkoutSession,
        purchasedLines: recovered.quote.items.map(item => ({ productId: item.id, quantity: item.quantity })) });
    }
    let published: Awaited<ReturnType<typeof publishedCheckoutState>>;
    let actorReceizId = "";
    let buyerUserId: string | undefined;
    try {
      const [publishedState, profile] = await Promise.all([
        publishedCheckoutState(tenantHost),
        loadReceizConnectProfile(hasScopedReceizAccess ? accessToken : undefined).catch(() => null)
      ]);
      if (hasScopedReceizAccess && (!profile?.handle || !profile.id)) throw new Error("checkout_identity_unavailable");
      published = publishedState;
      actorReceizId = profile?.handle ?? "";
      buyerUserId = profile?.id || undefined;
    } catch (error) {
      if (error instanceof Error && error.message === "checkout_identity_unavailable") {
        return NextResponse.json({ ...receizAuthorityRequired(returnToFromRequest(request), "wallet_checkout"),
          message: "Reconnect your Identity Seal in this app before finishing this purchase. Your original payment will be retained." }, { status: 401 });
      }
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "checkout_authority_unavailable" },
        { status: 409 }
      );
    }
    const merchantReceizId = published.state.hosting.merchantReceizId.trim();
    if (typeof body.continuationToken === "string") {
      const held = readPaymentStatusContinuation(body.continuationToken, { purpose: "storefront_checkout", tenantHost });
      if (held.actorReceizId && held.actorReceizId !== actorReceizId) {
        return NextResponse.json({ ...receizAuthorityRequired(returnToFromRequest(request), "wallet_checkout"),
          message: "Reconnect the Receiz identity that started this purchase to finish the original payment." }, { status: 401 });
      }
    }
    const continuation = typeof body.continuationToken === "string"
      ? readPaymentContinuation(body.continuationToken, { purpose: "storefront_checkout", tenantHost, actorReceizId })
      : null;
    if (!continuation && process.env.RECEIZ_PLATFORM_BILLING_MODE === "live" && body.commerceAction !== "exchange_trade") {
      try {
        await requireActiveHostingRenewal({ receiz, hosting: published.state.hosting, merchantReceizId });
      } catch {
        return NextResponse.json({ ok: false, error: "merchant_hosting_renewal_required",
          message: "This store's checkout is paused while the merchant renews hosting. No payment has been taken." }, { status: 409 });
      }
    }
    const orderId = continuation?.referenceId ?? canonicalOrderId(body.referenceId ?? body.orderId);
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
      quote = exchangeTrade ? null : continuation
        ? continuation.context.quote as ReturnType<typeof authoritativeCheckoutQuote>
        : authoritativeCheckoutQuote(published.state, body.cartLines);
      if (quote && quote.merchantReceizId !== merchantReceizId) throw new Error("checkout_merchant_changed");
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "checkout_quote_invalid" },
        { status: 409 }
      );
    }
    const amountUsd = exchangeTrade ? (exchangeTrade.preview.totalCents / 100).toFixed(2) : quote!.amountUsd;
    const recipientUserId = exchangeTrade?.preview.counterpartyReceizId ?? quote!.recipientUserId;
    if (quote?.wildsAssets.length && !hasScopedReceizAccess) {
      return NextResponse.json({ ...receizAuthorityRequired(returnToFromRequest(request), "wallet_checkout"),
        message: "Connect your Receiz ID before buying a collectible so ownership can be delivered to you."
      }, { status: 401 });
    }
    const merchantUsername = merchantCheckoutUsername(exchangeTrade?.preview.counterpartyReceizId ?? merchantReceizId);
    if (continuation && continuation.merchantUsername !== merchantUsername) throw new Error("checkout_recipient_changed");
    const checkoutBody = continuation ? continuation.context.customer as Record<string, unknown> : body;
    receizOAuthSecret(); // Validate continuation configuration before creating a charge.
    const idempotencyKey = settlementIdempotencyKey({
      actorReceizId,
      amountUsd,
      merchantReceizId,
      operation: exchangeTrade ? (exchangeSide === "sell" ? "exchange_sell" : "exchange_buy") : "checkout",
      orderId,
      recipientUserId,
      tenantHost
    });
    const shipping = shippingFromBody(checkoutBody.shipping);
    const fulfillmentProducts = published.state.products.filter((product) => quote?.items.some((item) => item.id === product.id));
    const fulfillmentKind = continuation ? fulfillmentFromBody(checkoutBody.fulfillment)?.kind ?? "digital_delivery" :
      fulfillmentProducts.some((product) => product.type === "physical") ?
        fulfillmentProducts.some((product) => product.type !== "physical") ? "mixed" : "physical_shipping" : "digital_delivery";
    const settlementInput = {
      receiz,
      tenantHost,
      orderId,
      amountUsd,
      recipientUserId,
      merchantUsername,
      buyerAuthenticated: hasScopedReceizAccess,
      buyerUserId,
      resume: continuation ? { checkoutSessionId: continuation.checkoutSessionId, funding: continuation.funding } : undefined,
      note: String(checkoutBody.description ?? "Receiz.app order"),
      description: String(checkoutBody.description ?? "Receiz.app order"),
      customerEmail: typeof checkoutBody.customerEmail === "string" ? checkoutBody.customerEmail : undefined,
      idempotencyKey,
      cart: {
        items: quote?.items ?? [{
          id: exchangeTrade ? String(body.assetId ?? "") : "receiz-commerce-cart",
          title: exchangeTrade ? "Receiz Exchange trade" : "Receiz.app proof-sealed order",
          quantity: exchangeTrade?.preview.shares ?? 1,
          amountUsd
        }]
      },
      metadata: { orderId, tenantHost, merchantReceizId, totalUsdCents: String(quote?.totalUsdCents ?? 0) }
    };
    const recoveryContext = continuation?.context ?? { quote, customer: {
      customerEmail: checkoutBody.customerEmail, customerName: checkoutBody.customerName,
      description: checkoutBody.description, shipping, fulfillment: { kind: fulfillmentKind }
    }, createdAt: new Date().toISOString() };
    // Validate and bound the recoverable quote before creating a card session.
    if (quote) encodeOrderRecoveryCoordinates({ schema: "receiz.app.order_recovery_coordinates.v1", payerUserId: buyerUserId,
      createdAt: typeof recoveryContext.createdAt === "string" ? recoveryContext.createdAt : new Date().toISOString(),
      payment: continuation ?? { purpose: "storefront_checkout", tenantHost, actorReceizId: actorReceizId || undefined,
        merchantUsername, referenceId: orderId, checkoutSessionId: "awaiting_original_session", amountUsd,
        funding: { totalUsdCents: quote.totalUsdCents, walletBalanceUsdCents: 0, walletAppliedUsdCents: 0, cardDeltaUsdCents: quote.totalUsdCents },
        context: recoveryContext } });
    const settlement = await createWalletFirstReceizSettlement(settlementInput);
    const funding = settlement.funding;
    const fulfillment = checkoutFulfillmentForFunding({
      paid: settlement.paid,
      funding,
      submitted: { ...fulfillmentFromBody(checkoutBody.fulfillment), kind: fulfillmentKind,
        status: "payment_required", message: "Payment must settle before fulfillment starts." },
      shipping
    });
    const session = settlement.checkoutSession ?? {
      ok: settlement.ok,
      checkoutSessionId: settlement.walletTransfer?.ledgerEventId ?? settlement.walletTransfer?.transferId ?? `receiz_${Date.now()}`,
      status: settlement.settlementStatus
    };
    const originalPayment = continuation ?? (quote && session.checkoutSessionId ? {
      purpose: "storefront_checkout" as const, tenantHost, actorReceizId: actorReceizId || undefined,
      merchantUsername, referenceId: orderId, checkoutSessionId: session.checkoutSessionId,
      amountUsd, funding, context: recoveryContext
    } : null);
    const orderRecoveryToken = originalPayment ? encodeOrderRecoveryCoordinates({
      schema: "receiz.app.order_recovery_coordinates.v1", payment: originalPayment,
      payerUserId: buyerUserId, createdAt: typeof originalPayment.context.createdAt === "string"
        ? originalPayment.context.createdAt : new Date().toISOString()
    }) : undefined;
    const commerceProjection = await recordCheckoutCommerceEvent({
      checkoutSessionId: session.checkoutSessionId,
      customerEmail: stringFromBody(checkoutBody, "customerEmail"),
      customerId: actorReceizId || `guest:${orderId}`,
      customerName: stringFromBody(checkoutBody, "customerName"),
      funding,
      itemCount: quote?.itemCount ?? exchangeTrade?.preview.shares ?? 1,
      merchantReceizId,
      orderId,
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
          accessToken: accessToken!,
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
    const wildsOwnership = !exchangeTrade && settlement.paid && quote?.wildsAssets.length
      ? await publishSettledWildsSales({
          accessToken: accessToken!,
          actorReceizId,
          merchantReceizId,
          proofStore: published.proofStore,
          sales: quote.wildsAssets,
          settlementLedgerEventId,
          state: published.state,
          tenantHost
        })
      : null;

    return NextResponse.json({
      ok: true,
      mode: "receiz",
      paid: settlement.paid,
      orderRecoveryToken,
      wallet: settlement.wallet,
      walletTransfer: settlement.walletTransfer,
      paymentRails: paymentRails(merchantReceizId),
      funding,
      purchasedLines: quote?.items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      itemCount: quote?.itemCount,
      session,
      continuationToken: session.checkoutSessionId && !settlement.paid && !exchangeTrade
        ? continuation ? body.continuationToken : issuePaymentContinuation({
          purpose: "storefront_checkout", tenantHost, actorReceizId: actorReceizId || undefined,
          merchantUsername, referenceId: orderId, checkoutSessionId: session.checkoutSessionId,
          amountUsd, funding, context: originalPayment!.context
        }) : undefined,
      commerceEvent: commerceProjection?.event,
      exchange,
      wildsOwnership,
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
      paid: true,
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

export async function POST(request: NextRequest) {
  try {
    const response = await handleCheckout(request);
    response.headers.set("cache-control", "no-store");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout could not complete. Retry the existing payment.";
    return NextResponse.json({ ok: false, error: "checkout_failed", message }, { status: 409, headers: { "cache-control": "no-store" } });
  }
}
