# Receiz SDK Rail Map

This template is intended to show how to build a commerce SaaS on top of `@receiz/sdk` without reaching into internal Receiz code.

## Identity

Files:

- `app/api/auth/receiz/start/route.ts`
- `app/api/auth/receiz/callback/route.ts`
- `app/api/auth/receiz/me/route.ts`
- `src/features/admin/ReceizIdentityPanel.tsx`
- `src/lib/storage/use-template-store.ts`

SDK rails:

- `identity.authorizeUrl`
- `identity.token`
- `identity.userinfo`
- `identity.createReceizId`
- `identity.readArtifact`
- `identity.projectAccount`
- `identity.signLoginProof`
- `identity.verifyLoginProof`
- `identity.buildReceizIdContinueRequest`

## Checkout And Wallet

Files:

- `app/api/checkout/route.ts`
- `src/lib/storage/use-template-store.ts`
- `src/features/admin/AdminStudio.tsx`

SDK rails:

- `connect.wallet`
- `payments.embeddedCheckout`
- `connect.checkoutSession`

Tenant checkout is host-scoped. A customer must log in with Receiz ID on the merchant store host before wallet-first checkout can proceed.

## Merchant Settlement

Files:

- `app/api/checkout/route.ts`
- `app/api/hosting/route.ts`

SDK rails:

- `connect.transfer`
- `connect.record`

Platform fees can settle to the platform Receiz account. Customer checkout sends merchant settlement metadata so store purchases route to the merchant Receiz rails.

## Proof Objects And Assets

Files:

- `src/lib/receiz/adapter.ts`
- `src/features/storefront/PublicStorefront.tsx`
- `src/features/account/AccountDashboard.tsx`

SDK rails:

- `verification.verifyArtifact`
- `verification.sealArtifact`
- `publicProof.observe`
- `publicProof.byUrl`
- `publicProof.byId`
- `manifests.projectAsset`
- `manifests.projectSportsCard`
- `proofMemory.createRegister`
- `proofMemory.createMemory`

## Webhooks

Files:

- `src/lib/receiz/adapter.ts`

SDK rails:

- `webhooks.sign`
- `webhooks.verifySignature`
- `webhooks.assertEvent`

Webhook delivery proves transport authenticity. The underlying proof object, append, ownership state, or settlement ledger row remains the source of truth.

## Content Assistance

Files:

- `src/lib/receiz/capabilities.ts`
- `src/lib/content/twin-assist.ts`
- `app/api/content/twin/route.ts`

Receiz Twin/World buttons are hidden unless both are true:

- The relevant `NEXT_PUBLIC_RECEIZ_*_ENABLED` flag is set.
- The installed `@receiz/sdk` client exposes the matching namespace.

With `@receiz/sdk@96.0.0`, no typed Twin/World namespace is exposed, so the frontend does not show those buttons.
