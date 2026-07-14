# Receiz Wilds Infinite Card Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the complete SealCub-to-battle-to-capture-to-portable-card-to-market-to-fusion vertical slice defined in `docs/superpowers/specs/2026-07-13-wilds-infinite-card-loop-design.md`.

**Architecture:** Extend the existing pure Wilds state reducers with deterministic proximity, battle, variant, mutation, and fusion modules. Keep PNG proof verification as the artifact-integrity boundary, the card ledger as ownership authority, and React components as presentation only. Build the public card route from the same verified card projection used by inventory and Exchange so the 3D page, QR, and transaction actions cannot disagree.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Three.js / React Three Fiber, Node test runner, Web Crypto-compatible SHA-256 helpers, PNG private chunks, existing Receiz proof and Exchange adapters.

## Global Constraints

- Preserve the existing capsule sealing and reveal presentation.
- Never redirect a user to Receiz.com for buy, sell, list, trade, import, or verification actions.
- Keep the PNG as the only required portable proof file; do not add a JSON sidecar.
- Preserve legacy `mintcub` family/form identifiers while displaying the starter as `SealCub`.
- Current ledger ownership—not possession of an old PNG—controls play, sale, transfer, and fusion authority.
- Parents survive fusion, remain usable, and can have multiple children.
- Fusion consumes one earned Fusion Spark and applies a 24-hour cooldown to both parents.
- Terrain discovery remains active across repeated searches whenever no battle, capture, or dialog owns input.
- The selected standalone composition is the cinematic floating card with a compact bottom dock.
- All generator and combat results must be deterministic from canonical sealed inputs.
- Honor `prefers-reduced-motion`, mobile safe areas, and 44px primary gameplay targets.

---

### Task 1: Mobile chrome, bounded premium HUD, and persistent proximity search

**Files:**
- Modify: `app/globals.css`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `src/features/play/encounter-state.ts`
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Test: `tests/mobile-storefront-layout.test.ts`
- Test: `tests/wilds-render-contract.test.ts`
- Test: `tests/encounter-state.test.ts`

**Interfaces:**
- Produces: `SearchProximity = "cold" | "warm" | "hot"` and `SearchTrend = "closer" | "farther" | "steady" | null` on active encounter state.
- Produces: `encounterFromSearch(result, point, at, ownerId, previous?)` with deterministic distance comparison.
- Consumes: existing `HotspotSearchResult.distance` and `direction`.

- [ ] **Step 1: Write failing proximity and CSS contract tests**

```ts
assert.equal(first.proximity, "warm");
assert.equal(second.trend, "closer");
assert.match(css, /\.mobile-stage\s*\{[^}]*height:\s*calc\(100dvh - 58px\)/s);
assert.doesNotMatch(css, /height:\s*calc\(100dvh - 78px - 90px\)/);
assert.match(campaign, /wilds-coordinate-badges/);
assert.doesNotMatch(campaign, /setSearchArmed\(false\)/);
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx --test tests/encounter-state.test.ts tests/mobile-storefront-layout.test.ts tests/wilds-render-contract.test.ts`
Expected: FAIL because proximity/trend, expanded stage sizing, coordinate badges, and persistent search are absent.

- [ ] **Step 3: Add proximity fields and persistent search**

```ts
export type SearchProximity = "cold" | "warm" | "hot";
export type SearchTrend = "closer" | "farther" | "steady" | null;

const proximity = distance === undefined ? "cold" : distance <= 2.25 ? "hot" : "warm";
const trend = previous?.hotspotId === hotspotId && previous.distance !== undefined
  ? distance < previous.distance - 0.15 ? "closer" : distance > previous.distance + 0.15 ? "farther" : "steady"
  : null;
```

Set `searchEnabled` from encounter phase instead of a one-shot arm state. Keep the status button but label it `Discovery on`. Ignore terrain clicks during battle/capture/reveal phases.

- [ ] **Step 4: Compact mobile chrome and HUD CSS**

```css
.mobile-stage { height: calc(100dvh - 58px); }
.mobile-pane { padding-bottom: max(94px, calc(80px + env(safe-area-inset-bottom))); }
.bottom-nav { bottom: max(8px, env(safe-area-inset-bottom)); }
.wilds-player-chip > div { min-width: 0; overflow: hidden; }
.wilds-player-chip strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wilds-coordinate-badges { display: flex; gap: 4px; }
```

