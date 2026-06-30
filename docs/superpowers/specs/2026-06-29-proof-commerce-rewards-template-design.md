# Proof Commerce and Rewards Template Design

Date: 2026-06-29

## Purpose

Build a forkable full-stack Receiz template and hosted launch experience that lets a brand launch a customizable business website, store, marketplace, customer account system, or rewards game without writing backend code. The product should feel like a more advanced Shopify for proof-sealed commerce and reward games: a brand can set up its public site, sell products or Receized assets, manage customers and orders, enable proof-sealed rewards, and optionally add play-to-earn campaigns.

The core offer is:

> Clone this or launch it hosted. Create a business website and store in seconds. Customize it from admin. Manage products, pages, customers, orders, rewards, and Receized assets. Seal commerce, rewards, and proof events with Receiz. Turn on optional games when the brand wants deeper engagement.

## Product Positioning

The template is a modular business and commerce starter powered by Receiz. The website and store are the base product. Rewards, proof-object mechanics, asset marketplace behavior, hosting/domain setup, and games are optional modules.

Receiz should be presented as the proof/object/value layer. The core verb is **seal**: users seal products, orders, rewards, assets, and game actions with Receiz. The demo must not frame the product as a blockchain-first marketplace. Chain labels, token-market language, blockchain issuance language, and crypto-wallet-first UI are out of scope unless the public SDK explicitly requires them.

The product has two distribution paths:

- **Hosted no-code path:** a non-technical operator signs in, chooses a subdomain, customizes the site in admin, connects Receiz, configures checkout/hosting, and publishes.
- **Developer fork path:** a developer clones or forks the repo, installs the SDK, changes code, deploys anywhere, and can still use the same admin and adapter boundaries.

The template should support five launch modes:

- **Storefront only:** a brand sells products, digital items, access, benefits, services, or merchandise.
- **Business website:** a brand publishes no-code pages, collections, product pages, policies, and customer account pages.
- **Rewards program:** purchases or verified objects unlock coupons, access passes, perks, memberships, points, collectible cards, or Receized assets.
- **Rewards game:** users complete actions, score, rank, collect objects, or play branded challenges to earn rewards or Receized assets.
- **Hosted proof-sealed site:** a brand launches on a provided subdomain and can later connect a custom domain.

The game is not mandatory. It is a growth module that can be omitted entirely.

## Target Users

Primary users:

- Developers who want a full-stack Receiz app starter.
- Brands that want a customizable website, store, customer accounts, and admin panel.
- Brands that want proof-sealed rewards without writing backend code.
- Non-technical operators who want to launch and customize the business from admin.
- Operators who want hosted subdomain/custom-domain publishing and managed hosting.
- Receiz builders proving the public SDK can support an independent full-stack commerce app.

Secondary users:

- Consumers or members who browse a branded store, buy or claim an item, verify an object, complete a reward action, and receive a Receized reward or asset.

## Experience Summary

The template has three major surfaces:

- **Public storefront:** the customer-facing store, marketplace, reward catalog, and optional play-to-earn campaign.
- **Customer account:** login-protected order history, owned rewards, Receized assets, benefits, and proof trails.
- **Admin studio:** the no-code control panel where the brand configures the site, store, products, pages, customers, orders, rewards, proof rules, domains, hosting, game campaigns, and publishing state.

Recommended sample brand:

- Name: Boost Coffee
- Store concept: coffee rewards store with products, coupons, access benefits, and optional play-to-earn receipt challenges.
- Reward examples: coupon card, access pass, 2x points booster, rare collectible benefit card, sellable Receized limited drop.

Primary merchant loop:

1. Clone the template.
2. Run in mock mode immediately.
3. Log in to `/admin`.
4. Choose a hosted subdomain such as `boost.receiz.store` or configure self-hosted mode.
5. Configure brand theme, store copy, products, and reward rules.
6. Build or edit public pages and navigation from admin.
7. Choose whether customer accounts are required for purchases, rewards, or asset ownership.
8. Choose whether the game module is enabled.
9. Choose what objects qualify for proof-sealed rewards.
10. Connect Receiz.
11. Configure checkout and hosting mode.
12. Publish the storefront.
13. Add a custom domain when ready.
14. Accept purchases or claims through the configured checkout adapter.
15. Manage customers, orders, rewards, assets, and proof events.
16. Seal, issue, redeem, list, sell, trade, or share Receized rewards and assets.

