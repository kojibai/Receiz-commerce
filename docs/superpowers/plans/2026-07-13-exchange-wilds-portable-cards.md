# Exchange and Wilds Portable Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 250 original three-stage Wilds creature families whose cards are atomically sealed and downloadable on capture, then admit synchronized cards and verified uploads to a durable, same-surface Exchange.

**Architecture:** Add a deterministic, versioned creature catalog and a pure portable-asset domain layer before touching React. Wilds reducers consume those interfaces for atomic capture/evolution, while focused UI components render inventory, card export, and reward states. Existing Receiz proof-state publication remains the durable authority for listings and settled ownership; the browser is an offline cache and never creates financial truth.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.6, Three.js/React Three Fiber, `@receiz/sdk` 99, Node test runner, existing Receiz adapter and proof-state store.

## Global Constraints

- The catalog contains exactly 250 original base species and exactly 750 collectible forms.
- Every family has Stage I, Stage II, and Stage III with stable, acyclic lineage.
- Capture and local proof sealing are one atomic, idempotent action.
- A captured card is immediately downloadable; offline cards synchronize later without being reminted.
- The Exchange retains exactly two seeded assets labeled `Demo market` and admits only verified owned uploads or synchronized Wilds cards.
- No product workflow navigates to `receiz.com`; verification uses `/verify` and payment stays embedded.
- Prices and wallet/card calculations use integer cents.
- Do not render all 750 creatures in the 3D scene or all 750 cards in the inventory DOM.
- Preserve the current billion-unit streamed terrain behavior and existing save migration.
- New behavior follows strict red-green-refactor: every production edit starts with a failing test.

---

## File structure

- `src/features/play/creature-catalog.ts`: deterministic 250-family/750-form catalog and lookup helpers.
- `src/features/play/portable-card.ts`: canonical card manifest, local seal, verification, lineage, and download payload.
- `src/features/play/game-state.ts`: gameplay reducer, atomic capture, inventory ownership, synchronization state, and evolution.
- `src/features/play/card-export.ts`: deterministic SVG/PNG-ready card document and downloadable package creation.
- `src/features/play/WildsCard.tsx`: accessible original Wilds card presentation and foil variants.
- `src/features/play/WildsInventory.tsx`: searchable, filtered, windowed inventory and detail actions.
- `src/features/play/WildsCaptureReward.tsx`: Receiz Capsule capture and sealed-card reward state.
- `src/features/play/PlayCampaign.tsx`: composition, persistence migration, capture orchestration, inventory/reward controls.
- `src/features/play/WildsWorldCanvas.tsx`: region-based encounter projection and scalable creature render recipes.
- `src/lib/exchange/asset-admission.ts`: unified upload/Wilds asset admission and local verification URL projection.
- `src/lib/exchange/exchange-command.ts`: listing and trade command validation/idempotency boundary.
- `app/api/exchange/route.ts`: verified upload and listing HTTP adapter.
- `app/api/exchange/trade/route.ts`: same-surface durable trade command HTTP adapter.
- `src/lib/storage/use-template-store.ts`: client command calls and authoritative projection updates only.
- `src/features/storefront/PublicStorefront.tsx`: Exchange status, uploads, local verification, and pending settlement UI.
- `app/globals.css`: card, inventory, capsule, foil, responsive, and reduced-motion styles.
- `tests/creature-catalog.test.ts`: catalog cardinality, lineage, uniqueness, and rarity contracts.
- `tests/portable-card.test.ts`: local seal, verification, export package, idempotency, and tamper rejection.
- `tests/play-game-state.test.ts`: capture/evolution/save migration behavior.
- `tests/card-export.test.ts`: export content and escaping.
- `tests/exchange-asset-admission.test.ts`: ownership, verification, duplicate, and local URL enforcement.
- `tests/exchange-command.test.ts`: listing/trade authorization and idempotency.
- `tests/no-receiz-redirects.test.ts`: static redirect and navigation contract.
- `tests/wilds-render-contract.test.ts`: streaming, inventory windowing, reward, and reduced-motion contracts.
- `tsconfig.test.json`: include the new pure domain modules.

---

### Task 1: Versioned 250-family creature catalog