- [ ] **Step 5: Run focused tests and commit**

Run: `npx tsx --test tests/encounter-state.test.ts tests/mobile-storefront-layout.test.ts tests/wilds-render-contract.test.ts`
Expected: PASS.

Commit: `feat: refine mobile Wilds discovery HUD`

### Task 2: SealCub compatibility and deterministic individual variants

**Files:**
- Create: `src/features/play/card-variant.ts`
- Modify: `src/features/play/portable-card.ts`
- Modify: `src/features/play/creature-catalog.ts`
- Modify: `src/features/play/WildsCard.tsx`
- Modify: `src/features/play/card-export.ts`
- Test: `tests/card-variant.test.ts`
- Test: `tests/portable-card.test.ts`
- Test: `tests/card-export.test.ts`

**Interfaces:**
- Produces: `CardVariantSeedInput`, `CardVariantTraits`, `variantSeedFor(input)`, and `deriveCardVariant(seed, generatorVersion)`.
- Extends: `PortableCardManifest` with `variant: { generatorVersion: 1; seed: string; traitsDigest: string; traits: CardVariantTraits }` and optional `battleTranscriptDigest`.
- Preserves: legacy manifests without `variant` through a deterministic v0 projection.

- [ ] **Step 1: Write failing variant property tests**

```ts
const seed = variantSeedFor(input);
assert.deepEqual(deriveCardVariant(seed, 1), deriveCardVariant(seed, 1));
assert.notDeepEqual(deriveCardVariant(seed, 1), deriveCardVariant(variantSeedFor({ ...input, kaiPulse: "2" }), 1));
assert.match(displayCreatureName("mintcub-1"), /SealCub/);
```

Generate at least 1,000 seeds in the test and assert every palette channel, stat modifier, animation period, marking index, and ability modifier remains inside declared bounds.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx --test tests/card-variant.test.ts tests/portable-card.test.ts tests/card-export.test.ts`
Expected: FAIL because variant APIs and SealCub projection do not exist.

- [ ] **Step 3: Implement canonical generator**

Use `sha256PortableBasis(canonicalPortableCardJson(input))` as the seed and consume fixed hash byte offsets for HSL palette shifts, markings, anatomy scale, aura, animation period, temperament, affinity, potential, and ability modifiers. Do not call `Math.random()`.

```ts
export function displayCreatureName(formId: string, storedName?: string) {
  return formId.startsWith("mintcub-") ? "SealCub" : storedName ?? creatureForm(formId)?.name ?? "Wild card";
}
```

- [ ] **Step 4: Seal and render variant traits in PNG and UI**

Derive visible CSS variables and SVG geometry from `asset.manifest.variant.traits`. Add the QR destination `/cards/${encodeURIComponent(asset.id)}` to the visible SVG and embedded proof.

- [ ] **Step 5: Verify and commit**

Run: `npx tsx --test tests/card-variant.test.ts tests/portable-card.test.ts tests/card-export.test.ts`
Expected: PASS.

Commit: `feat: generate unique Kai-seeded Wilds cards`

### Task 3: Deterministic turn-based battle engine

**Files:**
- Create: `src/features/play/battle-engine.ts`
- Modify: `src/features/play/encounter-state.ts`
- Modify: `src/features/play/game-state.ts`
- Test: `tests/battle-engine.test.ts`
- Test: `tests/game-state.test.ts`

**Interfaces:**
- Produces: `BattleState`, `BattleAction`, `startWildBattle(input)`, `applyBattleAction(state, action)`, `battleTranscriptDigest(state)`.
- Extends encounter phases with `battle_intro`, `player_turn`, `wild_turn`, `capture_ready`, `fled`, and `defeated`.
- Adds Wilds inputs: `{ type: "battle-action"; action: BattleAction }` and `{ type: "start-battle"; at: string }`.

- [ ] **Step 1: Write failing combat tests**

```ts
const first = startWildBattle(input);
assert.deepEqual(first, startWildBattle(input));
const weakened = reduceUntil(first, (battle) => battle.wild.hpRatio <= 0.3);
assert.equal(weakened.phase, "capture_ready");
assert.equal(applyBattleAction(knockoutRisk, { type: "ability", slot: 1 }).phase, "fled");
```

Cover ability energy, guard, speed order, status expiry, card switching, deterministic critical effects, failed capture, player defeat, and transcript replay.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx --test tests/battle-engine.test.ts tests/game-state.test.ts`
Expected: FAIL because the battle engine and encounter phases are absent.

