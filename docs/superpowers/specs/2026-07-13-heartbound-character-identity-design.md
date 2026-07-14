# Heartbound Advanced Character Identity Design

## Outcome

Make every Receiz Wilds creature feel like a premium, emotionally expressive anime companion with an unmistakable face, silhouette, body, movement style, and personality. Two cards from the same family may share recognizable ancestry, but they must never appear to be a single model with different colors.

The result remains deterministic, portable, and offline reconstructable. A card's complete visible identity is derived from its sealed proof and living genome. The world, battle stage, inventory, standalone viewer, downloadable PNG, and vault all render the same character.

This document extends the Heartbound Heroic Companion section of `2026-07-13-living-card-ascension-lineage-design.md`. Existing proof-chain, evolution, fusion, ownership, and portability rules remain authoritative.

## Visual direction

The style is an original Receiz universe of polished heroic anime companions. It combines:

- emotionally readable faces with appealing proportions;
- strong silhouettes readable at inventory-thumbnail size;
- complete, believable bodies capable of expressive movement;
- high-end shape layering, markings, lighting, and aura detail;
- recognizable family resemblance without duplicated individuals;
- escalating visual sophistication through earned evolution.

It must not copy another property's characters, silhouettes, symbols, names, card borders, or trade dress. The quality target is premium animation character design, not imitation.

## 1. Constrained identity genome

The next genome version adds independently deterministic identity dimensions while preserving the current stable `identityAnchor`:

- head silhouette: round, tapered, broad, heart-shaped, long, or crested;
- face plane: cheek fullness, forehead height, muzzle depth, jaw taper, and chin height;
- eyes: shape, size, spacing, vertical position, tilt, pupil form, highlight pattern, lash or brow style, and controlled asymmetry;
- mouth and nose: smile, muzzle, beak, fang, nose form, width, and expression bias;
- body build: compact, plush, athletic, long, guardian, armored, winged, or serpentine;
- proportions: head, neck, shoulder, torso, hip, limb, paw, and tail scales;
- locomotion: biped, quadruped, flying, gliding, hovering, or serpentine;
- appendages: multiple coherent ear, horn, crest, wing, arm, leg, paw, and tail morphologies;
- surface: fur, feather, scale, shell, energy, tuft placement, material response, and pattern topology;
- markings: forehead, cheek, eye, chest, limb, tail, and asymmetric signature marks;
- behavior: posture, center of gravity, idle cadence, blink rhythm, gaze response, signature gesture, battle stance, and celebration style;
- aura: element, particle shape, flow direction, intensity, rhythm, and earned history motifs.

Every dimension uses bounded ranges and compatible templates. Random numeric path distortion is forbidden when it could damage anatomy or facial appeal.

## 2. Coherent silhouette construction

The renderer composes a character from authored, parameterized shape families rather than one universal body. Each locomotion class owns a coherent skeleton and slot layout. Body-build templates then control torso mass, shoulder and hip position, limb reach, paw contact, and head attachment.

The composition order is fixed:

1. rear aura and particles;
2. rear wings, tail, ears, or horns;
3. hind limbs and ground contact;
4. torso and surface details;
5. forelimbs and chest transition;
6. neck and head connection;
7. head silhouette and face plane;
8. eyes, brows, nose, mouth, blush, and markings;
9. front crest, effects, and earned ornaments.

No torso, crest, aura, or appendage may obscure the character's primary eyes or cover the head. Full-body framing must keep every weight-bearing foot and meaningful appendage visible on interactive cards.

## 3. Lovability constraints

Deterministic variety is filtered through a strict appeal contract:

- both eyes remain readable and correctly placed for the selected face plane;
- pupils and highlights preserve gaze direction;
- the mouth stays below the eyes and inside the face silhouette;
- head-to-body ratio stays within the approved companion ranges;
- limbs connect to valid joints and reach plausible ground or flight positions;
- appendages attach to permitted anatomical anchors;
- color contrast keeps facial features visible;
- pattern density cannot overwhelm the face;
- controlled asymmetry adds personality without appearing broken;
- expressions remain warm, brave, curious, mischievous, focused, or tender rather than uncanny.

