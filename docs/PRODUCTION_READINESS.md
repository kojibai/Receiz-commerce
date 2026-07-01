# Production Readiness

This app has two production goals:

- Give developers a cloneable Receiz SDK commerce base that shows the correct SDK boundary.
- Give non-coders a no-code admin that can launch a real customized business with Receiz ID, checkout, rewards, domains, public-store state, and proof objects.

## Authority Rule

Receiz MCP is agent tooling. It helps agents inspect setup, runtime expectations, and conformance, but it is not the source of truth.

Production truth comes from:

- Receiz SDK/API rails.
- Receiz public-store and app-state records.
- Sealed proof objects.
- Verified local proof projections.
- Authenticated server appends.

The app follows this first-paint rule:

1. Resolve durable public store state by tenant host or URL.
2. Render the stored proof projection immediately.
3. Append verified additions in the background without replacing known truth.

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
- `pnpm release:check` reports no type, lint, build, test, or Receiz doctor failures for the target tenant.

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

### 3. Receiz Identity And Auth

Purpose: local/demo identity never masquerades as full server authorization.

Code paths:

- `app/api/auth/receiz/start/route.ts`
- `app/api/auth/receiz/callback/route.ts`
- `app/api/auth/receiz/me/route.ts`
- `src/lib/receiz/session.ts`
- `src/lib/storage/use-template-store.ts`

Required checks:

- Server actions that require Receiz access tokens return `receiz_login_required`.
- Client actions redirect to Receiz login when server authorization is missing.
- Tenant customer sessions remain scoped to the tenant host.
- Platform admin sessions are not reused as tenant customer sessions.

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

- Publish writes a Receiz store-state record.
- Public-store publish includes the latest pages, blog posts, products, collections, rewards, assets, game, checkout, and hosting state.
- Tenant reads use `no-store` and recover the latest public-store/app-state projection.
- Tenant fallback always includes system pages for `/about`, `/rewards`, and `/account` so direct URLs do not fall through to platform 404s.

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

- Tenant checkout requires tenant-scoped Receiz ID or verified Identity Seal authority.
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
- Custom-domain connect and verify require a Receiz Connect session or verified Identity Seal authority.
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

`pnpm release:check` runs tests, typecheck, lint, a guarded production build, and Receiz doctor in order.
`pnpm dev`, `pnpm start`, and `pnpm build` use `scripts/next-runtime-guard.mjs` so a local Next runtime cannot share `.next` with a release build.

For tenant-specific checks, pass the tenant host through the release gate or doctor:

```bash
RECEIZ_DOCTOR_TENANT_HOST=boost.receiz.app pnpm release:check
RECEIZ_DOCTOR_TENANT_HOST=boost.receiz.app pnpm receiz:doctor
```

## Manual Smoke Test

1. Sign in on `/admin` with Receiz ID.
2. Change brand copy, add or edit a page, and publish.
3. Open the published subdomain and verify the updated home page.
4. Open `/about`, `/rewards`, and any new page slug directly.
5. Connect a custom domain and confirm missing auth redirects into Receiz sign-in.
6. Run a checkout and verify the order appears in admin with payment rail and settlement state.
7. Refresh the subdomain in a clean browser session and verify the same published state cold-starts from Receiz.
