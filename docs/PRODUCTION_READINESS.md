# Production Readiness

This app has two production goals:

- Give developers a cloneable Receiz SDK commerce base that shows the correct SDK boundary.
- Give non-coders a no-code admin that can launch a real customized business with Receiz ID, checkout, rewards, domains, public-store state, and proof objects.

## Authority Rule

Receiz MCP, Twin, World, SDK doctor, and capability checks form the AI operator layer. They help agents inspect setup, draft launch/content inputs, diagnose runtime expectations, and check conformance, but they are not the source of truth.

The production rule is direct: AI is the operator; proof is the authority.

Production truth comes from:

- Sealed proof objects.
- Identity artifacts: Receiz Key, Identity Record, and Identity Seal.
- Verified local proof projections admitted into proof memory.
- Verified appends, ownership appends, and settlement ledger rows.
- Receiz public-store and app-state projections that carry complete proof objects.
- Receiz SDK/API rails that verify, project, publish, or append that truth.

Connect/OIDC tokens are delegated permission artifacts for remote SDK/API reads and writes after proof has been established. They are not the proof root. A verified proof object is enough authority for the account, wallet, checkout, publish, billing, and domain actions this app can perform locally or route into the correct remote rail.

Kai-Klok is the deterministic state machine for proof coordinates. Every published storefront state must be stamped by a Receiz append/proof response with Kai pulse and anchor. The app must not derive store authority from Chronos timestamps, caches, response order, local browser storage, Vercel memory, Supabase, Stripe, Shopify, or any outside system.

The app follows this first-paint rule:

1. Resolve durable public store state by tenant host or URL.
2. Accept only complete store-state proof objects carrying Kai and anchor.
3. Render the stored proof projection immediately.
4. Append verified additions after the known Kai/proof head without replacing known truth.

## 100/100 Gates

### 1. SDK Clone Boundary

Purpose: developers should fork this repo and know where every Receiz SDK call belongs.

Code paths:

- `src/lib/receiz/adapter.ts`
- `src/lib/receiz/oauth-scopes.ts`
- `docs/SDK_RAILS.md`
- `scripts/receiz-doctor.mjs`

Required checks:

- `@receiz/sdk` stays the only SDK boundary.
- OIDC scopes include public-store, app-state, wallet, payments, domains, media, Twin/World, record, seal, and verify rails.
- New Receiz calls are added through the adapter, not scattered across components.
- `pnpm release:check` reports no secret scan, type, lint, build, or test failures, and prints Receiz doctor output for the target tenant.

### 2. No-Code Merchant Setup

Purpose: a non-coder can launch by clicking through admin, not editing code.

Code paths:

- `src/features/admin/AdminStudio.tsx`
- `src/features/admin/LaunchReadinessPanel.tsx`
- `src/lib/launch/readiness.ts`
- `src/lib/storage/use-template-store.ts`

Required checks:

- Brand, pages, products, rewards, checkout, domains, Receiz ID, and publish are visible in admin.
- The launch-readiness panel shows blockers before publish.
- The same readiness model supports both no-code merchants and developer clones.
- Long domain/auth/DNS messages wrap inside the UI on mobile and desktop.

### 3. Receiz Identity And Proof Authority

Purpose: identity proof objects, not app sessions, define account authority.

Code paths:

- `app/api/auth/receiz/start/route.ts`
- `app/api/auth/receiz/callback/route.ts`
- `app/api/auth/receiz/me/route.ts`
- `src/lib/receiz/session.ts`
- `src/lib/storage/use-template-store.ts`

Required checks:

- Verified Receiz Key, Identity Record, or Identity Seal projections are accepted as account authority.
- Remote-only SDK calls that require delegated Connect permission return `receiz_authority_required` only when no verified proof path can authorize the action.
- Tenant customer sessions remain scoped to the tenant host.
- Platform admin state is not reused as tenant buyer authority.

### 4. Publish And Tenant Recovery

Purpose: subdomains and custom domains show the latest published merchant edits.

Code paths:

- `app/api/store/route.ts`
- `app/api/hosting/route.ts`
- `src/lib/receiz/store-state-publication.ts`
- `src/lib/receiz/store-state-ledger.ts`
- `src/lib/storefront/server-state.ts`
- `src/lib/hosting/tenant-state.ts`

Required checks:

