# Receiz Wilds A+ Completion Implementation Plan

> **Execution:** Follow red-green-refactor per task and commit independently reviewable slices on the user-approved `main` branch.

**Goal:** Complete Phases 3–7 of the approved Wilds A+ design by deepening deterministic combat, adding emotionally expressive creature presentation, introducing endless authored world chapters/events, hardening multiplayer recovery, and qualifying the complete production loop on desktop and mobile.

**Architecture:** Preserve `game-state.ts` as the authoritative solo reducer and the Receiz-backed multiplayer routes as the shared-world authority. Add pure deterministic engines for combat tactics and world chapters; keep presentation in focused React/R3F components. All valuable outcomes remain proof-linked, idempotent, and derived from authoritative gameplay events.

**Stack:** Next.js 15, React 19, React Three Fiber 9, Three.js 0.182, TypeScript, Node test runner, Playwright, Receiz SDK 100.0.0.

## Task 1: Deterministic tactical battle v2

**Files:** `src/features/play/battle-engine.ts`, `src/features/play/WildsBattle.tsx`, `src/features/play/game-state.ts`, `tests/battle-engine.test.ts`, `tests/play-game-state.test.ts`, `tests/wilds-render-contract.test.ts`, `app/globals.css`.

- Add six battle elements, deterministic effectiveness, readable enemy intents, focus/combo, guard break, and bounded status conditions.
- Keep the two existing authored abilities compatible; project their tactical role from sealed card stats and form element.
- Add a third context action (`focus`) and surface intent, status, effectiveness, and combo without increasing mobile modal height.
- Ensure capture remains available only after earned weakening and knockout still causes flight.
- Verify deterministic replay, status expiry, switch behavior, growth awards, mobile fit, and save compatibility.

## Task 2: Emotionally expressive creature stage

**Files:** create `src/features/play/WildsCreatureActor.tsx`; modify `src/features/play/WildsWorldCanvas.tsx`, `src/features/play/WildsBattle.tsx`, `tests/wilds-render-contract.test.ts`.

- Replace the generic encounter body with genome-driven silhouettes: species-specific torso, head, limbs, ears/horns/wings/tails, facial expression, markings, and element aura.
- Add deterministic idle, curiosity, fear, impact, attack, weakened, and capture anticipation poses driven only by encounter/battle state.
- Retain the four flagship identities and derive all other creatures from the existing anatomy grammar.
- Keep remote/detail budgets bounded and preserve the card renderer as the canonical 2D identity.

## Task 3: Endless authored chapters and world events

**Files:** create `src/features/play/world-progression.ts`, `src/features/play/WildsWorldEvent.tsx`; modify `src/features/play/wilds-biome.ts`, `src/features/play/game-state.ts`, `src/features/play/PlayCampaign.tsx`, `src/features/play/WildsEnvironment.tsx`, tests.

- Project deterministic chapters from authoritative mastery: Verdant Crown, Ember Reach, Tidal Lanterns, Skyglass Expanse, and Umbral Bloom.
- Each chapter changes palette/ecology/weather, exposes a mastery objective, and unlocks a deterministic cooperative or solo world event.
- Add Titan expeditions and lineage milestones without time-only rewards or invalidating existing cards.
- Show current chapter, next unlock, event objective, and permanent account equity compactly.

## Task 4: Responsive onboarding and accessibility completion

**Files:** create `src/features/play/WildsJourneyGuide.tsx`; modify `src/features/play/PlayCampaign.tsx`, `src/features/play/WildsAudioSettings.tsx`, `app/globals.css`, tests.

- Add a dismissible, progress-aware first-session guide that points to movement, search, battle, capture, inventory, and portability without blocking experienced players.
- Add explicit reduced-motion presentation state, keyboard discovery shortcut, focus restoration, live battle narration, and contrast-safe status signaling.
- Keep game-first mobile layout and all dialogs inside one viewport.

## Task 5: Durable multiplayer recovery and fair-play diagnostics

**Files:** `src/features/play/multiplayer-core.ts`, `src/features/play/multiplayer-ledger.ts`, `src/features/play/use-wilds-multiplayer.ts`, API routes, `tests/wilds-multiplayer.test.ts`.

- Add monotonic presence revisions, reconnect tokens, stale-client rejection, bounded chat rate limits, and deterministic challenge expiry.
- Add fair-play diagnostics for teleport, duplicate intent, stale battle revision, and settlement replay.
- Practice/offline state must remain explicit and must never impersonate a live player or settled wager.

## Task 6: Full production qualification

**Files:** measured corrections only; artifacts under `output/playwright/`.

- Run full tests, typecheck, lint, SDK doctor, and optimized build.
- Exercise desktop and 390x844 mobile: onboarding, movement, cold/warm/hot search, battle tactics, capture, reveal, inventory, evolution eligibility, QR/download fallback, and live-player presence.
- Verify zero console/page errors, nonblank canvas, modal fit, and renderer budgets.
- Produce the exact premium visual/gameplay scorecard and list any honest blocker instead of claiming an unearned 10/10.
