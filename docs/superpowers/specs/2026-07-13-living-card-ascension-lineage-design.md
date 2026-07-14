# Receiz Wilds Living Card Ascension and Lineage Design

## Outcome

Turn every Receiz Wilds card into a persistent living character that grows through meaningful play, evolves beyond the existing three stages without a fixed ceiling, changes its own full-body artwork as it grows, and keeps a complete append-only proof history inside its portable PNG.

Two eligible living cards can also produce a new independently portable child. Parents remain owned, playable, tradable, and capable of producing later children. Every child has its own stable identity, living history, growth path, and descendants.

This design supersedes the immutable post-evolution-card behavior in sections 9 and 10 of `2026-07-13-wilds-infinite-card-loop-design.md`. The earlier document remains authoritative for discovery, battle, capture, upload, exchange, and the capsule reveal unless this document explicitly changes a rule.

## Product principles

- Growth comes from varied gameplay accomplishments, never from waiting alone or repeatedly pressing a button.
- A card has one stable identity throughout its life. Its current presentation evolves while its previous states remain provable.
- Proof history is append-only. No evolution, transfer, or offspring event may rewrite or remove an earlier revision.
- Children are new living assets. Creating a child never consumes or replaces either parent.
- Every visual and mechanical result is deterministic from sealed inputs and can be reconstructed offline.
- Creatures are original Receiz characters. They use the approved Heartbound visual language, not copied characters, anatomy, names, or trade dress from another property.
- The portable PNG remains the proof object. A JSON sidecar is not required.
- Current ownership remains server-authoritative. PNG verification proves artifact integrity, not current authority to play, reproduce, list, or transfer.
- The system favors mastery, attachment, discovery, strategy, and collection rather than manipulative engagement or pay-to-win pressure.

## 1. Stable living-card identity

Each creature has one stable `assetId` for its entire life. Capture or birth creates revision zero. Evolution and Ascension append new revisions under the same `assetId`; they do not mint replacement asset IDs.

The current card projection is the last verified revision in its chain. Inventory, active deck, public page, exchange listing, downloadable PNG, and vault export all show that projection by default.

Every prior revision remains accessible through the card timeline. A prior revision records its artwork genome, stats, abilities, growth state, proof digest, and cause. Historical forms may be viewed and verified but cannot be selected as the active competitive state after a later revision has been sealed.

Transfers move the complete living asset, including its revision history and lineage. The new owner may continue its growth. Ownership changes never reset bond history, achievements, parents, children, or Ascension rank.

## 2. Append-only proof chain

### Living manifest

The portable manifest advances to a new schema version that contains:

- stable card identity and catalog origin;
- birth kind: capture, starter, or fusion child;
- immutable birth genome and birth proof;
- ordered revision chain;
- current revision number and digest;
- parent references for children;
- child references or child-event commitments for parents;
- generator and renderer versions;
- ownership projection metadata that can be reconciled with the ledger.

Each revision contains:

- monotonically increasing revision number;
- previous revision digest;
- sealed timestamp and Kai Pulse;
- growth snapshot and resulting Ascension rank;
- qualifying achievement and quest IDs;
- catalyst ID and consumption receipt;
- transformation reason shown to the player;
- deterministic genome deltas;
- complete derived current genome digest;
- stats, abilities, rarity, title, and presentation changes;
- children or legacy events newly committed by this revision;
- renderer version and rendered-art digest.

The revision digest commits to the canonical prior digest and all new fields. Verification rejects missing links, reordered revisions, duplicate revision numbers, altered causes, invalid derived traits, or a current projection that does not match the final revision.

### Live update behavior

When the last requirement is completed, the game prepares the next revision, validates it, renders the transformation, seals it, and atomically promotes it to current. The stable `assetId` does not change.

If proof generation, rendering, storage, or authoritative admission fails, the prior revision remains current. Catalysts and one-time achievements are not consumed until the new revision is durably admitted. Retrying the same transformation key returns the same revision rather than appending a duplicate.

## 3. Progression model

### Introductory evolution

The existing catalog stages 1–3 remain the recognizable introductory species arc. Their level, bond, and item requirements continue to apply, but each transition now appends a revision to the same living card.

