# Echo Ruin Resonant Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Echo Ruin's generic three-button activity with a deterministic spatial-listening, route-deduction, and physical-restoration expedition whose exact card choices, player position, timing, consequences, and adaptive locally recorded score all matter.

**Architecture:** Pure TypeScript modules project proof-pinned cards, generate a solvable chamber/evidence graph, resolve listening and route logic, advance a fixed-step runtime, replay transcripts, and derive sealed consequences. React Three Fiber presents the admitted definition and emits semantic inputs; a server boundary independently checks identity, ownership, proofs, conditions, definition, replay, Mortal consent, publication, and audit before Save V10 adopts any progression.

**Tech Stack:** TypeScript, React 19, Next.js 15 App Router, Three.js, React Three Fiber, Node test runner, Receiz SDK/MCP/AI Skills v105, native Web Audio/HTML media, local FFmpeg build tooling, pnpm.

## Global Constraints

- Route only the `echo-ruin` ecology family to this experience; keep every other generic ecology module unchanged.
- Admit one to three living proof-pinned cards in Standard mode and exactly two or three in Mortal Descent.
- Standard injury and fatigue are bounded and nonlethal. Only separately consented, replay-proven Mortal squad defeat can permanently kill cards.
- Preserve irreversible death across every inventory, selection, battle, training, market, expedition, evolution, fusion, and trade boundary.
- Identical canonical inputs must reproduce the definition, solvability witness, runtime, transcript, consequences, and receipt.
- Every generated Standard and Mortal definition must be solvable under perfect play by its admitted squad.
- Use exact stats, named abilities, element, anatomy, locomotion, senses, injuries, fatigue, mastery, upgrades, position, timing, stamina, cooldowns, and action order.
- Never use client randomness, elapsed-time mastery, card wagering, fabricated value, automatic custody transfer, or generic success buttons.
- Runtime audio must be local, dependency-free, and made from provenance-audited CC0/open-source real recordings. Do not use oscillators, synthetic/browser speech, cloud generation, or external audio URLs.
- Human characters remain text and animation until original performed cast recordings and releases exist.
- Hold the detailed scene below 160 draw calls, 180,000 triangles, 110 geometries, 8 textures, and one WebGL renderer.
- Active play must fit 320px without horizontal overflow, expose 44px touch targets, support reduced motion, and provide non-audio evidence equivalents.
- Keep Receiz SDK, MCP, and AI Skills aligned at v105.0.0.

---

## File Structure

### Echo Ruin domain

- Create `src/features/play/echo-ruin/card-capability.ts`: exact ruin capability, sense, locomotion, and verb projection.
- Create `src/features/play/echo-ruin/director.ts`: deterministic chambers, symbols, echoes, evidence, route, hazards, anchors, rewards, and solvability witness.
- Create `src/features/play/echo-ruin/listening-resolver.ts`: positional listening, isolation, inspection, and evidence discovery.
- Create `src/features/play/echo-ruin/route-resolver.ts`: proposal editing, contradiction, decoy, commitment, and segment stabilization.
- Create `src/features/play/echo-ruin/action-resolver.ts`: traversal, guard, dodge, ability, anchor, hazard, and extraction rules.
- Create `src/features/play/echo-ruin/runtime.ts`: fixed-step authoritative state and semantic input reducer.
- Create `src/features/play/echo-ruin/transcript.ts`: checkpoints, digest, replay, and tamper rejection.
- Create `src/features/play/echo-ruin/consequences.ts`: XP, mastery, upgrades, relic, history, resources, injury, fatigue, aftermath, and mortality.
- Create `src/features/play/echo-ruin/receipt.ts`: self-verifying Echo Ruin receipt.
- Create `tests/support/echo-ruin-fixtures.ts`: verified cards, sites, definitions, transcripts, consents, and authority fakes.

### Authority and persistence