- [ ] **Step 3: Implement pure battle transitions**

Use integer health/energy values. Derive every roll from a hash of `{ encounterSeed, turn, actorId, action, transcriptDigest }`. Make Capture invalid above 30% wild health. Make zero wild HP resolve to `fled`, never directly to capture.

- [ ] **Step 4: Integrate reducer without changing capsule semantics**

Exact hits advance to `battle_intro`; battle success advances to the existing `capsule` phase. Existing `capsule → sealed → revealed` logic and `sealCollectedCard` call remain the mint boundary.

- [ ] **Step 5: Verify and commit**

Run: `npx tsx --test tests/battle-engine.test.ts tests/game-state.test.ts`
Expected: PASS.

Commit: `feat: battle wild creatures before capture`

### Task 4: Battle presentation and complete encounter interaction

**Files:**
- Create: `src/features/play/WildsBattle.tsx`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Modify: `app/globals.css`
- Test: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: `BattleState`, `BattleAction`, active inventory, and `battle-action` reducer input.
- Produces: accessible Ability 1, Ability 2, Guard, Switch, and Capture controls.

- [ ] **Step 1: Add failing render contract**

Assert `WildsBattle`, health bars, `aria-label="Capture weakened creature"`, card switcher, and capture-button gating exist; assert `WildsCaptureReward` remains in `PlayCampaign`.

- [ ] **Step 2: Run and verify RED**

Run: `npx tsx --test tests/wilds-render-contract.test.ts`
Expected: FAIL because battle UI is absent.

- [ ] **Step 3: Implement battle overlay and animations**

Render combat inside the world stage. Use the selected card variant for the player and encounter variant preview for the wild. Show damage, guard, status, energy, health, and capture readiness. Use CSS/Three transforms for deterministic attack reactions and honor reduced motion.

- [ ] **Step 4: Verify interaction contract and commit**

Run: `npx tsx --test tests/wilds-render-contract.test.ts tests/game-state.test.ts`
Expected: PASS.

Commit: `feat: add tactical Wilds battle stage`

### Task 5: Offline-verified PNG inventory import

**Files:**
- Modify: `src/features/play/card-export.ts`
- Modify: `src/features/play/WildsInventory.tsx`
- Modify: `src/features/play/game-state.ts`
- Create: `src/features/play/card-import.ts`
- Test: `tests/card-import.test.ts`
- Test: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Produces: `importPortableCardPng(bytes, { ownerId, ledgerOwnerId? }): Promise<PortableCardAsset>`.
- Adds Wilds input: `{ type: "import-card"; asset: PortableCardAsset }`.
- Consumes: `verifyPortableCardPng` and `verifyPortableCard`.

- [ ] **Step 1: Write failing import tests**

Cover valid round trip, duplicate, changed pixels, changed proof chunk, missing proof, unsupported generator, owner mismatch, and ledger-owner mismatch.

- [ ] **Step 2: Run and verify RED**

Run: `npx tsx --test tests/card-import.test.ts tests/wilds-render-contract.test.ts`
Expected: FAIL because import API and UI are absent.

- [ ] **Step 3: Implement importer and atomic reducer admission**

```ts
const verified = await verifyPortableCardPng(bytes);
if (!verified.ok || !verified.asset) throw new CardImportError(verified.reason);
if (verified.asset.manifest.ownerReceizId !== ownerId) throw new CardImportError("not_currently_owned");
return verified.asset;
```

Reject existing IDs before modifying inventory. Preserve `sealed_local`, `verified`, and `listed` status according to verified synchronization fields.

- [ ] **Step 4: Add file picker and drag/drop**

Use `<input accept="image/png" type="file">`, expose exact error categories in `aria-live`, and select an imported card after admission.

- [ ] **Step 5: Verify and commit**

Run: `npx tsx --test tests/card-import.test.ts tests/wilds-render-contract.test.ts`
Expected: PASS.

Commit: `feat: import verified Wilds PNG cards`

### Task 6: Earned mutation and reusable-parent fusion

**Files:**
- Create: `src/features/play/card-fusion.ts`
- Modify: `src/features/play/portable-card.ts`
- Modify: `src/features/play/game-state.ts`
- Modify: `src/features/play/WildsInventory.tsx`
- Test: `tests/card-fusion.test.ts`
- Test: `tests/game-state.test.ts`