### Unlimited Ascension

After stage 3, the card advances through `Ascension I`, `Ascension II`, and onward. Ascension rank is a non-negative integer with no product-level maximum. Requirements scale through bounded formulas rather than a manually authored form list.

Every Ascension requires all of the following:

1. A rank-appropriate bond threshold.
2. A major qualifying achievement not previously consumed for an Ascension.
3. A deterministic character quest based on the creature's genome, temperament, element, current rank, and history.
4. An earned Ascension catalyst.
5. Completion of any current recovery period.

Time alone never causes growth. Recovery only prevents immediate repetition; it is not itself sufficient progress.

### Growth paths

The progress engine recognizes six complementary paths:

- **Bond:** travel time while active, care moments, shared victories, recovery, and character interactions.
- **Battle mastery:** difficult wins, tactical constraints, comeback victories, ability mastery, streak milestones, and boss encounters.
- **Exploration:** new habitats, hidden hotspots, rare world states, regional discoveries, and Kai Pulse conditions.
- **Legacy:** producing children, raising descendants, adventuring with offspring, and completing family-tree milestones.
- **Community:** verified fair trades, accepted challenges, cooperative objectives, and collection achievements.
- **Character quests:** deterministic goals suited to the specific creature instead of generic repeated chores.

A single activity may add ordinary progress to more than one path, but one-time achievements have stable IDs and cannot be consumed twice for major transformations.

### Requirement quality

The quest generator uses bounded templates with measurable completion rules. It must avoid impossible combinations, ownership-dependent dead ends, paywalled requirements, pure random waits, and requirements that force a transfer or sale.

The UI always states why the card can grow and what remains. Readiness is expressed as concrete requirements, not an opaque progress percentage.

## 4. Evolution effects

Each gameplay path maps to controlled visual and mechanical deltas:

- Bond affects expression range, trust behaviors, companion gestures, and supportive abilities.
- Battle mastery affects posture, muscle definition, scars or honors, combat effects, and tactical abilities.
- Exploration affects aura, environmental markings, locomotion traits, and elemental affinities.
- Legacy affects family crests, inherited techniques, protective behaviors, and descendant-linked details.
- Community affects ceremonial accents and social titles without providing pay-to-win stat advantages.
- Character quests unlock signature features unique to the card's deterministic history.

Stat growth follows bounded curves and role budgets. Ascension expands strategic identity without creating an unbeatable old card. Matchmaking and encounter scaling use current power rating, not Ascension label alone.

The card keeps its recognizable face, signature markings, temperament, and gesture across every Ascension. Growth may change body proportions, maturity, stance, appendages, aura, equipment, and detail density, but the character must remain identifiable as the same companion.

## 5. Heartbound Heroic Companion visual system

The approved art direction is **Heartbound Heroic Companion**:

- large, highly expressive eyes and a warm, readable face;
- a full movement-ready body with visible neck and shoulder connection;
- articulated elbows, knees, paws or feet, and weight-bearing posture;
- expressive ears, tail, wings, crest, or other family-specific appendages;
- an athletic companion silhouette that supports running, crouching, hugging, recoiling, celebrating, and battling;
- increasingly legendary detail without covering or replacing the face players bonded with.

The renderer is layered so the torso never covers the head. Back appendages and tail render first, then rear body and limbs, torso, neck transition, head and face, foreground appendages, expression, aura, and effects.

### Visual genome

The sealed genome separates independently inheritable traits:

- skeleton and locomotion;
- body proportions and surface type;
- head and face proportions;
- eyes, pupils, brows, mouth, blush, and expressions;
- ears, horns, crest, wings, arms, legs, paws, tail, and accessory slots;
- primary, secondary, accent, glow, and pattern palettes;
- markings, material, aura, foil, and particle behavior;
- idle cadence, gesture, temperament, and battle stance;
- signature abilities and elemental affinities.

Creature families vary meaningfully within this grammar. They must not all reuse the same body with different colors.

### Animation contract

