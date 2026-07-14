# Living Card Ascension and Lineage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each Receiz Wilds card a stable living asset with append-only earned evolution history, unlimited Ascensions, deterministic full-body Heartbound artwork, and independently living two-parent offspring.

**Architecture:** Introduce a versioned living-card proof model whose stable `assetId` projects the latest verified revision. Separate progress, genome, renderer, lineage, and proof-chain modules, then adapt game state, PNG transport, inventory, public card pages, and exchange admission to consume the verified current projection. Preserve v1 verification and provide deterministic one-time admission into v2.

**Tech Stack:** TypeScript 5.6, React 19, Next.js 15 App Router, Three.js/React Three Fiber, Node test runner, SVG-to-canvas PNG export, custom canonical SHA-256 proof sealing.

## Global Constraints

- The PNG is the only required portable proof file; no JSON sidecar.
- A living card keeps one stable `assetId`; stages and Ascensions append revisions rather than minting replacement card IDs.
- Proof history is append-only and offline-verifiable from birth through current revision.
- Stages 1–3 remain the introductory catalog arc; post-stage-3 Ascension has no product-level maximum.
- Every Ascension requires bond, one unused major achievement, a character quest, an earned catalyst, and an expired recovery period.
- Time alone and repeated button presses cannot advance a card.
- Children are new independent assets; parents remain owned, playable, tradable, and reusable after recovery.
- Fusion must visibly inherit sealed traits from both parents and record per-trait provenance.
- The visual direction is Heartbound Heroic Companion: the approved expressive face plus a full articulated movement-ready body.
- All generated results are deterministic from sealed inputs and supported generator/renderer versions.
- Current ownership remains ledger-authoritative; PNG verification alone does not grant play, reproduction, listing, or transfer authority.
- Existing v1 cards continue to verify and can be deliberately admitted into v2 without altering their original digest.
- The system must remain accessible at 320, 390, and 430 CSS-pixel widths and honor `prefers-reduced-motion`.

---

## File structure

### New focused modules

- `src/features/play/living-card-types.ts` — v2 manifest, revision, growth, genome, provenance, and compatibility types.
- `src/features/play/living-card-proof.ts` — v2 birth, append, verification, current projection, and v1 admission.
- `src/features/play/growth-engine.ts` — progress events, requirement formulas, character quests, readiness, and catalyst rules.
- `src/features/play/heartbound-genome.ts` — birth genomes, Ascension deltas, fusion inheritance, mutation bounds, and provenance.
- `src/features/play/heartbound-renderer.ts` — shared layered full-body render model and deterministic SVG output.
- `src/features/play/living-lineage.ts` — parenthood events, child derivation, parent history append, recovery, and idempotency.
- `src/features/play/WildsGrowthPanel.tsx` — compact growth/readiness/history UI.
- `src/features/play/WildsTransformation.tsx` — resumable evolution/Ascension reveal.
- `src/features/play/WildsChildCeremony.tsx` — parent selection summary and child reveal.

### Existing files changed

- `src/features/play/portable-card.ts` — v1 compatibility facade plus v2 dispatch and Exchange projection.
- `src/features/play/card-fusion.ts` — delegate fusion to living lineage and retain compatibility exports.
- `src/features/play/game-state.ts` — authoritative progress events, stable-card replacement, Ascension, fusion transaction, migration, and save v5.
- `src/features/play/WildsCard.tsx` — current living projection and shared Heartbound renderer.
- `src/features/play/WildsInventory.tsx` — growth dashboard, Ascension action, ceremony, revision-aware import, and current-rank labels.
- `src/features/play/WildsCardPage.tsx` — revision timeline, lineage, trait provenance, and current proof.
- `src/features/play/WildsWorldCanvas.tsx` — use current genome/animation for selected and wild characters.
- `src/features/play/card-export.ts` — v2 PNG/vault schema, current artwork, complete chain, revision-aware import.
- `src/lib/exchange/asset-admission.ts` — current-revision verification and listing revision pin.
- `app/api/exchange/wilds/route.ts` — accept and return the pinned living revision.
- `app/globals.css` — Heartbound anatomy, transformation, growth, lineage, ceremony, responsive, and reduced-motion styles.

### Tests

