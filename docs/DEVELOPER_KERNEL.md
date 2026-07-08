# Developer Kernel

Receiz Commerce Kit is designed to be cloned, studied, and rebuilt. The storefront and admin are a real product, but the deeper artifact is the kernel underneath it: a proof-first application boundary around `@receiz/sdk`, Receiz proof objects, and Receiz MCP.

Use this document when you are building a new product from the repo.

## Kernel Promise

The repo gives developers a complete end-to-end application shape:

- A Next.js App Router product shell.
- A typed SDK adapter that contains Receiz calls.
- A no-code merchant admin that can be kept, replaced, or expanded.
- A public storefront that renders projected proof truth.
- Customer account, cart, checkout, rewards, assets, play, and recovery views.
- Route handlers for checkout, auth, hosting, content assistance, media, store state, and webhooks.
- Release checks, SDK doctor, runtime guard, secret scan, and public repo templates.

The goal is not to force one commerce UI. The goal is to show how much product surface can be built from a small set of Receiz primitives without turning a local database, cache, or vendor-specific session into product truth.

## What The SDK Collapses

In a conventional SaaS build, each concern usually becomes a separate provider or custom subsystem. This template demonstrates the Receiz-native alternative.

| Product concern | Typical stack sprawl | Receiz rail shown here |
| --- | --- | --- |
| Identity and login | Auth provider, account DB, recovery flow | Receiz ID, identity artifacts, OIDC, `identity.*` |
| Object authority | App DB rows and timestamps | sealed proof objects, verified appends, Kai pulse, proof memory |
| Checkout | PSP integration, wallet, order tables | `payments.*`, `commerce.*`, wallet-first checkout, settlement metadata |
| Rewards | Loyalty service, coupons DB, access flags | rewards, access passes, sealed benefit state |
| Assets | Asset service, ownership DB, manifest renderer | Receized assets, manifests, ownership appends |
| Public store state | CMS, database, cache invalidation | signed public-store publish, app-state projection, tenant recovery |
| Media | Upload service, CDN storage, image transforms | `media.upload`, `media.transform`, durable media URLs |
| Domains | Hosting dashboard, DNS scripts, tenant router | `domains.*`, subdomain/custom-domain flows, middleware tenant context |
| Operations | Audit log, jobs, release checks, exports | audit, jobs, compliance, portability, notifications, releases |
| Agent workflow | Custom scripts and brittle CLIs | Receiz MCP over SDK/API rails |

This does not mean every product should use every rail on day one. It means the product can grow without replacing its authority model.

## Product Classes You Can Build

### Commerce Clouds

Use the repo mostly as-is to build a hosted platform for merchants:

- Free `*.receiz.app` style subdomains.
- Paid custom-domain upgrades.
- No-code brand, content, product, reward, and publish workflows.
- Receiz ID as merchant identity.
- Receiz checkout and wallet-first customer purchase flows.
- Admin projections for orders, customers, settlement, fulfillment, rewards, and assets.

### Single-Brand Storefronts

Remove multi-tenant chrome and keep the rails:

- One public store.
- One admin.
- Proof-sealed products and orders.
- Durable public-store publish.
- Customer accounts with Receiz ID recovery.
- Rewards, access passes, subscriptions, fulfillment, tax, and payout rails as needed.

### Marketplaces

Use products, assets, ownership, and settlement metadata as the base:

- Seller onboarding.
- Buyer Receiz ID sessions.
- Asset listing, sale, transfer, and trade actions.
- Merchant settlement metadata per host, collection, or seller.
- Public proof pages for assets, provenance, and order events.

### Rewards And Loyalty Systems

Use the reward and proof rails without a full product catalog:

- Proof-sealed perks.
- Purchase-triggered benefits.
- Wallet-linked claims.
- Access passes.
- Coupon-like benefits without making coupons the source of truth.
- Customer recovery from identity artifacts.

### Content Commerce

Keep pages, blog posts, products, SEO, media, and publish:

- Editorial storefronts.
- Creator shops.
- Product drops.
- Proof-backed memberships.
- Durable page/content recovery through public-state rails.
- Twin/World-assisted content workflows behind explicit capability flags.

### Games And Engagement Loops

Use the Play tab as the starting point:

- Game results as sealed events.
- Rewards issued from gameplay.
- Receized assets earned by play.
- Wallet/account views that show customer state.
- Commerce conversion from proof-backed activity.