Every current card state supports deterministic animation profiles for breathing, blinking, gaze, idle gesture, walking, running, battle readiness, ability use, damage, defeat, bonding, celebration, and transformation. Animation timing derives from the sealed genome so an individual remains behaviorally recognizable across devices.

Reduced-motion mode uses strong poses and short opacity or lighting changes without losing state information.

### Render consistency

The world encounter, battle stage, inventory card, downloadable PNG, vault image, and standalone public page use the same genome and renderer contract. Different surfaces may change camera, pose, resolution, and effects, but cannot silently depict different anatomy or colors.

## 6. Fusion and offspring

Any two distinct, currently owned, verified cards may become parents regardless of catalog stage or Ascension rank, subject to eligibility rules. Parent sex or gender is not a mechanical restriction.

Eligibility requires:

- valid complete proof chains for both parents;
- current ownership by the acting user or an explicitly accepted cross-owner breeding agreement in a later release;
- sufficient parent bond and any rank-specific character requirements;
- one earned Fusion Spark;
- neither parent inside its production recovery period;
- a unique idempotency key for the creation event.

The first implementation supports same-owner parent pairs. Cross-owner agreements are outside this implementation slice and must not be simulated by temporarily transferring ownership.

### Deterministic child genome

The child seed commits to both complete current parent revision digests, the selected inheritance emphasis, creation Kai Pulse, Spark ID, creation timestamp, and deterministic mutation nonce.

Trait groups are inherited independently. The system must visibly use both parents rather than selecting one parent as the entire render template. A child may receive one parent's skeleton, the other parent's face or tail, blended palette channels, combined markings, temperament weights from both, and a bounded mutation tied to its Kai Pulse.

Every child proof includes a trait provenance map identifying parent A, parent B, blended, or mutation as the source of each group. Mutation rates and outputs are deterministic and bounded so every child remains renderable, balanced, and visually coherent.

The child receives a new stable `assetId`, revision zero, its own birth genome, and references to both parents' asset IDs and current digests. It enters inventory immediately after successful sealing, can become the active deck leader, and independently battles, grows, Ascends, trades, downloads, and produces descendants.

### Parent history

Creating a child appends a parenthood event to each parent's history. The parents are not consumed, replaced, or mechanically locked beyond the defined recovery period.

Parenthood and descendant milestones may satisfy future Legacy requirements. A parent's current art may gain a deterministic family crest, expression, title, or ability only through a separately valid growth revision; child creation does not silently mutate unrelated card fields.

Replaying identical inputs returns the same child and parenthood event. It cannot consume another Spark or create duplicate descendants.

## 7. Player experience

### Growth dashboard

Every inventory card exposes a compact growth view with:

- current stage or Ascension rank;
- current bond and power rating;
- six growth-path summaries;
- exact next requirements;
- eligible completed achievements;
- active character quest;
- catalyst status and recovery time;
- recent proof-history events.

The dashboard prioritizes the next meaningful action and avoids stacking large vertical panels on mobile. Secondary detail remains collapsible.

### Live transformation

Completing the final requirement triggers a premium sequence:

1. Gameplay pauses safely and identifies the accomplishment that caused growth.
2. The current living card appears with its accumulated history motifs.
3. Anatomy, posture, markings, aura, and effects transform while the recognizable face remains visible.
4. New abilities, title, rank, and meaningful trait changes are revealed.
5. A proof-seal moment commits the new revision.
6. The player returns to play with the evolved current card already selected.

The sequence is resumable. If the app closes after the server admits the revision, reopening shows the already-sealed result rather than attempting another evolution.

### Child creation ceremony

The player selects two eligible inventory cards, previews trait tendencies without revealing the exact deterministic child, and confirms Spark use. The ceremony shows both parents, their compatible traits, the Kai Pulse convergence, and the child reveal. It then seals the child and parenthood events atomically.

The child can be selected, downloaded, displayed, listed, traded, or sent immediately after admission.

### History and lineage

The card page and inventory expose:

- a visual revision timeline;
- the reason and achievement behind each change;
- parents, partners, children, and descendants;
- trait provenance for fusion children;
- proof verification for every revision;
- current ownership-safe public metadata.

Public pages omit private account data and show only explicitly public achievement information.