Primary customer loop:

1. Browse the storefront.
2. Buy, claim, verify, or enter a campaign.
3. Receive proof-sealed progress or ownership.
4. Earn a coupon, access pass, benefit, membership perk, asset, or game reward.
5. Redeem, share, list, sell, or trade when the brand allows it.
6. View proof for the item, reward, or action.

## App Surfaces

### Public Storefront

The default public experience. It must work as a complete business website even when Receiz rewards and the game module are disabled.

Core elements:

- Brand header and navigation
- No-code content sections
- Collection pages
- Product grid
- Featured product or campaign
- Reward catalog preview
- Receiz proof/status indicators
- Cart or checkout CTA
- Customer account entry
- Optional asset market section
- Optional play-to-earn section
- Hosted subdomain or custom-domain status in admin preview surfaces

### Site Pages

No-code editable pages for the public business website.

Initial page types:

- Home
- Shop
- Collection
- Product
- About
- Rewards
- Asset Market
- Play
- Account
- Policies
- Custom page

Admin-editable page content:

- Page title
- URL slug
- Navigation visibility
- Hero copy
- Content sections
- Featured products
- Featured rewards
- Receiz proof callouts
- Publish state

### Product Detail

Shows a sellable item, benefit, access pass, digital item, physical product, or Receized asset.

Fields:

- Name
- Type
- Price or claim rule
- Description
- Media or card art
- Availability
- Receiz proof behavior
- Reward eligibility
- Checkout, claim, list, sell, trade, share, or redeem action

### Cart and Checkout

Lets the storefront sell products, digital goods, benefits, access, services, or Receized assets.

Checkout behavior:

- Cart persists locally only for demo composition.
- Receiz sandbox checkout creates an order without payment credentials.
- Receiz checkout can be wired through the SDK adapter for production payments.
- Checkout can require or allow a customer account depending on admin settings.
- Successful checkout can issue proof events, rewards, assets, or benefits.
- Successful checkout can seal the order and related reward/asset events through the Receiz adapter.

### Customer Account

Account area for customers and members.

Customer account sections:

- Profile
- Orders
- Owned rewards
- Owned Receized assets
- Benefits and access passes
- Game progress when enabled
- Proof trail
- Saved addresses or preferences in mock form

The template should ship with mock account mode so it works immediately. Production auth should be isolated behind an auth adapter.

### Asset Market

Shows the optional list/sell/trade/share layer for Receized rewards and assets.

Asset market fields:

- Asset name
- Asset type
- Brand
- Owner/member
- Proof source
- Status: redeemable, listed, sold, traded, locked, expired
- Price or trade terms
- Proof trail

The asset market is program-controlled. Brands decide what can be sold. Some rewards are private coupons or access benefits, while others are Receized assets that can move between users.

### Rewards

Reward inventory and benefit catalog.

Reward types:

- Coupon
- Access pass
- Benefit unlock
- Membership tier
- Collectible card
- Event entry
- Digital content unlock
- Physical item claim
- Points multiplier
- Receized asset
- Sellable item
- Limited edition drop
- Custom reward

Reward actions:

- Claim
- Redeem
- Share
- List
- Sell
- Trade
- View proof

### Play

Optional game/challenge surface. If disabled, the storefront still works as a normal proof-sealed store.

Initial game module:

- 2D tile collection challenge built with React state and DOM/CSS.
- Users collect branded objects, build streaks, trigger score multipliers, and unlock reward cards or assets.
- Game results create local proof-style events through the Receiz adapter.
- The game can be omitted from navigation and admin configuration with one setting.

### Admin Studio

The no-code backend control panel. A brand should be able to launch and edit the public app from here without touching code.

Admin sections:

- Dashboard
- Brand
- Pages
- Navigation
- Storefront
- Products
- Collections
- Rewards
- Asset Market
- Game
- Qualifiers
- Customers
- Orders
- Members
- Account Settings
- Receiz
- Checkout
- Hosting
- Domains
- Publish

Admin controls:

