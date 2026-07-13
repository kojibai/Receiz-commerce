# Hidden Hotspot PNG Card Trading Design

## Goal

Turn Receiz Wilds into a complete hidden-creature collection loop: players search specific terrain positions, reveal deterministic creatures, capture and seal them in one animated sequence, receive one portable PNG proof object, and then download, sell, trade, share, or send those cards without leaving the active Receiz Exchange surface.

The experience uses familiar premium collectible-card conventions while keeping the creatures, capsule, card composition, terminology, effects, and trade dress original to Receiz Wilds.

## Discovery Model

Each streamed world region owns a deterministic set of hidden hotspots. A hotspot binds a base creature family to a stable world coordinate and one habitat cover type: grass, flowers, tree canopy, rock, cave, water ripple, ruin, or energy crack. The same region seed always produces the same creatures and coordinates.

Undiscovered creatures are not rendered openly. The player taps or clicks a terrain position, which is converted through a ground-plane raycast into world coordinates. A search pulse scans that exact position.

- A hit inside the hotspot radius starts the reveal sequence.
- A near miss emits directional particles toward the closest undiscovered hotspot.
- An empty search plays a brief habitat reaction but does not move or reroll encounters.
- Captured hotspots remain discovered and cannot produce duplicate encounter captures.
- Only nearby regions and a bounded number of hotspots are streamed.
- Captured companions may remain visible in the world as known creatures.

The opening region keeps authored starter habitats, while the remaining families are distributed deterministically across the large world.

## Encounter and Capture Sequence

A successful search creates one active encounter and temporarily locks further search input.

1. The selected hiding place reacts and opens.
2. The camera focuses on the creature as it emerges.
3. Rarity, foil, silhouette, and habitat effects build the reveal.
4. The Receiz Capsule launches and surrounds the creature.
5. Three seal pulses communicate capture progress.
6. Capture state and the portable proof are committed atomically.
7. The capsule transitions into the collectible-card reveal.
8. The revealed card is inserted into inventory before the celebration can be dismissed.

If an animation is interrupted after sealing, reopening the game restores the sealed inventory card rather than repeating or losing the encounter. Reduced-motion mode preserves the stages with fades and short scale changes.

## Mobile Game Layout

On mobile, the playable world is the dominant surface. The game viewport uses the available height between the compact store header and persistent bottom navigation, with a target equivalent to `clamp(480px, 68dvh, 680px)`. Controls remain overlaid or immediately attached to the world so searching never requires scrolling.

Content below the world is reorganized into tasteful compact trays:

- mission, reward, squad, progression, and inventory sections are collapsed by default;
- each tray exposes one concise summary row and expands independently;
- opening one tray closes the previously open tray on narrow screens to prevent an excessively long page;
- inventory initially shows collection count, selected card thumbnail, and primary action, with filters and the full card detail inside the expanded state;
- touch targets remain at least 44 CSS pixels even when surrounding copy and padding are reduced;
- expanded content scrolls within a panel capped at `55dvh` instead of lengthening the entire page;
- collapse state is accessible through native disclosure semantics and preserved for the current session.

Desktop keeps the larger strategic layout while allowing the same secondary panels to collapse. Typography, spacing, borders, and motion are refined to keep the interface restrained, legible, and visually subordinate to the game world.

## PNG Proof Object

The downloadable PNG is the sole portable card artifact. There is no JSON sidecar.

The visible card contains the creature artwork, name, species, stage, rarity, foil, card number, stats, abilities, owner coordinate, evolution lineage, proof fingerprint, and offline-verification instructions.

The PNG also contains a Receiz metadata chunk with:

- schema and format versions;
- the canonical card manifest;
- capture and evolution lineage;
- owner coordinate at export time;
- canonicalization identifier;
- artifact digest and proof digest;
- append-only ownership references;
- offline verifier compatibility data.

PNG proof creation uses deterministic canonical serialization and a standards-compliant ancillary metadata chunk inserted before `IEND`, with a valid CRC. The artifact digest excludes or normalizes its own digest field to avoid circular hashing. Offline verification parses the PNG structure, validates chunk CRCs, reconstructs the canonical manifest, recomputes digests, and rejects altered pixels or metadata.

Importing a card means uploading the PNG itself. Successful verification reconstructs the portable card record from the image; no separate manifest upload is accepted as authoritative.

The capture identity and capture digest never change. A sale, trade, or send appends a new ownership coordinate and produces an updated downloadable PNG whose embedded ledger head points to that transfer. Older PNGs remain valid historical proofs but are stale for future ownership-changing commands.