- Create `tests/living-card-proof.test.ts`.
- Create `tests/growth-engine.test.ts`.
- Create `tests/heartbound-genome.test.ts`.
- Create `tests/heartbound-renderer.test.ts`.
- Create `tests/living-lineage.test.ts`.
- Modify `tests/portable-card.test.ts`.
- Modify `tests/card-fusion.test.ts`.
- Modify `tests/play-game-state.test.ts`.
- Modify `tests/card-export.test.ts`.
- Modify `tests/exchange-asset-admission.test.ts`.
- Modify `tests/wilds-render-contract.test.ts`.
- Modify `tests/mobile-layout-css.test.ts`.

---

### Task 1: Define the living-card schema and stable proof chain

**Files:**
- Create: `src/features/play/living-card-types.ts`
- Create: `src/features/play/living-card-proof.ts`
- Create: `tests/living-card-proof.test.ts`
- Modify: `src/features/play/portable-card.ts`
- Modify: `tests/portable-card.test.ts`

**Interfaces:**
- Produces: `LivingCardAsset`, `LivingCardManifest`, `LivingCardRevision`, `LivingCardGenome`, `isLivingCardAsset(value)`, `createLivingCardBirth(input)`, `appendLivingCardRevision(input)`, `verifyLivingCard(asset)`, `currentRevision(asset)`, `currentLivingProjection(asset)`, `admitLegacyCard(asset, admittedAt)`.
- Consumes: `canonicalPortableCardJson`, `sha256PortableBasis`, v1 `PortableCardAsset`, catalog forms, and existing variant traits.

- [ ] **Step 1: Write failing stable-identity and chain tests**

```ts
const birth = createLivingCardBirth({ legacy: sealCollectedCard(BASE), admittedAt: T0 });
const next = appendLivingCardRevision({
  asset: birth,
  revision: revisionCandidate({ previousDigest: birth.proof.digest, sealedAt: T1 })
});
assert.equal(next.id, birth.id);
assert.equal(next.manifest.currentRevision, 1);
assert.equal(next.manifest.revisions[1]!.previousRevisionDigest, birth.manifest.revisions[0]!.digest);
assert.equal(verifyLivingCard(next).ok, true);
assert.equal(verifyLivingCard({ ...next, manifest: { ...next.manifest, currentRevision: 0 } }).ok, false);
```

Also update the old evolution assertion from `assert.notEqual(evolved.id, base.id)` to `assert.equal(evolved.id, base.id)` and assert a two-revision history.

- [ ] **Step 2: Run the suite and verify the new tests fail**

Run: `pnpm test`

Expected: FAIL because `living-card-proof.ts` does not exist and the old evolution function changes asset IDs.

- [ ] **Step 3: Add complete v2 types**

```ts
export type GrowthPath = "bond" | "battle" | "exploration" | "legacy" | "community" | "character";
export type TraitSource = "birth" | "parent_a" | "parent_b" | "blended" | "mutation" | "ascension";

export type LivingCardRevision = {
  revision: number;
  previousRevisionDigest: string | null;
  digest: string;
  sealedAt: string;
  kaiPulse: string;
  reason: { kind: "birth" | "stage" | "ascension" | "parenthood"; label: string };
  stage: 1 | 2 | 3;
  ascensionRank: number;
  formId: string;
  growth: LivingGrowthSnapshot;
  qualifyingAchievementIds: string[];
  consumedCatalystId: string | null;
  genomeDelta: Partial<LivingCardGenome>;
  genomeDigest: string;
  stats: CreatureStats;
  abilityNames: readonly [string, string];
  title: string;
  rendererVersion: 1;
  renderedArtDigest: string;
  childEventIds: string[];
};

export type LivingCardManifest = {
  schema: "receiz.wilds_living_card_manifest.v2";
  assetId: string;
  ownerReceizId: string;
  birth: LivingCardBirth;
  birthGenome: LivingCardGenome;
  currentRevision: number;
  revisions: LivingCardRevision[];
  lineage: LivingLineage;
};
```

- [ ] **Step 4: Implement canonical birth, append, verification, and projection**

```ts
export function appendLivingCardRevision(input: AppendLivingRevisionInput): LivingCardAsset {
  const checked = verifyLivingCard(input.asset);
  if (!checked.ok) throw new Error("wilds_living_previous_invalid");
  const prior = input.asset.manifest.revisions.at(-1)!;
  if (input.revision.previousRevisionDigest !== prior.digest) throw new Error("wilds_revision_parent_invalid");
  if (input.revision.revision !== prior.revision + 1) throw new Error("wilds_revision_number_invalid");
  const sealed = sealRevision(input.revision);
  const manifest = { ...input.asset.manifest, currentRevision: sealed.revision, revisions: [...input.asset.manifest.revisions, sealed] };
  return { ...input.asset, manifest, proof: sealLivingManifest(manifest) };
}
```

