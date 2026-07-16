# Wilds Flagship Arena Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first mobile-first Wilds Arena vertical slice in which up to three proof-pinned cards become directly controlled 3D fighters against strategic NPCs and one multi-phase boss, with deterministic mortal combat, portable offline progression, replay verification, recovery, and memorial history.

**Architecture:** A pure fixed-step TypeScript kernel projects exact cards into physical fighters, resolves semantic input frames, runs legal NPC inputs, and replays content-addressed transcripts. React Three Fiber renders one bounded modular arena and character system; native Web Crypto, IndexedDB, portable cards/Vaults, and a Receiz admission boundary preserve causal offline history and atomically adopt globally replayed results.

**Tech Stack:** TypeScript, React 19, Next.js 15 App Router, Three.js, React Three Fiber, native Web Workers, Web Crypto, IndexedDB, Node test runner, Receiz SDK/MCP/AI Skills v105, native Web Audio/HTML media, pnpm.

## Global Constraints

- Preserve the existing capture battle until Arena migration is separately approved; the new Arena is a distinct mode and engine.
- First slice supports one to three owned living cards per team, one active fighter, NPC tiers, and one multi-phase boss; live PvP remains protocol-compatible but disabled.
- Arena entry is the mortal opt-in. Verified zero Vitality permanently retires that fighter even if its team later wins.
- Practice mode cannot produce canonical XP, rewards, history, injury, ranking, or retirement.
- Exact proof, form, genome, stats, named abilities, element, anatomy, locomotion, condition, injuries, mastery, upgrades, relationships, equipment, position, timing, stamina, focus, cooldown, and action order must matter.
- Identical seed, ruleset, parent revisions, loadout, and input frames must reproduce every state, event, consequence, receipt, and checkpoint.
- Offline solo play must atomically persist complete input traces, receipts, card revisions, inventory changes, and Vault state as exportable portable artifacts.
- Causal merge deduplicates rewards, preserves valid spending and injuries, makes retirement dominate stale living branches, and fails closed on ownership or settlement conflict.
- Add no heavy runtime engine, character dependency, cloud service, external runtime audio URL, browser/synthetic voice, oscillator fallback, or third-party sound dependency.
- Use one renderer; normal 1v1 play must remain at or below 140 draw calls, 180,000 visible triangles, and 8 primary texture pages.
- Target 60 FPS on capable phones, provide a frame-paced 30 FPS fallback, and keep local input-to-visible-feedback below 100 ms.
- Controls must fit 320px without gameplay page scrolling, expose 44px targets, support safe areas, keyboard, touch, controller, reduced motion, mute, background, and focus recovery.
- Keep Receiz SDK, MCP, and AI Skills aligned at v105.0.0.

---

## File Structure

### Arena domain

- Create `src/features/play/arena/rules.ts`: constants, vectors, bounds, frame validation, and ruleset digest.
- Create `src/features/play/arena/card-fighter.ts`: exact card-to-fighter projection and living revision pin.
- Create `src/features/play/arena/movement.ts`: deterministic ground, jump, aerial, ledge, fall, and collision movement.
- Create `src/features/play/arena/combat.ts`: light/heavy chains, guard, parry, dodge, Break, ability, hit, damage, and status rules.
- Create `src/features/play/arena/runtime.ts`: teams, tags, items, arena mechanisms, withdrawal, hazards, mortality, events, and fixed-step reducer.
- Create `src/features/play/arena/opponent.ts`: observable-state NPC policies and difficulty reaction limits.
- Create `src/features/play/arena/campaign.ts`: Arena Path, levels, checkpoint, boss definition, and solvability validation.
- Create `src/features/play/arena/transcript.ts`: checkpoints, digest, deterministic replay, and mutation rejection.
- Create `src/features/play/arena/consequences.ts`: XP, mastery, injury, scars, relationship, achievement, evolution, resources, retirement, epitaph, and memorial.
- Create `src/features/play/arena/receipt.ts`: self-verifying match receipt.
- Create `tests/support/arena-fixtures.ts`: verified cards, revisions, teams, arenas, traces, receipts, and dependency fakes.

### Offline and global authority

