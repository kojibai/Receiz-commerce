# Receiz Wilds V3 Living World Program Design

Date: 2026-07-15  
Status: Approved design; written-spec review required before implementation planning  
Target: Build one canonical, persistent, socially alive Wilds where exploration, card mastery, and multiplayer civilization form one seamless game.

## 1. Product outcome

Wilds V3 is one shared world for every player. Permanent authored places create memory and orientation. Deterministically generated sites, bosses, migrations, markets, portals, festivals, ruins, disasters, and social events make that world change continually without splitting players into alternate realities.

The complete player loop is:

> Explore the same living world as everyone else, discover a changing place or threat, meet players and form a squad, use verified living cards to solve, fight, support, compete, or cooperate, permanently change the world, and carry the resulting history inside the player vault.

V3 unifies three equally important fantasies:

- **Living explorer world:** discovery, beloved places, secrets, companions, routes, regions, and visible players.
- **Card mastery adventure:** tactical cards, bosses, progression, Ascension, lineage, achievements, and increasingly expressive roles.
- **Social universe:** friendships, teams, leagues, shared events, competitions, trading, public history, and world-scale victories.

No pillar is presented as a separate disconnected mode. Exploration reveals card challenges; card mastery changes shared events; shared events reshape exploration.

## 2. Release standard

V3 targets an overall evidence-backed product score of at least **9.2/10** with no critical category below **8.5**. Movement, camera, mobile usability, stability, and world orientation must each score at least **9.3**.

The release scorecard covers:

- movement, camera, and controls;
- mobile usability and accessibility;
- visual identity and atmosphere;
- world coherence and navigation;
- landmark density and diversity;
- exploration and discovery;
- combat and activity depth;
- card utility and strategy;
- progression and achievements;
- multiplayer and social life;
- teams, leagues, and competition;
- narrative and emotional continuity;
- replayability and surprise;
- rewards and collection value;
- audio and tactile feedback;
- performance and stability;
- ethical long-term retention;
- overall show-someone impact.

Passing automated checks is necessary but not sufficient. The final score must be supported by browser evidence, real playthroughs, device profiling, and an explicit qualitative scorecard.

## 3. Non-negotiable laws

### 3.1 Continuity

- Existing V2 cards, vaults, saves, landmarks, player progress, and proof history migrate forward.
- V3 never silently replaces or invalidates valid earlier artifacts.
- Every event, generator, reducer, projection, checkpoint, and vault schema is versioned.
- Older history retains its original interpretation after newer versions ship.
- New systems extend the existing coordinate system and proof model instead of creating a parallel game.

### 3.2 Receiz law

- One immutable admitted event history produces one canonical world.
- Pulse authorizes canonical mutations.
- Kai-Klok assigns deterministic causal order.
- Receiz identity or an explicitly bounded guest capability authorizes actors.
- Receiz proof primitives validate cards, vaults, achievements, and historical outcomes.
- Receiz ownership remains authority for current card use, transfer, sale, and lineage actions.
- Receiz app-state, event, audit, and recovery primitives preserve durable world projections and important outcomes.
- Clients and regional caches are never authority for bosses, rewards, ownership, league scores, or world consequences.
- When an atomic capability is unavailable, the affected feature remains visibly locked rather than simulating authority.

### 3.3 One world

- A boss, site, player, event, and consequence exists once in the canonical timeline.
- Regional computation and interest management may bound work but cannot create alternate realities.
- Every atlas coordinate corresponds to the same coordinate in the walkable world.
- Players may Rift near a location but must physically discover and enter it.
- Major world victories and failures remain part of shared history.

### 3.4 Ethical progression

- Progress comes from verified play, discovery, mastery, contribution, and cooperation.
- Time elapsed, passive attendance, or purchases cannot fabricate competitive mastery.
- Purchased rarity never guarantees competitive dominance.
- New players retain meaningful public exploration and useful event roles.
- Boss and league systems do not ship cash wagering or uncontrolled valuable-asset staking.

