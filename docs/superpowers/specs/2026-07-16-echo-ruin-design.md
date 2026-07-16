# Echo Ruin Design

Date: 2026-07-16  
Status: Approved for implementation  
Program: Receiz Wilds location modernization

## 1. Outcome

Echo Ruin becomes the third complete card-driven Wilds location after Hearttree Sanctum and Wayfarer Market. It replaces the generic `listen → trace → align` buttons with a deterministic spatial memory expedition in which players recover a lost route by listening, navigating, assigning living cards, interpreting directional echoes, and activating a symbol grammar under pressure.

The ruin is not a static puzzle with one answer. Its chambers, echo sources, symbol language, hazards, false memories, reward path, and adaptive score derive from the ecology site, Pulse, canonical history, and the exact proof-pinned squad. Card senses, anatomy, element, abilities, stats, injuries, fatigue, upgrades, player position, timing, and action order create real causal differences.

## 2. Chosen approach

The approved approach is the **Resonant Route**, a hybrid of spatial audio navigation, visual symbol deduction, and timed physical restoration.

Two alternatives are intentionally excluded:

- a conventional Simon-style sequence would be readable but too shallow and disconnected from card identity;
- a combat-focused haunted ruin would overlap Hearttree hazards and underuse memory, listening, and interpretation.

The Resonant Route gives Echo Ruin a distinct identity: players hear incomplete evidence, use different cards to reveal or transform it, infer a route, physically traverse that route, and restore it with exact actions. The ruin responds to the squad, while the expedition persistently changes the cards.

## 3. Scope

### Included

- one complete solo expedition supporting one to three owned, living, proof-pinned cards;
- deterministic chamber graph, echo field, symbol grammar, false echoes, hazards, route, score, and rewards;
- a solvability proof for every offered Standard expedition;
- scouting, listening, triangulation, inscription tracing, sequence reconstruction, traversal, alignment, guarding, switching, abilities, and extraction;
- exact-card capability projection from real stats, abilities, anatomy, element, condition, mastery, and proof;
- fixed-step runtime, deterministic transcript, replay checkpoints, consequences, sealed receipt, server admission, and Save V10 integration;
- card XP, ruin mastery, injuries, fatigue, bounded resources, up to three evidence-grounded upgrades, relics, recovered history, and regional aftermath;
- optional two-or-three-card Mortal Descent with separately bound irreversible consent;
- responsive Three.js presentation, keyboard/touch controls, diagnostics, reduced motion, pause, focus restoration, and local adaptive production audio.

### Excluded

- randomized client-side answers, loot boxes, card wagering, automatic custody transfer, or real-money value;
- cloud-generated audio, browser speech, oscillators, or synthetic placeholder dialogue;
- generic button-sequence completion;
- multiplayer synchronization in this milestone;
- retroactive mutation of sealed card identity or canonical ruin history.

## 4. Playable loop

The loop is: **pin the right living cards, survey a changing ruin, collect incomplete resonant evidence, infer the true route, traverse and restore it with precise card actions, then accept replay-proven consequences.**

### 4.1 Entry and squad gate

The entrance discloses chamber count, minimum and maximum squad size, known environmental pressures, recommended capability families, reward bands, and Standard or Mortal risk. It never reveals the answer or names a guaranteed winning card.

Players select one to three living verified cards. Duplicate pins, foreign conditions, dead cards, changed proofs, invalid site projections, and squads outside the expedition gate fail closed. The chosen proofs and starting conditions are bound to the expedition definition.

### 4.2 Survey

Players enter a navigable ruin with several resonant sources. Sources differ by distance, direction, material, rhythm, pitch region, decay, visual inscription, and causal relationship. Players can listen at their current position, move to triangulate, inspect surfaces, assign the active card, and spend bounded focus to isolate a clue.

Evidence is persistent within the run but incomplete. Some clues reveal symbol order, some reveal traversal direction, some expose false memories, and some identify the action or element required at an anchor. Gathering every clue is inefficient or impossible, forcing players to prioritize evidence their squad can interpret.

