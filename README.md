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

## No-Code Admin

The admin studio lets an operator customize:

- Brand name, logo, colors, and tagline
- Font, radius, button style, and theme save flow
- Pages and navigation
- Products and collections
- Rewards and reward rules
- Receized assets
- Receiz ID login, account creation, and identity artifact restore
- Game enabled/off
- Checkout mode
- Free hosted subdomain, paid custom domain, hosting plan, and billing method
- Publish checklist

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

Optional Receiz plan IDs for hosted-commerce upgrades:

```bash
RECEIZ_CUSTOM_DOMAIN_PLAN_ID=
RECEIZ_HOSTING_PRO_PLAN_ID=
```

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

`VERCEL_*` values are only for deployment/custom-domain automation if Vercel is hosting the SaaS. They are not commerce, payment, identity, or proof rails. After changing the production domain, update `NEXT_PUBLIC_SITE_URL` and `RECEIZ_ID_CALLBACK_URL` so Receiz ID redirect URLs use the correct origin. Never expose access tokens, webhook secrets, client secrets, or `VERCEL_API_TOKEN` with a `NEXT_PUBLIC_` prefix.

## Developer Fork Path

Developers can fork this repo and build custom commerce modules on the same Receiz SDK boundary. The app is structured so page components render projected proof truth and product controls without inventing a second source of truth.

## Design References

Implementation targets are stored in `docs/design-references/`:

- `proof-commerce-desktop-storefront.png`
- `proof-commerce-mobile-storefront.png`
- `proof-commerce-admin-studio.png`

The generated admin reference contains a typo in its event rail. The implementation intentionally renders the corrected text: `Seal events`.