- Create `src/lib/receiz/wilds-echo-ruin-server.ts`: replay-based atomic admission.
- Create `app/api/wilds/echo-ruin/route.ts`: no-store POST endpoint.
- Modify `src/features/play/game-state.ts`: Echo receipt tail, relics, recovered history, aftermath, and dead-card guards in Save V10.

### Experience and audio

- Create `src/features/play/echo-ruin/EchoRuinExperience.tsx`, `EchoRuinScene.tsx`, and `EchoRuinControls.tsx`.
- Modify `src/features/play/WildsEcologyExperience.tsx`, `src/features/play/PlayCampaign.tsx`, and `app/globals.css`.
- Create `assets-src/audio/echo-ruin/licenses.json`, `assets-src/audio/echo-ruin/source/`, `assets-src/audio/echo-ruin/master/`, and `public/audio/wilds/echo-ruin/manifest.json`.
- Create `scripts/build-echo-ruin-audio.sh`, `scripts/generate-echo-ruin-audio-manifest.mjs`, and `scripts/validate-echo-ruin-audio.mjs`.
- Modify `src/features/play/audio/wilds-audio-catalog.ts`, `src/features/play/audio/wilds-audio-director.ts`, and `src/features/play/use-wilds-presentation.ts`.

---

### Task 1: Exact Echo Ruin card capability projection

**Files:**
- Create: `src/features/play/echo-ruin/card-capability.ts`
- Create: `tests/support/echo-ruin-fixtures.ts`
- Test: `tests/echo-ruin-card-capability.test.ts`

**Interfaces:**

```ts
export type EchoRuinVerb = "listen" | "isolate" | "inspect" | "trace" | "climb" | "swim" | "overfly" | "dig" | "brace" | "rotate" | "repair" | "power" | "cool" | "guard";
export type EchoRuinCapability = Readonly<{
  assetId: string; proofDigest: string; formId: string; familyId: string;
  stats: CreatureStats; baseStats: CreatureStats; element: string;
  abilityNames: readonly [string, string]; senses: readonly EchoRuinSense[];
  locomotion: readonly EchoRuinLocomotion[]; verbs: ReadonlySet<EchoRuinVerb>;
  condition: AdventureCardCondition; playable: boolean;
}>;
export function projectEchoRuinCard(card: PortableCardAsset, condition: AdventureCardCondition): EchoRuinCapability;
export function assertEchoRuinCardPlayable(capability: EchoRuinCapability): void;
```

- [ ] Write failing tests proving proof pins and exact stats are retained; Grove, Spark, Tide, and Stone yield their stated bounded interpretations; wing, limb, sense, fatigue, and injury changes remove or weaken real verbs; dead cards fail closed.
- [ ] Run `node --import tsx --test tests/echo-ruin-card-capability.test.ts`; expect module-not-found failure.
- [ ] Implement projection through `effectiveAdventureStats`, existing anatomy/ability catalogs, and semantic ability-name matching. Do not infer a verb from rarity alone.
- [ ] Run the focused test and `node --import tsx --test tests/adventure-card-condition.test.ts tests/hearttree-card-capability.test.ts tests/market-card-role.test.ts`; expect PASS.
- [ ] Commit with `git commit -m "feat: project exact Echo Ruin capabilities"`.

### Task 2: Deterministic chamber, evidence, and route director

**Files:**
- Create: `src/features/play/echo-ruin/director.ts`
- Modify: `tests/support/echo-ruin-fixtures.ts`
- Test: `tests/echo-ruin-director.test.ts`

**Interfaces:**

