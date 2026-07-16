# Wilds V3 Boss Ecology and Global Raids Slice Design

Date: 2026-07-15  
Status: Approved for implementation  
Program: Wilds V3 Living World, Slice 4

## 1. Outcome

Slice 4 turns the existing Crystal Burrow vertical slice into a recurring global boss ecology. Every boss is one permanent individual in one canonical timeline. Players across the shared world track the same creature, reach the same physical territory, enter bounded 10–15 minute raid rounds, fight or support with verified living cards, and permanently defeat that individual for everyone.

Bosses do not respawn after death. New individuals emerge later from deterministic world conditions and carry new identities, anatomy, behavior, weaknesses, territories, consequences, and history. The result should feel like a living world reacting to players rather than an encounter menu repeating instances.

All new visual and audio assets are authored locally. No third-party model, image, map, audio, generation, telemetry, or runtime asset API is permitted.

## 2. Scope and exclusions

### Included

- eight modular boss families, including the existing Crystal Burrower;
- globally unique boss identities, territories, tracking, movement, assaults, raid windows, transformations, defeat, monuments, and successor consequences;
- persistent boss health and phase across multiple bounded raid rounds;
- six squads of six active fighters per round and a bounded support field;
- deterministic role-aware card actions, boss telegraphs, hazards, support objectives, guard breaks, phase transformations, retreat, reconnect, and fair slot rotation;
- physical tracking and raid entry at the boss territory;
- canonical boss, round, participant, contribution, defeat, aftermath, and successor events under Pulse/Kai-Klok ordering;
- Save V8 raid receipts, boss knowledge, achievements, and portable vault recovery;
- local procedural boss presentation, local synthesized audio, a full-screen mobile raid experience, atlas tracking, and world aftermath;
- production browser, replay, authority, recovery, concurrency, responsiveness, and renderer qualification.

### Excluded

- mature team administration, invitations, league schedules, seasons, and team governance, which remain Slice 5;
- the complete card-role civilization, crafting, trading economy, and expanded Ascension/lineage utility, which remain Slice 6;
- full regional narrative seasons, voiced characters, and authored soundtrack scale, which remain Slice 7;
- final multi-device and whole-program V3 qualification, which remains Slice 8.

Slice 4 may project starter team identity and league score from existing canonical facts, but it cannot introduce alternate team truth or preempt Slice 5 governance.

## 3. Considered approaches

### A. Private encounter instances

Each squad receives its own copy of a boss. This is operationally simple but violates the shared-world fantasy, weakens permanent history, and makes defeat ambiguous. Rejected.

### B. Scheduled raid windows only

Bosses can be fought only at fixed global times. This creates spectacle but excludes players across time zones and turns the world into a calendar. Rejected as the primary model.

### C. Persistent global boss with bounded raid rounds

One boss remains alive globally across repeated 10–15 minute rounds. Each round admits a bounded active roster while support remains useful. Boss health and world phases persist between rounds, and death occurs once. Chosen because it preserves Receiz law, supports scale, keeps return visits meaningful, and allows players to participate without requiring one synchronized appointment.

Authored convergence windows may temporarily increase objectives or public spectacle, but ordinary raid rounds remain available whenever the boss is eligible and physically reachable.

## 4. Chosen architecture

Slice 4 extends the existing event-sourced world without changing the interpretation of Slice 1–3 events.

- `WildsBossDefinition` describes one admitted individual, not a reusable encounter copy.
- `WildsBossProjection` holds global boss truth: identity, territory, path, phase, health, transformation, weakness knowledge, assault target, and defeat.
- `WildsRaidRound` represents one bounded 10–15 minute participation window against that boss.
- `WildsRaidEncounter` deterministically reduces accepted action events into squad state, hazards, objectives, boss health, and round outcome.
- `WildsBossHistory` compacts defeated individuals and their admitted consequences without deleting source events.
- `WildsRaidReceipt` stores only personal accepted participation and outcomes; it cannot mutate canonical boss truth.

