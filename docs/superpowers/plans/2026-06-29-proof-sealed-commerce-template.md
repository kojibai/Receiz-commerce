# Proof-Sealed Commerce Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Next.js template for proof-sealed commerce: public storefront, customer account, no-code admin studio, Receiz SDK rails, hosted-domain launch flow, and optional rewards game.

**Architecture:** Use Next.js App Router with TypeScript. Keep Receiz-specific behavior behind clear rails (`receiz`, `checkout`, `auth`, `hosting`) so demo mode runs instantly and production mode uses Receiz as the account, payment, proof, reward, ledger, and asset authority. Implement UI from the saved desktop, mobile, and admin references in `docs/design-references/`.

**Tech Stack:** Next.js, React, TypeScript, CSS modules/global CSS, lucide-react, `@receiz/sdk`, local demo adapters.

---

### Task 1: Scaffold Next.js App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `next-env.d.ts`
- Create: `.eslintrc.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Create project metadata and scripts**

Create `package.json` with scripts:

```json
{
  "name": "receiz-commerce-kit",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "next lint"
  },
  "dependencies": {
    "@receiz/sdk": "^96.0.0",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Add TypeScript and Next config**

Use standard strict TypeScript and App Router config. `app/page.tsx` should render a minimal placeholder using the final product language: `Proof-sealed commerce`.

- [ ] **Step 3: Install dependencies**

Run: `pnpm install`

- [ ] **Step 4: Verify scaffold**

Run: `pnpm typecheck`

Expected: TypeScript passes.

### Task 2: Domain Types and Seed Data

**Files:**
- Create: `src/types/domain.ts`
- Create: `src/data/seed.ts`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Define domain types**

Include the spec models: brand config, pages, navigation, products, collections, cart, orders, customers, rewards, assets, game config/result, proof events, Receiz state, checkout state, auth state, hosting config, domain status, and publish state.

- [ ] **Step 2: Create seed data**

Create Boost Coffee seed data matching the references:

- Brand: `Boost Coffee`
- Domain: `boost.receiz.store`
- Products: Coffee Pack, Cold Brew, Ceramic Mug, Gift Card, Member Access, Brew Class, Limited Drop
- Rewards: `$12 reward`, Free shipping, VIP access
- Assets: Member Access, Limited Drop, Brew Class
- Proof events: `OBJECT_VERIFIED`, `REWARD_ISSUED`, `ASSET_RECEIZED`, `GAME_COMPLETED`, `ORDER_VERIFIED`

- [ ] **Step 3: Verify type usage**

Run: `pnpm typecheck`

Expected: TypeScript passes.

### Task 3: Mock Adapters

**Files:**
- Create: `src/lib/storage/mock-storage.ts`
- Create: `src/lib/auth/mock-auth.ts`
- Create: `src/lib/checkout/mock-checkout.ts`
- Create: `src/lib/hosting/mock-hosting.ts`
- Create: `src/lib/receiz/adapter.ts`

- [ ] **Step 1: Implement storage adapter**

Expose methods from the spec, backed by in-memory seed data and browser local storage helpers where client persistence is needed.

- [ ] **Step 2: Implement auth adapter**

Expose `getCurrentUser`, `signIn`, `signOut`, `requireAdmin`, and `requireCustomer` with sample admin/customer users.

- [ ] **Step 3: Implement checkout adapter**

Expose Receiz checkout session creation plus sandbox order confirmation for local demos. Sandbox checkout should create an order and append an `ORDER_VERIFIED` proof event.

- [ ] **Step 4: Implement hosting adapter**

Expose `getHostingStatus`, `claimSubdomain`, `connectCustomDomain`, `verifyDomain`, `setHostingMode`, and `getPublishChecklist`.

- [ ] **Step 5: Implement Receiz adapter**

Import `@receiz/sdk` in the module so the package is actually installed and type-visible. Expose mock-safe app methods: `connectReceiz`, `verifyObject`, `sealProduct`, `sealOrder`, `sealReward`, `sealAsset`, `sealGameResult`, `recordGameResult`, `issueReward`, `listAsset`, `sellAsset`, `tradeAsset`, `shareAsset`, `getProofTrail`.

- [ ] **Step 6: Verify adapters**

Run: `pnpm typecheck`

Expected: TypeScript passes and `@receiz/sdk` resolves.

### Task 4: Shared UI System

**Files:**
- Create: `src/components/icons.tsx`
- Create: `src/components/ui.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add design tokens**

Define CSS variables for near-white canvas, charcoal text, emerald/cyan proof accents, coral Boost color, gold reward color, borders, shadows, and 8px radii.

- [ ] **Step 2: Add primitives**

Create buttons, chips, cards, status pills, section headers, product thumbnails, reward cards, event timeline rows, metric panels, and app shell helpers.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck`

Expected: TypeScript passes.

### Task 5: Public Storefront

**Files:**
- Modify: `app/page.tsx`
- Create: `src/features/storefront/PublicStorefront.tsx`
- Create: `src/features/storefront/StoreShell.tsx`
- Create: `src/features/storefront/ProductCatalog.tsx`
- Create: `src/features/storefront/RewardDeck.tsx`
- Create: `src/features/storefront/SealEvents.tsx`

- [ ] **Step 1: Build desktop app shell**

Implement the desktop reference: left navigation, top search/domain/status bar, Boost Coffee commerce hero, quick action cards, optional play campaign, store catalog, right reward/account/event rail.

- [ ] **Step 2: Build responsive mobile layout**

At mobile widths, stack hero, Receiz connected card, quick actions, products, game, reward deck, Seal events, fork CTA, and bottom nav like the mobile reference.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck`

Expected: TypeScript passes.

### Task 6: Optional Game Module

**Files:**
- Create: `src/features/play/PlayCampaign.tsx`
- Create: `src/features/play/game-state.ts`

- [ ] **Step 1: Implement game state**

Create a small deterministic board with player position, collectibles, reward tiles, locked tiles, streak, beans, level, and score.

- [ ] **Step 2: Implement interactions**

Support arrow-key movement and on-screen tile selection. Collecting objects updates beans and appends local game events. Reaching reward thresholds issues a reward through the Receiz adapter.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck`

Expected: TypeScript passes.

### Task 7: Customer Account

**Files:**
- Create: `app/account/page.tsx`
- Create: `src/features/account/AccountDashboard.tsx`

- [ ] **Step 1: Build mock account page**

Show customer profile, orders, owned rewards, owned Receized assets, benefits, game progress, and proof trail.

- [ ] **Step 2: Verify**

Run: `pnpm typecheck`

Expected: TypeScript passes.

### Task 8: Admin Studio

**Files:**
- Create: `app/admin/page.tsx`
- Create: `src/features/admin/AdminStudio.tsx`
- Create: `src/features/admin/AdminShell.tsx`
- Create: `src/features/admin/BrandPanel.tsx`
- Create: `src/features/admin/PageBuilderPanel.tsx`
- Create: `src/features/admin/ProductEditorPanel.tsx`
- Create: `src/features/admin/RewardsRulesPanel.tsx`
- Create: `src/features/admin/HostingDomainsPanel.tsx`
- Create: `src/features/admin/PublishChecklist.tsx`

- [ ] **Step 1: Build admin shell**

Implement the final admin reference: sidebar, top bar, status cards, no-code setup grid, live storefront preview, and Seal events rail. Correct generated typo to `Seal events`.

- [ ] **Step 2: Add local admin interactions**

Let admin edit brand name/tagline, toggle game enabled, toggle checkout mode, claim subdomain, connect custom domain, and publish changes locally.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck`

Expected: TypeScript passes.

### Task 9: API Route Stubs

**Files:**
- Create: `app/api/store/route.ts`
- Create: `app/api/checkout/route.ts`
- Create: `app/api/receiz/route.ts`
- Create: `app/api/hosting/route.ts`

- [ ] **Step 1: Add route handlers**

Expose JSON route handlers backed by adapters so developers see where backend logic belongs.

- [ ] **Step 2: Verify**

Run: `pnpm typecheck`

Expected: TypeScript passes.

### Task 10: Documentation

**Files:**
- Create: `README.md`
- Create: `.env.example`

- [ ] **Step 1: Write README**

Document demo mode, hosted path concept, self-host/fork path, Receiz SDK adapter, checkout rail, auth rail, hosting/domain automation, and customization workflow.

- [ ] **Step 2: Add environment example**

Include non-secret placeholders for Receiz mode, Receiz checkout mode, Receiz auth mode, hosting mode, and public site URL.

### Task 11: Verification

**Files:**
- No new files unless fixing defects.

- [ ] **Step 1: Build**

Run: `pnpm build`

Expected: Next.js production build succeeds.

- [ ] **Step 2: Run local app**

Run: `pnpm dev`

Expected: dev server starts.

- [ ] **Step 3: Browser QA**

Verify:

- Desktop storefront matches `docs/design-references/proof-commerce-desktop-storefront.png`.
- Mobile storefront matches `docs/design-references/proof-commerce-mobile-storefront.png`.
- Admin studio matches `docs/design-references/proof-commerce-admin-studio.png`, with `Seal events` text corrected.
- Core interactions work: cart/mock checkout, admin edit/toggle/publish, hosted domain mock state, Receiz connect, seal object/order/reward/asset, optional game reward.

- [ ] **Step 4: Commit**

Stage and commit implementation with:

```bash
git add .
git commit -m "feat: build proof-sealed commerce template"
```
