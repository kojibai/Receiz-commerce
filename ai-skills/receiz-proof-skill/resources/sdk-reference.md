# SDK Reference For Proof Work

The v107 app compiler APIs (`defineReceizApp`, `compileReceizAppContract`, and
repository planning/checking functions) inspect and integrate applications.
They do not verify proof bytes. Continue to use `verification.verifyArtifact`
for the indivisible integrity, owner, namespace, and continuity verdict.

Import runtime proof APIs from `@receiz/sdk`, React bindings from `@receiz/sdk/react`, compiler APIs from `@receiz/sdk/compiler`, and sandbox/conformance helpers from `@receiz/sdk/testing`. Emulator evidence is `sandboxVerified`, not production verification.

Source: `packages/receiz-sdk/src/index.ts`, `packages/receiz-sdk/src/identity.ts`, `packages/receiz-sdk/src/react.ts`, and SDK package docs.

## Core Constants And Schemas

- `RECEIZ_SDK_VERSION`
- `RECEIZ_SCHEMAS`
- `RECEIZ_ASSET_MANIFEST_SCHEMA`
- `RECEIZ_SPORTS_CARD_MANIFEST_SCHEMA`
- `RECEIZ_WEBHOOK_EVENT_SCHEMA`
- `RECEIZ_APP_STATE_FEED_SCHEMA`
- `RECEIZ_PUBLIC_STORE_STATE_FEED_SCHEMA`
- `RECEIZ_PUBLIC_STORE_STATE_PROJECTION_SCHEMA`

## Validators And Projectors

- `assertReceizProofBundle`
- `isReceizProofBundle`
- `assertReceizAssetManifest`
- `isReceizAssetManifest`
- `assertReceizSportsCardManifest`
- `isReceizSportsCardManifest`
- `assertReceizWebhookEvent`
- `isReceizWebhookEvent`
- `projectReceizAssetManifest`
- `projectReceizSportsCardManifest`
- `assertReceizProofRegisterSnapshot`

## Proof Memory

- `createReceizProofRegister`
- `createReceizProofMemory`
- `createReceizInMemoryProofMemoryStorage`
- `createReceizLocalStorageProofMemoryStorage`
- `receizProofMemoryAdditionsQuery`
- `receiz.proofMemory.syncAdditions`

Use proof memory as admitted truth. It is not cache.

## Client Rails

- `createReceizClient`
- `receiz.verification.verifyArtifact(file)`
- `receiz.publicProof.byUrl(url)`
- `receiz.publicProof.byId(id)`
- `receiz.publicProof.byCreator(receizId)`
- `receiz.appState.publish(...)`
- `receiz.appState.resolve(...)`
- `receiz.publicStore.publish(...)`
- `receiz.publicStore.resolve(...)`
- `receiz.publicStore.publishWithIdentityProof(...)`
- `receiz.wallet.publicLedger(...)`
- `receiz.sports.conformance()`
- `receiz.sports.resolveCardMemory(...)`
- `receiz.sports.resolvePitchDayProof(...)`

## v107 Unified Operations

- `receiz.identity.getProfile()`
- `receiz.identity.checkUsernameAvailability(...)`
- `receiz.identity.updateProfile(...)`
- `receiz.identity.restoreAccount(...)`
- `receiz.identity.appendAccountState(...)`
- `receiz.media.publishIdentityImage(...)`
- `receiz.ownership.claimBearerAsset(...)`
- `receiz.continuity.reconcile(...)`
- `receiz.continuity.commit(...)`
- `receiz.proofHeads.get(...)`
- `receiz.receipts.verify(...)`
- `receiz.offline.executeOrQueue(...)`

Mutations require the canonical expected head and idempotency key. Project committed state only after canonical receipt verification; queued offline proposals are not global commitment.

## Identity Proof Helpers

- `createReceizIdIdentity`
- `readReceizIdentityArtifact`
- `projectReceizIdentityAccount`
- `signReceizIdentityLoginProof`
- `verifyReceizIdentityLoginProof`
- `buildReceizIdContinueRequest`
- `appendReceizIdentityArtifactTrailerToPng`
- `serializeReceizIdentityArtifact`

## Local CLI

- `receiz inspect <path-to-proof-json>`
- `receiz conformance`
- `receiz init <target-dir>`
- `receiz doctor`
- `receiz dev`
- `receiz deploy-check`
- `receiz seed-store`
- `receiz simulate-checkout`

The CLI uses SDK validators, projections, and proof memory. It is not a separate authority.
