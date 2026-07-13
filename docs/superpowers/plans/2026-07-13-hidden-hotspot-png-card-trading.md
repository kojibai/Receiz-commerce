# Hidden Hotspot PNG Card Trading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete search-to-capture-to-portable-PNG loop, then let verified card owners sell, trade, share, or send cards entirely within the Receiz application.

**Architecture:** Deterministic pure functions project hidden hotspots from world regions and resolve terrain searches. A reducer owns the encounter state machine and commits a sealed card before the reveal animation. A PNG codec embeds and verifies the authoritative card manifest inside the image, while server-side card-ledger commands atomically control listings, offers, purchases, swaps, and sends through published proof state.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Three.js, React Three Fiber, Node test runner, Receiz proof-state publication, browser Canvas/PNG APIs.

## Global Constraints

- The PNG is the sole portable proof object; do not emit or require a JSON sidecar.
- All 250 base families must be deterministically reachable through streamed hidden hotspots.
- Capture and local proof sealing are one atomic reducer transition.
- New ownership-changing commands are server-authoritative, atomic, and idempotent.
- Purchases, verification, sharing, trading, and sending stay on the active application domain.
- Mobile game viewport target is `clamp(480px, 68dvh, 680px)`.
- Expanded mobile trays are capped at `55dvh`; only one secondary tray is open at a time.
- Interactive mobile controls retain a minimum 44 CSS pixel touch target.
- Preserve the existing 250-family, 750-form catalog and three-stage evolution model.
- Preserve original Receiz Wilds characters, capsule, terminology, effects, and trade dress.

---

### Task 1: Deterministic hidden hotspots and search projection

**Files:**
- Create: `src/features/play/hidden-hotspots.ts`
- Modify: `src/features/play/game-state.ts`
- Create: `tests/hidden-hotspots.test.ts`
- Modify: `tsconfig.test.json`

**Interfaces:**
- Produces: `hotspotsForRegion(regionX: number, regionZ: number): HiddenHotspot[]`
- Produces: `nearbyHiddenHotspots(player: { x: number; z: number }): HiddenHotspot[]`
- Produces: `searchHiddenHotspots(hotspots, point, discoveredIds): HotspotSearchResult`
- `HotspotSearchResult` is `{ kind: "hit"; hotspot; distance } | { kind: "near_miss"; hotspot; distance; direction } | { kind: "empty" } | { kind: "captured"; hotspot; distance }`.

- [ ] **Step 1: Write failing distribution and search tests**

```ts
it("covers all 250 families across deterministic regions", () => {
  const ids = new Set<string>();
  for (let z = -16; z <= 16; z += 1) for (let x = -16; x <= 16; x += 1) {
    hotspotsForRegion(x, z).forEach((hotspot) => ids.add(hotspot.familyId));
  }
  assert.equal(ids.size, 250);
  assert.deepEqual(hotspotsForRegion(7, -4), hotspotsForRegion(7, -4));
});

it("distinguishes hits, hints, empty searches, and captured hotspots", () => {
  const hotspot = hotspotsForRegion(3, 2)[0]!;
  assert.equal(searchHiddenHotspots([hotspot], hotspot.position, []).kind, "hit");
  assert.equal(searchHiddenHotspots([hotspot], { x: hotspot.position.x + 2.5, z: hotspot.position.z }, []).kind, "near_miss");
  assert.equal(searchHiddenHotspots([hotspot], { x: hotspot.position.x + 20, z: hotspot.position.z }, []).kind, "empty");
  assert.equal(searchHiddenHotspots([hotspot], hotspot.position, [hotspot.id]).kind, "captured");
});
```

- [ ] **Step 2: Run the tests and verify the missing module failure**

Run: `pnpm test`

Expected: TypeScript reports that `hidden-hotspots` cannot be resolved.

- [ ] **Step 3: Implement deterministic region hotspots**

Use a stable integer hash of region coordinates and slot index. Assign at least four hotspots per region, rotate the 250 family indexes with a coprime stride, and derive habitat cover from the base form habitat. Keep hit radius at `1.15`, hint radius at `4.5`, and reuse the existing 24-unit encounter region size.