## 4. Delivery strategy

V3 is a sequence of fully integrated production slices. Every slice must remain playable, migratable, recoverable, and release-qualified before the next slice expands it.

The first slice is the **Living World Kernel vertical slice**. It implements the complete architecture once with one generated site, one modular boss family, one globally unique boss, a 36-fighter raid, support participation, starter teams and league scoring, permanent aftermath, and a V3 portable player vault.

Later slices deepen content and systems without replacing the first slice's authority or data model.

## 5. Canonical world architecture

### 5.1 Command pipeline

Every canonical mutation follows:

1. A client submits a bounded intent to a same-origin Wilds route.
2. The server resolves Receiz identity or a limited guest capability.
3. Location, timing, phase, card proofs, ownership, team role, and event eligibility are verified.
4. Pulse authorizes the mutation.
5. Kai-Klok assigns its causal position.
6. The strongest available Receiz append primitive admits the event idempotently.
7. Pure deterministic reducers derive updated projections.
8. The server returns the accepted event identity and projection revision.
9. Important outcomes receive durable proof or audit projections.

Presentation may respond optimistically, but canonical rewards and shared-world truth appear only after admission succeeds.

### 5.2 Event envelope

Every canonical event records:

- world ID and event ID;
- schema and generator versions;
- event kind;
- actor or authorized system identity;
- exact coordinate and affected region;
- Pulse authorization;
- Kai-Klok coordinate;
- causal parent event;
- idempotency key;
- expected projection revision;
- verified card, asset, team, or league references;
- bounded deterministic payload;
- resulting projection digest.

Event families include:

- world and region lifecycle;
- site proposal, spawn, discovery, activation, resolution, expiry, and aftermath;
- boss rumor, tracking, emergence, migration, assault, raid, defeat, and memorialization;
- player presence and discovery;
- team and league membership;
- raid admission and rotation;
- combat and support contribution;
- reward commitment and claim;
- permanent world transformation;
- player-vault checkpoint and reconciliation.

### 5.3 Projections

The append history derives bounded specialized projections:

- **Global:** living bosses, major events, world chapter, and permanent consequences.
- **Regional:** nearby players, dynamic sites, threats, ecology, routes, and objectives.
- **Atlas:** destinations, discoveries, active events, population, and exact active-player positions.
- **Raid:** boss phase, active roster, support field, contributions, hazards, and objectives.
- **Team and league:** membership, roles, scores, schedules, records, and achievements.
- **Player:** discoveries, rewards, mastery, reputation, eligibility, and history.
- **Historical:** defeated bosses, monuments, admitted cards, participants, and world changes.

Projections and caches are disposable. Their checkpoint digests prove the admitted event prefix from which they were produced.

### 5.4 Scheduler

An authorized deterministic scheduler creates proposed world events from:

- latest canonical checkpoint;
- region ecology and biome compatibility;
- unresolved threats and prior consequences;
- authored density and pacing constraints;
- current event capacity;
- generator version;
- canonical seed inputs.

A proposal becomes real only after server validation, Pulse authorization, Kai-Klok ordering, and idempotent admission. Browser clocks and always-running clients never create shared-world truth.

### 5.5 Concurrency

- Commands include an idempotency key and expected projection revision.
- Conflicts rebase against the latest canonical event head.
- Actor authority, ownership, location, phase, and capacity are revalidated after rebasing.
- Only one legal phase transition can win.
- Duplicate commands return the original accepted result.
- Reward events reference their source event and cannot issue twice.
- Failed appends create no partial reward, projection, or ownership mutation.

## 6. Permanent and generated world

### 6.1 Permanent authored anchors

Permanent places create world memory:

- Hearttree Sanctum;
- Arena of Echoes;
- Prism Arcade;
- regional settlements and capitals;
- roads, rivers, coastlines, mountains, and biome boundaries;
- league halls and social infrastructure;
- historical monuments and boss aftermath sites.