### 4.3 Route reconstruction

The player assembles a proposed route from discovered symbols and chamber connections. A proposal may contain correct segments, reversed segments, decoys, or unsafe transitions. The interface explains evidence without automatically solving it.

Submitting a route does not merely return correct or incorrect. The ruin physically reconfigures: correct segments stabilize, contradictions generate dissonance, decoys move or close passages, and hazards inherit strength from unresolved evidence. Players may revise the route while focus and stability remain.

### 4.4 Traversal and restoration

The accepted proposal becomes a timed physical route. Players navigate chambers, avoid collapses and resonance waves, guard fragile anchors, switch cards, and perform the required real verb at the correct position and timing. Abilities consume stamina and respect cooldowns. A strong card cannot bypass missing evidence, an incorrect symbol, poor timing, or the wrong physical capability.

Each restored anchor adds a performed musical layer and clarifies the next portion of the ruin. Completion requires restoring the route in causal order. Safe extraction, partial recovery, ordinary defeat, completed restoration, and Mortal squad defeat remain distinct outcomes.

### 4.5 Result and aftermath

The result explains which evidence supported the route, which false echoes were accepted or rejected, which exact card traits affected resolution, where player timing and position mattered, and why each reward or injury occurred. Canonical progression applies only after server replay and admission. Practice outcomes remain local previews.

## 5. Exact card effects

- **Speed** increases triangulation reach, traversal margin, switch recovery, and resonance-wave evasion.
- **Power** clears collapsed passages, rotates stone anchors, stabilizes heavy mechanisms, and braces failing chambers.
- **Guard/armor/health** reduce anchor damage and injury severity and enable protective interception.
- **Bond** improves shared listening, reduces false-echo ambiguity, and supports multi-card motif reconstruction.
- **Grove** senses living overgrowth, reveals organic memory, repairs root-bound inscriptions, and softens recovery hazards.
- **Spark** identifies energy paths, times fast pulses, powers dormant mechanisms, and separates overlapping transients.
- **Tide** reads reflections and decay, carries resonance through flooded chambers, cools unstable anchors, and reverses flow clues.
- **Stone** interprets structural vibration, braces chambers, manipulates heavy anchors, and distinguishes authentic masonry from decoys.
- **Flight, climbing, swimming, digging, body size, limbs, sensory traits, and locomotion** open different listening positions and routes.
- **Abilities** retain their exact catalog names and power and gain a bounded ruin interpretation only when their semantics support it.
- **Injuries, fatigue, mastery, and upgrades** alter effective options; they are never cosmetic labels.

## 6. Deterministic director and solvability

The director consumes the ecology site identity, seed, region, phase, canonical Pulse, relevant history, squad proof pins, projected conditions, prior ruin mastery, and explicit risk mode. It produces:

- chamber and traversal graph;
- true route and bounded decoy routes;
- symbol grammar and evidence graph;
- spatial echo emitters and acoustic material tags;
- hazards, anchor requirements, timers, and counters;
- reward limits, relic definition, score direction, and aftermath;
- a solvability witness.

Identical canonical inputs reproduce the same definition. Materially different squads must change meaningful evidence access, routes, counters, anchor solutions, or reward opportunities.

Every Standard definition must have at least one viable perfect-information route and at least one attainable evidence set for its admitted squad. The generator searches the bounded state graph using projected capabilities, stamina limits, cooldowns, and condition effects. An unsolvable candidate is omitted rather than weakened after entry. Mortal Descent remains solvable under perfect play but permits tighter margins and lethal failure conditions.

## 7. Runtime and inputs

The fixed-step runtime accepts sequenced semantic inputs:

- move;
- listen and isolate;
- inspect inscription;
- pin or revise a route segment;
- commit route;
- guard;
- dodge;
- switch active card;
- perform role action;
- invoke ability;
- extract.