```ts
export type EchoRuinDefinition = Readonly<{
  schema: "receiz.wilds.echo_ruin_definition.v1"; id: string; digest: string;
  siteId: string; risk: "standard" | "mortal"; squadPins: readonly EchoRuinSquadPin[];
  chambers: readonly EchoRuinChamber[]; connections: readonly EchoRuinConnection[];
  symbols: readonly EchoRuinSymbol[]; emitters: readonly EchoRuinEmitter[];
  evidence: readonly EchoRuinEvidence[]; trueRoute: readonly string[];
  decoyRoutes: readonly (readonly string[])[]; hazards: readonly EchoRuinHazard[];
  anchors: readonly EchoRuinAnchor[]; rewardLimits: EchoRuinRewardLimits;
  scoreMap: EchoRuinScoreMap; aftermath: EchoRuinAftermath; witness: EchoRuinSolvabilityWitness;
}>;
export function generateEchoRuinDefinition(input: EchoRuinDirectorInput): EchoRuinDefinition;
export function validateEchoRuinSolvability(definition: EchoRuinDefinition, squad: readonly EchoRuinCapability[]): EchoRuinSolvabilityResult;
```

- [ ] Write failing tests for byte-identical generation, material squad differences, one/two/three-card Standard solutions, tighter but valid Mortal solutions, bounded graph size, reachable evidence, and rejection of a mutated impossible anchor.
- [ ] Run `node --import tsx --test tests/echo-ruin-director.test.ts`; expect failure because the director is absent.
- [ ] Implement canonical seeded selection and a bounded graph search that includes evidence access, movement verbs, stamina, cooldowns, anchor requirements, hazards, and extraction. Seal the digest only after the witness validates.
- [ ] Run the focused test; expect PASS with deterministic witnesses containing an attainable evidence set and complete action path.
- [ ] Commit with `git commit -m "feat: generate solvable Echo Ruin routes"`.

### Task 3: Positional listening and evidence resolution

**Files:**
- Create: `src/features/play/echo-ruin/listening-resolver.ts`
- Test: `tests/echo-ruin-listening-resolver.test.ts`

**Interfaces:**

```ts
export type EchoRuinListeningAction = Readonly<{ kind: "listen" | "isolate" | "inspect"; position: Vec2; emitterId?: string; targetId?: string; timingOffsetMs: number }>;
export type EchoRuinListeningResult = Readonly<{ discoveredEvidenceIds: readonly string[]; focusCost: number; ambiguity: number; direction: Vec2 | null; explanation: readonly string[] }>;
export function resolveEchoRuinListening(definition: EchoRuinDefinition, capability: EchoRuinCapability, knownEvidenceIds: readonly string[], focus: number, action: EchoRuinListeningAction): EchoRuinListeningResult;
```

- [ ] Write failing tests proving distance, direction, chamber material, timing, senses, bond, element, injury, and isolation affect disclosed evidence; wrong position returns sealed ambiguity rather than rerolling; visual inspection provides a non-audio path.
- [ ] Run `node --import tsx --test tests/echo-ruin-listening-resolver.test.ts`; expect missing-module failure.
- [ ] Implement pure quantized geometry and definition-owned thresholds; return explanation facts for UI and consequence attribution.
- [ ] Run the focused test twice and compare output; expect identical PASS results.
- [ ] Commit with `git commit -m "feat: resolve spatial Echo Ruin evidence"`.

### Task 4: Route deduction, decoys, and stabilization

**Files:**
- Create: `src/features/play/echo-ruin/route-resolver.ts`
- Test: `tests/echo-ruin-route-resolver.test.ts`

**Interfaces:**

```ts
export type EchoRuinRouteState = Readonly<{ proposal: readonly string[]; committed: boolean; stabilizedSegmentIds: readonly string[]; contradictionIds: readonly string[]; dissonance: number }>;
export type EchoRuinRouteAction = Readonly<{ kind: "pin" | "remove" | "reorder" | "commit"; symbolId?: string; from?: number; to?: number }>;
export function resolveEchoRuinRoute(definition: EchoRuinDefinition, knownEvidenceIds: readonly string[], prior: EchoRuinRouteState, action: EchoRuinRouteAction): EchoRuinRouteResolution;
```