- Create `src/features/play/arena/living-revision.ts`: parent-linked portable card revision chain.
- Create `src/features/play/arena/offline-ledger.ts`: pending events, deterministic causal merge, and atomic transaction shape.
- Create `src/features/play/arena/offline-store.ts`: native IndexedDB transaction and memory test adapter.
- Create `src/features/play/arena/device-signature.ts`: native P-256 receipt signing and verification.
- Modify `src/features/play/wilds-player-vault.ts`, `src/features/play/card-export.ts`, and `src/features/play/game-state.ts`.
- Create `src/lib/receiz/wilds-arena-server.ts` and `app/api/wilds/arena/sync/route.ts`.

### Presentation

- Create `src/features/play/arena/ArenaExperience.tsx`, `ArenaScene.tsx`, `ArenaFighter.tsx`, `ArenaControls.tsx`, `ArenaHud.tsx`, and `arena-worker.ts`.
- Modify `src/features/play/PlayCampaign.tsx`, `src/features/play/WildsInventory.tsx`, `src/features/play/audio/wilds-audio-catalog.ts`, `src/features/play/audio/wilds-audio-director.ts`, `src/features/play/use-wilds-presentation.ts`, and `app/globals.css`.
- Create one bounded local Arena audio bank and provenance manifest under `assets-src/audio/arena/` and `public/audio/wilds/arena/`.

---

### Task 1: Parent-linked living revisions and retirement state

**Files:**
- Create: `src/features/play/arena/living-revision.ts`
- Modify: `src/features/play/adventure/card-condition.ts`
- Test: `tests/arena-living-revision.test.ts`
- Test: `tests/adventure-card-condition.test.ts`

**Interfaces:**

```ts
export type ArenaLifeState = "healthy" | "strained" | "wounded" | "critical" | "mortal" | "retired";
export type ArenaLivingRevision = Readonly<{
  schema: "receiz.wilds.arena_living_revision.v1"; assetId: string; revision: number;
  parentDigest: string | null; eventId: string; rulesetId: string; occurredAt: string;
  condition: AdventureCardCondition; lifeState: ArenaLifeState; scarIds: readonly string[];
  relationshipIds: readonly string[]; achievementIds: readonly string[];
  evolutionIds: readonly string[]; matchReceiptDigests: readonly string[]; digest: string;
}>;
export function createArenaLivingRevision(input: ArenaLivingRevisionInput): ArenaLivingRevision;
export function verifyArenaLivingRevision(revision: ArenaLivingRevision, parent?: ArenaLivingRevision): ArenaRevisionVerification;
```

- [x] Write failing tests for genesis, parent digest/revision, canonical digest, bounded fields, life-state derivation, old-parent rejection, and irreversible `retired` dominance.
- [x] Run `node --import tsx --test tests/arena-living-revision.test.ts tests/adventure-card-condition.test.ts`; expect failure.
- [x] Extend the shared condition with compatibility-safe `retiredAt`, `retirementCauseEventId`, and optional embodied recovery metadata while preserving Save V10 defaults and `life: "dead"` interoperability.
- [x] Implement revision creation/verification; any retired revision must carry `condition.life === "dead"` and no descendant may return to alive.
- [x] Run focused and Hearttree/Market consequence tests; expect PASS.
- [x] Commit with `git commit -m "feat: append living Arena revisions"`.

### Task 2: Arena ruleset and exact fighter projection

**Files:**
- Create: `src/features/play/arena/rules.ts`
- Create: `src/features/play/arena/card-fighter.ts`
- Create: `tests/support/arena-fixtures.ts`
- Test: `tests/arena-card-fighter.test.ts`

**Interfaces:**

```ts
export const ARENA_RULESET_ID = "wilds.arena.v1" as const;
export type ArenaVec3 = Readonly<{ x: number; y: number; z: number }>;
export type ArenaFrame = number;
export type ArenaBodyFamily = "quadruped" | "biped" | "serpentine" | "winged" | "aquatic" | "heavy" | "small" | "hybrid";
export type ArenaFighterDefinition = Readonly<{
  assetId: string; proofDigest: string; revisionDigest: string; formId: string; familyId: string;
  name: string; element: string; bodyFamily: ArenaBodyFamily; collision: ArenaCollisionBody;
  baseStats: CreatureStats; stats: CreatureStats; abilityNames: readonly [string, string];
  abilityPowers: readonly [number, number]; locomotion: readonly ArenaLocomotion[];
  condition: AdventureCardCondition; maxVitality: number; maxBreak: number;
  moveSpeed: number; jumpImpulse: number; airControl: number; mass: number; reach: number;
}>;
export function projectArenaFighter(card: PortableCardAsset, revision: ArenaLivingRevision): ArenaFighterDefinition;
```

