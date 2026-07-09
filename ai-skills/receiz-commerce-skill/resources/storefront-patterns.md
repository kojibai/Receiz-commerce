# Storefront Patterns

## No-Database Store

A no-database Receiz store reads public proof objects and public store state, then renders deterministic projections. It may use local state for interaction, but local state cannot outrank proof.

Core SDK rails:

- `createReceizClient`
- `receiz.publicStore.resolve`
- `receiz.publicStore.publish`
- `receiz.publicStore.publishWithIdentityProof`
- `receiz.appState.resolve`
- `receiz.verification.verifyArtifact`
- `receiz.connect.checkout`
- `receiz.connect.checkoutSession`
- `receiz.sandbox.seedStore`
- `receiz.sandbox.checkout`

## Storefront First Paint

Paint known verified product truth immediately. Background sync may append verified additions, but must not replace the settled product shell with a loading state.

## Public Store Projection

Public store state is a projection. Present it beneath product proof, ownership proof, and settlement proof.

## Generated App Requirements

- Show product proof identity near the purchase action.
- Show ownership or custody state when available.
- Show receipt and settlement boundaries separately.
- Use explicit action confirmation for payment, transfer, publish, and receipt append.
