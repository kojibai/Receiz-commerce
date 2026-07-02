import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutCommerceEvent } from "../src/lib/checkout/commerce-event.js";

describe("checkout commerce events", () => {
  it("builds a tenant-scoped event that preserves customer, funding, and order identity", () => {
    const event = checkoutCommerceEvent({
      checkoutSessionId: "in_app_123",
      customerEmail: "buyer@example.com",
      customerId: "customer-buyer",
      customerName: "Buyer Example",
      funding: {
        strategy: "receiz_wallet_first",
        totalLabel: "$18.00",
        walletAppliedLabel: "$0.00",
        cardDeltaLabel: "$18.00",
        cardRequired: true
      },
      itemCount: 1,
      merchantReceizId: "bjklock.receiz.id",
      orderId: "order-123",
      paymentRail: "card_fallback",
      settlementStatus: "card_required",
      fulfillment: {
        kind: "physical_shipping",
        status: "payment_required",
        message: "Collect the card delta before creating the paid order."
      },
      tenantHost: "bjklock.receiz.app",
      totalLabel: "$18.00"
    });

    assert.equal(event.id, "checkout:bjklock.receiz.app:in_app_123");
    assert.equal(event.type, "checkout.requires_card");
    assert.equal(event.tenantHost, "bjklock.receiz.app");
    assert.equal(event.merchantReceizId, "bjklock.receiz.id");
    assert.equal(event.data.orderId, "order-123");
    assert.equal(event.data.customerName, "Buyer Example");
    assert.equal(event.data.funding?.cardDeltaLabel, "$18.00");
    assert.equal(event.data.fulfillment?.status, "payment_required");
  });
});
