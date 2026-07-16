# Wayfarer Merchant Circuit Design

Date: 2026-07-16  
Status: Approved for implementation  
Program: Receiz Wilds location modernization

## 1. Outcome

Wayfarer Market becomes the second complete card-driven Wilds location after Hearttree Sanctum. It remains the canonical `wandering-market` ecology family: a traveling caravan whose coordinate, layout, contracts, demand, hazards, merchants, presentation, and rewards change deterministically with the region, Pulse, admitted world events, and the player's proof-pinned squad.

The finished location is a strategic merchant circuit rather than a three-button sequence. Players inspect opportunities, choose one to three living cards, assign roles, gather information in a playable 3D market, negotiate, and execute a physical contract. Exact card stats, abilities, anatomy, condition, timing, position, stamina, and player decisions determine the available solutions and outcome.

## 2. Scope

### Included

- one complete solo Merchant Circuit supporting one to three proof-pinned cards;
- deterministic contract, merchant, market-layout, demand, hazard, and reward generation;
- exact-card role and capability projection;
- playable inspection, negotiation, cargo, routing, protection, and settlement decisions;
- deterministic fixed-step runtime, transcript replay, consequence projection, sealed receipt, and server admission;
- action-specific card XP, mastery, fatigue, injury, upgrades, regional reputation, merchant access, cosmetics, and bounded gameplay resources;
- an optional, separately disclosed Mortal Caravan contract for two or three cards;
- extraction and failure paths that preserve already-earned admissible outcomes;
- a shared Wilds adventure-condition layer used by Hearttree, Wayfarer Market, and later locations;
- Save V10 migration with compatibility for every supported earlier save;
- a responsive Three.js market scene, accessible controls, diagnostics, and adaptive local production audio;
- replacement of the wandering-market branch in the current generic ecology activity shell while preserving the other seven families.

### Excluded

- real-money pricing, investment language, synthetic liquidity, gambling, or fabricated market history;
- automatic ownership transfer, card wagering, or loss of custody through ordinary gameplay;
- multiplayer negotiation or player-to-player settlement in this milestone;
- permanent construction or conversion of Wayfarer Market into a fixed landmark;
- synthetic, browser-generated, or cloud-generated dialogue;
- changes to the two Exchange demo markets or Receiz financial settlement rails.

## 3. Chosen approach

The approved approach is the **Merchant Circuit**, a hybrid of market intelligence, negotiation, and physical contract execution.

Two alternatives were rejected:

- a negotiation-only simulator would concentrate play in menus and underuse the 3D world and card anatomy;
- a delivery-only gauntlet would provide action but insufficient market strategy and would overlap too closely with ordinary escort missions.

The hybrid creates a distinct identity: information changes negotiation, negotiation changes execution constraints, execution changes rewards and world demand, and every phase is affected by the selected cards.

## 4. Playable loop

The one-sentence loop is: **read a changing market, pin the right living cards, negotiate an achievable contract, execute it through skillful movement and card actions, then accept the persistent consequences.**

### 4.1 Arrival and contract board

The circuit presents three deterministic contract candidates. Every candidate discloses:

- contract family and merchant;
- one-to-three-card entry requirement;
- recommended capabilities without naming a guaranteed winning squad;
- regional demand and supply facts;
- execution objectives and known hazards;
- reward bands and failure costs;
- whether the contract is Standard or Mortal;
- canonical-live or local-practice provenance.

Candidates include verified delivery, appraisal, caravan protection, perishable preservation, mechanism repair, bulk movement, and route recovery. The release generator may compose these from shared verbs but must give each candidate a coherent merchant, cargo, route, and purpose.

### 4.2 Squad pinning and roles

Players choose living cards that they own and whose proofs verify. Contract-specific minimum and maximum squad sizes are enforced before entry. Duplicate proof pins, dead cards, foreign conditions, changed proofs, and invalid definitions fail closed.

Cards may be assigned as:

- **Broker:** reads merchant pressure and improves counteroffer options;
- **Scout:** uncovers route, demand, cargo, and merchant information;
- **Carrier:** transports goods and operates physical market mechanisms;
- **Appraiser:** verifies quality, provenance clues, and bundle compatibility;
- **Guardian:** prevents cargo loss and absorbs route hazards.

Roles are not fixed classes. The director derives role fitness and available actions from real capabilities, and the player may switch the active card during execution when cooldown, position, and contract rules allow it.

### 4.3 Intelligence phase

