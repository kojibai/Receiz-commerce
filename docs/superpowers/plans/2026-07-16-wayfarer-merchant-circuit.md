# Wayfarer Merchant Circuit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the wandering-market three-button activity with a deterministic, proof-pinned, card-driven Merchant Circuit that persists exact rewards, injuries, reputation, upgrades, and disclosed Mortal death through Receiz authority.

**Architecture:** Pure TypeScript domain modules project exact card capabilities, generate solvable market contracts, resolve negotiation and physical actions, replay transcripts, and derive sealed consequences. React Three Fiber renders the authoritative runtime and emits semantic inputs; server admission independently verifies ownership, proofs, definition, replay, consent, idempotency, publication, and audit before the Save V10 projection is adopted.

**Tech Stack:** TypeScript, React 19, Next.js 15 App Router, Three.js, React Three Fiber, Node test runner, Receiz SDK/MCP/AI Skills v105, native Web Audio/HTML media, local FFmpeg build tooling, pnpm.

## Global Constraints

- Preserve Wayfarer Market as the canonical dynamic `wandering-market` ecology family; Wayfinder Hollow remains the permanent settlement.
- Support one to three living proof-pinned cards for Standard contracts and exactly two or three for Mortal Caravan contracts.
- Standard contracts may injure cards but cannot kill or transfer them; disclosed replay-proven Mortal defeat may permanently kill cards.
- Death is irreversible across squads, selection, training, battle, growth, evolution, fusion, listing, trading, and every activity.
- Identical canonical inputs must reproduce the same contract, runtime, transcript, consequences, and receipt.
- Every offered Standard contract and Mortal contract must have at least one viable perfect-play solution for its admitted squad.
- Use exact card stats, abilities, anatomy, conditions, role assignment, position, timing, stamina, and cooldowns.
- No fabricated prices, financial return, card wagering, synthetic liquidity, automatic ownership transfer, or elapsed-time mastery.
- No third-party runtime sound dependency, cloud sound provider, synthetic/browser voice, or oscillator fallback.
- Audio assets must be original or license-audited open-source real recordings with local runtime files and provenance.
- Retain the Wilds scene budgets: 160 draw calls, 180,000 triangles, 110 geometries, 6 textures, one WebGL renderer.
- Active play must have no page scrolling or horizontal overflow at 320px and must expose 44px touch targets.
- Keep Receiz SDK, MCP, and AI Skills aligned at v105.0.0.

---

## File Structure

### Shared adventure condition

- Create `src/features/play/adventure/card-condition.ts`: canonical life, injury, fatigue, XP, mastery, upgrade, validation, and merge rules.
- Modify `src/features/play/hearttree/card-capability.ts`: compatibility aliases and Hearttree capability projection over the shared condition.
- Modify `src/features/play/hearttree/consequences.ts`: shared consequence application without changing Hearttree receipt semantics.

### Market domain

- Create `src/features/play/market/card-role.ts`: exact Market capability and role projection.
- Create `src/features/play/market/contract-director.ts`: deterministic contract board, merchant, demand, layout, objective graph, and solvability witness.
- Create `src/features/play/market/negotiation-resolver.ts`: pure intelligence, tell, and term resolution.
- Create `src/features/play/market/action-resolver.ts`: pure physical action rules.
- Create `src/features/play/market/runtime.ts`: fixed-step Market state and semantic input reducer.
- Create `src/features/play/market/transcript.ts`: checkpoints, digest, and deterministic replay.
- Create `src/features/play/market/consequences.ts`: card, reputation, resource, upgrade, extraction, and mortality projection.
- Create `src/features/play/market/receipt.ts`: self-verifying Market receipt.
- Create `tests/support/market-fixtures.ts`: deterministic verified cards, sites, contracts, terms, transcripts, consents, requests, and dependency fakes shared by Market tests.

### Authority and persistence

- Create `src/lib/receiz/wilds-market-server.ts`: authoritative replay and atomic admission.
- Create `app/api/wilds/market/route.ts`: no-store POST route.
- Modify `src/features/play/game-state.ts`: Save V10, shared conditions, Market receipts, squad, reputation, and dead-card guards.

### Experience and integration

- Create `src/features/play/market/WayfarerMarketExperience.tsx`: contract board, squad/role gate, runtime, result, and publication flow.
- Create `src/features/play/market/WayfarerMarketScene.tsx`: 3D market, cargo, merchants, hazards, tells, VFX, camera, and diagnostics.
- Create `src/features/play/market/WayfarerMarketControls.tsx`: desktop/mobile semantic controls.
- Modify `src/features/play/WildsEcologyExperience.tsx`: route only `wandering-market` to the new experience.
- Modify `src/features/play/PlayCampaign.tsx`: pass inventory, conditions, guest, receipt, squad, and audio callbacks.
- Modify `app/globals.css`: Market layout, HUD, controls, safe areas, reduced motion, and mobile fit.

### Audio and tests

- Create `assets-src/audio/market/licenses.json`, `assets-src/audio/market/source/`, and `assets-src/audio/market/master/`.
- Create `public/audio/wilds/market/manifest.json` and local MP3 runtime assets.
- Create `scripts/build-market-audio.sh`, `scripts/generate-market-audio-manifest.mjs`, and `scripts/validate-market-audio.mjs`.
- Modify `src/features/play/audio/wilds-audio-catalog.ts` and `src/features/play/audio/wilds-audio-director.ts`.
- Add focused tests named in each task below.

---

### Task 1: Shared irreversible adventure conditions

