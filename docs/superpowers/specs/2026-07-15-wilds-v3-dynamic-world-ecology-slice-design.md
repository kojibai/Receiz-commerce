# Wilds V3 Dynamic World Ecology Slice Design

Date: 2026-07-15  
Status: Approved for implementation  
Program: Wilds V3 Living World, Slice 3

## 1. Outcome

Slice 3 turns the existing canonical world kernel and Wayfinder Hollow civilization into a changing regional ecology. The same events exist once for every player, but players learn them naturally: rumor first, approximate region next, physical discovery at the actual coordinate, shared resolution, visible aftermath, and durable history.

The shipped experience must make returning to the atlas feel meaningfully different without making the world arbitrary. Permanent landmarks remain reliable anchors. Dynamic events create reasons to travel between them, meet other players, use verified cards in different roles, and remember what happened.

All new assets are created locally. No third-party model, image, map, audio, generation, telemetry, or runtime asset API is permitted.

## 2. Scope and exclusions

### Included

- deterministic authored generators for wandering markets, ruins, unstable portals, festivals, creature migrations, resource blooms, regional disasters, and settlement distress;
- cooperative puzzle and card-temple activity modules within ruin and portal families;
- a shared lifecycle from foreshadowing through historical aftermath;
- bounded causal relationships between compatible events;
- rumor, scouting, approximate atlas visibility, physical discovery, and exact-coordinate confirmation;
- walkable-world manifestations and local synthesized audio identities;
- compact mobile atlas and event experiences;
- append-only personal discovery and participation history carried by save V7, portable PNG, and the V3 player vault;
- canonical shared consequences admitted through the existing Pulse/Kai-Klok service.

### Excluded

- new boss families, boss territories, settlement assaults driven by bosses, and multi-region boss tracking, which remain Slice 4;
- mature team administration and league scheduling, which remain Slice 5;
- card Ascension, lineage economy, crafting, and trade settlement, which remain Slice 6;
- a full authored regional soundtrack or narrative season, which remain Slice 7;
- whole-program V3 qualification, which remains Slice 8.

Settlement distress in this slice is environmental or creature-pressure rescue activity. It cannot manufacture a boss or claim a boss victory.

## 3. Chosen architecture

Slice 3 uses a **canonical regional ecology ensemble**.

- Every event has one canonical identity, coordinate, seed, generator version, region, lifecycle, access policy, activity policy, consequence policy, and historical record.
- Pulse proposes and advances events. Kai-Klok orders accepted transitions.
- Authored deterministic compatibility rules connect events without unconstrained generation.
- Permanent landmarks, roads, Rift approaches, active sites, and protected settlement entrances retain clearance.
- Interest management limits what each client renders, not what exists.
- Personal discovery controls what a player knows; it never changes the canonical event coordinate.
- Practice mode may replay the same deterministic grammar locally but must remain visibly labelled and unable to publish canonical truth.

The existing Crystal Burrow boss-site lifecycle remains valid. Ecology sites use a separate generalized lifecycle so older boss events keep their original interpretation.

## 4. Ecology families

Each family has a recognizable silhouette, interaction grammar, audio identity, and aftermath.

| Family | World purpose | Primary activity | Typical aftermath |
| --- | --- | --- | --- |
| Wandering Market | Social convergence and rotating regional utility | Deliver a verified-card role, compare offers, contribute supplies | Merchant trail marker and regional demand memory |
| Echo Ruin | Exploration, history, puzzles, excavation | Cooperative route, symbol, or proof-order puzzle | Excavated archive, opened passage, or restored marker |
| Unstable Portal | Temporary traversal anomaly and coordination challenge | Stabilize deterministic nodes using complementary card roles | Closed scar, stable waypoint memory, or changed route |
| Convergence Festival | Shared celebration, contest, and low-pressure gathering | Harmony sequence, contribution stations, public milestones | Banner grove, score plaque, or community memory |
| Creature Migration | Moving ecology that changes encounters and routes | Observe, escort, protect, or redirect without ownership fabrication | Nesting ground, altered hotspot density, or migration trail |
| Resource Bloom | Temporary cooperative support opportunity | Sustain and harvest bounded non-financial world resources | Fertile patch, depleted grove, or renewed biome accent |
| Stormfront | Weather hazard and regional transformation | Shelter, repair, stabilize, and map safe routes | Fallen terrain, cleared route, charged biome, or recovery site |
| Settlement Distress | Environmental or wild-creature pressure near civilization | Rescue stations, reinforce access, deliver verified support roles | Repaired district edge, gratitude record, or defensive landmark |

No activity transfers ownership, fabricates valuable cards, promises financial value, or treats elapsed time as mastery. Until later slices add the required reward rails, Slice 3 awards canonical participation facts, regional reputation, discovery mastery, cosmetic world acknowledgements, and bounded gameplay resources only.

## 5. Deterministic generation grammar

### 5.1 Event definition

