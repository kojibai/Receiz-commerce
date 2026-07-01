# Receiz.app Commerce Cloud

Receiz.app Commerce Cloud is both a SaaS product and a forkable ecommerce template. Non-coders can launch a mobile-friendly ecommerce site on a free `*.receiz.app` subdomain, customize the brand in a no-code studio, connect Receiz primitives, and upgrade to paid custom-domain hosting. Developers can fork the same codebase and build custom Receiz-powered commerce experiences.

The core verb is **seal**. Products, orders, rewards, assets, and game actions can be sealed with Receiz.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open:

- Public storefront: `http://localhost:3000`
- Admin studio: `http://localhost:3000/admin`
- Customer account: `http://localhost:3000/account`

## Receiz Rails

Receiz.app Commerce Cloud uses Receiz as the account, payment, proof, reward, ledger, and asset rail. The app can still run locally with demo UI state, but production truth comes from Receiz proof objects, identity artifacts, verified appends, ownership appends, and settlement ledger rows.

The SDK integration follows the Receiz order:

- Verify or validate carried proof truth.
- Project it immediately for first paint.
- Admit it once into durable proof memory.
- Resume from the known Kai/proof head.
- Append later verified additions without rediscovering known truth.

No Supabase, Stripe, or app database is required for product truth. Local browser state in this template is demo composition only; proof memory is admitted proof truth, not a cache.

The main Receiz adapter is:

- `src/lib/receiz/adapter.ts`

See `docs/SDK_RAILS.md` for the route-by-route SDK rail map.

## No-Code Admin

The admin studio lets an operator customize:

- Brand name, logo, colors, and tagline
- Font, radius, button style, and theme save flow
- Pages and navigation
- Robust pages, blog posts, products, collections, and SEO
- Rewards and reward rules
- Receized assets
- Receiz ID login, account creation, and identity artifact restore
- Game enabled/off
- Checkout mode
- Free hosted subdomain, paid custom domain, hosting plan, and billing method
- Publish checklist

The page, blog, and product buttons open real builders. They persist local template projections immediately and are structured so production deployments can admit the resulting content events through Receiz proof rails.

## Content Builders

The admin includes mobile-friendly builders for:

- Pages: URL path, hero content, body copy, navigation visibility, publish state, SEO title, description, canonical path, and keywords
- Blog posts: title, slug, excerpt, body, author, cover image, tags, featured state, publish state, and SEO
- Products: type, price, inventory, status, visual treatment, product description, SEO, reward eligibility, and seal readiness

Published blog posts render on the storefront, including tenant/custom-domain storefronts.

## Sales And Customers

The admin console includes a sales/customer panel that displays:

- Orders
- Buyer email
- Payment rail
- Settlement status
- Merchant Receiz ID
- Tenant host/custom domain
- Customer profile rows
- Shipping details for fulfillment

Checkout projections are local UI projections until the Receiz checkout/session/settlement proof bundles are returned and admitted.

## Product Model

- Free launch: create, continue, or restore Receiz ID, publish a hosted `*.receiz.app` storefront, customize branding, add products, and use Receiz proof rails.
- Paid upgrade: connect a custom domain, enable production hosting, configure Receiz checkout, and scale rewards/assets/game modules.
- Adoption loop: every merchant store uses Receiz ID, Receiz checkout rails, proof objects, rewards, Receized assets, and sealed business events.

## Mobile Storefront

The public home page behaves like a modern shopping app on mobile:

- Single `100dvh` viewport with no body scrolling
- Bottom toolbar switches Store, Rewards, Assets, Play, and Account
- Store tab shows a commerce-first home: hero offer, categories, products, cart, and seal actions
- Rewards/assets/account tabs expose Receiz ID ownership and proof-sealed benefits
- Play tab is optional and can be disabled without breaking the storefront

## Receiz ID

The template uses Receiz ID as the account layer. Existing Receiz IDs can continue in one click, new brands or customers can create a Receiz ID from the same flow, and users can restore the same account from a Receiz Key, Identity Record image, or Identity Seal image. The adapter and admin UI use SDK identity helpers including `createReceizIdIdentity`, `readReceizIdentityArtifact`, `projectReceizIdentityAccount`, `signReceizIdentityLoginProof`, `verifyReceizIdentityLoginProof`, and `buildReceizIdContinueRequest` through `@receiz/sdk`.

## Vercel Launch

This app is ready for Vercel as a standard Next.js App Router project.

Recommended project settings:

- Framework preset: `Next.js`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: leave empty/default
- Node.js: `20.x` or newer

OIDC registration:

- Redirect URI: `https://receiz.app/api/auth/receiz/callback`
- Public client: leave unchecked for this Vercel/Next.js app.
- Client secret: keep server-only in `RECEIZ_CLIENT_SECRET`.
- PKCE: still used through `/api/auth/receiz/start`.
- Scopes: use the full Receiz Commerce Cloud scope set:

```txt
email
offline_access
openid
profile
receiz:app_state.read
receiz:app_state.write
receiz:domains.read
receiz:domains.write
receiz:media.read
receiz:media.write
receiz:notes.claim
receiz:notes.mint
receiz:notes.read
receiz:payments.create
receiz:payments.read
receiz:public_store.read
receiz:public_store.write
receiz:record
receiz:seal
receiz:twin.read
receiz:twin.write
receiz:verify
receiz:wallet.read
receiz:wallet.transfer
receiz:world.read
receiz:world.write
```
- Browser-only, mobile, or static forks should register a separate public client.

Set these required environment variables in Vercel:

```bash
NEXT_PUBLIC_RECEIZ_MODE=live
RECEIZ_BASE_URL=https://receiz.com
RECEIZ_CLIENT_ID=
RECEIZ_CLIENT_SECRET=

NEXT_PUBLIC_AUTH_MODE=receiz_id
RECEIZ_AUTH_MODE=receiz_id
RECEIZ_ID_CALLBACK_URL=https://receiz.app/api/auth/receiz/callback
NEXT_PUBLIC_SITE_URL=https://receiz.app
```

Enable live Receiz checkout with:

```bash
NEXT_PUBLIC_CHECKOUT_MODE=receiz
RECEIZ_CHECKOUT_MODE=receiz
```

Hosted-commerce settings:

```bash
NEXT_PUBLIC_HOSTING_MODE=receiz_hosted
NEXT_PUBLIC_DEFAULT_SUBDOMAIN=boost.receiz.app
RECEIZ_ACCOUNT_STATE_MODE=receiz
```

Optional webhook secrets, if enabled in Receiz:

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
VERCEL_CNAME_TARGET=cname.vercel-dns-0.com
VERCEL_APEX_A_RECORD=76.76.21.21
```

For free subdomains to work, the Vercel project must receive the traffic:

```txt
1. Add receiz.app to the Vercel project.
2. Add *.receiz.app to the Vercel project.
3. Point wildcard DNS *.receiz.app to cname.vercel-dns-0.com.
4. Set VERCEL_API_TOKEN and VERCEL_PROJECT_ID so /api/hosting can add and verify custom domains.
```

The app routes tenant hosts through `middleware.ts`. A request to `boost.receiz.app` is served by the same deployment with `tenant=boost`; a verified custom domain is served by the same deployment with `domain=thebrand.com`.

### Global Publish Sync

The admin editor can stage changes locally, but a hosted subdomain/custom domain is only globally live after publish writes a Receiz store-state record. Production publish requires a Receiz ID session on `receiz.app/admin`; the generated OIDC access token is sent from the secure server cookie to Receiz Connect record APIs. Vercel function memory is not durable and is never treated as the global source of truth.

After publishing, verify the public tenant projection:

```bash
curl -sS https://your-subdomain.receiz.app/api/store
```

The response should show saved brand/content, `source: "published"`, `publishedState: true`, and `proofMemory.entries` greater than `0`. If it shows `source: "fallback"` or `proofMemory.entries: 0`, the live app did not recover a Receiz store-state record and will render the safe fallback storefront. If publish returns `receiz_login_required`, sign in from `https://receiz.app/admin` and publish again.

Receiz settlement for platform fees we collect:

```bash
RECEIZ_PLATFORM_BILLING_MODE=sandbox
RECEIZ_PLATFORM_ACCOUNT_ID=
RECEIZ_PRO_PLAN_USD=49.00
RECEIZ_SCALE_PLAN_USD=199.00
RECEIZ_CUSTOM_DOMAIN_SETUP_USD=0.00
```

Set `RECEIZ_PLATFORM_BILLING_MODE=live` only when `RECEIZ_PLATFORM_ACCOUNT_ID` is your Receiz account/user id. Paid plan selection and custom-domain setup can then use Receiz Connect transfer to settle the platform fee to your Receiz account.

Optional merchant settlement fallback for demo checkout:

```bash
RECEIZ_DEFAULT_MERCHANT_RECEIZ_ID=
RECEIZ_DEFAULT_SETTLEMENT_USER_ID=
```

Production merchant checkout should use the merchant's connected Receiz account/state. The checkout API sends tenant host, merchant Receiz ID, and settlement recipient metadata into Receiz checkout so customer payments settle to the merchant's Receiz rails, not a Stripe account.

Customer checkout on a tenant host requires that customer's scoped Receiz session for that exact host. A `receiz.app` platform login is not reused as the buyer session on `brand.receiz.app` or a custom domain.

The checkout request is wallet-first:

