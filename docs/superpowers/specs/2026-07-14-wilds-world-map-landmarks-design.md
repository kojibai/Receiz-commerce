# Wilds World Map, Rift Travel, and Living Landmarks Design

Date: 2026-07-14  
Status: Approved design, implementation pending  
Target: Make Receiz Wilds feel like a vast, inhabited world that players can understand, traverse, discover, and remember from a compact mobile-first interface.

## 1. Product outcome

Wilds gains an icon-only globe control beside the existing sound control. Opening it reveals a cinematic, navigable 3D world atlas showing named world sections, biomes, landmarks, discoveries, events, and privacy-safe live player presence. A player can inspect any destination and perform a deliberate server-authorized Rift Drop there.

The existing D-pad remains the center of movement. A two-state Walk/Run control sits on one side and a context-sensitive Pulse control sits on the other. Pulse becomes the one exciting verb that makes the world respond: scan, enter, greet, challenge, join, trade, activate, collect, or unlock according to the nearest valid opportunity.

The first release introduces three deeply authored flagship landmarks rather than many shallow rooms. Each proves a different type of play and establishes reusable scene, matchmaking, card-admission, reward, and discovery systems for future locations.

The intended emotional loop is:

> Notice a distant mystery, understand where it belongs in the wider world, travel toward or Rift Drop near it, discover a memorable entrance, step into a place with its own identity and rules, use living cards in a meaningful activity, earn proof-backed progress, and leave with a story worth sharing.

## 2. Approaches considered

### Selected: layered 3D atlas with authored landmark instances

The atlas is a stylized 3D projection of the existing deterministic infinite-region world, not a second simulation. It renders a bounded level-of-detail overview from world metadata, while each enterable landmark opens an authored, independently streamed experience attached to a stable world coordinate. This preserves the current infinite world, keeps mobile performance bounded, and allows each destination to feel genuinely different.

### Rejected: conventional flat minimap and teleport menu

A flat panel would be inexpensive but would not communicate scale, verticality, biome identity, player movement, or the emotional promise of a living world. It would also reduce travel to a utility list instead of discovery.

### Rejected: render the entire playable Three.js world inside the map

Running a second full world simulation would duplicate geometry, effects, multiplayer actors, and render-loop work. It would perform poorly on mobile and couple navigation UI to scene details. The atlas instead consumes compact world projections and swaps to full scenes only after travel or entry.

## 3. World atlas experience

### 3.1 Entry and layout

- Add one icon-only globe button immediately beside the existing sound icon in the top-left utility cluster.
- Preserve a minimum 44 CSS-pixel touch target, visible focus state, tooltip, and `aria-label="Open world map"` while keeping the visible chrome compact.
- Open the atlas as a focused full-screen layer above the world and below only critical system dialogs. The underlying play state pauses local movement input but retains safe multiplayer heartbeat behavior.
- Keep the close control inside top and right safe-area insets, never beneath the application header, device notch, or another icon.
- Escape, the close icon, and an explicit Return to World action dismiss the atlas and restore focus to the globe button.

### 3.2 Visual language

The atlas uses the existing Wilds midnight glass, mint, gold, coral, and living-foil language, but feels spatial rather than dashboard-like:

- sculpted biome masses and atmospheric depth;
- animated cloud, aurora, current, and ley-line layers at bounded quality tiers;
- clear silhouettes for major landmarks;
- glowing paths for known routes and soft fog for unexplored territory;
- pulsing event beacons and restrained live-player constellations;
- a home marker, current-position beam, selected-destination arc, and Rift trajectory;
- spatial audio accents and subtle haptics where supported;
- reduced-motion mode that replaces orbital travel and zoom bursts with short fades and stable highlighting.

The map must create wonder without hiding information. Text remains limited to the selected region and destination sheet; the world itself uses recognizable color, shape, motion, and iconography.

### 3.3 Navigation

- One-finger drag or mouse drag orbits/pans the atlas.
- Pinch, wheel, and keyboard controls zoom between world-section, regional, and landmark levels.
- Tapping a region centers it; tapping a landmark or event selects it and opens a compact destination sheet.
- A Locate control returns to the player's current position.
- A searchable discovery index supports known landmarks, friends who permit location sharing, active events, and biome names without becoming the primary experience.
- Keyboard, switch-style focus traversal, and buttons provide equivalents for all gestures.
- Camera bounds, snap points, damping, and level-of-detail transitions keep navigation predictable on small screens.

### 3.4 Information hierarchy