**Files:**
- Create: `src/features/play/creature-catalog.ts`
- Create: `tests/creature-catalog.test.ts`
- Modify: `tsconfig.test.json`

**Interfaces:**
- Produces: `CreatureForm`, `CreatureFamily`, `CREATURE_CATALOG_VERSION`, `creatureFamilies`, `creatureForms`, `creatureForm(id)`, and `formsForFamily(familyId)`.
- Consumes: no game-state or React dependencies.

- [ ] **Step 1: Write the failing catalog contract**

```ts
it("defines 250 unique three-stage families and 750 unique forms", () => {
  assert.equal(creatureFamilies.length, 250);
  assert.equal(creatureForms.length, 750);
  assert.equal(new Set(creatureFamilies.map((family) => family.id)).size, 250);
  assert.equal(new Set(creatureForms.map((form) => form.id)).size, 750);
  for (const family of creatureFamilies) {
    assert.deepEqual(formsForFamily(family.id).map((form) => form.stage), [1, 2, 3]);
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm test`

Expected: TypeScript fails because `creature-catalog.ts` does not exist.

- [ ] **Step 3: Implement the deterministic catalog**

Define explicit flagship families for Mintcub, Voltray, Ledgerfox, and Titanseal. Build the remaining 246 families from stable, checked-in vocabulary tables and index-derived render recipes. Each form must include `id`, `familyId`, `stage`, `name`, `species`, `habitat`, `element`, `rarity`, `foil`, `stats`, `abilities`, `palette`, `anatomy`, `cardNumber`, `positionSeed`, and stage requirements. Freeze exported arrays and throw during module initialization if cardinality, identifier, card-number, or lineage invariants fail.

- [ ] **Step 4: Run the catalog test and full tests**

Run: `pnpm test`

Expected: catalog test passes and the existing suite remains green.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/creature-catalog.ts tests/creature-catalog.test.ts tsconfig.test.json
git commit -m "feat: add 250-family Wilds creature catalog"
```

### Task 2: Canonical portable-card seal and verifier

**Files:**
- Create: `src/features/play/portable-card.ts`
- Create: `tests/portable-card.test.ts`
- Modify: `tsconfig.test.json`

**Interfaces:**
- Consumes: `CreatureForm` and `CREATURE_CATALOG_VERSION` from Task 1.
- Produces: `PortableCardManifest`, `PortableCardAsset`, `sealCollectedCard(input)`, `verifyPortableCard(asset)`, `evolvePortableCard(input)`, and `portableCardExchangeAsset(asset, priceCents)`.

- [ ] **Step 1: Write failing seal, idempotency, tamper, and lineage tests**

```ts
const first = sealCollectedCard({ formId: "mintcub-1", ownerReceizId: "player.receiz.id", encounterId: "enc-1", capturedAt: NOW });
const replay = sealCollectedCard({ formId: "mintcub-1", ownerReceizId: "player.receiz.id", encounterId: "enc-1", capturedAt: NOW });
assert.deepEqual(replay, first);
assert.equal(verifyPortableCard(first).ok, true);
assert.equal(verifyPortableCard({ ...first, manifest: { ...first.manifest, ownerReceizId: "tampered" } }).ok, false);
```

Add an evolution assertion that Stage II references the Stage I asset id and collection proof digest.

- [ ] **Step 2: Run `pnpm test` and verify RED**

Expected: missing portable-card module.

- [ ] **Step 3: Implement canonical serialization and deterministic sealing**

Use sorted-key canonical JSON and a deterministic in-app `sha256:wilds-*` digest helper compatible with the existing pure test environment. The manifest schema is `receiz.wilds_card_manifest.v1`; asset ids derive from owner, form, and encounter id. Verification recomputes the digest and validates schema, catalog version, owner, form, stage, and lineage. Never include tokens or private identity material.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test`

