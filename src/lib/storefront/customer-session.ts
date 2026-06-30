import type { CommerceState, CustomerAccount } from "@/types/domain";

export function guestCustomerForStore(state: CommerceState): CustomerAccount {
  return {
    id: "guest-customer",
    name: "Your account",
    email: "Continue with Receiz ID",
    tier: "Guest",
    rewardsValueLabel: "$0.00",
    beans: 0,
    streak: "0x",
    orderIds: [],
    rewardIds: [],
    assetIds: [],
    receizHandle: undefined,
    shippingAddress: undefined
  };
}

export function customerForAccountSurface(state: CommerceState, tenantSurface: boolean): CustomerAccount {
  if (tenantSurface && !state.auth.receizId.connected) {
    return guestCustomerForStore(state);
  }

  if (state.auth.signedInAs === "customer") {
    return state.auth.customer;
  }

  return state.customers[0] ?? state.auth.customer;
}

export function customerReceizHandle(state: CommerceState, customer: CustomerAccount) {
  if (customer.receizHandle) return customer.receizHandle;
  if (state.auth.receizId.connected) return state.auth.receizId.handle;
  return "Receiz ID not connected";
}
