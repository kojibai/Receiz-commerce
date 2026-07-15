# Wilds V3 Landmark Civilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Wayfinder Hollow as the first complete permanent settlement with stable geography, authored residents, useful services, deterministic civic reputation, verified-card attunement, a route puzzle, live commons, canonical monuments, portable vault history, premium mobile presentation, and release evidence.

**Architecture:** Extend the existing landmark registry with one public settlement and keep personal civic history in a small append-only reducer inside `PlayState`. Render the settlement through the existing Three.js canvas, open a separate full-screen settlement experience at physical proximity, reuse existing multiplayer and living-world projections, and let the existing V3 vault proof-bind the extended player state.

**Tech Stack:** TypeScript, React 19, Next.js 15, Three.js/React Three Fiber, existing Receiz primitives, Node test runner, Playwright WebKit.

## Global Constraints

- Preserve all valid V2/V3 cards, saves, vaults, achievements, and history.
- Stable settlement ID is `wayfinder-hollow`; stable coordinate is `{x:72,z:40}`.
- Players Rift to an approach point and must walk into the physical entrance.
- Public settlement entry never requires a card, reputation, payment, or team.
- Civic rewards are personal, non-transferable, idempotent, and cannot alter Receiz ownership or canonical world truth.
- Active-card services pin an already verified proof digest.
- Canonical monuments derive only from the living-world projection; practice facts remain labelled practice.
- Mobile close/return controls are at least 44px; required text is not truncated at 320×568.
- Reuse the existing canvas, multiplayer projection, audio lifecycle, save loop, and V3 vault.
- Follow red-green-refactor and commit each independently reviewable task on `main`.

---

### Task 1: Permanent settlement registry and geography

**Files:**
- Create: `src/features/play/wilds-settlements.ts`
- Modify: `src/features/play/wilds-landmarks.ts`
- Modify: `src/features/play/wilds-world-geography.ts`
- Test: `tests/wilds-settlements.test.ts`

**Interfaces:**
- Produces: `WAYFINDER_HOLLOW`, `WILDS_SETTLEMENTS`, `settlementAtPosition(position)`, and settlement-aware `WildsLandmarkDefinition`.
- Consumes: existing `landmarkApproachPoint`, atlas projection, and entrance detection.

- [ ] Write a failing test proving stable ID/coordinate, five unique districts, three unique residents, public access, approach outside radius, inclusion in atlas geography, and exact entrance detection.
- [ ] Run `pnpm test`; expect the new module import to fail.
- [ ] Define the settlement, extend `WildsLandmarkId` with `wayfinder-hollow`, extend landmark kind/icon unions with `settlement`/`compass`, and register it in `WILDS_FLAGSHIP_LANDMARKS`.
- [ ] Run `pnpm test`; expect all settlement registry assertions to pass.
- [ ] Commit `feat: establish Wayfinder Hollow`.

### Task 2: Append-only civic history and reputation

**Files:**
- Create: `src/features/play/wilds-civic-history.ts`
- Test: `tests/wilds-civic-history.test.ts`

**Interfaces:**

```ts
export type WildsCivicEvent = {
  schema: "receiz.wilds_civic_event.v1";
  eventId: string;
  settlementId: "wayfinder-hollow";
  actorId: string;
  kind: "settlement.discovered" | "resident.met" | "service.completed" | "puzzle.completed";
  sourceId: string;
  occurredAt: string;
  cardProofDigest: string | null;
  reputation: number;
};
export function createWildsCivicEvent(input: Omit<WildsCivicEvent, "schema" | "eventId">): WildsCivicEvent;
export function verifyWildsCivicEvent(event: WildsCivicEvent): { ok: boolean; errors: string[] };
export function projectWildsCivicHistory(events: readonly WildsCivicEvent[]): { events: WildsCivicEvent[]; reputation: number; rank: "visitor" | "neighbor" | "wayfinder" | "keeper"; completedSourceIds: string[] };
```

- [ ] Write failing tests for deterministic IDs, malformed/tampered rejection, duplicate replay, source-level score caps, stable ordering, rank thresholds, and invalid proof-digest rejection.
- [ ] Run the focused compiled test; expect missing exports.
- [ ] Implement canonical JSON hashing with the existing portable SHA-256 helper, strict validation, event-ID verification, stable ISO/event ordering, deduplication, and reputation clamps of 5 per source and 100 total.
- [ ] Run focused and full tests; expect PASS.
- [ ] Commit `feat: add Wilds civic history`.

