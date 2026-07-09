# SDK Quickstart

Use the SDK through public exported APIs.

## Build Client

Use `createReceizClient({ baseUrl, accessToken, fetchImpl })` when you need a typed client. Public reads can run without delegated access when the rail is public. Delegated actions require a Receiz-issued bearer token from Connect/OIDC.

## Public Store

- Publish delegated store state: `receiz.publicStore.publish({ tenantHost, merchantReceizId, state, title })`
- Publish merchant proof-owned state: `receiz.publicStore.publishWithIdentityProof({ keyFile, tenantHost, merchantReceizId, storeStateRecord })`
- Recover latest public storefront: `receiz.publicStore.resolve({ host })`
- Check signed publish contract: `receiz.publicStore.assertSignedPublishContract(...)`

## App State

- `receiz.appState.publish(...)`
- `receiz.appState.publishRecord(...)`
- `receiz.appState.resolve(...)`
- `receiz.appState.byUrl(...)`
- `receiz.appState.byCreator(...)`
- `receiz.appState.byNamespace(...)`
- `receiz.appState.byId(...)`
- `receiz.appState.restoreByHost(...)`

## Proof Memory

- `createReceizProofMemory`
- `createReceizLocalStorageProofMemoryStorage`
- `createReceizInMemoryProofMemoryStorage`
- `receiz.proofMemory.syncAdditions`
- `receiz.runtime.localFirst`

## Identity

- `createReceizIdIdentity`
- `readReceizIdentityArtifact`
- `projectReceizIdentityAccount`
- `signReceizIdentityLoginProof`
- `verifyReceizIdentityLoginProof`
- `identity.ensureTenantSession`
- `identity.authorizeUrl`

## Commerce And Media

- `commerce.oneClickCheckout`
- `media.upload`
- `media.transform`
- `wallet.publicLedger`
- `wallet.resolveLedger`
- `events.subscribe`
- `proof.query`

## React Subpath

Use `@receiz/sdk/react` for UI convenience:

- `useReceizIdentity`
- `useReceizCheckout`
- `useReceizAppState`
- `useReceizMedia`
- `ReceizIdentityButton`
- `ReceizCheckoutButton`
- `ReceizWalletBalance`
- `ReceizMediaUploader`
- `ReceizDomainConnector`
- `ReceizTwinWriter`
