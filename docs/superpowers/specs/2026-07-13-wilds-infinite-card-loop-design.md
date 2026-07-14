# Receiz Wilds Infinite Card Loop Design

## Outcome

Deliver one complete playable and portable loop:

**SealCub starter → persistent discovery → proximity feedback → wild battle → weaken → capsule capture → unique Kai-seeded card → portable PNG → offline re-import → cinematic public card page → list, buy, sell, trade, or offer → earned fusion child.**

The existing capsule sealing and reveal presentation remains visually and behaviorally intact.

## Product principles

- Deeply engaging through mastery, surprise, collection, tactics, and social play—not pay-to-win or manipulative engagement pressure.
- Every card is independently portable and offline-verifiable as a PNG proof object.
- Species remain recognizable while individual captures are unique.
- Every generated result is deterministic from sealed inputs. Verification regenerates the same traits and rejects mutations.
- Commerce and ownership actions remain inside the Exchange; users are never redirected to Receiz.com.
- Existing downloaded cards and legacy Mintcub IDs continue to verify after the starter display name becomes SealCub.

## Delivery boundaries

This vertical slice implements the full architecture once, using SealCub and the current catalog as the playable content base. The same deterministic generators then scale the system without a fixed creature-instance limit. It does not require manually authoring an unlimited catalog.

## 1. Mobile application chrome

- The floating five-item bottom toolbar remains fixed, inset, rounded, and translucent.
- Mobile content extends behind it. There is no permanently reserved white band above it.
- Bottom scroll padding equals the toolbar footprint plus the device safe area, so the last content can scroll above the toolbar.
- The store header becomes shorter through a smaller brand mark, tighter padding, reduced typography, and a compact account button.
- The Wilds viewport remains the dominant mobile surface.

## 2. Premium gameplay HUD

- The top HUD becomes one compact glass composition rather than competing loose panels.
- Player identity and active creature stay on the left; resources use bounded compact cells on the right.
- X and Z coordinates render in dedicated badges and never share a free-flowing text line.
- All labels have explicit overflow, truncation, wrapping, and minimum-width rules.
- Mission, event, and discovery feedback remain readable without covering the playable center.
- On narrow phones, nonessential labels shorten while values and interaction states remain visible.

## 3. Persistent discovery

- Discovery is active whenever the encounter is searchable. A user taps terrain repeatedly without re-arming a controller button.
- The controller button becomes a compact `Discovery on` status/control and is not required between searches.
- Searches are disabled only while a battle, capsule sequence, reveal, or blocking dialog owns input.
- Every search emits a visible pulse at the exact world point.
- Feedback tiers are `Cold`, `Warm`, and `Hot` based on the closest uncaptured hotspot.
- When consecutive searches target the same hotspot, feedback also reports `Closer`, `Farther`, or `Steady` by comparing distance.
- Directional clue vectors remain available for warm/hot searches.
- Empty searches never move creatures or mutate hotspot placement.

## 4. Distributed encounters

- Hotspots remain stable and deterministic across regions.
- Density increases beyond the existing six-per-region baseline while enforcing minimum spacing between neighbors.
- Region streaming stays bounded around the player.
- Species selection, habitat cover, rarity, and difficulty derive from the region and hotspot seed.
- Captured hotspots remain captured; additional instances are distributed into other stable positions rather than clumped around spawn.

## 5. Battle before capture

### State machine

`searching → hint → emerging → battle_intro → player_turn ↔ wild_turn → capture_ready → capsule → sealed → revealed`

### Rules

- The selected owned card becomes the active fighter.
- Battles are turn-based and deterministic from the encounter seed, player card proof, turn number, and selected ability.
- Player actions are Ability 1, Ability 2, Guard, Switch Card, and Capture when unlocked.
- Health, guard, energy, speed, ability power, elemental affinities, temperament, status effects, and limited critical effects influence results.
- The wild creature becomes capture-ready below 30% health.
- The player chooses when to use the capsule. Further attacks can knock the creature out and make it flee.
- Capture probability improves as health falls and through relevant abilities/status effects, but a valid capture-ready attempt always uses deterministic sealed odds.
- A failed throw returns to battle if the creature remains able to fight.
- Player defeat restores the wild hotspot after a recovery period; it does not silently award a card.
- No card proof is created before a successful capsule seal.

