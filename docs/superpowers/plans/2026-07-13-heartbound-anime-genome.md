# Heartbound Anime Genome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Ship a proof-deterministic Heartbound v3 character system that blends authored anatomy templates, species archetypes, and a Kai-pulse anime genome so every new companion is structurally unique, begins cuddly, and matures into a majestic but still lovable form.

**Architecture:** Preserve historical generator/renderer v1 and v2 verification. New births and fusion children seal a v3 presentation genome derived from the existing proof-facing living genome. A compatibility resolver selects an authored template and archetype, applies bounded facial/body genes, records deterministic corrections, and exposes one canonical visual signature. The shared SVG renderer consumes that projection for inventory, card, battle, capture, standalone, PNG, and vault surfaces.

**Tech Stack:** TypeScript 5.6, React 19, Next.js 15, deterministic SVG, Node test runner, Receiz sorted-json SHA-256 proof objects.

## Global Constraints

- Keep existing v1/v2 living cards verifiable and reconstructable.
- New v3 cards must reproduce identical projection, SVG, and digest from identical sealed inputs.
- Neutral expressions must remain friendly; no hollow eyes, severe inward brows, snarls, gore, or face-obscuring detail.
- Every v3 individual must differ structurally, not only by palette.
- Evolution retains face anchors and lineage; fusion children visibly inherit both parents and remain independent assets.
- The card viewer, downloaded PNG, standalone page, battle, capture, and inventory must call the same renderer.
- All file edits use `apply_patch`; preserve unrelated worktree changes.

---

## Task 1: Define the versioned v3 presentation contract

**Files:**

- Create: `src/features/play/heartbound-anime-types.ts`
- Modify: `src/features/play/living-card-types.ts`
- Test: `tests/heartbound-anime-genome.test.ts`

- [ ] Write a failing contract test that imports the new types/projector and expects a v3 projection with an authored template, species archetype, maturity band, face/body/appendage/motion genes, corrections, retained identity anchors, and a SHA-256 signature.

```ts
const presentation = deriveHeartboundPresentation({ genome, stage: 1, ascensionRank: 0 });
assert.equal(presentation.version, 3);
assert.equal(presentation.maturity, "baby");
assert.match(presentation.signature, /^sha256:[a-f0-9]{64}$/);
assert.ok(presentation.identityAnchors.face.length > 10);
```

- [ ] Run `pnpm test`; verify the new test fails because the v3 module does not exist.
- [ ] Add the exact domain types:

```ts
export type HeartboundSpeciesArchetype = "plush-cub" | "long-ear" | "dragon" | "bird" | "aquatic" | "spirit" | "serpent" | "guardian" | "hybrid";
export type HeartboundMaturityBand = "baby" | "adolescent" | "heroic" | "legendary";
export type HeartboundTemplateId = "plush-quadruped" | "upright-companion" | "long-ear-companion" | "small-dragon" | "great-dragon" | "aerial-bird" | "aquatic-friend" | "floating-spirit" | "serpentine-friend" | "guardian-beast" | "compatible-hybrid";
export type HeartboundCompatibilityCorrection = { trait: string; requested: string; resolved: string; reason: string };
export type HeartboundPresentationV3 = { /* all sealed presentation fields listed above */ };
```

- [ ] Extend `LivingCardGenome.generatorVersion` and `LivingCardRevision.rendererVersion` to `1 | 2 | 3`, and add optional `presentation?: HeartboundPresentationV3` without altering existing required fields.
- [ ] Run `pnpm test`; verify the contract compiles while the projector test remains red.
- [ ] Commit: `git add src/features/play/heartbound-anime-types.ts src/features/play/living-card-types.ts tests/heartbound-anime-genome.test.ts && git commit -m "feat: define Heartbound v3 presentation contract"`

## Task 2: Add authored archetypes, templates, and compatibility rules

**Files:**

- Create: `src/features/play/heartbound-archetypes.ts`
- Create: `src/features/play/heartbound-templates.ts`
- Modify: `tests/heartbound-anime-genome.test.ts`

- [ ] Add failing table tests that require all nine archetypes, all eleven templates, all four maturity bands, locomotion compatibility, attachment anchors, body bounds, and neutral-expression safety.
- [ ] Run `pnpm test`; verify missing registry exports fail.
- [ ] Implement immutable archetype definitions with surface grammar, compatible locomotion, required silhouette traits, signature gestures, and forbidden feature combinations.
- [ ] Implement authored template definitions with head/body ratios, eye planes, neck clearance, limb anchors, appendage anchors, framing bounds, and per-maturity proportion presets.
- [ ] Implement `compatibleTemplates(archetype, locomotion)` and `resolveTemplate(...)`; return a deterministic `HeartboundCompatibilityCorrection` whenever the requested anatomy is adjusted.
- [ ] Run `pnpm test`; verify every registry and compatibility test passes.
- [ ] Commit: `git add src/features/play/heartbound-archetypes.ts src/features/play/heartbound-templates.ts tests/heartbound-anime-genome.test.ts && git commit -m "feat: add Heartbound authored anatomy library"`