Expected: portable-card and catalog tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/portable-card.ts tests/portable-card.test.ts tsconfig.test.json
git commit -m "feat: seal portable Wilds cards locally"
```

### Task 3: Atomic capture, inventory, and three-stage evolution reducer

**Files:**
- Modify: `src/features/play/game-state.ts`
- Modify: `tests/play-game-state.test.ts`

**Interfaces:**
- Consumes: catalog lookups and portable-card functions from Tasks 1-2.
- Produces: `CollectedCard`, `PlayState.inventory`, `PlayState.pendingSyncAssetIds`, new inputs `{ type: "capture"; encounterId: string }`, `{ type: "mark-synced"; assetId: string }`, and `{ type: "evolve"; assetId: string }`.

- [ ] **Step 1: Write failing atomic capture and evolution tests**

Assert one capture adds exactly one verified local asset, duplicate encounter replay returns the same inventory, failed/out-of-range capture changes nothing, and evolution cannot run before level/bond requirements. Assert a qualified Stage I evolves to Stage II with intact lineage and Stage I retained.

- [ ] **Step 2: Run `pnpm test` and verify RED**

Expected: missing inventory and capture/evolve action types.

- [ ] **Step 3: Implement the reducer and v2 save migration**

Replace the four-entry `creatureCards` source with catalog Stage I projections while preserving the four flagship encounter positions. Add deterministic regional encounter selection so only nearby candidates participate in `nearestCreature`. Migrate `discoveredCardIds` into sealed inventory records on restore and bump the schema to `receiz.wilds.save.v3`.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test`

Expected: original movement/training tests and new inventory/evolution tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/game-state.ts tests/play-game-state.test.ts
git commit -m "feat: make Wilds capture seal cards atomically"
```

### Task 4: Downloadable card document and portable package

**Files:**
- Create: `src/features/play/card-export.ts`
- Create: `tests/card-export.test.ts`
- Modify: `tsconfig.test.json`

**Interfaces:**
- Consumes: `PortableCardAsset` and catalog form lookups.
- Produces: `renderWildsCardSvg(asset)`, `portableCardPackage(asset)`, and `downloadPortableCard(asset)`.

- [ ] **Step 1: Write failing export tests**

Assert the SVG contains the exact creature name, card number, all five stats, abilities, rarity, stage, and proof digest. Assert unsafe text is XML-escaped. Assert the JSON package contains the manifest, proof envelope, lineage, and offline verification instructions.

- [ ] **Step 2: Run tests and verify RED**

Expected: missing card-export module.

- [ ] **Step 3: Implement export without external navigation**

Render a 750×1050 original Wilds SVG with stable geometry, palette, foil metadata, and an embedded compact proof reference. In the browser, rasterize SVG to a PNG via canvas and download both PNG and `.receiz-card.json` from object URLs. Revoke URLs after click; never call `window.location`.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test`

Expected: export content and escaping tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/card-export.ts tests/card-export.test.ts tsconfig.test.json
git commit -m "feat: export portable Wilds card packages"
```

### Task 5: Card, inventory, and Receiz Capsule reward UI

**Files:**
- Create: `src/features/play/WildsCard.tsx`
- Create: `src/features/play/WildsInventory.tsx`
- Create: `src/features/play/WildsCaptureReward.tsx`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `app/globals.css`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: `CollectedCard`, catalog lookups, `downloadPortableCard`, and reducer inputs.
- Produces: accessible card detail, windowed inventory, reward dialog, download action, and evolution action.

- [ ] **Step 1: Write failing render-contract tests**

Assert source includes `role="dialog"`, `aria-live`, `prefers-reduced-motion`, `wilds-capture-capsule`, `wilds-card-foil`, inventory search/filter controls, a bounded visible-card slice, download invocation, and evolution action.

- [ ] **Step 2: Run `pnpm test` and verify RED**

Expected: missing components/contracts.

- [ ] **Step 3: Implement focused components**

Use a distinctive proof-ring frame, original capsule geometry, semantic stat list, visible rarity text, and CSS foil overlays. Render at most 36 inventory cards per page. The reward dialog announces creature, rarity, foil, and `Sealed for offline use`, focuses the card title on open, and returns focus to the capture control on close.

- [ ] **Step 4: Run tests, typecheck, and lint**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected: all commands pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/WildsCard.tsx src/features/play/WildsInventory.tsx src/features/play/WildsCaptureReward.tsx src/features/play/PlayCampaign.tsx app/globals.css tests/wilds-render-contract.test.ts
git commit -m "feat: add Wilds card inventory and capture reward"
```

### Task 6: Stream 250 species through the 3D world

