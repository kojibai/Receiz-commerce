# Receiz Commerce Kit

[![CI](https://github.com/kojibai/Receiz-commerce/actions/workflows/ci.yml/badge.svg)](https://github.com/kojibai/Receiz-commerce/actions/workflows/ci.yml)

Receiz Commerce Kit is a full working commerce product and a forkable SDK kernel for building proof-sealed applications with `@receiz/sdk` and Receiz MCP.

Current release: `3.0.0` · SDK target: `@receiz/sdk@102.0.0`

It ships as a Next.js App Router application with a public storefront, customer account area, no-code merchant admin, Receiz ID, checkout, wallet projection, rewards, Receized assets, domain hosting, media upload, proof memory, publish recovery, webhook verification, release diagnostics, and an AI operator layer built around Receiz MCP, Twin, World, and SDK doctor workflows. You can run it as the Receiz.app Commerce Cloud product, or clone it and build your own commerce, rewards, marketplace, game, content, or agent-operated SaaS on top of the same primitives.

The core verb is **seal**. Products, orders, rewards, assets, storefront state, and customer actions can carry Receiz proof instead of depending on a private app database as the final authority.

## Live Conformance

<table>
  <tr>
    <td align="center" valign="middle"><a href="https://receiz.com/powered-by"><img alt="Powered by Receiz" src="https://receiz.com/powered-by-receiz.svg" height="32" /></a></td>
    <td align="center" valign="middle"><a href="https://receiz.com/verify/conformance"><img alt="Verification conformance badge" src="https://receiz.com/api/verification/conformance/badge" height="30" /></a></td>
    <td align="center" valign="middle"><a href="https://receiz.com/economy/conformance"><img alt="Settlement conformance badge" src="https://receiz.com/api/economy/conformance/badge" height="30" /></a></td>
    <td align="center" valign="middle"><a href="https://receiz.com/identity/conformance"><img alt="Identity conformance badge" src="https://receiz.com/api/identity/conformance/badge" height="30" /></a></td>
    <td align="center" valign="middle"><a href="https://receiz.com/issuance/conformance"><img alt="Issuance conformance badge" src="https://receiz.com/api/issuance/conformance/badge" height="30" /></a></td>
    <td align="center" valign="middle"><a href="https://receiz.com/interoperability/conformance"><img alt="Interoperability conformance badge" src="https://receiz.com/api/interoperability/conformance/badge" height="30" /></a></td>
    <td align="center" valign="middle"><a href="https://receiz.com/world/conformance"><img alt="World conformance badge" src="https://receiz.com/api/world/conformance/badge" height="30" /></a></td>
  </tr>
</table>

## What This Repo Is

This repository is intentionally two things at once:

- **A working product:** a mobile-first commerce cloud where a merchant can create or restore Receiz ID, customize a storefront, add products and content, activate rewards, publish to a free `*.receiz.app` subdomain, connect a custom domain, and run Receiz checkout.
- **A developer kernel:** a production-shaped reference for using one typed SDK boundary to build identity, proof, payments, wallet, rewards, domains, media, public app state, webhooks, release checks, and agent tooling without scattering SDK calls through the UI.

The release unit is the repository, not an npm package. `package.json` remains `private: true` to prevent accidental application publishing to npm. Version 2 adds authoritative server pricing, verified Exchange listings and settlement, durable global theme publication, hardened embedded upgrade payments, and the streamed billion-unit Receiz Wilds world.

## Why It Matters

Most commerce apps become a pile of separate systems: auth provider, payments processor, wallet layer, CMS, media store, rewards service, domain automation, database, webhook verifier, audit log, customer portal, compliance exporter, release checker, and a separate set of agent tools.

This codebase demonstrates how much of that collapses into one Receiz SDK boundary:

- **Identity:** Receiz ID, Receiz Key, Identity Record, Identity Seal, OIDC, account continuation, and tenant-scoped customer sessions.
- **Proof:** object verification, artifact sealing, public proof lookup, proof memory, append recovery, Kai pulse ordering, and public-store coordinates.
- **Commerce:** embedded checkout, one-click checkout, wallet-first payments, card fallback metadata, order projection, settlement metadata, refunds, subscriptions, inventory, discounts, gift cards, access passes, fulfillment, tax, and payouts.
- **Rewards and assets:** proof-sealed benefits, Receized assets, ownership state, reward rules, claims, asset projections, and customer wallet/account surfaces.
- **Public state:** signed public-store publish, app-state records, tenant cold-start recovery, known-head sync, and no-store storefront reads.
- **Hosting:** free subdomain reservation, custom-domain verification, tenant resolution, DNS instructions, and optional Vercel domain automation.
- **Media:** durable Receiz media upload/transform paths so logos, product images, and blog covers survive cold starts.
- **Operations:** webhook signature verification, audit append, jobs, permissions, risk, compliance export, portability, notifications, release checks, and release pinning.
- **AI operator layer:** Receiz MCP, Twin, World, SDK doctor, and capability checks let tools like Codex inspect diagnostics, draft content, call allowed SDK/API rails, and operate release workflows while proof objects remain the source of truth.

The result is not a toy demo. It is a reference architecture for building a complete Receiz-native product surface from primitives that stay portable and inspectable.

## Quick Start

```bash
pnpm install
pnpm dev
```

The v102 Receiz toolchain is pinned through pnpm as `@receiz/sdk@102.0.0`, `@receiz/mcp-server@102.0.0`, and `@receiz/ai-skills@102.0.0`. The local `ai-skills/` source is aligned with the published package and can be checked with `pnpm validate:ai-skills`.

Open:

- Public storefront: `http://localhost:3000`
- Admin studio: `http://localhost:3000/admin`
- Customer account: `http://localhost:3000/account`

Run the release gate:

```bash
pnpm release:check
```

`pnpm release:check` runs the tracked-file secret scan, tests, typecheck, lint, a guarded production build, and Receiz doctor. Public forks can run doctor without static access tokens; production releases should run with configured delegated permission and show `ok: true`, `missing: []`, and no warnings.

## Product Tour

The included app gives operators a complete launch path:

- Brand, logo, colors, theme, typography, radius, button style, and storefront copy.
- Pages, navigation, blog posts, products, collections, SEO, and product media.
- Rewards, reward rules, Receized assets, proof events, and optional play loops.
- Receiz ID login, account creation, identity artifact restore, and customer account recovery.
- Wallet-first checkout with card fallback metadata and merchant settlement projection.
- Orders, buyer email, fulfillment state, settlement state, customer profiles, and host-specific merchant context.
- Free hosted subdomain, paid custom domain, hosting plan, billing method, DNS guidance, and publish checklist.
- Launch-readiness scoring for non-coders and developers cloning the SDK base.

The public storefront is mobile-first: a single `100dvh` app viewport with Store, Rewards, Assets, Play, and Account tabs. The admin studio is also touch-friendly so a merchant can launch without editing code.

## Developer Kernel

Developers should start with three files:

- `src/lib/receiz/adapter.ts` is the application SDK boundary.
- `src/lib/receiz/oauth-scopes.ts` defines the app's Receiz rail scopes.
- `docs/SDK_RAILS.md` maps each route and feature to the SDK rail it uses.

The application follows the Receiz order:

1. Verify or validate carried proof truth.
2. Project it immediately for first paint.
3. Admit it once into durable proof memory.
4. Resume from the known Kai/proof head.
5. Append later verified additions without rediscovering known truth.

Keep new Receiz calls behind the adapter. Page components should render projected proof truth and call local actions, not import internal SDK details directly.

Read the deeper developer guide:

- `docs/DEVELOPER_KERNEL.md`
- `docs/SDK_RAILS.md`
- `docs/PRODUCTION_READINESS.md`

## What You Can Build

This repo is a launchpad for:

- A branded commerce cloud for many merchants.
- A proof-sealed storefront for a single brand.
- A rewards and loyalty OS where purchases, perks, coupons, and access passes carry proof.
- A marketplace for Receized assets with ownership, transfer, and customer account projections.
- A content commerce product with pages, posts, products, SEO, proof, checkout, and public-state recovery.
- A game or engagement loop where scores, rewards, assets, and purchases become sealed business events.
- A domain-hosted SaaS where every tenant has a free subdomain, optional custom domain, and proof-backed app state.
- A customer portal with wallet, orders, rewards, assets, account restore, and tenant-specific sessions.
- An agent-operated back office where MCP tools inspect SDK readiness, diagnose scopes, replay events, check releases, and assist operators.
- An AI-operated commerce surface where agents can draft, inspect, diagnose, and invoke allowed rails while proof remains authority.
- A portable commerce kernel that avoids making Supabase, Stripe, Shopify, Redis, or Vercel memory the authority for product truth.

You can replace the UI, add modules, or deploy on a different host while keeping the same proof-first SDK boundary.

## Authority Model

The object carries the proof. A Receiz Key, Identity Record image, Identity Seal image, sealed product/order/reward object, verified append, ownership append, or settlement ledger row is the authority for the fact it carries.

`@receiz/sdk` is the typed way to verify, project, admit, publish, append, recover, and sync that truth. Receiz MCP is agent tooling over the SDK/API surface. Connect/OIDC tokens are scoped permission artifacts for remote reads and writes after proof has been established; they are not the identity proof root and do not outrank a verified proof object.

Kai-Klok is the deterministic proof-state machine. Each proof object is uniquely stamped with its Kai pulse and anchor, and that stamp is recomputable from the open-source Kai-Klok canon: https://github.com/kojibai/klok. This app must never invent a replacement ordering rule. Chronos timestamps, server response order, CDN state, browser storage, Vercel function memory, and framework cache state are not authority.

No Supabase, Stripe, Shopify, Redis, or app database is required for product truth. Local browser state in this template is demo composition only; admitted proof memory is proof truth, not a cache.

## Receiz ID

Receiz ID is the account layer. Existing Receiz IDs can continue in one click, new brands or customers can create a Receiz ID from the same flow, and users can restore the same account from a Receiz Key, Identity Record image, or Identity Seal image.

The adapter and admin UI use SDK identity helpers including:

- `identity.createReceizId`
- `identity.readArtifact`
- `identity.projectAccount`
- `identity.signLoginProof`
- `identity.verifyLoginProof`
- `identity.buildReceizIdContinueRequest`
- `identity.ensureTenantSession`

Do not send normal users out to Receiz.com as the primary login product surface. The app creates or restores a local Receiz proof object, projects it into the workspace, and uses delegated remote permission only when a remote SDK/API rail needs it.

## Publish And Recovery

Storefront publish follows the proof-first law:

1. Build the public store-state proof object from the merchant workspace.
2. Admit that object locally so the user and edge have the newest proof immediately.
3. Sign the canonical public-store feed with the merchant Identity Seal/Receiz Key when present.
4. Append through the SDK public-store rail.
5. Keep the returned Kai pulse, append anchor, known head, and proof bundle as the public append coordinate.
6. Recover tenant cold starts through public-store/app-state projections and admit only complete proof records.

After publishing, verify the public tenant projection:

```bash
curl -sS https://your-subdomain.receiz.app/api/store
```

The response should show saved brand/content, `source: "published"`, `publishedState: true`, and `proofMemory.entries` greater than `0`.

## SDK Doctor And MCP

Run the local SDK doctor before shipping or debugging auth, domain, checkout, or publish issues:

```bash
pnpm receiz:doctor
```

The script prints SDK version, requested scopes, callback URL, tenant host, missing rails, warnings, fixes, capabilities, and whether a delegated token is present. It never prints token values.

For MCP-capable agents such as Codex, add Receiz as an MCP server in the agent config:

```toml
[mcp_servers.receiz]
command = "pnpm"
args = ["exec", "receiz-mcp"]
startup_timeout_sec = 120

[mcp_servers.receiz.env]
RECEIZ_BASE_URL = "https://receiz.com"
```

The local command resolves the pnpm-pinned `@receiz/mcp-server@102.0.0`. Use the matching `@receiz/ai-skills@102.0.0` doctrine from `node_modules/@receiz/ai-skills` or the aligned local `ai-skills/` directory. MCP never becomes the authority; it only helps inspect or invoke rails beneath proof objects. In v102, MCP inspection and public resolution are not artifact verification; use SDK `verification.verifyArtifact(file)` for the integrity-and-continuity verdict.

Brand edits preview immediately in the merchant workspace. `Publish theme` uses the same signed publication transaction as `Publish changes`: success means the authoritative public-store revision was accepted and adopted by the workspace. A pending or failed publication remains visibly unresolved and is never presented as globally saved. Other open merchant tabs adopt the updated workspace through scoped storage synchronization, while storefront subdomains and custom domains continue to resolve from the published Receiz projection.

## AI Operator Layer

Receiz Commerce Kit is built for agent-operated commerce from day one.

The AI model is direct: AI is the operator; proof is the authority. Receiz MCP, Twin, World, SDK doctor, capability checks, content assistance, import normalization, and release diagnostics can help a merchant or developer draft, inspect, diagnose, and operate the commerce surface. They do not become the source of commercial truth.

AI-assisted workflows can:

- Draft launch plans, storefront pages, blog posts, products, SEO, and proof-aware product positioning.
- Normalize imported content and catalog data from supported commerce and publishing systems.
- Inspect SDK readiness, scopes, callbacks, tenant host, capabilities, and delegated-token presence.
- Diagnose publish, checkout, domain, media, and release failures through MCP and SDK doctor output.
- Invoke supported rails only when the required Receiz permission and capability gate are present.

They cannot replace Receiz ID, identity artifacts, signed public-store publish, proof memory admission, ownership receipts, settlement records, or Kai-ordered appends. Local browser state, model output, cache state, function memory, and third-party API state are projections. They are not authority.

## Environment

Copy `.env.example` and fill the values for your deployment.

Required Receiz rails:

```bash
NEXT_PUBLIC_RECEIZ_MODE=live
RECEIZ_BASE_URL=https://receiz.com
RECEIZ_CLIENT_ID=
RECEIZ_CLIENT_SECRET=
```

Required Receiz ID/OIDC callback:

```bash
NEXT_PUBLIC_AUTH_MODE=receiz_id
RECEIZ_AUTH_MODE=receiz_id
RECEIZ_ID_CALLBACK_URL=https://receiz.app/api/auth/receiz/callback
NEXT_PUBLIC_SITE_URL=https://receiz.app
```

Enable live checkout:

```bash
NEXT_PUBLIC_CHECKOUT_MODE=receiz
RECEIZ_CHECKOUT_MODE=receiz
```

Hosted commerce settings:

```bash
NEXT_PUBLIC_HOSTING_MODE=receiz_hosted
NEXT_PUBLIC_DEFAULT_SUBDOMAIN=boost.receiz.app
RECEIZ_ACCOUNT_STATE_MODE=receiz
```

Optional webhook secrets:

```bash
RECEIZ_WEBHOOK_SECRET=
RECEIZ_CHECKOUT_WEBHOOK_SECRET=
RECEIZ_PROOF_WEBHOOK_SECRET=
RECEIZ_HOSTING_WEBHOOK_SECRET=
```

Optional Vercel/domain automation:

```bash
VERCEL_TEAM_ID=
VERCEL_TEAM_SLUG=
VERCEL_PROJECT_ID=
VERCEL_API_TOKEN=
RECEIZ_CUSTOM_DOMAIN_CNAME_TARGET=custom.receiz.app
VERCEL_CNAME_TARGET=cname.vercel-dns-0.com
VERCEL_APEX_A_RECORD=76.76.21.21
```

Platform fee settlement:

```bash
RECEIZ_PLATFORM_BILLING_MODE=sandbox
RECEIZ_PLATFORM_ACCOUNT_ID=
RECEIZ_PRO_PLAN_USD=49.00
RECEIZ_SCALE_PLAN_USD=199.00
RECEIZ_CUSTOM_DOMAIN_SETUP_USD=0.00
```

Optional merchant settlement fallback for demo checkout:

```bash
RECEIZ_DEFAULT_MERCHANT_RECEIZ_ID=
RECEIZ_DEFAULT_SETTLEMENT_USER_ID=
```

Receiz Twin/World content assistance:

```bash
NEXT_PUBLIC_RECEIZ_TWIN_ENABLED=true
NEXT_PUBLIC_RECEIZ_WORLD_ENABLED=true
RECEIZ_ENABLE_TWIN_SCOPES=true
RECEIZ_ENABLE_WORLD_SCOPES=true
```

If you are testing against an older Receiz OIDC client, set `RECEIZ_ENABLE_TWIN_SCOPES=false` or `RECEIZ_ENABLE_WORLD_SCOPES=false` before login so Receiz does not reject the authorization request with `invalid_scope`.

Never expose access tokens, webhook secrets, client secrets, or `VERCEL_API_TOKEN` with a `NEXT_PUBLIC_` prefix.

## Vercel Launch

Recommended Vercel settings:

- Framework preset: `Next.js`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: default
- Node.js: `20.x` or newer

For free subdomains:

1. Add `receiz.app` to the Vercel project.
2. Add `*.receiz.app` to the Vercel project.
3. Point wildcard DNS `*.receiz.app` to `cname.vercel-dns-0.com`.
4. Set `VERCEL_API_TOKEN` and `VERCEL_PROJECT_ID` so `/api/hosting` can add and verify custom domains.

The app routes tenant hosts through `middleware.ts`. A request to `boost.receiz.app` is served by the same deployment with `tenant=boost`; a verified custom domain is served by the same deployment with `domain=thebrand.com`.

## Release Standard

Before tagging or announcing the repo:

```bash
pnpm release:check
pnpm secret:scan
```

Then complete the manual release gates in `docs/OPEN_SOURCE_RELEASE.md`:

- Mobile admin visual QA at 390px and 430px.
- Tenant storefront QA on a subdomain host.
- Platform admin QA on `receiz.app`.
- Checkout QA for customer proof, wallet-first funding, card fallback metadata, merchant settlement, and admin projections.
- Domain QA for free subdomain, custom domain, missing DNS instructions, and published `/api/store` recovery.
- Docs QA for `.env.example`, README, SDK rails, MCP setup, and no static token requirement.

## Repository Map

- `app/` - Next.js App Router pages and route handlers.
- `src/features/admin/` - no-code merchant admin studio.
- `src/features/storefront/` - public storefront, cart, account, rewards, assets, and play views.
- `src/lib/receiz/` - SDK adapter, scopes, sessions, proof state, publish, media, and Receiz rails.
- `src/lib/checkout/` - checkout request, wallet authority, customer purchase, and commerce events.
- `src/lib/hosting/` - subdomain, custom-domain, tenant state, DNS, Vercel, and billing helpers.
- `src/lib/launch/` - launch-readiness scoring for operators and clone builders.
- `tests/` - Node test runner coverage for rails, checkout, publish, tenancy, PWA, domains, and release guard.
- `scripts/` - release check, SDK doctor, secret scan, PWA icon generation, and Next runtime guard.
- `docs/` - SDK rail map, developer kernel guide, production readiness, and open-source release checklist.

## Design References

Implementation targets are stored in `docs/design-references/`:

- `proof-commerce-desktop-storefront.png`
- `proof-commerce-mobile-storefront.png`
- `proof-commerce-admin-studio.png`

The generated admin reference contains a typo in its event rail. The implementation intentionally renders the corrected text: `Seal events`.

## Contributing

Read `CONTRIBUTING.md` before opening a pull request. Public contributions should explain which Receiz rails changed, how proof authority is preserved, and what verification ran.

## Security

Read `SECURITY.md` for vulnerability reporting, secret handling, and tenant-isolation requirements.

## License

MIT. See `LICENSE`.