**Files:**
- Create: `src/features/play/adventure/card-condition.ts`
- Modify: `src/features/play/hearttree/card-capability.ts`
- Modify: `src/features/play/hearttree/consequences.ts`
- Test: `tests/adventure-card-condition.test.ts`
- Test: `tests/hearttree-card-capability.test.ts`
- Test: `tests/hearttree-consequences.test.ts`

**Interfaces:**
- Produces: `AdventureCardCondition`, `AdventureInjury`, `emptyAdventureCondition(assetId)`, `validateAdventureCondition(condition)`, `effectiveAdventureStats(base, condition)`, and `applyAdventureConditionDelta(prior, delta)`.
- Preserves: `HearttreeCardCondition`, `emptyHearttreeCondition`, and existing Hearttree receipt verification as compatibility exports.

- [ ] **Step 1: Write the failing shared-condition tests**

```ts
it("preserves irreversible death and applies bounded cross-location progression", () => {
  const alive = emptyAdventureCondition("card:one");
  const delta: AdventureConditionDelta = {
    assetId: alive.assetId, lifeBefore: "alive", lifeAfter: "alive",
    fatigueDelta: 12, xp: { market: 40 }, mastery: { negotiation: 1 },
    injuriesAdded: [{ id: "injury:one", kind: "focus", severity: 1, sourceEventId: "market:event:one" }],
    upgradeIdsAdded: ["market:upgrade:one"], receiptDigestsAdded: []
  };
  const progressed = applyAdventureConditionDelta(alive, delta);
  assert.equal(progressed.fatigue, 12);
  assert.equal(progressed.xp.market, 40);
  assert.equal(progressed.mastery.negotiation, 1);
  assert.throws(() => applyAdventureConditionDelta({ ...progressed, life: "dead" }, { ...delta, lifeBefore: "dead", lifeAfter: "alive" }), /death_irreversible/);
});
```

- [ ] **Step 2: Run the tests and confirm the shared module is missing**

Run: `node --import tsx --test tests/adventure-card-condition.test.ts tests/hearttree-card-capability.test.ts tests/hearttree-consequences.test.ts`  
Expected: FAIL because `adventure/card-condition` does not exist.

- [ ] **Step 3: Implement the canonical condition boundary**

```ts
export type AdventureCardCondition = Readonly<{
  assetId: string;
  life: "alive" | "dead";
  fatigue: number;
  injuries: readonly AdventureInjury[];
  xp: Readonly<Record<string, number>>;
  mastery: Readonly<Record<string, number>>;
  upgradeIds: readonly string[];
  receiptDigests: readonly string[];
}>;

export type AdventureConditionDelta = Readonly<{
  assetId: string; lifeBefore: "alive" | "dead"; lifeAfter: "alive" | "dead";
  fatigueDelta: number; injuriesAdded: readonly AdventureInjury[];
  xp: Readonly<Record<string, number>>; mastery: Readonly<Record<string, number>>;
  upgradeIdsAdded: readonly string[]; receiptDigestsAdded: readonly string[];
}>;

export function applyAdventureConditionDelta(prior: AdventureCardCondition, delta: AdventureConditionDelta) {
  if (prior.assetId !== delta.assetId || prior.life !== delta.lifeBefore) throw new Error("adventure_condition_prior_mismatch");
  if (prior.life === "dead" && delta.lifeAfter === "alive") throw new Error("adventure_death_irreversible");
  return validateAdventureCondition({
    ...prior,
    life: delta.lifeAfter,
    fatigue: clamp(prior.fatigue + delta.fatigueDelta, 0, 100),
    injuries: uniqueById([...prior.injuries, ...delta.injuriesAdded]),
    xp: addBoundedMap(prior.xp, delta.xp, 1_000_000),
    mastery: addBoundedMap(prior.mastery, delta.mastery, 10_000),
    upgradeIds: [...new Set([...prior.upgradeIds, ...delta.upgradeIdsAdded])],
    receiptDigests: [...new Set([...prior.receiptDigests, ...delta.receiptDigestsAdded])].slice(-512)
  });
}
```

Add lossless Hearttree adapters so old conditions map `hearttreeXp` to `xp.hearttree` and `mastery` to `mastery.hearttree`, while existing public names continue to work.

- [ ] **Step 4: Run focused and full Hearttree tests**

