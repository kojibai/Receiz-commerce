# Receiz Commerce Kit v2.0.0

Release date: July 13, 2026

Status: Repository release

Release unit: Repository release, not an npm package

SDK target: `@receiz/sdk@100.0.0`

## v2 Release Statement

Receiz Commerce Kit 2.0.0 is the Commerce OS release. It turns the strongest v1 product paths into authoritative end-to-end systems: global theme publication, tenant-scoped checkout, wallet-plus-card settlement, merchant-to-platform upgrades, verified Exchange assets and trades, proof-backed state recovery, and a larger, persistent Receiz Wilds experience.

Economic inputs are now derived on the server from published proof state. Checkout clients submit product identities and quantities, Exchange sellers submit a verifiable artifact, and platform upgrades submit an operation intent; the server resolves price, ownership, merchant, recipient, tenant, and settlement. Wallet funds are applied first and an embedded card flow funds only the remainder. Paid state activates only after a matching receipt and successful wallet transfer.

The complete experience remains on `receiz.app`, a merchant subdomain, or a custom domain. Payment, proof verification, account continuation, Exchange listing, and domain upgrade flows do not require redirecting users to `receiz.com`.

Receiz Wilds now uses drag-and-hold trackpad controls, deterministic encounters and progression, persisted game state, a compact mobile HUD, stable rendering, streamed terrain, floating-origin coordinates, and a one-billion-unit logical world.

Security work in this release hardens OAuth state binding, webhook replay and intent validation, SSRF-resistant imports, verified media and proof uploads, tenant resolution, idempotency, and remote mutation authorization. See `docs/MIGRATING_TO_V2.md` for required configuration and behavior changes and `docs/audits/2026-07-13-v2-release-evidence.md` for verified gates and remaining production operator checks.

---

# Receiz Commerce Kit v1.0.0

Release date: July 9, 2026  
Status: General Availability  
Release unit: Repository release, not an npm package  
SDK target: `@receiz/sdk@98.0.0`

## Executive Release Statement

Today we are releasing Receiz Commerce Kit v1.0.0, the first official release of a complete Receiz-native commerce application and a forkable SDK kernel for building proof-sealed products.

This release is not a starter screen, a static demo, or a collection of disconnected examples. It is a working product surface with a public storefront, customer account, no-code merchant admin, checkout, wallet projection, rewards, assets, exchange, content, game, hosting, domains, publish, media, recovery, diagnostics, release gates, and an AI operator layer. Under that product is the deeper release: one typed Receiz SDK boundary that demonstrates how identity, proof, commerce, public state, operations, and AI-assisted operator workflows can be built around proof objects instead of private application tables as the final authority.

v1.0.0 establishes the standard for Receiz-native application development: proof first, SDK bounded, tenant scoped, recovery aware, and operationally shippable.

## What Is Shipping

Receiz Commerce Kit v1.0.0 ships as two things at once.

First, it is a working Receiz Commerce Cloud product path. A merchant can create or restore Receiz ID, shape a storefront, add products and content, configure rewards, publish to a hosted subdomain, connect a custom domain, run checkout, project orders and customers, and keep proof events visible through the operator surface.

Second, it is a developer kernel. A builder can fork the repository and see where every Receiz rail belongs, how proof state is admitted and recovered, how checkout and settlement are represented, how tenant storefronts cold-start, and how SDK/MCP-ready diagnostics and AI operator workflows should be packaged for production work.

The result is a release that can be used by merchants at the edge and studied by developers at the core.

## Why This Matters

Modern commerce products usually become a stack of unrelated authority systems: identity provider, payment processor, wallet service, product database, CMS, reward engine, media store, domain automation, webhook verifier, audit log, customer portal, and agent tooling.

Receiz Commerce Kit v1.0.0 shows the alternative. The object carries proof. The SDK verifies, projects, admits, appends, publishes, recovers, and diagnoses that proof. The UI renders projections, but it does not become the source of truth. Connect and OIDC tokens authorize scoped remote work, but they do not outrank the proof object. Kai coordinates order proof truth; timestamps, caches, local browser state, and third-party tables do not.