- [ ] Write failing tests for editing, evidence-supported stabilization, reversed segments, accepted decoys, contradiction explanations, dissonance/hazard inheritance, and commit rejection when the proposal is malformed.
- [ ] Run `node --import tsx --test tests/echo-ruin-route-resolver.test.ts`; expect failure.
- [ ] Implement exact symbol-grammar constraints with no answer leakage: resolutions may identify supporting or contradicting evidence but never return `trueRoute`.
- [ ] Run focused director and route tests; expect PASS.
- [ ] Commit with `git commit -m "feat: make Echo Ruin routes deductive"`.

### Task 5: Physical action rules and fixed-step runtime

**Files:**
- Create: `src/features/play/echo-ruin/action-resolver.ts`
- Create: `src/features/play/echo-ruin/runtime.ts`
- Test: `tests/echo-ruin-action-resolver.test.ts`
- Test: `tests/echo-ruin-runtime.test.ts`

**Interfaces:**

```ts
export type EchoRuinInput =
  | { sequence: number; tick: number; kind: "move"; vector: Vec2 }
  | { sequence: number; tick: number; kind: "listen" | "isolate" | "inspect"; targetId?: string; timingOffsetMs: number }
  | { sequence: number; tick: number; kind: "route"; action: EchoRuinRouteAction }
  | { sequence: number; tick: number; kind: "guard" | "dodge"; vector?: Vec2; timingOffsetMs: number }
  | { sequence: number; tick: number; kind: "role-action"; verb: EchoRuinVerb; targetId: string; timingOffsetMs: number }
  | { sequence: number; tick: number; kind: "ability"; abilityName: string; targetId: string; timingOffsetMs: number }
  | { sequence: number; tick: number; kind: "switch"; assetId: string }
  | { sequence: number; tick: number; kind: "extract" };
export function createEchoRuinRuntime(definition: EchoRuinDefinition, squad: readonly EchoRuinCapability[]): EchoRuinRuntimeState;
export function advanceEchoRuinRuntime(state: EchoRuinRuntimeState, input: EchoRuinInput): EchoRuinRuntimeState;
```

- [ ] Write failing resolver tests for position, timing windows, required verbs, exact stats, element, anatomy, stamina, cooldown, guard, dodge, ability semantics, hazard damage, and anchor causality.
- [ ] Write failing runtime tests for valid phase progression `survey → deduction → restoration → result`, switching, extraction, ordinary defeat, Mortal squad defeat, and rejection of bad sequence/tick/vector/proof/action/terminal input.
- [ ] Run `node --import tsx --test tests/echo-ruin-action-resolver.test.ts tests/echo-ruin-runtime.test.ts`; expect failure.
- [ ] Implement pure resolution and immutable fixed-step state. Record attempted invalid semantic actions only when the sealed definition explicitly charges that attempt; structural invalid input throws before mutation.
- [ ] Run both tests plus director/listening/route tests; expect PASS.
- [ ] Commit with `git commit -m "feat: add skill-based Echo Ruin runtime"`.

### Task 6: Transcript checkpoints and deterministic replay

**Files:**
- Create: `src/features/play/echo-ruin/transcript.ts`
- Test: `tests/echo-ruin-replay.test.ts`

**Interfaces:**

```ts
export type EchoRuinTranscript = Readonly<{ schema: "receiz.wilds.echo_ruin_transcript.v1"; runtimeId: string; definitionDigest: string; inputs: readonly EchoRuinInput[]; checkpoints: readonly EchoRuinCheckpoint[]; digest: string }>;
export function createEchoRuinTranscript(state: EchoRuinRuntimeState): EchoRuinTranscript;
export function replayEchoRuinTranscript(definition: EchoRuinDefinition, squad: readonly EchoRuinCapability[], transcript: EchoRuinTranscript): EchoRuinReplayResult;
```

- [ ] Write failing tests for exact replay and mutation rejection of definition digest, proof pin, input order, tick, coordinate, target, ability, checkpoint, terminal state, and transcript digest.
- [ ] Run `node --import tsx --test tests/echo-ruin-replay.test.ts`; expect failure.
- [ ] Implement canonical checkpoint hashes at input 0, every 32 inputs, phase transitions, and terminal state; replay from the original definition rather than trusting client events.
- [ ] Run replay and runtime tests; expect PASS.
- [ ] Commit with `git commit -m "feat: replay Echo Ruin expeditions"`.