## Inventory Actions

Every owned card provides:

- Download PNG proof object;
- Add to Exchange;
- List for sale with a price;
- Open public share page;
- Propose in a trade;
- Send to another user;
- Evolve when progression requirements are met.

Adding or listing performs server-side PNG verification and owner-authority checks. Local-only capture remains immediately downloadable, while Exchange actions require a resolved Receiz identity.

## Public Card Share Page

Each admitted card receives an application-local route such as `/cards/{asset-id}`. It displays the card image, verification state, owner display identity, rarity, stats, lineage, sale status, price, and available actions.

Purchases use the existing same-surface wallet-first settlement and embedded card funding. Ownership changes only after settlement. The page never navigates the active browser surface to `receiz.com`.

## Multi-Card Trade Offers

A signed-in user can propose one or more cards for a listed card. Offered cards may be selected from logged-in inventory or uploaded as one or more PNG proof objects. An offer may also include an optional cash component.

Every offered PNG is offline-verified. The server rejects tampered cards, duplicates, foreign-owned cards, unavailable cards, revoked cards, and cards already committed to an accepted operation.

Offers remain pending until the listing owner accepts or declines them. The proposer may withdraw a pending offer.

Acceptance is atomic and idempotent:

1. Re-resolve both identities.
2. Re-verify every PNG and current ownership coordinate.
3. Confirm every card remains available.
4. Settle an optional cash component.
5. Transfer the entire bundle or transfer nothing.
6. Append trade and ownership events with one operation identifier.
7. Update both inventories, the listing, and share pages.

Repeated acceptance requests return the existing result and cannot transfer twice.

## Direct User-to-User Sending

An owner may select one or multiple inventory cards and send them to a recipient identified by Receiz username or email. Recipient lookup returns only the minimum confirmation identity required by the sender.

After explicit confirmation, the server re-verifies the PNGs, current ownership, recipient, and availability. It then transfers the complete bundle atomically, appends send and ownership records, removes the cards from the sender’s active inventory, and adds them to the recipient inventory.

Unknown recipients, self-sends, duplicate cards, tampered cards, foreign-owned cards, and cards locked by an accepted sale or trade are rejected. Capture seals and evolution lineage are immutable across sends.

## State and Service Boundaries

- `hidden-hotspots`: pure deterministic region and search-result projection.
- `encounter-state`: search, reveal, seal, and completion state machine.
- `png-proof`: PNG encoder, metadata chunk writer/parser, CRC validation, and offline verification.
- `card-ledger`: durable card ownership, listing, offer, trade, and send commands.
- `card-share`: public verified card projection.
- Game UI: terrain input, habitat reactions, creature emergence, capsule animation, and reveal dialog.
- Inventory UI: compact/expanded collection views plus download, listing, trade, share, send, and evolution controls.

Server commands remain authoritative for Exchange admission and ownership changes. Client state may optimistically show progress but never finalizes a sale, trade, or send without the server result.

## Failure Handling

- Empty and near-miss searches are normal game outcomes and do not mutate encounters.
- A malformed PNG fails before any market or ownership mutation.
- Interrupted capture restores from the atomically sealed inventory state.
- Failed settlement leaves all ownership unchanged.
- Failed multi-card validation transfers none of the bundle.
- Network interruption preserves pending offers and idempotent operation identifiers.
- Unresolved recipient input does not reveal whether an unrelated private email owns an account.

## Verification

Automated coverage will verify:

- deterministic hotspot distribution across regions and coverage of all 250 families;
- undiscovered creatures are not openly rendered;
- hit, near-miss, empty, and already-captured search results;
- atomic encounter sealing and interruption recovery;
- valid PNG metadata chunks, CRCs, deterministic manifests, and pixel/metadata tamper rejection;
- PNG-only import with no JSON dependency;
- card share-page projections;
- same-surface purchases;
- multi-card offer creation, rejection, withdrawal, acceptance, and replay safety;
- atomic sends by username and email;
- ownership and inventory updates after every operation;
- reduced-motion and keyboard-accessible equivalents.
- mobile viewport sizing, collapsed-by-default detail trays, disclosure accessibility, bounded expanded panels, and minimum touch targets.

Real-browser verification will cover desktop and mobile terrain searching, the taller mobile world viewport, compact and expanded detail trays, reveal animation, capsule capture, PNG download and re-upload, listing, share-page purchase, multi-card trade proposal/acceptance, and direct sending.