```ts
export type HiddenHotspot = {
  id: string;
  familyId: string;
  formId: string;
  regionX: number;
  regionZ: number;
  position: { x: number; z: number };
  cover: "grass" | "flowers" | "tree" | "rock" | "cave" | "water" | "ruin" | "energy";
  hitRadius: 1.15;
  hintRadius: 4.5;
};
```

- [ ] **Step 4: Replace openly streamed undiscovered cards in game-state selectors**

`nearestCreature` and `canDiscover` must derive encounters from hotspots, while `discoveredCards` continues to return collected companions. Do not expose undiscovered `CreatureCard` render positions.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test && pnpm typecheck`

Expected: all tests pass.

Commit: `git add src/features/play/hidden-hotspots.ts src/features/play/game-state.ts tests/hidden-hotspots.test.ts tsconfig.test.json && git commit -m "feat: distribute Wilds creatures in hidden hotspots"`

---

### Task 2: Search and encounter state machine

**Files:**
- Create: `src/features/play/encounter-state.ts`
- Modify: `src/features/play/game-state.ts`
- Modify: `tests/play-game-state.test.ts`
- Create: `tests/encounter-state.test.ts`
- Modify: `tsconfig.test.json`

**Interfaces:**
- Produces: `EncounterState` phases `idle | searching | hint | emerging | capsule | sealed | revealed`.
- Adds inputs `{ type: "search-point"; x; z; searchedAt }`, `{ type: "advance-encounter"; at }`, and `{ type: "dismiss-reveal" }`.
- `PlayState` gains `encounter`, `capturedHotspotIds`, and `lastSearchPoint`.

- [ ] **Step 1: Write failing reducer tests**

Test empty searches without inventory mutation, near-miss direction hints, hit-to-emerging transitions, atomic capsule sealing, duplicate hotspot prevention, and restoration from `sealed` directly to `revealed`.

```ts
const searched = applyWildsInput(stateNearHotspot, { type: "search-point", x, z, searchedAt });
assert.equal(searched.encounter.phase, "emerging");
const sealed = applyWildsInput(searched, { type: "advance-encounter", at: sealedAt });
assert.equal(sealed.encounter.phase, "sealed");
assert.equal(sealed.inventory.length, stateNearHotspot.inventory.length + 1);
assert.equal(sealed.capturedHotspotIds.includes(hotspot.id), true);
```

- [ ] **Step 2: Run tests and confirm missing encounter types**

Run: `pnpm test`

Expected: compile failures for the new inputs and state.

- [ ] **Step 3: Implement pure encounter transitions**

Use explicit phase timestamps and one `assetId` after sealing. The only transition that calls `sealCollectedCard` is `capsule -> sealed`; retries with the same hotspot and encounter ID return the existing card.

- [ ] **Step 4: Migrate v3 saves safely**

Increment the save schema, populate empty encounter state and captured hotspot IDs from inventory encounter IDs, and preserve all existing cards and progression.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test && pnpm typecheck`

Expected: all reducer, migration, and portable-card tests pass.

Commit: `git add src/features/play/encounter-state.ts src/features/play/game-state.ts tests/play-game-state.test.ts tests/encounter-state.test.ts tsconfig.test.json && git commit -m "feat: add atomic Wilds search encounters"`

---

### Task 3: Terrain search, habitat covers, emergence, and capsule reveal

**Files:**
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Create: `src/features/play/HiddenHotspotCover.tsx`
- Create: `src/features/play/WildsEncounterStage.tsx`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `src/features/play/WildsCaptureReward.tsx`
- Modify: `app/globals.css`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- `WildsWorldCanvas` adds `onSearchPoint(point: { x; z }): void`.
- `HiddenHotspotCover` consumes a hotspot, phase, and search result without rendering the creature before a hit.
- `WildsEncounterStage` consumes `EncounterState` and advances timed phases through callbacks.

- [ ] **Step 1: Add failing rendering-contract assertions**

Assert the canvas raycasts terrain, undiscovered creatures are absent from the normal `nearby.map`, all eight cover variants exist, and the encounter stage exposes accessible status text and reduced-motion rules.

