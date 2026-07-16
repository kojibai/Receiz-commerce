# Wilds Hearttree Real-Card Expedition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hearttree button sequence with a 10–15 minute deterministic 3D expedition whose challenges, tactical actions, rewards, injuries, upgrades, and irreversible deaths derive from the exact verified cards selected and the player's skill.

**Architecture:** Build a pure deterministic Hearttree domain under `src/features/play/hearttree/`, then connect it to the existing PlayState, Receiz public-state authority, Three.js presentation, and adaptive audio runtime. The browser simulates responsive fixed-step play and records bounded inputs; the server replays the transcript against pinned proofs and publishes accepted consequences atomically before the client adopts them.

**Tech Stack:** TypeScript 5.9, React 19, Next.js 15 App Router, Three.js through `@react-three/fiber`, Web Audio, Node test runner, Receiz SDK/MCP v105, local MP3/WAV assets, open-source offline production tooling only.

## Global Constraints

- Normal Hearttree runs accept one to three verified cards; each challenge declares its exact minimum and maximum.
- The exact card proof revision is pinned at admission and cannot change during the run.
- Health, power, guard, speed, bond, element, abilities, anatomy, growth, lineage, and condition must have authored, player-readable effects.
- Outcomes are deterministic; hidden random success, injury, reward, and death rolls are forbidden.
- Normal expeditions must be solvable by the admitted squad; optional Mortal branches may be unsafe only after explicit disclosure and consent.
- Death is permanent and irreversible; network, browser, publication, or replay failures can never kill a card.
- Permanent consequences become canonical only after server replay and successful Receiz publication.
- Audio must be finished local assets: no oscillator-tone placeholders, runtime cloud service, API, or third-party playback dependency.
- Human dialogue may ship only after real-performer recording and rights clearance; absent cleared recordings remain omitted rather than synthesized with a robot voice.
- Existing Wilds saves, cards, proof history, Arena, Prism, settlement, ecology, raid, and multiplayer behavior must remain compatible.
- Every task follows red-green-refactor TDD and ends with a focused commit.

## File Structure

### New domain files

- `src/features/play/hearttree/card-capability.ts` — exact card revision and persistent condition to playable capabilities.
- `src/features/play/hearttree/ability-registry.ts` — versioned ability mechanics resolved from the catalog's real ability definitions.
- `src/features/play/hearttree/action-resolver.ts` — deterministic movement, ability, defense, counter, and environmental outcomes.
- `src/features/play/hearttree/expedition-director.ts` — squad-dependent chamber, hazard, puzzle, boss, reward, and audio definition with solvability validation.
- `src/features/play/hearttree/runtime.ts` — fixed-step session state, inputs, collision proxies, objectives, card switching, extraction, and boss phases.
- `src/features/play/hearttree/transcript.ts` — bounded input/event transcript, digest, replay, and tamper rejection.
- `src/features/play/hearttree/consequences.ts` — contribution XP, fatigue, injury, mastery, upgrade offers, extraction, and permanent-death projection.
- `src/features/play/hearttree/receipt.ts` — canonical accepted result and verification.
- `src/features/play/hearttree/HearttreeExpedition.tsx` — squad gate, HUD, result ceremony, accessibility, and runtime ownership.
- `src/features/play/hearttree/HearttreeScene.tsx` — Three.js chambers, cards, hazards, Root Master, camera, VFX, and spatial audio anchors.
- `src/features/play/hearttree/HearttreeControls.tsx` — keyboard/touch actions, switching, extraction, and Mortal confirmation.
- `src/lib/receiz/wilds-hearttree-server.ts` — actor resolution, replay admission, idempotency, Receiz publication, and rollback.
- `app/api/wilds/hearttree/route.ts` — Hearttree admission endpoint.
- `scripts/validate-hearttree-audio.mjs` — file, decode, duration, loop, loudness, and provenance gate.
- `public/audio/wilds/hearttree/manifest.json` — runtime paths and production provenance.

### Modified files