- [x] **Step 1: Write the failing projection tests** proving proof/revision pins, exact stats and abilities, anatomy/body family, wing/limb injuries, fatigue, retired rejection, collision bounds, and material differences between Mintcub, Voltray, Ledgerfox, and Titanseal.
- [x] **Step 2: Run** `node --import tsx --test tests/arena-card-fighter.test.ts`; expect module-not-found failure.
- [x] **Step 3: Implement** bounded constants and `projectArenaFighter` using `verifyAnyWildsCard`, `creatureForm`, `effectiveAdventureStats`, and the revision validator. Named abilities must match the catalog exactly.
- [x] **Step 4: Run** the focused test plus `tests/hearttree-card-capability.test.ts` and `tests/market-card-role.test.ts`; expect PASS.
- [x] **Step 5: Commit** with `git commit -m "feat: project cards into Arena fighters"`.

### Task 3: Deterministic 3D movement and collision

**Files:**
- Create: `src/features/play/arena/movement.ts`
- Test: `tests/arena-movement.test.ts`

**Interfaces:**

```ts
export type ArenaMovementInput = Readonly<{ moveX: number; moveZ: number; jumpPressed: boolean; sprint: boolean }>;
export type ArenaKinematicState = Readonly<{ position: ArenaVec3; velocity: ArenaVec3; facing: ArenaVec3; grounded: boolean; recoveryCharges: number; fallFrames: number }>;
export function stepArenaMovement(definition: ArenaFighterDefinition, arena: ArenaStageDefinition, prior: ArenaKinematicState, input: ArenaMovementInput): ArenaMovementResult;
```

- [x] Write failing tests for ground acceleration, diagonal normalization, jump edge, aerial control, wing recovery, heavy mass, slope/obstacle collision, ledge recovery, fall damage event, stage bounds, finite numbers, and byte-identical 3,600-frame replay.
- [x] Run `node --import tsx --test tests/arena-movement.test.ts`; expect failure.
- [x] Implement integer-frame integration with quantized millimeter positions and velocities; use analytic capsule/box/cylinder collisions defined by the stage, never rendered mesh collision.
- [x] Run the test twice and compare terminal digests; expect identical PASS.
- [x] Commit with `git commit -m "feat: add deterministic Arena movement"`.

### Task 4: Vitality, Break, combos, defense, and exact abilities

**Files:**
- Create: `src/features/play/arena/combat.ts`
- Test: `tests/arena-combat.test.ts`

**Interfaces:**

```ts
export type ArenaCombatIntent =
  | { kind: "light" | "heavy"; direction: ArenaVec3 }
  | { kind: "guard" | "parry" | "dodge"; direction: ArenaVec3 }
  | { kind: "focus" }
  | { kind: "ability"; slot: 0 | 1; targetId: string | null };
export type ArenaCombatantState = Readonly<{ vitality: number; break: number; stamina: number; focus: number; action: ArenaActionState; cooldowns: readonly number[]; statuses: readonly ArenaStatus[] }>;
export function beginArenaAction(context: ArenaCombatContext, intent: ArenaCombatIntent): ArenaActionResolution;
export function resolveArenaHit(context: ArenaHitContext): ArenaHitResolution;
```

- [x] Write failing tests for directional light chains, heavy commitment, deterministic hit volumes, reach, mass, launches, guard reduction, Break depletion, parry windows, dodge invulnerability, focus, stamina, cooldowns, element soft counters, exact ability power/name, status, hit priority, and zero Vitality.
- [x] Run `node --import tsx --test tests/arena-combat.test.ts`; expect failure.
- [x] Implement frame-authored attack definitions derived from body family and exact catalog ability definitions. Random critical hits are excluded; every outcome follows visible state, timing, positioning, and sealed rules.
- [x] Run focused tests; expect PASS and no result derived from animation completion.
- [x] Commit with `git commit -m "feat: resolve skill-based Arena combat"`.

### Task 5: Team runtime, tags, arena systems, withdrawal, and mortality

**Files:**
- Create: `src/features/play/arena/runtime.ts`
- Test: `tests/arena-runtime.test.ts`

**Interfaces:**

