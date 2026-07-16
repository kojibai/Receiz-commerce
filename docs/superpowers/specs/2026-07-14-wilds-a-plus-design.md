# Receiz Wilds A+ Production Upgrade Design

Date: 2026-07-14  
Status: Approved design, implementation pending  
Target: Raise every measured product dimension to an evidence-backed A range without weakening proof authority, portability, deterministic gameplay, or mobile performance.

## 1. Outcome

Receiz Wilds becomes a game-first, emotionally resonant collecting adventure whose complete loop is:

> Explore an evolving shared world, interpret living environmental signals, battle a discovered creature, seal it into a portable offline-verifiable card, grow its append-only life story through earned play, and use or exchange it without leaving the active Receiz surface.

The upgrade is successful when the game feels authored rather than procedural, every important action has visual and audio feedback, the world supports durable authenticated multiplayer, the interface fits desktop and mobile without collisions, and production verification demonstrates reliable performance and authority boundaries.

## 2. Non-negotiable invariants

- The PNG remains the portable proof object for an individual card or vault.
- Card verification remains offline-capable and rejects altered image or proof bytes.
- Living cards preserve their original identity and append history rather than replacing it.
- Children are independent assets; parents remain reusable subject to earned Spark and cooldown rules.
- Creature placement, variants, combat, growth, and lineage remain deterministic from sealed inputs.
- Financial settlement, ownership transfer, exchange admission, publication, and wager settlement remain server-authoritative.
- Checkout, verification, purchase, trade, and gameplay stay on the active application or tenant domain.
- Existing versioned saves and verified cards remain readable.
- Mobile is a primary target, not a reduced desktop afterthought.

## 3. Delivery strategy

Implementation proceeds as one production vertical slice with independently verifiable phases. The first completed slice covers one active biome, one explorer, one discovery, one battle, one capture, one living card, and one authenticated multiplayer challenge. Once its quality gates pass, the same reusable systems propagate across the infinite world and all creature families.

This avoids polishing isolated screens while preserving an end-to-end playable loop after every phase.

## 4. Architecture

### 4.1 Presentation kernel

Add a small game-presentation layer beneath React UI and above deterministic game state:

- `wilds-audio`: event-driven Web Audio graph with ambience, music stems, SFX, volume groups, mute, unlock, pause, and cleanup.
- `wilds-visual-events`: short-lived typed events for search pulses, habitat motion, combat impacts, capture anticipation, reveal, evolution, and multiplayer arrivals.
- `wilds-biomes`: deterministic biome, landmark, weather, foliage, prop, color, and encounter-density projection from world coordinates and account progress.
- `wilds-avatar`: authored modular explorer anatomy, materials, selection, locomotion, idle, turn, battle-ready, and celebration states.
- `wilds-quality-profile`: capability-aware DPR, shadows, foliage density, particles, and post-processing budgets.

These layers may consume authoritative state but never create proof, ownership, rewards, combat outcomes, or settlement decisions.

### 4.2 Deterministic world evolution

World coordinates map to stable regions. Each region derives:

- biome and sub-biome;
- landmark grammar and traversal paths;
- weather and time-of-day presentation;
- stable hidden hotspots and habitat cover;
- mission chapter and regional mastery state;
- cooperative events and Titan gates;
- cosmetic world growth unlocked by account progress.

Account progress appends unlocked world modifiers to the save. The same coordinate and progress revision always regenerate the same world. Visual density streams within a bounded radius and uses pooled or instanced support objects.

### 4.3 Authored hybrid art system

External generation credentials are currently unavailable, so the initial implementation uses authored code-driven geometry and materials while keeping model-loader boundaries ready for later GLB substitution.

The explorer uses layered custom geometry rather than a stack of visible primitive blocks: shaped torso, limbs, hands, boots, hair, clothing panels, face silhouette, accessories, and gender presentation. Animation uses a stable local skeleton hierarchy with eased locomotion, secondary motion, foot planting, turns, idle breathing, search gestures, battle stance, and capture celebration.

World kits combine custom geometry, procedural surface textures, instanced foliage, landmark silhouettes, particles, fog volumes, color grading, and real gameplay cover. Decorative objects must also communicate traversal, habitat, climate, progression, or encounter state.

Creature card art keeps the deterministic Heartbound grammar. Its same genome drives limited 3D encounter silhouette and motion cues so the battlefield and card feel like the same being.

### 4.4 Audio system

This historical A+ slice originally used local Web Audio synthesis. That policy is superseded by the world-class production-audio design: the release runtime uses local authored samples only, with no oscillator fallback, cloud sound provider, or runtime audio dependency. It includes:

- layered biome ambience;
- soft exploration music pulse;
- proximity tension that intensifies from cold to warm to hot;
- terrain-search ping and directional response;
- habitat rustle and emergence;
- battle attack, guard, damage, low-health, switch, victory, and flee cues;
- capsule throw, shake stages, seal confirmation, and card reveal;
- evolution and lineage ceremony;
- UI hover/press/confirm/error cues;
- remote-player arrival, chat, challenge, accept, countdown, and battle-turn cues.

