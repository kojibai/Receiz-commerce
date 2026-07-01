import {
  merchantLocalProofObjectFromState,
  merchantProofAuthorityRequirement
} from "../hosting/merchant-proof-authority";

function usdLabelFromCents(cents: number) {
  return `$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

export function proofObjectCheckoutFunding(totalUsdCents: number, walletBalanceUsdCents = totalUsdCents) {
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
  proofObject?: unknown;
  handle?: string | null;
}) {
  const localIdentity = merchantLocalProofObjectFromState(input.proofObject);

  return merchantProofAuthorityRequirement({
    action: "checkout",
    delegatedPermission: input.scopedReceizAccess,
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
  proofObjectAuthorized: boolean;
}) {
  return (
    input.configuredCheckoutMode ??
    (input.tenantSurface ||
    input.authMode === "receiz_id" ||
    input.scopedReceizAccess ||
    input.proofObjectAuthorized
      ? "receiz"
      : "mock")
  );
}