Verification must recompute every revision in order, enforce `currentRevision === revisions.length - 1`, rebuild the current genome, and verify the outer proof digest.

- [ ] **Step 5: Make `portable-card.ts` a v1/v2 compatibility facade**

Keep `verifyPortableCard(v1)` unchanged. Add `verifyAnyWildsCard(asset)` and `currentWildsCardProjection(asset)`. Change `evolvePortableCard` to admit v1 once when necessary, then append a stage revision under the stable identity.

- [ ] **Step 6: Run proof tests and the full suite**

Run: `pnpm test && pnpm typecheck`

Expected: PASS; v1 tamper tests still pass and stage evolution preserves `assetId`.

- [ ] **Step 7: Commit**

```bash
git add src/features/play/living-card-types.ts src/features/play/living-card-proof.ts src/features/play/portable-card.ts tests/living-card-proof.test.ts tests/portable-card.test.ts
git commit -m "feat: add stable living card proof chains"
```

---

### Task 2: Build deterministic earned-growth and character-quest rules

**Files:**
- Create: `src/features/play/growth-engine.ts`
- Create: `tests/growth-engine.test.ts`

**Interfaces:**
- Consumes: `LivingCardAsset`, `GrowthPath`, current genome, catalog form, and authoritative `GrowthEvent` values.
- Produces: `applyGrowthEvent(asset, event)`, `nextGrowthRequirements(asset, at)`, `growthReadiness(asset, inventory, at)`, `buildTransformationCandidate(asset, readiness, at)`.

- [ ] **Step 1: Write failing tests for all five Ascension gates**

```ts
const requirements = nextGrowthRequirements(stageThreeCard, NOW);
assert.equal(requirements.ascensionRank, 1);
assert.ok(requirements.bond > stageThreeCard.manifest.revisions.at(-1)!.growth.bond);
assert.equal(growthReadiness(stageThreeCard, [], NOW).ready, false);
assert.deepEqual(growthReadiness(readyCard, inventory, NOW).missing, []);
assert.equal(growthReadiness(readyCard, inventory, NOW).ready, true);
```

Test that time alone does not change readiness, a consumed achievement cannot qualify again, recovery blocks otherwise-ready cards, and rank 10,000 formulas remain finite.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test`

Expected: FAIL because the progress engine exports do not exist.

- [ ] **Step 3: Implement bounded formulas and deterministic quests**

```ts
export function ascensionRequirements(rank: number) {
  if (!Number.isSafeInteger(rank) || rank < 1) throw new Error("wilds_rank_invalid");
  return {
    bond: Math.min(1_000_000, 80 + rank * 35 + Math.floor(Math.pow(rank, 1.25) * 12)),
    majorAchievements: 1,
    catalystTier: 1 + Math.floor(Math.log2(rank + 1)),
    recoveryMs: Math.min(7 * DAY_MS, DAY_MS + rank * 3_600_000)
  };
}

export function characterQuest(asset: LivingCardAsset, rank: number): CharacterQuest {
  const seed = sha256PortableBasis(canonicalPortableCardJson({ assetId: asset.id, rank, genome: currentGenomeDigest(asset) }));
  return chooseValidQuest(seed, questTemplatesFor(currentLivingProjection(asset)));
}
```

Quest validation must reject paywalled actions, forced transfer/sale, pure waits, unsupported habitats, and conditions that the current game cannot emit.

- [ ] **Step 4: Implement authoritative growth-event reduction**

Define exact event types for battle wins, comeback wins, ability mastery, discoveries, region completion, active travel, bond moments, parenthood, descendant milestones, verified trades, collection completion, and character-quest progress. Deduplicate by `eventId` and retain consumed major achievement IDs.

- [ ] **Step 5: Run focused and full verification**

Run: `pnpm test && pnpm typecheck`

Expected: PASS with deterministic quest snapshots and no numeric overflow.

- [ ] **Step 6: Commit**

```bash
git add src/features/play/growth-engine.ts tests/growth-engine.test.ts
git commit -m "feat: add earned living card progression"
```

---

### Task 3: Add deterministic Heartbound genomes and Ascension deltas

**Files:**
- Create: `src/features/play/heartbound-genome.ts`
- Create: `tests/heartbound-genome.test.ts`
- Modify: `src/features/play/living-card-proof.ts`

**Interfaces:**
- Consumes: catalog anatomy, v1 variant traits, sealed progress/achievement inputs, and two current parent genomes.
- Produces: `deriveBirthGenome(input)`, `deriveAscensionGenome(input)`, `deriveFusionGenome(input)`, `genomeDigest(genome)`, `validateGenome(genome)`.

- [ ] **Step 1: Write failing determinism, identity, and inheritance tests**

```ts
assert.deepEqual(deriveBirthGenome(input), deriveBirthGenome(input));
assert.equal(validateGenome(deriveBirthGenome(input)).ok, true);
const ascended = deriveAscensionGenome({ previous, rank: 12, achievement, quest, kaiPulse });
assert.deepEqual(ascended.face.identityAnchor, previous.face.identityAnchor);
const child = deriveFusionGenome({ parentA, parentB, emphasis: "balanced", kaiPulse, mutationNonce });
assert.ok(Object.values(child.provenance).includes("parent_a"));
assert.ok(Object.values(child.provenance).includes("parent_b"));
```

Add property loops across every catalog anatomy and 1,000 deterministic seeds to assert valid proportions, palettes, limbs, and provenance.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test`