**Files:**
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Modify: `src/features/play/game-state.ts`
- Modify: `tests/wilds-render-contract.test.ts`
- Modify: `tests/play-game-state.test.ts`

**Interfaces:**
- Consumes: catalog `positionSeed`, anatomy, palette, and region encounter selection.
- Produces: `nearbyCreatureForms(player, radius)` and generic `CreatureDetails` render recipes supporting all families.

- [ ] **Step 1: Write failing streaming tests**

Assert distant player coordinates produce deterministic encounters, nearby results are bounded to 12, all 250 Stage I forms are reachable across sampled regions, and world source no longer hard-codes details solely for four ids.

- [ ] **Step 2: Run tests and verify RED**

Expected: missing regional encounter helper and bounded render contract.

- [ ] **Step 3: Implement deterministic region streaming and anatomy recipes**

Hash world-region coordinates into catalog indices, retain flagship starter positions, and render anatomy from catalog traits such as ears, horns, wings, tail, crest, shell, and aura. Keep React keys stable and render only the bounded nearby list.

- [ ] **Step 4: Run test/type/lint gates**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected: all pass with no regression to streamed terrain tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/WildsWorldCanvas.tsx src/features/play/game-state.ts tests/wilds-render-contract.test.ts tests/play-game-state.test.ts
git commit -m "feat: stream 250 Wilds species by region"
```

### Task 7: Unified verified asset admission and local verification URLs

**Files:**
- Create: `src/lib/exchange/asset-admission.ts`
- Create: `tests/exchange-asset-admission.test.ts`
- Modify: `src/lib/exchange/listing-authority.ts`
- Modify: `app/api/exchange/route.ts`
- Modify: `tsconfig.test.json`

**Interfaces:**
- Consumes: existing `verifiedExchangeAsset`, `PortableCardAsset`, Receiz SDK verification response, actor identity, and tenant host.
- Produces: `admitUploadedAsset(input)`, `admitWildsCard(input)`, `localAssetVerifyPath(manifest)`, and typed admission errors.

- [ ] **Step 1: Write failing admission tests**

Assert valid uploaded proof and synchronized Wilds cards are admitted, while mismatched owner, tampered digest, local-only unsynchronized card, duplicate asset id, and invalid price are rejected. Assert every returned verify link begins `/verify?`.

- [ ] **Step 2: Run `pnpm test` and verify RED**

Expected: missing admission module.

- [ ] **Step 3: Implement the unified boundary**

Move source-specific parsing behind admission functions, keep authoritative fields from verified artifacts, map proof metadata to local verification routes, and preserve upstream URLs only as non-navigable provenance fields. Update the POST route to use the boundary and retain publication/sync behavior.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test`

Expected: listing authority, market truth, and new admission tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/exchange/asset-admission.ts src/lib/exchange/listing-authority.ts app/api/exchange/route.ts tests/exchange-asset-admission.test.ts tsconfig.test.json
git commit -m "feat: admit verified uploads and Wilds cards"
```

### Task 8: Durable idempotent Exchange commands and trade route

**Files:**
- Create: `src/lib/exchange/exchange-command.ts`
- Create: `tests/exchange-command.test.ts`
- Create: `app/api/exchange/trade/route.ts`
- Modify: `app/api/checkout/route.ts`
- Modify: `src/lib/storefront/proof-exchange.ts`
- Modify: `tsconfig.test.json`

**Interfaces:**
- Consumes: proof-state store, settlement receipt, actor/tenant authority, `buildExchangeTradePreview`, and state reducers.
- Produces: `createExchangeListing(command)`, `settleExchangeTrade(command)`, `ExchangeCommandResult`, and an HTTP POST trade adapter.

- [ ] **Step 1: Write failing command tests**

Assert listing requires verified ownership; trade requires a live matched ask and settlement receipt; replaying a settlement id returns the prior state; failed payment leaves ownership/order book unchanged; successful settlement changes ownership and order book exactly once.

- [ ] **Step 2: Run tests and verify RED**

Expected: missing command module.

- [ ] **Step 3: Implement server command orchestration**

Validate tenant, actor, proof head, order, quantity, integer cents, and idempotency before applying reducers. Publish the resulting record through the existing store-state publication service. Make checkout call this command only after a verified paid result; do not accept client `paid` flags as authority.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test`