- `src/features/play/hearttree-trial.ts` — remove the obsolete four-button Hearttree implementation after the replacement is integrated.
- `src/features/play/WildsLandmarkExperience.tsx` — route Hearttree to `HearttreeExpedition`; keep Arena and Prism intact.
- `src/features/play/PlayCampaign.tsx` — provide inventory, actor/world mode, dispatch accepted receipts, and audio events.
- `src/features/play/game-state.ts` — save schema v9, card conditions, receipts, upgrades, and dead-card selection guards.
- `src/features/play/audio/wilds-audio-types.ts` — Hearttree bank and complete production metadata.
- `src/features/play/audio/wilds-audio-catalog.ts` — generated Hearttree catalog entries.
- `src/features/play/audio/wilds-audio-director.ts` — expedition-state and card-motif transitions.
- `app/globals.css` — responsive Hearttree HUD, squad gate, result, Mortal warning, and accessibility states.
- `package.json` and `scripts/release-check.mjs` — Hearttree audio and replay qualification gates.
- `RELEASE_NOTES.md` and `docs/SDK_RAILS.md` — shipped gameplay and authority boundary.

---

### Task 1: Exact Card Capability and Life-State Model

**Files:**
- Create: `src/features/play/hearttree/card-capability.ts`
- Create: `tests/hearttree-card-capability.test.ts`

**Interfaces:**
- Consumes: `PortableCardAsset`, `verifyAnyWildsCard`, `currentRevision`, `currentLivingGenome`, `creatureForm`, and `projectWildsCardMastery`.
- Produces: `HearttreeCardCondition`, `HearttreeCardCapability`, `emptyHearttreeCondition(assetId)`, `projectHearttreeCard(card, condition)`, and `assertHearttreeCardPlayable(capability)`.

- [ ] **Step 1: Write the failing capability tests**

```ts
const grove = sealCollectedCard({ formId: "mintcub-1", ownerReceizId: "player", encounterId: "hearttree-grove", capturedAt: "2026-07-16T12:00:00.000Z" });
const flying = sealCollectedCard({ formId: "voltray-1", ownerReceizId: "player", encounterId: "hearttree-fly", capturedAt: "2026-07-16T12:01:00.000Z" });
assert.equal(projectHearttreeCard(grove, emptyHearttreeCondition(grove.id)).element, "Grove");
assert.equal(projectHearttreeCard(flying, emptyHearttreeCondition(flying.id)).traversal.has("flight"), true);
assert.equal(projectHearttreeCard(grove, { ...emptyHearttreeCondition(grove.id), life: "dead" }).playable, false);
assert.throws(() => assertHearttreeCardPlayable(projectHearttreeCard(grove, { ...emptyHearttreeCondition(grove.id), life: "dead" })), /hearttree_card_dead/);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --import tsx --test tests/hearttree-card-capability.test.ts`  
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `hearttree/card-capability`.

- [ ] **Step 3: Implement the focused capability model**

```ts
export type HearttreeCardCondition = {
  assetId: string;
  life: "alive" | "dead";
  fatigue: number;
  injuries: readonly { id: string; kind: "limb" | "wing" | "guard" | "focus"; severity: 1 | 2 | 3; sourceEventId: string }[];
  hearttreeXp: number;
  mastery: number;
  upgradeIds: readonly string[];
};

export type HearttreeCardCapability = {
  assetId: string;
  proofDigest: string;
  formId: string;
  familyId: string;
  playable: boolean;
  stats: { health: number; power: number; guard: number; speed: number; bond: number };
  element: string;
  abilityNames: readonly [string, string];
  anatomy: { body: string; detail: string; aura: string; locomotion: string };
  traversal: ReadonlySet<"ground" | "flight" | "narrow" | "break" | "anchor" | "balance">;
  roles: readonly ("vanguard" | "pathfinder" | "channeler" | "warden" | "striker" | "resonant")[];
  condition: HearttreeCardCondition;
};
```

Project anatomy, element, real stats, catalog ability names, living growth, lineage, mastery roles, and injury penalties without mutating the card.

- [ ] **Step 4: Run focused tests and existing card-proof tests**

Run: `node --import tsx --test tests/hearttree-card-capability.test.ts tests/portable-card.test.ts tests/living-card-proof.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/hearttree/card-capability.ts tests/hearttree-card-capability.test.ts
git commit -m "feat: project exact Hearttree card capabilities"
```

### Task 2: Versioned Ability Registry and Deterministic Action Resolver

**Files:**
- Create: `src/features/play/hearttree/ability-registry.ts`
- Create: `src/features/play/hearttree/action-resolver.ts`
- Create: `tests/hearttree-action-resolver.test.ts`

**Interfaces:**
- Consumes: `HearttreeCardCapability` from Task 1 and catalog `CreatureAbility` definitions.
- Produces: `HearttreeAbilityDefinition`, `hearttreeAbilitiesFor(card)`, `HearttreeActionContext`, `HearttreeActionOutcome`, and `resolveHearttreeAction(context)`.

