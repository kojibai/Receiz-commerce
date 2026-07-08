import type { Order, Product } from "@/types/domain";

export type CheckoutCompletionStage =
  | "card_required"
  | "shipping_required"
  | "physical_ready"
  | "digital_delivery_queued";

export type CheckoutFulfillmentStatus =
  | "payment_required"
  | "shipping_required"
  | "ready_to_ship"
  | "delivery_queued";

export type CheckoutCompletionState = {
  stage: CheckoutCompletionStage;
  canRecordPaidOrder: boolean;
  shouldOpenCardPayment: boolean;
  orderStatus: Order["status"];
  settlementStatus: Order["settlementStatus"];
  sealed: boolean;
  fulfillmentKind: NonNullable<Order["fulfillment"]>["kind"];
  fulfillmentStatus: CheckoutFulfillmentStatus;
  fulfillmentMessage: string;
  deliveryRails?: NonNullable<Order["fulfillment"]>["deliveryRails"];
};

const PLACEHOLDER_SHIPPING_VALUES = new Set(["add shipping address", "pending", ""]);

function present(value: string | undefined) {
  return Boolean(value?.trim());
}

function realShippingValue(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return present(value) && !PLACEHOLDER_SHIPPING_VALUES.has(normalized);
}

export function validShippingAddress(shipping: Order["shipping"] | undefined): shipping is NonNullable<Order["shipping"]> {
  return Boolean(
    shipping &&
      realShippingValue(shipping.name) &&
      realShippingValue(shipping.email) &&
      realShippingValue(shipping.line1) &&
      realShippingValue(shipping.city) &&
      realShippingValue(shipping.postalCode) &&
      realShippingValue(shipping.country)
  );
}

export function checkoutHasPhysicalProducts(products: Product[]) {
  return products.some((product) => product.type === "physical");
}

export function checkoutHasDigitalDeliveryProducts(products: Product[]) {
  return products.some((product) => product.type !== "physical");
}

export function checkoutFulfillmentKind(products: Product[]): NonNullable<Order["fulfillment"]>["kind"] {
  const physical = checkoutHasPhysicalProducts(products);
  const digital = checkoutHasDigitalDeliveryProducts(products);

  if (physical && digital) return "mixed";
  return physical ? "physical_shipping" : "digital_delivery";
}

export function checkoutCompletionState(input: {
  funding: NonNullable<Order["funding"]>;
  products: Product[];
  shipping?: Order["shipping"];
}): CheckoutCompletionState {
  const fulfillmentKind = checkoutFulfillmentKind(input.products);

  if (input.funding.cardRequired) {
    return {
      stage: "card_required",
      canRecordPaidOrder: false,
      shouldOpenCardPayment: true,
      orderStatus: "card_required",
      settlementStatus: "card_required",
      sealed: false,
      fulfillmentKind,
      fulfillmentStatus: "payment_required",
      fulfillmentMessage: "Collect the card delta before creating the paid order."
    };
  }

  if (checkoutHasPhysicalProducts(input.products) && !validShippingAddress(input.shipping)) {
    return {
      stage: "shipping_required",
      canRecordPaidOrder: true,
      shouldOpenCardPayment: false,
      orderStatus: "pending",
      settlementStatus: "settled",
      sealed: false,
      fulfillmentKind,
      fulfillmentStatus: "shipping_required",
      fulfillmentMessage: "Payment received. Add shipping details to finish fulfillment."
    };
  }

  if (checkoutHasPhysicalProducts(input.products)) {
    return {
      stage: "physical_ready",
      canRecordPaidOrder: true,
      shouldOpenCardPayment: false,
      orderStatus: "settled",
      settlementStatus: "settled",
      sealed: true,
      fulfillmentKind,
      fulfillmentStatus: "ready_to_ship",
      fulfillmentMessage: "Payment and shipping are attached. Merchant fulfillment is ready."
    };
  }

  return {
    stage: "digital_delivery_queued",
    canRecordPaidOrder: true,
    shouldOpenCardPayment: false,
    orderStatus: "settled",
    settlementStatus: "settled",
    sealed: true,
    fulfillmentKind,
    fulfillmentStatus: "delivery_queued",
    fulfillmentMessage: "Digital delivery queued through Receiz communications and email.",
    deliveryRails: ["receiz_communications", "email"]
  };
}

export function checkoutOrderFulfillment(state: CheckoutCompletionState): Order["fulfillment"] {
  return {
    kind: state.fulfillmentKind,
    status: state.fulfillmentStatus,
    message: state.fulfillmentMessage,
    deliveryRails: state.deliveryRails
  };
}