## 8. Portable PNG and vault compatibility

Downloading a living card produces one PNG containing the current artwork and the complete compressed proof chain required for offline verification. The visible card shows current rank, current stats, visual fingerprint, proof status, and a tasteful scan-safe QR for its local standalone page route.

Import performs these steps atomically:

1. Validate PNG structure and proof chunk integrity.
2. Parse and validate the supported living-card schema.
3. Verify the complete revision chain from birth through current.
4. Recompute every deterministic genome and revision delta.
5. Recompute the current artwork digest.
6. Check duplicate identity and reconcile current ownership.
7. Add or update the inventory projection without creating a second card.

An imported newer revision updates the same local `assetId`. An older but valid revision remains verifiable history but cannot roll back a newer local or authoritative state. Divergent chains for the same identity are quarantined and clearly reported.

Vault PNGs contain complete living-card proofs for all included assets. Vault restore applies the same per-card chain and ownership rules and reports partial failures without discarding valid cards.

Legacy v1 cards remain verifiable under the existing verifier. A deliberate one-time admission operation upgrades an eligible owned v1 card into the living schema by creating revision zero that commits to the legacy digest. Unsupported or invalid historical cards are not silently rewritten.

## 9. System boundaries

### Progress engine

Consumes authoritative gameplay events and card state. Produces deterministic progress updates, quest state, readiness explanations, and candidate transformation inputs. It does not render artwork or write proof history directly.

### Living proof chain

Validates and appends revisions, enforces stable identity and idempotency, and exposes the verified current projection. It depends on canonical hashing and supported generator versions, not UI state.

### Genome engine

Derives birth genomes, fusion inheritance, bounded mutations, and evolution deltas. Given identical sealed inputs and version, it always returns identical output.

### Heartbound renderer

Consumes a verified current genome plus a named pose or animation state. It produces consistent interactive and export representations. It does not decide progression or ownership.

### Lineage service

Indexes parenthood events and verified child assets for fast family-tree projections. The proof chain remains authoritative if an index must be rebuilt.

### Ownership ledger

Authorizes play, reproduction, listing, transfer, and current-state admission. It atomically coordinates Spark consumption, child admission, parent events, and transfers.

## 10. Persistence and concurrency

- Client storage is a cache of verified projections, gameplay progress awaiting admission, and presentation preferences.
- Server admission assigns authoritative ordering to progress events and proof revisions.
- Every evolution uses a key derived from asset ID, prior revision digest, qualifying inputs, and catalyst ID.
- Every child creation uses a key derived from ordered parent current digests, Spark ID, Kai Pulse, and creation request ID.
- Concurrent evolution attempts from the same prior revision admit at most one result.
- Concurrent reproduction attempts cannot overspend a Spark or bypass a parent recovery period.
- A listing pins the current card revision offered for sale. If the card evolves before purchase, the listing pauses for owner confirmation rather than silently selling materially changed art or stats.
- Transfer carries all admitted revisions and lineage commitments. Pending local progress that was not admitted does not follow the transfer and cannot be admitted by the former owner afterward.

## 11. Error and recovery behavior

- Invalid or incomplete proof chains are view-only and cannot battle competitively, evolve, reproduce, list, or transfer.
- Unknown generator or renderer versions remain inspectable but cannot produce new dependent revisions until supported.
- Impossible generated quests are detected by template validation and deterministically replaced before presentation.
- Failed transformation admission leaves the prior revision current and preserves the catalyst.
- Failed child admission preserves both parents and the Spark.
- A successfully admitted child with an interrupted reveal appears in inventory on restart and the reveal may replay without reminting.
- Upload reports unsupported schema, missing proof, tampering, invalid chain, divergent history, duplicate current state, ownership mismatch, or unsupported generator distinctly.
- Offline gameplay may accumulate provisional non-competitive progress. Evolution, reproduction, transfer, and exchange admission require authoritative reconciliation.
- A rejected provisional event is explained and removed without corrupting admitted history.

## 12. Balance, fairness, and safety

