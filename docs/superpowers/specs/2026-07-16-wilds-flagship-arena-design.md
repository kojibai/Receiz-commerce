# Wilds Flagship Arena Design

Date: 2026-07-16  
Status: Approved for implementation planning  
Program: Receiz Wilds living-card combat

## 1. Outcome

Wilds gains a flagship free-movement 3D Arena in which a selected proof-pinned card becomes its actual playable creature. The mode combines the immediate readability, expressive movement, recoveries, environmental play, and dramatic launches associated with beloved platform fighters with the impact, combos, counters, finishers, and emotional presentation of cinematic fighting games, without copying either ruleset.

Players directly move, jump, strike, guard, parry, dodge, focus, invoke both verified card abilities, use arena mechanisms, collect tactical pickups, swap teammates, heal, rescue, and withdraw. Exact card identity changes the physical fighter, available tactics, matchups, recovery, progression, and story. NPCs, champions, bosses, offline play, and later live PvP use the same deterministic kernel.

The Arena is a persistent journey rather than an arcade reset. XP, mastery, condition, scars, relationships, wins, losses, retreats, sacrifices, achievements, evolution, checkpoints, stories, and retirement append to living card and Vault history. Mortal loss is real, opt-in through Arena entry, naturally communicated, and irreversible.

## 2. Delivery decomposition

The combat program is too large for one undifferentiated release. It ships through qualified slices over a shared architecture:

1. **Flagship vertical slice:** one complete mobile-first arena, teams of up to three, advanced NPC tiers, one multi-phase boss, mortal and practice rules, persistent progression, offline portability, recovery, replay, and memorialization.
2. **Character production expansion:** broader skeleton families, forms, animation coverage, arenas, signature abilities, evolution variants, and boss hero assets.
3. **Live competitive play:** matchmaking, friendly challenges, authoritative rollback, reconnect, rankings, seasons, and tournaments.
4. **Expanded formats:** 2v2, bounded four-fighter modes, cooperative bosses, additional Arena Paths, and global events.

The first slice defines protocols and arena boundaries that can support later modes without loading their assets or complexity into the initial mobile experience.

## 3. Shared deterministic architecture

One fixed-timestep combat kernel resolves movement, collision, hit timing, damage, Break, stamina, focus, abilities, status, pickups, tags, withdrawal, hazards, terminal state, and match events. It has no dependency on React, Three.js, animation, audio, storage, wall-clock time, or network delivery.

The architecture is hybrid:

- local prediction gives immediate controls and presentation;
- players exchange compact sequenced input frames rather than video or arbitrary state;
- periodic deterministic checkpoints permit rollback and reconnect;
- the global service replays and validates matches before admitting competitive progression;
- NPCs and bosses submit legal inputs to the same kernel;
- offline solo play seals complete input traces for later global replay.

Animation and effects visualize authoritative events but never decide them. Every historic ruleset remains addressable by version so old match receipts remain reproducible after upgrades.

## 4. Card-to-character runtime

The selected card is not represented by a generic token or portrait. A deterministic authored modular runtime constructs its fighter from its verified identity and living revision.

### 4.1 Authored modular production

- A bounded set of high-quality skeleton families supports quadruped, biped, serpentine, winged, aquatic, heavy, small, and hybrid forms.
- Authored body modules, proportions, collision volumes, materials, and animation layers assemble each verified anatomy.
- Genome, form, stage, element, palette, markings, horns, wings, tails, armor, scars, equipment, and asymmetry make the card recognizable.
- Growth, injuries, relationships, achievements, and evolution create persistent physical changes.
- Exact named abilities select bounded combat interpretations, authored motion grammar, timing, hit shapes, elemental behavior, and effects.
- Important evolutions, signature abilities, bosses, retirement rituals, and historically important cards receive custom hero treatment layered over reusable foundations.

Fully hand-authoring every possible card would not scale, while uncontrolled runtime generation would weaken reproducibility, animation quality, performance, and proof verification. Authored modular characters preserve both identity and production quality.

### 4.2 Physical consequences of identity

