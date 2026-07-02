export type AccountRouteSessionKind = "customer" | "merchant";

export function accountRouteSessionKind(tenantSurface: boolean): AccountRouteSessionKind {
  return tenantSurface ? "customer" : "merchant";
}

export function shouldAutoResolveAccountRouteSession(input: {
  accountRouteActive: boolean;
  identityActionsReady: boolean;
  receizConnected: boolean;
  resolvingAccountSession: boolean;
}) {
  return (
    input.accountRouteActive &&
    input.identityActionsReady &&
    !input.receizConnected &&
    !input.resolvingAccountSession
  );
}

export function shouldShowAccountIdentityEntry(input: {
  accountRouteActive: boolean;
  identityActionsReady: boolean;
  receizConnected: boolean;
  resolvingAccountSession: boolean;
}) {
  return (
    input.identityActionsReady &&
    !input.receizConnected &&
    !input.accountRouteActive &&
    !input.resolvingAccountSession
  );
}

export function accountRouteActiveFromMobileView(view: string) {
  return view === "account";
}
