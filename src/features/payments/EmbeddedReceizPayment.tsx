"use client";

import { useEffect, useRef, useState } from "react";
import { acceptsPaymentMessage, embeddedCheckoutFrame } from "@/lib/checkout/payment-contract";
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
  const frameRef = useRef<HTMLIFrameElement>(null);
  const callbacksRef = useRef({ onClose, onComplete });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const frame = session ? embeddedCheckoutFrame(session) : null;
  const frameUrl = frame?.url;

  useEffect(() => { callbacksRef.current = { onClose, onComplete }; }, [onClose, onComplete]);

  useEffect(() => {
    if (!session?.continuationToken) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const check = async () => {
      try {
        if (document.visibilityState === "visible") {
          const response = await fetch("/api/payments/status", {
            method: "POST", headers: { "content-type": "application/json" }, cache: "no-store", signal: controller.signal,
            body: JSON.stringify({ purpose: session.purpose, continuationToken: session.continuationToken })
          });
          const status = await response.json();
          if (!cancelled && status.paid === true && !completedRef.current) {
            completedRef.current = true;
            callbacksRef.current.onComplete();
            return;
          }
          if (!cancelled && status.status === "expired") {
            setPaymentError("This card session expired without payment. Close this panel and start checkout again.");
            return;
          }
        }
      } catch { /* Temporary status failures never establish payment. */ }
      if (!cancelled) timer = setTimeout(check, 3000);
    };
    timer = setTimeout(check, 3000);
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
  }, [session]);

  useEffect(() => {
    if (!session || !frameUrl || !session.checkoutSessionId) return;
    const expectedOrigin = new URL(frameUrl).origin;
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (acceptsPaymentMessage(event.data, event.origin, expectedOrigin, session.checkoutSessionId!)) {
        if (!completedRef.current) {
          completedRef.current = true;
          callbacksRef.current.onComplete();
        }
      } else if (event.origin === expectedOrigin && event.data?.source === "receiz-pay-embed" &&
        event.data?.sessionId === session.checkoutSessionId && event.data?.type === "checkout-error") {
        setPaymentError("The card form could not complete payment. Your order is still pending. Close and retry this payment.");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [session, frameUrl]);

  useEffect(() => {
    if (!session) return;
    completedRef.current = false;
    setPaymentError(null);
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") callbacksRef.current.onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [session]);

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
              Enter card details for the amount shown below without leaving this app.
            </p>
          </div>
          <button aria-label="Close payment" className="button button-ghost" onClick={onClose} ref={closeButtonRef} type="button">
            <Icons.close size={20} />
          </button>
        </header>
        {session.servicePeriodLabel ? <p className="embedded-payment-funding">{session.servicePeriodLabel}</p> : null}
        {session.walletAppliedLabel && session.cardDeltaLabel ? (
          <p className="embedded-payment-funding">Reserve {session.walletAppliedLabel} · Card {session.cardDeltaLabel}</p>
        ) : null}
        {paymentError ? <p role="alert">{paymentError}</p> : null}
        {frame ? (
          <iframe
            allow="payment *"
            className="embedded-payment-frame"
            name={frame.name}
            ref={frameRef}
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
            src={frame.url}
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