- Catalysts and Fusion Sparks are earned through play and achievement systems in this scope. Direct purchase cannot be the only way to obtain them.
- Ascension grants horizontal options and bounded power growth. Competitive scaling and matchmaking use verified current power rating.
- Producing many children is limited by earned Sparks, parent bond requirements, unique accomplishments, recovery periods, and idempotent admission.
- Parents may have multiple children across their lifetime. There is no fixed descendant ceiling.
- Random-looking mutations are deterministic from the sealed creation basis and cannot be rerolled by canceling or refreshing.
- Public lineage does not expose player email, private identity, exact private activity timestamps, or private location history.

## 13. Accessibility and performance

- Growth requirements, readiness, transformation results, and lineage are available as text and not conveyed by animation or color alone.
- All actions are keyboard and screen-reader accessible with at least 44 CSS pixel primary touch targets.
- Motion honors `prefers-reduced-motion` and never blocks proof sealing.
- The renderer uses bounded procedural parts, shared geometry, instanced effects, and level-of-detail rules.
- Revision history loads summaries first and expands artwork or proof detail on demand.
- PNG proof compression has explicit size limits and fails safely before producing an unverifiable file.
- Mobile gameplay keeps the world as the dominant surface; growth panels and lineage details collapse when not in use.

## 14. Verification contract

### Unit and property tests

- Stable asset identity across stage evolution and unlimited Ascensions.
- Strictly ordered append-only revision chains and tamper rejection.
- Deterministic readiness, quest generation, catalyst consumption, and genome deltas.
- No repeated qualifying achievement consumption.
- Rank formulas across high Ascension values without overflow or invalid stats.
- Deterministic fusion from any stage or Ascension pair.
- Visible trait contribution and provenance from both parents.
- Parent preservation, parenthood events, Spark consumption, recovery, and duplicate prevention.
- Deterministic Heartbound anatomy, layer order, palettes, expressions, and animation profiles.
- Listing revision pinning and safe pause after evolution.

### Integration tests

- Capture creates revision zero and the card grows through stages 1–3 under one asset ID.
- A stage-3 card completes an earned quest and appends Ascension I.
- Repeated valid Ascensions append without a fixed ceiling in representative high-rank tests.
- Two owned cards create a child; parents remain selectable and the child is immediately selectable.
- A child grows, Ascends, and later becomes a parent.
- Evolution and child creation survive interrupted reveals without duplicate revisions or assets.
- Transfer moves the complete history and prevents the former owner from admitting stale progress.
- Current PNG download, deletion, offline re-import, verification, and active-deck selection round-trip.
- Vault export and restore preserve current revisions and lineage for multiple cards.
- Legacy v1 admission commits to the original digest without altering it.

### Visual and interaction tests

- The approved A face remains recognizable from birth through advanced Ascensions.
- The Heroic Companion torso never covers the head at supported sizes and poses.
- Limbs articulate convincingly for idle, walk, run, battle, damage, celebration, and bonding states.
- Distinct families produce meaningfully different bodies rather than palette swaps.
- A fusion child visibly contains traits from both parents.
- Game, battle, card, PNG, vault, and public-page renders agree on anatomy and color.
- Growth readiness is clear on 320, 390, and 430 pixel mobile widths without shrinking the world unnecessarily.
- Reduced-motion transformation and child reveal communicate every outcome.

### Release checks

- Full test suite, typecheck, production build, and browser-console review.
- Deterministic golden fixtures for birth, evolution, high-rank Ascension, and fusion genomes.
- Offline verification against exported card and vault PNGs.
- End-to-end playthrough from progress earning to live evolution, download, import, child creation, child growth, listing, and transfer.
- Performance profiling with multiple animated living cards and a long revision history.

## 15. Delivery boundary

This implementation slice includes the living-card schema, one-time legacy admission, progress paths, character quests, stages 1–3 under stable identity, unlimited Ascensions, same-owner fusion, parent history, child independence, the Heartbound Heroic Companion procedural renderer, consistent PNG/vault/public rendering, and end-to-end verification.

It does not include cross-owner reproduction agreements, real-time cooperative battles, voice audio production, manually illustrated art for every possible genome, or blockchain storage. Those can build on the same proof, genome, and lineage contracts later without changing the stable identity model.