- [ ] **Step 2: Run tests and verify failures**

Run: `pnpm test`

Expected: the new component and contract assertions fail.

- [ ] **Step 3: Implement terrain raycast search**

Add a transparent world search plane and use the R3F pointer intersection world point. Dispatch one search only on a completed tap/click, not while dragging the movement trackpad.

- [ ] **Step 4: Implement cover reactions and emergence**

Render stable environmental cover for nearby hotspots. Empty searches pulse locally; near misses emit a short directional particle trail; hits animate the cover opening and mount the creature only in `emerging` or later phases.

- [ ] **Step 5: Implement staged capsule and card transition**

Use timers derived from phase timestamps, three capsule seal pulses, rarity-specific lighting, focus management, `aria-live`, and a reduced-motion branch. Do not commit capture from animation callbacks more than once.

- [ ] **Step 6: Run tests, visually smoke test, and commit**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected: all checks pass.

Commit: `git add src/features/play/WildsWorldCanvas.tsx src/features/play/HiddenHotspotCover.tsx src/features/play/WildsEncounterStage.tsx src/features/play/PlayCampaign.tsx src/features/play/WildsCaptureReward.tsx app/globals.css tests/wilds-render-contract.test.ts && git commit -m "feat: reveal hidden Wilds encounters from terrain search"`

---

### Task 4: Single-file PNG proof codec and download

**Files:**
- Create: `src/features/play/png-proof.ts`
- Modify: `src/features/play/card-export.ts`
- Modify: `src/features/play/portable-card.ts`
- Create: `tests/png-proof.test.ts`
- Modify: `tests/card-export.test.ts`
- Modify: `tsconfig.test.json`

**Interfaces:**
- Produces: `embedPortableCardProof(png: Uint8Array, card: PortableCardAsset): Uint8Array`.
- Produces: `verifyPortableCardPng(png: Uint8Array): { ok: true; card } | { ok: false; errors }`.
- Produces: `portableCardFromPng(file: File): Promise<PortableCardAsset>`.
- `downloadPortableCard` downloads exactly one `.receiz-card.png` file.

- [ ] **Step 1: Write failing binary-codec tests**

Use a fixed 1×1 PNG fixture. Assert signature validation, an `rzCd` ancillary chunk containing schema `receiz.card.v1` before `IEND`, valid CRC, canonical round-trip, pixel tamper rejection, metadata tamper rejection, and no JSON download call.

- [ ] **Step 2: Run tests and verify the missing codec failure**

Run: `pnpm test`

Expected: missing PNG proof exports.

- [ ] **Step 3: Implement PNG chunk parsing and CRC32**

Parse length/type/data/CRC for every chunk, reject truncation and invalid CRC, use a safe-to-copy private ancillary chunk name, and cap embedded manifest bytes at 256 KiB.

- [ ] **Step 4: Define non-circular artifact digesting**

Hash the canonical manifest plus decoded critical image chunks (`IHDR`, `PLTE`, `IDAT`) while excluding the Receiz metadata chunk and `IEND`. Embed that digest with the capture proof and current ledger head.

- [ ] **Step 5: Replace dual download with PNG-only export**