At world-section zoom, show biome identity, large landmark silhouettes, major events, and aggregated activity. At regional zoom, reveal paths, discovered sites, nearby public players, and regional mastery. At landmark zoom, show entrance state, activity type, party size, difficulty, rewards, card requirements, active friends, and travel actions.

Unexplored places expose an evocative silhouette, rumor, or signal instead of a complete spoiler. Discovery permanently reveals its proper name and atlas entry.

## 4. Live player presence and privacy

- The atlas consumes sanitized, server-confirmed regional presence; it never fabricates live players from local state.
- Exact position is visible only for nearby players or friends who explicitly permit it. At wider zoom levels, strangers appear as delayed, aggregated activity lights rather than trackable individual dots.
- Busy, private, blocked, offline, and reconnecting rules remain consistent with the existing multiplayer system.
- Selecting an eligible nearby player offers the same interaction capabilities as the world: greet, meet, challenge, invite, or trade when those capabilities are valid.
- Presence counts and markers are bounded and clustered so popular regions remain legible and cannot exhaust rendering resources.

## 5. Rift Drop travel

Rift Drop fulfills the promise that a player can place their explorer anywhere on the atlas while preserving multiplayer integrity.

1. The player taps any valid terrain destination.
2. The atlas previews region, biome, nearby landmark, public activity level, safety state, and arrival point.
3. The player presses and holds the icon-only Rift action to confirm; a progress ring prevents accidental travel.
4. The client requests a server-authorized relocation containing source position, destination, current region revision, and idempotency key.
5. The server validates numeric bounds, destination legality, cooldown, active battle/activity locks, and arrival safety. It returns a signed/authoritative relocation grant.
6. The atlas plays a short Rift trajectory, streams the target region, updates room membership, and places the explorer at the granted safe coordinate.
7. Movement resumes only after the destination scene and authoritative presence revision are ready.

Rift travel is an explicit exception to normal movement validation. The existing speed/teleport rejection remains unchanged for D-pad motion. Rift requests cannot be used during battle, settlement, reward sealing, or another locked activity. Failed travel keeps the player at the source and provides a retryable reason. Initial cooldown should be short enough to invite exploration while preventing request spam; it must be server-configurable rather than encoded into presentation.

## 6. Movement and Pulse controls

### 6.1 D-pad composition

Keep the current D-pad geometry and behavior. Add exactly one bounded control on each side in the same dedicated control row so no button overlays the D-pad, game dock, viewport, or application navigation.

- Walk/Run: a two-state icon button using a walking figure and sprinting figure. Walking prioritizes precision and social proximity; running raises movement speed and locomotion intensity. The active mode persists locally and exposes `aria-pressed` plus an accessible name.
- Pulse: a context-sensitive icon button whose visual glyph and accent change only when the available action changes. It always exposes the current action in its accessible name and optional compact tooltip.

Touch targets remain at least 44 CSS pixels. Visible icon treatments may be smaller and tasteful. The control row must fit supported portrait and landscape sizes without truncation or overlap.

### 6.2 Pulse priority

Only one primary action appears at a time. A deterministic resolver selects it by urgency, validity, proximity, and facing:

1. critical acknowledgement or reward collection;
2. enter or exit a landmark;
3. activate a quest, secret, gate, or world object;
4. interact with a nearby selected player;
5. join a public activity or minigame;
6. scan the environment for hidden signals;
7. neutral world pulse when no specific target is valid.

Holding Pulse may open a small radial choice when multiple equal-priority actions are valid. A tap never performs destructive, ownership-changing, or stake-bearing actions without the existing confirmation and authority checks.

## 7. Enterable landmark framework

Every landmark is a stable world entity with:

- a globally stable ID, coordinate, biome affinity, discovery state, entrance rules, and atlas projection;
- an exterior signal and entrance sequence unique enough to recognize from a distance;
- a streamed interior scene or activity stage with its own lighting, audio, camera grammar, and Pulse actions;
- solo, party, public-instance, or matchmade occupancy rules;
- explicit verified-card admission rules and a pinned proof digest for each admitted card;
- authoritative session, score, reward, achievement, and exit state;
- reconnect, timeout, abandon, and failure behavior;
- a memory entry recording discovery and legitimate accomplishments without changing original card identity.

Landmark interiors are modes within the active Wilds experience, not unrelated storefront routes. Players retain the same explorer identity, party, selected verified cards, and return coordinate. Shared lobbies show server-confirmed occupants; competitive instances receive isolated authoritative match state.

## 8. Three flagship landmarks

### 8.1 Hearttree Sanctum — mastery and card awakening