Pulse authorizes spawns, movement, phase changes, round opening/closure, defeat, aftermath, and successors. Kai-Klok orders all accepted mutations. The strongest available Receiz publication rail admits canonical events before clients present shared success.

Practice mode can replay the same deterministic machinery locally but remains visibly labeled and cannot issue canonical defeat, rewards, league points, monuments, or history.

## 5. Boss families

Every family combines compatible anatomy, behavior, territory, hazard, weakness, transformation, and aftermath modules. Deterministic compatibility tables prevent incoherent combinations.

| Family | Readable silhouette | Primary world pressure | Signature raid grammar | Typical aftermath |
| --- | --- | --- | --- | --- |
| Crystal Burrower | Armored tunneler with prism heart | Fractures routes and emerges below ruins | Break shell, expose heart, survive shard rain | Crystal memorial and opened subterranean route |
| Skycoil Tempest | Serpentine storm body and conductor fins | Migrates through highlands and charges storms | Ground arcs, anchor coils, redirect lightning | Calmed sky lane and charged waystone |
| Mirecrown Colossus | Rooted titan with marsh crown | Floods routes and entangles settlements | Free trapped lanes, cleanse mire, sever root shields | Restored wetland and living bridge |
| Embermane Siegebeast | Broad quadruped with furnace mane | Assaults settlement edges and scorches resources | Cool armor, defend stations, interrupt charges | Glassed trail and repaired firebreak |
| Tidal Prism Leviathan | Fin-backed amphibious giant | Moves along coasts and reroutes crossings | Balance tide nodes, expose prism fins, rescue boats | New tidal passage and reef monument |
| Echo-Antler Warden | Tall resonant guardian with branching crown | Seals ruins and amplifies memory hazards | Read echo patterns, counter calls, guard archives | Open archive and resonant grove |
| Lumen Moth Sovereign | Winged luminous swarm sovereign | Draws migrations and darkens resource blooms | Stabilize lanterns, disperse swarm, align wing windows | Luminous nesting field and festival seed |
| Voidroot Devourer | Low radial root mass with fractured core | Consumes biome energy and destabilizes portals | Purge roots, hold reality anchors, seal core phases | Rift scar, renewed bloom, or successor warning |

Each generated individual receives a stable name, proof digest, visual fingerprint, territory, movement route, compatible abilities, three combat phases, at least one support objective, and a permanent defeat record. Family identity remains recognizable even when modules change.

## 6. Boss ecology and world lifecycle

Boss phases are:

`rumored → tracked → emerged → contested → transforming → vulnerable → defeated → memorialized`

A living boss may also become `withdrawn` when an authored world condition causes it to leave undefeated. Withdrawn individuals remain historical and cannot silently respawn.

### Phase semantics

- **Rumored:** the individual exists canonically; the atlas shows family, region, confidence, and evidence without exact coordinates.
- **Tracked:** accepted scouting facts narrow the route and reveal recent traces, compatible card roles, and likely pressure.
- **Emerged:** the exact physical territory is known and eligible raid rounds may open.
- **Contested:** an active raid round is accepting deterministic actions.
- **Transforming:** action admission pauses for a short telegraphed world transition while the next module is derived.
- **Vulnerable:** a weakness window admits increased bounded impact from matching roles.
- **Defeated:** health reached zero through one winning canonical event; all later damage is rejected.
- **Memorialized:** the territory exposes permanent aftermath, participant history, and successor causes.
- **Withdrawn:** the boss left according to an authored condition; history records the unresolved pressure.

At most three undefeated bosses may exist globally in the bounded release world, at most one per region, and at most one settlement assault may be active globally. This creates meaningful choice without making the atlas noisy. A family may have another individual only after the prior individual is defeated or withdrawn and the global density budget permits it.

Boss movement uses deterministic waypoints across compatible regions. A movement Pulse cannot teleport through protected landmarks, enter a permanent interior, or overlap another boss territory. Movement changes the same canonical coordinate seen by the atlas and walkable world.

## 7. Raid rounds and capacity

Each raid round lasts between 10 and 15 minutes, chosen deterministically from the boss and round ordinal. Global boss health persists across rounds and never resets because a round ends.