The AI position is just as explicit. AI is the operator; proof is the authority. Receiz MCP, Twin, World, SDK doctor, capability checks, and release diagnostics can help a merchant or developer inspect, draft, diagnose, and operate the commerce surface. They cannot replace signed publish records, verified identity artifacts, settlement rows, ownership appends, proof memory, or Kai-ordered proof truth.

That is the institutional core of this release: a complete commerce application whose product surface is practical, but whose authority model is portable.

## Product Surface

v1.0.0 includes a production-shaped Next.js App Router application with:

- Public storefront with Store, Exchange, Rewards, Assets, Play, and Account mobile views.
- Tenant storefront routing for `*.receiz.app` subdomains and custom domains.
- No-code merchant admin for brand, theme, pages, blog posts, products, collections, rewards, checkout, domains, hosting, billing, launch readiness, and publish.
- Customer account area with store-scoped Receiz ID, rewards, orders, assets, wallet/checkout state, shipping profile, and proof history.
- Product catalog, product detail overlay, cart, one-click checkout entry, and cart quantity controls.
- Rewards rules, reward claiming, Receized assets, and proof event timelines.
- Proof Exchange surface for listing assets, fractional share modeling, wallet-first trade previews, liquidity appends, order books, charts, and Kai-stamped append events.
- Receiz Wilds play module with a 3D creature-card reward loop, missions, training, merchant reward cards, and proof-event completion.
- Blog, page, and SEO content paths for commerce and content commerce use cases.
- AI operator layer with Receiz MCP diagnostics, Twin/World gated assist surfaces, capability-aware drafting, import normalization, and release workflow support.
- Offline page and PWA policy that keeps auth, checkout, hosting, proof writes, Twin routes, and webhook paths network-only.

## Merchant Launch Path

The merchant path is designed for a non-coder to launch without editing source code.

v1.0.0 supports:

- Receiz ID create, continue, and restore flows.
- Receiz Key, Identity Record, and Identity Seal artifact handling.
- Local Identity Seal image export with Receiz identity artifact trailer support.
- Platform profile hydration from Receiz Connect.
- Fresh merchant workspace creation when a connected Receiz profile does not match the current template workspace.
- Brand, color, typography, logo, storefront copy, pages, posts, products, collections, rewards, and homepage mode setup.
- Twin-assisted business launch, storefront content, SEO, and product drafting from merchant context, with local fallback when delegated rails are unavailable.
- Import from Shopify, WordPress, WooCommerce, Wix/generic HTML, CSV, and JSON sources.
- Launch readiness scoring for both no-code merchants and developer clones.
- Free hosted subdomain claim.
- Custom-domain connect and verify.
- Paid plan and platform billing flow through wallet-first Receiz settlement when live billing is enabled.
- Publish flow that requires proof authority and reports clear recovery or rail-sync status.

## Developer Kernel

The developer kernel is centered on `src/lib/receiz/adapter.ts`. New Receiz work enters through this boundary or a narrow helper under `src/lib/receiz/`, not through scattered component imports.

The adapter exposes the release's SDK surface:

- Identity: authorize URL, token exchange, userinfo, Receiz ID creation, artifact restore, account projection, login proof sign/verify, continue requests, tenant sessions.
- Proof: artifact verify/seal, public proof observe/read, proof register, proof memory, known-head additions query.
- Public state: public-store publish, signed identity-proof publish, restore latest, resolve, app-state reads, tenant resolution.
- Commerce: one-click checkout, refunds, subscriptions, inventory, shipping, tax, discounts, gift cards, access passes, fulfillment, payouts.
- Checkout and wallet: wallet lookup, checkout sessions, wallet transfers, card fallback metadata, action ledger.
- Customers and merchants: tenant customer sessions, portal, orders, rewards, assets, merchant onboarding, profile, capabilities.
- Hosting and media: media upload/transform, subdomain reservation, custom-domain verification, domain status.
- Operations: events, jobs, permissions, audit, risk, compliance export, portability, search, notifications, release check, release pin.
- AI operator and content surfaces: Receiz MCP, Twin, World, webhooks, manifests, public ledger, SDK doctor, capabilities, and release workflows.

This is the rail map for builders who want to fork the repo into commerce clouds, single-brand storefronts, marketplaces, rewards systems, content commerce products, games, or agent-operated SaaS.