Expected: FAIL because genome derivation is absent.

- [ ] **Step 3: Implement the independent trait-group genome**

```ts
export type LivingCardGenome = {
  skeleton: { locomotion: "biped" | "quadruped" | "serpentine" | "flying"; torso: number; limb: number; head: number };
  face: { identityAnchor: string; eye: EyeTraits; mouth: MouthTraits; expressionSet: string };
  appendages: { ears: string; horns: string; wings: string; tail: string; crest: string };
  surface: { kind: "fur" | "feather" | "scale" | "shell" | "energy"; pattern: string };
  palette: { primary: string; secondary: string; accent: string; glow: string };
  behavior: { temperament: string; idleCadenceMs: number; signatureGesture: string; battleStance: string };
  aura: { kind: string; intensity: number; particle: string };
  provenance: Record<GenomeTraitKey, TraitSource>;
};
```

Use clamped numeric domains and enumerated renderable parts. Do not store free-form geometry instructions in proof data.

- [ ] **Step 4: Implement earned Ascension mapping**

Map battle to stance/combat detail, exploration to aura/environment markings, bond to expression/gesture, legacy to crest/family behavior, community to ceremonial cosmetics, and character quests to signature features. Preserve `face.identityAnchor` for every Ascension.

- [ ] **Step 5: Implement balanced two-parent inheritance**

Derive each trait group independently. Enforce at least one visible trait group from each parent. Blend palettes in OKLCH-compatible bounded channels or the project's deterministic HSL representation. Store a provenance entry for every group and one bounded mutation group at most.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test && pnpm typecheck`

Expected: PASS.

```bash
git add src/features/play/heartbound-genome.ts src/features/play/living-card-proof.ts tests/heartbound-genome.test.ts
git commit -m "feat: derive Heartbound living genomes"
```

---

### Task 4: Build the shared full-body Heartbound renderer

**Files:**
- Create: `src/features/play/heartbound-renderer.ts`
- Create: `tests/heartbound-renderer.test.ts`
- Modify: `src/features/play/WildsCard.tsx`
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Modify: `src/features/play/card-export.ts`
- Modify: `tests/wilds-render-contract.test.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: verified `LivingCardGenome`, `HeartboundPose`, current title/rank, and rendering surface.
- Produces: `heartboundLayers(genome, pose)`, `renderHeartboundSvg(genome, pose, options)`, `HeartboundCreature` React component, and stable `renderedArtDigest`.

- [ ] **Step 1: Write failing anatomy and cross-surface contract tests**

```ts
const layers = heartboundLayers(genome, "idle");
assert.ok(layers.findIndex((layer) => layer.slot === "torso") < layers.findIndex((layer) => layer.slot === "head"));
assert.ok(layers.some((layer) => layer.slot === "left_forelimb"));
assert.ok(layers.some((layer) => layer.slot === "right_hindlimb"));
assert.equal(renderHeartboundSvg(genome, "card", OPTIONS), renderHeartboundSvg(genome, "card", OPTIONS));
assert.equal(renderedArtDigest(genome, "card"), currentRevision.renderedArtDigest);
```

Update render-contract tests to reject the old `wilds-card-creature-core` circle-only anatomy.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test`

Expected: FAIL because the shared renderer and articulated layers do not exist.

- [ ] **Step 3: Implement ordered anatomy layers and pose transforms**