**Interfaces:**
- Produces: `FusionEligibility`, `fusionChild(input)`, and `mutationEvolution(input)`.
- Adds state: `fusionSparks: number`, `fusionCooldowns: Record<string, string>`, and `achievements: string[]`.
- Adds inputs: `fuse-cards` and `mutate-card`.

- [ ] **Step 1: Write failing fusion and mutation tests**

Assert both parents remain, one child is added, one Spark is consumed, both cooldowns equal `fusedAt + 24h`, identical retry is idempotent, cooldown blocks a second child, different earned fusion later creates a distinct child, and parent/child digest links verify.

- [ ] **Step 2: Run and verify RED**

Run: `npx tsx --test tests/card-fusion.test.ts tests/game-state.test.ts`
Expected: FAIL because fusion APIs and progression fields are absent.

- [ ] **Step 3: Implement lineage-safe fusion and post-apex mutation**

Child seed basis:

```ts
{ parentA: parentA.proof.digest, parentB: parentB.proof.digest, inheritance, fusionKaiPulse, fusedAt, sparkId }
```

Sort parent digests canonically for identity, while preserving selected inheritance emphasis as a separate field. Update parents only in state cooldown metadata; never rewrite their PNG proof.

- [ ] **Step 4: Add inventory fusion sheet**

Allow two owned cards, show eligibility, Spark count, cooldown, inherited preview, and a single confirm action.

- [ ] **Step 5: Verify and commit**

Run: `npx tsx --test tests/card-fusion.test.ts tests/game-state.test.ts`
Expected: PASS.

Commit: `feat: fuse reusable Wilds parent cards`

### Task 7: Cinematic standalone 3D card page and embedded QR

**Files:**
- Create: `app/cards/[assetId]/page.tsx`
- Create: `src/features/play/WildsCardScene.tsx`
- Create: `src/features/play/WildsCardPage.tsx`
- Create: `src/lib/exchange/card-public-projection.ts`
- Modify: `app/globals.css`
- Modify: `src/features/play/card-export.ts`
- Test: `tests/card-public-projection.test.ts`
- Test: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Produces: `publicCardProjection(asset, ledger)` excluding private owner contact data.
- Consumes: verified card asset, current ledger owner/listing/offers, variant traits, lineage.

- [ ] **Step 1: Write failing public projection and render tests**

Assert route files, floating scene, `Overview`, `Proof`, `Lineage`, `Offers`, primary transaction action, QR destination, no owner email, and reduced-motion fallback.

- [ ] **Step 2: Run and verify RED**

Run: `npx tsx --test tests/card-public-projection.test.ts tests/wilds-render-contract.test.ts`
Expected: FAIL because the route and projection are absent.

- [ ] **Step 3: Implement projection and cinematic page**

Render the procedural card in a lazy Three.js scene with subtle pointer tilt, light response, foil shader, and bounded particles. Keep the bottom dock floating; open details as one compact sheet. Render a static `WildsCard` fallback before 3D loads and for reduced motion.

- [ ] **Step 4: Embed a real scan-safe QR**

Generate a deterministic QR matrix for the canonical local card URL, render it with a four-module quiet zone in both SVG export and page UI, and verify decoding in the QR unit test.

- [ ] **Step 5: Verify and commit**

Run: `npx tsx --test tests/card-public-projection.test.ts tests/card-export.test.ts tests/wilds-render-contract.test.ts`
Expected: PASS.

Commit: `feat: add cinematic public Wilds card pages`

### Task 8: Money, card, and mixed offers with atomic owner acceptance

**Files:**
- Modify: `src/lib/exchange/card-ledger.ts`
- Create: `app/api/exchange/cards/[assetId]/route.ts`
- Create: `app/api/exchange/card-offers/route.ts`
- Modify: `src/features/play/WildsCardPage.tsx`
- Test: `tests/card-ledger.test.ts`
- Test: `tests/card-offer-api.test.ts`
- Test: `tests/same-surface-payment.test.ts`

**Interfaces:**
- Extends `CardTradeOffer` with `moneyCents: number` and uploaded verified offered card IDs.
- Produces API operations: `get`, `list`, `unlist`, `offer`, `accept`, `decline`, `buy`, and `send`.
- Consumes existing embedded checkout and PNG verification rails.

- [ ] **Step 1: Write failing ledger and route tests**