Permanent anchors keep stable coordinates, entrances, recognizable silhouettes, and core purposes while evolving visibly through history.

### 6.2 Dynamic sites

The generated event layer supports:

- boss nests and territorial strongholds;
- wandering markets and rare merchants;
- ruins and excavation sites;
- temporary portals and unstable dimensions;
- festivals, tournaments, and league gatherings;
- creature migrations and breeding grounds;
- resource blooms and environmental anomalies;
- settlement attacks and rescue zones;
- cooperative puzzles and card temples;
- weather disasters and regional transformations.

Every dynamic site has a stable event ID, exact coordinate, authored family, deterministic seed, lifecycle, access policy, activity rules, reward policy, and aftermath.

The lifecycle is:

**Foreshadowed → discovered → active → resolving → aftermath → historical**

A site never vanishes without explanation. Resolved sites leave physical, ecological, social, or historical traces appropriate to their type.

### 6.3 Authored generation grammar

Generation combines bounded authored modules for:

- site purpose and family;
- terrain and region compatibility;
- architecture and silhouette;
- entrance and traversal grammar;
- activity family;
- card roles and access conditions;
- social capacity;
- difficulty and contribution structure;
- audio, weather, and visual identity;
- rewards and permanent consequences;
- narrative cause and future hooks.

The same canonical seed and generator version always regenerate the same site.

## 7. Modular boss ecology

Bosses are globally unique, mortal world entities. A defeated boss never respawns as the same identity.

Boss generation combines authored modules for:

- species and anatomy;
- scale and locomotion;
- intelligence and temperament;
- habitat and territory;
- abilities and card interactions;
- followers and environmental hazards;
- raid phases and transformations;
- narrative motivation;
- weakness-discovery mechanics;
- reward families;
- permanent aftermath.

The lifecycle is:

**Rumored → tracked → emerged → roaming or territorial → assaulting → engaged → defeated → memorialized**

Defeat records the exact boss proof, event history, discoverers, trackers, participants, teams, leagues, admitted card revisions, contributions, final squad, finishing card, rewards, and world transformation.

New bosses emerge from later canonical generation events. They may inherit ecological or narrative consequences but cannot copy the defeated identity.

## 8. Shared raids

### 8.1 Active ring and support field

- One live boss supports **36 active fighters**, organized as six squads of six.
- An unlimited surrounding support field contributes through scouting, healing, revival, defenses, supplies, puzzles, crowd control, and environmental objectives.
- Active positions rotate when fighters fall, withdraw, disconnect, or complete bounded rotations.
- Friend and team admission preserves compatible squads without allowing permanent monopolization.
- There are no private boss copies or alternate victory timelines.

Large populations are spread across regional objectives. Every participant remains part of the same event even when device-level rendering uses lower-detail representations.

### 8.2 Contribution

Contribution recognizes:

- damage and finishing actions;
- defense, interception, and tanking;
- healing and revival;
- buffs, debuffs, and card synergy;
- scouting and weakness discovery;
- puzzle and mechanism completion;
- resource delivery and fortification;
- protection of settlements and objectives;
- leadership and squad coordination;
- participation in earlier tracking phases.

Anti-idle, anti-collusion, rate, and validation rules require meaningful actions. No single damage build can dominate every reward category.

### 8.3 Crowd safety

- Players cannot physically block entrances or objectives.
- Full-detail rendering is proximity and device-budget aware.
- Distant players remain represented through formations, silhouettes, atlas presence, and contribution feeds.
- Movement and combat are server validated.
- Disconnects preserve earned contribution and release active positions deterministically.
- New-player objectives prevent elite groups from monopolizing useful roles.

## 9. Teams and leagues

Teams provide persistent membership, roles, shared identity, banners, six-player squad formation, invitations, scheduling, achievements, and contribution history.

Leagues coordinate multiple teams and compete through:

- boss-campaign contribution;
- discovery races;
- regional objectives;
- world defense;
- tournament results;
- historical firsts;
- seasonal accomplishments that never invalidate permanent ownership.

League power cannot grant exclusive ownership of public geography or exclude unaffiliated players from shared-world participation.

## 10. Card mastery

Verified cards function as:

- active world companions;
- raid fighters;
- support specialists;
- scouts and trackers;
- healers, defenders, and amplifiers;
- puzzle instruments;
- environmental keys;
- portal stabilizers;
- crafting catalysts;
- team-composition roles;
- proof-linked carriers of historical victories.

Activity loadouts pin one active companion, a bounded support deck, and an optional utility card. Exact proof revisions and current ownership are confirmed before decisive activity phases.

Progression includes card mastery, explorer mastery, regional reputation, team mastery, league history, and world mastery. Access gates may use card count, qualifying roles, level, achievements, reputation, team composition, discovery chains, or live world conditions. Every region retains meaningful public content.

Rewards may include experience, bond, catalysts, abilities, cosmetics, lore, access, crafting materials, public recognition, boss artifacts, monument inclusion, and new aftermath quests. Reward issuance is event-linked and idempotent.

## 11. Portable V3 player vault

The vault becomes the player's encrypted, proof-sealed portable recovery root.

Restoring it recovers:

- every verified card and living revision;
- card lineage, achievements, and battle history;
- explorer identity and appearance;
- player statistics and mastery;
- discoveries and known locations;
- quests and regional progression;
- boss participation and contribution receipts;
- rewards, cosmetics, and honors;
- team and league membership references;
- loadouts and preferences;
- personal event history;
- last trusted checkpoint and Kai-Klok coordinate;
- accessibility and control settings.

### 11.1 Vault structure

The vault PNG contains a canonical `receiz.proof_bundle` bound to the visible artifact plus an encrypted private recovery payload containing:

- deterministic card manifests and proof bundles;
- current player-state checkpoint;
- deduplicated personal event records;
- canonical world-event references;
- ownership references;
- projection and history digests;
- migration metadata;
- recovery and integrity proofs.

Card visuals regenerate from deterministic proofs, avoiding redundant full-resolution copies inside the vault.

### 11.2 Privacy

Private history, messages, identity secrets, and sensitive account data never appear in the visible PNG. The private payload is encrypted and bound to player recovery authority. Sharing an individual card remains separate from sharing the private vault.

### 11.3 Restore

Restore performs:

1. canonical bundle and artifact-binding verification;
2. private payload integrity verification;
3. card, state, settings, and history recovery;
4. stable-event deduplication;
5. ownership and world-ledger reconciliation;
6. append of canonical events after the saved Kai-Klok coordinate;
7. preservation of newer valid state;
8. classification of restored, current, historical, and rejected records;
9. emission of a fresh reconciled vault revision when saved again.

The vault is authority for portable recovery evidence, not for rewriting current ownership or shared-world truth. Offline restore recovers the last trusted personal state. Online reconciliation completes everything newer.

A single vault carries current state, a compressed personal ledger, and proof-linked canonical history roots. It does not pretend to embed the entire indefinitely growing global event stream.

## 12. Player experience

### 12.1 Physical communication

- Permanent landmarks have distant recognizable silhouettes.
- Dynamic sites alter skyline, weather, creatures, sound, traffic, and routes.
- Boss activity creates regional signs before emergence.
- Trails, crowds, lights, damage, and environmental motion guide players.
- The atlas orients players without replacing physical discovery.
- The atlas and walkable world always share coordinates and lifecycle state.

### 12.2 Discovery

Dynamic events progress through rumor, scouting, approximate atlas location, physical discovery, canonical coordinate confirmation, social sharing, and global awareness when justified by the event.

Discovery is therefore meaningful social play, not merely clicking a map marker.

### 12.3 Interface