### Task 7: Replay-grounded consequences, mortality, and receipts

**Files:**
- Create: `src/features/play/echo-ruin/consequences.ts`
- Create: `src/features/play/echo-ruin/receipt.ts`
- Test: `tests/echo-ruin-consequences.test.ts`
- Test: `tests/echo-ruin-receipt.test.ts`

**Interfaces:**

```ts
export type EchoRuinMortalConsent = Readonly<{ schema: "receiz.wilds.echo_ruin_mortal_consent.v1"; actorId: string; definitionDigest: string; proofPinsDigest: string; startingConditionsDigest: string; lethalRule: "mortal-squad-defeat"; acknowledgedRisk: true; acknowledgedIrreversibility: true; issuedAt: string; digest: string }>;
export function projectEchoRuinConsequences(input: EchoRuinConsequenceInput): EchoRuinConsequenceSet;
export function applyEchoRuinConsequences(prior: Readonly<Record<string, AdventureCardCondition>>, set: EchoRuinConsequenceSet, receiptDigest: string): Readonly<Record<string, AdventureCardCondition>>;
export function sealEchoRuinReceipt(input: EchoRuinReceiptInput): EchoRuinReceipt;
export function verifyEchoRuinReceipt(receipt: EchoRuinReceipt): boolean;
```

- [ ] Write failing tests that award XP/mastery only for unique replayed contributions, cap resources and three evidence-grounded upgrades, bind relic/history to restored routes, distinguish extraction/defeat/completion, and prevent Standard death.
- [ ] Add Mortal tests requiring two or three cards and both acknowledgments; reject stale/wrong actor, definition, proofs, starting conditions, rule, timestamp, or digest; kill only on replay-proven Mortal squad defeat.
- [ ] Run `node --import tsx --test tests/echo-ruin-consequences.test.ts tests/echo-ruin-receipt.test.ts`; expect failure.
- [ ] Implement canonical deltas and a self-verifying receipt that binds definition, transcript, starting conditions, consequences, actor, revision, publication, and audit evidence.
- [ ] Run focused tests and `tests/adventure-card-condition.test.ts`; expect PASS.
- [ ] Commit with `git commit -m "feat: seal Echo Ruin consequences"`.

### Task 8: Receiz authority and atomic admission

**Files:**
- Create: `src/lib/receiz/wilds-echo-ruin-server.ts`
- Create: `app/api/wilds/echo-ruin/route.ts`
- Test: `tests/wilds-echo-ruin-server.test.ts`

**Interfaces:**

```ts
export type EchoRuinAdmissionProjection = Readonly<{ schema: "receiz.wilds.echo_ruin_projection.v1"; actorId: string; revision: number; conditions: Readonly<Record<string, AdventureCardCondition>>; resources: Readonly<Record<string, number>>; relicIds: readonly string[]; recoveredHistoryIds: readonly string[]; aftermathIds: readonly string[]; receiptTail: readonly EchoRuinReceipt[] }>;
export async function executeEchoRuinAdmission(request: NextRequest, rawBody: unknown, dependencies?: EchoRuinAdmissionDependencies): Promise<EchoRuinAdmissionResult>;
```

- [ ] Write failing tests for malformed body, auth, ownership, proof, living condition, duplicate squad, stale prior condition, definition digest/solvability, replay, consent, idempotency, practice preview, publication failure, audit failure, rollback, and successful atomic adoption.
- [ ] Run `node --import tsx --test tests/wilds-echo-ruin-server.test.ts`; expect missing-module failure.
- [ ] Implement the same fail-closed boundary order as `wilds-market-server.ts`, but regenerate/validate Echo definition and replay Echo transcript. Cache only complete practice results or fully published-and-audited live results.
- [ ] Implement `POST` with `Cache-Control: no-store`, bounded JSON parsing, stable error codes, and no client-supplied actor authority.
- [ ] Run server tests plus `tests/wilds-market-server.test.ts tests/wilds-hearttree-server.test.ts`; expect PASS.
- [ ] Commit with `git commit -m "feat: admit Echo Ruin outcomes through Receiz"`.

