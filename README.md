# Receiz Commerce Kit

Receiz Commerce Kit is a forkable, full-stack proof-sealed commerce template. It gives brands a Shopify-style business website, state-of-the-art mobile storefront, customer account area, no-code admin studio, hosted-domain mock flow, hosting billing, checkout adapter, Receiz SDK adapter, Receiz ID account flow, rewards, Receized assets, and an optional reward game.

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

## Modes

The template runs immediately in mock mode:

- Mock auth: sample admin and customer
- Mock checkout: creates local orders without handling payment cards
- Mock hosting: claims a sample subdomain, custom domain, hosting plan, and billing state
- Mock Receiz: imports `@receiz/sdk` and exposes template-level seal methods
- Mock Receiz ID: demonstrates existing Receiz ID login and new Receiz ID creation boundaries

Live providers are intentionally isolated behind adapters:

- `src/lib/receiz/adapter.ts`
- `src/lib/checkout/mock-checkout.ts`
- `src/lib/auth/mock-auth.ts`
- `src/lib/hosting/mock-hosting.ts`
- `src/lib/storage/mock-storage.ts`

## No-Code Admin

The admin studio lets an operator customize:

- Brand name, logo, colors, and tagline
- Font, radius, button style, and theme save flow
- Pages and navigation
- Products and collections
- Rewards and reward rules
- Receized assets
- Receiz ID login and account creation
- Game enabled/off
- Checkout mode
- Hosted subdomain, custom domain, hosting plan, and billing method
- Publish checklist

## Mobile Storefront

The public home page behaves like a modern shopping app on mobile:

- Single `100dvh` viewport with no body scrolling
- Bottom toolbar switches Store, Rewards, Assets, Play, and Account
- Store tab shows a commerce-first home: hero offer, categories, products, cart, and seal actions
- Rewards/assets/account tabs expose Receiz ID ownership and proof-sealed benefits
- Play tab is optional and can be disabled without breaking the storefront

## Receiz ID

The template uses Receiz ID as the account layer. Existing Receiz IDs can continue in one click, while new brands or customers can create a Receiz ID from the same flow. The adapter imports SDK identity helpers including `createReceizIdIdentity`, `buildReceizIdContinueRequest`, `projectReceizIdentityAccount`, and `signReceizIdentityLoginProof` through `@receiz/sdk`.

## Vercel Launch

This app is ready for Vercel as a standard Next.js App Router project.

Recommended project settings:

- Framework preset: `Next.js`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: leave empty/default
- Node.js: `20.x` or newer

Set these environment variables in Vercel:

```bash
NEXT_PUBLIC_RECEIZ_MODE=mock
RECEIZ_BASE_URL=https://receiz.com
RECEIZ_CLIENT_ID=receiz-commerce-kit-demo
RECEIZ_ACCESS_TOKEN=

NEXT_PUBLIC_CHECKOUT_MODE=mock
CHECKOUT_PROVIDER=mock
STRIPE_SECRET_KEY=

NEXT_PUBLIC_AUTH_MODE=mock
AUTH_PROVIDER=mock

NEXT_PUBLIC_HOSTING_MODE=mock_hosted
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
NEXT_PUBLIC_DEFAULT_SUBDOMAIN=boost.receiz.store
```

After adding a custom domain, update `NEXT_PUBLIC_SITE_URL` to that custom domain so Receiz ID redirect URLs use the production origin.

## Developer Fork Path

Developers can fork this repo, replace mock adapters with real providers, and keep the same UI/domain model. The app is structured so provider choices do not leak into page components.

## Design References

Implementation targets are stored in `docs/design-references/`:

- `proof-commerce-desktop-storefront.png`
- `proof-commerce-mobile-storefront.png`
- `proof-commerce-admin-studio.png`

The generated admin reference contains a typo in its event rail. The implementation intentionally renders the corrected text: `Seal events`.