- The 3D world remains visually dominant.
- Camera orbit, zoom, and camera-relative movement remain consistent.
- The game surface prevents text selection, tap highlighting, and long-press callouts.
- Pulse remains the context-sensitive interaction verb.
- HUD information is minimal and safe-area aware.
- Detailed event, raid, team, league, and card information opens on demand.
- No navigation or overlay covers actionable controls.
- Critical flows fit supported mobile viewports without scrolling.

### 12.4 Emotional continuity

The environment, atlas, characters, monuments, cards, routes, settlements, ecology, and later events preserve consequences. Returning players recognize places and see that prior actions still exist.

### 12.5 Audio and accessibility

- Regions and dynamic sites have recognizable ambient identities.
- Boss phases affect the regional soundscape.
- Card, squad, support, and world transitions have readable feedback.
- Audio remains gesture-unlocked, configurable, and safely cleaned up.
- Icons retain accessible names and focus states.
- Color is never the only state signal.
- Primary touch targets remain at least 44 CSS pixels.
- Motion, flashing, camera shake, audio, and haptics respect preferences.
- World history and raid state expose screen-reader-readable summaries.

## 13. Recovery and failure behavior

- Signed/versioned checkpoints accelerate cold starts.
- Reducers replay from the latest verified checkpoint.
- Invalid checkpoints rebuild from admitted history.
- Client reconnection requests events after its last accepted Kai-Klok coordinate.
- Short reconnect windows retain raid admission; expiry releases slots deterministically.
- Rejected intents return typed actionable reasons.
- Missing Receiz authority visibly disables canonical mutations.
- Offline mode retains cached exploration and artifact verification only.
- Generator mismatches preserve existing content read-only until supported.
- Invalid cards, foreign ownership, replayed actions, and impossible movement are rejected before mutation.
- Tampered vaults restore nothing.
- Older valid vaults merge forward rather than overwriting newer canonical state.

## 14. Performance and scale budgets

The world remains singular while runtime work is bounded through regional interest management and disposable projections.

Initial release budgets retain or improve the existing Wilds targets:

- minimum 30 FPS on supported mid-range mobile devices and 60 FPS on capable devices;
- adaptive DPR of 1.0 low, 1.25 medium, and 1.5 high;
- normal exploration at no more than 120 draw calls and 180,000 visible triangles;
- bounded raid budgets defined and profiled before the first 36-player raid ships;
- instanced ecology and reusable site kits;
- bounded particles, lights, materials, audio nodes, and polling;
- compact projection deltas rather than global snapshots per heartbeat;
- one main gameplay canvas and one render-loop owner;
- no unbounded event, chat, presence, contribution, or transcript growth in active projections;
- expensive presentation pauses when hidden or inactive.

Performance optimization cannot alter canonical world semantics or hide active players from world truth. Lower-detail representation is presentation only.

## 15. Target V3 content scale

V3 targets:

- 5 fully differentiated regions;
- 15 major permanent authored landmarks;
- 40 secondary permanent points of interest;
- 12 generated dynamic-site families;
- 8 modular boss anatomy families;
- at least 40 boss ability, behavior, and transformation modules;
- 10 reusable activity families;
- 5 social settlements or gathering hubs;
- one canonical shared world;
- one complete portable V3 player vault;
- teams, leagues, and 36-player raids;
- permanent shared history and consequences.

Generated combinations expand variety while authored constraints preserve quality and coherence.

## 16. Test strategy

Every behavior change follows red-green-refactor.

### 16.1 Pure and property tests

- event envelope validation and versioning;
- deterministic reducer replay;
- projection digest stability;
- idempotent command admission;
- conflict rebase and illegal transition rejection;
- generated site compatibility, uniqueness, and reproducibility;
- boss identity, lifecycle, abilities, phases, migration, and permanent death;
- raid admission, rotation, contribution, disconnect, and reward rules;
- team and league membership, scoring, and anti-monopoly behavior;
- card loadout authority and role balance;
- V2 migration and V3 vault round-trip, privacy, merge, tamper, and ownership reconciliation.

