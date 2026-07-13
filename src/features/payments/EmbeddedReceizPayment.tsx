"use client";

import { useEffect, useRef } from "react";
import { Icons } from "@/components/icons";
import { StatusPill } from "@/components/ui";
import type { EmbeddedPaymentSession } from "@/types/embedded-payment";

export function EmbeddedReceizPayment({
  onClose,
  onComplete,
  session
}: {
  onClose: () => void;
  onComplete: () => void;
  session: EmbeddedPaymentSession | null;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!session) return;
    completedRef.current = false;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose, session]);

  if (!session) return null;

  return (
    <div className="embedded-payment-backdrop" role="presentation">
      <section
        aria-describedby="embedded-payment-description"
        aria-labelledby="embedded-payment-title"
        aria-modal="true"
        className="embedded-payment-dialog"
        role="dialog"
      >
        <header>
          <div>
            <StatusPill tone="green">Secure payment</StatusPill>
            <h2 id="embedded-payment-title">{session.title}</h2>
            <p id="embedded-payment-description">
              Wallet funds apply first. Enter card details only for the remaining amount without leaving this app.
            </p>
          </div>
          <button aria-label="Close payment" className="button button-ghost" onClick={onClose} ref={closeButtonRef} type="button">
            <Icons.close size={20} />
          </button>
        </header>
        {session.checkoutUrl ? (
          <iframe
            allow="payment *"
            className="embedded-payment-frame"
            onLoad={(event) => {
              if (completedRef.current) return;
              try {
                const frameHref = event.currentTarget.contentWindow?.location.href;
                if (!frameHref) return;
                const frameUrl = new URL(frameHref);
                if (frameUrl.origin !== window.location.origin) return;

                const completed =
                  frameUrl.searchParams.get("billing") === "success" ||
                  frameUrl.searchParams.get("checkout") === "success";
                if (completed) {
                  completedRef.current = true;
                  onComplete();
                }
              } catch {
                // Cross-origin payment content is expected until it returns to this app's success URL.
              }
            }}
            referrerPolicy="strict-origin-when-cross-origin"
            src={session.checkoutUrl}
            title="Receiz secure card payment"
          />
        ) : (
          <div className="embedded-payment-unavailable" role="alert">
            <Icons.creditCard size={28} />
            <strong>The secure card form could not load.</strong>
            <span>The payment session is still open. Close this panel and retry; no plan, domain, or order has been activated.</span>
          </div>
        )}
        <footer>
          <Icons.lock size={16} />
          <span>Card data is handled by the Receiz payment rail. This app receives settlement status and proof only.</span>
        </footer>
      </section>
    </div>
  );
}
