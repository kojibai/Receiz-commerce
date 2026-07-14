# Heartbound Anime Genome Design

## Outcome

Upgrade Receiz Wilds character generation by blending three complementary systems:

1. authored templates for polished anatomy and composition;
2. species archetypes for broad structural diversity;
3. a proof-derived deterministic anime genome for one-of-one individual identity.

Characters begin as cuddly baby companions and mature through earned play into majestic, powerful forms that remain adorable, emotionally readable, and collectible. This extends `2026-07-13-heartbound-character-identity-design.md`; its proof, portability, lineage, and cross-surface consistency rules remain authoritative.

The style is an original Receiz universe. It may pursue the emotional clarity and evolutionary appeal of successful creature-collection games, but it must not reproduce another property's characters, silhouettes, names, symbols, card trade dress, or distinctive anatomy.

## 1. Three-layer character system

### Authored template layer

Each locomotion and body family owns professionally composed parameterized templates. Templates define safe anatomy, attachment anchors, face planes, joint placement, full-body framing, and layer order. They are not finished characters; they are quality-controlled construction systems.

Initial template families cover plush quadrupeds, upright companions, rabbits and long-eared beings, small and large dragons, birds, aquatic beings, floating spirits, serpentine beings, guardians, and compatible hybrids. Every family includes baby, adolescent, heroic, and legendary maturity presentations.

### Species archetype layer

Archetypes define recognizable biological and behavioral identities across templates:

- cub, rabbit, dragon, bird, aquatic, spirit, serpent, guardian, and hybrid silhouette rules;
- fur, feather, scale, shell, energy, fin, wing, paw, claw, ear, horn, crest, and tail grammars;
- compatible locomotion, posture, center of gravity, and animation families;
- temperament ranges and signature gestures;
- species-specific feature exclusions that prevent incoherent combinations.

An archetype may share a template family with another archetype, but it must change the silhouette, appendage grammar, surface treatment, and motion personality rather than only its color.

### Deterministic anime genome layer

The Kai Pulse and sealed proof deterministically choose and parameterize compatible template and archetype traits. The genome independently controls:

- head silhouette, forehead, cheek, muzzle, jaw, and chin proportions;
- eye outline, iris scale, pupil form, spacing, tilt, lashes, brows, and multi-catchlight pattern;
- nose, beak, mouth, blush, smile, tiny fang, and expression bias;
- torso build, head-to-body ratio, limb length, paw scale, posture, and pose;
- ears, horns, crests, fins, wings, tails, tufts, and accessories;
- surface material, markings, palette relationships, glow, aura, and particles;
- idle cadence, blink rhythm, gaze, signature gesture, battle stance, and celebration.

The same sealed inputs always reproduce the same visual identity. Different proofs must change structural identity, not merely color.

## 2. Lovability art direction

Neutral collectible portraits must feel safe, warm, curious, brave, playful, tender, or mischievous. The renderer enforces:

- large readable irises with two or more coherent catchlights;
- visible sclera or iris contrast appropriate to the archetype;
- softened brow angles and cheeks that support emotional readability;
- small friendly mouths placed safely below the eyes;
- rounded paws, feet, cheeks, ear tips, and body transitions for early forms;
- a clear neck or face-to-body connection with no torso overlap;
- full visibility of eyes, face, feet, and signature appendages;
- facial contrast that survives inventory-thumbnail scale.

The neutral renderer rejects hollow eyes, default scowls, severe inward brows, excessive exposed teeth, gore, predatory snarls, face-obscuring armor, sharp clutter around the eyes, broken anatomy, or uncanny asymmetry. Battle expressions may become focused or intense, but returning to neutral restores the companion's warm identity.

## 3. Evolution and maturity curve

Evolution is a continuous maturation of one recognizable companion.

### Baby forms

Baby forms emphasize oversized heads and eyes, compact plush bodies, short limbs, rounded paws, simple markings, gentle motion, curiosity, and playful gestures.

### Adolescent forms

Middle forms become more capable and confident. Limbs articulate, silhouettes gain species-specific distinction, expressions widen, markings become more intentional, and abilities add controlled visual motifs.

### Heroic forms

Advanced forms gain stronger posture, larger wings or appendages, refined anatomy, protective features, richer materials, and decisive battle poses. Their face anchor, eye character, signature markings, and emotional warmth remain recognizable.