### Task 9: Save V10 persistence and irreversible guards

**Files:**
- Modify: `src/features/play/game-state.ts`
- Test: `tests/echo-ruin-play-state.test.ts`
- Test: `tests/play-game-state.test.ts`

- [ ] Write failing tests for receipt-tail migration, relic/history/aftermath deduplication, canonical projection adoption, stale revision rejection, idempotent adoption, dead-card exclusion from squad and every playable subsystem, and memorial inventory retention.
- [ ] Run `node --import tsx --test tests/echo-ruin-play-state.test.ts tests/play-game-state.test.ts`; expect new assertions to fail.
- [ ] Extend `PlayStateV10` without bumping the schema: `echoRuinReceipts`, `echoRuinRelicIds`, `recoveredHistoryIds`, and `echoRuinAftermathIds`; default missing fields losslessly and cap receipt history.
- [ ] Add `adoptEchoRuinProjection(state, projection)` and route all selection/playability checks through the shared living condition predicate.
- [ ] Run game-state, Hearttree play-state, and Market play-state suites; expect PASS.
- [ ] Commit with `git commit -m "feat: persist Echo Ruin progression"`.

### Task 10: Playable Three.js experience and responsive controls

**Files:**
- Create: `src/features/play/echo-ruin/EchoRuinExperience.tsx`
- Create: `src/features/play/echo-ruin/EchoRuinScene.tsx`
- Create: `src/features/play/echo-ruin/EchoRuinControls.tsx`
- Modify: `src/features/play/WildsEcologyExperience.tsx`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `app/globals.css`
- Test: `tests/echo-ruin-ui-contract.test.ts`
- Test: `tests/wilds-ecology-activity.test.ts`

- [ ] Write failing structural tests requiring `echo-ruin` routing, squad/risk gate, evidence log, route board, active-card state, semantic keyboard/touch controls, extraction/result/publication flow, pause, diagnostics, accessible labels, 44px targets, and no generic `listen → trace → align` rendering for Echo Ruin.
- [ ] Run `node --import tsx --test tests/echo-ruin-ui-contract.test.ts tests/wilds-ecology-activity.test.ts`; expect failure.
- [ ] Implement the experience as the owner of definition/runtime/transcript/admission state. `EchoRuinScene` renders only state-derived bounded geometry/VFX and emits no authoritative outcomes.
- [ ] Implement desktop WASD, E, Q, Space, R, 1–3, route board, pause, Escape and equivalent mobile movement/action pads. Represent direction, rhythm, and evidence with pulse shape, icon, text, and spatial indicators as well as sound.
- [ ] Preserve focus on open/close, stop input while paused/backgrounded, and fit the active HUD at 320px without page scrolling.
- [ ] Run focused UI tests, typecheck, and ESLint; expect PASS.
- [ ] Commit with `git commit -m "feat: replace Echo Ruin buttons with a playable expedition"`.

### Task 11: Dedicated adaptive score from real open recordings

**Files:**
- Create: `assets-src/audio/echo-ruin/licenses.json`
- Create: `assets-src/audio/echo-ruin/source/*`
- Create: `assets-src/audio/echo-ruin/master/*`
- Create: `public/audio/wilds/echo-ruin/manifest.json`
- Create: `public/audio/wilds/echo-ruin/*.mp3`
- Create: `scripts/build-echo-ruin-audio.sh`
- Create: `scripts/generate-echo-ruin-audio-manifest.mjs`
- Create: `scripts/validate-echo-ruin-audio.mjs`
- Modify: `src/features/play/audio/wilds-audio-catalog.ts`
- Modify: `src/features/play/audio/wilds-audio-director.ts`
- Modify: `src/features/play/use-wilds-presentation.ts`
- Test: `tests/echo-ruin-audio.test.ts`
- Test: `tests/wilds-audio-catalog.test.ts`

