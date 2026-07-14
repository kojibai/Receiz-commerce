import type { CartLine, CommerceState } from "@/types/domain";
import { createHash, randomUUID } from "node:crypto";

const MAX_CART_LINES = 100;
const MAX_LINE_QUANTITY = 99;
const MAX_CHECKOUT_CENTS = 100_000_000;

function centsFromPriceLabel(label: string) {
  const match = label.match(/[0-9]+(?:\.[0-9]{1,2})?/);
  if (!match) return 0;
  const amount = Number(match[0]);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function usdFromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

function normalizedCartLines(value: unknown): CartLine[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_CART_LINES) {
    throw new Error("checkout_cart_required");
  }

  return value.map((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new Error("checkout_cart_invalid");
    }

    const line = candidate as Record<string, unknown>;
    const productId = typeof line.productId === "string" ? line.productId.trim() : "";
    const quantity = Number(line.quantity);
    if (!productId) throw new Error("checkout_product_unavailable");
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      throw new Error("checkout_quantity_invalid");
    }

    return { productId, quantity };
  });
}

export function authoritativeCheckoutQuote(state: CommerceState, cartLines: unknown) {
  const quantities = new Map<string, number>();
  for (const line of normalizedCartLines(cartLines)) {
    const quantity = (quantities.get(line.productId) ?? 0) + line.quantity;
    if (quantity > MAX_LINE_QUANTITY) throw new Error("checkout_quantity_invalid");
    quantities.set(line.productId, quantity);
  }

  const items = [...quantities].map(([productId, quantity]) => {
    const product = state.products.find((candidate) => candidate.id === productId && candidate.status === "active");
    if (!product) throw new Error("checkout_product_unavailable");
    if (product.wildsAsset && quantity !== 1) throw new Error("wilds_card_quantity_invalid");
    const unitPriceCents = centsFromPriceLabel(product.priceLabel);
    const lineTotalCents = unitPriceCents * quantity;

    return {
      id: product.id,
      title: product.name,
      quantity,
      unitPriceCents,
      unitPriceUsd: usdFromCents(unitPriceCents),
      lineTotalCents,
      amountUsd: usdFromCents(lineTotalCents)
    };
  });
  const totalUsdCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
  if (!Number.isSafeInteger(totalUsdCents) || totalUsdCents <= 0 || totalUsdCents > MAX_CHECKOUT_CENTS) {
    throw new Error("checkout_total_invalid");
  }

  const merchantReceizId = state.hosting.merchantReceizId.trim();
  const recipientUserId = state.hosting.settlementUserId?.trim() || merchantReceizId;
  if (!merchantReceizId || !recipientUserId) throw new Error("checkout_merchant_unavailable");

  return {
    amountUsd: usdFromCents(totalUsdCents),
    totalUsdCents,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    merchantReceizId,
    recipientUserId,
    wildsAssets: [...quantities].flatMap(([productId]) => {
      const product = state.products.find((candidate) => candidate.id === productId);
      return product?.wildsAsset ? [{ productId, ...product.wildsAsset }] : [];
    }),
    items: items.map(({ unitPriceCents: _unitPriceCents, lineTotalCents: _lineTotalCents, ...item }) => item)
  };
}

export function canonicalOrderId(value: unknown) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9._:-]{1,128}$/.test(value)) {
    return `order_${randomUUID()}`;
  }

  return value;
}

export function settlementIdempotencyKey(input: {
  actorReceizId: string;
  amountUsd: string;
  merchantReceizId: string;
  operation: "checkout" | "exchange_buy" | "exchange_sell";
  orderId: string;
  recipientUserId: string;
  tenantHost: string;
}) {
  const digest = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex")
    .slice(0, 32);

  return `receiz:${input.operation}:${digest}`;
}