Purpose: prove solo discovery, card-specific trials, narrative mastery, and special unlocks.

The existing Hearttree landmark becomes an enterable living sanctuary whose chambers respond to a card's verified element, lineage, growth history, achievements, and bond. Players choose a verified card and complete a short authored trial combining navigation, timing, environmental Pulse interactions, and a Master battle. The final Master uses deterministic, server-authoritative battle rules and a difficulty projection based on the admitted card without silently scaling outcomes mid-fight.

Rewards can include an achievement, cosmetic aura, lore memory, new legal ability expression, sanctuary key, or eligibility for an existing growth/Ascension path. No reward rewrites the original proof; progress appends through the living-card history rules.

### 8.2 Arena of Echoes — multiplayer competition and spectacle

Purpose: prove social gathering, matchmaking, fair card competition, spectatorship, and repeatable mastery.

The Arena has a shared concourse where explorers meet, inspect public card summaries, form parties, practice, and enter friendly competitions. Match portals support one-versus-one card battles first, with time trials and small bracket events built on the same session framework. Player cards are verified and pinned before entry; battle turns and results are authoritative and idempotent.

The arena celebrates skill with entrances, crowd energy, proof-sealed result cards, rankings scoped to valid seasons or events, and non-custodial rewards. Card staking remains capability-locked unless the existing atomic ownership-exchange requirements are satisfied.

### 8.3 Prism Arcade — cooperative minigames and surprising card utility

Purpose: prove joyful replayable minigames, cooperative presence, and uses for cards beyond battle.

The Arcade is a luminous social destination containing three initial activity portals powered by reusable minigame contracts:

- Resonance Run: one to four players guide energy through a shifting course; card speed, guard, and elemental affinity determine legal loadout roles while timing and movement determine success.
- Signal Forge: players cooperate through Pulse-based rhythm and pattern recognition to stabilize a discovered relic; diverse card elements create complementary effects rather than a single dominant card.
- Memory Labyrinth: a solo or party navigation challenge whose route, clues, and secret chamber derive deterministically from the session seed and admitted cards.

Each activity is short, readable, replayable, and built around player decisions. Scores are accepted only from authoritative activity state. Rewards emphasize achievements, mastery, cosmetics, lore fragments, and bounded progression rather than automatic valuable-asset generation.

## 9. Discovery and reward design

- First discovery has a strong but brief reveal: landmark name, identity sting, atlas inscription, and one clear next action.
- Repeated visits replace ceremony with fast entry while retaining ambient identity.
- Secrets use layered clues across exterior world signals, atlas rumors, card affinities, and Pulse responses.
- Every landmark has at least one immediately understandable activity, one mastery path, one social reason to return, and one hidden layer.
- Rewards state their source, requirement, authority, and effect. Valuable card creation, ownership transfer, lineage, growth, and achievement changes continue through existing proof and append rules.
- Failure gives information, practice progress, or a new clue without pretending the player won.

## 10. Architecture boundaries

Introduce small pure boundaries before presentation components:

- `wilds-world-atlas`: projects deterministic region metadata into bounded atlas nodes and level-of-detail layers.
- `wilds-rift-travel`: validates request/grant state and separates authorized Rift relocation from ordinary presence movement.
- `wilds-context-action`: resolves the single Pulse action from authoritative opportunities.
- `wilds-landmarks`: registry of stable landmark metadata, discovery requirements, entrance capabilities, and scene loaders.
- `wilds-activities`: generic activity lifecycle for lobby, admission, ready, active, result, reward, and exit.
- `wilds-minigames`: pure deterministic rules per minigame, independent from React and Three.js presentation.

React components own controls, sheets, focus, and status. Three.js components own bounded visuals and animation. Neither layer decides rewards, admits altered cards, authorizes relocation, resolves competitive outcomes, or mutates ownership.

## 11. Responsive, accessibility, and safety requirements

- The atlas, destination sheet, D-pad row, and landmark interfaces must fit the smallest supported mobile viewport and all device safe areas without truncation.
- Every sheet scrolls internally when content exceeds its available height; page body and world movement remain contained.
- Icon-only controls retain labels for assistive technology, focus rings, tooltips where appropriate, and distinguishable states beyond color.
- Atlas gestures have button and keyboard equivalents.
- Reduced motion, mute, audio group settings, and quality profiles apply inside every landmark and minigame.
- Photosensitive-risk effects avoid rapid full-screen flashes. Haptics remain optional.
- Public location sharing, party invitations, chat, blocking, reporting, and age/privacy controls inherit multiplayer policy.

## 12. Performance budgets