- Brand name
- Logo text or mark
- Accent colors
- Store headline and description
- Page builder sections
- Navigation links
- Product creation and editing
- Collection creation and editing
- Product pricing and availability
- Reward creation and editing
- Reward rule editor
- Reward transferability: redeem-only, shareable, listable, sellable, tradable, locked
- Game module enable/disable
- Game campaign copy and reward thresholds
- Qualifying object toggles
- Mock/live Receiz mode
- Mock/live checkout mode
- Mock/live account mode
- Hosted/self-hosted mode
- Subdomain
- Custom domain
- Hosting plan
- Store policies
- Publish/unpublish

### Admin Dashboard

Shows store and program health:

- Published state
- Subdomain status
- Custom domain status
- Hosting plan status
- Pages published
- Products active
- Rewards issued
- Receized assets listed
- Orders or mock orders
- Customer accounts
- Proof events
- Game completions when enabled

### Admin Hosting and Domains

Lets a non-technical operator launch quickly and then upgrade to a custom domain.

Controls:

- Hosted subdomain
- Custom domain
- DNS status
- SSL status
- Hosting plan
- Self-hosted export/fork instructions
- Publish status

The hosted no-code path and the developer fork path must share the same product model. Hosted users should not need code. Developers should not lose access to the underlying source.

### Admin Receiz

SDK status and integration reference route.

Shows:

- Installed SDK package
- Environment mode
- Mock adapter state
- Connect flow
- Verification events
- Reward events
- Asset events
- Example payloads
- Clear code pointers for where developers customize integration

## Full-Stack Architecture

Use Next.js App Router + TypeScript for the implementation. This keeps storefront pages, admin pages, backend route handlers, SDK boundaries, and deployment in one forkable app.

Recommended proof-state approach:

- **Demo mode:** works immediately after clone with seed data and browser-local admin edits.
- **Launch mode:** uses Receiz proof objects, identity artifacts, verified appends, ownership appends, and settlement ledger rows as the product truth.

The implementation should isolate local demo composition from Receiz truth so the template does not introduce Supabase, Stripe, or a parallel database as an authority layer. Durable proof memory stores admitted truth; it is not a cache and should only append verified additions after the known Kai/proof head.

Initial storage methods:

- `getStorefrontConfig()`
- `updateStorefrontConfig(input)`
- `listPages()`
- `createPage(input)`
- `updatePage(id, input)`
- `listCollections()`
- `createCollection(input)`
- `updateCollection(id, input)`
- `listProducts()`
- `createProduct(input)`
- `updateProduct(id, input)`
- `listRewards()`
- `createReward(input)`
- `updateReward(id, input)`
- `listAssets()`
- `createAsset(input)`
- `updateAsset(id, input)`
- `listOrders()`
- `createOrder(input)`
- `listCustomers()`
- `getCustomer(id)`
- `updateCustomer(id, input)`
- `listProofEvents()`
- `appendProofEvent(input)`
- `getHostingConfig()`
- `updateHostingConfig(input)`

## Auth and Account Boundary

The template should provide customer/admin account flows without inventing a parallel account authority.

Auth modes:

- **Demo auth:** lets the template run immediately with a sample admin and sample customer.
- **Receiz ID:** create, continue, or restore the same account from Receiz ID, Receiz Key, Identity Record, or Identity Seal.

Initial auth methods:

- `getCurrentUser()`
- `signIn(input)`
- `signOut()`
- `requireAdmin()`
- `requireCustomer()`

Admin access can be simulated locally for the starter. Production deployments should use Receiz ID and Connect/OIDC boundaries before handling real customer data.

## Checkout Boundary

The app should support checkout without storing card data directly.

Checkout modes:

- **Receiz sandbox:** lets the template run immediately and creates proof-sealed local sample orders.
- **Receiz checkout:** uses the SDK checkout rail for production payments.

The template must not implement raw card handling or a non-Receiz payment authority. Checkout should call the Receiz SDK rail.

Initial checkout methods:

- `createCheckoutSession(cart)`
- `confirmMockCheckout(orderInput)`
- `getOrder(orderId)`

## Hosting and Domain Boundary

The template should model hosted publishing with Receiz proof objects as product truth and Vercel only as an optional deployment/domain automation layer.