```ts
const LAYER_ORDER: HeartboundSlot[] = [
  "aura_back", "tail", "rear_appendages", "hindlimbs", "torso", "forelimbs_back",
  "neck_ruff", "ears_back", "head", "face_markings", "eyes", "mouth",
  "forelimbs_front", "crest_front", "aura_front"
];

export function heartboundLayers(genome: LivingCardGenome, pose: HeartboundPose) {
  return LAYER_ORDER.flatMap((slot) => buildSlot(slot, genome, pose)).map(validateLayer);
}
```

Build full-body biped, quadruped, serpentine, and flying skeletons with neck transitions, shoulders, elbows, knees, paws/feet, family appendages, and expressive tails. The head layer must always follow the torso layer.

- [ ] **Step 4: Add deterministic animation profiles**

Implement breathing, blink, gaze, signature idle, walk, run, battle-ready, two abilities, damage, defeat, bond, celebration, and transformation pose curves. Use CSS/Three animation from sealed timing values and provide reduced-motion pose substitutions.

- [ ] **Step 5: Replace card, world, and PNG art with the shared renderer**

`WildsCard` renders `HeartboundCreature`; `WildsWorldCanvas` reads current genome and animation profile; `renderWildsCardSvg` embeds `renderHeartboundSvg`. Preserve QR, card stats, foil, proof digest, and card layout.

- [ ] **Step 6: Verify responsive rendering and commit**

Run: `pnpm test && pnpm typecheck`

Expected: PASS; render contract proves shared anatomy and digest agreement.

```bash
git add src/features/play/heartbound-renderer.ts src/features/play/WildsCard.tsx src/features/play/WildsWorldCanvas.tsx src/features/play/card-export.ts app/globals.css tests/heartbound-renderer.test.ts tests/wilds-render-contract.test.ts
git commit -m "feat: render articulated Heartbound companions"
```

---

### Task 5: Integrate growth events and stable evolution into game state

**Files:**
- Modify: `src/features/play/game-state.ts`
- Modify: `src/features/play/battle-engine.ts`
- Modify: `tests/play-game-state.test.ts`
- Modify: `tests/battle-engine.test.ts`

**Interfaces:**
- Consumes: `applyGrowthEvent`, `growthReadiness`, `buildTransformationCandidate`, `appendLivingCardRevision`, and current selected living card.
- Produces: new `WildsInput` variants `record-growth`, `ascend-card`, and `finish-transformation`; save schema `receiz.wilds.save.v5`.

- [ ] **Step 1: Write failing reducer tests for stable evolution and earned Ascension**

```ts
const evolved = applyWildsInput(ready, { type: "evolve", assetId: base.id, evolvedAt: T1 });
assert.equal(evolved.inventory.length, ready.inventory.length);
assert.equal(evolved.inventory[0]!.id, base.id);
assert.equal(evolved.inventory[0]!.manifest.currentRevision, 1);

const ascended = applyWildsInput(ascensionReady, { type: "ascend-card", assetId: base.id, at: T2 });
assert.equal(currentLivingProjection(ascended.inventory[0]!).ascensionRank, 1);
assert.equal(ascended.catalysts.length, ascensionReady.catalysts.length - 1);
```

Test retry idempotency, failure without all gates, selected asset stability, battle achievement emission, exploration progress, and v4-to-v5 save migration.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test`

Expected: FAIL because evolution still appends inventory and Ascension inputs do not exist.

- [ ] **Step 3: Add living progression state and migration**

Replace family-only progress authority with per-asset admitted growth while preserving a derived compatibility projection for existing UI. Add catalysts and transformation presentation state. During restore, verify each v1/v2 card, admit eligible local v1 cards deterministically, merge duplicate IDs by newest valid chain, and keep the selected stable ID.

- [ ] **Step 4: Emit authoritative gameplay growth events**

Battle completion emits win, comeback, ability, and boss events. Discovery emits habitat/region events. Movement emits bounded active-travel milestones rather than per-frame proof events. Training becomes a bond interaction with cooldown and does not independently satisfy Ascension.

- [ ] **Step 5: Replace inventory entries in place for evolution**

```ts
function replaceLivingAsset(state: PlayState, next: LivingCardAsset): PlayState {
  return {
    ...state,
    inventory: state.inventory.map((asset) => asset.id === next.id ? next : asset),
    selectedAssetId: state.selectedAssetId === next.id ? next.id : state.selectedAssetId,
    pendingSyncAssetIds: Array.from(new Set([...state.pendingSyncAssetIds, next.id]))
  };
}
```

Only consume the catalyst after `appendLivingCardRevision` succeeds.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test && pnpm typecheck`