Runtime state owns player position, active card, card health/stamina/cooldowns, gathered evidence, proposed route, stabilized segments, active hazards, anchor state, ruin stability, score layers, inputs, and events. Invalid sequence, tick, coordinates, proof references, actions, or phase transitions record no authoritative effect.

Pure resolvers calculate listening, deduction, physical actions, hazards, and terminal state. React, Three.js, audio, storage, and network code cannot influence authoritative outcomes.

## 8. Consequences, rewards, and mortality

Standard expeditions can cause bounded fatigue, named injuries, lost stability, reduced rewards, closed relic paths, and extraction. Standard play cannot kill a card or transfer ownership.

Rewards are grounded in unique replayed contributions:

- card XP for listening, deduction, protection, traversal, restoration, and successful ability use;
- mastery for specific ruin verbs and symbol families;
- up to three upgrades derived from recorded successful actions;
- echo fragments and bounded crafting resources;
- one proof-bound relic or recovered-history record when its route was actually restored;
- canonical regional aftermath and later-world memory.

Mortal Descent requires two or three living cards and two explicit acknowledgments. Consent binds actor, definition digest, proof pins, starting conditions, lethal rules, and timestamp. Permanent death occurs only after a replay proves the disclosed squad-defeat condition and the server admits the receipt. Dead cards remain memorial inventory and can never return to play.

## 9. Adaptive score and real-recording policy

Echo Ruin receives a dedicated local score built from license-audited CC0/open-source field and instrumental recordings. Source material may include real stone impacts, chamber impulse-like recordings, wind through structures, frame drum, kalimba, chimes, water, wood, breathless environmental movement, and newly audited compatible recordings.

The score is reconstructed by gameplay:

- **entrance:** sparse wind, distant stone, and the unresolved ruin motif;
- **survey:** positional echo emitters and restrained exploration bed;
- **deduction:** discovered symbols introduce performed motif fragments;
- **dissonance:** false routes add unstable percussion and narrowed ambience;
- **restoration:** each correct anchor adds one synchronized musical layer;
- **danger/Mortal:** denser real percussion and low physical impacts;
- **victory:** the complete performed ruin theme assembled from recovered layers;
- **extraction:** incomplete but resolved cadence reflecting recovered evidence;
- **memorial:** restrained acoustic memorial without victory language.

Gameplay sounds include real footsteps/material movement, stone handling, inscription tracing, anchor mechanisms, guard, dodge, impacts, injury, switching, UI confirmation, relic recovery, extraction, and death. Elemental card motifs remain audible and phase-aware.

All runtime URLs are local. The implementation adds no audio dependency, cloud provider, synthetic speech, oscillator fallback, or browser voice. Human characters remain text-and-animation only until original performed recordings and releases exist. Every source, license, edit, duration, loop, loudness target, and runtime mapping is recorded in the provenance ledger and manifest.

## 10. Components and boundaries

- `echo-ruin/card-capability.ts`: exact proof, condition, sensory, anatomy, stat, ability, and verb projection;
- `echo-ruin/director.ts`: chamber, route, evidence, symbol, hazard, score, reward, and solvability generation;
- `echo-ruin/listening-resolver.ts`: pure positional evidence and isolation resolution;
- `echo-ruin/route-resolver.ts`: pure proposal, contradiction, decoy, and stabilization logic;
- `echo-ruin/action-resolver.ts`: pure traversal and restoration actions;
- `echo-ruin/runtime.ts`: fixed-step authoritative state and semantic inputs;
- `echo-ruin/transcript.ts`: deterministic replay, checkpoints, and tamper rejection;
- `echo-ruin/consequences.ts`: XP, mastery, resources, relics, injury, upgrades, and death;
- `echo-ruin/receipt.ts`: self-verifying outcome receipt;
- server admission module: actor, ownership, definition, replay, consent, idempotency, publication, and audit checks;
- `EchoRuinExperience.tsx`: entry, squad, deduction, runtime, result, and accessibility flow;
- `EchoRuinScene.tsx`: ruin geometry, spatial evidence visualization, hazards, anchors, VFX, and diagnostics;
- adaptive audio routing and dedicated local asset bank.

