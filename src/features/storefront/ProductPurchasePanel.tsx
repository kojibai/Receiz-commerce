"use client";

import { useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { Button, StatusPill } from "@/components/ui";
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
  const { actions, hostContext, hydrated, receizSessionPending, state } = useTemplateStore(initialState, initialHostContext);
  const liveProduct = state.products.find((item) => item.id === product.id) ?? product;
  const model = buildProductPurchaseModel(state, liveProduct);
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "checkout">("idle");
  const identityReady = hydrated && !receizSessionPending;
  const tenantSurface = hostContext.surface === "tenant";

  const ensureCustomerSession = async (reason: string) => {
    if (!tenantSurface || state.auth.receizId.connected || !identityReady) return;
    await actions.ensureCustomerSession(reason);
  };

  const addToCart = async () => {
    setStatus("adding");
    await ensureCustomerSession("product cart");
    actions.addToCart(model.productId);
    setStatus("added");
  };

  const checkout = async () => {
    setStatus("checkout");
    await ensureCustomerSession("product checkout");
    await actions.startCheckout(model.productId);
    setStatus("idle");
  };

  return (
    <div className="product-purchase-panel">
      <div className="product-purchase-card">
        <div>
          <StatusPill tone="green">Receiz checkout</StatusPill>
          <strong>{model.priceLabel}</strong>
          <span>{model.inventoryLabel} available</span>
        </div>
        <div className="product-purchase-actions">
          <Button onClick={checkout} type="button" variant="primary">
            <Icons.creditCard size={17} />
            {status === "checkout" ? "Starting checkout" : model.primaryActionLabel}
          </Button>
          <Button onClick={addToCart} type="button" variant="outline">
            <Icons.cart size={17} />
            {status === "adding" ? "Adding" : status === "added" ? "Added to cart" : model.secondaryActionLabel}
          </Button>
        </div>
        <Link className="product-purchase-secondary-link" href="/#products">
          Continue shopping
        </Link>
      </div>

      <div className="product-purchase-facts">
        {model.proofFacts.map((fact) => (
          <div key={fact.label}>
            <span>{fact.label}</span>
            <strong>{fact.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