## AI Operator Layer

v1.0.0 treats AI as a first-class operator layer, not as a replacement authority system.

Receiz Commerce Kit exposes agent-operated commerce through Receiz MCP, Twin, World, SDK doctor, capability checks, content assistance, import normalization, release diagnostics, and rail-aware workflows. The governing rule is simple: AI is the operator; proof is the authority.

AI-assisted surfaces can:

- Draft a business launch plan from merchant context.
- Fill storefront pages, blog posts, products, SEO metadata, and proof-aware product positioning.
- Normalize imported catalog and content data from Shopify, WordPress, WooCommerce, Wix/generic HTML, CSV, and JSON sources.
- Inspect SDK readiness, configured scopes, callbacks, tenant host, capabilities, and delegated-token presence without printing secrets.
- Diagnose publish, checkout, domain, media, and release-gate failures through Receiz MCP and SDK doctor outputs.
- Help an operator move from setup to launch while keeping each action tied to an explicit Receiz rail.

AI-assisted surfaces cannot:

- Replace Receiz ID, Receiz Key, Identity Record, or Identity Seal authority.
- Invent proof truth outside a verified proof object, append, ownership append, settlement ledger row, or signed public-store publish.
- Override proof memory admission, public-store recovery, app-state recovery, or Kai pulse ordering.
- Treat local browser state, cache state, function memory, model output, or third-party API state as commerce authority.
- Perform remote work without the required scoped Receiz permission and capability gate.

That boundary is the product. Receiz makes AI useful inside commerce without making AI the source of commercial truth. Agents can operate the surface, but they cannot become the ledger.

## Proof Authority Model

The core product law for v1.0.0 is simple: proof objects are authority.

The release uses:

- Receiz ID and identity artifacts as account authority.
- Local proof objects and delegated permission as explicit, separate authorization paths.
- Store-state records as published proof objects.
- Signed public-store publish when an Identity Seal key file is available.
- Public-store and app-state reads for tenant cold-start recovery.
- Proof memory admission before remote publish sync is attempted.
- Commerce event records for checkout, settlement, fulfillment, refunds, and webhook admission.
- Kai pulse, append anchor, known head, and proof bundle coordinates as the ordering surface.

Local browser storage, Vercel function memory, app cache, response arrival order, and demo state are projections. They are never framed as product truth.

## Publish And Recovery

The v1.0.0 publish path is intentionally strict.

1. Build a complete public store-state proof object from the merchant workspace.
2. Admit that record into proof memory before remote sync.
3. Upload inline media to Receiz media when delegated media permission is available.
4. Sign public-store publish through identity proof when a key file is present.
5. Append through the Receiz public-store rail.
6. Keep the returned public append coordinates.
7. Recover tenant cold starts through public-store restore, public-store resolve, domain tenant resolution, app-state by URL, and action ledger recovery.

Tenant storefronts use no-store reads for `/api/store`, reject untrusted public projections, and include required system pages so direct routes such as `/about`, `/rewards`, `/exchange`, and `/account` do not collapse into platform fallback behavior.

## Checkout, Wallet, And Settlement

v1.0.0 ships a wallet-first checkout model.

The checkout route:

- Requires tenant-scoped Receiz access for live checkout.
- Computes wallet funding first.
- Opens card checkout only for the remaining delta.
- Sends merchant settlement metadata.
- Records checkout, card-required, settled, fulfilled, failed, and refunded commerce events.
- Projects orders, customers, payment rail, settlement state, shipping, and fulfillment back into admin and account surfaces.
- Keeps checkout and proof writes out of the service worker cache path.

The account and admin experiences expose wallet applied, card delta, payment rail, settlement status, shipping state, and fulfillment readiness instead of hiding those facts behind a generic order status.

## Hosting, Domains, And Billing

The hosted commerce path includes:

- Free `*.receiz.app` subdomain claim.
- Wildcard domain support.
- Custom-domain connect and verify.
- DNS instruction generation for CNAME and apex A record setups.
- Vercel domain automation when env is configured.
- Actionable fallback when Vercel env is missing.
- Platform plan selection for starter, pro, and scale tiers.
- Wallet-first platform billing for plan or custom-domain fees when live billing is enabled.
- Hosting and domain events recorded through Receiz Connect when permission is available.

