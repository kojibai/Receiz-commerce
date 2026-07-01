import {
  merchantLocalIdentitySessionFromState,
  merchantServerSessionRequirement
} from "../hosting/merchant-session-gate";

function usdLabelFromCents(cents: number) {
  return `$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

export function identitySealCheckoutFunding(totalUsdCents: number, walletBalanceUsdCents = totalUsdCents) {
  const safeTotalUsdCents = Math.max(0, totalUsdCents);
  const safeWalletBalanceUsdCents = Math.max(0, walletBalanceUsdCents);
  const walletAppliedUsdCents = Math.min(safeTotalUsdCents, safeWalletBalanceUsdCents);
  const cardDeltaUsdCents = Math.max(0, safeTotalUsdCents - walletAppliedUsdCents);

  return {
    strategy: "receiz_wallet_first" as const,
    totalUsdCents: safeTotalUsdCents,
    walletBalanceUsdCents: safeWalletBalanceUsdCents,
    walletAppliedUsdCents,
    cardDeltaUsdCents,
    totalLabel: usdLabelFromCents(safeTotalUsdCents),
    walletBalanceLabel: usdLabelFromCents(safeWalletBalanceUsdCents),
    walletAppliedLabel: usdLabelFromCents(walletAppliedUsdCents),
    cardDeltaLabel: usdLabelFromCents(cardDeltaUsdCents),
    cardRequired: cardDeltaUsdCents > 0
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
