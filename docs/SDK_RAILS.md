# Receiz SDK Rail Map

This template shows how to build a commerce SaaS on top of `@receiz/sdk` without reaching into internal Receiz code.

The rail map is a public contract for clone builders. If a developer wants to add a new feature, this file should tell them which SDK rail owns it, which local file wraps it, and which proof object or append remains authoritative.

## What One SDK Boundary Replaces

Receiz Commerce Kit intentionally gathers product concerns that are often scattered across many vendors and internal services:

- Account creation, continuation, identity artifact restore, and tenant session scope.
- Object verification, sealing, public proof lookup, proof memory, and Kai-ordered append recovery.
- Wallet-first checkout, embedded payments, merchant settlement metadata, customer orders, rewards, and assets.
- Public-store publish, app-state projection, durable media URLs, and tenant cold-start recovery.
- Subdomain reservation, custom-domain verification, DNS instructions, and host-to-tenant resolution.
- Webhooks, audit, jobs, permissions, risk checks, compliance export, portability, notifications, release checks, and release pinning.

The app still has UI state, browser storage, route handlers, and optional hosting automation. Those are product projections and transport helpers. They are not proof authority.

## MCP Relationship

Receiz MCP is the agent-facing tool layer over the SDK/API surface. Use it for diagnostics, setup inspection, rail invocation, and release assistance from tools such as Codex.

The AI operator rule is explicit: AI is the operator; proof is the authority. MCP, Twin, World, SDK doctor, and capability checks may draft, inspect, diagnose, and invoke allowed rails, but they do not create or outrank proof truth.

MCP does not replace:

- SDK verification.
- Signed public-store publish.
- Identity proof objects.
- Proof memory admission.
- Kai pulse ordering.
- Verified ownership or settlement appends.

If an agent calls an MCP tool or a Twin/World assist rail, the result still needs to respect the same proof model described here.

## Authority Model

The proof object is the authority. Receiz Key, Identity Record, Identity Seal, sealed artifact/proof bundle, verified append, ownership append, and settlement ledger rows carry truth.

The SDK is convenience and typed transport around that truth. It verifies, projects, admits into proof memory, publishes public-store/app-state records, and calls remote rails when delegated permission is needed. Receiz MCP is agent-callable tooling over the SDK/API surface; it does not create, replace, or outrank proof truth. Connect/OIDC access tokens authorize scoped remote calls after proof, but they are permission artifacts, not the identity proof root.

Kai-Klok is the deterministic state machine behind the proof coordinate. Storefront state must be ordered only by the Kai pulse carried by the append/proof object. Do not rank store truth by server timestamps, response arrival order, cache freshness, localStorage writes, Vercel memory, Stripe/Shopify state, or any non-Receiz system. If a needed coordinate is missing from the SDK/MCP rail, treat that as a missing Receiz contract and fail the path visibly.

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
- `connect.checkout`
- `connect.checkoutSession`
- `connect.transfer`
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

These rails are exposed in `@receiz/sdk@109.0.0`. The app treats customer accounts as tenant-scoped storefront projections over Receiz proof. The same proof-bearing Receiz identity can be used across multiple stores, but orders, rewards, assets, and permissions are projected for the active subdomain or custom domain. SDK `doctor()` reports delegated-token, tenant, customer, merchant, commerce, media, domain, and public-store requirements directly.

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
- `assets.createProofObject`
- `publicProof.observe`
- `publicProof.byUrl`
- `publicProof.byId`
- `manifests.projectAsset`
- `manifests.projectSportsCard`
- `proofMemory.createRegister`
- `proofMemory.createMemory`

`assets.createProofObject` creates the authenticated owner's native Record projection before sealing and verifies continuity afterward.

## Public App State

Files:

- `app/api/hosting/route.ts`
- `app/api/store/route.ts`
- `src/lib/receiz/store-state-publication.ts`
- `src/lib/receiz/store-state-ledger.ts`
- `src/lib/storefront/server-state.ts`

SDK rails:

- `connect.record`
- `publicStore.publish`
- `publicStore.signPublish`
- `publicStore.publishSigned`
- `publicStore.publishWithIdentityProof`
- `publicStore.resolve`
- `appState.publish`
- `appState.publishRecord`
- `appState.createPublicStoreRecord`
- `domains.resolveTenant`
- `appState.byUrl`
- `appState.byCreator`
- `appState.byNamespace`
- `appState.byId`

Admin publish writes the public storefront projection through the SDK. The sequence is fixed:

1. Build the public store-state proof object from the merchant workspace.
2. Admit that object locally so the user/edge has the newest proof immediately.
3. If the merchant Identity Seal/Receiz Key is present, sign the canonical feed through `publicStore.signPublish()`.
4. Append the signed feed through `publicStore.publishSigned()` and keep the returned Kai pulse, append anchor id, known head, and proof bundle as the public append coordinate.
5. Treat `connect.record` as auxiliary delegated telemetry only. It can never block the signed public-store append or become merchant login authority.

Tenant cold starts recover public store projections through `publicStore.resolve`, `domains.resolveTenant`, and SDK app-state reads. The newest verified append is admitted into proof memory and becomes the local proof store for that host. Older projections can remain in history, but they cannot replace the newest append.

Implementation anchors:

- `src/lib/receiz/store-state-publication.ts` extracts the SDK-returned Kai/anchor before record construction.
- `src/lib/receiz/proof-state.ts` rejects incomplete store-state records and orders records by Kai.
- `src/lib/receiz/proof-state-store.ts` admits the completed record into SDK proof memory with `kaiUpulse`.
- `src/lib/storefront/store-api-projection.ts` rejects public-store responses without a proof-memory Kai head.

This is the Receiz-only durability path that lets the app avoid Supabase, Redis, Vercel KV, Shopify, Stripe, or a custom database for public storefront truth.

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

With `@receiz/sdk@109.0.0`, typed app-state, signed public-store publish, Twin, World, commerce runtime, artifact custody, native Record → Seal, zero-network verified extraction, same-account profile updates, cross-platform bearer ownership, causal replay, and deterministic checkpoints are exposed through the browser-safe universal runtime. Node-only compiler APIs remain at `@receiz/sdk/compiler`; deterministic emulator and conformance APIs live at `@receiz/sdk/testing`; obsolete version-specific developer exports are no longer shipped. `receiz.constitution.json` is validated at `src/lib/receiz/constitution.ts` as an app overlay chained to the canonical v109 registry digest used by MCP and every v109 AI-skill manifest. Complete artifact bytes are verified locally before payload extraction, and ownership changes preserve immutable object identity, payload, provenance root, prior history, and unknown namespaces. Existing sealed proof and verified local history stay stronger than all projections. `Publish theme` adopts the same authoritative public-store revision; browser storage remains only an offline workspace projection and cross-tab synchronization mechanism.