Render the existing high-resolution SVG to canvas, obtain PNG bytes, embed proof metadata, and trigger one download named `<form-id>.receiz-card.png`.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test && pnpm typecheck`

Expected: codec, export, and tamper tests pass.

Commit: `git add src/features/play/png-proof.ts src/features/play/card-export.ts src/features/play/portable-card.ts tests/png-proof.test.ts tests/card-export.test.ts tsconfig.test.json && git commit -m "feat: embed portable proof data in Wilds card PNGs"`

---

### Task 5: Card ledger commands for listings, offers, swaps, and sends

**Files:**
- Create: `src/lib/exchange/card-ledger.ts`
- Modify: `src/types/domain.ts`
- Create: `tests/card-ledger.test.ts`
- Modify: `tsconfig.test.json`

**Interfaces:**
- Adds `CardListing`, `CardTradeOffer`, `CardTransferOperation`, and append event domain types.
- Produces `createCardListing`, `createTradeOffer`, `withdrawTradeOffer`, `declineTradeOffer`, `acceptTradeOffer`, and `sendCards` pure commands.
- Every mutating input includes `operationId` and returns the existing result on replay.

- [ ] **Step 1: Write failing ledger tests**

Cover multi-card inventory offers, uploaded-card offers, optional cash, duplicate/foreign/stale card rejection, withdrawal, decline, all-or-nothing acceptance, replay safety, username/email sends, self-send rejection, and immutable capture lineage.

- [ ] **Step 2: Run tests and confirm missing command failures**

Run: `pnpm test`

Expected: unresolved ledger types and functions.

- [ ] **Step 3: Implement card availability and ownership invariants**

Centralize checks in `assertCardBundleAvailable(state, cardIds, ownerReceizId)`. A card may participate in only one accepted or settling operation. Pending offers do not transfer ownership.

- [ ] **Step 4: Implement atomic offer acceptance and sends**

Build the next state only after all validation passes. Append one bundle operation plus one ownership event per card. Preserve capture identity and lineage while updating current owner and ledger head.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test && pnpm typecheck`

Expected: all ledger tests pass.

Commit: `git add src/lib/exchange/card-ledger.ts src/types/domain.ts tests/card-ledger.test.ts tsconfig.test.json && git commit -m "feat: add atomic Wilds card trade and send ledger"`

---

### Task 6: Server APIs and PNG-only Exchange admission

**Files:**
- Modify: `app/api/exchange/wilds/route.ts`
- Create: `app/api/cards/[assetId]/route.ts`
- Create: `app/api/cards/[assetId]/offers/route.ts`
- Create: `app/api/cards/[assetId]/offers/[offerId]/route.ts`
- Create: `app/api/cards/send/route.ts`
- Modify: `src/lib/exchange/asset-admission.ts`
- Create: `tests/card-api-contract.test.ts`
- Modify: `tests/same-surface-payment.test.ts`

**Interfaces:**
- Wilds listing accepts `multipart/form-data` with `cardPng`, `priceCents`, and operation metadata.
- Card routes return local share URLs and published state projections.
- Offer accept/decline and send commands require scoped Receiz session authority.

- [ ] **Step 1: Write failing API contract tests**

Assert no route admits client JSON as authoritative proof, every upload invokes `verifyPortableCardPng`, every ownership route checks session scope, and share/payment URLs are local.

- [ ] **Step 2: Run tests and verify failures**

Run: `pnpm test`

Expected: missing routes and old JSON-card admission contract failures.

- [ ] **Step 3: Convert Wilds admission to PNG-only verification**

Parse and verify the PNG before synchronizing the card. Compare verified embedded owner with the authenticated Receiz handle and reject stale ledger heads and duplicate asset IDs.

- [ ] **Step 4: Implement card share, offer, and send routes**

Hydrate published proof state, invoke pure ledger commands, publish one updated store-state record, and return an idempotent result. Resolve username/email recipients through the configured Receiz identity adapter without returning private lookup details.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected: all API and same-surface contracts pass.

Commit: `git add app/api/exchange/wilds/route.ts app/api/cards src/lib/exchange/asset-admission.ts tests/card-api-contract.test.ts tests/same-surface-payment.test.ts && git commit -m "feat: expose verified card trading and sending APIs"`

---

### Task 7: Share page and inventory commerce actions

**Files:**
- Create: `app/cards/[assetId]/page.tsx`
- Create: `src/features/cards/CardSharePage.tsx`
- Create: `src/features/cards/CardTradeComposer.tsx`
- Create: `src/features/cards/CardSendDialog.tsx`
- Modify: `src/features/play/WildsInventory.tsx`
- Modify: `src/lib/storage/use-template-store.ts`
- Modify: `app/globals.css`
- Create: `tests/card-share-contract.test.ts`

**Interfaces:**
- Inventory uses `downloadPortableCard`, `listWildsCardPng`, `sendWildsCards`, and local share links.
- Trade composer supports inventory selection and multiple PNG file uploads.
- Share page supports purchase, offer creation, withdrawal, acceptance, and decline according to viewer authority.

- [ ] **Step 1: Write failing UI contract tests**