- Publish admits the verified local store-state proof object first, then appends the signed public-store feed through Receiz SDK rails.
- Signed public-store publish requires the returned Kai pulse, anchor id, known head, and proof bundle from the append result.
- Public-store publish includes the latest pages, blog posts, products, collections, rewards, assets, game, checkout, and hosting state.
- Public-store idempotency is based on the store-state record id and host.
- Tenant reads use `no-store` and recover the latest public-store/app-state projection from the public proof rail.
- Client/server projection selection must prefer the newest verified append and must not let Vercel memory, browser cache, or stale framework state outrank proof truth.
- Tenant fallback always includes system pages for `/about`, `/rewards`, and `/account` so direct URLs do not fall through to platform 404s.
- Tests `store-state-publication.test.ts`, `proof-state.test.ts`, `proof-state-store.test.ts`, and `store-api-projection.test.ts` must pass before release.

### 5. Media Durability

Purpose: uploaded merchant images survive cold starts on subdomains and custom domains.

Code paths:

- `src/lib/media/image-upload.ts`
- `src/lib/receiz/media-publication.ts`
- `src/lib/receiz/store-state-publication.ts`

Required checks:

- Oversized inline `data:` URLs are not written into public store state.
- Publish uploads merchant logo/product/blog images through `receiz.media.upload()`.
- Published state stores durable Receiz media URLs.

### 6. Checkout, Wallet, And Settlement

Purpose: customer purchases route through Receiz rails and merchant settlement metadata.

Code paths:

- `app/api/checkout/route.ts`
- `src/lib/checkout/mock-checkout.ts`
- `src/lib/receiz/proof-state.ts`
- `src/features/admin/AdminStudio.tsx`

Required checks:

- Tenant checkout requires customer proof for that store: verified identity proof object, continued Receiz ID proof, or scoped delegated permission.
- Wallet-first checkout can fall back to card delta.
- Orders, customers, fulfillment, payment rail, and settlement state project into admin.
- Checkout/proof writes are never queued offline by the PWA.

### 7. Domains And Hosting

Purpose: free subdomains work for every store, and custom domains have a paid production path.

Code paths:

- `app/api/hosting/route.ts`
- `src/features/admin/HostingDomainsPanel.tsx`
- `src/lib/hosting/domain-utils.ts`
- `src/lib/hosting/vercel-domains.ts`

Required checks:

- Subdomain claim normalizes and reserves only valid `*.receiz.app` hosts.
- Custom-domain connect and verify require merchant proof authority: verified identity proof object, continued Receiz ID proof, or scoped delegated permission.
- Missing Vercel configuration returns actionable DNS/env messages.
- Domain messages wrap in the admin UI.

### 8. Security And Operations

Purpose: production rails are observable and secrets stay server-only.

Code paths:

- `middleware.ts`
- `app/api/receiz/webhook/route.ts`
- `src/lib/pwa/cache-policy.ts`
- `src/lib/receiz/session.ts`
- `README.md`

Required checks:

- `RECEIZ_ACCESS_TOKEN`, client secrets, webhook secrets, and `VERCEL_API_TOKEN` are never exposed with `NEXT_PUBLIC_`.
- Webhooks verify signatures before admitting events.
- Auth, checkout, hosting, proof writes, and Twin routes are network-only.
- Store API responses use no-store cache headers for freshness.

## Release Commands

Run this before shipping:

```bash
pnpm release:check
```

`pnpm release:check` runs the tracked-file secret scan, tests, typecheck, lint, a guarded production build, and Receiz doctor in order.
Public forks can run doctor without static access tokens; in that mode the doctor should report missing delegated-token rails without printing secret values. A production release with configured delegated permission should show `ok: true`, `missing: []`, and no warnings.
`pnpm dev`, `pnpm start`, and `pnpm build` use `scripts/next-runtime-guard.mjs` so a local Next runtime cannot share `.next` with a release build.

For tenant-specific checks, pass the tenant host through the release gate or doctor:

```bash
RECEIZ_DOCTOR_TENANT_HOST=boost.receiz.app pnpm release:check
RECEIZ_DOCTOR_TENANT_HOST=boost.receiz.app pnpm receiz:doctor
```

## Manual Smoke Test

1. Present a verified Receiz proof object or continue with Receiz ID proof on `/admin`.
2. Change brand copy, add or edit a page, and publish.
3. Open the published subdomain and verify the updated home page.
4. Open `/about`, `/rewards`, and any new page slug directly.
5. Connect a custom domain and confirm missing proof/delegated permission shows the Receiz proof-object/continue prompt.
6. Run a checkout and verify the order appears in admin with payment rail and settlement state.
7. Refresh the subdomain in a clean browser session and verify the same published state cold-starts from Receiz.