### Agent-Operated SaaS

Receiz MCP is the agent surface:

- Inspect SDK doctor output.
- Confirm scopes, callbacks, tenant host, and capabilities.
- Diagnose publish/domain/checkout issues.
- Trigger rail calls through explicit tools.
- Keep proof objects and SDK/API rails as authority while agents assist operators.

## Files To Study First

- `src/lib/receiz/adapter.ts` - all app-level SDK rails.
- `src/lib/receiz/oauth-scopes.ts` - the OIDC scope set for the product rails.
- `src/lib/receiz/store-state-publication.ts` - public-store publish input and sync.
- `src/lib/receiz/proof-state.ts` - proof record validation and Kai ordering.
- `src/lib/receiz/proof-state-store.ts` - admitted proof memory and host projection.
- `src/lib/storefront/server-state.ts` - tenant storefront recovery and fallback.
- `src/lib/checkout/checkout-request.ts` - checkout request shape.
- `src/lib/checkout/wallet-authority.ts` - wallet-first purchase authority.
- `src/lib/hosting/domain-utils.ts` - domain normalization and validation.
- `src/lib/launch/readiness.ts` - production-readiness model.
- `scripts/receiz-doctor.mjs` - SDK/MCP-aligned diagnostics.
- `scripts/release-check.mjs` - release gate orchestration.

## Rules For Extending The Kernel

### Keep Receiz Calls Behind The Adapter

New SDK calls should enter through `src/lib/receiz/adapter.ts` or a narrow helper under `src/lib/receiz/`. Components should not import deep Receiz namespaces directly unless the file is itself a Receiz boundary.

### Preserve Proof Authority

Do not use localStorage, Vercel function memory, response arrival order, timestamps, or third-party rows to decide what is true. Those can be projections, caches, or integration state. They cannot outrank a verified proof object, append, ownership append, or settlement ledger row.

### Keep Tenant Sessions Scoped

`receiz.app` is the platform/admin surface. `*.receiz.app` and custom domains are merchant/customer surfaces. Buyer credentials, checkout authority, and customer account projections must stay scoped to the active tenant host.

### Fail Missing Rails Visibly

If a feature needs a Receiz rail that is not configured, return a clear `needs_env`, `receiz_authority_required`, or capability warning. Do not silently replace the rail with private app truth.

### Use MCP As Tooling, Not Authority

MCP can help agents inspect, diagnose, and invoke SDK/API rails. It cannot create proof truth by itself and should not be presented as a replacement for SDK verification, signed publish, or admitted proof memory.

## Suggested Build Paths

### Minimal Fork

1. Change brand, seed content, and product defaults.
2. Keep the adapter and release scripts unchanged.
3. Configure `.env.local`.
4. Run `pnpm release:check`.
5. Deploy to Vercel or another Next.js host.

### Product Fork

1. Decide the product category: single store, marketplace, rewards OS, content commerce, or hosted SaaS.
2. Remove UI modules you do not need.
3. Keep the Receiz adapter and proof-state modules.
4. Add new domain logic in `src/lib/<domain>/`.
5. Add focused tests under `tests/`.
6. Update `docs/SDK_RAILS.md` with every new Receiz rail.
7. Run `pnpm release:check`.

### Platform Fork

1. Keep multi-tenant middleware and hosting routes.
2. Configure wildcard DNS and domain automation.
3. Keep launch readiness visible in admin.
4. Add billing plans and platform settlement details.
5. Add operator documentation for tenant support.
6. Run subdomain, custom-domain, checkout, publish, and cold-start QA before release.

## Release-Quality Checklist For Forks

- SDK rail map updated.
- `.env.example` updated.
- New Receiz calls isolated behind adapter/helper boundary.
- Tests cover proof ordering, tenant scope, checkout authority, and publish recovery for changed areas.
- UI changes verified on mobile and desktop.
- Secrets stay server-only.
- `pnpm release:check` passes.
- `pnpm secret:scan` passes.
- `docs/OPEN_SOURCE_RELEASE.md` is still accurate.

## Mental Model

Build product interfaces however you want, but keep the truth model stable:

```txt
proof object or verified append
-> SDK verifies/projects it
-> app admits it into proof memory
-> UI renders the projection
-> later actions append from the known proof head
-> MCP may inspect or assist, but never outranks the proof
```

That is the kernel.