Audio begins only after a user gesture. Settings include master, ambience, music, and effects levels plus mute. Nodes, timers, and loops are cleaned up on unmount, pause, logout, and route changes.

### 4.5 Game-first responsive interface

The play surface becomes visually primary:

- compact safe-area-aware header;
- full-height world viewport within the available screen;
- icon-first, text-on-demand controls;
- bounded top status cluster with no coordinate or challenge truncation;
- bottom controls that float without reserving blank background space;
- mission, reward, deck, inventory, and multiplayer panels collapsed by default and expanded as sheets;
- no app navigation or game panel may cover actionable world or modal content;
- capture, battle, evolution, card reveal, and multiplayer challenge stages fit one viewport at supported mobile sizes.

All icon-only buttons have accessible names and visible focus states. Touch targets remain at least 44 CSS pixels even where the visible icon is smaller.

### 4.6 Durable multiplayer

Practice and authenticated modes are explicitly distinct.

Authenticated multiplayer uses Receiz identity and World-compatible server routes for:

- room membership and heartbeat expiry;
- bounded nearby presence;
- reconnect and last-known state;
- sanitized chat;
- challenge offer, accept, decline, expiry, and cancellation;
- pinned verified battle cards;
- server-authoritative deterministic turns;
- forfeit and disconnect resolution;
- optional card or monetary stake escrow and atomic settlement.

Money and cards cannot be placed at risk from client-only state. A wager is active only after the server proves authority, asset ownership, amount, participant consent, and settlement intent. Failed or expired wagers return escrow according to a sealed idempotent operation.

### 4.7 Progression and live world

The endless mission system has three nested loops:

- Moment: search, move, battle, capture, train, or interact with another explorer.
- Session: complete regional objectives, quests, streaks, cooperative events, and mastery milestones.
- Long term: unlock world chapters, biome transformations, Titan gates, card Ascensions, lineage achievements, cosmetics, and account history.

Progress must come from authoritative gameplay events. Elapsed time alone never generates cards, children, ranks, or valuable rewards. Daily or seasonal framing may rotate objectives but never invalidate owned proof assets.

## 5. Data flow

### Solo encounter

1. Pointer input is translated into a terrain coordinate.
2. Deterministic hotspot search returns hit, directional hint, or empty result.
3. Presentation events drive pulse, foliage, screen, haptic-capable, and audio feedback.
4. A hit pins the creature proof inputs and starts deterministic battle state.
5. Server or local authoritative game state resolves turns and capture eligibility.
6. Successful capture seals exactly one card, appends inventory ownership, and emits the capsule/reveal sequence.
7. Export, upload, exchange, shop, and QR registry consume the same verified artifact.

### Living growth

1. Gameplay produces deduplicated progress events.
2. Growth engine checks bond, quest, achievement, catalyst, recovery, and proof-chain validity.
3. An eligible Ascension appends a revision beneath the same stable asset ID.
4. Renderer derives the new maturity, art, statistics, story, and effects from the appended chain.

### Multiplayer challenge

1. Authenticated client publishes bounded presence.
2. Nearby snapshot projects only players within the permitted region radius.
3. Challenger submits opponent, verified card selection, and optional stake proposal.
4. Opponent explicitly accepts the exact pinned terms.
5. Server reserves authorized stakes, resolves deterministic turns, and appends battle events.
6. Settlement transfers ownership or funds exactly once and releases unused escrow.

## 6. Error and recovery behavior

- Audio decode or context failures leave the game playable and expose a retryable muted state.
- Model or texture load failures fall back to authored local geometry/materials without blocking input.
- WebGL context loss pauses the loop and displays a recovery action.
- Multiplayer transport failure switches to a clearly labeled offline/practice state; it never simulates remote people.
- Stale presence expires automatically.
- Duplicate combat, capture, growth, trade, publish, or settlement requests remain idempotent.
- Corrupt saves restore the last valid versioned state or safe starter state and never silently admit unverifiable cards.
- Failed card or vault imports explain whether the PNG is legacy, altered, foreign-owned, or unsupported.
- Reduced-motion preference disables camera shake, rapid foil movement, and nonessential parallax while preserving state feedback.

## 7. Performance budgets

Target active mobile gameplay at 30 FPS minimum on mid-range devices and 60 FPS on capable devices.

- Adaptive DPR: 1.0 low, 1.25 medium, 1.5 high.
- Normal exploration target: at most 120 draw calls and 180,000 visible triangles.
- Capture/reveal burst target: at most 180 draw calls and 280,000 visible triangles.
- Reuse geometries and materials; instance repeated foliage and props.
- Bound active particles and visual events.
- One main canvas and one render-loop owner.
- Shadow maps use supported Three.js constants and quality profiles.
- No per-frame console warnings, allocations from repeated material construction, or unbounded multiplayer polling.
- Stop expensive effects when hidden, paused, or outside the active play surface.