An ecology event records:

- `schema: receiz.wilds_ecology_site.v1`;
- stable `siteId`, `familyId`, `generatorVersion`, and `seedDigest`;
- exact canonical coordinate and region;
- `foreshadowedAt`, `activatesAt`, `resolvesAt`, and `historicizesAt` Pulse coordinates;
- compatibility tags, protected-clearance result, and parent cause IDs;
- access policy and minimum public role;
- activity module, deterministic objective sequence, and contribution bounds;
- visual kit, audio motif, weather influence, and route influence;
- resolution policy and authored aftermath module.

The same canonical inputs always produce the same definition. Invalid or exhausted placement fails closed; it does not silently relocate after admission.

### 5.2 Density and placement

- Maximum 24 non-historical ecology sites globally in the bounded release world.
- Maximum 5 non-historical ecology sites per region.
- Maximum 2 simultaneously active high-intensity events per region.
- Minimum authored clearance from permanent landmarks, landmark approaches, major roads, settlements, and unrelated active sites.
- Migration paths may cross roads only at authored crossing segments and may not block a landmark entrance.
- Distress sites are attached to an eligible settlement perimeter rather than placed inside its interaction radius.
- A client renders at most two detailed ecology manifestations plus distant low-cost signals.

### 5.3 Causal compatibility

The causal system is a bounded rule table, not a free-form generator.

- Creature migrations can attract a Wandering Market or Convergence Festival.
- Resource Blooms can attract migrations or intensify a nearby market demand.
- Stormfronts can destabilize a Portal, expose an Echo Ruin, damage a route, or cause Settlement Distress.
- Resolved Ruins can reveal a later Portal or Resource Bloom seed.
- Festivals can calm Distress and create a later merchant trail.
- Portals can never spawn inside settlements or directly create bosses in Slice 3.
- A causal child references its admitted parent event and cannot be issued twice.
- The rule table chooses at most one causal child per resolution unless an authored family explicitly permits none.

## 6. Lifecycle and authority

Ecology phases are:

`foreshadowed → discovered → active → resolving → aftermath → historical`

An event may also transition from `foreshadowed`, `discovered`, or `active` to `expired` when its authored window closes. Terminal phases never revive.

### Phase semantics

- **Foreshadowed:** canonical event exists; eligible players see a rumor region, family signal, confidence, and time window, never the exact coordinate.
- **Discovered:** at least one explorer physically confirms the site; the exact coordinate becomes eligible for the configured audience.
- **Active:** the activity accepts verified, bounded contributions.
- **Resolving:** new admission closes while accepted contributions settle deterministically.
- **Aftermath:** the result changes the walkable world and atlas with explicit canonical or practice provenance.
- **Historical:** active rendering retires; the record remains in atlas history and player vaults.
- **Expired:** the opportunity ended without resolution and leaves an authored absence, dispersal, or warning trace rather than vanishing silently.

Only server-side Pulse authority may create or globally advance an ecology site. Player commands may scout, discover, join, contribute, or acknowledge aftermath when location, phase, identity, proof role, idempotency key, and projection revision validate. Every canonical mutation uses the existing Receiz append/publication path and rolls back presentation of canonical success if publication fails.

## 7. Discovery and atlas behavior

Discovery is progressive and privacy-aware.

1. Pulse admits a foreshadowed site with an exact server coordinate.
2. The atlas projects only family, region, uncertainty radius, confidence, and remaining window for players without discovery authority.
3. Scouting actions narrow uncertainty but cannot reveal an exact point remotely.
4. Rift may move an explorer to a safe approach around the uncertainty area, never directly into the site.
5. Crossing the physical discovery radius enables Pulse discovery.
6. The admitted discovery reveals the exact coordinate according to the site's audience policy.
7. Shared contributions and resolution update every client from the same projection revision.
8. Aftermath and historical views preserve what happened, where, why, and whether the fact is canonical or local practice.

The atlas remains one full-screen map viewport. Dynamic information appears as tasteful map markers, uncertainty fields, route effects, and overlay pills/panels. It does not become a scrolling event directory. Selecting a marker explains the signal and allows near-Rift travel where permitted; it never remotely enters an activity.

## 8. Walkable-world presentation

Dynamic sites exist in the same Three.js canvas as the permanent world.

- Each family uses a local procedural kit with shared geometries, shared materials, instancing, and deterministic color/shape variation.
- Distant events use low-cost beacon silhouettes or atmospheric signals.
- Detailed geometry mounts only inside the regional interest radius.
- Migration actors follow deterministic bounded paths and use pooled articulated actors.
- Weather influence is regional and additive; it cannot replace the global renderer, break camera controls, or make controls unreadable.
- A compact world-status signal identifies the nearest relevant event without covering player identity, movement, Pulse, or the command dock.
- Physical proximity enables an icon-only Pulse action; the activity experience then opens as a focus-safe full-screen layer.

