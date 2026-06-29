# Branded Rewards Game Template Design

Date: 2026-06-29

## Purpose

Build a forkable Receiz template app that lets a brand launch its own proof-powered rewards program. The template should feel like a complete app body a developer can clone and extend, not a toy demo or a marketing page.

The core offer is:

> Clone this. Change the theme. Set reward rules. Choose what objects qualify. Connect Receiz. Launch a branded rewards game where users prove objects, complete actions, earn rewards, and share or trade verified value.

## Product Positioning

The app is a branded rewards game system powered by Receiz. A brand uses it to create campaigns around verified objects and user actions. Rewards can be coupons, access passes, benefit unlocks, collectible cards, membership status, event entry, premium content, leaderboard perks, Receized assets, sellable items, or claims to the thing itself.

The template should show enough product surface to be useful as a starting point:

- Brand-controlled rewards program shell
- Configurable theme and program copy
- Qualifying object rules
- Receiz connection and verification flow
- Fun game/challenge module
- Reward cards and benefit catalog
- Optional list, sell, trade, and share behavior for Receized assets
- Visible proof trail for every meaningful state change

The game is not the whole app. It is the engagement module inside a reusable rewards program substrate.

## Target Users

Primary users:

- Developers who want a ready-to-fork Receiz app starter.
- Brands that want a rewards system inside their company or community.
- Receiz builders proving the public SDK can support a real independent application.

Secondary users:

- Consumers or members who interact with a branded campaign, verify an object, complete a game/action, and earn a reward.

## Experience Summary

The first screen should be the product, not a landing page. It opens into a polished app shell for a sample brand rewards program.

Recommended sample brand:

- Name: Boost Coffee Rewards
- Program concept: receipts, visits, streaks, and challenges become verified rewards.
- Reward examples: coupon card, access pass, 2x points booster, rare collectible benefit card.

Primary user loop:

1. Clone the template.
2. Change the theme.
3. Set reward rules.
4. Choose qualifying objects.
5. Connect Receiz.
6. Verify object.
7. Enter object into the game or campaign.
8. Score, rank, or complete an action.
9. Earn a Receized reward or asset.
10. Redeem, list, sell, trade, or share.
11. Prove everything through the event trail.

## App Routes

### Program

Default route. Shows the branded rewards program overview, active campaign, metrics, reward rules, and Receiz status.

Core elements:

- Brand header and connected state
- Campaign spotlight
- Program metrics
- Reward rule examples
- Reward card preview
- Proof event trail

### Campaigns

Shows active and draft campaigns. Each campaign connects qualifying objects to a game/action loop and reward outcomes.

Campaign fields:

- Name
- Brand
- Description
- Eligible object types
- Score rule
- Reward type
- Start/end status
- Claim count

### Qualifiers

Lets the builder define what objects qualify for the program.

Initial object types:

- Receipt
- Ticket
- Visit
- Purchase
- Attendance
- Achievement
- Uploaded artifact
- Custom object

Each object type has human-readable criteria and mock metadata so the template runs without live credentials.

### Play

A fun, lightweight game/challenge surface. It should be simple enough to understand immediately and replace later.

Initial game module:

- 2D tile collection challenge built with React state and DOM/CSS, not a heavy engine.
- Users collect branded objects, build streaks, trigger score multipliers, and unlock reward cards.
- The board should be visually playful but remain secondary to the rewards program.
- Game results create local proof-style events through the Receiz adapter.

### Rewards

Reward inventory, asset catalog, and benefit catalog.

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

Marketplace behavior is program-controlled. The template should show that a brand can keep rewards private, make them redeem-only, or allow Receized assets to be listed, sold, traded, and shared.

### Asset Market

Shows the optional sell/list/trade layer for Receized rewards and assets.

Asset market fields:

- Asset name
- Asset type
- Brand
- Owner/member
- Proof source
- Status: redeemable, listed, sold, traded, locked, expired
- Price or trade terms
- Proof trail

The asset market should make clear that brands decide what can be sold. Some rewards are coupons or access benefits, while others are Receized assets that can move between users.

### Members

Shows sample member progress, reward status, and recent verified actions. This route should be useful to brands evaluating how the program could work internally.

### Builder

Developer and brand configuration route.

Controls:

- Brand name
- Logo text or mark
- Accent colors
- Program headline
- Reward card copy
- Qualifying object toggles
- Reward rule editor
- Mock/live SDK mode