- [ ] **Step 1: Write tests proving real fields affect outcomes**

```ts
const fast = capability({ speed: 95, power: 40, guard: 30, health: 70, bond: 60 });
const slow = capability({ speed: 25, power: 40, guard: 30, health: 70, bond: 60 });
assert.ok(resolveHearttreeAction(dodgeContext(fast, 0.86)).margin > resolveHearttreeAction(dodgeContext(slow, 0.86)).margin);
assert.equal(resolveHearttreeAction({ ...baseContext(stone), kind: "environment", obstacle: "root-wall" }).effects.some((effect) => effect.kind === "break"), true);
assert.deepEqual(resolveHearttreeAction(baseContext(fast)), resolveHearttreeAction(baseContext(fast)));
```

Also test ability power, element matchup, anatomy, range, timing, positioning, fatigue, injury, cooldown, support order, and unknown-ability rejection.

- [ ] **Step 2: Run and verify RED**

Run: `node --import tsx --test tests/hearttree-action-resolver.test.ts`  
Expected: FAIL because the registry and resolver do not exist.

- [ ] **Step 3: Implement registry definitions derived from actual catalog data**

```ts
export type HearttreeAbilityDefinition = {
  id: string;
  sourceName: string;
  tags: readonly ("strike" | "guard" | "heal" | "reveal" | "move" | "bind" | "cleanse" | "interrupt")[];
  element: string;
  power: number;
  range: number;
  windupMs: number;
  activeMs: number;
  recoveryMs: number;
  staminaCost: number;
  cooldownMs: number;
};
```

Resolve definitions from `creatureForm(card.formId).abilities`; preserve the exact source name and power. Use explicit element/anatomy rule tables. Throw `hearttree_ability_unknown` rather than fabricating a fallback.

- [ ] **Step 4: Implement the pure resolver**

Calculate action potential from the selected ability and relevant stats, then apply element, position, timing, condition, target state, and environment. Return an explanation array with every applied factor so the HUD/result transcript can explain success and failure.

- [ ] **Step 5: Run tests**

Run: `node --import tsx --test tests/hearttree-action-resolver.test.ts tests/wilds-card-mastery.test.ts tests/creature-catalog.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/play/hearttree/ability-registry.ts src/features/play/hearttree/action-resolver.ts tests/hearttree-action-resolver.test.ts
git commit -m "feat: resolve Hearttree actions from real card mechanics"
```

### Task 3: Squad-Dependent Expedition Director and Solvability Gate

**Files:**
- Create: `src/features/play/hearttree/expedition-director.ts`
- Create: `tests/hearttree-expedition-director.test.ts`

**Interfaces:**
- Consumes: `HearttreeCardCapability[]` and accepted prior history.
- Produces: `HearttreeExpeditionDefinition`, `generateHearttreeExpedition(input)`, and `validateHearttreeSolvability(definition, squad)`.

- [ ] **Step 1: Write deterministic and dynamic generation tests**

```ts
const one = generateHearttreeExpedition({ seed: "run-1", squad: [grove], history: [], mortal: false });
const replay = generateHearttreeExpedition({ seed: "run-1", squad: [grove], history: [], mortal: false });
const aerial = generateHearttreeExpedition({ seed: "run-1", squad: [flying], history: [], mortal: false });
assert.deepEqual(one, replay);
assert.notDeepEqual(one.chambers, aerial.chambers);
assert.equal(validateHearttreeSolvability(one, [grove]).ok, true);
assert.throws(() => generateHearttreeExpedition({ seed: "run-1", squad: [dead], history: [], mortal: false }), /hearttree_card_dead/);
```

Cover one-, two-, and three-card squads, complementary routes, injury-aware variants, lineage chambers, normal-run solvability, disclosed Mortal risk, and diminishing repeated mastery opportunities.

- [ ] **Step 2: Run and verify RED**

Run: `node --import tsx --test tests/hearttree-expedition-director.test.ts`  
Expected: FAIL with missing director module.

- [ ] **Step 3: Implement the definition schema**

