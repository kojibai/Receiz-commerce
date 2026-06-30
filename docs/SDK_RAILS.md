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

## Public App State

Files:

- `app/api/hosting/route.ts`
- `app/api/store/route.ts`
- `src/lib/receiz/store-state-publication.ts`
- `src/lib/receiz/store-state-ledger.ts`
- `src/lib/storefront/server-state.ts`

SDK rails:

- `appState.publish`
- `appState.byUrl`
- `appState.byCreator`
- `appState.byNamespace`
- `appState.byId`

Admin publish writes the public storefront projection through `appState.publish`. Tenant cold starts recover the latest public store projection through `appState.byUrl` using the subdomain or custom domain URL. This is the Receiz-only durability path that lets the app avoid Supabase, Redis, Vercel KV, Shopify, or a custom database for public storefront state.

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

With `@receiz/sdk@96.2.0`, typed app-state, Twin, and World namespaces are exposed. The frontend still hides optional Twin/World buttons when the matching env flag is disabled.
