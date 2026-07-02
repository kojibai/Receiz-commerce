import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkoutCompletionState,
  validShippingAddress
} from "../src/lib/checkout/customer-purchase.js";
import type { Order, Product } from "../src/types/domain.js";

const funding = (cardRequired: boolean): NonNullable<Order["funding"]> => ({
  strategy: "receiz_wallet_first",
  totalLabel: "$18.00",
  walletAppliedLabel: cardRequired ? "$9.00" : "$18.00",
  walletBalanceLabel: cardRequired ? "$9.00" : "$30.00",
  cardDeltaLabel: cardRequired ? "$9.00" : "$0.00",
  cardRequired
});

const product = (type: Product["type"]): Product => ({
  id: `${type}-product`,
  name: `${type} product`,
  subtitle: "Proof product",
  description: "A product used for checkout projection tests.",
  priceLabel: "$18.00",
  status: "active",
  inventoryLabel: "In stock",
  type,
  imageTone: "card",
  imageUrl: null,
  rewardEligible: true,
  sealed: true
});

const shipping: Order["shipping"] = {
  name: "Buyer Example",
  email: "buyer@example.com",
  line1: "100 Proof Way",
  city: "Austin",
  region: "TX",
  postalCode: "78701",
  country: "US"
};

describe("customer purchase completion", () => {
  it("stops at card payment before creating a completed order", () => {
    const state = checkoutCompletionState({
      funding: funding(true),
      products: [product("physical")],
      shipping
    });

    assert.equal(state.stage, "card_required");
    assert.equal(state.canRecordPaidOrder, false);
    assert.equal(state.shouldOpenCardPayment, true);
    assert.equal(state.orderStatus, "card_required");
  });

  it("collects payment first and then requires shipping for physical products", () => {
    const state = checkoutCompletionState({
      funding: funding(false),
      products: [product("physical")]
    });

    assert.equal(state.stage, "shipping_required");
    assert.equal(state.canRecordPaidOrder, true);
    assert.equal(state.sealed, false);
    assert.equal(state.orderStatus, "pending");
    assert.equal(state.fulfillmentStatus, "shipping_required");
  });

  it("seals physical orders when payment and shipping both exist", () => {
    const state = checkoutCompletionState({
      funding: funding(false),
      products: [product("physical")],
      shipping
    });

    assert.equal(state.stage, "physical_ready");
    assert.equal(state.canRecordPaidOrder, true);
    assert.equal(state.sealed, true);
    assert.equal(state.orderStatus, "settled");
    assert.equal(state.fulfillmentStatus, "ready_to_ship");
  });

  it("queues digital delivery through Receiz communications and email after payment", () => {
    const state = checkoutCompletionState({
      funding: funding(false),
      products: [product("digital")]
    });

    assert.equal(state.stage, "digital_delivery_queued");
    assert.equal(state.canRecordPaidOrder, true);
    assert.equal(state.sealed, true);
    assert.equal(state.orderStatus, "settled");
    assert.deepEqual(state.deliveryRails, ["receiz_communications", "email"]);
  });

  it("does not treat placeholder shipping copy as a real address", () => {
    assert.equal(validShippingAddress(shipping), true);
    assert.equal(
      validShippingAddress({
        name: "Buyer Example",
        email: "buyer@example.com",
        line1: "Add shipping address",
        city: "Pending",
        region: "",
        postalCode: "",
        country: "US"
      }),
      false
    );
  });
});