## 8. Test strategy

Every behavior change follows red-green-refactor.

### Unit and contract tests

- deterministic biome and landmark projection;
- quality-profile selection and budgets;
- visual-event reducer and bounded expiry;
- audio event mapping, settings, unlock, mute, and cleanup;
- responsive rendering contracts and absence of deprecated Three.js configuration;
- world progression unlocks from gameplay only;
- authenticated presence, reconnect, expiry, challenge, escrow, turn, forfeit, and settlement;
- preservation of all portable-card, proof-chain, ownership, exchange, shop, and save migration contracts.

### Browser tests

- desktop and representative mobile viewport screenshots;
- explorer selection and real locomotion input;
- cold, warm, hot, rustle, discovery, battle, capture, seal, and reveal;
- one-viewport modal fit and no actionable overlap;
- audio unlock, mute, settings persistence, and route cleanup;
- two isolated authenticated browser contexts seeing one another, chatting, challenging, battling, disconnecting, and reconnecting;
- standalone card front/back and QR-resolved cross-device route;
- inventory import/export and shop listing.

### Release gates

- full tests, typecheck, lint, SDK doctor, and optimized build;
- zero uncaught page errors;
- zero repeated Three.js warnings;
- nonblank canvas pixel evidence;
- renderer diagnostics at desktop and mobile;
- long-session resource and multiplayer request audit;
- exact visual scorecard with every category at least 2/3; any remaining automatic failure blocks an A+ claim.

## 9. Implementation phases

### Phase 1: Warning-free presentation foundation

Create quality profile, visual events, audio runtime, supported Three.js timer/shadow behavior, and diagnostics. Establish failing tests before production changes.

### Phase 2: A+ world and explorer vertical slice

Build the authored explorer, locomotion/secondary motion, first complete biome kit, landmark, weather, surface materials, environment VFX, and matching synthesized audio.

### Phase 3: Cinematic end-to-end loop

Upgrade proximity, rustle, emergence, battle impact, capture, capsule, reveal, evolution, lineage, and card-view transitions while preserving deterministic authority.

### Phase 4: Responsive game-first interface

Remove shell collisions, fit every play stage into mobile safe areas, add settings/accessibility, and verify touch, keyboard, pointer, and reduced-motion behavior.

### Phase 5: Durable shared world

Prove authenticated two-client presence, chat, invites, challenges, battle, reconnect, forfeit, optional escrow, and settlement through Receiz-compatible routes.

### Phase 6: Endless authored progression

Add deterministic biome chapters, world transformations, cooperative events, regional mastery, Titan expeditions, lineage achievements, and balancing diagnostics.

### Phase 7: Release qualification

Run full automated and browser matrices, profile production builds, fix regressions, capture scorecard evidence, and report any honest blocker instead of claiming A+ prematurely.

## 10. External asset plan

External generation credentials are intentionally outside the audio production path. Sound is authored internally or with license-audited open-source offline tooling; human dialogue uses original recorded performances.

- Hero/player: authored modular Three.js geometry now; GLB loader boundary retained for later generated or artist-provided replacement.
- Creatures: deterministic Heartbound SVG/card art plus genome-driven encounter silhouettes.
- World: authored procedural biome kits, textures, landmarks, weather, and instanced ecology.
- UI: CSS/SVG icon system and game-specific material language.
- Audio: Web Audio synthesis and procedural ambience.

No secret is added to browser code. If generation credentials become available later, external assets must pass the same size, animation, visual, and mobile performance gates before replacing fallbacks.

## 11. Acceptance score targets

| Dimension | Minimum |
|---|---:|
| Core discovery/battle/capture | 9.0/10 |
| Portability/proof | 9.5/10 |
| Progression/lineage | 9.0/10 |
| Creature uniqueness | 9.0/10 |
| World exploration/content | 9.0/10 |
| Multiplayer/PvP | 9.0/10 |
| Economy/shop/exchange | 9.0/10 |
| Mobile/desktop UX | 9.0/10 |
| Game feel/audio | 9.0/10 |
| Performance | 9.0/10 |
| Reliability/security | 9.5/10 |
| Accessibility/onboarding | 9.0/10 |
| Retention/live progression | 9.0/10 |

The visual scorecard must average at least 2.5/3 with no category below 2 and no automatic failure. Scores are awarded only from fresh production-build, browser, renderer, and two-client evidence.

## 12. Out of scope for this production pass

- Native iOS or Android binaries; the installable web application remains the target.
- Third-party custody, multiplayer, chat, payment, or marketplace services.
- Unbounded real-money wagering without jurisdiction, age, risk, and compliance gates supplied by Receiz authority.
- Replacing the deterministic proof/card format.
- Copying protected characters, names, card layouts, sounds, or visual trade dress from another franchise.
