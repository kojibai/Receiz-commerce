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

Registered native clients use the exact registered OIDC client ID for `RECEIZ_APPLICATION_ID`, application, and audience. Keep client secrets server-side and compose the [existing grant/source/session sequence](../../receiz-proof-authority/examples/registered-native-session.md); subject identity and usernames are not application aliases.

Current artifact delivery/claim uses `receiz.artifacts.verifyAndOpen(file)` then `receiz.ownership.claimBearerAsset({ artifact: opened.sealedArtifact })`. The current full MCP `receiz_bearer_artifact_claim` adapter composes that path through a private digest-bound source reference, same-runtime SDK custody, and single-use confirmation. It is separate from checkout and from historical V120 bearer instruments. Use the [full financial tool map](../../receiz-mcp-agent-skill/resources/full-financial-tool-map.md) for actual arguments and operation boundaries; no inventory entry supplies deployed purchase evidence. Historical commerce rails need the SDK's explicitly configured compatible HTTP host.

`receiz.commerce.oneClickCheckout(...)` never treats a wallet read as settlement. It returns `wallet_settlement_execution_required` with zero applied wallet funds and no card request when wallet funding would be proposed. With `walletFirst: false` it may create a card checkout session, whose creation/success does not establish asset payment, delivery, ownership, or use.

## Storefront First Paint

Paint known verified product truth immediately. Background sync may append verified additions, but must not replace the settled product shell with a loading state.

## Public Store Projection

Public store state is a projection. Present it beneath product proof, ownership proof, and settlement proof.

## Generated App Requirements

- Show product proof identity near the purchase action.
- Show ownership or custody state when available.
- Show receipt and settlement boundaries separately.
- Use explicit action confirmation for payment, transfer, publish, and receipt append.