### Admission

- Six squads hold exactly six active fighters each: 36 fighter slots.
- Eligible players choose a preferred squad, but lowest-fill stable allocation wins when that squad is full.
- Additional eligible players enter a support field capped at 144 concurrent participants.
- A player exists once per round and cannot occupy both fighter and support roles.
- Admission requires physical presence at the territory, legal boss/round phase, actor authority, a verified currently owned card, and an idempotency key.
- New fighters are not admitted during transformation locks or final settlement.
- A 90-second reconnect lease preserves the slot. Expired fighter slots rotate to the longest-waiting eligible support participant using canonical queue order.
- Voluntary retreat releases the slot after accepted retreat settlement and cannot erase prior contribution.

### Round lifecycle

`forming → active → transformation_lock → resolving → settled | expired`

- Forming lasts at least 20 seconds or until an authored readiness threshold.
- Active accepts actions and support objectives.
- Transformation lock lasts 2–6 seconds and communicates the next phase before actions resume.
- Resolving closes new input and reduces the final accepted event prefix.
- Settled records round participation, boss state, objectives, and any winning event.
- Expired records an incomplete round without resetting boss health or accepted contributions.

A later round references the previous round and current boss projection. The same boss cannot have two active rounds.

## 8. Deterministic encounter actions

Clients submit semantic intents, never raw damage or support scores.

Fighter intents:

- `strike`, `guard`, `focus`, `interrupt`, `ability`, `revive`, and `retreat`.

Support intents:

- `stabilize`, `scout`, `supply`, `rescue`, `ward`, and `rotate_request`.

The server derives impact from:

- verified card proof and current ownership;
- normalized card stats, element, stage, earned mastery, and role;
- boss phase, telegraph, weakness, guard, hazard, and transformation;
- squad combo state and support-objective state;
- deterministic event order and bounded cooldowns.

Client-provided timestamps, scores, damage, random rolls, or phase results are never authoritative. The deterministic encounter reducer returns accepted impact, cooldown, squad condition, objective change, and presentation cues.

Every action has a useful failure result: stale phase, cooldown, invalid role, lost ownership, remote position, defeated boss, expired lease, settled round, or duplicate command. Rejection creates no partial health, score, reward, or receipt change.

## 9. Card roles and fairness

Slice 4 introduces a bounded raid-role projection without replacing the deeper Slice 6 card civilization.

- **Vanguard:** guard, draw pressure, interrupt charges.
- **Striker:** exploit revealed weaknesses and build bounded combo.
- **Warden:** shield squad lanes and revive disabled fighters.
- **Resonator:** focus, reveal patterns, and extend vulnerability windows.
- **Wayfinder:** scout movement, hazards, and safe routes.
- **Steward:** supply, rescue, stabilize, and support public objectives.

Every verified card maps deterministically to a primary and secondary role from existing sealed traits. Starter cards have meaningful actions in every boss family. Purchased rarity, elapsed time, or ownership count cannot guarantee dominance. Stage and mastery improve options within bounded normalization, while correct timing, complementary roles, and team coordination determine effective contribution.

Per-player contribution caps, action cooldowns, diminishing repeated actions, squad-level objective gates, and normalized boss impact prevent a single high-stat card or scripted client from monopolizing defeat.

## 10. Weakness discovery and tracking

Boss knowledge progresses per player and per shared world fact.

1. Rumors reveal family and broad regional pressure.
2. Physical traces admit personal tracking receipts.
3. Multiple compatible traces reveal the exact territory.
4. Support scouting and correctly timed fighter focus actions reveal weakness modules.
5. Once a weakness is canonically exposed, every current round participant sees it.
6. Defeat and aftermath preserve what was learned in atlas history and player vaults.

The atlas never leaks exact coordinates from a rumor object. Rift may approach an uncertainty area or an exact tracked territory but never enters the raid arena. Players walk to the physical boundary and use Pulse to join.

## 11. Assaults and public objectives

Compatible bosses may pressure a settlement edge, ecology site, route, or public structure. Assaults are consequences in the same world, not separate missions.