- Health and persistent condition establish available Vitality.
- Power affects impact, heavy mechanisms, armor pressure, launches, and destruction.
- Guard and armor affect blocking, Break resistance, protection, and injury severity.
- Speed affects movement, attack recovery, dodge and parry margins, air control, and tag timing.
- Bond affects teammate rescues, support actions, tag recovery, and relationship abilities.
- Body size affects target profile, weight, reach, collision, and traversal.
- Wings, limbs, climbing, swimming, digging, senses, and locomotion alter real options.
- Element, abilities, injuries, scars, temperament, mastery, equipment, and learned history affect exact matchup rules.

Rarity alone never substitutes for these traits. A changed proof, invalid ability name, dead revision, or foreign condition fails closed.

## 5. Match structure

Each side selects up to three owned living cards and locks its loadout at entry. One creature per side is active. The remaining cards are available for vulnerable, cancelable tags and bounded support actions.

### 5.1 Core controls

- **Move:** full ground movement, sprinting, directional intent, ledges, slopes, and positioning.
- **Jump:** aerial movement, elevation, recovery, and directional attacks.
- **Light strike:** fast directional chains, pressure, interruption, and combo routing.
- **Heavy strike:** launches, armor pressure, terrain destruction, and higher commitment.
- **Guard:** block, parry, dodge, Break recovery, and directional defense.
- **Focus:** read observable tells, improve targeting, and charge tactical or signature options.
- **Ability one and two:** the card's exact verified named abilities as real animated powers.
- **Context action:** pickups, mechanisms, finishers, rescues, recovery, and arena-specific verbs.
- **Swap:** call a teammate through a vulnerable but cancelable tag window.
- **Flee/concede:** surrender competitive standing while saving every creature still above zero.

Controls remain consistent across body families. Timing, reach, movement, weight, air control, abilities, counters, and support behavior make each fighter different without requiring a separate input language.

### 5.2 Vitality and Break

Vitality represents immediate life and its relationship to persistent condition. Break represents balance, guard stability, vulnerability to launches, combo extensions, and finishers.

A fighter with depleted Break becomes temporarily vulnerable but does not die from Break alone. A powerful hit may launch it across the arena, destroy terrain, or create a comeback opening. Falling from an edge causes deterministic damage and provides a readable recovery opportunity; it never silently bypasses Vitality through an arbitrary ring-out.

Comebacks arise through parries, positioning, aerial recovery, environmental counters, teammate rescues, carefully timed healing, signature abilities, pickups, and opponent prediction. They are not hidden random odds or paid advantages.

### 5.3 Arenas

Arenas are tactical rule systems rather than backgrounds. Elevation, cover, destructible structures, hazards, elemental surfaces, recovery routes, pickups, and mechanisms affect legal play. Every critical tell uses multiple signals: shape, animation, position, icon, text, and local sound where useful. Color and sound are never the only carriers of required information.

## 6. NPCs, bosses, and live players

The first release includes a complete Arena Path:

Arena entry remains a physical world interaction at the Arena of Echoes. The map and walkable location are the interface; no duplicate mode pill, destination panel, or detached activity menu may launch it. The same rule applies to Hearttree and every other landmark. Small contextual prompts and combat HUD feedback are allowed only when they support direct interaction with the location itself.

- approachable rivals teach one concept at a time;
- advanced rivals recognize repeated habits and punish predictable loadouts;
- champions coordinate teams, arena control, recovery denial, counters, and swaps;
- a multi-phase boss transforms the arena, exposes discoverable weaknesses, and uses an existing Wilds boss-family identity.

NPCs receive only the observable legal game state and deterministic memory available under their difficulty profile. They cannot read future inputs, ignore cooldowns, exceed reaction limits, or use hidden player state.

Difficulty rises through behavior, combined mechanics, timing, team composition, arena pressure, fewer safe openings, and strategic counters—not inflated health alone. Every required encounter has at least one discoverable winning strategy through skill, roster composition, items, environment use, opponent knowledge, or retreat-and-prepare play.

Live PvP later uses the same inputs, kernel, rollback, receipts, conditions, and progression boundaries. PvP, matchmaking, global rankings, tournaments, ownership changes, auctions, and stakes always require the global world.

## 7. Learning and strategic matchups