Run: `node --import tsx --test tests/adventure-card-condition.test.ts tests/hearttree-card-capability.test.ts tests/hearttree-consequences.test.ts tests/hearttree-play-state.test.ts`  
Expected: PASS with no changed Hearttree consequence behavior.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/adventure src/features/play/hearttree/card-capability.ts src/features/play/hearttree/consequences.ts tests/adventure-card-condition.test.ts tests/hearttree-card-capability.test.ts tests/hearttree-consequences.test.ts
git commit -m "feat: share irreversible Wilds card conditions"
```

### Task 2: Exact Market card roles

**Files:**
- Create: `src/features/play/market/card-role.ts`
- Create: `tests/support/market-fixtures.ts`
- Test: `tests/market-card-role.test.ts`

**Interfaces:**
- Consumes: `AdventureCardCondition`, verified portable cards, living-card revisions, creature forms, genomes, and mastery taxonomy.
- Produces: `MarketCardCapability`, `MarketRole`, `MarketVerb`, `projectMarketCard(card, condition)`, and `assertMarketCardPlayable(capability)`.
- Produces test fixtures: `marketFixtureCards()`, `marketFixtureSite()`, `marketFixtureInput(squad)`, `marketNegotiationFixture()`, `marketRuntimeFixture()`, `marketReplayFixture()`, `marketConsequenceFixture()`, `marketServerFixture()`, and `marketReceiptFixture()`; later tasks extend only the fixture function whose domain types they introduce.

- [ ] **Step 1: Write failing exact-role tests**

```ts
it("derives market roles from real stats, abilities, anatomy, and injury", () => {
  const card = initialPlayState.inventory[0]!;
  const healthy = projectMarketCard(card, emptyAdventureCondition(card.id));
  const injured = projectMarketCard(card, {
    ...emptyAdventureCondition(card.id),
    injuries: [{ id: "wing:one", kind: "wing", severity: 3, sourceEventId: "event:one" }]
  });
  assert.equal(healthy.proofDigest, card.proof.digest);
  assert.deepEqual(healthy.stats, card.manifest.stats);
  assert.ok(healthy.verbs.has("inspect"));
  if (healthy.anatomy.body === "winged") assert.equal(injured.verbs.has("overfly"), false);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test tests/market-card-role.test.ts`  
Expected: FAIL because `market/card-role` is missing.

- [ ] **Step 3: Implement the market projection**

```ts
export type MarketRole = "broker" | "scout" | "carrier" | "appraiser" | "guardian";
export type MarketVerb = "inspect" | "read-tell" | "preserve" | "power" | "brace" | "clear" | "overfly" | "carry" | "guard" | "repair";

export type MarketCardCapability = Readonly<{
  assetId: string; proofDigest: string; formId: string; familyId: string;
  stats: CreatureStats; baseStats: CreatureStats; element: string;
  abilityNames: readonly [string, string]; anatomy: MarketAnatomy;
  roles: readonly MarketRole[]; verbs: ReadonlySet<MarketVerb>;
  condition: AdventureCardCondition; playable: boolean;
}>;
```

Map speed and bond toward scout/broker, power toward carrier, guard/health toward guardian, proof/ability analysis toward appraiser, and anatomy/element toward verbs. Never replace exact stats with coarse rarity bands.

- [ ] **Step 4: Run focused tests**

Run: `node --import tsx --test tests/market-card-role.test.ts`  
Expected: PASS for proof rejection, dead-card rejection, injury penalties, elemental verbs, and anatomical route changes.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/market/card-role.ts tests/support/market-fixtures.ts tests/market-card-role.test.ts
git commit -m "feat: project exact Wayfarer card roles"
```

### Task 3: Deterministic contract board and solvability

**Files:**
- Create: `src/features/play/market/contract-director.ts`
- Test: `tests/market-contract-director.test.ts`

**Interfaces:**
- Consumes: ecology site facts, Pulse string, regional state, `MarketCardCapability[]`, market history, and Mortal flag.
- Produces: `MarketBoardDefinition`, `MarketContractDefinition`, `generateMarketBoard(input)`, and `validateMarketContractSolvability(contract, squad)`.

- [ ] **Step 1: Write failing determinism and solvability tests**

```ts
it("reproduces three squad-shaped contracts with a viable route", () => {
  const { groveScout, stoneCarrier } = marketFixtureCards();
  const first = generateMarketBoard(marketFixtureInput([groveScout, stoneCarrier]));
  const replay = generateMarketBoard(marketFixtureInput([groveScout, stoneCarrier]));
  assert.deepEqual(replay, first);
  assert.equal(first.contracts.length, 3);
  assert.ok(first.contracts.every((contract) => validateMarketContractSolvability(contract, [groveScout, stoneCarrier]).ok));
});

it("changes meaningful terms for materially different cards", () => {
  const { groveScout, stoneCarrier } = marketFixtureCards();
  const grove = generateMarketBoard(marketFixtureInput([groveScout]));
  const stone = generateMarketBoard(marketFixtureInput([stoneCarrier]));
  assert.notDeepEqual(grove.contracts.map((value) => value.routes), stone.contracts.map((value) => value.routes));
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test tests/market-contract-director.test.ts`  
Expected: FAIL because the director is missing.

- [ ] **Step 3: Implement bounded definitions and deterministic generation**

```ts
export type MarketContractDefinition = Readonly<{
  schema: "receiz.wilds.market_contract.v1";
  id: string;
  family: "delivery" | "appraisal" | "protection" | "preservation" | "repair" | "bulk" | "recovery";
  merchant: MarketMerchantDefinition;
  risk: "standard" | "mortal";
  minCards: 1 | 2 | 3;
  maxCards: 1 | 2 | 3;
  demand: readonly MarketDemandFact[];
  intelligence: readonly MarketIntelligenceNode[];
  negotiation: MarketNegotiationDefinition;
  objectives: readonly MarketObjectiveDefinition[];
  routes: readonly MarketRouteDefinition[];
  hazards: readonly MarketHazardDefinition[];
  rewardBands: readonly MarketRewardBand[];
  squadPins: readonly { assetId: string; proofDigest: string }[];
  solvability: MarketSolvabilityWitness;
  digest: string;
}>;
```

Use SHA-256-addressed deterministic selection, a bounded contract-family table, capability-token search, and exactly three candidates. Omit unsolvable candidates and derive replacements from the next deterministic ordinal; fail closed if three viable candidates cannot be built within 32 attempts.

- [ ] **Step 4: Run representative squad tests**

Run: `node --import tsx --test tests/market-contract-director.test.ts`  
Expected: PASS for one-, two-, three-card squads, injured squads, Mortal minimum size, changed proof rejection, and mastery diminishing weights.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/market/contract-director.ts tests/market-contract-director.test.ts
git commit -m "feat: generate solvable Wayfarer contracts"
```

### Task 4: Intelligence and negotiation resolution

**Files:**
- Create: `src/features/play/market/negotiation-resolver.ts`
- Test: `tests/market-negotiation-resolver.test.ts`

**Interfaces:**
- Consumes: contract definition, gathered intelligence IDs, current terms, exchange index, active capability, semantic negotiation action, and timing offset.
- Produces: `MarketTerms`, `MarketNegotiationState`, `MarketNegotiationAction`, and `resolveMarketNegotiation(input)`.

- [ ] **Step 1: Write failing causal negotiation tests**

```ts
it("makes observed tells and card choice change exact terms", () => {
  const fixture = marketNegotiationFixture();
  const blind = resolveMarketNegotiation({ ...fixture, intelligenceIds: [], action: { kind: "counter", term: "time", timingOffsetMs: 40 } });
  const informed = resolveMarketNegotiation({ ...fixture, intelligenceIds: [fixture.contract.intelligence[0]!.id], action: { kind: "counter", term: "time", timingOffsetMs: 40 } });
  assert.equal(blind.accepted, false);
  assert.equal(informed.effects.some((effect) => effect.kind === "time-window"), true);
  assert.match(informed.explanation, /observed|tell|timing/i);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test tests/market-negotiation-resolver.test.ts`  
Expected: FAIL because the resolver is missing.

- [ ] **Step 3: Implement pure exchange resolution**

```ts
export type MarketNegotiationAction =
  | { kind: "commit" }
  | { kind: "counter"; term: "cargo" | "time" | "route" | "damage" | "reward"; timingOffsetMs: number }
  | { kind: "bundle"; intelligenceId: string }
  | { kind: "ability"; assetId: string; abilityName: string; timingOffsetMs: number }
  | { kind: "walk-away" };

export function resolveMarketNegotiation(input: MarketNegotiationResolutionInput): MarketNegotiationResolution {
  validateNegotiationInput(input);
  const evidence = projectEvidence(input.contract, input.intelligenceIds, input.activeCard);
  const margin = evidence.margin + timingMargin(input.action) + cardMargin(input.activeCard, input.action);
  return applyDeterministicMerchantRule(input.state, input.action, margin);
}
```

Every changed term must cite the tell, intelligence fact, ability, stat, and/or timing window that caused it. Hidden random rolls are prohibited.

- [ ] **Step 4: Run focused tests**

Run: `node --import tsx --test tests/market-negotiation-resolver.test.ts`  
Expected: PASS for commit, counter, bundle, ability, walk-away, limited exchanges, wrong timing, missing evidence, and deterministic explanations.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/market/negotiation-resolver.ts tests/market-negotiation-resolver.test.ts
git commit -m "feat: resolve skill-based Wayfarer negotiation"
```

### Task 5: Fixed-step contract runtime and physical actions

**Files:**
- Create: `src/features/play/market/action-resolver.ts`
- Create: `src/features/play/market/runtime.ts`
- Test: `tests/market-action-resolver.test.ts`
- Test: `tests/market-runtime.test.ts`

**Interfaces:**
- Consumes: accepted contract, negotiated terms, squad capabilities, sequenced `MarketInput` values.
- Produces: `MarketRuntimeState`, `MarketRuntimeEvent`, `createMarketRuntime`, `stepMarketRuntime`, and `marketRuntimeStateDigest`.

- [ ] **Step 1: Write failing movement, timing, cargo, and terminal tests**

```ts
it("requires correct position, timing, stamina, and card capability", () => {
  const { contract, terms, squad, walkToObjective } = marketRuntimeFixture();
  let state = createMarketRuntime(contract, terms, squad);
  assert.throws(() => stepMarketRuntime(state, { sequence: 1, tick: 1, kind: "role-action", verb: "repair", timingOffsetMs: 0 }), /out_of_range/);
  state = walkToObjective(state, contract.objectives[0]!.position);
  const repaired = stepMarketRuntime(state, { sequence: state.sequence + 1, tick: state.tick + 1, kind: "role-action", verb: "repair", timingOffsetMs: 20 });
  assert.equal(repaired.objectives[0]!.complete, true);
  assert.ok(repaired.events.some((event) => event.kind === "objective.completed"));
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test tests/market-action-resolver.test.ts tests/market-runtime.test.ts`  
Expected: FAIL because runtime modules are missing.

- [ ] **Step 3: Implement semantic runtime state and inputs**

```ts
export type MarketInput =
  | { sequence: number; tick: number; kind: "move"; vector: { x: number; z: number } }
  | { sequence: number; tick: number; kind: "inspect"; targetId: string }
  | { sequence: number; tick: number; kind: "negotiate"; action: MarketNegotiationAction }
  | { sequence: number; tick: number; kind: "guard"; timingOffsetMs: number }
  | { sequence: number; tick: number; kind: "dodge"; vector: { x: number; z: number }; timingOffsetMs: number }
  | { sequence: number; tick: number; kind: "role-action"; verb: MarketVerb; timingOffsetMs: number }
  | { sequence: number; tick: number; kind: "ability"; abilityName: string; timingOffsetMs: number }
  | { sequence: number; tick: number; kind: "switch"; assetId: string }
  | { sequence: number; tick: number; kind: "extract" };
```

Use bounded coordinates, finite values, monotonically increasing sequence/tick, deterministic hazard telegraphs, per-card health/stamina/cooldowns, cargo integrity, objective state, three switch charges, and distinct `completed`, `extracted`, `contract-failed`, and `squad-defeated` terminal reasons.

- [ ] **Step 4: Run runtime tests**

Run: `node --import tsx --test tests/market-action-resolver.test.ts tests/market-runtime.test.ts`  
Expected: PASS for movement, inspection, negotiation, guard, dodge, role action, ability, switch, cargo damage, hazards, extraction, completion, defeat, and identical replay state.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/market/action-resolver.ts src/features/play/market/runtime.ts tests/market-action-resolver.test.ts tests/market-runtime.test.ts
git commit -m "feat: add playable Wayfarer contract runtime"
```

### Task 6: Transcript replay and tamper rejection

**Files:**
- Create: `src/features/play/market/transcript.ts`
- Test: `tests/market-replay.test.ts`

**Interfaces:**
- Consumes: final runtime state, contract, terms, and squad.
- Produces: `MarketTranscript`, `marketTranscript(state)`, and `replayMarketTranscript(contract, terms, squad, transcript)`.

- [ ] **Step 1: Write failing replay tests**

```ts
it("replays accepted inputs to identical checkpoints and rejects tampering", () => {
  const { contract, terms, squad, completedState } = marketReplayFixture();
  const transcript = marketTranscript(completedState);
  const replay = replayMarketTranscript(contract, terms, squad, transcript);
  assert.equal(replay.stateDigest, marketRuntimeStateDigest(completedState));
  assert.throws(() => replayMarketTranscript(contract, terms, squad, { ...transcript, inputs: [...transcript.inputs.slice(0, -1), { ...transcript.inputs.at(-1)!, tick: 999 }] }), /transcript/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test tests/market-replay.test.ts`  
Expected: FAIL because transcript functions are missing.

- [ ] **Step 3: Implement checkpointed replay**

```ts
export type MarketTranscript = Readonly<{
  schema: "receiz.wilds.market_transcript.v1";
  contractDigest: string;
  termsDigest: string;
  squadPins: readonly { assetId: string; proofDigest: string }[];
  inputs: readonly MarketInput[];
  checkpoints: readonly { sequence: number; stateDigest: string }[];
  finalStateDigest: string;
  digest: string;
}>;
```

Replay from `createMarketRuntime`, validate proof pins and definition digests, apply every input, compare each checkpoint and final digest, and reject changed ordering, input, proof, contract, terms, or digest.

- [ ] **Step 4: Run replay tests**

Run: `node --import tsx --test tests/market-replay.test.ts`  
Expected: PASS for exact replay and every tampering case.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/market/transcript.ts tests/market-replay.test.ts
git commit -m "feat: replay Wayfarer contracts deterministically"
```

### Task 7: Persistent consequences, upgrades, mortality, and receipts

**Files:**
- Create: `src/features/play/market/consequences.ts`
- Create: `src/features/play/market/receipt.ts`
- Test: `tests/market-consequences.test.ts`
- Test: `tests/market-receipt.test.ts`

**Interfaces:**
- Consumes: verified replay, prior shared conditions, contract, terms, actor context, and optional `MarketMortalConsent`.
- Produces: `MarketConsequenceSet`, `MarketReceipt`, `projectMarketConsequences`, `applyMarketConsequences`, `sealMarketReceipt`, and verification functions.

- [ ] **Step 1: Write failing consequence tests**

```ts
it("awards only recorded contributions and kills only disclosed Mortal defeat", () => {
  const { standardContract, mortalContract, terms, defeatedReplay, priorConditions, validConsent, changedConsent } = marketConsequenceFixture();
  const standard = projectMarketConsequences({ contract: standardContract, terms, replay: defeatedReplay, priorConditions, mortalConsent: null });
  assert.ok(Object.values(standard.cards).every((card) => card.lifeAfter === "alive"));
  const mortal = projectMarketConsequences({ contract: mortalContract, terms, replay: defeatedReplay, priorConditions, mortalConsent: validConsent });
  assert.ok(Object.values(mortal.cards).some((card) => card.lifeAfter === "dead"));
  assert.throws(() => projectMarketConsequences({ contract: mortalContract, terms, replay: defeatedReplay, priorConditions, mortalConsent: changedConsent }), /consent_invalid/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test tests/market-consequences.test.ts tests/market-receipt.test.ts`  
Expected: FAIL because consequence and receipt modules are missing.

- [ ] **Step 3: Implement bounded consequence projection**

```ts
export type MarketCardConsequence = Readonly<{
  assetId: string; lifeBefore: "alive" | "dead"; lifeAfter: "alive" | "dead";
  xp: number; mastery: Readonly<Record<string, number>>; fatigueDelta: number;
  injuriesAdded: readonly AdventureInjury[]; upgradeOffers: readonly MarketUpgradeOffer[];
  selectedUpgradeId: string | null; sourceEventIds: readonly string[];
}>;

export type MarketConsequenceSet = Readonly<{
  schema: "receiz.wilds.market_consequences.v1";
  contractId: string; replayStateDigest: string; transcriptDigest: string;
  outcome: MarketTerminalReason; extracted: boolean; mortalConsentDigest: string | null;
  cards: Readonly<Record<string, MarketCardConsequence>>;
  reputationDelta: number; resourceAwards: Readonly<Record<string, number>>;
  digest: string;
}>;
```

Deduplicate events, cap card XP at 250, fatigue delta at 25, reputation delta at 10, resource awards at contract bands, and upgrade offers at three per contributing card. Derive injury severity from replayed damage and permanent death only from Mortal `squad-defeated` plus consent bound to contract digest and pins.

- [ ] **Step 4: Seal and verify complete receipts**

```ts
export type MarketReceipt = Readonly<{
  schema: "receiz.wilds.market_receipt.v1";
  contract: MarketContractDefinition; terms: MarketTerms; transcript: MarketTranscript;
  priorConditions: Readonly<Record<string, AdventureCardCondition>>;
  consequences: MarketConsequenceSet; actorId: string;
  publicationRevision: number; createdAt: string; digest: string;
}>;
```

Run: `node --import tsx --test tests/market-consequences.test.ts tests/market-receipt.test.ts`  
Expected: PASS for extraction, partial rewards, injuries, upgrades, caps, irreversible death, receipt round-trip, and tamper rejection.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/market/consequences.ts src/features/play/market/receipt.ts tests/market-consequences.test.ts tests/market-receipt.test.ts
git commit -m "feat: persist Wayfarer consequences and mortality"
```

### Task 8: Receiz Market admission

**Files:**
- Create: `src/lib/receiz/wilds-market-server.ts`
- Create: `app/api/wilds/market/route.ts`
- Test: `tests/wilds-market-server.test.ts`

**Interfaces:**
- Consumes: POST body with guest ID, idempotency key, cards, prior conditions, contract, terms, transcript, and Mortal consent.
- Produces: practice preview or canonical `MarketAdmissionProjection` and `MarketReceipt`.

- [ ] **Step 1: Write failing server admission tests**

```ts
it("replays and atomically publishes one canonical market receipt", async () => {
  const { request, body, dependencies, published, audited } = marketServerFixture();
  const result = await executeMarketAdmission(request, body, dependencies);
  assert.equal(result.publication.published, true);
  assert.equal(result.projection?.revision, 1);
  assert.equal(published.length, 1);
  assert.equal(audited.length, 1);
  assert.deepEqual(await executeMarketAdmission(request, body, dependencies), result);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test tests/wilds-market-server.test.ts`  
Expected: FAIL because server admission is missing.

- [ ] **Step 3: Implement independent authority checks**

```ts
export async function executeMarketAdmission(request: NextRequest, rawBody: unknown, dependencies = defaultDependencies) {
  const body = marketBodyValue(rawBody);
  const actor = await dependencies.resolveActor(request, body.guestId);
  const cached = admissionLedger().results.get(`${actor.playerId}:${body.idempotencyKey}`);
  if (cached) return cached;
  const squad = authorizeMarketCards(actor, body.cards, body.priorConditions);
  verifyContractPinsAndSolvability(body.contract, squad);
  const replay = replayMarketTranscript(body.contract, body.terms, squad, body.transcript);
  const preview = projectMarketConsequences({ contract: body.contract, terms: body.terms, replay, priorConditions: body.priorConditions, mortalConsent: body.mortalConsent });
  if (actor.practice) return cachePracticePreview(preview);
  return publishAuditAndAdopt(actor, request, body, preview, dependencies);
}
```

Publish under ``wilds:market:v1:${actor.playerId}``, require audit success before ledger adoption, compare previous conditions to submitted prior conditions, and bound receipt tails to 32.

- [ ] **Step 4: Add the no-store route and run tests**

Run: `node --import tsx --test tests/wilds-market-server.test.ts`  
Expected: PASS for practice, canonical success, ownership mismatch, changed proof, stale condition, tampered replay, invalid Mortal consent, duplicate idempotency, publish rollback, and audit rollback.

- [ ] **Step 5: Commit**

```bash
git add src/lib/receiz/wilds-market-server.ts app/api/wilds/market/route.ts tests/wilds-market-server.test.ts
git commit -m "feat: admit Wayfarer outcomes through Receiz authority"
```

### Task 9: Save V10 and global dead-card continuity

**Files:**
- Modify: `src/features/play/game-state.ts`
- Modify: `src/features/play/PlayCampaign.tsx`
- Test: `tests/market-play-state.test.ts`
- Modify: `tests/hearttree-play-state.test.ts`
- Modify: `tests/wilds-boss-ecology-release.test.ts`
- Modify: `tests/wilds-dynamic-ecology-release.test.ts`
- Modify: `tests/wilds-ecology-history.test.ts`
- Modify: `tests/wilds-raid-history.test.ts`

**Interfaces:**
- Adds to `PlayState`: `adventureConditions`, `marketReceipts`, `marketSquadAssetIds`, `marketReputation`, and `marketResources`.
- Adds inputs: `market-select-squad` and `market-admit`.
- Preserves a compatibility projection for `hearttreeConditions` while shared state becomes authoritative.

- [ ] **Step 1: Write failing V10 migration and admission tests**

```ts
it("migrates Save V9 without losing Hearttree history and adopts a Market receipt once", () => {
  const receipt = marketReceiptFixture();
  const legacy = restorePlayState(JSON.stringify({ schema: "receiz.wilds.save.v9", state: initialPlayState }));
  assert.equal(legacy.adventureConditions[legacy.inventory[0]!.id]!.life, "alive");
  const admitted = applyWildsInput(legacy, { type: "market-admit", receipt });
  assert.equal(admitted.marketReceipts.length, 1);
  assert.deepEqual(applyWildsInput(admitted, { type: "market-admit", receipt }), admitted);
  assert.match(serializePlayState(admitted), /receiz\.wilds\.save\.v10/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test tests/market-play-state.test.ts tests/hearttree-play-state.test.ts`  
Expected: FAIL because Save V10 fields and inputs are absent.

- [ ] **Step 3: Implement lossless migration and reducer inputs**

Set `PLAY_SAVE_SCHEMA` to `receiz.wilds.save.v10`, accept V2-V9, migrate V9 Hearttree conditions into shared conditions, verify both receipt families, reimpose receipt-proven death after local condition validation, and derive playable inventory from shared life state. `market-admit` applies each verified consequence, reputation, resources, receipt tail, and living squad filter atomically.

- [ ] **Step 4: Expand global dead-card guards and update schema contracts**

Ensure `isPlayableAsset`, squad selection, selected asset, training, battle, growth, evolution, fusion, lineage, listing, trading, Hearttree, and Market all use shared life state. Update every release expectation from V9 to V10 while retaining explicit V9 migration coverage.

Run: `node --import tsx --test tests/market-play-state.test.ts tests/hearttree-play-state.test.ts tests/wilds-boss-ecology-release.test.ts tests/wilds-dynamic-ecology-release.test.ts tests/wilds-ecology-history.test.ts tests/wilds-raid-history.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/game-state.ts src/features/play/PlayCampaign.tsx tests/market-play-state.test.ts tests/hearttree-play-state.test.ts tests/wilds-boss-ecology-release.test.ts tests/wilds-dynamic-ecology-release.test.ts tests/wilds-ecology-history.test.ts tests/wilds-raid-history.test.ts
git commit -m "feat: persist shared Wilds conditions in Save V10"
```

### Task 10: Playable 3D Wayfarer Market experience

**Files:**
- Create: `src/features/play/market/WayfarerMarketExperience.tsx`
- Create: `src/features/play/market/WayfarerMarketScene.tsx`
- Create: `src/features/play/market/WayfarerMarketControls.tsx`
- Modify: `src/features/play/WildsEcologyExperience.tsx`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `app/globals.css`
- Test: `tests/market-ui-contract.test.ts`

**Interfaces:**
- Consumes: active wandering-market site, cards, conditions, saved squad, guest ID, world mode, participant count, audio callback, receipt callback, squad callback, and exit callback.
- Emits: semantic Market inputs and canonical receipt adoption only.

- [ ] **Step 1: Write the failing UI contract test**

```ts
it("routes wandering markets to a playable proof-pinned Merchant Circuit", async () => {
  const ecology = await readFile("src/features/play/WildsEcologyExperience.tsx", "utf8");
  const experience = await readFile("src/features/play/market/WayfarerMarketExperience.tsx", "utf8");
  const scene = await readFile("src/features/play/market/WayfarerMarketScene.tsx", "utf8");
  assert.match(ecology, /site\.familyId === "wandering-market"/);
  assert.match(experience, /generateMarketBoard/);
  assert.match(experience, /createMarketRuntime/);
  assert.match(experience, /stepMarketRuntime/);
  assert.match(experience, /\/api\/wilds\/market/);
  assert.match(scene, /<Canvas/);
  assert.match(scene, /__WAYFARER_MARKET_DIAGNOSTICS__/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test tests/market-ui-contract.test.ts`  
Expected: FAIL because Market components are missing.

- [ ] **Step 3: Implement contract board, squad roles, and Mortal disclosure**

Render three contract cards with family, merchant, demand, known hazards, squad limits, reward bands, and Standard/Mortal risk. Require a selected contract, valid squad count, role assignment, and double acknowledgement for Mortal entry. Display exact card stats, abilities, anatomy-derived verbs, injuries, fatigue, proof pin, and role fitness.

- [ ] **Step 4: Implement active runtime, controls, result, and publication**

Use keyboard movement, `E` inspect/interact, `Q` guard, Space dodge, number-key card switching, semantic negotiation controls, role actions, ability actions, pause, extraction, and 44px mobile controls. Build the API body from `marketTranscript(runtime)` and adopt only returned canonical receipts.

- [ ] **Step 5: Implement the 3D caravan and diagnostics**

Build reusable canopies, lantern rails, stalls, cargo, route gates, merchant silhouettes, demand signs, hazard telegraphs, objective markers, card avatar, camera follow, fog, lighting, and bounded VFX. Publish per-frame diagnostics:

```ts
globalThis.__WAYFARER_MARKET_DIAGNOSTICS__ = {
  calls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  geometries: renderer.info.memory.geometries,
  textures: renderer.info.memory.textures,
  dpr: renderer.getPixelRatio()
};
```

- [ ] **Step 6: Add responsive styles and run UI tests**

Run: `node --import tsx --test tests/market-ui-contract.test.ts tests/mobile-layout-css.test.ts`  
Expected: PASS with `height: 100dvh`, hidden overflow, safe-area padding, reduced motion, 44px targets, and a 320px no-overflow contract.

- [ ] **Step 7: Commit**

```bash
git add src/features/play/market/WayfarerMarketExperience.tsx src/features/play/market/WayfarerMarketScene.tsx src/features/play/market/WayfarerMarketControls.tsx src/features/play/WildsEcologyExperience.tsx src/features/play/PlayCampaign.tsx app/globals.css tests/market-ui-contract.test.ts
git commit -m "feat: replace Wayfarer buttons with a playable market"
```

### Task 11: Real local adaptive Market audio

**Files:**
- Create: `assets-src/audio/market/licenses.json`
- Create: `assets-src/audio/market/source/*`
- Create: `assets-src/audio/market/master/*`
- Create: `public/audio/wilds/market/manifest.json`
- Create: `public/audio/wilds/market/*.mp3`
- Create: `scripts/build-market-audio.sh`
- Create: `scripts/generate-market-audio-manifest.mjs`
- Create: `scripts/validate-market-audio.mjs`
- Modify: `package.json`
- Modify: `src/features/play/audio/wilds-audio-catalog.ts`
- Modify: `src/features/play/audio/wilds-audio-director.ts`
- Modify: `src/features/play/market/WayfarerMarketExperience.tsx`
- Test: `tests/market-audio.test.ts`

**Interfaces:**
- Produces: `MARKET_AUDIO_ASSETS`, `MarketAudioSignal`, `marketAudioEvent(signal)`, and `pnpm validate:audio:market`.
- Consumes only semantic Market phase/events; audio availability cannot alter runtime state.

- [ ] **Step 1: Write failing manifest and routing tests**

```ts
it("ships every Market runtime file with local rights evidence", () => {
  assert.ok(manifest.assets.length >= 24);
  for (const asset of manifest.assets) {
    assert.ok(existsSync(join(process.cwd(), "public", asset.file)));
    assert.ok(existsSync(join(process.cwd(), asset.archivalMaster)));
    assert.match(asset.license, /^(?:CC0-1\.0|original)$/);
    assert.ok(asset.truePeakDb <= -1);
  }
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test tests/market-audio.test.ts`  
Expected: FAIL because the Market bank and manifest are missing.

- [ ] **Step 3: Build the offline source and mastering pipeline**

Use the existing rights-audited real recordings where their licenses and material fit, add only original or audited CC0 recordings, preserve exact source URL/author/license records, and render 24-bit WAV masters plus 44.1kHz 128kbps MP3 runtime files. Required groups: exterior/interior ambience; intelligence/negotiation/execution/danger/victory/extraction/memorial music; Grove/Spark/Tide/Stone motifs; footsteps, fabric, wood, cargo, mechanism, inspect, counter, commit, guard, dodge, impact, injury, reward, UI, and Mortal warning effects.

- [ ] **Step 4: Register adaptive routing**

Map Market phase, negotiated risk, cargo integrity, merchant pressure, active element, semantic action, and terminal reason to local streams and effects. Crossfade streams, play each squad motif once, synchronize pause/background/disposal, and keep dialogue absent until performed recordings and releases exist.

- [ ] **Step 5: Validate audio and run tests**

Run: `pnpm validate:audio:market && pnpm validate:audio:catalog && node --import tsx --test tests/market-audio.test.ts tests/wilds-audio-director.test.ts`  
Expected: PASS with no cloud provider, oscillator, browser speech, missing files, orphan files, unsupported rights, peak above -1dB, or gameplay mutation.

- [ ] **Step 6: Commit**

```bash
git add assets-src/audio/market public/audio/wilds/market scripts/build-market-audio.sh scripts/generate-market-audio-manifest.mjs scripts/validate-market-audio.mjs package.json src/features/play/audio/wilds-audio-catalog.ts src/features/play/audio/wilds-audio-director.ts src/features/play/market/WayfarerMarketExperience.tsx tests/market-audio.test.ts
git commit -m "feat: ship the official local Wayfarer soundscape"
```

### Task 12: Production qualification and release commit

**Files:**
- Modify only files required by evidence-backed defects found during qualification.
- Create screenshots under `output/playwright/`.
- Test: all repository tests and release gates.

**Interfaces:**
- Produces: a clean production build, desktop/mobile browser evidence, renderer diagnostics, audio evidence, and committed release state.

- [ ] **Step 1: Run focused Market qualification**

Run:

```bash
node --import tsx --test tests/adventure-card-condition.test.ts tests/market-*.test.ts tests/wilds-market-server.test.ts
pnpm typecheck
pnpm lint
pnpm validate:audio:market
```

Expected: all focused tests and static gates PASS.

- [ ] **Step 2: Run full repository gates**

Run:

```bash
pnpm test
pnpm build
pnpm receiz:check
pnpm receiz:conformance
pnpm release:check
```

Expected: full tests, Next production build, v105 integration, 13 conformance checks, doctor, secret scan, lint, and release checks PASS.

- [ ] **Step 3: Run a production browser smoke test**

Start: `pnpm start -p 3000`.

Verify with Playwright:

- enter a live or clearly labelled practice Wayfarer Market;
- inspect three contracts and pin a valid squad;
- gather at least one intelligence fact;
- negotiate a term through real input;
- move, use a role action, switch cards, receive or avoid a hazard, and extract or complete;
- verify result publication behavior;
- capture active desktop and 390x844 mobile screenshots;
- confirm zero browser/page errors and no horizontal overflow;
- confirm `__WAYFARER_MARKET_DIAGNOSTICS__` remains within 160 calls, 180,000 triangles, 110 geometries, and 6 textures;
- confirm local Market MP3 resources return successfully after a trusted gesture.

- [ ] **Step 4: Fix only reproduced qualification defects and rerun affected gates**

Use systematic debugging for every failure: capture the exact symptom, identify the first bad boundary, add or tighten a regression test, apply the smallest fix, then rerun the focused test and the owning release gate.

- [ ] **Step 5: Commit the qualification fixes**

```bash
git add --update
git commit -m "test: qualify Wayfarer Merchant Circuit release"
```

- [ ] **Step 6: Confirm clean handoff**

Run: `git status --short --branch && git log -12 --oneline`  
Expected: clean `main`, all implementation commits present, and branch ahead of `origin/main` until the user explicitly requests a push.

---

## Plan Self-Review

- Spec coverage: all 17 specification sections map to Tasks 1-12.
- Boundaries: shared conditions, capability projection, generation, negotiation, runtime, replay, consequences, authority, persistence, UI, audio, and QA are independently testable.
- Type consistency: Market definitions flow director → negotiation/runtime → transcript → consequences/receipt → server → Save V10/UI with stable names.
- Authority: no client projection becomes durable without independent replay, publication, and audit.
- Mortality: Standard and Mortal paths remain distinct from generation through persistence.
- Audio: real local rights-audited assets and human-cast constraints are explicit.
- Release: full repository and production-browser evidence are required before completion.