- Settlement interiors remain safe and usable.
- The boss territory sits outside the protected entrance radius.
- Public support objectives include evacuation, barrier repair, route clearing, lantern stabilization, supply delivery, and creature rescue.
- Completing objectives changes hazards, opens fighter opportunities, protects world structures, and contributes bounded support credit.
- Failed objectives may damage a temporary route or ecology state but cannot erase permanent ownership, cards, vaults, or earlier admitted history.
- Only one active settlement assault exists globally in this slice.

## 12. Defeat, rewards, aftermath, and successors

Defeat is one irreversible compare-and-append outcome. The accepted winning action sets health to zero, closes the active round, rejects all later impact, records contributors, and transitions the territory to aftermath.

Slice 4 rewards admitted facts rather than fabricating valuable assets:

- proof-bound participation and role receipts;
- boss-family mastery and contribution bands;
- first-defeat, support, rescue, tracking, and squad achievements;
- non-transferable titles, monument recognition, and bounded existing gameplay resources;
- starter league points only from canonical accepted contribution facts.

Transferable artifacts, crafting outputs, and expanded card rewards remain Slice 6 unless a complete Receiz ownership and issuance rail already exists and is explicitly qualified.

Aftermath modules include monuments, reopened routes, biome changes, settlement repairs, migration shifts, portal scars, bloom renewal, and public history. A defeated individual never returns.

A later Pulse may derive at most one immediate successor pressure from a defeated or withdrawn boss. The successor references the parent boss and winning/withdrawal event, respects density and family compatibility, and is deduplicated by cause. A successor is a new permanent individual with a new identity—not a renamed respawn.

## 13. Personal history, Save V8, and vault recovery

Save V8 accepts V2–V7 and adds append-only boss and raid history.

Personal receipts record:

- rumor scouted, trace tracked, territory discovered, and weakness learned;
- round admission, role, squad or support field, and reconnect lease outcome;
- accepted action and bounded contribution band;
- objective completion, rescue, revive, retreat, and rotation;
- defeat witnessed, achievement earned, aftermath visited, and history revisited;
- source canonical event, projection revision, card proof digest, and receipt digest.

Receipts are bounded, proof-verified, source-deduplicated, and carried by the portable save PNG and V3 player vault. Restore merges valid personal history, then reconciles current card ownership and canonical boss truth. A vault cannot revive a boss, change health, claim a winning action, reopen a round, recreate league score, or restore an expired fighter lease.

## 14. Presentation and controls

Boss territories and raid combat render in the existing shared Three.js canvas. No second gameplay renderer is introduced.

### World presentation

- Each family has a locally authored silhouette kit with shared geometry, material reuse, instanced repeated detail, deterministic visual fingerprint, and three readable transformation states.
- Interest management renders at most one detailed boss; other living bosses use distant atlas/world signals.
- Telegraphs use shape, animation, spatial marker, color, text, and local audio where useful. Color is never the only signal.
- Hazards preserve a readable path and never hide absent geometry with fog or glow.

### Raid experience

The full-screen raid layer owns one viewport and includes:

- boss identity, global health, phase, telegraph, transformation, and vulnerability;
- six compact squad states and a support-field status;
- the player's verified card, role, cooldowns, condition, and accepted contribution;
- current public objective, hazard warning, and round timer;
- context-valid action icons with accessible names;
- reconnect, retreat, settings, and return behavior;
- canonical or practice provenance;
- safe-area padding, focus restore, Escape handling, reduced motion, and no page overflow at 320×568.

Required touch controls remain at least 44×44 CSS pixels. The raid layer never covers the app navigation because it is modal above the app and owns the viewport while open.

## 15. Local audio

The existing gesture-safe Web Audio runtime adds locally synthesized cues for:

- territory warning, tracking confirmation, raid forming, round start, telegraph, guard, impact, support progress, rescue, transformation, vulnerability, defeat, aftermath, and error;
- one distinct family motif per boss family;
- restrained ambience layers for the currently detailed territory.