Early opponents visibly teach movement, guard, Break, recovery, abilities, swapping, withdrawal, and arena use. NPC behavior demonstrates techniques. Defeat reveals actionable information. Practice mode teaches advanced play without mortality or canonical rewards. Later opponents combine rules already demonstrated instead of secretly changing them.

Matchups use meaningful soft counters. Creatures may dominate or struggle against particular elements, weights, ranges, locomotion types, body plans, arena conditions, status effects, or boss phases. No card is universally best. A disadvantaged creature can still win through superior play, preparation, teammates, items, arena control, and learned opponent behavior.

## 8. Persistent progression and remembered journey

The Arena Path stores completed levels, unlocked checkpoints, boss phases, difficulty tier, tutorials learned, opponent knowledge, rewards, losses, retreats, deaths, and story branches. Players return to the latest valid checkpoint instead of restarting the campaign. A retired creature does not erase checkpoints it helped earn; future teams continue from that legacy.

Every admitted match derives progression only from replayed contributions:

- XP and mastery for movement, offense, defense, recovery, abilities, support, rescues, survival, and objectives;
- wins, losses, retreats, knockouts, sacrifices, rivals, boss phases, and records;
- injuries, scars, recovery, temperament, relationships, grief, and titles;
- ability, animation, counter, role, and evolution branches tied to repeated behavior and achievements;
- resources, recovery items, food, catalysts, arena tools, crafting materials, lore keys, and evolution components;
- checkpoints, discovered weaknesses, stories, world memory, and aftermath.

XP and valid history are never erased by injury. Loadouts are locked at entry. Arena pickups create tactical choices. Paid items cannot create a competitive advantage, prevent deserved mortality, or turn the mode into pay-to-win.

## 9. Living condition, recovery, and mortality

Persistent condition has six explicit states: `healthy`, `strained`, `wounded`, `critical`, `mortal`, and `retired`. Match health and persistent condition are related but distinct: immediate damage resolves the fight, while validated consequence rules determine what carries forward.

Arena entry is the mortal opt-in. It displays each roster member's exact condition and clearly states that verified zero Vitality causes permanent retirement. During combat, danger is communicated naturally through posture, gait, breathing, visible wounds, aura, sound, teammate behavior, and HUD state. Players are not interrupted by repeated legal prompts.

Before zero, players can heal, shield, rescue, swap, use collected resources, or withdraw. A switched creature retains its exact condition. If a creature reaches zero, it retires even if its team continues and wins. Server or global replay freezes and verifies the lethal frame before canonical publication. Offline mortality seals locally and is replayed globally on reconnection.

Hearttree Sanctum, Mosslight Atelier, Trail Gate, ecology activities, relationships, rest, care, and collected materials provide recovery gameplay. Healing may leave scars, changed movement, altered markings, fears, resistances, abilities, or evolution branches. Recovery never revives a retired creature.

## 10. Retirement, memorial, and legacy

A retired proof object is preserved, not deleted.

- The lethal match, condition, inputs, cause, owner decision, and witnesses become a sealed end-of-life append.
- The final action, damage absorbed, ally protected, opponent, and contribution to the match become life history.
- The death moment uses card-specific animation, teammate reactions, environmental response, and the creature's performed motif.
- If the team later wins, the result records and honors the fallen creature's contribution before rewards.
- The burial and spirit-departure ritual reflects element, scars, relationships, achievements, and accumulated identity.
- The Vault card becomes a beautiful memorial form: inspectable and shareable, but unavailable for combat, boosts, breeding, crafting inputs, staking, trading activity, or other active systems.
- Monument Walk preserves its epitaph, replay, lineage, descendants, victories, relationships, and complete story.
- Teammates may carry grief, remembrance, titles, animation changes, and evolution branches.
- Descendants may inherit a small symbolic legacy that is always mechanically weaker than keeping the creature alive.

There is no store prompt, replacement offer, pack advertisement, or purchase pressure during death, burial, mourning, or memorial viewing. Deliberate sacrifice must never become an optimal reward strategy.

## 11. Offline-first portable authority

Cards and Vaults remain complete portable local authorities for solo gameplay and recovery. The global world remains shared social authority.

### 11.1 Portable card revision

Each verified card carries a content-addressed living revision chain containing XP, condition, injuries, abilities, achievements, physical changes, relationships, match history, evolution, and retirement. Every revision names its parent digest, ruleset version, causal event, and resulting state digest.