## 6. SealCub starter and card compatibility

- New and existing players retain one default starter.
- Its display name changes from Mintcub to SealCub.
- The internal family/form IDs remain compatible with already downloaded Mintcub cards. Name projection handles the legacy alias without invalidating proof digests.
- The starter is a verified playable card and can battle, evolve, trade, and participate in fusion under the same ownership rules as captured cards.

## 7. Deterministic unique individuals

### Variant seed

Every captured individual seals a `variantSeed` derived from a canonical hash of:

- proof schema version;
- species/form archetype;
- hotspot and encounter IDs;
- region and habitat;
- capture timestamp;
- owner Receiz ID;
- Kai pulse and Kai clock coordinate;
- battle transcript digest;
- deterministic uniqueness nonce.

### Generated traits

The seed deterministically produces:

- primary, accent, glow, pattern, and foil colors;
- markings, proportions, appendage/detail variants, aura, and particle signature;
- idle animation timing, movement cadence, expression, and battle animation profile;
- stat potential, ability modifiers, affinity, temperament, and rarity presentation;
- collectible serial, variant title, and visual fingerprint.

The generator uses bounded ranges so variants remain recognizable, legible, balanced, and accessible. The same seed always produces the same output offline.

### Supply model

Species archetypes are finite and recognizable; individual variants are effectively unbounded. Duplicate instance IDs or variant seeds are rejected by the ownership ledger.

## 8. Portable PNG proof and import

- The PNG remains the only required portable proof file; no JSON sidecar is introduced.
- The embedded proof expands to include generator version, variant seed, derived trait digest, battle transcript digest, Kai coordinates, QR destination, ownership, and lineage.
- The visible PNG includes the unique variant artwork and a small high-contrast QR linking to `/cards/{assetId}`.
- The QR quiet zone and contrast remain scan-safe without dominating the composition.
- Inventory adds `Import verified card PNG` with file picker and drag/drop.
- Import parses the private proof chunk, validates PNG integrity, verifies the proof and derived traits offline, checks the current ownership ledger, rejects duplicates, and adds valid owned cards atomically.
- A card may be playable when its current ledger owner matches the signed-in user. An old PNG whose card has since been transferred remains valid history but cannot grant current play authority.
- Import failures state the exact category: unsupported PNG, missing proof, tampered pixels/proof, unknown generator, duplicate, or not currently owned.

## 9. Progression beyond fixed stages

- Existing three-stage species progression remains the introductory evolution path.
- After the apex form, earned mutation evolutions can continue without a fixed global stage ceiling.
- Each mutation requires gameplay milestones, level/bond requirements, and an earned evolution resource.
- Mutation seeds combine the prior proof, achievement, selected path, and evolution Kai pulse.
- Earlier forms remain in inventory as immutable lineage history.

## 10. Fusion

- Two currently owned cards can create a new child while both parents remain fully playable, tradable, and eligible for future children.
- Fusion requires one earned Fusion Spark.
- Both parents must satisfy bond/achievement rules and must not be inside a 24-hour parent-specific fusion cooldown.
- Fusion consumes the Spark but does not consume or lock either parent.
- The child seed combines both complete parent proof digests, selected inheritance emphasis, achievements, and the fusion Kai pulse.
- The child receives recognizable inherited visual, stat, affinity, temperament, animation, and ability traits within balance bounds.
- The child proof stores both parent IDs/digests. Parent pages project their children without mutating the original parent PNG.
- Replaying the same fusion input is idempotent and cannot mint a duplicate child.

## 11. Cinematic standalone card page

The selected composition is **Cinematic bottom dock**.

