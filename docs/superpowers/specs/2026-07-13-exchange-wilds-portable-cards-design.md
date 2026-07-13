# Receiz Exchange and Wilds Portable Cards Design

**Date:** 2026-07-13  
**Status:** Approved for implementation planning

## Objective

Make the Exchange a complete same-surface market for verified Receiz assets, and expand Receiz Wilds into a 250-species collectible creature system whose cards become portable proof assets at the moment of collection.

The product must preserve two core promises:

1. A user is never redirected to `receiz.com` during identity, verification, upload, purchase, settlement, download, or recovery.
2. A collected Wilds creature is already sealed, portable, downloadable, traceable, and eligible for later Exchange listing. Collection and sealing are one action.

## Scope and implementation order

This design contains two connected workstreams with one shared verified-asset boundary.

1. **Portable asset foundation:** canonical asset packages, local verification, proof lineage, inventory projection, download, and synchronization.
2. **Wilds collection system:** 250 base species, three stages per species, capture rewards, progression, inventory, and card rendering.
3. **Durable Exchange:** verified uploads, listings, orders, same-surface settlement, ownership transfer, recovery, and reconciliation.

The two seeded Exchange assets remain available as clearly labeled demo markets. They are never presented as settled live markets. User-uploaded assets and sealed Wilds cards appear alongside them only after verification and eligibility checks.

## Product language and original identity

Receiz Wilds uses familiar collectible-creature concepts without copying another franchise's protected names, creatures, card frames, symbols, capture devices, terminology, or visual trade dress.

The capture device is the **Receiz Capsule**. It has its own silhouette, opening motion, proof-ring motif, colors, sound treatment, and seal animation. Cards use an original Receiz Wilds frame system and original rarity names while retaining the readability players expect from premium collectible cards.

## Architecture

### Shared verified-asset service

All portable assets enter the same application service, regardless of source:

- uploaded Receiz proof object;
- locally collected Wilds card;
- evolved Wilds card;
- imported wallet asset;
- future MCP or proof-id ingestion.

The service accepts a canonical asset package and returns one of these outcomes:

- `sealed_local`: cryptographically sealed and locally verifiable, but not yet synchronized;
- `verified`: synchronized, currently valid, and portable;
- `listed`: verified and admitted to an Exchange market;
- `suspended`: retained in inventory but blocked from market actions;
- `revoked`: verification failed against a newer authoritative head.

The service owns schema validation, digest calculation, proof lineage, owner/custody checks, duplicate detection, eligibility, synchronization state, and safe error classification. UI components consume projections and never manufacture verified status.

### Durable command boundary

Financial and ownership mutations run through server routes and typed application commands. Browser state is an optimistic cache, not the authority.

Commands include:

- `collectCreature`;
- `evolveCreature`;
- `syncPortableAsset`;
- `uploadVerifiedAsset`;
- `createListing`;
- `previewTrade`;
- `placeBuyOrder`;
- `placeSellOrder`;
- `cancelOrder`;
- `resumeSettlement`;
- `downloadAssetPackage`.

Every command includes tenant scope, actor identity, idempotency key, source, timestamp, and expected proof head. Commands return the authoritative next projection plus a receipt or a recoverable pending operation.

## Wilds creature catalog

### Catalog size and families

The catalog contains **250 original base species**. Every species has three collectible stages, yielding **750 collectible forms**:

- Stage I: discovered wild form;
- Stage II: bonded evolution;
- Stage III: apex evolution.

The existing Mintcub, Voltray, Ledgerfox, and Titanseal characters remain as flagship species and receive complete three-stage families.

Each species definition includes:

- stable species and form identifiers;
- unique name, silhouette family, habitat, element, temperament, lore, and role;
- stage and lineage identifiers;
- health, power, guard, speed, bond, and ability stats;
- primary and secondary abilities;
- discovery conditions and habitat coordinates;
- evolution requirements;
- rarity tier and optional foil treatment;
- palette, markings, anatomy traits, and render recipe;
- card number, set code, and proof schema version;
- Exchange eligibility policy.