## 11. Authority and data flow

1. Client receives a canonical or practice Echo Ruin projection.
2. Player pins a valid squad and risk mode.
3. Director creates the deterministic definition and proof pins.
4. Runtime validates and records semantic inputs.
5. Pure resolvers produce evidence, route changes, effects, and explanations.
6. Client replays the terminal transcript for preview.
7. Canonical submission sends actor context, cards, prior conditions, definition, transcript, and Mortal consent when applicable.
8. Server resolves identity, verifies ownership and proofs, validates or regenerates the definition, replays the transcript, projects consequences, seals the receipt, publishes state, and appends the audit event.
9. Client adopts only the admitted receipt and reconciled Save V10 projection.

Publication or audit failure cannot partially apply XP, resources, relics, injuries, upgrades, aftermath, or death. Duplicate idempotency keys return the same committed result.

## 12. Presentation and controls

The scene uses one renderer and a bounded reusable ruin kit: broken arches, chambers, carvings, anchors, dust, water or roots where selected by the definition, and readable spatial emitters. Evidence never relies on color or sound alone; direction, pulse shape, iconography, text, and controller feedback provide equivalent cues.

Desktop supports WASD, `E` contextual action, `Q` guard, Space dodge, `R` ability, number-key switching, route-board shortcut, pause, and Escape. Mobile uses 44px minimum controls, a bounded movement pad, semantic action pad, scroll-safe route board, safe-area insets, and no horizontal overflow at 320px.

Pause stops runtime input and adaptive streams without stacking loops. Backgrounding, focus restoration, mute, per-group volumes, reduced motion, and audio unlock remain supported.

## 13. Failure behavior

- Invalid site, actor, proof, ownership, condition, definition, evidence, route, consent, input, sequence, tick, coordinate, receipt, or world revision fails closed.
- Incorrect listening positions yield incomplete or misleading evidence according to the sealed definition; they never reroll it.
- Invalid actions consume nothing unless an explicit attempted-action rule is part of the definition.
- An impossible generated definition is rejected before presentation.
- Network or Receiz failure leaves a labeled local preview with retry or practice exit.
- Audio load failure degrades to silence and diagnostics without changing gameplay.
- Rendering loss presents recoverable controls or exit without mutating progression.
- Extraction, contract failure, ordinary defeat, completion, and Mortal defeat remain semantically distinct.

## 14. Testing and release gates

- deterministic generation and material squad-difference tests;
- representative one-, two-, and three-card solvability tests;
- exact card capability, injury, dead-card, ownership, and proof-tamper tests;
- listening, spatial evidence, deduction, false-route, timing, stamina, cooldown, hazard, switching, extraction, and mortality tests;
- transcript replay and checkpoint mutation tests;
- consequence bounds, idempotency, receipt, server rollback, and Save V10 tests;
- audio provenance, local-URL, format, duration, loop, no-synthesis, pause, mute, decode, and trigger tests;
- desktop, 390px, and 320px browser captures with keyboard and touch-path verification;
- zero console errors and no missing/decode asset requests;
- at most 160 draw calls, 180,000 triangles, 110 geometries, and 8 textures in the detailed scene;
- full repository tests, typecheck, lint, production build, secret scan, and clean worktree before completion.

## 15. Completion standard

Echo Ruin is complete only when a player can discover it in the shared world, enter with one to three real cards, gather spatial evidence, infer and revise a route, physically restore it through skillful card play, extract or finish, hear the score react causally, understand every outcome, and adopt canonical consequences only through a replay-verified receipt.

This milestone does not claim that the remaining six ecology families are modernized. They follow as separate qualified location slices using the shared adventure, replay, authority, condition, rendering, and audio foundations.