Assert the local `/cards/` route, PNG upload accept type, multiple-card selection, optional cash input, owner accept/decline controls, send username/email field, and absence of external navigation.

- [ ] **Step 2: Run tests and verify failures**

Run: `pnpm test`

Expected: missing share components and actions.

- [ ] **Step 3: Implement inventory PNG/list/share/send actions**

Keep Download as the immediate primary action. Add Exchange, List for sale, Share, Trade, and Send controls with clear pending/success/error feedback and server-returned ownership state.

- [ ] **Step 4: Implement public card page and trade composer**

Render the verified PNG/card projection, price, lineage, owner display identity, purchase ticket, multi-card offer builder, uploaded PNG previews, and incoming offer decisions. Never render raw private email lookup results.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected: all UI contracts pass.

Commit: `git add app/cards src/features/cards src/features/play/WildsInventory.tsx src/lib/storage/use-template-store.ts app/globals.css tests/card-share-contract.test.ts && git commit -m "feat: add Wilds card share trade and send surfaces"`

---

### Task 8: Taller mobile game and collapsible detail trays

**Files:**
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `src/features/play/WildsInventory.tsx`
- Create: `src/features/play/WildsDetailTrays.tsx`
- Modify: `app/globals.css`
- Modify: `tests/mobile-layout.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- `WildsDetailTrays` owns one `openTray` value for `mission | rewards | squad | progression | inventory | null`.
- Trays use buttons with `aria-expanded` and controlled panels with stable IDs.

- [ ] **Step 1: Write failing mobile layout tests**

Assert `clamp(480px, 68dvh, 680px)`, `max-height: 55dvh`, one-open-tray state, 44px controls, collapsed summaries, and native/ARIA disclosure semantics.

- [ ] **Step 2: Run tests and verify failures**

Run: `pnpm test`

Expected: missing tray component and CSS rules.

- [ ] **Step 3: Consolidate secondary content into controlled trays**

Move mission, reward, squad, progression, and inventory content beneath compact summary rows. Opening one tray closes the previous tray on mobile. Keep desktop strategy panels visible but collapsible.

- [ ] **Step 4: Increase and refine the mobile world viewport**

Apply the exact target clamp, keep search and movement controls inside or directly attached to the world, reduce nonessential padding/copy, cap expanded panels, and retain 44px hit targets.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected: all layout and accessibility tests pass.

Commit: `git add src/features/play/PlayCampaign.tsx src/features/play/WildsInventory.tsx src/features/play/WildsDetailTrays.tsx app/globals.css tests/mobile-layout.test.ts tests/wilds-render-contract.test.ts && git commit -m "feat: expand mobile Wilds world and collapse details"`

---

### Task 9: End-to-end release verification

**Files:**
- Modify only files required by defects proven during this task.
- Store browser artifacts under `output/playwright/` only when useful.

**Interfaces:**
- Consumes all previous tasks.
- Produces a clean production build and verified desktop/mobile flows.

- [ ] **Step 1: Run repository gates**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build && pnpm secret:scan`

Expected: all tests pass, production build succeeds, and secret scan passes.

- [ ] **Step 2: Verify mobile search and capture in a real browser**

At 390×844, confirm the world occupies the dominant vertical area, secondary trays collapse/expand one at a time, a terrain miss and near miss react correctly, a hotspot hit reveals a previously hidden creature, the capsule seals it, and inventory updates once.

- [ ] **Step 3: Verify the PNG proof round trip**

Download one `.receiz-card.png`, upload the same file through inventory/Exchange, confirm offline verification succeeds, alter the PNG bytes, and confirm the modified upload is rejected.

- [ ] **Step 4: Verify commerce operations on the active domain**

List a card, open `/cards/{asset-id}`, complete a sandbox purchase, create a multi-card offer using inventory plus uploaded PNGs, accept it as owner, and send a different card by username or email. Confirm ownership changes exactly once and the URL never changes to `receiz.com`.

- [ ] **Step 5: Commit verified fixes**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only intentional files before commit.

Commit: `git add -u && git commit -m "fix: complete hidden Wilds card lifecycle"`