Expected: PASS; existing discovery/battle/capture tests remain green.

```bash
git add src/features/play/game-state.ts src/features/play/battle-engine.ts tests/play-game-state.test.ts tests/battle-engine.test.ts
git commit -m "feat: earn and append living card growth"
```

---

### Task 6: Replace template fusion with atomic living lineage

**Files:**
- Create: `src/features/play/living-lineage.ts`
- Create: `tests/living-lineage.test.ts`
- Modify: `src/features/play/card-fusion.ts`
- Modify: `src/features/play/game-state.ts`
- Modify: `tests/card-fusion.test.ts`
- Modify: `tests/play-game-state.test.ts`

**Interfaces:**
- Consumes: two verified current living cards, `deriveFusionGenome`, Spark ID, Kai Pulse, current time, and recovery map.
- Produces: `lineageEligibility(input)`, `createLivingChildTransaction(input)` returning `{ child, parentA, parentB, sparkConsumed, recoveryUntil, eventId }`.

- [ ] **Step 1: Write failing two-parent and atomicity tests**

```ts
const result = createLivingChildTransaction(INPUT);
assert.notEqual(result.child.id, result.parentA.id);
assert.notEqual(result.child.id, result.parentB.id);
assert.equal(result.parentA.id, INPUT.parentA.id);
assert.equal(result.parentB.id, INPUT.parentB.id);
assert.ok(currentRevision(result.parentA).childEventIds.includes(result.eventId));
assert.ok(currentRevision(result.parentB).childEventIds.includes(result.eventId));
assert.ok(Object.values(result.child.manifest.birthGenome.provenance).includes("parent_a"));
assert.ok(Object.values(result.child.manifest.birthGenome.provenance).includes("parent_b"));
assert.deepEqual(createLivingChildTransaction(INPUT), result);
```

Test any stage/rank combination, same-owner enforcement, distinct parents, Spark shortage, recovery, invalid proof, and no partial mutation after a thrown validation error.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test`

Expected: FAIL because current fusion inherits one parent's complete form and does not append parenthood history.

- [ ] **Step 3: Implement one atomic lineage transaction**

Create the child birth and both parenthood revisions from a shared event basis. Validate all three outputs before returning. Parent revisions may only add the child event and eligible Legacy progress; unrelated art changes require a later growth revision.

- [ ] **Step 4: Update reducer fusion behavior**

Replace both parents in place, append one child, consume one Spark, set both recovery timestamps, select the child, and use the stable transaction event ID for replay detection. On any failure, return the original inventory/Spark/cooldown state with an actionable message.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test && pnpm typecheck`

Expected: PASS.

```bash
git add src/features/play/living-lineage.ts src/features/play/card-fusion.ts src/features/play/game-state.ts tests/living-lineage.test.ts tests/card-fusion.test.ts tests/play-game-state.test.ts
git commit -m "feat: create independently living lineage children"
```

---

### Task 7: Build growth, transformation, and child-creation UI

**Files:**
- Create: `src/features/play/WildsGrowthPanel.tsx`
- Create: `src/features/play/WildsTransformation.tsx`
- Create: `src/features/play/WildsChildCeremony.tsx`
- Modify: `src/features/play/WildsInventory.tsx`
- Modify: `src/features/play/WildsCaptureReward.tsx`
- Modify: `src/features/play/WildsCardPage.tsx`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `app/globals.css`
- Modify: `tests/wilds-render-contract.test.ts`
- Modify: `tests/mobile-layout-css.test.ts`

**Interfaces:**
- Consumes: current living projection, `nextGrowthRequirements`, `growthReadiness`, revision history, lineage transaction state, and `WildsInput`.
- Produces: accessible compact controls for readiness, history, Ascension, ceremony, reveal, and active-deck selection.

- [ ] **Step 1: Write failing static UI contract tests**

Assert source contracts for `aria-live`, dialog labels, exact requirement copy, stable current-rank labels, revision timeline, trait provenance, reduced-motion CSS, 44px primary targets, and no permanent mobile vertical panel expansion.

```ts
assert.match(growthSource, /What remains/);
assert.match(transformationSource, /aria-label="Living card transformation"/);
assert.match(ceremonySource, /Both parents remain yours/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test`

Expected: FAIL because the components and contracts do not exist.

- [ ] **Step 3: Implement the compact growth panel**