Cover money-only, card-only, mixed, multi-card upload, stale ownership, owner-only acceptance, payment failure, atomic swap, conflicting listing cancellation, send, and no Receiz.com redirect.

- [ ] **Step 2: Run and verify RED**

Run: `npx tsx --test tests/card-ledger.test.ts tests/card-offer-api.test.ts tests/same-surface-payment.test.ts`
Expected: FAIL because money/mixed offers and card APIs are absent.

- [ ] **Step 3: Extend ledger and server routes**

Before acceptance, re-run ownership checks for every requested/offered ID. Settle `moneyCents` through embedded checkout before changing owners. Append one idempotent operation containing all transferred IDs and payment receipt reference.

- [ ] **Step 4: Wire standalone dock mechanics**

Owner sees List, Unlist, Sell, Send, Accept, and Decline. Visitor sees Buy and Make offer. Offer sheet accepts multiple inventory cards, verified PNG uploads, and optional money.

- [ ] **Step 5: Verify and commit**

Run: `npx tsx --test tests/card-ledger.test.ts tests/card-offer-api.test.ts tests/same-surface-payment.test.ts`
Expected: PASS.

Commit: `feat: trade Wilds cards from public pages`

### Task 9: Full-loop migration, persistence, and recovery

**Files:**
- Modify: `src/features/play/game-state.ts`
- Modify: `src/lib/storage/use-template-store.ts`
- Modify: `src/lib/exchange/card-ledger.ts`
- Test: `tests/game-state.test.ts`
- Test: `tests/card-ledger.test.ts`
- Test: `tests/portable-card.test.ts`

**Interfaces:**
- Advances Wilds save schema to v5.
- Migrates v4 saves, legacy Mintcub proofs, encounter state, and starter inventory without duplicate minting.

- [ ] **Step 1: Write failing migration/recovery tests**

Round-trip a v5 battle snapshot, migrate v4 state, restore an interrupted player turn deterministically, keep legacy starter proof valid, and prevent duplicate import/fusion/offer operations after retry.

- [ ] **Step 2: Run and verify RED**

Run: `npx tsx --test tests/game-state.test.ts tests/card-ledger.test.ts tests/portable-card.test.ts`
Expected: FAIL because v5 migration and new state fields are absent.

- [ ] **Step 3: Implement versioned migration and idempotency keys**

Default missing v5 fields without rewriting existing card proof bytes. Store battle transcript and cooldown timestamps canonically. Derive operation IDs from full economic/game inputs.

- [ ] **Step 4: Verify and commit**

Run: `npx tsx --test tests/game-state.test.ts tests/card-ledger.test.ts tests/portable-card.test.ts`
Expected: PASS.

Commit: `feat: persist the complete Wilds card loop`

### Task 10: End-to-end verification and release audit

**Files:**
- Modify only files required by failures discovered during verification.
- Store screenshots outside committed source under `/tmp/receiz-wilds-qa/`.

**Interfaces:**
- Verifies every interface produced by Tasks 1–9 through the public UI and server routes.

- [ ] **Step 1: Run static and unit verification**

Run: `pnpm test && pnpm typecheck && pnpm build`
Expected: all commands exit 0; Node test summary reports zero failures.

- [ ] **Step 2: Run desktop and mobile interaction loop**

At 390x844 and 1280x800, verify:

1. SealCub is present and HUD text stays bounded.
2. Repeated terrain taps show cold/warm/hot and closer/farther without controller re-arming.
3. An exact find enters battle.
4. Abilities weaken the wild; Capture unlocks below 30%.
5. Capsule, seal, reveal, and inventory occur once.
6. Download PNG, remove local entry in a test state, re-import, and select for battle.
7. Open QR destination and verify cinematic page/dock.
8. List, offer money plus cards, accept as owner, and verify ownership swap without navigation to Receiz.com.
9. Earn a Spark, fuse two cards, retain both parents, create one child, and observe cooldown.

- [ ] **Step 3: Verify browser/runtime health**

Confirm correct URL/title, meaningful DOM, no framework overlay, no relevant console errors, no failed app requests, reduced-motion fallback, QR scan, and offline PNG proof verification.

- [ ] **Step 4: Run final regression suite and commit fixes**

Run: `pnpm test && pnpm typecheck && pnpm build`
Expected: all commands exit 0.

Commit any verification fixes as: `fix: close Wilds full-loop release gaps`