### 11.2 Portable Vault

The proof-sealed Vault carries the complete collection, global checkpoint, inventory, story, Arena Path, world progress, last admitted global anchor, device identities, and pending append queue. Updated cards and Vaults remain exportable portable artifacts and are never trapped solely in browser storage.

### 11.3 Offline atomic transaction

Every offline solo match:

1. binds its deterministic seed, ruleset, card proofs, parent revisions, conditions, inventory, and loadout;
2. records the complete sequenced input trace and deterministic checkpoints;
3. recomputes the terminal result locally;
4. seals a device-signed, content-addressed pending match receipt;
5. appends resulting card revisions and Vault events;
6. commits receipt, cards, resource changes, and Vault atomically.

If any write fails, no portion becomes the new current revision. Players may continue battling NPCs and bosses, recovering, exploring, crafting, collecting, evolving, and progressing locally.

### 11.4 Reconnection and causal merge

On reconnection, Wilds submits pending receipts and causal revision chains. The global world replays each deterministic result from the last admitted anchor, admits valid events in causal order, and seals the resulting global snapshot into the local Vault.

Merge rules are deterministic:

- compatible XP, discoveries, history, relationships, and achievements combine and deduplicate by causal event ID;
- all valid injuries and resource spending remain applied;
- duplicated rewards never duplicate inventory;
- canonical retirement dominates every later action from an older living branch;
- events that depend on resources or cards already consumed by a competing branch fail closed or enter an inspectable conflict set;
- contradictory ownership, custody, marketplace, stake, or settlement branches fail closed;
- no event silently disappears; rejected and conflicting branches remain inspectable.

Offline receipts are local device claims until global replay. This distinction is visible without diminishing offline play. Offline activity cannot authorize live PvP, matchmaking, auctions, ownership transfer, money stakes, global ranking, or tournament advancement.

## 12. Mobile-first performance and controls

The Arena delivers advanced presentation through direction, animation, impact, sound, camera, and reactive systems rather than excessive geometry or downloads.

- Use the existing single WebGL renderer and shared world quality profiles.
- Run deterministic simulation in a native worker where supported; maintain an identical main-thread fallback.
- Apply local input on the next frame; network validation never blocks visual feedback.
- Warm the arena, fighter skeletons, required animation clips, and critical effects during card selection.
- Reuse skeleton families, animation libraries, materials, effects, and anatomy modules.
- Use modular geometry, vertex color, compact atlases, instancing, pooled effects, bounded particles, simplified shadows, and distance LOD.
- Add no heavy runtime engine or character dependency.
- Stream later arenas, bosses, cinematics, and high-detail assets only when selected.
- Adapt quality under memory, thermal, battery, reduced-motion, and low-power pressure without changing simulation.

First-slice budgets during normal one-versus-one play are:

- at most 140 draw calls;
- at most 180,000 visible triangles;
- at most 8 primary texture pages;
- one renderer;
- 60 FPS target on capable phones and a frame-paced 30 FPS fallback;
- less than 100 ms local input-to-visible-feedback latency;
- no full-screen load after a warmed arena is selected;
- 44px minimum touch targets, safe-area support, optional haptics, and no gameplay page scrolling at 320px.

The camera keeps both active fighters readable, permits tactical depth, and uses brief signature framing without taking control away. Mobile aim assistance improves intent selection without choosing actions. A bounded input buffer prevents fast taps from disappearing between animation frames.

## 13. Animation, effects, and audio

Animation coverage includes personality idle, locomotion, sprint, jump, aerial control, recovery, directional light chains, heavy attacks, guard, parry, dodge, Break, hurt, critical locomotion, both abilities, context actions, tag entry, rescue, victory, defeat, burial, spirit departure, and memorial states.

Deterministic hit volumes and frame data drive simulation. Mesh contact, animation completion, particles, camera shake, and audio never decide hits. Presentation may use bounded hit-stop, camera impulse, trails, debris, light changes, destructible reactions, and cinematic framing.