Hosting modes:

- **Demo hosted mode:** shows a working subdomain/custom-domain setup flow in admin and stores composition state locally.
- **Receiz hosted mode:** managed subdomains, custom domains, billing plans, and deployment automation around Receiz rails.
- **Self-hosted mode:** developer forks the repo and deploys to their own infrastructure.

Initial hosting methods:

- `getHostingStatus()`
- `claimSubdomain(subdomain)`
- `connectCustomDomain(domain)`
- `verifyDomain(domain)`
- `setHostingMode(mode)`
- `getPublishChecklist()`

## Receiz SDK Integration Boundary

Install `@receiz/sdk` and build a small adapter layer so the rest of the app does not depend directly on SDK implementation details.

The app should support two Receiz modes:

- **Mock mode:** default. Runs fully after clone with local demo data.
- **Live mode:** uses `@receiz/sdk` when credentials/environment are configured.

The adapter should expose stable app-level methods:

- `connectReceiz()`
- `verifyObject(object)`
- `sealProduct(productInput)`
- `sealOrder(orderInput)`
- `sealReward(rewardInput)`
- `sealAsset(assetInput)`
- `sealGameResult(result)`
- `recordGameResult(result)`
- `issueReward(rewardInput)`
- `listAsset(assetId)`
- `sellAsset(assetId, terms)`
- `tradeAsset(assetId)`
- `shareAsset(assetId)`
- `getProofTrail()`

If the SDK exports differ from these names, the adapter maps the template API to the actual SDK surface. The UI should only call the adapter.

## Data Model

Use TypeScript types for the template domain:

- `BrandConfig`
- `StorefrontConfig`
- `SitePage`
- `PageSection`
- `NavigationItem`
- `Collection`
- `Product`
- `ProductType`
- `Cart`
- `Order`
- `CustomerAccount`
- `AdminUser`
- `RewardProgram`
- `Campaign`
- `QualifyingObjectType`
- `VerifiedObject`
- `GameConfig`
- `GameResult`
- `RewardRule`
- `Reward`
- `ReceizedAsset`
- `AssetListing`
- `MemberProfile`
- `ProofEvent`
- `ReceizConnectionState`
- `CheckoutState`
- `AuthState`
- `HostingConfig`
- `DomainStatus`
- `PublishState`

Sample data should live separately from UI components so developers can replace it quickly.

## Visual Direction

Use the approved desktop render as the visual north star:

- Left navigation on desktop.
- Dense app body with store/rewards/game modules.
- Featured brand campaign/product.
- Embedded game panel when enabled.
- Reward deck and proof events on the right.
- Storefront/market rows below.
- Admin studio should feel like the same product family, but quieter and more operational.
- Mobile should feel state of the art: fast, polished, thumb-friendly, and good enough to be the primary storefront experience.

Generate and implement a mobile version that faithfully adapts this structure:

- Compact top header with brand and Receiz status.
- Bottom or segmented mobile nav.
- Featured product/campaign first.
- Product/reward cards stacked.
- Game board below the hero only when game is enabled.
- Proof events collapsed or presented as a compact timeline.
- Asset/store listings as stacked rows, not desktop tables.

Visual system:

- Clean, premium, app-first interface.
- Near-white canvas with charcoal text.
- Cyan/emerald Receiz proof accents.
- Small coral/gold reward moments.
- Restrained shadows.
- 8px radii for cards, panels, buttons, and controls.
- Dense enough to feel useful, not a sparse hero page.
- Playful reward cards and game board without making the whole app childish.

Avoid:

- Uniswap visual imitation.
- Crypto swap patterns as the main UI.
- Chain filters or chain columns such as Base, Polygon, or Arbitrum.
- Crypto-wallet-first address chips as the primary connected identity.
- Blockchain issuance language where "Seal", "Verify", "Issue", "Receize", or "Claim" is more accurate.
- Prefer "Seal", "Proof-sealed", "Verify", "Issue", "Receize", and "Claim" language.
- Purple-blue gradient dominance.
- Dark-only dashboard.
- Beige/cream/brown theme.
- Decorative blobs, bokeh, or oversized orb backgrounds.
- Generic landing page hero.
- Nested cards inside cards.

