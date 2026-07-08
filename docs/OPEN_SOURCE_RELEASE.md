# Open-Source Release Playbook

Use this before tagging or announcing Receiz Commerce Kit.

This repo has two audiences:

- **Operators and merchants** evaluating a working Receiz.app Commerce Cloud product.
- **Developers** cloning the repo as a kernel for SDK/MCP-powered products.

The release should make both paths obvious.

## Release Positioning

Public framing:

- This is a complete working product, not a screenshot demo.
- This is also a forkable SDK kernel, not a black-box hosted app.
- Receiz proof objects are the source of truth.
- `@receiz/sdk` is the typed application boundary.
- Receiz MCP is agent tooling over the SDK/API surface.
- Connect/OIDC tokens are delegated permission artifacts, not identity proof roots.
- Kai pulse and append anchors order proof truth, not timestamps, caches, or Vercel memory.

Do not frame the repo as:

- A generic ecommerce starter.
- A Stripe/Supabase/Shopify clone.
- A blockchain-first marketplace.
- A token dashboard.
- A product that requires static access tokens for normal login.

## Required Automated Gates

Run from a clean workspace with no local Next dev/preview server using `.next`:

```bash
pnpm release:check
pnpm secret:scan
```

`pnpm release:check` runs:

- `pnpm secret:scan`
- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm receiz:doctor`

`pnpm secret:scan` checks tracked source files for common committed secret patterns and server-only env values that should not be public.

Public forks can run the doctor without static access tokens; it should report missing delegated-token rails without printing secret values. A production credentialed release should show `ok: true`, `missing: []`, and no warnings.

## Required Manual Gates

### Mobile Admin QA

Verify at 390px and 430px widths:

- Admin navigation is usable.
- Long auth, domain, DNS, and publish messages wrap.
- Brand, pages, blog, products, rewards, checkout, domains, and publish controls are reachable.
- No button text overflows or overlaps adjacent controls.
- Receiz ID create/continue/restore surfaces are usable.

### Tenant Storefront QA

Verify on a subdomain host:

- Store, Rewards, Assets, Play, and Account tabs work.
- Storefront renders saved brand, content, products, rewards, and media.
- Direct URLs for `/about`, `/rewards`, `/account`, product pages, and blog pages do not fall through to platform 404s.
- Store API returns saved tenant content with `source: "published"`, `publishedState: true`, and `proofMemory.entries > 0` after publish.
- A clean browser session cold-starts from the same public proof state.

### Platform Admin QA

Verify on `receiz.app`:

- Platform/admin state is not reused as buyer authority on tenant storefronts.
- Launch readiness describes both audiences.
- SDK rails for clone builders are visible.
- Publish failures distinguish missing proof authority from public proof-rail sync issues.

### Checkout QA

Verify:

- Customer without proof is sent to Receiz ID continue/restore.
- Customer with a verified proof object or continued Receiz ID proof can use the tenant checkout.
- Wallet-first checkout request includes card fallback metadata.
- Merchant settlement metadata points to the merchant Receiz ID or settlement recipient.
- Orders, customers, payment rail, fulfillment, and settlement projections appear in admin.
- Checkout/proof writes are not queued offline by the PWA.

### Domain QA

Verify:

- Free subdomain is saved and served.
- Custom domain can be added to Vercel when env is configured.
- Missing Vercel env returns actionable setup instructions.
- Missing DNS returns actionable DNS instructions.
- Domain connect/verify requires merchant proof authority or scoped delegated permission.

### Media QA

Verify:

- Logo, product image, and blog cover uploads render locally.
- Oversized inline `data:` URLs are not written into public store state.
- Publish uploads durable Receiz media URLs when media permission is available.
- Published subdomain/custom domain can cold-start with the saved media.

## Public Repo Hygiene

Required files:

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `SUPPORT.md`
- `CHANGELOG.md`
- `.env.example`
- `.github/workflows/ci.yml`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`

Required checks:

- `.env.local` ignored and not committed.
- `.vercel` ignored and not committed.
- No generated screenshots or artifacts contain secrets.
- Package name, description, README, and repo metadata match the public project.
- README explains the full product and the forkable SDK kernel.
- README points to `docs/DEVELOPER_KERNEL.md`, `docs/SDK_RAILS.md`, and `docs/PRODUCTION_READINESS.md`.
- `.env.example` matches README.
- No static Receiz token is documented as required for normal OIDC login.
- Receiz Twin/World content buttons are documented as gated by env/capability checks.

## SDK Rails Demonstrated

The public release should demonstrate:

- Receiz ID OIDC login and callback.
- Receiz identity artifact restore.
- Receiz tenant session scope.
- Receiz wallet projection.
- Receiz checkout session creation.
- Receiz Connect transfer for platform fees.
- Receiz Connect record for hosting/content events.
- Receiz webhook signature helpers.
- Receiz proof memory helpers.
- Receiz public proof and manifest projection helpers.
- Signed public-store publish.
- Public-store/app-state cold-start recovery.
- Media upload and durable media projection.
- Domains and tenant resolution.
- Runtime doctor/capabilities checks.
- Release check and release pin rails.
- MCP setup for agent diagnostics and SDK/API rail calls.

## Capability Flags

Receiz Twin/World content assistance is intentionally hidden on the frontend unless both are true:

- The relevant `NEXT_PUBLIC_RECEIZ_*_ENABLED` flag is enabled.
- The installed SDK exposes the matching namespace.

Default release env:

```bash
NEXT_PUBLIC_RECEIZ_TWIN_ENABLED=true
NEXT_PUBLIC_RECEIZ_WORLD_ENABLED=true
RECEIZ_ENABLE_TWIN_SCOPES=true
RECEIZ_ENABLE_WORLD_SCOPES=true
```

Set the scope flags to `false` only for older Receiz OIDC clients that do not have those scopes.

## Security Review

Before release:

- Confirm `RECEIZ_ACCESS_TOKEN`, client secrets, webhook secrets, and `VERCEL_API_TOKEN` are never exposed with `NEXT_PUBLIC_`.
- Confirm webhooks verify signatures before admitting events.
- Confirm auth, checkout, hosting, proof writes, and Twin routes are network-only.
- Confirm tenant session cookies are host-scoped.
- Confirm platform/admin identity is not reused as tenant buyer authority.
- Confirm `pnpm secret:scan` passes.

## Release Notes

For `v0.1.0`, highlight:

- Full working Receiz Commerce Cloud app.
- Forkable `@receiz/sdk` kernel.
- Receiz MCP-ready diagnostics.
- No-code merchant admin.
- Proof-sealed storefront publish and tenant recovery.
- Wallet-first checkout and merchant settlement metadata.
- Free subdomain/custom-domain product path.
- Public repo hygiene: CI, contribution templates, security, support, changelog, release playbook.

## Tagging

After all gates pass:

```bash
git status --short
git tag v0.1.0
git push origin main --tags
```

Only tag after the repository state, docs, and release checks match the public announcement.

## Post-Release

After announcement:

- Watch GitHub Actions.
- Triage issues with labels for `sdk-rail`, `proof-authority`, `docs`, `checkout`, `domains`, `security`, and `good first issue`.
- Keep `docs/SDK_RAILS.md` current with every new SDK call.
- Keep `.env.example` and README in lockstep.
- Add migration notes to `CHANGELOG.md` when SDK rails change.
