"use client";

import { InlineActionFeedback } from "@/components/ActionFeedback";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui";
import type { CartSummary } from "@/lib/storefront/cart-summary";
import type { ActionFeedbackState } from "@/types/action-feedback";

export function FloatingCart({
  onCheckout,
  onClose,
  onOpen,
  onQuantityChange,
  onRemove,
  open,
  checkoutFeedback,
  summary
}: {
  onCheckout: () => void;
  onClose: () => void;
  onOpen: () => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  open: boolean;
  checkoutFeedback?: ActionFeedbackState;
  summary: CartSummary;
}) {
  if (!summary.lines.length) return null;
  const itemLabel = summary.itemCount === 1 ? "1 item" : `${summary.itemCount} items`;

  return (
    <div className="floating-cart">
      {open ? (
        <div className="floating-cart-popover" role="dialog" aria-label="Cart">
          <div className="floating-cart-head">
            <div>
              <strong>Cart</strong>
              <span>{itemLabel}</span>
            </div>
            <button aria-label="Close cart" onClick={onClose} type="button">
              <Icons.close size={15} />
            </button>
          </div>
          <div className="floating-cart-lines">
            {summary.lines.map((line) => (
              <div className="floating-cart-line" key={line.productId}>
                <a href={line.productPath}>
                  <strong>{line.name}</strong>
                  <span>{line.lineTotalLabel}</span>
                </a>
                <div>
                  <button
                    aria-label={`Decrease ${line.name} quantity`}
                    disabled={line.quantity <= 1}
                    onClick={() => onQuantityChange(line.productId, line.quantity - 1)}
                    type="button"
                  >
                    -
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    aria-label={`Increase ${line.name} quantity`}
                    onClick={() => onQuantityChange(line.productId, line.quantity + 1)}
                    type="button"
                  >
                    +
                  </button>
                  <button
                    aria-label={`Remove ${line.name} from cart`}
                    onClick={() => onRemove(line.productId)}
                    type="button"
                  >
                    <Icons.close size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="floating-cart-total">
            <span>{summary.paymentRailLabel}</span>
            <strong>{summary.subtotalLabel}</strong>
          </div>
          <Button disabled={!summary.canCheckout} onClick={onCheckout} type="button" variant="primary">
            <Icons.creditCard size={15} />
            {checkoutFeedback?.status === "pending" ? "Starting checkout" : checkoutFeedback?.status === "success" ? "Checkout recorded" : summary.checkoutLabel}
          </Button>
          <InlineActionFeedback feedback={checkoutFeedback} />
        </div>
      ) : null}
      <button className="floating-cart-button" aria-label="Open cart" onClick={open ? onClose : onOpen} type="button">
        <Icons.cart size={18} />
        <span>{summary.itemCount}</span>
      </button>
    </div>
  );
}