```ts
export type ArenaInputFrame = Readonly<{ sequence: number; frame: number; actorId: string; movement: ArenaMovementInput; combat: ArenaCombatIntent | null; tagAssetId: string | null; contextTargetId: string | null; withdraw: boolean }>;
export type ArenaMatchState = Readonly<{ schema: "receiz.wilds.arena_match.v1"; id: string; rulesetId: typeof ARENA_RULESET_ID; seed: string; frame: number; phase: "intro" | "active" | "paused" | "terminal"; teams: readonly [ArenaTeamState, ArenaTeamState]; stage: ArenaStageState; events: readonly ArenaEvent[]; terminal: ArenaTerminalState | null }>;
export function createArenaMatch(definition: ArenaMatchDefinition): ArenaMatchState;
export function advanceArenaMatch(state: ArenaMatchState, inputs: readonly ArenaInputFrame[]): ArenaMatchState;
```

- [x] Write failing tests for one-to-three-card admission, one active fighter, vulnerable tag windows, tag cancellation, retained condition, team rescue, healing/item spend, pickup, destructible mechanism, hazard, fall recovery, withdrawal, ordinary practice knockout, mortal zero, continued team play after death, and final terminal result.
- [x] Add structural rejection tests for bad sequence/frame/actor/vector/ability/tag/item/terminal input and for a dead or duplicate roster pin.
- [x] Run `node --import tsx --test tests/arena-runtime.test.ts`; expect failure.
- [x] Implement immutable frame reduction. The exact zero-Vitality frame emits one `fighter.retired` event in mortal mode; practice emits `fighter.knocked-out` and never changes persistent condition.
- [x] Run movement, combat, and runtime suites; expect PASS.
- [x] Commit with `git commit -m "feat: run mortal three-card Arena teams"`.

### Task 6: Fair NPC tiers and multi-phase boss campaign

**Files:**
- Create: `src/features/play/arena/opponent.ts`
- Create: `src/features/play/arena/campaign.ts`
- Test: `tests/arena-opponent.test.ts`
- Test: `tests/arena-campaign.test.ts`

**Interfaces:**

```ts
export type ArenaNpcTier = "learner" | "rival" | "champion" | "boss";
export function observeArenaForNpc(state: ArenaMatchState, actorId: string, tier: ArenaNpcTier): ArenaNpcObservation;
export function chooseArenaNpcInput(policy: ArenaNpcPolicy, observation: ArenaNpcObservation): ArenaInputFrame;
export function generateArenaPath(input: ArenaPathInput): ArenaPath;
export function validateArenaEncounterSolvability(encounter: ArenaEncounterDefinition, roster: readonly ArenaFighterDefinition[]): ArenaSolvabilityResult;
```

- [x] Write failing NPC tests proving no future/hidden input access, bounded reaction delay, legal cooldown/stamina, learner telegraphs, habit memory, champion counterplay, reproducibility, and different behavior by tier.
- [x] Write failing campaign tests for remembered checkpoint, teach-one-rule early encounters, three strategic rival levels, champion, multi-phase boss transformation, exact counter opportunities, roster-shaped recommendations, retreat-and-prepare, and solvability.
- [x] Run `node --import tsx --test tests/arena-opponent.test.ts tests/arena-campaign.test.ts`; expect failure.
- [x] Implement pure observation and policy modules. Boss phases may change stage hazards and legal actions only through sealed transition frames.
- [x] Run focused tests; expect PASS and no health-only difficulty scaling.
- [x] Commit with `git commit -m "feat: add fair Arena rivals and boss path"`.

### Task 7: Transcript replay, consequences, mortality, and receipt

**Files:**
- Create: `src/features/play/arena/transcript.ts`
- Create: `src/features/play/arena/consequences.ts`
- Create: `src/features/play/arena/receipt.ts`
- Test: `tests/arena-replay.test.ts`
- Test: `tests/arena-consequences.test.ts`
- Test: `tests/arena-receipt.test.ts`

**Interfaces:**

```ts
export type ArenaTranscript = Readonly<{ schema: "receiz.wilds.arena_transcript.v1"; matchId: string; rulesetId: string; definitionDigest: string; inputFrames: readonly ArenaInputFrame[]; checkpoints: readonly ArenaCheckpoint[]; digest: string }>;
export function replayArenaTranscript(definition: ArenaMatchDefinition, transcript: ArenaTranscript): ArenaReplayResult;
export function projectArenaConsequences(input: ArenaConsequenceInput): ArenaConsequenceSet;
export function sealArenaReceipt(input: ArenaReceiptInput): ArenaReceipt;
export function verifyArenaReceipt(receipt: ArenaReceipt): boolean;
```

