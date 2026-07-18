# SDK Reference For Proof Work

The v109 app compiler APIs (`defineReceizApp`, `compileReceizAppContract`, and
repository planning/checking functions) inspect and integrate applications.
They do not verify proof bytes. Use the SDK artifact-custody workflow for
construction, exact-byte download, enclosing verification, and extraction.
`verification.verifyArtifact` remains inspection of the complete artifact; it
does not authorize a payload parser by itself.

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
- `receiz.assets.createProofObject(input, options)`
- `receiz.artifacts.download(sealed)`
- `receiz.artifacts.verifyAndOpen(file)`
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

```ts
const sealed = await receiz.assets.createProofObject(input, options);
await receiz.artifacts.download(sealed);
const opened = await receiz.artifacts.verifyAndOpen(file);
consume(opened.verifiedPayload.bytes);
```

The exact native Record -> Seal byte sequence is the artifact. The payload is a verified projection returned separately only after enclosing-artifact verification. Never construct an artifact handle, fall back from an artifact to payload bytes, or pass complete artifact bytes directly to a domain parser. Verified legacy artifacts are read-only and are never emitted as current artifacts.

In the workflow above, `file` is the complete sealed artifact selected for verification, never the source payload.

## v109 Native Profile, Artifact, And Ownership Outcomes

- `receiz.profile.update(profile)` applies the patch to the authenticated session/OIDC actor and returns that same account's `accountUid`, profile projection, and public path.
- `receiz.identity.checkUsernameAvailability(username)` is advisory only; commit-time uniqueness decides the update.
- `receiz.assets.createProofObject(input, options)` performs native Record -> Seal and returns a runtime-issued sealed artifact.
- `receiz.artifacts.download(sealedArtifact)` preserves the exact artifact bytes and authoritative metadata.
- `receiz.artifacts.verifyAndOpen(completeFile)` verifies the enclosing artifact before returning its sealed-artifact handle and verified payload projection.
- `receiz.ownership.claimBearerAsset({ artifact: opened.sealedArtifact })` binds the authenticated owner and returns a new runtime-issued native artifact.

The profile operation accepts only the profile patch. It has no identity-key, account-selector, caller-head, claim-key, or receipt input. Require the returned `accountUid` to equal the authenticated actor.

Bearer ownership accepts only the sealed-artifact handle produced by complete verification. Prior ownership is derived from the verified carried proof payload, never from caller state or a latest server row. The result is a newly verified complete native Record -> Seal artifact; do not substitute its extracted payload.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object. SDK verification and append operations preserve that one continuity chain without granting authority to the origin platform.

Stable obsolete-versioned schemas remain historical compatibility imports. Do not teach their key/head/receipt mechanics as the active v109 profile or bearer outcome.

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