## Task 3: Project the deterministic Kai anime genome

**Files:**

- Create: `src/features/play/heartbound-anime-genome.ts`
- Modify: `src/features/play/heartbound-genome.ts`
- Modify: `tests/heartbound-anime-genome.test.ts`
- Modify: `tests/heartbound-genome.test.ts`

- [ ] Add failing tests for deterministic output, proof sensitivity, structural difference across face/body/appendage/motion, lovability bounds, and 10,000 collision-free visual signatures.
- [ ] Add failing tests mapping stage 1 to baby, stage 2 to adolescent, stage 3 to heroic, and ascension rank 1+ to legendary.
- [ ] Run `pnpm test`; verify the projector tests fail.
- [ ] Implement:

```ts
export function deriveHeartboundPresentation(input: {
  genome: LivingCardGenome;
  stage: CreatureStage;
  ascensionRank: number;
  proofDigest?: string;
}): HeartboundPresentationV3;

export function validateHeartboundPresentation(value: HeartboundPresentationV3): { ok: boolean; errors: string[] };
export function heartboundVisualIdentitySignature(value: HeartboundPresentationV3): string;
```

- [ ] Derive all choices only from the proof/genome digest, family anchors, stage, rank, and lineage-stable identity token. Use independent digest lanes for archetype, template, eye, face, body, appendage, marking, pose, motion, and correction selection.
- [ ] Enforce at least two coherent catchlights, friendly brow/mouth combinations, face clearance, bounded asymmetry, full-body bounds, and species compatibility. Do not include hostile neutral states in the selectable grammar.
- [ ] Make `deriveBirthGenome` default to generator v3, seal its presentation, keep explicit v1/v2 options, validate all three versions, and regenerate only maturity/detail fields during ascension while retaining the face identity anchor.
- [ ] Run `pnpm test`; verify 10,000 presentations are deterministic and collision-free and legacy genome tests pass with updated v3 expectations.
- [ ] Commit: `git add src/features/play/heartbound-anime-genome.ts src/features/play/heartbound-genome.ts tests/heartbound-anime-genome.test.ts tests/heartbound-genome.test.ts && git commit -m "feat: derive deterministic Heartbound anime genomes"`

## Task 4: Render lovable authored anatomy

**Files:**

- Create: `src/features/play/heartbound-anime-shapes.ts`
- Modify: `src/features/play/heartbound-renderer.ts`
- Modify: `tests/heartbound-renderer.test.ts`

- [ ] Add failing renderer tests for v3 metadata, complete layer order, visible eye catchlights, friendly neutral mouth, unobscured face, connected neck/body, feet within viewBox, different template silhouettes, and maturity-dependent anatomy.
- [ ] Run `pnpm test`; verify v3 renderer assertions fail.
- [ ] Implement authored SVG primitives for all template families. Compose rear aura/wings/tail, hind limbs, torso, forelimbs, neck, ears, head, markings, eyes, mouth, crest, and restrained foreground aura in stable order.
- [ ] Render large irises with two catchlights, softened brows, blush/cheek warmth, small friendly mouths, rounded early-form paws, and species-appropriate nose/beak/muzzle features.
- [ ] Apply maturity transforms: babies use larger heads/eyes and compact bodies; adolescent forms articulate; heroic forms gain stature; legendary forms add earned adornment and aura without covering the face.
- [ ] Keep v1/v2 render paths intact and route only sealed v3 presentations through the new shapes.
- [ ] Change the v3 digest namespace to `heartbound.v3` and emit `data-presentation-signature`, `data-template`, `data-archetype`, and `data-maturity` for visual verification.
- [ ] Run `pnpm test`; verify all renderer tests pass.
- [ ] Commit: `git add src/features/play/heartbound-anime-shapes.ts src/features/play/heartbound-renderer.ts tests/heartbound-renderer.test.ts && git commit -m "feat: render lovable Heartbound anime companions"`

## Task 5: Preserve proof compatibility and earned evolution

**Files:**

- Modify: `src/features/play/living-card-proof.ts`
- Modify: `src/features/play/living-card-dossier.ts`
- Modify: `tests/living-card-proof.test.ts`
- Modify: `tests/living-card-dossier.test.ts`