Players move through the market and choose which information to gather under a bounded time and stamina budget. They can inspect cargo, observe merchant tells, scout route gates, compare demand markers, and test mechanisms. Information is never decorative: each admitted observation reveals an exact rule, narrows an uncertainty band, unlocks an action, or identifies a risk.

Skipping intelligence saves time but makes negotiation and routing less predictable. Gathering everything is usually impossible, so the player must prioritize information that suits the squad.

### 4.4 Negotiation phase

Negotiation uses a limited number of exchanges. At each exchange the merchant exposes a deterministic tell derived from personality, pressure, demand, contract state, and prior player actions. The player may commit, counter, bundle, invoke a card ability, request a route concession, or walk away.

Negotiation does not invent monetary value. It adjusts gameplay terms such as cargo quantity, time window, route risk, reward band, allowed damage, support item, merchant trust, and upgrade opportunity. Outcomes are derived from observed information, actual card effects, timing, and the chosen sequence rather than a hidden random roll.

### 4.5 Contract execution

The accepted terms instantiate a fixed-step playable route through the market or nearby caravan trail. The player must navigate, protect cargo, preserve condition, manipulate mechanisms, and use card abilities at correct positions and times. Hazards telegraph before resolving. Guard, dodge, switch, role actions, and extraction have explicit stamina, cooldown, and positioning rules.

Success requires completing the contract objectives under the negotiated terms. Partial completion, safe extraction, ordinary defeat, and Mortal defeat are distinct terminal states.

### 4.6 Result and aftermath

The result screen explains cause and effect:

- which observations changed the negotiation;
- which exact card stats, abilities, and anatomy affected actions;
- which player decisions succeeded or failed;
- cargo and contract condition;
- XP, mastery, injuries, fatigue, reputation, resources, and upgrade offers;
- regional demand or merchant-access changes;
- receipt and publication status.

Canonical consequences apply only after deterministic replay and successful Receiz admission. Practice results remain visibly noncanonical and cannot mutate durable progression.

## 5. Exact card effects

The market consumes the same sealed card truth used by Hearttree and adds market-specific interpretation.

- **Speed** affects scouting reach, delivery windows, evasion margins, card switching, and recovery.
- **Power** affects cargo mass, blocked routes, machinery, bracing, and physical contract actions.
- **Armor and health** affect cargo protection, guardian interception, hazard survival, and injury thresholds.
- **Grove** abilities affect living cargo, recovery, merchant trust, preservation, and organic mechanisms.
- **Spark** abilities affect machines, timing, rapid exchanges, powered gates, and energy cargo.
- **Tide** abilities affect preservation, flow analysis, cooling, alternate waterways, and fragile cargo.
- **Stone** abilities affect security, bulk cargo, structural repair, route clearing, and hazard resistance.
- **Flight, locomotion, body size, appendages, and other anatomy** change navigation, carrying, inspection, and route options.
- **Injuries, fatigue, mastered abilities, cooldowns, and prior upgrades** remove or modify options instead of being cosmetic labels.

High raw stats create margins and additional options but never bypass information, timing, position, stamina, cooldowns, or objective rules.

## 6. Dynamic generation

The director derives a market definition from:

- ecology site identity, seed digest, coordinate, region, and phase;
- canonical Pulse and relevant parent ecology events;
- regional supply, demand, weather, and route influence;
- merchant archetype and relationship state;
- squad proof pins and projected capabilities;
- prior market mastery and completed contract families;
- explicit Standard or Mortal mode.

The definition contains the complete contract board, layout kit, merchant rules, cargo, objective graph, negotiation grammar, hazards, counters, audio direction, reward limits, and solvability witness.

Identical canonical inputs reproduce the same definition. Materially different cards must change at least one meaningful route, counter, term, risk, or reward opportunity. Already-mastered solutions receive diminishing opportunity weight so the Market encourages broader card use without erasing history.

### Solvability

Every admitted Standard contract must have at least one viable solution for its pinned squad. The generator proves this by searching the bounded objective graph using the projected capabilities and condition state. If no solution exists, that candidate is not offered. Mortal candidates may be harder but must still have a viable perfect-play route.

## 7. Consequences and mortality

### Standard contracts

Standard play can cause bounded fatigue, injury, lost cargo, reduced reward, contract failure, and merchant-reputation loss. It cannot kill a card or transfer ownership.

### Mortal Caravan

The Mortal Caravan is an optional high-risk protection or recovery contract with these rules:

- requires two or three living cards;
- displays exact irreversible-risk copy before squad pinning and again before entry;
- requires consent bound to the definition digest, squad proof pins, actor, and timestamp;
- exposes a viable but demanding route;
- distinguishes extraction, contract failure, squad defeat, and completed outcome;
- can permanently kill cards only when replay proves the disclosed lethal condition;
- applies death only after server admission of a self-verifying receipt;
- never revives a dead card and never lets an older alive projection overwrite receipt-proven death.

Death is death. Dead cards remain memorial inventory but cannot enter squads, train, battle, grow, evolve, fuse, list, trade, or participate in future activities.

## 8. Rewards and progression

Rewards are bounded and grounded in recorded contributions:

- card XP only for unique resolved contributions;
- mastery for specific market verbs and contract families;
- at most three upgrade offers derived from actual successful actions;
- merchant reputation and regional reputation;
- cosmetic acknowledgements, merchant marks, access to later contracts, and bounded gameplay resources;
- no fabricated exchange price, financial return, card ownership, or elapsed-time mastery.

Failed or extracted runs can retain only rewards supported by completed, replayed contributions. Duplicate receipts and idempotency keys cannot award twice.

## 9. Shared adventure-condition architecture

Hearttree's current persistent condition model becomes the compatibility source for a shared Wilds adventure-condition boundary.

The shared layer owns:

- alive/dead state;
- health ceiling and persistent injury effects;
- fatigue;
- XP and market/expedition mastery;
- earned upgrades;
- append-only consequence receipt references.

Hearttree and Wayfarer Market use location-specific adapters for action interpretation and consequence projection while sharing validation, death guards, persistence, and reconciliation. Existing Hearttree receipts and conditions retain their meaning.

Save V10 adds the generalized condition and Market receipt projections. Restore accepts every currently supported legacy schema, migrates V9 Hearttree conditions without loss, initializes Market state safely, deduplicates receipts, and refuses any migration that would revive a dead card or weaken proof continuity.

## 10. Components and boundaries

Implementation is divided into focused modules:

- `market/card-role.ts`: exact market role and action projection;
- `market/contract-director.ts`: deterministic board, merchant, terms, route, and solvability generation;
- `market/negotiation-resolver.ts`: pure tell and offer resolution;
- `market/action-resolver.ts`: pure execution action resolution;
- `market/runtime.ts`: fixed-step state, movement, stamina, cooldowns, hazards, cargo, and terminal states;
- `market/transcript.ts`: input recording, checkpoints, replay, and tamper rejection;
- `market/consequences.ts`: XP, injury, reputation, upgrade, extraction, and death projection;
- `market/receipt.ts`: self-verifying result receipt;
- server admission module: actor, ownership, proof-pin, replay, consent, idempotency, publication, and audit enforcement;
- `WayfarerMarketExperience.tsx`: squad gate, contract board, 3D runtime, result, and return flow;
- `WayfarerMarketScene.tsx`: market geometry, merchant/cargo presentation, objective readability, VFX, and diagnostics;
- shared adventure-condition module and Save V10 migration adapter.

Pure domain modules do not import React, Three.js, browser storage, audio, or network code. Rendering consumes the authoritative runtime projection and emits semantic inputs. Audio consumes semantic events and cannot mutate gameplay.

## 11. Presentation and controls

The Market retains the warm-lantern, folding-canopy identity but replaces the current abstract activity screen with a spatial caravan:

- readable entrance, contract board, merchant stalls, cargo zones, mechanisms, exits, and route gates;
- deterministic layout variation from reusable geometry and materials;
- clear merchant tells and demand indicators that do not rely on color alone;
- card-role silhouettes and active-card feedback;
- restrained phase-specific particles, lighting, and camera emphasis;
- one WebGL renderer and the existing world quality profile.

Desktop supports keyboard movement and action shortcuts. Mobile provides a bounded movement control, large semantic action buttons, safe-area-aware HUD, and no horizontal overflow at 320px. Pause, reduced motion, muted audio, backgrounding, focus restoration, and Escape behavior remain supported.

## 12. Audio

Wayfarer Market receives a local, rights-audited production bank:

- caravan exterior and interior crowd beds from real recorded material;
- fabric, wood, cargo, mechanism, footsteps, handling, impact, and UI effects;
- intelligence, negotiation, execution, danger, victory, extraction, and memorial music layers;
- merchant and contract motifs;
- squad elemental motifs and semantic action cues;
- adaptive transitions based on market phase, negotiated risk, cargo condition, and terminal outcome.