Show current stage/Ascension, bond, power rating, six path summaries, exact missing gates, character quest, catalyst, recovery, and recent history. Default secondary history/details to collapsed on mobile. Replace `Apex form reached` with the next Ascension requirements.

- [ ] **Step 4: Implement resumable transformation**

Use a dialog/state overlay that shows the causal achievement, old and new Heartbound states, trait/stat/ability changes, and final seal. Dispatch `finish-transformation` only to dismiss presentation; the proof revision must already be admitted before reveal.

- [ ] **Step 5: Implement child ceremony**

Show two selected living parents, eligibility, broad inheritance tendencies, Spark/recovery disclosure, and confirmation. Do not reveal the exact child genome before confirmation. After admission, reveal the child and provide Set Active, Download, Open Card, and Exchange actions.

- [ ] **Step 6: Add timeline and lineage to the standalone page**

Render revision reason, rank, proof digest, parents, children, descendants, and fusion trait provenance. Keep private owner identity and exact private location activity out of public output.

- [ ] **Step 7: Verify and commit**

Run: `pnpm test && pnpm typecheck`

Expected: PASS.

```bash
git add src/features/play/WildsGrowthPanel.tsx src/features/play/WildsTransformation.tsx src/features/play/WildsChildCeremony.tsx src/features/play/WildsInventory.tsx src/features/play/WildsCaptureReward.tsx src/features/play/WildsCardPage.tsx src/features/play/PlayCampaign.tsx app/globals.css tests/wilds-render-contract.test.ts tests/mobile-layout-css.test.ts
git commit -m "feat: add living card growth and lineage journeys"
```

---

### Task 8: Upgrade portable PNGs, vault restore, and revision-aware import

**Files:**
- Modify: `src/features/play/card-export.ts`
- Modify: `src/features/play/WildsInventory.tsx`
- Modify: `tests/card-export.test.ts`
- Modify: `tests/play-game-state.test.ts`

**Interfaces:**
- Consumes: `verifyAnyWildsCard`, complete v2 proof chains, current Heartbound SVG, current local inventory, and ownership projection.
- Produces: `receiz.wilds_png_proof.v2`, `receiz.wilds_vault_png_proof.v2`, `mergeImportedLivingCard(local, imported)`, revision-aware verification results, and deterministic merge outcomes.

- [ ] **Step 1: Write failing PNG round-trip and merge tests**

```ts
const png = embedPortableCardInPng(basePng, ascendedCard);
const checked = verifyPortableCardPng(png);
assert.equal(checked.ok, true);
assert.equal(checked.asset!.id, ascendedCard.id);
assert.equal(checked.asset!.manifest.revisions.length, ascendedCard.manifest.revisions.length);

assert.equal(mergeImportedLivingCard(localRevision3, importedRevision5).outcome, "updated");
assert.equal(mergeImportedLivingCard(localRevision5, importedRevision3).outcome, "historical");
assert.equal(mergeImportedLivingCard(divergentRevision5, importedRevision5).outcome, "quarantined");
```

Test image tamper, revision tamper, unknown generator, v1 import, multi-card vault partial failure, and proof-size limit.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test`

Expected: FAIL because v1 PNG schemas and duplicate-only reducer behavior cannot merge revisions.

- [ ] **Step 3: Add v2 card and vault chunks**

Embed the complete compressed canonical v2 asset and current image digest. Keep v1 readers. Reject output before download when the proof chunk exceeds the explicit maximum. Use the current revision proof digest and Ascension label in visible art.

- [ ] **Step 4: Implement revision-aware import merge**

For equal IDs, compare chains from revision zero. A strict valid extension updates the existing inventory entry. An older prefix is accepted as history without rollback. A divergent valid-looking chain is quarantined. A separate valid ID appends normally.

- [ ] **Step 5: Make vault restore report per-card results**

Return counts and reasons for added, updated, historical, quarantined, ownership-mismatched, and invalid cards without discarding valid siblings.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test && pnpm typecheck`

Expected: PASS with v1 and v2 PNG compatibility.

```bash
git add src/features/play/card-export.ts src/features/play/WildsInventory.tsx tests/card-export.test.ts tests/play-game-state.test.ts
git commit -m "feat: carry living histories in portable PNGs"
```

---

### Task 9: Pin Exchange listings to living revisions

**Files:**
- Modify: `src/features/play/portable-card.ts`
- Modify: `src/lib/exchange/asset-admission.ts`
- Modify: `app/api/exchange/wilds/route.ts`
- Modify: `tests/exchange-asset-admission.test.ts`
- Modify: `tests/exchange-listing-authority.test.ts`

