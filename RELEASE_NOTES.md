# Receiz Commerce Kit v1.0.0

Release date: July 9, 2026  
Status: General Availability  
Release unit: Repository release, not an npm package  
SDK target: `@receiz/sdk@98.0.0`

## Executive Release Statement

Today we are releasing Receiz Commerce Kit v1.0.0, the first official release of a complete Receiz-native commerce application and a forkable SDK kernel for building proof-sealed products.

This release is not a starter screen, a static demo, or a collection of disconnected examples. It is a working product surface with a public storefront, customer account, no-code merchant admin, checkout, wallet projection, rewards, assets, exchange, content, game, hosting, domains, publish, media, recovery, diagnostics, and release gates. Under that product is the deeper release: one typed Receiz SDK boundary that demonstrates how identity, proof, commerce, public state, operations, and agent tooling can be built around proof objects instead of private application tables as the final authority.

v1.0.0 establishes the standard for Receiz-native application development: proof first, SDK bounded, tenant scoped, recovery aware, and operationally shippable.

## What Is Shipping

Receiz Commerce Kit v1.0.0 ships as two things at once.

First, it is a working Receiz Commerce Cloud product path. A merchant can create or restore Receiz ID, shape a storefront, add products and content, configure rewards, publish to a hosted subdomain, connect a custom domain, run checkout, project orders and customers, and keep proof events visible through the operator surface.

Second, it is a developer kernel. A builder can fork the repository and see where every Receiz rail belongs, how proof state is admitted and recovered, how checkout and settlement are represented, how tenant storefronts cold-start, and how SDK/MCP-ready diagnostics should be packaged for production work.

The result is a release that can be used by merchants at the edge and studied by developers at the core.

## Why This Matters

Modern commerce products usually become a stack of unrelated authority systems: identity provider, payment processor, wallet service, product database, CMS, reward engine, media store, domain automation, webhook verifier, audit log, customer portal, and agent tooling.

Receiz Commerce Kit v1.0.0 shows the alternative. The object carries proof. The SDK verifies, projects, admits, appends, publishes, recovers, and diagnoses that proof. The UI renders projections, but it does not become the source of truth. Connect and OIDC tokens authorize scoped remote work, but they do not outrank the proof object. Kai coordinates order proof truth; timestamps, caches, local browser state, and third-party tables do not.

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
- Twin-assisted business launch drafting from a merchant brief.
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
- Agent and content surfaces: Twin, World, webhooks, manifests, public ledger, SDK doctor, capabilities.

This is the rail map for builders who want to fork the repo into commerce clouds, single-brand storefronts, marketplaces, rewards systems, content commerce products, games, or agent-operated SaaS.

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
- Twin-assisted page, blog, and product drafts.
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
- Local browser storage is demo composition and session projection. It is not product authority.
- Full production confidence requires both automated release gates and manual tenant/domain/checkout/media QA.

## Public Announcement Copy

Receiz Commerce Kit v1.0.0 is now generally available.

This is the first official release of the Receiz proof-sealed commerce application and forkable SDK kernel. It ships a full commerce cloud product surface with storefront, admin, account, checkout, wallet-first settlement, rewards, assets, exchange, play, domains, media, publish, recovery, diagnostics, and release gates.

The important part is the architecture. Products, orders, rewards, assets, customer actions, and storefront state are modeled around Receiz proof objects. `@receiz/sdk` is the typed boundary for identity, proof, checkout, wallet, public store, app state, domains, media, operations, and release rails. Receiz MCP is the agent layer over those rails. Tokens authorize scoped work, but proof remains the root.

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
- Twin-assisted launch/content drafting, importers, blog/page/product builders, and 3D Receiz Wilds reward loop.
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