The runtime uses no cloud sound provider, synthetic speech, oscillator fallback, or third-party runtime audio dependency. Human dialogue is not shipped until performed recordings and releases are available. Until then, merchant communication uses authored text, animation, and nonverbal environmental feedback rather than robotic voice.

## 13. Authority and data flow

1. The client receives the canonical or practice ecology projection.
2. The player selects a contract and squad.
3. The deterministic director builds the definition from canonical inputs and proof pins.
4. The runtime accepts validated, sequenced semantic inputs and records a transcript.
5. Pure resolvers produce effects and explanations.
6. The terminal transcript is replayed locally for preview.
7. Canonical submission sends cards, prior conditions, definition, transcript, and Mortal consent when applicable.
8. The server resolves actor identity, verifies ownership and proofs, regenerates or validates the definition, replays the transcript, projects consequences, seals the receipt, publishes the updated projection, and appends the audit event.
9. The client adopts progression only from the admitted receipt and reconciled projection.

Publication and audit failures cannot partially adopt rewards, injuries, reputation, upgrades, or death. Duplicate idempotency keys return the same committed result.

## 14. Failure behavior

- Invalid site, seed, contract, merchant, role, proof, ownership, condition, consent, sequence, tick, coordinate, or definition fails closed.
- A stale world revision rebases or rejects before consequence adoption.
- An unsolvable generated candidate is omitted rather than weakened after presentation.
- A wrong negotiation choice changes terms or ends the negotiation; it does not silently reroll.
- An invalid runtime action records no effect and cannot consume resources unless the authoritative rule explicitly defines an attempted-action cost.
- A network or Receiz failure leaves the local run as an uncommitted preview with retry or practice-only exit.
- Extraction is always distinct from victory, ordinary defeat, and Mortal squad defeat.
- Audio, rendering, or accessibility settings cannot change deterministic gameplay state.

## 15. Performance budgets

The detailed Market scene retains the published Wilds limits:

- at most 160 draw calls;
- at most 180,000 rendered triangles;
- at most 110 live geometries and 6 textures;
- one renderer and one active detailed ecology experience;
- bounded merchant, cargo, particle, audio-node, listener, timer, and event counts;
- no console, WebGL, hydration, or page errors;
- no horizontal overflow at 320px;
- responsive desktop and mobile controls without page scrolling during active play.

## 16. Testing and release gates

### Domain tests

- identical inputs reproduce definitions, negotiations, actions, transcripts, consequences, and receipts;
- materially different card stats, abilities, anatomy, and conditions change meaningful options;
- representative one-, two-, and three-card squads receive solvable Standard boards;
- wrong timing, position, stamina, cooldown, role, and card choice produce real consequences;
- demand, merchant tells, gathered intelligence, negotiated terms, and execution remain causally connected;
- XP, mastery, injuries, reputation, resources, and upgrades are bounded and contribution-backed;
- Mortal consent and replay are required for permanent death;
- dead-card guards and V10 migration preserve irreversible history;
- tampering, duplicate submission, ownership mismatch, and publication failure are rejected atomically.

### UI and browser tests

- players can complete one Standard contract through actual desktop and mobile input;
- players can fail and extract without receiving victory rewards;
- the contract board, negotiation, execution HUD, result, and return flow are keyboard and screen-reader reachable;
- active desktop and 390x844 mobile screenshots show readable objectives and card effects;
- renderer diagnostics stay within budget and the canvas is nonblank;
- production audio files load locally and phase transitions route correctly;
- console and page error count is zero in production preview.

### Repository gates

- focused tests and full test suite;
- lint, typecheck, and production build;
- audio manifest, provenance, and catalog validation;
- Receiz v105 integration check, conformance, doctor, secret scan, and release check;
- clean git diff and committed implementation on `main`.

## 17. Acceptance criteria

Wayfarer Market is complete for this milestone when:

1. The generic three-button wandering-market activity is replaced by the Merchant Circuit.
2. Every offered contract is deterministic, proof-pinned, strategically different, and solvable for its admitted squad.
3. Player knowledge, negotiation, movement, timing, and card choice all change the outcome.
4. Exact card stats, abilities, anatomy, conditions, and role assignments have explainable effects.
5. Rewards and consequences persist only through verified replay and Receiz admission.
6. Standard play cannot kill or transfer cards; disclosed Mortal defeat can permanently kill cards.
7. Save V10 preserves every supported legacy save and all Hearttree history.
8. The Market is visually spatial, responsive, performant, and playable on desktop and mobile.
9. Its soundscape uses real local rights-audited assets with no synthetic voice or runtime dependency.
10. All repository and production-preview release gates pass.
