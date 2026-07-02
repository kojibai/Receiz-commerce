import type { CommerceState, Product } from "@/types/domain";
import { slugifyRouteSegment } from "./content-routing";

export type ProductPurchaseFact = {
  label: string;
  value: string;
};

export type ProductPurchaseModel = {
  productId: string;
  productPath: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  priceLabel: string;
  inventoryLabel: string;
  proofFacts: ProductPurchaseFact[];
};

export function productRoutePath(product: Product) {
  const slug = slugifyRouteSegment(product.seo?.canonicalPath || product.id || product.name);
  return `/#product=${encodeURIComponent(slug)}`;
}

export function stateWithCartProduct(state: CommerceState, productId: string): CommerceState {
  const existing = state.cart.lines.find((line) => line.productId === productId);

  return {
    ...state,
    cart: {
      lines: existing
        ? state.cart.lines.map((line) =>
            line.productId === productId
              ? { ...line, quantity: line.quantity + 1 }
              : line
          )
        : [...state.cart.lines, { productId, quantity: 1 }]
    }
  };
}

export function stateWithCartQuantity(state: CommerceState, productId: string, quantity: number): CommerceState {
  const safeQuantity = Math.floor(quantity);
  const existing = state.cart.lines.find((line) => line.productId === productId);

  if (safeQuantity <= 0) {
    return stateWithoutCartProduct(state, productId);
  }

  return {
    ...state,
    cart: {
      lines: existing
        ? state.cart.lines.map((line) =>
            line.productId === productId ? { ...line, quantity: safeQuantity } : line
          )
        : [...state.cart.lines, { productId, quantity: safeQuantity }]
    }
  };
}

export function stateWithoutCartProduct(state: CommerceState, productId: string): CommerceState {
  return {
    ...state,
    cart: {
      lines: state.cart.lines.filter((line) => line.productId !== productId)
    }
  };
}

export function buildProductPurchaseModel(state: CommerceState, product: Product): ProductPurchaseModel {
  const settlementId = state.hosting.merchantReceizId || state.auth.receizId.handle || "Receiz merchant";
  const storeHost = state.hosting.customDomain.domain || state.hosting.subdomain;

  return {
    productId: product.id,
    productPath: productRoutePath(product),
    primaryActionLabel: "Buy with Receiz checkout",
    secondaryActionLabel: "Add to cart",
    priceLabel: product.priceLabel,
    inventoryLabel: product.inventoryLabel,
    proofFacts: [
      {
        label: "Proof",
        value: product.sealed ? "Proof sealed" : "Ready to seal"
      },
      {
        label: "Reward",
        value: product.rewardEligible ? "Eligible" : "Not eligible"
      },
      {
        label: "Settlement",
        value: settlementId
      },
      {
        label: "Store",
        value: storeHost
      }
    ]
  };
}