```ts
export type HearttreeExpeditionDefinition = {
  schema: "receiz.wilds.hearttree_expedition.v1";
  id: string;
  seedDigest: string;
  generatorVersion: 1;
  squadPins: readonly { assetId: string; proofDigest: string }[];
  mortal: boolean;
  chambers: readonly HearttreeChamberDefinition[];
  boss: HearttreeBossDefinition;
  masteryOpportunities: readonly HearttreeMasteryOpportunity[];
  audioProfile: { baseMotif: string; cardMotifs: readonly string[] };
  solvability: { solutionBands: number; requiredCapabilitySets: readonly string[][] };
};
```

Generate four authored stages—Rootway, Memory Trial, Root Master, Heart Choice—from bounded rule tables. Vary topology, hazards, objectives, counters, and motifs using the squad signature and seed digest.

- [ ] **Step 4: Add a fail-closed solvability validator**

Search the bounded challenge graph using available traversal, element, ability tags, roles, stamina, and switch rules. Reject normal definitions with zero solution bands.

- [ ] **Step 5: Run tests**

Run: `node --import tsx --test tests/hearttree-expedition-director.test.ts tests/hearttree-card-capability.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/play/hearttree/expedition-director.ts tests/hearttree-expedition-director.test.ts
git commit -m "feat: generate solvable squad-driven Hearttree expeditions"
```

### Task 4: Fixed-Step Runtime, Skill Inputs, and Replay Transcript

**Files:**
- Create: `src/features/play/hearttree/runtime.ts`
- Create: `src/features/play/hearttree/transcript.ts`
- Create: `tests/hearttree-runtime.test.ts`
- Create: `tests/hearttree-replay.test.ts`

**Interfaces:**
- Consumes: expedition definition, capabilities, and `resolveHearttreeAction`.
- Produces: `createHearttreeRuntime(definition, squad)`, `stepHearttreeRuntime(state, input)`, `hearttreeTranscript(state)`, and `replayHearttreeTranscript(definition, squad, transcript)`.

- [ ] **Step 1: Write runtime tests**

Test movement against collision proxies, stamina, aim, dodge, guard, ability use, support use, safe-window and tactical switches, hazard damage, objective completion, boss telegraphs, extraction, and no action after terminal state.

```ts
const started = createHearttreeRuntime(definition, squad);
const moved = stepHearttreeRuntime(started, { sequence: 1, tick: 1, kind: "move", vector: { x: 1, z: 0 } });
assert.ok(moved.cards[moved.activeAssetId]!.position.x > started.cards[started.activeAssetId]!.position.x);
assert.throws(() => stepHearttreeRuntime(moved, { sequence: 1, tick: 2, kind: "dodge", vector: { x: 1, z: 0 } }), /hearttree_input_sequence_invalid/);
```

- [ ] **Step 2: Run and verify RED**

Run: `node --import tsx --test tests/hearttree-runtime.test.ts tests/hearttree-replay.test.ts`  
Expected: FAIL with missing runtime/transcript modules.

- [ ] **Step 3: Implement fixed-step state and bounded inputs**

Use a 60 Hz integer tick, numeric bounds, circle/capsule collision proxies, explicit update order, and allocation-light arrays. Reject non-finite positions, out-of-order sequences, inputs beyond the per-second cap, and unknown targets.

- [ ] **Step 4: Implement transcript digest and replay**

```ts
export type HearttreeTranscript = {
  schema: "receiz.wilds.hearttree_transcript.v1";
  expeditionId: string;
  squadPins: readonly { assetId: string; proofDigest: string }[];
  inputs: readonly HearttreeInput[];
  checkpoints: readonly { tick: number; stateDigest: string }[];
  finalStateDigest: string;
  digest: string;
};
```

Replay from tick zero and compare every checkpoint plus the final digest. Reject changed inputs, pins, checkpoints, or definition.

- [ ] **Step 5: Run tests**

Run: `node --import tsx --test tests/hearttree-runtime.test.ts tests/hearttree-replay.test.ts tests/battle-engine.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/play/hearttree/runtime.ts src/features/play/hearttree/transcript.ts tests/hearttree-runtime.test.ts tests/hearttree-replay.test.ts
git commit -m "feat: add skill-based Hearttree runtime and deterministic replay"
```

### Task 5: Contribution XP, Injuries, Upgrades, and Irreversible Death

**Files:**
- Create: `src/features/play/hearttree/consequences.ts`
- Create: `src/features/play/hearttree/receipt.ts`
- Create: `tests/hearttree-consequences.test.ts`

**Interfaces:**
- Consumes: verified replay result, prior `HearttreeCardCondition` values, and explicit Mortal consent.
- Produces: `HearttreeConsequenceSet`, `projectHearttreeConsequences(input)`, `applyHearttreeConsequences(prior, consequences)`, `HearttreeReceipt`, and `verifyHearttreeReceipt(receipt)`.

