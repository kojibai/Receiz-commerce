import type { CommerceState, CustomerAccount, ReceizIdState } from "@/types/domain";

export type LocalReceizIdentitySessionInput = {
  accountImageLabel?: string;
  artifactKind?: ReceizIdState["artifactKind"];
  artifactStatus?: ReceizIdState["artifactStatus"];
  displayName: string;
  email?: string;
  handle: string;
  keyId?: string;
  localProofVerified?: boolean;
  loginMode: ReceizIdState["loginMode"];
  portableStateStatus?: ReceizIdState["portableStateStatus"];
  statusLabel: string;
};

function upsertCustomer(customers: CustomerAccount[], customer: CustomerAccount) {
  if (!customers.some((item) => item.id === customer.id || item.receizHandle === customer.receizHandle)) {
    return [customer, ...customers];
  }

  return customers.map((item) =>
    item.id === customer.id || item.receizHandle === customer.receizHandle
      ? { ...item, ...customer }
      : item
  );
}

export function applyLocalReceizIdentitySession(
  current: CommerceState,
  input: LocalReceizIdentitySessionInput,
  tenantSurface: boolean
): CommerceState {
  const customerId = `customer-${input.handle.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "receiz-id"}`;
  const customer: CustomerAccount = {
    ...(tenantSurface
      ? {
          rewardsValueLabel: "$0.00",
          beans: 0,
          streak: "0x",
          orderIds: [],
          rewardIds: [],
          assetIds: []
        }
      : current.auth.customer),
    id: tenantSurface ? customerId : current.auth.customer.id || customerId,
    name: input.displayName || current.auth.customer.name || "Receiz customer",
    email: input.email || current.auth.customer.email || `${input.handle.replace(/\.receiz\.id$/i, "")}@receiz.local`,
    receizHandle: input.handle,
    tier: tenantSurface ? "Member" : current.auth.customer.tier || "Member"
  };

  return {
    ...current,
    customers: tenantSurface ? upsertCustomer(current.customers, customer) : current.customers,
    auth: {
      ...current.auth,
      signedInAs: tenantSurface ? "customer" : current.auth.signedInAs,
      customer: tenantSurface ? customer : current.auth.customer,
      receizId: {
        ...current.auth.receizId,
        connected: true,
        handle: input.handle,
        displayName: input.displayName,
        keyId: input.keyId ?? current.auth.receizId.keyId,
        loginMode: input.loginMode,
        accountImageLabel: input.accountImageLabel ?? current.auth.receizId.accountImageLabel,
        artifactKind: input.artifactKind ?? current.auth.receizId.artifactKind,
        artifactStatus: input.artifactStatus ?? current.auth.receizId.artifactStatus,
        portableStateStatus: input.portableStateStatus ?? current.auth.receizId.portableStateStatus,
        localProofVerified: input.localProofVerified ?? current.auth.receizId.localProofVerified,
        statusLabel: input.statusLabel
      }
    }
  };
}