```txt
Receiz ID login
-> read customer Receiz wallet projection
-> create Receiz embedded checkout session
-> prefer Receiz wallet balance
-> allow credit-card fallback when wallet funds are unavailable
-> route settlement metadata to the merchant Receiz ID/reserve wallet
-> project order/customer/fulfillment state into the merchant admin
```

Optional Receiz plan IDs for hosted-commerce upgrades:

```bash
RECEIZ_CUSTOM_DOMAIN_PLAN_ID=
RECEIZ_HOSTING_PRO_PLAN_ID=
```

Receiz Twin/World content assistance:

```bash
NEXT_PUBLIC_RECEIZ_TWIN_ENABLED=true
NEXT_PUBLIC_RECEIZ_WORLD_ENABLED=true
RECEIZ_ENABLE_TWIN_SCOPES=true
RECEIZ_ENABLE_WORLD_SCOPES=true
```

`@receiz/sdk@97.5.0` exposes typed Twin, World, public-store, customer, merchant, commerce, media, and domain namespaces. The frontend hides Receiz Twin buttons unless the capability flag is enabled and the SDK namespace is present. If you are testing against an older Receiz OIDC client, set `RECEIZ_ENABLE_TWIN_SCOPES=false` or `RECEIZ_ENABLE_WORLD_SCOPES=false` before login so Receiz does not reject the authorization request with `invalid_scope`.

Do not add a Receiz access token for normal OIDC login. The setup is:

```txt
Receiz client ID + client secret in Vercel
-> user clicks Connect Receiz
-> receiz.com asks the user to approve scopes
-> receiz.com redirects to /api/auth/receiz/callback with a code
-> this app exchanges the code for an access token
-> this app stores that generated token in a secure server cookie
-> checkout/wallet/payment calls use that generated token
```

Only set one of these if Receiz explicitly gives you a static app-level or service token. Most deployments should not set them:

```bash
RECEIZ_ACCESS_TOKEN=
RECEIZ_CONNECT_ACCESS_TOKEN=
```

### SDK Doctor And MCP

Run the local SDK doctor before shipping or debugging auth/domain/publish issues:

```bash
pnpm receiz:doctor
```

The script prints SDK version, requested scopes, callback URL, tenant host, missing rails, warnings, and whether a delegated token is present. It never prints token values.

For MCP-capable agents such as Codex, add Receiz as an MCP server in the agent config:

```toml
[mcp_servers.receiz]
command = "npx"
args = ["-y", "@receiz/mcp-server@97.5.0"]
startup_timeout_sec = 120

[mcp_servers.receiz.env]
RECEIZ_BASE_URL = "https://receiz.com"
# Required only for publish/write MCP tools:
# RECEIZ_ACCESS_TOKEN = "delegated_agent_access_token"
```

Without `RECEIZ_ACCESS_TOKEN`, MCP should still be able to run public diagnostics and public resolve/read tools. With a delegated token, MCP can publish/resolve app state, write public-store projections, verify assets, inspect proof objects, and make agent-driven setup much faster.

`VERCEL_*` values are only for deployment/custom-domain automation if Vercel is hosting the SaaS. They are not commerce, payment, identity, or proof rails. After changing the production domain, update `NEXT_PUBLIC_SITE_URL` and `RECEIZ_ID_CALLBACK_URL` so Receiz ID redirect URLs use the correct origin. Never expose access tokens, webhook secrets, client secrets, or `VERCEL_API_TOKEN` with a `NEXT_PUBLIC_` prefix.

### Production Readiness

Use `docs/PRODUCTION_READINESS.md` as the release gate for both audiences this app serves: developers cloning a Receiz SDK commerce base and no-code merchants launching a real hosted business.

The admin launch-readiness panel is powered by `src/lib/launch/readiness.ts` and checks SDK clone rails, no-code setup, Receiz ID/proof, catalog, checkout, domains, and production operations from the current store state.

## Developer Fork Path

Developers can fork this repo and build custom commerce modules on the same Receiz SDK boundary. The app is structured so page components render projected proof truth and product controls without inventing a second source of truth.

When a merchant publishes a store, local camera-roll/logo/product/blog image data is uploaded through `receiz.media.upload()` first. The published public-store state then stores durable Receiz media URLs instead of oversized inline data URLs, so subdomains and custom domains can cold-start with the exact saved images.

## Open-Source Release

Release checklist:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Mobile admin QA
- Tenant storefront QA
- Checkout QA
- Domain QA
- Secret scan before publishing

See `docs/OPEN_SOURCE_RELEASE.md` for the full public-release checklist.

## Design References

Implementation targets are stored in `docs/design-references/`:

- `proof-commerce-desktop-storefront.png`
- `proof-commerce-mobile-storefront.png`
- `proof-commerce-admin-studio.png`

The generated admin reference contains a typo in its event rail. The implementation intentionally renders the corrected text: `Seal events`.