- Route: `/cards/{assetId}`.
- The animated card floats as the dominant object in a responsive 3D scene.
- Pointer/device motion provides subtle tilt and light response; reduced-motion mode uses a premium static presentation.
- A compact floating bottom dock exposes Overview, Proof, Lineage, Offers, and the primary Buy/List action.
- Detail opens in a compact sheet without permanently shrinking the card.
- The QR remains tasteful and scan-safe.
- Overview shows variant traits, battle identity, stats, abilities, owner-safe public metadata, and achievement history.
- Proof performs local verification and shows the proof digest, Kai pulse, generator version, and pixel integrity without exposing private secrets.
- Lineage shows parents, children, evolution path, and fusion eligibility.
- Offers shows open money, card, and mixed offers with clear owner/proposer state.

## 12. Marketplace and ownership mechanics

- Owners can list/unlist a card, set a fixed price, accept/decline offers, propose trades, or send a card by username/email.
- Visitors can buy, propose one or multiple cards, propose money, or combine money and cards in one offer.
- Trade uploads accept one or multiple offline-verified PNG cards.
- The owner must accept an offer before ownership changes.
- Acceptance atomically rechecks current ownership for every card, settles any money component, swaps ownership, closes conflicting listings/offers, and appends proof-linked operations.
- Buy and payment remain embedded in the Exchange surface and never redirect to Receiz.com.
- Public share pages do not expose owner email or private identity data.

## 13. Persistence and authority

- Local game state stores presentation/progression caches only.
- PNG verification establishes artifact integrity, not current ownership.
- The server ownership ledger establishes current play, sale, send, and fusion authority.
- Every mint, import admission, listing, sale, transfer, battle reward, evolution, and fusion is idempotent.
- Client retries cannot create duplicate cards or duplicate transfers.

## 14. Error and recovery behavior

- Search and battle input are ignored during incompatible encounter phases.
- Interrupted battles restore from a versioned deterministic snapshot.
- Unknown generator versions remain viewable as proof history but cannot be used for new competitive actions until supported.
- Failed uploads and marketplace operations never partially mutate inventory or ownership.
- Failed payments do not transfer ownership.
- Invalid fusion eligibility leaves parents and Sparks unchanged.
- Offline play permits exploration and local verification; server-authoritative ownership actions queue visibly until connectivity returns.

## 15. Accessibility and performance

- All combat and marketplace actions are keyboard and screen-reader accessible.
- Color-based proximity and battle states always include text/icon cues.
- Motion honors `prefers-reduced-motion`.
- Mobile touch targets remain at least 44 CSS pixels for primary gameplay actions.
- Generated visuals reuse procedural geometry/materials and bounded particles; generator output does not create unbounded runtime assets.
- Card pages lazy-load 3D and retain a complete static fallback.

## 16. Verification contract

### Unit and property tests

- Persistent proximity tiers and closer/farther comparisons.
- Battle state transitions, damage bounds, capture threshold, failure, victory, defeat, and replay determinism.
- Variant uniqueness, deterministic regeneration, balance bounds, and trait tamper rejection.
- PNG QR/proof round trip, pixel tamper rejection, import ownership, duplicates, and legacy compatibility.
- Infinite mutation lineage and fusion derivation, Spark consumption, cooldowns, parent preservation, and idempotency.
- Listing, money/card/mixed offers, acceptance authority, send, and atomic swaps.

### Render and interaction tests

- No fixed white band above the mobile toolbar; safe-area clearance remains below.
- Compact header and premium HUD do not clip at 320, 390, and 430px widths.
- Repeated terrain taps work without re-arming and visibly change proximity feedback.
- Battle can be completed from encounter through the unchanged capsule/reveal flow.
- A downloaded PNG can be removed locally, imported, verified, and selected for battle.
- Standalone card page renders the cinematic dock, QR, proof sheet, lineage, and transactional actions.
- Buy/list/trade flows stay on the current app domain.

### Release checks

- Full tests, typecheck, production build, browser console, network, mobile/desktop screenshots, interaction playthrough, and offline PNG verification.
