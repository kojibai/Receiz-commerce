import type { CommerceState, Product } from "@/types/domain";
import { productRoutePath } from "./product-purchase";

export type CartSummaryLine = {
  productId: string;
  name: string;
  subtitle?: string;
  quantity: number;
  priceLabel: string;
  lineTotalLabel: string;
  productPath: string;
};

export type CartSummary = {
  itemCount: number;
  subtotalLabel: string;
  canCheckout: boolean;
  checkoutLabel: string;
  paymentRailLabel: string;
  tenantHost: string;
  lines: CartSummaryLine[];
};

function priceFromLabel(label: string) {
  const match = label.match(/[0-9]+(?:\.[0-9]+)?/);
  return match ? Number(match[0]) : 0;
}

function moneyLabel(value: number) {
  return `$${Math.max(0, value).toFixed(2)}`;
}

function lineForProduct(product: Product, quantity: number): CartSummaryLine {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const unitPrice = priceFromLabel(product.priceLabel);

  return {
    productId: product.id,
    name: product.name,
    subtitle: product.subtitle,
    quantity: safeQuantity,
    priceLabel: product.priceLabel,
    lineTotalLabel: moneyLabel(unitPrice * safeQuantity),
    productPath: productRoutePath(product)
  };
}

export function buildCartSummary(state: CommerceState): CartSummary {
  const lines = state.cart.lines.flatMap((line) => {
    const product = state.products.find((item) => item.id === line.productId && item.status === "active");
    return product ? [lineForProduct(product, line.quantity)] : [];
  });
  const subtotal = lines.reduce((sum, line) => sum + priceFromLabel(line.lineTotalLabel), 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    itemCount,
    subtotalLabel: moneyLabel(subtotal),
    canCheckout: itemCount > 0,
    checkoutLabel: itemCount > 0 ? "Checkout with Receiz" : "Add products to checkout",
    paymentRailLabel: state.checkout.label,
    tenantHost: state.hosting.customDomain.domain || state.hosting.subdomain,
    lines
  };
}
