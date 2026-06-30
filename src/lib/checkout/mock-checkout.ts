import type { Cart, Order } from "@/types/domain";
import { makeId } from "@/lib/utils";

export const mockCheckout = {
  createCheckoutSession(cart: Cart) {
    return {
      id: makeId("checkout"),
      mode: "mock",
      lineCount: cart.lines.length,
      checkoutUrl: "/?checkout=mock"
    };
  },
  confirmMockCheckout(orderInput: Omit<Order, "id" | "createdAt" | "sealed">): Order {
    return {
      ...orderInput,
      id: makeId("order"),
      createdAt: new Date().toISOString(),
      sealed: true
    };
  },
  getOrder(orderId: string) {
    return { id: orderId, ok: true };
  }
};