### 16.2 Route and authority tests

- identity-derived actor authority;
- Pulse/Kai-Klok requirements;
- proof and ownership checks;
- bounded request and projection payloads;
- replay, rate, and movement rejection;
- checkpoint recovery;
- unavailable-capability locks;
- no partial rewards after failed append.

### 16.3 Browser and multiplayer tests

- representative mobile and desktop viewports;
- map and walkable-world coordinate agreement;
- dynamic site rumor through aftermath;
- several clients observing identical world state;
- squad admission and support-field participation;
- boss defeat visible to every client;
- permanent aftermath after refresh and cold start;
- team and league scoring consistency;
- vault export, local removal, import, full restore, and online reconciliation;
- no truncation, covered controls, accidental selection, console errors, or repeated renderer warnings;
- accessibility, reduced-motion, audio, keyboard, pointer, and touch behavior.

### 16.4 Release qualification

- production build, types, lint, complete tests, and SDK checks pass;
- replay from checkpoints reproduces exact projection digests;
- independent clients observe identical boss and world outcomes;
- long-session memory, network, audio, and renderer budgets remain bounded;
- vault restore recovers the complete player state and reconciles authority;
- no unresolved continuity, proof, ownership, privacy, or Receiz-law regression remains;
- the evidence-backed scorecard reaches the thresholds in Section 2.

## 17. Implementation slices

### Slice 1 — Living World Kernel vertical slice

- canonical event stream, reducers, and checkpoints;
- Pulse/Kai-Klok authority;
- global, regional, atlas, raid, team, league, player, and history projections;
- V2 migration and V3 encrypted player vault;
- permanent and generated-site registry;
- one generated site;
- one modular boss family and one unique boss;
- 36-fighter raid ring and support field;
- starter teams and league scoring;
- defeat, permanent aftermath, and history;
- atlas and physical-world synchronization;
- mobile, recovery, and authority qualification.

### Slice 2 — Landmark civilization

- permanent landmark and settlement expansion;
- reusable landmark-activity framework;
- regional characters, services, reputation, card entrances, puzzles, social spaces, and monuments.

### Slice 3 — Dynamic world ecology

- all dynamic-site families;
- migrations, markets, festivals, portals, ruins, disasters, threat propagation, rumor discovery, and atlas lifecycle presentation.

### Slice 4 — Boss ecology and global raids

- all boss families and modules;
- territory, migration, settlement attacks, weakness discovery, multi-region tracking, support objectives, contribution balance, and successor consequences.

### Slice 5 — Teams, leagues, and social world

- persistent teams and roles;
- league structure, invitations, scheduling, squad assembly, competitions, public records, abuse controls, and new-player protection.

### Slice 6 — Card mastery civilization

- card role taxonomy, loadout synergy, regional uses, mastery, Ascension, lineage utility, boss artifacts, crafting, competitive normalization, and portable reconciliation.

### Slice 7 — Narrative, memory, and emotional life

- regional stories, characters, causal follow-up events, historical atlas layers, environmental aftermath, regional audio, return-player continuity, celebrations, and memorials.

### Slice 8 — V3 qualification

- full automation and browser matrices;
- production and device profiling;
- continuity, proof, ownership, privacy, and recovery audit;
- content-scale verification;
- scorecard evaluation;
- regression fixes until every release gate passes.

## 18. Explicit exclusions

- No private or cloned boss instances.
- No client-authoritative shared rewards or world state.
- No silent fallback that represents local practice as canonical multiplayer.
- No cash wagering, pooled financial stakes, or uncontrolled valuable-card stakes.
- No unbounded unconstrained generative content.
- No reset that discards valid V2 continuity.
- No world-class claim without the evidence required by this specification.

## 19. Definition of done

V3 is done only when all eight slices are integrated and the release qualification passes. A partially implemented slice may be playable, but it is not the V3 release and cannot lower the final standard.