- [x] Write failing replay mutation tests for seed, ruleset, roster proof/revision, loadout, frame, actor, vector, combat intent, tag, item, checkpoint, zero frame, terminal state, and digest.
- [x] Write failing consequence tests for contribution-grounded XP/mastery, bounded injury/scar/resource/achievement/evolution, relationship rescues, checkpoint history, winner with fallen teammate, practice zero awards, retirement epitaph, memorial, and deliberate-sacrifice anti-farming bounds.
- [x] Run all three focused suites; expect failure.
- [x] Implement checkpoints at frame 0, every 120 frames, phase/boss transitions, retirement, and terminal state. Receipt binds parents, definition, transcript, consequences, actor, mode, device/global authority, and publication state.
- [x] Run focused suites; expect PASS.
- [x] Commit with `git commit -m "feat: seal replayed Arena lives"`.

### Task 8: Device signatures and atomic offline ledger

**Files:**
- Create: `src/features/play/arena/device-signature.ts`
- Create: `src/features/play/arena/offline-ledger.ts`
- Create: `src/features/play/arena/offline-store.ts`
- Test: `tests/arena-device-signature.test.ts`
- Test: `tests/arena-offline-ledger.test.ts`
- Test: `tests/arena-offline-store.test.ts`

**Interfaces:**

```ts
export type ArenaDeviceIdentity = Readonly<{ id: string; algorithm: "ECDSA-P256-SHA256"; publicJwk: JsonWebKey }>;
export async function signArenaPendingReceipt(identityId: string, unsigned: ArenaPendingReceiptBasis, store: ArenaKeyStore): Promise<ArenaPendingReceipt>;
export async function verifyArenaPendingReceipt(receipt: ArenaPendingReceipt): Promise<boolean>;
export function mergeArenaCausalBranches(input: ArenaMergeInput): ArenaMergeResult;
export interface ArenaOfflineStore { commit(transaction: ArenaOfflineTransaction): Promise<ArenaOfflineSnapshot>; restore(playerId: string): Promise<ArenaOfflineSnapshot | null>; }
```

- [ ] Write Web Crypto tests for non-exportable P-256 private keys, public verification, tamper rejection, new-device identity, and content digest.
- [ ] Write merge tests for causal order, independent XP/history, reward deduplication, cumulative valid spend/injury, insufficient-resource conflict, retirement dominance, stale living events, ownership conflict, and inspectable rejection.
- [ ] Write atomic-store tests using the memory adapter: success updates receipt/cards/Vault together; injected failure changes none; duplicate transaction is idempotent.
- [ ] Run the three suites; expect failure.
- [ ] Implement native Web Crypto and IndexedDB stores without a dependency. Imported portable Vaults create a new device identity for future events while retaining old public identities and signed history.
- [ ] Run focused suites; expect PASS.
- [ ] Commit with `git commit -m "feat: commit offline Arena history atomically"`.

### Task 9: Portable card/Vault export and Save V10 integration

**Files:**
- Modify: `src/features/play/wilds-player-vault.ts`
- Modify: `src/features/play/card-export.ts`
- Modify: `src/features/play/game-state.ts`
- Modify: `src/features/play/WildsInventory.tsx`
- Test: `tests/arena-player-vault.test.ts`
- Test: `tests/card-export.test.ts`
- Test: `tests/play-game-state.test.ts`

- [ ] Write failing tests that Save V10 and Vault V3 default missing Arena fields, preserve pending events/revisions/receipts/conflicts/path/memorials, export and import them in the existing portable PNG, and reject digest mutation.
- [ ] Add tests ensuring retired cards remain visible but are excluded from battle, squads, training, growth, fusion, listing, staking, crafting inputs, and every active selector.
- [ ] Run the three suites; expect failure.
- [ ] Extend compatibility payloads without changing their schema names: `arenaPath`, `arenaLivingRevisions`, `arenaPendingReceiptTail`, `arenaReceiptTail`, `arenaConflictTail`, `arenaMemorials`, and `arenaDeviceIdentities`; cap all histories.
- [ ] Add a memorial card treatment and full life-history inspection to the existing Vault; never add an active action for retired cards.
- [ ] Run the focused suites plus Hearttree/Market play-state tests; expect PASS.
- [ ] Commit with `git commit -m "feat: carry Arena lives in portable Vaults"`.