Combat audio uses only local, provenance-audited original or CC0/open-source real recordings. It includes movement, body materials, strikes, impacts, guard, parry, dodge, Break, abilities, elements, terrain, hazards, tags, rescues, pickups, healing, critical state, victory, defeat, retirement, burial, and adaptive music. It adds no oscillator fallback, synthetic/browser voice, external runtime URL, cloud audio provider, or third-party runtime sound dependency.

## 14. Authority and data flow

1. Entry pins actor, ruleset, mode, arena, roster proofs, living revisions, conditions, loadout, inventory, and risk disclosure.
2. The kernel creates the deterministic initial match.
3. Players or NPCs submit sequenced semantic input frames.
4. The kernel advances fixed steps and emits deterministic events and checkpoints.
5. Presentation renders events and supplies immediate local feedback.
6. A terminal trace derives match, card, Vault, inventory, progression, and mortality consequences.
7. Offline solo play atomically seals those consequences as pending local revisions.
8. Online play or reconnection sends the causal chain for independent replay.
9. Global authority verifies identity, ownership, proofs, parents, inputs, checkpoints, consequences, idempotency, and mode restrictions.
10. Accepted changes publish atomically, append audit and history, and return a newly sealed global snapshot.

Animation, client clocks, audio, local storage, and client-provided outcome summaries are never trusted as authority.

## 15. Failure behavior

- Invalid actor, ownership, proof, revision parent, condition, loadout, seed, ruleset, input, sequence, tick, coordinate, receipt, checkpoint, consequence, or publication fails closed.
- A disconnect restores the latest authoritative checkpoint when possible. Live matches follow disclosed timeout and forfeit rules and never invent player actions.
- Offline partial writes roll back the receipt, card revisions, inventory, and Vault together.
- A rendering, animation, worker, audio, or asset failure degrades presentation or switches quality profile without changing outcomes.
- Unsupported devices receive lighter geometry, lighting, particles, and shadows with identical gameplay timing and rules.
- Global synchronization deduplicates rewards, preserves valid spending and injury, enforces retirement dominance, and exposes conflicts.
- Practice cannot produce canonical XP, rewards, mortality, ranking, or history.
- Network or global service failure leaves valid offline events pending and exportable; it never falsely labels them globally admitted.

## 16. Testing and release gates

The flagship vertical slice requires:

- deterministic simulation and byte-stable replay across server, worker, main-thread, desktop, and mobile;
- exact stat, anatomy, locomotion, ability, condition, injury, scar, equipment, relationship, and matchup tests;
- movement, jumping, collisions, light/heavy chains, hit priority, Break, guard, parry, dodge, launch, fall, recovery, abilities, status, pickups, tags, rescues, items, withdrawal, zero Vitality, and terminal-state tests;
- NPC observability, reaction-limit, difficulty, strategy, and boss-phase tests;
- one-, two-, and three-card roster solvability and counterplay tests;
- offline atomic commit, export, import, deterministic receipt, causal replay, deduplication, resource-spend, multi-device merge, ownership conflict, and retirement-dominance tests;
- XP, mastery, achievements, stories, checkpoints, evolution, recovery, scars, relationships, memorials, and Vault/card revision tests;
- live authority, idempotency, reconnect, rollback, stale input, tamper, audit, publication, and fail-closed tests before PvP ships;
- keyboard, controller, 390px touch, and 320px touch completion paths;
- 60 FPS and 30 FPS profiles, sub-100ms local feedback, memory pressure, thermal downgrade, background/focus, reduced motion, mute, and audio-group tests;
- no console errors, missing assets, decode failures, leaked secrets, synthesis APIs, external runtime audio, or new heavy runtime dependency;
- full repository tests, typecheck, lint, production build, asset/provenance validation, browser captures, and clean release status.

## 17. Completion standard

The first flagship Arena slice is complete only when a player can select up to three real cards, watch the active card become its recognizable animated 3D creature, directly fight a strategic NPC and multi-phase boss with responsive mobile controls, use exact identity and team tactics, withdraw or face real retirement, persist the complete journey offline in portable cards and Vaults, later reconcile it into the global world, understand every consequence, and revisit the creature's continuing or memorialized life history.

This slice does not claim that live matchmaking, tournaments, every creature form, every boss, or expanded fighter counts are complete. Those remain separately qualified releases built on this shared kernel.
