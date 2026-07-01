# Receiz SDK Rail Map

This template is intended to show how to build a commerce SaaS on top of `@receiz/sdk` without reaching into internal Receiz code.

## Authority Model

The proof object is the authority. Receiz Key, Identity Record, Identity Seal, sealed artifact/proof bundle, verified append, ownership append, and settlement ledger rows carry truth.

The SDK is convenience and typed transport around that truth. It verifies, projects, admits into proof memory, publishes public-store/app-state records, and calls remote rails when delegated permission is needed. Receiz MCP is agent-callable tooling over the SDK/API surface; it does not create, replace, or outrank proof truth. Connect/OIDC access tokens authorize scoped remote calls after proof, but they are permission artifacts, not the identity proof root.

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
- `commerce.oneClickCheckout`

Tenant checkout is host-scoped. A customer can proceed from a verified identity proof object, continued Receiz ID proof, or delegated tenant permission. Wallet-first checkout applies Receiz wallet balance first and uses card fallback only for the delta.

## Customers And Merchants

Files:

- `src/lib/receiz/adapter.ts`
- `app/api/checkout/route.ts`
- `src/features/account/AccountDashboard.tsx`
- `src/features/admin/AdminStudio.tsx`

SDK rails:

- `customers.session`
- `customers.portal`
- `customers.orders`
- `customers.rewards`
- `customers.assets`
- `merchants.onboard`
- `merchants.profile`
- `merchants.capabilities`

These rails are exposed in `@receiz/sdk@97.5.0`. The app treats customer accounts as tenant-scoped storefront projections over Receiz proof. The same proof-bearing Receiz identity can be used across multiple stores, but orders, rewards, assets, and permissions are projected for the active subdomain or custom domain. SDK `doctor()` reports delegated-token, tenant, customer, merchant, commerce, media, domain, and public-store requirements directly.

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
- `appState.publishRecord`
- `appState.createPublicStoreRecord`
- `domains.resolveTenant`
- `appState.byUrl`
- `appState.byCreator`
- `appState.byNamespace`
- `appState.byId`

Admin publish writes the public storefront projection through the SDK public-store app-state record helpers. Tenant cold starts first recover the latest public store projection through `domains.resolveTenant`, then fall back to raw public app-state reads for older registry records. This is the Receiz-only durability path that lets the app avoid Supabase, Redis, Vercel KV, Shopify, or a custom database for public storefront state.

## App Runtime Rails

Files:

- `src/lib/receiz/adapter.ts`
- `app/api/receiz/route.ts`

SDK rails:

- `doctor`
- `capabilities`
- `media.upload`
- `media.transform`
- `domains.reserveSubdomain`
- `domains.verifyCustomDomain`
- `domains.status`
- `events.subscribe`
- `events.replay`
- `jobs.enqueue`
- `permissions.grant`
- `permissions.check`
- `audit.append`
- `risk.scorePayment`
- `compliance.exportOrders`
- `portability.exportStore`
- `portability.importStore`
- `search.products`
- `notifications.send`
- `releases.check`
- `releases.pin`

These rails make the template a real Receiz SaaS substrate rather than a static demo. The adapter exposes them behind one app boundary so builders can add production UI without importing internal Receiz code.

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

With `@receiz/sdk@97.5.0`, typed app-state, public-store, Twin, World, commerce runtime, domain, customer, merchant, media, portability, and release namespaces are exposed. The publish path uploads inline merchant media with `media.upload()` before writing state with `publicStore.publish()`, so published subdomains and custom domains render durable Receiz media URLs instead of stripped local data URLs. The frontend still hides optional Twin/World buttons when the matching env flag is disabled.