### Task 3: Deterministic route-memory activity

**Files:**
- Create: `src/features/play/wilds-route-memory.ts`
- Test: `tests/wilds-route-memory.test.ts`

**Interfaces:**

```ts
export type WildsRouteDirection = "north" | "east" | "south" | "west";
export type WildsRouteMemory = { id: string; sequence: WildsRouteDirection[]; step: number; mistakes: number; phase: "briefing" | "active" | "complete"; eventIds: string[] };
export function createWildsRouteMemory(seed: string): WildsRouteMemory;
export function applyWildsRouteIntent(state: WildsRouteMemory, intent: "begin" | WildsRouteDirection): WildsRouteMemory;
```

- [ ] Write failing tests proving identical seed replay, exactly three readable directions, begin-before-input, bounded mistakes, completion only on the exact sequence, and no mutation after completion.
- [ ] Run focused tests; expect missing module.
- [ ] Implement the small immutable state machine with digest-derived directions and stable event IDs.
- [ ] Run focused tests; expect PASS.
- [ ] Commit `feat: add Wayfinder route memory`.

### Task 4: PlayState, save migration, and V3 vault continuity

**Files:**
- Modify: `src/features/play/game-state.ts`
- Modify: `src/features/play/wilds-player-vault.ts`
- Modify: `tests/game-state.test.ts`
- Modify: `tests/wilds-player-vault.test.ts`

**Interfaces:**
- Adds `civicEvents: WildsCivicEvent[]` and `regionalReputation: Record<string, number>` to `PlayState`.
- Adds `WildsInput` variant `{type:"record-civic-event"; event:WildsCivicEvent}`.

- [ ] Write failing tests proving one civic event updates reputation once, malformed events are ignored, V5 saves restore with empty history, the new save schema round-trips valid history, and a V3 vault round-trip preserves/deduplicates it.
- [ ] Run focused tests; expect type/behavior failures.
- [ ] Bump the play-save schema to V6 while admitting V2–V5; normalize civic history through `projectWildsCivicHistory`; apply verified civic events idempotently; include the projected regional score.
- [ ] Run focused tests and `pnpm typecheck`; expect PASS.
- [ ] Commit `feat: carry civic history in the player vault`.

### Task 5: Settlement 3D environment and canonical monuments

**Files:**
- Create: `src/features/play/WildsSettlementEnvironment.tsx`
- Modify: `src/features/play/WildsEnvironment.tsx`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**

```ts
export function WildsSettlementEnvironment(props: {
  settlement: WildsSettlementDefinition;
  relative: {x:number;z:number};
  livingWorld?: WildsWorldProjection | null;
  worldMode: "receiz_live" | "local_practice" | "connecting";
}): React.ReactNode;
```

- [ ] Load gameplay/graphics/3D integration references and record the asset-source decision before editing rendering code.
- [ ] Write a failing render-contract test for one existing-canvas settlement group, five named district groups, reusable materials/geometries, canonical monument projection from `defeatedBossIds`, practice labelling, and no second `Canvas`.
- [ ] Run focused tests; expect missing environment component.
- [ ] Build the Trail Gate, timber hall, compass garden, atelier, cartographer house, commons, lamps, card signs, and monument glass as an authored mobile-bounded kit. Import a generated hero hall GLB only if the asset pipeline returns a validated budget-safe file; otherwise retain the procedural fallback and record the real blocker.
- [ ] Mount it only inside settlement render distance and pass living-world mode through the canvas/environment chain.
- [ ] Run focused tests, typecheck, and renderer diagnostics; expect PASS.
- [ ] Commit `feat: build Wayfinder Hollow in the shared world`.

### Task 6: Full-screen settlement experience

**Files:**
- Create: `src/features/play/WildsSettlementExperience.tsx`
- Modify: `app/globals.css`
- Modify: `tests/wilds-render-contract.test.ts`
- Modify: `tests/mobile-layout-css.test.ts`

**Interfaces:**
- Consumes: active verified card, civic projection, live nearby players, living-world projection/mode, and `onCivicEvent`/`onExit` callbacks.
- Produces: reachable district navigation, resident/service actions, route puzzle, commons roster, and monument view.