Catalog data is deterministic and versioned. Save restoration resolves stable identifiers rather than array positions. New catalog versions cannot silently change the identity, stats, rarity, or lineage of an already collected card.

### Rarity and foil treatment

The rarity system is original to Wilds and distinguishes ordinary rarity from print treatment. Rarity affects discovery probability and progression requirements. Foil treatment is a card presentation attribute and does not fabricate market value.

Initial rarity tiers are:

- Trail;
- Uncommon;
- Rare;
- Mythic;
- Eternal.

Eligible treatments include standard, shimmer, prism, and eternal foil. Foil effects respond to pointer or device tilt, respect reduced-motion preferences, remain readable without animation, and are represented in exported card artwork.

### Evolution

Evolution never replaces or erases a collected card. It appends a lineage event and unlocks the next form.

An evolution requires explicit, deterministic progression such as level, XP, bond, mission completion, habitat item, or a combination recorded in the species definition. The reducer verifies requirements before emitting an evolution command.

The evolved form receives its own portable asset identifier while linking to:

- the base collection proof;
- the prior form;
- the evolution event;
- the current owner;
- the catalog version and stat basis.

The inventory shows the active form prominently and retains the full lineage. A player can download any unlocked form, but only a currently owned, eligible form may be listed.

## Atomic capture, reward, and sealing flow

Collection and sealing are one user action and one idempotent domain operation.

1. The player enters discovery range and chooses to capture the creature.
2. The Receiz Capsule animation begins and temporarily locks duplicate capture input.
3. The game resolves the deterministic encounter result.
4. On success, the client creates the canonical card payload, including creature form, stats, catalog version, encounter coordinates, owner identity, and capture timestamp.
5. The local sealing service hashes the payload, creates the proof envelope, appends the collection event, and immediately runs the offline verifier.
6. The reducer commits the collected creature only after local verification succeeds.
7. A reward reveal presents the finished card, rarity, foil treatment, stats, and portability status.
8. The card appears in inventory with `sealed_local` or `verified` state.
9. When online, synchronization runs immediately. When offline, the verified local package enters a durable retry queue.
10. Synchronization upgrades the same asset to `verified`; it does not mint a second card.

If sealing fails, the creature is not partially collected. The capsule reopens into a recoverable error state and the encounter remains available. Replaying a successful operation with the same idempotency key returns the original card and cannot create duplicates.

## Inventory and card presentation

### Inventory

The Wilds inventory supports:

- search by creature, species, ability, habitat, and card number;
- filters for stage, rarity, foil treatment, verification state, ownership, and listing state;
- family and set completion views;
- card grid and focused card detail;
- evolution progress and requirements;
- proof history and synchronization status;
- download and Exchange actions.

Locked creatures use silhouettes and discovery hints without exposing secret forms. Large catalogs use windowed rendering and progressively loaded artwork so 750 forms do not inflate initial JavaScript or image payloads.

### Card anatomy

Every card has:

- original Wilds frame and set mark;
- creature artwork;
- creature name, form stage, species, rarity, and card number;
- health, power, guard, speed, and bond;
- abilities with concise rules text;
- habitat and lore line;
- evolution link and requirement;
- owner and proof state in the digital detail view;
- a scannable local verification payload or compact verification reference;
- foil treatment when applicable.

The screen card remains semantic, keyboard accessible, and screen-reader understandable. Decorative foil layers do not obscure names, stats, or proof status.

### Offline download

The download action produces a portable package without navigating away from the app:

- a high-resolution PNG card image;
- a canonical JSON manifest;
- the local proof envelope and digest;
- lineage references;
- verification instructions and a locally usable verifier payload.

The image alone is a collectible representation. The complete package is the verifiable portable asset. Downloads use the browser's native save behavior and do not expose access tokens or private identity material.

## Exchange asset ingestion

### Accepted sources

The Exchange accepts:

- the two built-in demo assets;
- uploaded Receiz proof packages;
- synchronized Wilds portable cards;
- future wallet-selected assets that pass the same service.

### Admission checks

Before a non-demo asset appears in the market, the server checks:

- supported schema and artifact size;
- signature and digest validity;
- proof chain and latest known head;
- current owner and custody;
- revocation and suspension status;
- duplicate asset and duplicate listing status;
- actor authority to list;
- asset-class and tenant eligibility;
- a positive seller ask in integer minor units.

Client-supplied names, owners, proof fields, and verification states are never trusted over the verified package. Rejected uploads stay out of the market and receive a specific corrective message.

### No external redirects

All user-facing links and actions resolve within the current Receiz app, tenant subdomain, merchant domain, an embedded same-surface panel, or the offline verifier.

Canonical upstream URLs may remain inside private proof metadata when required for provenance, but they are never used as navigation targets. Existing `receiz.com` verification links in seeded and projected UI are replaced by local verification routes. Brand image resources are served locally rather than fetched through clickable external navigation.

## Listings, orders, and settlement

### Listings and orders

A verified owner creates a signed ask with asset, quantity, price, currency, expiration, and idempotency key. For unique creature cards, quantity is one unless a future edition schema explicitly supports copies.

Buy and sell orders are durable records. Matching uses deterministic price-time priority. Order books are projections of open orders; charts and trade history use settled fills only.

The two demo markets retain simulated order books and show `Demo market`. Real uploaded or Wilds assets show seller asks and verified settlement provenance. Demo liquidity, volume, and price movement are never labeled live.

### Same-surface buy flow

1. The buyer selects Buy and receives an in-app preview.
2. The server revalidates asset status, seller ownership, quantity, order state, tenant, buyer permissions, and proof head.
3. The server creates an expiring quote and reserves the matched quantity.
4. The app reads the buyer's actual available Receiz wallet balance.
5. It calculates `walletApplied = min(walletAvailable, total)` and `cardDelta = total - walletApplied` in integer cents.
6. If `cardDelta` is positive, an embedded payment panel opens inside the app. The buyer is never redirected.
7. Verified payment completion triggers wallet transfer, seller settlement, fees, ownership append, and proof-head update with stable idempotency keys.
8. The fill becomes settled only after all required rails return durable receipts.
9. Buyer and seller inventory projections, the order book, trade tape, and card proof lineage update from the authoritative result.
10. The dialog shows the receipt and returns focus to the initiating control when closed.

If wallet reservation is unavailable, wallet transfer waits until embedded card completion. A card failure releases the asset reservation and leaves ownership unchanged. An interrupted successful payment creates a reconcilable pending settlement, never a fabricated completed trade.

## Persistence and synchronization

Portable assets, listings, orders, fills, ownership, proof heads, and settlement receipts are authoritative server/Receiz records. Browser storage caches gameplay and pending local proof packages for offline continuity.

The game save schema advances from v2 and includes a migration for the existing four-card save. Corrupt or outdated entries are isolated rather than resetting valid collected assets. Cross-tab updates invalidate cached projections and reload the authoritative inventory.

Offline capture is permitted because local verification is self-contained. Exchange listing, buying, selling, authoritative ownership transfer, and synchronization require connectivity and fresh authority.

## Error and recovery behavior

Every asynchronous operation exposes pending, success, retryable failure, terminal failure, and recovery states.

- **Capture/seal failure:** do not collect; preserve encounter; allow retry.
- **Offline synchronization:** keep the locally verified card downloadable; show queued status; retry safely.
- **Verification conflict:** quarantine the asset from Exchange; preserve the local package and explain the conflict.
- **Duplicate upload or capture:** return the existing asset and select it.
- **Listing conflict:** refresh ownership and open-order state before retry.
- **Payment cancellation/failure:** release reservations; transfer no ownership.
- **Settlement interruption:** show pending settlement; reconcile by idempotency key.
- **Revocation or suspension:** retain audit history; disable new orders and downloads that claim current verification.

Messages explicitly state whether collection, money movement, ownership, listing state, or synchronization changed.

## Security and trust boundaries

