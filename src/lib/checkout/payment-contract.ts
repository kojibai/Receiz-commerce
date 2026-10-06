import type { CheckoutSessionResponse, ConnectWalletResponse } from "@receiz/sdk";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function normalizeCheckoutSession(value: unknown): CheckoutSessionResponse {
  const response = record(value);
  const session = record(response.checkout ?? response.session ?? response);
  const settlement = record(response.settlement);
  const state = String(session.state ?? session.status ?? "open");
  const status = session.isPaid === false ? /^(paid|settled|succeeded)$/i.test(state) ? "unpaid" : state
    : session.isPaid === true || session.stripePaymentStatus === "paid" ? "paid"
    : state;
  return {
    ...response,
    ok: response.ok === true,
    checkoutSessionId: typeof (session.sessionId ?? session.checkoutSessionId) === "string" ? String(session.sessionId ?? session.checkoutSessionId) : undefined,
    checkoutUrl: typeof (session.url ?? session.checkoutUrl) === "string" ? String(session.url ?? session.checkoutUrl) : undefined,
    clientSecret: typeof session.clientSecret === "string" ? session.clientSecret : undefined,
    status,
    amountUsdCents: session.amountUsdCents ?? settlement.amountUsdCents,
    referenceId: session.referenceId,
    merchantUsername: session.merchantUsername ?? response.merchantUsername,
    recipientUserId: settlement.userId ?? session.recipientUserId ?? response.recipientUserId,
    proofBundle: settlement.proofBundle ?? session.proofBundle ?? response.proofBundle,
    receiptId: typeof (session.paymentIntentId ?? response.receiptId) === "string" ? String(session.paymentIntentId ?? response.receiptId) : undefined
  };
}

export function reserveBalanceUsdCents(value: ConnectWalletResponse): number | null {
  if (!value.ok) return null;
  const wallet = record(value.wallet ?? value);
  const states = record(wallet.valueStates);
  const raw = states.settledBalanceUsdCents ?? wallet.balanceUsdCents;
  const cents = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : raw;
  return typeof cents === "number" && Number.isSafeInteger(cents) && cents >= 0 ? cents : null;
}

export function merchantCheckoutUsername(handle: string) {
  const username = handle.trim().replace(/^@/, "").replace(/\.receiz\.id$/i, "").toLowerCase();
  if (!/^[a-z0-9_][a-z0-9_.-]{0,62}$/.test(username)) throw new Error("checkout_merchant_username_invalid");
  return username;
}

export function embeddedCheckoutFrame(session: { checkoutSessionId?: string; clientSecret?: string; paymentOrigin?: string; merchantUsername?: string; checkoutUrl?: string }): { url: string; name: string } | null {
  if (!session.checkoutSessionId || !session.paymentOrigin) return null;
  let origin: string;
  try {
    const payment = new URL(session.paymentOrigin);
    if (payment.protocol !== "https:" || payment.username || payment.password) return null;
    origin = payment.origin;
  } catch { return null; }
  if (session.clientSecret) {
    const params = new URLSearchParams({ session_id: session.checkoutSessionId });
    if (session.merchantUsername) params.set("merchant", session.merchantUsername);
    return {
      url: `${origin}/payments/embed/checkout?${params}`,
      name: JSON.stringify({ source: "receiz-pay-embed-bootstrap", sessionId: session.checkoutSessionId,
        clientSecret: session.clientSecret, merchantUsername: session.merchantUsername ?? null })
    };
  }
  if (!session.checkoutUrl) return null;
  try {
    const url = new URL(session.checkoutUrl);
    if (url.origin !== origin || url.pathname !== "/payments/embed/checkout" ||
      url.searchParams.get("session_id") !== session.checkoutSessionId ||
      (session.merchantUsername && url.searchParams.get("merchant") !== session.merchantUsername) ||
      [...url.searchParams.keys()].some((key) => !["session_id", "merchant"].includes(key))) return null;
    return { url: url.href, name: "" };
  } catch { return null; }
}

export function acceptsPaymentMessage(data: unknown, origin: string, expectedOrigin: string, sessionId: string): boolean {
  const message = record(data);
  return origin === expectedOrigin && message.source === "receiz-pay-embed" &&
    message.type === "checkout-complete" && message.sessionId === sessionId;
}