- [ ] Load UI references and write failing contract/CSS tests for the five districts, three residents, proof-pinned attunement, route puzzle controls, live commons, canonical/practice monument copy, 44px close/return controls, safe-area layout, and 320px compact labels without required ellipsis.
- [ ] Run focused tests; expect missing component/styles.
- [ ] Implement one viewport with header, horizontally swipeable district rail, one internally scrollable focused panel, fixed action row, focus restoration, Escape confirmation during an active puzzle, and accessible status announcements.
- [ ] Run focused tests, typecheck, and lint; expect PASS.
- [ ] Commit `feat: open the Wayfinder Hollow settlement`.

### Task 7: Campaign, atlas, proximity, and audio integration

**Files:**
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Modify: `src/features/play/WildsWorldMap.tsx`
- Modify: `src/features/play/wilds-context-action.ts`
- Modify: `src/features/play/wilds-audio.ts`
- Modify: `tests/wilds-render-contract.test.ts`
- Modify: `tests/wilds-audio.test.ts`

**Interfaces:**
- Pulse priority remains battle, landmark/settlement entrance, raid, player, search.
- Settlement entry dispatches discovery once and passes current civic projection into the experience.

- [ ] Load audio workflow references and probe credentials before choosing generated files versus the existing synthesized engine.
- [ ] Write failing tests for atlas destination copy, approach-only Rift, physical settlement entry, civic event dispatch, save/vault inclusion, exact world mode passed to monuments, and settlement arrival/service/puzzle audio cues.
- [ ] Run focused tests; expect failures.
- [ ] Wire the settlement through the existing single campaign owner; add audio cue mappings and generated ambience/SFX when credentials succeed, otherwise document and use bounded synthesized cues.
- [ ] Run focused tests, typecheck, and lint; expect PASS.
- [ ] Commit `feat: connect Wayfinder Hollow to the Wilds`.

### Task 8: Recovery, visual quality, performance, and browser proof

**Files:**
- Create: `tests/wilds-landmark-civilization-release.test.ts`
- Modify production files only when a failing release test identifies a defect.

- [ ] Add release tests for deterministic civic recovery, duplicate service completion, invalid card attunement, V5 migration, V3 vault reconciliation, atlas/world coordinate equality, monument source authority, and mobile CSS contracts.
- [ ] Run full `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`; expect zero failures.
- [ ] Start the production server and verify fresh WebKit at 320×568, 390×844, and 430×932 plus desktop Chromium: open atlas, Rift near Wayfinder Hollow, walk into the Trail Gate, meet all residents, complete orientation and route memory, attempt valid/invalid attunement, inspect commons and monuments, close/return, save and restore the V3 vault, and confirm zero console errors.
- [ ] Record renderer diagnostics, nonblank canvas pixels, screenshots, touch targets, text fit, and gameplay controls under `output/playwright/`.
- [ ] Fill the exact ten-category premium visual scorecard and fix every automatic failure or record the concrete blocker.
- [ ] Commit `test: prove Wilds landmark civilization`.

### Task 9: Slice 2 evidence and closure

**Files:**
- Create: `docs/superpowers/evidence/2026-07-15-wilds-v3-slice-2.md`
- Modify: `docs/superpowers/specs/2026-07-15-wilds-v3-living-world-program-design.md`

- [ ] Record implementation commits, test/build results, browser matrix, civic event examples, save/vault migration, asset/audio sourcing ledgers, renderer metrics, exact ten-category visual scorecard, and known Slice 3 boundaries.
- [ ] Run the game-director premium report audit and fix every missing required ledger section.
- [ ] Scan implementation/evidence for `TODO`, `TBD`, placeholder, mock success, and ambiguous authority copy; expect no unresolved markers.
- [ ] Run `git diff --check` and confirm a clean release diff.
- [ ] Mark only Slice 2 complete; do not claim Slice 3 dynamic ecology content.
- [ ] Commit `docs: seal Wilds V3 slice two evidence`.

## Final acceptance gate

- Wayfinder Hollow is a permanent, coherent, physically enterable place rather than a map shortcut.
- Players can orient, meet residents, use public services, solve one deterministic puzzle, attune one verified card, see live explorers, and read canonical monuments.
- Civic history is deterministic, verified, idempotent, saved, and portable through the V3 vault.
- No settlement action fabricates ownership, transferable value, league score, boss truth, or shared history.
- The settlement is beautiful and readable on the smallest supported phone without covering movement controls or the app dock.
- Full tests, typecheck, lint, production build, fresh browser flows, console checks, renderer diagnostics, visual scorecard, asset/audio ledgers, and evidence audit pass.