## Component Architecture

Suggested modules:

- `app/(public)`: public storefront, product, rewards, market, play routes
- `app/account`: customer account routes
- `app/admin`: admin studio routes
- `app/api`: route handlers for mock backend actions
- `src/components`: shared UI primitives
- `src/features/storefront`: public commerce UI
- `src/features/pages`: no-code page rendering and page editor
- `src/features/account`: customer account, orders, owned rewards, owned assets
- `src/features/products`: product grids, detail cards, admin product editor
- `src/features/rewards`: reward cards, catalog, actions, admin reward editor
- `src/features/assets`: Receized asset market and asset actions
- `src/features/play`: optional game module
- `src/features/admin`: admin shell, dashboard, settings
- `src/features/hosting`: hosted subdomain, custom domain, publishing, self-host/fork surfaces
- `src/features/receiz`: SDK status and proof trail
- `src/features/checkout`: cart, Receiz sandbox checkout, checkout adapter
- `src/lib/auth`: Receiz ID adapter and local demo auth
- `src/lib/hosting`: hosting/domain adapter and local hosted demo state
- `src/lib/storage`: storage adapter and seed data
- `src/lib/receiz`: SDK adapter and proof rails
- `src/lib/checkout`: Receiz checkout adapter and sandbox checkout
- `src/types`: shared domain types

Keep pages as composition glue. Avoid one giant component or one giant state file.

## Interaction Requirements

The template must be interactive enough to prove the product loop:

- Edit brand settings in admin and see the public app update.
- Edit public pages and navigation in admin.
- Claim a mock hosted subdomain in admin.
- Connect a mock custom domain in admin.
- Switch between hosted and self-hosted mode in admin.
- Create or edit products in admin.
- Create or edit collections in admin.
- Create or edit rewards in admin.
- Enable or disable the game module.
- Sign in as mock admin.
- Sign in as mock customer.
- Toggle whether rewards/assets are redeem-only, shareable, listable, sellable, tradable, or locked.
- Connect Receiz in mock mode.
- Verify a sample object.
- Seal a product, order, reward, asset, or game result in mock mode.
- Add a product to cart.
- Complete mock checkout.
- View order history in customer account.
- View owned rewards and assets in customer account.
- Play the reward challenge when enabled.
- Earn a reward or Receized asset from a rule.
- View proof events.
- Claim, redeem, share, list, sell, and trade reward or asset actions locally.

The app can simulate Receiz-backed product state locally, but the state transitions should be real in the browser.

## Non-Goals

This template will not include:

- Proprietary Receiz marketplace economics.
- Raw card handling or direct payment credential storage.
- Real production fulfillment.
- Production-grade auth without configuring Receiz ID and Connect/OIDC.
- Real DNS or managed hosting automation in the first template implementation.
- Real billing for hosted plans in the first template implementation.
- A complex custom game engine.
- A generic token swap interface.
- A hard dependency on private Receiz app code.
- Mandatory game mechanics for every store.

## Verification Plan

Before implementation is considered complete:

- Install `@receiz/sdk`.
- Confirm TypeScript can import the package.
- Run typecheck/build.
- Run the app locally.
- Verify desktop and mobile layouts against the approved desktop and generated mobile renders.
- Click through public storefront: browse, add to cart, mock checkout, view reward or asset.
- Click through customer account: sign in, view orders, view rewards, view owned assets.
- Click through admin: edit brand, edit pages, edit navigation, edit product, edit collection, edit reward, claim subdomain, connect custom domain, toggle game, publish changes.
- Click through Receiz loop: connect, verify object, issue reward or asset, view proof.
- Click through seal loop: seal order, seal reward, seal asset, and view proof trail.
- Click through optional game loop: play, earn reward, view proof.
- Confirm mock mode works without credentials.
- Confirm SDK usage is isolated in the adapter.
- Confirm checkout usage is isolated in the adapter.

## Approval

This spec reflects the updated direction: a full-stack, Shopify-style proof-sealed commerce template where a brand can launch a customizable business website, store, customer accounts, hosted subdomain or custom domain, admin panel, proof-sealed rewards, Receized assets, and optional reward games using the Receiz SDK. It supports both no-code hosted operators and developers who want to fork the code.
