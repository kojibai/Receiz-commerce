import {
  merchantLocalIdentitySessionFromState,
  merchantServerSessionRequirement
} from "../hosting/merchant-session-gate";

function usdLabelFromCents(cents: number) {
  return `$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

export function identitySealCheckoutFunding(totalUsdCents: number) {
  const walletAppliedUsdCents = Math.max(0, totalUsdCents);

  return {
    strategy: "receiz_wallet_first" as const,
    totalUsdCents: walletAppliedUsdCents,
    walletBalanceUsdCents: walletAppliedUsdCents,
    walletAppliedUsdCents,
    cardDeltaUsdCents: 0,
    totalLabel: usdLabelFromCents(walletAppliedUsdCents),
    walletBalanceLabel: usdLabelFromCents(walletAppliedUsdCents),
    walletAppliedLabel: usdLabelFromCents(walletAppliedUsdCents),
    cardDeltaLabel: "$0.00",
    cardRequired: false
  };
}

export function checkoutWalletAuthority(input: {
  scopedReceizAccess: boolean;
  merchantSession?: unknown;
  handle?: string | null;
}) {
  const localIdentity = merchantLocalIdentitySessionFromState(input.merchantSession);

  return merchantServerSessionRequirement({
    action: "checkout",
    connected: input.scopedReceizAccess,
    handle: input.handle ?? localIdentity.handle,
    localReceizIdConnected: localIdentity.connected,
    localProofVerified: localIdentity.localProofVerified
  });
}

export function checkoutModeForAuthority(input: {
  configuredCheckoutMode?: string;
  tenantSurface: boolean;
  authMode?: string;
  scopedReceizAccess: boolean;
  identitySealAuthorized: boolean;
}) {
  return (
    input.configuredCheckoutMode ??
    (input.tenantSurface ||
    input.authMode === "receiz_id" ||
    input.scopedReceizAccess ||
    input.identitySealAuthorized
      ? "receiz"
      : "mock")
  );
}