- [ ] **Step 1: Write consequence invariants first**

```ts
assert.equal(projectHearttreeConsequences(successfulReplay).cards[id]!.xp > 0, true);
assert.equal(projectHearttreeConsequences(idleSupportReplay).cards[supportId]!.xp, 0);
assert.throws(() => projectHearttreeConsequences({ ...networkFailure, mortalConsent: true }), /hearttree_replay_required/);
const dead = applyHearttreeConsequences(alive, mortalDeath);
assert.equal(dead.life, "dead");
assert.throws(() => applyHearttreeConsequences(dead, resurrectionAttempt), /hearttree_death_irreversible/);
```

Test event deduplication, diminishing repeated mastery, bounded XP, specific injury causes, extraction, upgrade choice count, no partial mutation, and death only from a replayed Mortal terminal state with matching consent pins.

- [ ] **Step 2: Run and verify RED**

Run: `node --import tsx --test tests/hearttree-consequences.test.ts`  
Expected: FAIL with missing consequence module.

- [ ] **Step 3: Implement contribution accounting and condition transitions**

Award XP from unique resolved contribution events. Create injuries only from recorded threshold crossings. Produce at most three bounded upgrade offers, derived from the card's actual actions and mastery opportunities.

- [ ] **Step 4: Implement permanent death and canonical receipt verification**

The receipt includes expedition, transcript, prior-condition, consequence, actor, publication-revision, and digest fields. `verifyHearttreeReceipt` recomputes the digest and validates irreversible life transitions.

- [ ] **Step 5: Run tests**

Run: `node --import tsx --test tests/hearttree-consequences.test.ts tests/growth-engine.test.ts tests/living-card-proof.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/play/hearttree/consequences.ts src/features/play/hearttree/receipt.ts tests/hearttree-consequences.test.ts
git commit -m "feat: make Hearttree consequences persistent and irreversible"
```

### Task 6: Receiz Replay Admission and Atomic Publication

**Files:**
- Create: `src/lib/receiz/wilds-hearttree-server.ts`
- Create: `app/api/wilds/hearttree/route.ts`
- Create: `tests/wilds-hearttree-server.test.ts`

**Interfaces:**
- Consumes: actor resolved by `resolveWildsMultiplayerActor`, submitted definition/transcript/cards/conditions/consent, `createReceizCommerceAdapter`, and Tasks 3–5 replay/consequence functions.
- Produces: `executeHearttreeAdmission(request, body)` returning `{ receipt, publication: { published, mode, revision } }`.

- [ ] **Step 1: Write server tests with injected publication adapter**

Test live publication, practice-mode noncanonical results, ownership mismatch, changed proof pin, tampered replay, duplicate idempotency key, publish rollback, and audit failure. Assert that failed publication returns no adopted injury, reward, or death receipt.

- [ ] **Step 2: Run and verify RED**

Run: `node --import tsx --test tests/wilds-hearttree-server.test.ts`  
Expected: FAIL with missing server module.

- [ ] **Step 3: Implement admission service following the existing world-server rollback pattern**

Replay the transcript, derive consequences, build the receipt, then publish `wilds:hearttree:v1:<actorId>` through `publishPublicStore` using `hearttree:<receiptDigest>` as the idempotency key. Keep a bounded receipt tail and latest condition projection. Restore the pre-command projection if publication fails.

- [ ] **Step 4: Implement the App Router endpoint**

```ts
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ ok: true, ...await executeHearttreeAdmission(request, await request.json()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "wilds_hearttree_admission_failed";
    return NextResponse.json({ ok: false, error: message }, { status: message.includes("authority") ? 403 : 400 });
  }
}
```

- [ ] **Step 5: Run tests**

Run: `node --import tsx --test tests/wilds-hearttree-server.test.ts tests/wilds-world-service.test.ts tests/receiz-app-contract.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/receiz/wilds-hearttree-server.ts app/api/wilds/hearttree/route.ts tests/wilds-hearttree-server.test.ts
git commit -m "feat: admit Hearttree outcomes through Receiz authority"
```

### Task 7: Save v9, Squad Selection, and Dead-Card Guards

**Files:**
- Modify: `src/features/play/game-state.ts`
- Modify: `src/features/play/PlayCampaign.tsx`
- Create: `tests/hearttree-play-state.test.ts`
- Modify: `tests/play-game-state.test.ts`