Configuration should persist in local storage so the template feels alive after clone.

### Receiz

SDK status and integration reference route.

Shows:

- Installed SDK package
- Environment mode
- Mock adapter state
- Connect flow
- Verification events
- Reward events
- Example payloads
- Clear code pointers for where developers customize integration

## SDK Integration Boundary

Install `@receiz/sdk` and build a small adapter layer so the rest of the app does not depend directly on SDK implementation details.

The app should support two modes:

- Mock mode: default. Runs fully after clone with local demo data.
- Live mode: uses `@receiz/sdk` when credentials/environment are configured.

The adapter should expose stable app-level methods:

- `connectReceiz()`
- `verifyObject(object)`
- `enterCampaign(verifiedObject, campaign)`
- `recordGameResult(result)`
- `issueReward(rewardInput)`
- `listReward(rewardId)`
- `sellReward(rewardId, terms)`
- `tradeReward(rewardId)`
- `shareReward(rewardId)`
- `getProofTrail()`

If the SDK exports differ from these names, the adapter maps the template API to the actual SDK surface. The UI should only call the adapter.

## Data Model

Use TypeScript types for the template domain:

- `BrandConfig`
- `RewardProgram`
- `Campaign`
- `QualifyingObjectType`
- `VerifiedObject`
- `GameResult`
- `RewardRule`
- `Reward`
- `ReceizedAsset`
- `AssetListing`
- `MemberProfile`
- `ProofEvent`
- `ReceizConnectionState`

Sample data should live separately from UI components so developers can replace it quickly.

## Visual Direction

The frontend should feel credible for both developers and brands:

- Clean, premium, app-first interface.
- Near-white canvas with charcoal text.
- Cyan/emerald trust accents.
- Small coral/gold reward moments.
- Restrained shadows.
- 8px radii for cards, panels, buttons, and controls.
- Dense enough to feel useful, not a sparse hero page.
- Playful reward cards and game board without making the whole app childish.

Avoid:

- Uniswap visual imitation.
- Crypto swap patterns as the main UI.
- Purple-blue gradient dominance.
- Dark-only dashboard.
- Beige/cream/brown theme.
- Decorative blobs, bokeh, or oversized orb backgrounds.
- Generic landing page hero.
- Nested cards inside cards.

## Component Architecture

Use React + Vite + TypeScript.

Suggested modules:

- `src/app`: routing, shell, app state composition
- `src/components`: shared UI primitives
- `src/features/program`: overview and metrics
- `src/features/campaigns`: campaign list and details
- `src/features/qualifiers`: object criteria UI
- `src/features/play`: game module
- `src/features/rewards`: reward cards and actions
- `src/features/members`: member progress
- `src/features/builder`: brand and rule editor
- `src/features/receiz`: SDK status and proof trail
- `src/lib/receiz`: SDK adapter and mock adapter
- `src/data`: sample brand, campaigns, rewards, and members
- `src/types`: shared domain types

Keep `App` as composition glue. Avoid a single giant component.

## Interaction Requirements

The template must be interactive enough to prove the product loop:

- Change brand settings and see the UI update.
- Toggle qualifying object types.
- Connect Receiz in mock mode.
- Verify a sample object.
- Play the reward challenge.
- Earn a reward or Receized asset from a rule.
- View proof events.
- Claim, redeem, share, list, sell, and trade reward actions locally.

The app can simulate server-backed state locally, but the state transitions should be real in the browser.

## Non-Goals

This template will not include:

- Proprietary Receiz marketplace economics.
- Real production redemption settlement.
- A full backend.
- Real payments.
- A generic token swap interface.
- A hard dependency on private Receiz app code.
- A complex custom game engine.

## Verification Plan

Before implementation is considered complete:

- Install `@receiz/sdk`.
- Confirm TypeScript can import the package.
- Run typecheck/build.
- Run the app locally.
- Verify desktop and mobile layouts.
- Click through the core loop: connect, verify object, play, earn reward or asset, view proof, redeem/list/sell/trade/share.
- Confirm mock mode works without credentials.
- Confirm SDK usage is isolated in the adapter.
- Inspect the rendered UI against the approved visual/product direction.

## Approval

This spec reflects the approved direction: a fun branded rewards program template where brands can create coupons, access passes, benefits, collectible cards, sellable Receized assets, and other reward experiences using the Receiz SDK.