Audio unlocks only after user gesture, respects all six production buses and mute settings, stops on hidden or disposed state, and does not stack round ambience. Boss audio uses locally shipped authored assets through native browser audio only, with no oscillator fallback, cloud sound provider, or runtime audio dependency.

## 16. Performance budgets

Slice 4 preserves the existing release ceiling:

- at or below 160 draw calls;
- at or below 180,000 rendered triangles;
- at most 110 live geometries and 6 textures;
- `withinBudget: true` in active raid diagnostics;
- at most one detailed boss and 36 detailed fighter representations;
- support participants represented by bounded aggregate or pooled low-detail signals;
- no second WebGL renderer;
- bounded lights, particles, audio nodes, action events, contribution records, reconnect leases, and polling;
- adaptive DPR 1.0 low, 1.25 medium, and 1.5 high;
- no WebGL, hydration, page, or repeated compatibility warnings.

If the raid cannot meet budget, distant fighters, support signals, particles, shadows, and secondary boss detail reduce by quality tier before any release ceiling changes.

## 17. Failure and recovery behavior

- Invalid family, module combination, territory, movement, Pulse, clock, cause, phase, or successor fails closed.
- Duplicate commands return the original accepted result or a no-op projection.
- Conflicts rebase against the latest canonical head and revalidate position, ownership, role, lease, phase, cooldown, capacity, and boss health.
- Only one winning defeat event can be admitted.
- Receiz publication failure prevents canonical success, reward, monument, and personal canonical receipt presentation.
- Network loss keeps the last verified projection, labels it stale, and starts the bounded reconnect lease.
- Lease expiry rotates the slot canonically and retains earlier accepted contribution history.
- A closed or defeated raid remains viewable as history but cannot accept input.
- Practice fallback remains playable and visibly noncanonical.
- Missing verified cards or roles explain the requirement without creating a purchase gate.

## 18. Verification

### Automated

- deterministic unique generation for all eight families across many seeds;
- anatomy, behavior, hazard, weakness, territory, and successor compatibility;
- global density, regional uniqueness, movement clearance, and assault bounds;
- exact lifecycle transitions and rejection of revival, skipped phase, duplicate death, or overlapping rounds;
- six squads of six, support cap 144, stable allocation, wait queue, reconnect lease, rotation, retreat, and deduplication;
- semantic action validation, card ownership/proof, role mapping, cooldown, normalization, telegraph, guard, hazard, objective, transformation, vulnerability, and impact derivation;
- persistent health across expired/settled rounds and one irreversible defeat;
- Pulse/Kai-Klok ordering, replay, checkpoint, conflict rebase, idempotency, publication failure, aftermath, and successor causality;
- rumor privacy, physical tracking, exact-coordinate discovery, near-Rift, and atlas/world agreement;
- Save V8 migration, receipt verification, PNG round-trip, vault merge, ownership reconciliation, and tamper rejection;
- local-only visual/audio contracts, focus/overflow/touch CSS, diagnostics, full regressions, typecheck, lint, and production build.

### Browser

- production WebKit at 320×568, 390×844, 430×932, and desktop;
- rumor → tracking → near-Rift → walking → physical entry → round admission;
- fighter actions, support actions, telegraph response, transformation lock, vulnerability, objective progress, reconnect/rotation, retreat, round settlement, later round, global defeat, aftermath, monument, and vault restore;
- all eight family presentations, with one complete deep raid and focused interaction checks for the other seven;
- clean console, nonblank canvas, no clipping or overlap, 44px controls, renderer diagnostics, local audio lifecycle, and unchanged return coordinate.

Multi-client tests must prove that independent clients observe the same boss health, phase, winning event, monument, and successor cause.

## 19. Slice completion rule

Slice 4 is complete only when all eight boss families generate coherently, one global boss can be tracked and fought across bounded rounds, fighters and support both matter, server-derived semantic actions persist global health, defeat occurs once, aftermath and successor consequences appear in the same world, Save V8 restores valid personal history, and all authority, recovery, mobile, audio, renderer, concurrency, and regression gates pass.

Completing Slice 4 does not complete the mature team/league system, card civilization, narrative program, or final V3 qualification.