- [ ] Write failing tests requiring entrance, survey, deduction fragments, dissonance, per-anchor restoration layers, Mortal danger, victory, extraction, memorial, footsteps, stone/inscription/anchor/guard/dodge/injury/switch/relic/death cues; require local URLs, provenance, source hashes, loop metadata, loudness targets, and phase trigger mappings.
- [ ] Add a repository scan assertion rejecting `OscillatorNode`, `createOscillator`, `speechSynthesis`, external audio URLs, cloud audio providers, or new runtime audio packages in Echo code.
- [ ] Run `node --import tsx --test tests/echo-ruin-audio.test.ts tests/wilds-audio-catalog.test.ts`; expect missing catalog/assets failure.
- [ ] Following the `threejs-audio-generator` workflow, audit existing CC0 source masters first, add only source recordings with recorded author/source/license/hash, and render layered masters locally with FFmpeg. Use no generated tone, synthetic voice, or network runtime source.
- [ ] Normalize music near -16 LUFS, ambience near -20 LUFS, SFX near -14 LUFS with true peak at or below -1 dBTP; verify loops at boundaries and keep original source ledgers beside masters.
- [ ] Route runtime state to bounded crossfades: discovered symbols add motif fragments, contradictions add dissonance, restored anchors add synchronized layers, and terminal reason selects victory/extraction/memorial without affecting gameplay.
- [ ] Run `pnpm audio:validate`, focused audio tests, `ffprobe` decode/duration checks, and asset URL existence checks; expect PASS.
- [ ] Commit with `git commit -m "feat: score Echo Ruin with real recordings"`.

### Task 12: Full release qualification

**Files:**
- Modify only files required by failures discovered below.
- Capture: `output/playwright/echo-ruin-desktop.png`
- Capture: `output/playwright/echo-ruin-390.png`
- Capture: `output/playwright/echo-ruin-320.png`

- [ ] Run all repository tests with `pnpm test`; expect zero failures.
- [ ] Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`; expect zero errors and no new warnings.
- [ ] Run audio provenance/catalog validation and repository scans for secrets, synthesis APIs, external runtime audio, placeholder strings, and unchecked Echo receipts; expect zero findings.
- [ ] Start the production server and use the Playwright skill to complete a Standard run with keyboard and touch paths, verify a Mortal disclosure without confirming irreversible death, test extraction and publication failure recovery, pause/background/focus, mute and volume groups, reduced motion, and card switching.
- [ ] Capture desktop, 390px, and 320px states; assert no page scroll/overflow, no console errors, no failed asset/decode requests, all controls at least 44px, and diagnostics below 160 calls, 180,000 triangles, 110 geometries, 8 textures, one renderer.
- [ ] Run `git diff --check` and `git status --short`; review every changed file and commit any qualification fixes with a specific message.
- [ ] Commit the qualified slice with `git commit -m "feat: ship the Echo Ruin Resonant Route"` only if uncommitted release files remain.

---

## Plan Self-Review

- Every approved design section maps to a task: exact cards (1), deterministic solvability (2), spatial evidence (3), deduction (4), physical play (5), replay (6), consequences/death (7), authority (8), persistence (9), presentation/accessibility (10), real-recording score (11), and release gates (12).
- Domain outcomes remain independent of React, Three.js, audio, storage, clocks, and network behavior.
- Mortal death requires definition-bound double acknowledgment, replay proof, live authority, atomic publication, and audit.
- No task introduces a third-party runtime sound dependency, synthetic voice, oscillator fallback, or external runtime URL.
- All tasks name exact files, public interfaces, failing tests, verification commands, and commit checkpoints.