### Task 10: Global replay and causal synchronization

**Files:**
- Create: `src/lib/receiz/wilds-arena-server.ts`
- Create: `app/api/wilds/arena/sync/route.ts`
- Test: `tests/wilds-arena-server.test.ts`

**Interfaces:**

```ts
export type ArenaGlobalProjection = Readonly<{ schema: "receiz.wilds.arena_projection.v1"; actorId: string; revision: number; admittedHeadDigests: Readonly<Record<string, string>>; arenaPath: ArenaPath; conditions: Readonly<Record<string, AdventureCardCondition>>; livingRevisions: Readonly<Record<string, ArenaLivingRevision>>; inventory: ArenaInventoryProjection; memorials: readonly ArenaMemorial[]; receiptTail: readonly ArenaReceipt[] }>;
export async function executeArenaSync(request: NextRequest, rawBody: unknown, dependencies?: ArenaSyncDependencies): Promise<ArenaSyncResult>;
```

- [ ] Write failing tests for actor, ownership, proof, device signature, parent, ruleset, replay, consequence, resource, retirement, duplicate, stale branch, incompatible branch, idempotency, publication, audit, rollback, and successful ordered multi-receipt sync.
- [ ] Run `node --import tsx --test tests/wilds-arena-server.test.ts`; expect failure.
- [ ] Implement no-store bounded POST admission. Independently replay every receipt from the last admitted causal anchor; publish and audit one atomic projection or admit nothing.
- [ ] Keep live PvP, matchmaking, ranking, tournament, ownership, auction, and stake capabilities disabled in this endpoint.
- [ ] Run focused tests and existing Market/Hearttree authority tests; expect PASS.
- [ ] Commit with `git commit -m "feat: synchronize offline Arena histories"`.

### Task 11: Modular animated fighters and tactical arena scene

**Files:**
- Create: `src/features/play/arena/ArenaFighter.tsx`
- Create: `src/features/play/arena/ArenaScene.tsx`
- Modify: `src/features/play/WildsCreatureActor.tsx`
- Test: `tests/arena-render-contract.test.ts`

- [ ] Write failing structural tests for all eight body families, persistent markings/scars, exact ability visual IDs, collision/render separation, idle/run/jump/recovery/light/heavy/guard/parry/dodge/Break/hurt/critical/ability/tag/rescue/victory/retirement poses, one renderer, pooled effects, and diagnostics.
- [ ] Run `node --import tsx --test tests/arena-render-contract.test.ts`; expect failure.
- [ ] Refactor shared creature identity geometry into reusable focused helpers while preserving existing world/card renders. Build fighter animation from deterministic runtime phase and normalized frame progress, never `performance.now()` for authoritative pose timing.
- [ ] Build one arena with elevation, cover, destructible geometry, hazard, recovery route, pickup, mechanism, non-color telegraphs, instanced debris, and quality-tier LOD.
- [ ] Run render contracts, typecheck, and existing world render tests; expect PASS.
- [ ] Commit with `git commit -m "feat: animate real cards in a 3D Arena"`.

### Task 12: Worker runtime, instant controls, HUD, and campaign flow

**Files:**
- Create: `src/features/play/arena/arena-worker.ts`
- Create: `src/features/play/arena/ArenaControls.tsx`
- Create: `src/features/play/arena/ArenaHud.tsx`
- Create: `src/features/play/arena/ArenaExperience.tsx`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `app/globals.css`
- Test: `tests/arena-ui-contract.test.ts`
- Test: `tests/arena-worker.test.ts`

- [ ] Write worker parity tests proving the worker and synchronous fallback return identical checkpoint digests for the same inputs and recover after worker failure.
- [ ] Write UI contract tests for card/team selection, condition/mortal disclosure, practice, remembered checkpoint, instant local feedback, keyboard/touch/controller inputs, buffered taps, aim assistance, tag, context action, flee, pause, background/focus, result, recovery, burial, memorial, and pending/global sync labels.
- [ ] Run focused tests; expect failure.
- [ ] Implement a typed worker message boundary carrying definitions, input frames, checkpoints, and states. Keep the synchronous reducer as the test oracle and fallback.
- [ ] Implement 44px controls, safe areas, no 320px page scroll, focus management, reduced motion, low-power profile, card/arena warming from selection, and semantic accessibility equivalents.
- [ ] Run focused tests, typecheck, and lint; expect PASS.
- [ ] Commit with `git commit -m "feat: make the Arena instant on mobile"`.

