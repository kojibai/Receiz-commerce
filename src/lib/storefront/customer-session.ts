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
  if (tenantSurface) {
    if (state.auth.signedInAs === "customer" && state.auth.receizId.connected) {
      return state.auth.customer;
    }

    return guestCustomerForStore(state);
  }

  if (state.auth.signedInAs === "customer") {
    return state.auth.customer;
  }

  return state.customers[0] ?? state.auth.customer;
}

export function customerReceizHandle(state: CommerceState, customer: CustomerAccount, tenantSurface = false) {
  if (customer.receizHandle) return customer.receizHandle;
  if (tenantSurface && customer.id === "guest-customer") return "Receiz ID not connected";
  if (state.auth.receizId.connected) return state.auth.receizId.handle;
  return "Receiz ID not connected";
}

function validReceizOwnerId(value: string | undefined) {
  const candidate = value?.trim() ?? "";
  return candidate.length >= 3 && candidate.length <= 180 && /^[a-z0-9][a-z0-9:._-]*$/i.test(candidate)
    ? candidate
    : null;
}

/** Returns proof-backed identity data only; presentation labels never cross this boundary. */
export function customerReceizOwnerId(state: CommerceState, customer: CustomerAccount, tenantSurface = false) {
  if (!state.auth.receizId.connected || !state.auth.receizId.localProofVerified) return null;
  if (tenantSurface && customer.id === "guest-customer") return null;
  return validReceizOwnerId(customer.receizHandle ?? state.auth.receizId.handle);
}