No gameplay surface permits text selection, native long-press callouts, or accidental image dragging.

## 9. Activity framework

All ecology activities use one deterministic activity state machine:

`briefing → active → submitted → accepted | rebased | rejected → resolved`

Activity modules define objectives, role slots, sequence seed, contribution caps, completion threshold, and visual feedback. The shared shell provides:

- canonical/practice provenance;
- exact event phase and regional context;
- participant count without leaking private identity;
- verified-card role selection;
- objective progress and contribution receipt;
- 44px minimum touch controls;
- reachable close and return-to-world actions;
- focus restoration and Escape handling;
- no page-level horizontal overflow at 320px.

The first release includes one complete playable module per family, reusing primitives where appropriate. A wrong sequence, stale revision, invalid proof, remote position, full capacity, or closed phase returns an explicit non-success state and never creates partial reward or reputation.

## 10. Persistence and continuity

Save schema V7 adds append-only ecology history and regional knowledge while accepting V2–V6.

Personal state includes:

- discovered site IDs and discovery receipts;
- rumor/scouting knowledge and confidence;
- accepted participation receipts;
- family mastery and regional reputation deltas;
- acknowledged aftermath and historical visits;
- last reconciled canonical cursor.

The portable save PNG and V3 player vault carry this state. Restore merges append-only valid receipts, deduplicates by event/source identity, rejects malformed or tampered entries, and then reconciles current ownership and canonical world truth. A restored vault can remember a historical event but cannot revive it, move it, reopen it, change its outcome, or claim participation absent a valid receipt.

## 11. Local audio and feedback

The existing gesture-safe Web Audio synthesizer adds bounded motifs for rumor, discovery, activation, contribution accepted, resolution, migration movement, market arrival, portal instability, festival harmony, ruin resonance, bloom growth, storm warning, and rescue completion.

Motifs are short deterministic oscillator/noise envelopes with pooled or promptly destroyed resources. Muted, reduced-motion, backgrounded, and disposed states stop or suppress work. No third-party audio API or downloaded audio asset is used.

## 12. Performance budgets

Slice 3 must preserve the existing quality profile:

- at or below 160 draw calls in the profiled detailed-event scene;
- at or below 180,000 rendered triangles;
- at most 110 live geometries and 6 textures in the release scene;
- `withinBudget: true` in published diagnostics;
- no second WebGL renderer;
- at most two detailed ecology manifestations rendered simultaneously;
- bounded migration actors and particle counts by quality tier;
- no unbounded timers, event arrays, audio nodes, listeners, or client polling;
- no page errors, WebGL warnings, or hydration warnings.

If a family cannot fit the budget, the implementation reduces local detail or distant population rather than raising the release budget.

## 13. Failure behavior

- Invalid Pulse, seed, family, coordinate, lifecycle, or causal parent fails closed.
- Placement exhaustion emits no site and no partial event chain.
- Duplicate command IDs return the original accepted result.
- Stale revisions rebase once against the latest projection and revalidate every condition.
- Receiz publication failure prevents canonical success presentation.
- Network loss preserves the last verified projection and labels it stale.
- Practice mode remains playable but visibly noncanonical.
- Missing verified-card roles explain what is required without offering purchase-based dominance.
- Expired events show authored dispersal or aftermath language instead of disappearing.

## 14. Verification and evidence

### Automated

- deterministic generation for every family across repeated seeds;
- density, clearance, uniqueness, and compatibility bounds;
- valid lifecycle paths and rejection of revival or skipped phases;
- causal-child deduplication and parent linkage;
- Pulse/Kai-Klok ordering, replay, checkpoint, idempotency, rollback, and publication failure;
- rumor privacy and exact-coordinate discovery authority;
- location, proof-role, phase, revision, capacity, and contribution validation;
- save V7 migration, portable PNG round-trip, V3 vault merge, tamper rejection, and canonical reconciliation;
- renderer/UI contracts, local audio lifecycle, and resource bounds;
- full existing regression suite, typecheck, lint, and production build.

### Browser

- production-mode WebKit at 320×568, 390×844, 430×932, and desktop;
- atlas rumor selection, uncertainty display, near-Rift, physical discovery, activity entry, contribution, shared resolution, aftermath, close, and return;
- representative activities from all eight families, with one complete deep playthrough and interaction checks for the remaining families;
- no clipped required text, unreachable controls, page overflow, accidental selection, or app/game dock overlap;
- clean console, nonblank canvas, screenshot evidence, renderer diagnostics, and long-session boundedness.

## 15. Slice completion rule

Slice 3 is complete only when all eight ecology families generate deterministically, appear coherently in atlas and walkable world, expose one real activity, advance through admitted lifecycle transitions, leave explicit aftermath, persist valid player history, and pass the stated authority, recovery, mobile, performance, and regression gates.

Completion of Slice 3 does not imply completion of boss ecology, teams/leagues, card-mastery civilization, narrative seasons, or whole-program V3 qualification.