- Never expose service credentials, identity secrets, wallet tokens, or payment data to the browser or exported package.
- Verify tenant and actor authority on every server mutation.
- Bind uploaded manifests to verified artifact data and current ownership.
- Enforce size, content-type, schema, and rate limits on uploads.
- Use raw-body signature validation and replay protection for payment webhooks.
- Use integer minor units for prices and settlement calculations.
- Require idempotency for capture, synchronization, listing, order, and settlement commands.
- Treat local proof as portable evidence, not authority for financial settlement until synchronized.
- Record safe audit receipts for every ownership and money transition.

## Performance targets

- Do not render all 750 3D creatures simultaneously.
- Stream encounters by world region and deterministic spawn seed.
- Keep only nearby creature render recipes in the active scene.
- Virtualize the inventory grid and lazy-load card artwork.
- Generate exported high-resolution cards on demand.
- Keep the game playable when card export, synchronization, or network services are unavailable.
- Preserve current billion-unit streamed terrain behavior.

## Accessibility requirements

- Capture, inventory, evolution, download, listing, and purchase flows work by keyboard.
- Reward reveals move focus predictably and announce the collected creature, rarity, and verification state.
- Foil and capture motion respect `prefers-reduced-motion`.
- Rarity and market state never rely on color alone.
- Cards expose meaningful text alternatives and stat summaries.
- Embedded payment restores focus and announces success, cancellation, or failure.
- Touch targets meet WCAG 2.2 AA target-size guidance.

## Test strategy and release gates

### Unit and contract tests

- catalog contains exactly 250 unique base species and 750 unique forms;
- every family has three valid stages and an acyclic lineage;
- identifiers, card numbers, names, render recipes, and proof coordinates are unique;
- rarity and foil assignments satisfy configured distribution rules;
- capture is atomic and idempotent;
- successful capture produces a locally verifiable portable asset;
- failed sealing leaves inventory unchanged;
- offline capture queues one synchronization operation;
- evolution enforces requirements and appends lineage without erasing earlier forms;
- save migration preserves the original four companions;
- uploaded assets cannot override verified owner or manifest fields;
- duplicate, revoked, mismatched, oversized, and unauthorized assets are rejected;
- only verified owned assets can be listed;
- trade preview uses wallet first and card only for the delta;
- failed or interrupted payment cannot transfer ownership;
- settled fills update both inventories and provenance exactly once;
- all projected navigation targets remain local.

### Browser end-to-end tests

- capture a creature, observe the reward reveal, find it in inventory, and download its package;
- capture while offline, reload, retain the card, reconnect, and synchronize once;
- train and evolve a complete three-stage family;
- search and filter a large inventory without layout or performance failure;
- upload a valid Receiz asset and see it added beside the two demo assets;
- reject a tampered or unauthorized asset with no listing created;
- list a sealed Wilds card, buy it through embedded wallet/card settlement, and observe ownership transfer;
- refresh and open another tab/device projection to confirm durable market state;
- verify no tested path navigates to `receiz.com`;
- verify desktop and mobile layouts, keyboard flow, focus restoration, reduced motion, and screen-reader announcements.

### Visual and performance gates

- flagship creatures have distinct authored silhouettes across all three stages;
- procedural families remain visually distinguishable and avoid palette-only variation;
- standard and foil cards remain readable at mobile and export resolutions;
- no inventory overflow or unbounded DOM growth at 750 forms;
- active world rendering stays within the existing frame-time budget;
- exported card images match the visible card content and include complete stats.

## Acceptance criteria

The feature is complete only when:

1. The catalog exposes 250 original base species and 750 collectible forms.
2. Capturing a creature atomically seals it and places a portable card in inventory.
3. The player can download the complete card package immediately, including offline.
4. Three-stage evolution preserves verifiable lineage.
5. The Exchange starts with two labeled demo assets and admits verified uploads and synchronized Wilds cards.
6. Invalid or unauthorized assets never enter the market.
7. Buy and sell flows persist orders, settlement, ownership, receipts, and projections end to end.
8. Users never navigate to `receiz.com` from any product workflow.
9. Offline, retry, duplicate, interruption, and recovery paths are deterministic and tested.
10. Mobile, accessibility, performance, and visual-quality gates pass.