Custom domains and publish actions require merchant proof authority or scoped delegated permission. Missing proof authority is reported as a product state, not hidden behind a generic failure.

## Media, Content, And Import

v1.0.0 treats storefront media as release-critical.

The app validates and compresses local image uploads, protects publish request body size, strips oversized inline media when needed, uploads durable media through Receiz media rails, and attaches media proof references for logo, product, blog, and SEO image paths.

The content system includes:

- Page builder.
- Blog builder.
- Product and collection builder.
- SEO metadata.
- Twin-assisted page, blog, product, SEO, and launch drafts behind explicit capability gates.
- Local preview fallback when Twin/World delegated rails are not available.
- Importers for Shopify, WordPress, WooCommerce, Wix/generic HTML, CSV, and JSON.
- Receiz Connect recording of content import summaries when permission is available.

## Exchange, Assets, And Play

v1.0.0 goes beyond catalog commerce.

The release includes proof-object asset flows, manifest projection, proof-object upload verification, asset listing, exchange projections, fractional share modeling, wallet-first trade previews, liquidity appends, and proof event generation for asset, trade, and liquidity activity.

The Play surface demonstrates how a business can map engagement into proof-sealed rewards. Receiz Wilds is a 3D reward loop with discoverable cards, training, missions, beans, streaks, portable merchant reward cards, and game-completion proof events.

These modules are included to show that the same Receiz primitives can support rewards, marketplaces, game loops, asset surfaces, and customer engagement products without changing the authority model.

## Security And Operational Posture

v1.0.0 includes the release hygiene expected of a serious public repository:

- CI workflow.
- Issue templates.
- Pull request template.
- MIT license.
- Code of conduct.
- Contributing guide.
- Security guide.
- Support guide.
- Open-source release playbook.
- SDK rail map.
- Developer kernel guide.
- Production readiness guide.
- Tracked-file secret scan.
- Guarded Next runtime for build/release checks.
- SDK doctor and capability report.
- AI operator boundaries for MCP, Twin, World, diagnostics, and proof authority.
- Webhook signature verification.
- Host-scoped tenant sessions.
- Network-only sensitive PWA paths.

Secrets such as access tokens, client secrets, webhook secrets, API tokens, and Vercel tokens are server-only. The release documentation explicitly avoids presenting static access tokens as the normal login path.

## Release Validation

The official automated gate for v1.0.0 is:

```bash
pnpm release:check
```

That gate runs:

- `pnpm secret:scan`
- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm receiz:doctor`

Public forks can run the doctor without static access tokens. Production releases should run with configured delegated permission and expect `ok: true`, an empty `missing` list, and no warnings.

Manual release gates remain required for tagged production release:

- Mobile admin QA at 390px and 430px.
- Tenant storefront QA on a hosted subdomain.
- Platform admin QA on `receiz.app`.
- Checkout QA for Receiz ID, wallet-first funding, card fallback, merchant settlement, fulfillment, and admin projection.
- Domain QA for free subdomain, custom domain, missing DNS instructions, and published `/api/store` recovery.
- Media QA for durable logo, product, blog, and SEO image paths.
- Docs QA for README, `.env.example`, SDK rails, MCP setup, and release material.

## Requirements

Runtime and dependency requirements:

- Node.js `>=20.18.0`
- pnpm `10.29.1`
- Next.js `15`
- React `19`
- `@receiz/sdk@98.0.0`

Core live Receiz env:

```bash
NEXT_PUBLIC_RECEIZ_MODE=live
RECEIZ_BASE_URL=https://receiz.com
RECEIZ_CLIENT_ID=
RECEIZ_CLIENT_SECRET=
NEXT_PUBLIC_AUTH_MODE=receiz_id
RECEIZ_AUTH_MODE=receiz_id
RECEIZ_ID_CALLBACK_URL=https://receiz.app/api/auth/receiz/callback
NEXT_PUBLIC_SITE_URL=https://receiz.app
NEXT_PUBLIC_CHECKOUT_MODE=receiz
RECEIZ_CHECKOUT_MODE=receiz
```

Optional production rails include webhook secrets, Vercel domain automation, hosted commerce settings, platform billing settings, merchant settlement fallback, Twin/World flags, and media permissions.

## Upgrade From 0.1.0

v0.1.0 was the public release candidate. v1.0.0 is the official general availability release.

Recommended upgrade steps:

1. Pull the v1.0.0 repository state.
2. Review `.env.example` against the target deployment.
3. Confirm Receiz OIDC callback and scopes.
4. Configure checkout mode, hosted commerce mode, and default tenant host.
5. Configure optional webhook, Vercel, media, Twin/World, and platform billing env as needed.
6. Run `pnpm release:check`.
7. Complete the manual release gates.
8. Tag `v1.0.0` only after automated and manual gates are complete.

The package remains `private: true`; this is a repository release, not an npm publish.

## Known Boundaries

- Public forks can run without delegated tokens, but live checkout, media upload, public-store sync, domain operations, Twin/World, and release rails require proper Receiz permission.
- Vercel domain automation is optional and returns actionable setup instructions when env is missing.
- Twin/World buttons are capability and env gated.
- AI operator surfaces are assistive. They can draft, inspect, diagnose, and invoke allowed rails, but they do not become proof authority.
- Local browser storage is demo composition and session projection. It is not product authority.
- Full production confidence requires both automated release gates and manual tenant/domain/checkout/media QA.

## Public Announcement Copy

Receiz Commerce Kit v1.0.0 is now generally available.

This is the first official release of the Receiz proof-sealed commerce application and forkable SDK kernel. It ships a full commerce cloud product surface with storefront, admin, account, checkout, wallet-first settlement, rewards, assets, exchange, play, domains, media, publish, recovery, diagnostics, and release gates.

The important part is the architecture. Products, orders, rewards, assets, customer actions, and storefront state are modeled around Receiz proof objects. `@receiz/sdk` is the typed boundary for identity, proof, checkout, wallet, public store, app state, domains, media, operations, and release rails. Receiz MCP is the agent layer over those rails. Twin and World assist launch, content, and operator workflows. Tokens authorize scoped work, but proof remains the root.

The AI model is direct: AI is the operator; proof is the authority. Agents can draft, inspect, diagnose, and operate supported rails. They cannot replace verified identity artifacts, signed publish records, ownership receipts, settlement records, or Kai-ordered appends.

v1.0.0 is for operators who need a real hosted storefront and for developers who want a production-shaped Receiz-native base for commerce, rewards, marketplaces, content, games, and agent-operated SaaS.

## GitHub Release Summary

Receiz Commerce Kit v1.0.0 is the first official general availability release of the proof-sealed commerce product and SDK kernel.

Highlights:

- Complete Next.js commerce product: storefront, account, admin, checkout, rewards, assets, exchange, play, domains, media, publish, and launch readiness.
- Forkable `@receiz/sdk@98.0.0` kernel with one application adapter for identity, proof, checkout, wallet, public state, hosting, operations, and release rails.
- Receiz ID create/continue/restore, Identity Seal export, local proof authority, and scoped tenant customer sessions.
- Signed public-store publish, proof memory admission, app-state/public-store recovery, and no-store tenant reads.
- Wallet-first checkout, card fallback metadata, merchant settlement routing, shipping, fulfillment, commerce events, and webhook admission.
- Durable Receiz media upload paths and media proof references for published storefront assets.
- Free hosted subdomains, custom-domain verification, DNS guidance, Vercel automation, and platform billing rails.
- AI operator layer: Receiz MCP diagnostics, Twin/World-assisted launch/content drafting, capability gates, import normalization, SDK doctor workflows, and proof-authority boundaries.
- Importers, blog/page/product builders, and 3D Receiz Wilds reward loop.
- Release hygiene: CI, secret scan, guarded Next runtime, tests, typecheck, lint, build, SDK doctor, release playbook, security, support, and contribution docs.

Run:

```bash
pnpm install
pnpm dev
pnpm release:check
```

## Tagging Guidance

After automated and manual gates pass:

```bash
git tag v1.0.0
git push origin main --tags
```

Only tag after the repository state, environment, docs, tenant QA, checkout QA, domain QA, media QA, SDK doctor output, and release gates match the v1.0.0 standard.