**Interfaces:**
- Consumes: verified `HearttreeReceipt` and `HearttreeCardCondition`.
- Produces: `PlayState.hearttreeConditions`, `PlayState.hearttreeReceipts`, `PlayInput` variants `hearttree-admit` and `hearttree-select-squad`, plus `playableInventory(state)`.

- [ ] **Step 1: Write migration and guard tests**

Assert v8 saves migrate to empty alive conditions, accepted receipts update only matching cards, duplicate receipts are idempotent, dead cards remain in inventory, dead cards cannot be selected/trained/battled/traded/bred/admitted, and restore cannot overwrite dead with alive.

- [ ] **Step 2: Run and verify RED**

Run: `node --import tsx --test tests/hearttree-play-state.test.ts tests/play-game-state.test.ts`  
Expected: FAIL because save v9 and Hearttree inputs do not exist.

- [ ] **Step 3: Add save v9 and migration**

```ts
hearttreeConditions: Record<string, HearttreeCardCondition>;
hearttreeReceipts: HearttreeReceipt[];
hearttreeSquadAssetIds: string[];
```

Set `PLAY_SAVE_SCHEMA` to `receiz.wilds.save.v9`, add v8 to legacy schemas, bound receipts to 512, and intersect squad IDs with living playable inventory.

- [ ] **Step 4: Apply verified receipts atomically and guard every card-use path**

Centralize `isPlayableAsset(state, assetId)` and use it in selection, training, battle, fusion/lineage, exchange projection, mission, raid, and Hearttree admission. Do not delete dead cards.

- [ ] **Step 5: Connect `PlayCampaign` to the Hearttree endpoint and reducer**

Pass one-to-three selected cards, prior conditions, actor/world mode, and an `onReceipt` callback. Practice mode can run but cannot adopt persistent XP, injury, upgrade, or death.

- [ ] **Step 6: Run tests**

Run: `node --import tsx --test tests/hearttree-play-state.test.ts tests/play-game-state.test.ts tests/card-fusion.test.ts tests/proof-exchange.test.ts`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/play/game-state.ts src/features/play/PlayCampaign.tsx tests/hearttree-play-state.test.ts tests/play-game-state.test.ts
git commit -m "feat: persist Hearttree squads conditions and deaths"
```

### Task 8: Playable Three.js Hearttree Scene, HUD, and Controls

**Files:**
- Create: `src/features/play/hearttree/HearttreeExpedition.tsx`
- Create: `src/features/play/hearttree/HearttreeScene.tsx`
- Create: `src/features/play/hearttree/HearttreeControls.tsx`
- Modify: `src/features/play/WildsLandmarkExperience.tsx`
- Modify: `app/globals.css`
- Create: `tests/hearttree-ui-contract.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`
- Modify: `tests/mobile-layout-css.test.ts`

**Interfaces:**
- Consumes: squad, conditions, world mode, generated definition, runtime, transcript, admission endpoint, and audio event callback.
- Produces: a playable modal experience with squad gate, exploration, puzzle, boss, extraction, Mortal consent, and result ceremony.

- [ ] **Step 1: Write UI and responsive contract tests**

Assert the replacement uses `Canvas`, runtime inputs, actual squad cards, health/stamina/cooldowns, card switching, objective state, extraction, explicit Mortal confirmation listing risk pins, captions, reduced motion, touch controls, and no imports of `createHearttreeTrial` or `applyHearttreeIntent`.

- [ ] **Step 2: Run and verify RED**

Run: `node --import tsx --test tests/hearttree-ui-contract.test.ts tests/wilds-render-contract.test.ts tests/mobile-layout-css.test.ts`  
Expected: FAIL because the new Hearttree components do not exist.

- [ ] **Step 3: Build the squad gate and accessible HUD**

Use actual inventory cards and capability explanations. Display entry count, strengths, liabilities, known interactions, life/condition, and proof pin. Disable entry until all declared requirements pass.

- [ ] **Step 4: Build the 3D scene and real input path**

Render authored chamber kits from the expedition definition, card actors using existing Heartbound render identity, collision-debug proxies behind a diagnostic flag, root hazards, mechanisms, telegraphs, Root Master phases, camera follow, and spatial anchors. Connect keyboard and touch inputs to fixed-step runtime events rather than direct state shortcuts.

- [ ] **Step 5: Build extraction, result, and Mortal confirmation**

Mortal confirmation must name every card at risk and require an unchecked-to-checked acknowledgement plus a deliberate second action. Present pending publication separately from canonical receipt adoption.

- [ ] **Step 6: Replace only the Hearttree branch in `WildsLandmarkExperience`**

Keep Arena and Prism behavior stable. Remove `hearttree-trial.ts` only after no production or test import remains.

- [ ] **Step 7: Run focused tests and typecheck**

Run: `node --import tsx --test tests/hearttree-ui-contract.test.ts tests/wilds-render-contract.test.ts tests/mobile-layout-css.test.ts && pnpm typecheck`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/play/hearttree src/features/play/WildsLandmarkExperience.tsx src/features/play/hearttree-trial.ts app/globals.css tests/hearttree-ui-contract.test.ts tests/wilds-render-contract.test.ts tests/mobile-layout-css.test.ts
git commit -m "feat: replace Hearttree buttons with a playable 3D expedition"
```

