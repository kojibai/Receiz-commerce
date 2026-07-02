"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InlineActionFeedback } from "@/components/ActionFeedback";
import { Icons } from "@/components/icons";
import { Button, StatusPill } from "@/components/ui";
import { FloatingCart } from "@/features/storefront/FloatingCart";
import { buildCartSummary } from "@/lib/storefront/cart-summary";
import { buildProductPurchaseModel } from "@/lib/storefront/product-purchase";
import { useTemplateStore } from "@/lib/storage/use-template-store";
import type { HostContext } from "@/lib/hosting/host-context";
import type { CommerceState, Product } from "@/types/domain";

export function ProductPurchasePanel({
  initialHostContext,
  initialState,
  product
}: {
  initialHostContext?: HostContext;
  initialState: CommerceState;
  product: Product;
}) {
  const { actions, actionFeedback, hostContext, hydrated, receizSessionPending, state } = useTemplateStore(initialState, initialHostContext);
  const liveProduct = state.products.find((item) => item.id === product.id) ?? product;
  const model = buildProductPurchaseModel(state, liveProduct);
  const cartSummary = buildCartSummary(state);
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "checkout">("idle");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartPulseProductId, setCartPulseProductId] = useState<string | null>(null);
  const identityReady = hydrated && !receizSessionPending;
  const tenantSurface = hostContext.surface === "tenant";
  const purchaseActionsEnabled = tenantSurface;

  const ensureCustomerSession = async (reason: string) => {
    if (!tenantSurface || state.auth.receizId.connected || !identityReady) return;
    await actions.ensureCustomerSession(reason);
  };

  const triggerCartFeedback = (productId: string) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
    setCartPulseProductId(productId);
    window.setTimeout(() => {
      setCartPulseProductId((currentProductId) => (currentProductId === productId ? null : currentProductId));
    }, 650);
    setCartOpen(true);
  };

  const addToCart = async () => {
    setStatus("adding");
    await ensureCustomerSession("product cart");
    actions.addToCart(model.productId);
    triggerCartFeedback(model.productId);
    setStatus("added");
  };

  const checkout = async () => {
    setStatus("checkout");
    await ensureCustomerSession("product checkout");
    await actions.startCheckout(model.productId);
    setStatus("idle");
  };

  const checkoutCart = async () => {
    setStatus("checkout");
    await ensureCustomerSession("cart checkout");
    await actions.startCheckout();
    setStatus("idle");
  };

  useEffect(() => {
    if (!cartSummary.lines.length) {
      setCartOpen(false);
    }
  }, [cartSummary.lines.length]);

  return (
    <div className="product-purchase-panel">
      <div className="product-purchase-card">
        <div>
          <StatusPill tone="green">Receiz checkout</StatusPill>
          <strong>{model.priceLabel}</strong>
          <span>{model.inventoryLabel} available</span>
        </div>
        {purchaseActionsEnabled ? (
          <>
            <div className="product-purchase-actions">
              <Button onClick={checkout} type="button" variant="primary">
                <Icons.creditCard size={17} />
                {actionFeedback.checkout?.status === "pending" || status === "checkout"
                  ? "Starting checkout"
                  : actionFeedback.checkout?.status === "success"
                    ? "Payment recorded"
                    : model.primaryActionLabel}
              </Button>
              <Button
                className={cartPulseProductId === model.productId ? "cart-add-button product-cart-action added" : "cart-add-button product-cart-action"}
                onClick={addToCart}
                type="button"
                variant="outline"
              >
                <Icons.cart size={17} />
                {status === "adding" ? "Adding" : status === "added" ? "Added to cart" : model.secondaryActionLabel}
              </Button>
            </div>
            <Link className="product-purchase-secondary-link" href="/#products">
              Continue shopping
            </Link>
            <InlineActionFeedback feedback={actionFeedback.checkout} />
          </>
        ) : (
          <div className="product-platform-actions">
            <Link className="button button-primary" href="/admin">
              <Icons.sliders size={17} />
              Edit in Admin Studio
            </Link>
            <Link className="product-purchase-secondary-link" href="/#products">
              Back to catalog
            </Link>
          </div>
        )}
      </div>

      <div className="product-purchase-facts">
        {model.proofFacts.map((fact) => (
          <div key={fact.label}>
            <span>{fact.label}</span>
            <strong>{fact.value}</strong>
          </div>
        ))}
      </div>
      {tenantSurface ? (
        <FloatingCart
          checkoutFeedback={actionFeedback.checkout}
          onCheckout={checkoutCart}
          onClose={() => setCartOpen(false)}
          onOpen={() => setCartOpen(true)}
          onQuantityChange={actions.setCartProductQuantity}
          onRemove={actions.removeFromCart}
          open={cartOpen}
          summary={cartSummary}
        />
      ) : null}
    </div>
  );
}