- [ ] Add failing tests that admit new cards as renderer v3, keep explicitly admitted v1/v2 cards valid, reject mismatched v3 presentations, and expose template/archetype/maturity/corrections in the dossier.
- [ ] Run `pnpm test`; verify version and dossier assertions fail.
- [ ] Make `rendererVersionForGenome` return the sealed generator version. Keep historical digest bases stable for v1/v2; use a distinct v3 digest basis including presentation signature.
- [ ] Validate the sealed v3 presentation during birth admission, revision append, and offline verification. Never recompute and overwrite a historical presentation silently.
- [ ] Extend dossier DNA/story output with archetype, maturity, authored template, inherited anchors, and deterministic corrections so standalone card backs explain the living visual history.
- [ ] Run `pnpm test`; verify old and new proof chains pass.
- [ ] Commit: `git add src/features/play/living-card-proof.ts src/features/play/living-card-dossier.ts tests/living-card-proof.test.ts tests/living-card-dossier.test.ts && git commit -m "feat: seal Heartbound v3 living art history"`

## Task 6: Make fusion children visibly inherit both parents

**Files:**

- Modify: `src/features/play/heartbound-anime-genome.ts`
- Modify: `src/features/play/heartbound-genome.ts`
- Modify: `src/features/play/living-lineage.ts`
- Modify: `tests/heartbound-genome.test.ts`
- Modify: `tests/living-lineage.test.ts`

- [ ] Add failing tests that a child receives a compatible hybrid template, a new individual token, face traits from one parent, body/appendage traits from the other, blended markings/palette, and explicit provenance while both parents remain unchanged.
- [ ] Run `pnpm test`; verify fusion presentation assertions fail.
- [ ] Add a `deriveFusionPresentation` path that resolves parent archetypes through the authored hybrid compatibility table, inherits bounded trait groups, applies one proof-derived mutation lane, and seals a new signature.
- [ ] Update fusion genome construction to generator v3 and ensure `mergeLivingGenome` deep-merges presentation data safely across revisions.
- [ ] Keep parent cards reusable and unchanged; only append existing child-history events after a successful seal.
- [ ] Run `pnpm test`; verify living lineage and fusion tests pass.
- [ ] Commit: `git add src/features/play/heartbound-anime-genome.ts src/features/play/heartbound-genome.ts src/features/play/living-lineage.ts tests/heartbound-genome.test.ts tests/living-lineage.test.ts && git commit -m "feat: give fusion children authored inherited anatomy"`

## Task 7: Verify every card surface uses the same identity

**Files:**

- Modify: `src/features/play/WildsCard.tsx`
- Modify: `src/features/play/card-export.ts`
- Modify: `tests/card-export.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`

- [ ] Add failing cross-surface tests comparing the presentation signature, template, archetype, maturity, core colors, and face geometry between interactive card SVG and exported portable PNG SVG source.
- [ ] Run `pnpm test`; verify cross-surface metadata assertions fail.
- [ ] Pass stage and ascension context through the shared renderer only where the sealed presentation is absent; otherwise render the sealed v3 projection directly.
- [ ] Keep surface differences limited to framing and output dimensions. Preserve the current full-body inventory fit and rounded-card clipping fixes.
- [ ] Ensure exported card/vault proof imagery includes the same v3 artwork and offline proof payload without introducing a second art generator.
- [ ] Run `pnpm test`; verify card export and render contract tests pass.
- [ ] Commit: `git add src/features/play/WildsCard.tsx src/features/play/card-export.ts tests/card-export.test.ts tests/wilds-render-contract.test.ts && git commit -m "fix: keep Heartbound identity stable across surfaces"`

## Task 8: Full verification and visual release gate

**Files:**

- Modify only files needed for defects found during verification.

- [ ] Run `pnpm test` and require all tests, including the 10,000-genome uniqueness gate, to pass.
- [ ] Run `pnpm typecheck` and `pnpm lint`.
- [ ] Run `pnpm build` and confirm the production bundle succeeds.
- [ ] Start the app with `pnpm dev` and inspect mobile and desktop inventory, capture, battle, standalone front/back, and exported-card preview using the project browser workflow.
- [ ] Capture representative baby, adolescent, heroic, legendary, and fusion-child screenshots. Reject clipped bodies, covered heads, hostile neutral faces, same-model recolors, malformed attachments, foil corner artifacts, or cross-surface drift.
- [ ] If defects are found, add the smallest regression test first, patch the relevant authored primitive/resolver, and rerun the complete gate.
- [ ] Review the diff for proof compatibility, deterministic inputs, placeholders, unsafe HTML additions, and unrelated changes.
- [ ] Commit final verified fixes: `git add <verified-files> && git commit -m "test: verify Heartbound anime genome release"`.

## Completion Criteria

- New cards seal generator/renderer v3; historical v1/v2 cards still verify.
- Every proof deterministically produces a structurally distinct, lovable character.
- Nine archetypes and eleven authored templates cover baby through legendary forms.
- Evolution visibly matures the same companion and records its earned history.
- Fusion creates a new independent child visibly derived from both unchanged parents.
- Inventory, battle, capture, standalone, PNG, and vault surfaces show the same identity.
- Tests, typecheck, lint, production build, and browser visual QA all pass.