**Interfaces:**
- Consumes: verified current living card, authoritative owner, price, and current revision digest.
- Produces: Exchange asset manifest fields `livingRevision`, `livingRevisionDigest`, `listingPinnedAt`, plus `authorizePinnedListing(input)` for pause-on-change validation.

- [ ] **Step 1: Write failing listing pin tests**

```ts
const listing = admitWildsCard({ actorReceizId: OWNER, card, priceCents: 2500 });
assert.equal(listing.manifest?.livingRevision, card.manifest.currentRevision);
assert.equal(listing.manifest?.livingRevisionDigest, currentRevision(card).digest);
assert.throws(() => authorizePinnedListing({ listing, card: laterRevision }), /wilds_listing_revision_changed/);
```

Also assert that v1 cards remain listable after verification and that all buy/list responses stay on the current app domain.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test`

Expected: FAIL because Exchange assets do not pin a living revision.

- [ ] **Step 3: Add current-revision admission and pause behavior**

Verify the full chain, current ownership, and current revision at listing time. If the card later evolves, return a paused/reconfirmation response rather than selling the changed projection. Do not redirect to Receiz.com.

- [ ] **Step 4: Run tests and commit**

Run: `pnpm test && pnpm typecheck`

Expected: PASS.

```bash
git add src/features/play/portable-card.ts src/lib/exchange/asset-admission.ts app/api/exchange/wilds/route.ts tests/exchange-asset-admission.test.ts tests/exchange-listing-authority.test.ts
git commit -m "feat: pin listings to living card revisions"
```

---

### Task 10: Complete end-to-end verification and release evidence

**Files:**
- Modify: `tests/launch-readiness.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`
- Modify: `tests/mobile-layout-css.test.ts`
- Create: `docs/verification/2026-07-13-living-card-loop.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: one repeatable release checklist and evidence record for the complete living-card loop.

- [ ] **Step 1: Add one golden-path integration contract**

The test must execute: v1 starter admission → earned stage evolution under stable ID → stage 3 → earned Ascension → PNG export/verify/import → two-parent child → parent preservation → child active selection → child growth → listing pin → transfer authority check.

```ts
assert.equal(finalParent.id, originalParent.id);
assert.ok(finalParent.manifest.revisions.length > originalParent.manifest.revisions.length);
assert.notEqual(child.id, finalParent.id);
assert.equal(verifyLivingCard(child).ok, true);
assert.equal(restoredChild.id, child.id);
```

- [ ] **Step 2: Run the complete automated gate**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: all tests PASS, TypeScript exits 0, and Next production build exits 0.

- [ ] **Step 3: Run browser verification at desktop and mobile widths**

Start with `pnpm dev`, then verify the game at 1440×900, 430×932, 390×844, and 320×700. Complete discovery, battle, capture, growth readiness, transformation, child ceremony, download, re-import, active selection, card page, and listing. Confirm no console errors, no clipped controls, no head/torso overlap, and reduced-motion behavior.

- [ ] **Step 4: Record exact evidence**

Write `docs/verification/2026-07-13-living-card-loop.md` with commands, pass counts, build result, tested viewports, generated PNG filenames/digests, observed console/network status, screenshots, and any explicitly deferred scope from the design.

- [ ] **Step 5: Run final diff and repository checks**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only the intended verification document remains uncommitted.

- [ ] **Step 6: Commit**

```bash
git add tests/launch-readiness.test.ts tests/wilds-render-contract.test.ts tests/mobile-layout-css.test.ts docs/verification/2026-07-13-living-card-loop.md
git commit -m "test: verify the living card loop end to end"
```

---

## Completion criteria

- The same living card ID survives every stage and Ascension.
- Its current image, stats, abilities, title, and animation update from earned gameplay while every prior state verifies in order.
- Ascension remains deterministic and valid at representative very high ranks.
- Any two eligible owned cards at any stage/rank can produce a visibly two-parent child.
- Both parents remain usable and gain append-only parenthood history.
- The child is independently portable, selectable, evolvable, tradable, and capable of descendants.
- The approved face and articulated Heroic Companion body render consistently in the world, card, PNG, vault, and public page.
- Current PNG and vault exports recover complete histories offline without rolling back newer state.
- Exchange listings pin the offered living revision and pause after material evolution.
- Automated tests, typecheck, build, browser playthrough, mobile layouts, reduced motion, console, and offline PNG verification all pass.
