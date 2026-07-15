# Wilds V3 Slice 2 Landmark Civilization Design

Date: 2026-07-15
Status: Approved by the standing V3 direction to use the recommended continuity-maximizing option
Parent program: `2026-07-15-wilds-v3-living-world-program-design.md`

## Outcome

Slice 2 makes the Wilds feel inhabited, useful, and memorable by shipping one complete permanent settlement framework rather than scattering decorative buildings across the map. Wayfinder Hollow becomes the first regional settlement: a stable place players learn, revisit, meet within, use their verified cards, build regional reputation, hear changing world context, and see shared history become physical monuments.

The playable loop is:

> Discover Wayfinder Hollow on the atlas, Rift to its road approach, walk through the real entrance, meet its residents, choose a civic service or card-keyed activity, earn one idempotent personal reputation fact, see live explorers in the commons, inspect monuments derived from canonical world history, leave at the same entrance, and carry the new history inside the V3 vault.

## Approach decision

Three approaches were considered:

1. **One deep reusable settlement vertical slice — selected.** It proves geography, buildings, residents, services, reputation, card utility, social presence, monuments, persistence, mobile UI, audio, and release qualification in one coherent place. Later settlements reuse the same contracts.
2. **Many shallow landmarks.** This would improve map density quickly but produce places without meaningful reasons to return.
3. **Framework-only refactor.** This would reduce future code cost but would not improve the player experience in this release.

The selected approach matches the V3 program rule that each slice must be playable and release-qualified before expanding breadth.

## Permanent geography

Wayfinder Hollow has the stable ID `wayfinder-hollow` and coordinate `{x:72,z:40}` beside the Golden Spine. Its Rift approach remains outside the settlement radius so entry always happens on foot. It is public, requires no cards to enter, and never disappears.

The settlement has five readable districts:

- **Trail Gate:** orientation, return coordinate, and entry threshold.
- **Dawn Commons:** visible nearby players and shared-world status.
- **Mosslight Atelier:** verified-card attunement service.
- **Cartographer House:** a deterministic route-memory puzzle.
- **Monument Walk:** canonical defeated bosses and important world facts.

The atlas, walkable environment, entrance detector, experience header, and vault history use the same definition and coordinate.

## Residents and services

Residents are authored permanent identities, not generated disposable dialogue:

- **Mira Vale, First Wayfinder:** introduces the region and offers route-memory work.
- **Oren Moss, Cardwright:** inspects the active verified card and performs a proof-pinned non-transferable attunement.
- **Sola Reed, World Archivist:** explains current canonical events and tends Monument Walk.

Each resident exposes a small service contract with a stable ID, availability policy, card requirement, reputation requirement, deterministic dialogue state, and bounded outcome. Slice 2 services never mint transferable value, alter ownership, or fabricate canonical world facts.

## Civic event and reputation model

Personal settlement history is append-only:

```ts
type WildsCivicEvent = {
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
```

Events use deterministic IDs from their actor, source, proof, and civic day. Duplicate event IDs do not score twice. Reputation is projected from admitted events and clamped per source. Ranks are `visitor`, `neighbor`, `wayfinder`, and `keeper`. Public entry is never gated; higher reputation reveals richer dialogue and services.

These personal facts live in `PlayState`, serialize through the current save schema, and are therefore included and proof-bound by the V3 player vault. Restoring a vault deduplicates civic event IDs. Canonical world facts still win during vault reconciliation.

## Card-keyed activities

The settlement adds two bounded activities:

- **Card attunement:** requires the active card to pass existing offline verification. It records the exact proof digest and grants one personal cosmetic/role acknowledgement, never ownership or trade value.
- **Route-memory puzzle:** a deterministic three-step path generated from settlement ID, player ID, and civic day. Completion records one event and reputation award. Replay with the same event ID is idempotent.

New players without a usable card can enter, meet residents, use the commons, inspect monuments, and complete orientation. The UI always explains why a card service is unavailable.

## Social commons and monuments

Dawn Commons reuses the existing live multiplayer projection. It displays exact nearby explorers already admitted by the multiplayer service; it does not create a second room or authority system.

Monument Walk is a projection, not a second history ledger. It renders canonical `defeatedBossIds`, current site memorials, and authored founding stones. Practice mode labels simulated monuments as practice and never presents them as shared history.

## Experience architecture

The current monolithic `WildsLandmarkExperience` remains responsible for the three flagship activity worlds. A new `WildsSettlementExperience` owns settlement navigation and consumes small pure modules:

- `wilds-settlements.ts`: permanent definitions, residents, districts, and services;
- `wilds-civic-history.ts`: event creation, verification, replay, reputation, and ranks;
- `wilds-route-memory.ts`: deterministic puzzle state machine;
- `WildsSettlementExperience.tsx`: one full-screen, mobile-safe settlement surface;
- `WildsSettlementEnvironment.tsx`: reusable 3D building/district kit within the existing canvas.

`PlayCampaign` selects the correct experience by landmark kind and remains the single owner of player state, multiplayer, living-world projection, save, and vault creation.

## Visual and audio direction

Wayfinder Hollow is an inhabited forest settlement, not a generic medieval town: moss-lit timber arches, suspended map ribbons, warm window light, card-shaped civic signs, a central compass garden, and monument glass that changes with world history. Buildings use one externally sourced or hybrid hero town-hall asset when generation credentials permit; repeated stalls, lamps, fences, signs, and foliage remain instanced/procedural for mobile performance.

Audio adds a short settlement ambience loop plus discrete arrival, resident, attunement, puzzle, and monument cues. It obeys the existing gesture unlock, volume, mute, reduced-motion, and cleanup lifecycle.

## Mobile interaction

The settlement opens as one viewport with a persistent header, district rail, focused content stage, and bottom action row. Content may scroll only inside the focused district panel. Close and return controls remain at least 44px and clear every safe area. No panel covers the app dock, and no text relies on ellipsis for required meaning at 320×568.

## Failure behavior

- Invalid or tampered cards cannot be attuned.
- Duplicate civic actions return the existing projection without another reward.
- Malformed restored events are discarded; valid older saves default to empty civic history.
- Missing multiplayer or Receiz world connectivity leaves the settlement explorable and labels social/history data as local practice.
- Asset or audio loading failure falls back to the procedural settlement kit and synthesized existing cues without blocking play.

## Release gate

Slice 2 is complete only when:

- Wayfinder Hollow is identical in atlas and gameplay and must be entered on foot;
- every district, resident, service, puzzle, commons, and monument is reachable on mobile;
- civic events replay deterministically and duplicate actions cannot score twice;
- the active card proof digest is pinned for attunement;
- reputation and civic history survive save and V3 vault restore;
- canonical monuments come only from the living-world projection;
- production build, full tests, fresh WebKit mobile flows, desktop flow, console checks, and renderer diagnostics pass;
- the premium game-director evidence includes its skill/reference ledger, asset/audio sourcing ledger, visual scorecard, screenshots, and remaining Slice 3 boundaries.

## Explicit non-goals

Slice 2 does not ship multiple capitals, player housing, commerce settlement, persistent team halls, dynamic festivals, boss attacks, full NPC schedules, transferable civic rewards, or a general dialogue authoring CMS. Those build on this framework in later slices.