### Task 13: Real-recording combat audio and adaptive score

**Files:**
- Create: `assets-src/audio/arena/licenses.json`
- Create: `assets-src/audio/arena/source/*`
- Create: `assets-src/audio/arena/master/*`
- Create: `public/audio/wilds/arena/manifest.json`
- Create: `public/audio/wilds/arena/*.mp3`
- Modify: `src/features/play/audio/wilds-audio-catalog.ts`
- Modify: `src/features/play/audio/wilds-audio-director.ts`
- Modify: `src/features/play/use-wilds-presentation.ts`
- Test: `tests/arena-audio.test.ts`

- [ ] Write failing tests for movement, body material, light/heavy impact, guard, parry, dodge, Break, both abilities, elements, terrain, hazard, tag, rescue, pickup, heal, critical, victory, defeat, retirement, burial, and boss-phase cues plus adaptive intensity and card motif.
- [ ] Add scans rejecting `createOscillator`, `OscillatorNode`, `speechSynthesis`, external audio URLs, cloud audio providers, and new runtime audio dependencies.
- [ ] Run `node --import tsx --test tests/arena-audio.test.ts tests/wilds-audio-catalog.test.ts`; expect failure.
- [ ] Following `threejs-audio-generator`, derive the first bank from audited CC0 real source masters and local FFmpeg only; record author, source, license, source hash, edit, duration, loudness, loop, and runtime mapping.
- [ ] Route only deterministic presentation events; audio failure degrades to silence and never changes input or simulation.
- [ ] Run catalog/provenance/decode/loop tests; expect PASS.
- [ ] Commit with `git commit -m "feat: score Arena combat with real recordings"`.

### Task 14: Performance qualification and release proof

**Files:**
- Modify only files required by discovered failures.
- Capture: `output/playwright/arena-desktop.png`
- Capture: `output/playwright/arena-390.png`
- Capture: `output/playwright/arena-320.png`
- Capture: `output/playwright/arena-memorial.png`

- [ ] Run `pnpm test`; expect zero failures.
- [ ] Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`; expect zero errors and no new warnings.
- [ ] Run audio provenance, external-URL, synthesis, secret, placeholder, oversized-asset, and unbounded-history scans; expect zero findings.
- [ ] Use the Playwright skill to complete learner, rival, champion, boss, practice, mortal-withdrawal, tag rescue, offline save/export/import, reconnect sync, retirement, burial, and memorial paths with keyboard and touch.
- [ ] Verify worker and fallback parity, offline reload, injected transaction failure, global rejection recovery, background/focus, mute, reduced motion, controller mapping, and no missing/decode requests or console errors.
- [ ] Record normal and peak diagnostics: at most 140 draw calls, 180,000 triangles, 8 texture pages, one renderer, stable 60 FPS target, stable 30 FPS fallback, and less than 100 ms local feedback.
- [ ] Verify desktop, 390px, and 320px captures have 44px targets, safe-area clearance, no horizontal overflow, and no gameplay page scrolling.
- [ ] Run `git diff --check` and inspect `git status --short`; commit only necessary qualification fixes with a specific message.
- [ ] Commit remaining release evidence with `git commit -m "feat: ship the Wilds flagship Arena"` only if uncommitted slice files remain.

---

## Plan Self-Review

- Spec sections 3–5 map to Tasks 1–5; NPCs, bosses, strategy, and learning map to Task 6.
- Replay, progression, mortality, memorial, and anti-farming map to Task 7.
- Portable offline authority, signatures, atomic transactions, export, causal merge, and global replay map to Tasks 8–10.
- Character identity, animation, arenas, mobile controls, worker parity, performance, and accessibility map to Tasks 11–12 and 14.
- Real local recording policy and adaptive combat score map to Task 13.
- The capture battle remains intact; live competitive systems are explicitly protocol-compatible and out of first-slice scope.
- Function and type names are consistent across producer and consumer tasks; every task has exact files, interfaces, failing verification, implementation boundary, passing verification, and commit checkpoint.