### Task 9: Official Local Hearttree Music and Sound Package

**Files:**
- Create: `assets-src/audio/hearttree/SOURCES.md`
- Create: `assets-src/audio/hearttree/licenses.json`
- Create: `public/audio/wilds/hearttree/manifest.json`
- Create: `scripts/validate-hearttree-audio.mjs`
- Modify: `src/features/play/audio/wilds-audio-types.ts`
- Modify: `src/features/play/audio/wilds-audio-catalog.ts`
- Modify: `src/features/play/audio/wilds-audio-director.ts`
- Modify: `package.json`
- Create: `tests/hearttree-audio.test.ts`
- Create binary outputs under: `public/audio/wilds/hearttree/`

**Interfaces:**
- Consumes: runtime events, card elements/lineage motifs, audio loader/mixer, original recordings, and license-audited CC0 source recordings.
- Produces: `hearttree:*` audio bank entries and `hearttreeAudioEvent(event)` routing.

- [ ] **Step 1: Create the failing asset and metadata gate**

Require these groups in `manifest.json`: exterior/interior ambience; exploration/mystery/danger/mastery/boss/victory/extraction/memorial stems; Grove/Spark/Tide/Stone motifs; movement/root/leaf/wood/stone/water/energy/mechanism/ability/guard/dodge/switch/impact/injury/reward/extraction/death/UI effects. Require `source`, `author`, `license`, `edits`, `durationSeconds`, `integratedLufs`, `truePeakDb`, `loopStart`, `loopEnd`, and SHA-256.

Run: `node scripts/validate-hearttree-audio.mjs`  
Expected: FAIL listing every missing production file.

- [ ] **Step 2: Acquire or record only approved source material**

Accept internal original recordings and CC0 sources. Record the exact source URL or recording session, author, license text, download date, and modifications in `licenses.json`. Reject attribution-only, noncommercial, ambiguous, AI-service, or redistribution-prohibited sources for this no-dependency official pack.

- [ ] **Step 3: Produce and master the local assets offline**

Compose layered music from real sampled instruments, edit performed material sounds, create seamless ambience/music loops, and export archival WAV plus runtime MP3 at 44.1 kHz/128 kbps. Target music around `-16 LUFS`, ambience around `-20 LUFS`, effects around `-18 LUFS`, and true peak at or below `-1 dBTP`; preserve headroom for runtime mixing.

- [ ] **Step 4: Add generated catalog metadata and event routing**

Mark shipped files `status: "generated"` with `provider: "internal-authored"` or `"open-source-offline"`. Map exploration state, boss phases, injury, extraction, death, and card-element motifs to separate buses and layers. Omit narrator/Root Master dialogue until real-performer recordings and rights are present.

- [ ] **Step 5: Write and run audio runtime tests**

Test every manifest path exists, every catalog ID is unique, no planned Hearttree asset remains, loops have valid endpoints, missing audio does not change simulation, element motifs follow the admitted squad, death suppresses victory, and pause/resume preserves layer state.

Run: `node --import tsx --test tests/hearttree-audio.test.ts tests/wilds-audio-catalog.test.ts tests/wilds-audio-director.test.ts && node scripts/validate-hearttree-audio.mjs`  
Expected: PASS with zero missing, undecodable, unlicensed, tone-placeholder, or loudness failures.

- [ ] **Step 6: Commit**

```bash
git add assets-src/audio/hearttree public/audio/wilds/hearttree scripts/validate-hearttree-audio.mjs src/features/play/audio package.json tests/hearttree-audio.test.ts
git commit -m "feat: ship the official local Hearttree score and soundscape"
```