Invalid combinations are resolved deterministically to the nearest compatible template. Rendering never silently substitutes a generic default character.

## 4. Family resemblance and individual uniqueness

Family identity controls a small set of immutable anchors such as locomotion class, signature appendage, elemental motif, and broad face lineage. The proof-derived individual genome controls the remaining proportions, morphology, markings, palette relationships, stance, and behavior.

The renderer exposes a canonical visual identity signature made from silhouette class, face geometry, body build, appendage morphologies, marking topology, palette relationship, and animation personality. Captures with different proof digests must produce different signatures. A large deterministic sample must not contain exact duplicate signatures.

Color alone never satisfies uniqueness. At least one face-geometry dimension, one silhouette or body dimension, one marking or appendage dimension, and one behavior dimension must differ between distinct individuals.

## 5. Living evolution

Evolution preserves the stable face anchor, gaze character, signature mark, core palette relationship, and temperament. Earned growth may mature proportions, add articulation, refine surface materials, strengthen posture, expand expression range, and introduce achievement-specific aura or ornaments.

Ascension does not replace the character with an unrelated model. Every revision declares which visible dimensions changed and why. The renderer must support a visual comparison between any two verified revisions.

History-derived motifs remain subordinate to the face and silhouette. High-rank characters become more sophisticated, not merely brighter or more cluttered.

## 6. Fusion children

Children receive a new independent identity anchor. Their visual genome visibly combines coherent trait groups from both parents:

- skeleton and build may follow one parent or a compatible blend;
- face geometry uses bounded inheritance from both;
- appendage groups select or blend compatible parent morphologies;
- markings can combine topology from one parent with placement from the other;
- palette channels blend in a contrast-safe color space;
- behavior and animation cadence inherit weighted parent traits;
- one bounded mutation creates a visible but coherent individual distinction.

Trait provenance remains sealed. A player viewing a child and its parents should be able to recognize features from both without the child looking like a pasted collage.

## 7. Animation personality

Each individual supports deterministic profiles for idle breathing, blinking, gaze, ear or tail response, walking, running, battle stance, ability action, damage, bonding, celebration, and transformation.

Animation uses the individual's skeleton and center of gravity. Quadrupeds do not reuse biped motion, flying characters maintain wing and body coordination, and serpentine characters use continuous body motion. Timing derives from the genome so the character's behavior remains recognizable across sessions and devices.

Reduced-motion mode retains personality through pose, facial expression, lighting, and short opacity changes.

## 8. Compatibility and migration

Existing living cards remain valid. Genome version 1 is rendered by its current renderer and can deterministically derive a version 2 presentation extension from its stable proof and birth genome. This extension must not alter historical revision digests.

New captures and children seal genome version 2 directly. A renderer version is explicit in every revision so offline verification can reconstruct historical art exactly. Migration creates an append-only presentation revision only when a user earns or explicitly performs the supported upgrade; it never rewrites an existing proof.

## 9. Verification and testing

Automated verification must cover:

- deterministic output for identical proof inputs;
- changed identity signatures for changed proof inputs;
- at least 10,000 generated individuals with no exact duplicate visual signatures;
- visible structural diversity across every family and locomotion class;
- coherent parent-trait provenance for fusion children;
- face, joint, attachment, contrast, and full-body framing bounds;
- stable face anchors across evolution and Ascension;
- deterministic animation profiles and reduced-motion behavior;
- identical current anatomy and colors across game, card, PNG, and standalone surfaces;
- successful offline verification and restoration after download.

Browser checks cover desktop and mobile inventory cards, battle views, transformation ceremonies, child reveals, standalone 3D presentation, and downloaded PNG comparison. The release fails if characters are clipped, facial features overlap, different cards collapse to the same visible design, or a surface depicts a different individual.

## Success criteria

- Players can distinguish collected individuals by face and silhouette without reading their names.
- Same-family cards clearly resemble relatives while remaining visibly unique.
- Every character remains cute, expressive, anatomically coherent, and fully visible.
- Evolution looks like growth of a beloved companion rather than replacement.
- Children visibly inherit both parents and remain independent one-of-one characters.
- The exact artwork and animation identity reconstruct offline from the sealed portable proof.