### Legendary and unlimited Ascension forms

Ascension may add majestic scale, armor-like natural structures, ceremonial accessories, aura, particles, history motifs, and dramatic ability states. Detail density is budgeted so the face and silhouette remain readable. Power comes from stature, pose, and earned history—not permanent anger or visual noise.

Every visual revision declares its maturity band, retained identity anchors, changed traits, and proof-backed reason. Evolution cannot replace the character with an unrelated design.

## 4. Uniqueness and family resemblance

Each individual receives a canonical visual identity signature that includes template family, archetype, face geometry, eye system, body build, appendage set, marking topology, palette relationship, pose family, and motion personality.

Distinct proofs must differ in at least:

- one face or eye dimension;
- one body or silhouette dimension;
- one marking, appendage, or accessory dimension;
- one pose or animation-personality dimension.

Family anchors preserve recognizable ancestry through locomotion, broad face lineage, elemental motif, and one signature anatomical trait. Same-family characters remain visibly different individuals. Exact signature collisions deterministically advance to the next compatible genome choice rather than falling back to a generic model.

## 5. Fusion children

Children use authored hybrid compatibility tables, inherit archetype and genome trait groups from both parents, and receive a new independent Kai Pulse. Skeleton, face, appendages, markings, palette, temperament, and motion retain sealed provenance as parent A, parent B, blend, or bounded mutation.

The child must visibly resemble both parents without becoming a pasted collage. Incompatible anatomy resolves through an authored hybrid template. Parents remain unchanged and reusable under existing cooldown and achievement rules.

## 6. Renderer architecture

The existing `BirthGenome` and living genome remain the proof-facing sources. The implementation adds a versioned presentation projection containing:

- template selection;
- species archetype;
- maturity band;
- anime face and eye parameters;
- body and appendage parameters;
- marking, material, palette, pose, and motion parameters;
- compatibility corrections and their deterministic reasons;
- canonical visual identity signature.

`heartbound-renderer.ts` consumes this projection through bounded authored primitives. The same projection drives card SVG, inventory, battle, capture reveal, standalone page, portable PNG, and vault artwork. Surface-specific framing may change, but identity geometry and colors cannot.

The composition order keeps rear effects and appendages behind the body, then limbs, torso, neck, head, face, foreground appendages, markings, and restrained effects. Nothing may cover the primary eyes or detach the head from the body.

## 7. Compatibility and failure handling

Existing cards remain valid and deterministically derive the new presentation from their stable proof without changing historical digests. New cards seal the new renderer and presentation versions directly. Historical artwork remains reconstructable by renderer version.

If a generated combination violates anatomy, contrast, lovability, framing, or archetype compatibility, the resolver selects the nearest compatible authored variant deterministically. It records the correction in the presentation projection. Rendering must never silently use one generic fallback character.

If art generation or digest verification fails during capture, evolution, fusion, import, or export, the previously admitted card remains authoritative and no one-time catalyst, Spark, or proof event is consumed.

## 8. Testing and release gates

Automated tests cover:

- identical outputs and signatures for identical sealed inputs;
- structural signature changes for changed proof inputs;
- a deterministic sample of at least 10,000 individuals with no exact signature collision;
- every template, archetype, locomotion, maturity band, and compatible hybrid path;
- face, eye, mouth, joint, attachment, contrast, and full-body framing bounds;
- prohibition of hostile neutral-expression combinations;
- stable identity anchors through evolution and Ascension;
- visible trait provenance from both parents for fusion children;
- identical identity geometry and colors across every render surface;
- deterministic reduced-motion presentation;
- successful offline PNG and vault round trips.

Visual QA samples baby, adolescent, heroic, and legendary forms across desktop and mobile inventory, capture, battle, transformation, standalone, downloaded PNG, and vault surfaces. Release fails for clipped bodies, covered faces, hostile neutral expressions, malformed anatomy, same-model recolors, corner artifacts, or cross-surface identity drift.

## Success criteria

- Players can identify individuals by face and silhouette without reading names.
- Early characters feel cuddly enough to invite immediate attachment.
- Advanced characters feel powerful and majestic without losing warmth or collectibility.
- Species are structurally different, not recolored copies.
- Every individual and child is deterministic, unique, portable, and offline reconstructable.
- Evolution visibly grows the same beloved companion through earned history.