Expected: checkout, settlement, exchange, and command tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/exchange/exchange-command.ts app/api/exchange/trade/route.ts app/api/checkout/route.ts src/lib/storefront/proof-exchange.ts tests/exchange-command.test.ts tsconfig.test.json
git commit -m "feat: settle Exchange trades through durable commands"
```

### Task 9: Wire inventory listings and remove external redirects

**Files:**
- Modify: `src/lib/storage/use-template-store.ts`
- Modify: `src/features/storefront/PublicStorefront.tsx`
- Modify: `src/components/ui.tsx`
- Modify: `src/data/seed.ts`
- Create: `tests/no-receiz-redirects.test.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: admission and command routes, portable Wilds package, local verify paths, embedded payment session.
- Produces: inventory-to-Exchange listing action, same-surface trade action, local brand resources, and user-facing pending/recovery states.

- [ ] **Step 1: Write failing redirect and integration contracts**

Scan user-facing TS/TSX/seed source and assert no anchor, `window.location`, success URL, cancel URL, or clickable brand resource targets `receiz.com`. Assert Exchange begins with exactly two demo assets and upload/list actions remain present.

- [ ] **Step 2: Run tests and verify RED**

Expected: current external badge URLs and seeded verification URLs violate the contract.

- [ ] **Step 3: Wire server routes and local navigation**

Replace clickable verification links with `/verify`, serve badge assets locally, and preserve embedded checkout. Add Wilds inventory `List on Exchange` for synchronized owned assets; post its portable package through admission. Update client state only from authoritative route responses and surface pending sync/settlement recovery.

- [ ] **Step 4: Run all static gates**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`

Expected: all pass, with exactly two demo seed markets.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage/use-template-store.ts src/features/storefront/PublicStorefront.tsx src/components/ui.tsx src/data/seed.ts app/globals.css tests/no-receiz-redirects.test.ts public
git commit -m "feat: keep verified Exchange flows inside the app"
```

### Task 10: Browser verification, accessibility, and release evidence

**Files:**
- Modify as required by observed defects: `src/features/play/*.tsx`, `src/features/storefront/PublicStorefront.tsx`, `app/globals.css`
- Create: `output/playwright/wilds-card-inventory.png`
- Create: `output/playwright/wilds-capture-reward.png`
- Create: `output/playwright/exchange-verified-asset.png`

**Interfaces:**
- Consumes: completed application.
- Produces: verified desktop/mobile workflows and screenshots; no new product API.

- [ ] **Step 1: Start the production-like app and open Browser/IAB**

Run: `pnpm build && pnpm start -p 3001`

Expected: server starts on `http://127.0.0.1:3001` without runtime errors.

- [ ] **Step 2: Verify the complete Wilds flow**

Capture a non-starter creature, confirm the capsule/reward announcement, open inventory, download the PNG/package, train to evolution eligibility using deterministic test state, evolve through Stage III, reload, and confirm lineage persists. Repeat capture/download at a mobile viewport and with reduced motion.

- [ ] **Step 3: Verify the complete Exchange flow**

Confirm two demo assets on first load, upload a valid fixture, reject a tampered fixture, list a synchronized Wilds card, buy through embedded payment, refresh, and confirm the authoritative owner/order-book projection. Inspect every interaction for external navigation; `receiz.com` must never become the top-level URL.

- [ ] **Step 4: Fix observed defects test-first and rerun gates**

For each defect, add or tighten the smallest failing unit/render contract, verify RED, patch production code, and verify GREEN.

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build && pnpm secret:scan`

Expected: all pass with no warnings that indicate broken workflows.

- [ ] **Step 5: Commit final verification fixes and evidence**

```bash
git add src app tests output/playwright
git commit -m "test: verify portable cards and Exchange end to end"
```

## Plan self-review

- Spec coverage: catalog, capture/seal atomicity, offline portability, evolution, inventory, card export, verified upload admission, two demo assets, durable trade settlement, no redirects, recovery, accessibility, performance, and browser E2E each map to Tasks 1-10.
- Placeholder scan: no deferred implementation markers or undefined follow-up tasks remain.
- Type consistency: catalog types feed portable cards; portable cards feed reducer/export/admission; admission and commands feed HTTP routes; routes feed client projections.