- Keep one active full world renderer. The atlas uses a bounded lightweight scene and does not run concurrently with full landmark simulation.
- Atlas target: at most 90 draw calls and 120,000 visible triangles on high quality, with lower tiers reducing atmosphere, labels, particles, and geometry detail.
- Cluster and cap player markers; no unbounded per-player meshes, labels, polling, or animation loops.
- Landmark scenes reuse pooled materials and geometries and unload on exit after preserving authoritative session state.
- Target at least 30 FPS on supported mid-range mobile devices and 60 FPS on capable devices.
- Pause nonessential animation when the page is hidden, motion is reduced, or a blocking dialog is active.

## 13. Failure and recovery

- Atlas projection failure falls back to an accessible region list with Locate and Rift actions.
- WebGL context loss preserves travel selection and offers recovery without moving the player.
- Stale or rejected Rift grants never update local position.
- Destination load failure returns the player to the confirmed source or server-provided safe spawn.
- Disconnect during a landmark activity preserves authoritative progress when reconnectable; otherwise the server resolves timeout or abandon exactly once.
- Invalid, foreign, unavailable, or changed cards are rejected before activity entry with a specific recovery action.
- Duplicate joins, score submissions, results, rewards, achievements, and exits are idempotent.

## 14. Test and release strategy

All behavior changes follow red-green-refactor.

### Pure and contract tests

- deterministic atlas projection, biome grouping, discovery fog, clustering, and level-of-detail;
- Pulse priority and equal-priority radial choices;
- walk/run speed intent and persistence;
- Rift request bounds, locked states, grant validation, cooldown, idempotency, safe spawn, and explicit anti-teleport exception;
- landmark registry uniqueness, stable coordinates, entrance rules, and lazy scene contracts;
- card admission and exact proof pinning;
- deterministic Master battle and all three minigame reducers;
- authoritative score, achievement, reward, reconnect, abandon, and duplicate rejection;
- preservation of existing multiplayer, proof, ownership, growth, card, vault, and save contracts.

### Browser verification

- globe placement beside sound and reachable close control at desktop and supported mobile viewports;
- atlas open, drag, pinch/wheel, zoom levels, selection, search, Locate, and return focus;
- privacy-safe two-context live presence and aggregation;
- successful and rejected Rift Drop with arrival synchronization;
- D-pad with independent Walk/Run and Pulse buttons and no dock/navigation overlap;
- discovery and entry of all three landmarks;
- one complete Hearttree trial, Arena match, and each Prism minigame in solo or two-context form as applicable;
- disconnect/reconnect, reduced motion, keyboard-only flow, screen-reader labels, muted audio, context loss fallback, and no console errors.

### Release gates

- full test suite, typecheck, lint, and optimized production build;
- representative mobile screenshots for default controls, atlas zoom levels, destination confirmation, each landmark lobby, and activity states;
- no unsupported teleport path, client-authoritative score, fake player marker, overlapping control, inaccessible close action, or truncated required content;
- frame-budget evidence on low, medium, and high quality profiles;
- deployment smoke test on the primary Receiz domain before claiming end-to-end completion.

## 15. Delivery phases

1. Foundations: pure atlas projection, Pulse resolver, movement mode, landmark registry, Rift authority contract, and failing tests.
2. Navigation vertical slice: compact globe control, responsive 3D atlas, discovery layers, destination sheet, player aggregation, and one authorized Rift Drop.
3. World controls: Walk/Run and Pulse beside the unchanged D-pad, with responsive and accessibility verification.
4. Hearttree Sanctum: complete exterior signal, entry, card admission, trial, Master battle, reward, and return loop.
5. Arena of Echoes: shared lobby, verified matchmaking, authoritative match, result ceremony, and reconnect.
6. Prism Arcade: the three activity portals, deterministic reducers, multiplayer sessions, scores, rewards, and mastery.
7. World-class polish: audio, haptics, spatial transitions, secrets, social invitations, atlas memory, quality tuning, complete browser matrix, and production smoke verification.

The release remains usable after each phase. A phase is not complete until its behavior, mobile layout, authority boundary, recovery path, and performance budget are verified.

## 16. Explicit non-goals for this slice

- No cash wagering, paid tournament entry, or unapproved custody behavior.
- No fabricated global player population.
- No unrestricted client-side position mutation.
- No procedurally generated valuable cards merely for elapsed time or repeated minigame attempts.
- No replacement of the current deterministic world, card proof format, D-pad, vault, or multiplayer authority model.
- No promise that every future landmark ships in the first release; the three flagships establish the world-class reusable foundation.