### Task 10: Browser Playtest, Accessibility, Performance, and Game-Balance Evidence

**Files:**
- Create: `docs/superpowers/evidence/2026-07-16-hearttree-production-slice.md`
- Create: `tests/hearttree-release.test.ts`
- Modify: Hearttree implementation files only where evidence finds a defect.

**Interfaces:**
- Consumes: the complete vertical slice.
- Produces: reproducible release evidence and regression gates.

- [ ] **Step 1: Add release-contract tests**

Assert all required domain/UI/audio files exist, obsolete Hearttree button labels are absent, release scripts include Hearttree audio/replay gates, save schema is v9, and the canonical endpoint exists.

- [ ] **Step 2: Run and verify RED before wiring final release gates**

Run: `node --import tsx --test tests/hearttree-release.test.ts`  
Expected: FAIL until the release script and evidence contract are complete.

- [ ] **Step 3: Run representative deterministic playtests**

Exercise at least: one Grove card; one flying Spark card; a Tide/Grove pair; a three-card mixed squad; an injured squad; extraction; normal defeat; successful Root Master; Mortal refusal; Mortal accepted survival; Mortal accepted death. Record duration, chosen route, card actions, XP, injury, upgrade, audio state, and replay digest.

- [ ] **Step 4: Run real browser verification**

Start with `pnpm start -p 3001`. Verify desktop and 320 px/430 px mobile layouts, keyboard, touch, audio unlock, mute, reduced motion, captions, focus restoration, reload/checkpoint recovery, console errors, nonblank Three.js pixels, objective, fail/extract, reward, and death paths. Capture screenshots into `output/playwright/hearttree/`.

- [ ] **Step 5: Profile and tune**

Record renderer diagnostics, draw calls, triangles, texture memory, decoded audio bytes, long tasks, average frame time, and worst frame time on desktop and mobile profiles. Fix any collision, input, camera, layout, audio, or performance issue before documenting the evidence.

- [ ] **Step 6: Complete evidence and pass the release contract**

Run: `node --import tsx --test tests/hearttree-release.test.ts`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/evidence/2026-07-16-hearttree-production-slice.md tests/hearttree-release.test.ts src/features/play/hearttree app/globals.css output/playwright/hearttree
git commit -m "test: qualify the Hearttree production expedition"
```

### Task 11: Full Release Qualification and Documentation

**Files:**
- Modify: `scripts/release-check.mjs`
- Modify: `RELEASE_NOTES.md`
- Modify: `docs/SDK_RAILS.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: a fully qualified, documented Hearttree release on `main`.

- [ ] **Step 1: Add Hearttree gates to the release sequence**

Add `pnpm validate:audio:hearttree` and the focused replay/release tests before lint/build. Keep secret scan, complete tests, typecheck, Receiz check/conformance, lint, production build, and doctor.

- [ ] **Step 2: Document exact shipped behavior and remaining program sequence**

State that Hearttree is complete, list controls and authority boundaries, disclose that human dialogue remains omitted until real-performer recordings are rights-cleared if those files are not present, and list Arena, Prism, Wayfinder, ecology, boss, and cast expansion as later production slices without claiming they are complete.

- [ ] **Step 3: Stage the exact release contents and run the complete gate**

Run: `git add -A && pnpm release:check`  
Expected: secret scan PASS; all tests PASS; typecheck PASS; Receiz integration and 13 conformance checks PASS; Hearttree audio validation PASS; lint PASS; optimized production build PASS; doctor reports no missing requirements or warnings.

- [ ] **Step 4: Inspect the final diff and commit**

Run: `git diff --cached --check && git status --short`  
Expected: no whitespace errors and only Hearttree/audio/release files intended by this plan.

```bash
git commit -m "feat: ship the real-card Hearttree expedition"
```

## Plan Completion Review

Before claiming completion, confirm every approved design section has implementation evidence:

- exact card simulation — Tasks 1–2;
- dynamic solvable expedition — Task 3;
- skill-based 3D runtime and deterministic replay — Tasks 4 and 8;
- contribution experience, upgrades, injury, extraction, and death — Tasks 5 and 7;
- Receiz authority and atomicity — Task 6;
- official local music and sound — Task 9;
- accessibility, browser, performance, duration, and replayability evidence — Task 10;
- full repository release qualification — Task 11.
