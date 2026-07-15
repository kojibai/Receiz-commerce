# Wilds V3 Boss Ecology and Global Raids Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship eight globally unique boss families that persist across bounded raid rounds, support fighters and public support roles, die once for everyone, leave permanent aftermath, create deterministic successors, and restore personal history through Save V8.

**Architecture:** Generalize the existing Crystal Burrower and raid kernel without rewriting its admitted events. New deterministic boss definitions, round/encounter reducers, canonical commands, personal receipts, atlas projection, procedural presentation, and one responsive raid shell extend the Slice 1–3 world. Clients send semantic intents; the server derives all impact from verified cards and canonical encounter state under Pulse/Kai-Klok ordering.

**Tech Stack:** Next.js 15, React 19, TypeScript, Three.js/React Three Fiber, Node test runner, Web Crypto-compatible SHA-256 helpers, local Web Audio, Playwright CLI WebKit.

## Global Constraints

- Preserve all V2–V7 saves, existing Crystal Burrow events, Slice 1–3 world replay, cards, proofs, settlements, ecology, raids, teams, leagues, and V3 vaults.
- Every canonical mutation requires Pulse/Kai-Klok ordering and the existing Receiz publication path.
- Practice state remains visibly isolated and cannot publish canonical victory, reward, league, monument, or successor facts.
- Eight families: `crystal-burrower`, `skycoil-tempest`, `mirecrown-colossus`, `embermane-siegebeast`, `tidal-prism-leviathan`, `echo-antler-warden`, `lumen-moth-sovereign`, `voidroot-devourer`.
- Boss phases: `rumored → tracked → emerged → contested → transforming → vulnerable → defeated → memorialized`, plus terminal `withdrawn`.
- Raid rounds last 10–15 minutes, admit six squads of six fighters, cap support at 144, preserve slots for 90 seconds, and never reset global boss health.
- Clients submit semantic intents and never authoritative damage, support score, timestamps, random rolls, phase results, rewards, or defeat.
- At most three undefeated bosses globally, one per region, one active settlement assault globally, and one active round per boss.
- Save V8 accepts V2–V7 and personal receipts cannot mutate canonical boss truth.
- No third-party model, image, map, audio, generation, telemetry, or runtime asset API.
- Preserve the 160 draw-call, 180,000-triangle, 110-geometry, 6-texture, single-renderer budgets.
- Every required touch control is at least 44×44 CSS pixels with no page-level overflow at 320×568.

---

### Task 1: Generalized boss-family grammar and compatibility

**Files:**
- Create: `src/features/play/wilds-boss-ecology.ts`
- Modify: `src/features/play/wilds-boss-generator.ts`
- Create: `tests/wilds-boss-ecology.test.ts`
- Modify: `tests/wilds-boss-generator.test.ts`

**Interfaces:**
- Consumes: `sha256PortableBasis`, `WildsDynamicSite`, ecology/region clearance, existing Crystal Burrower definition.
- Produces: `WILDS_BOSS_FAMILIES`, `WildsBossFamilyId`, `WildsBossPhase`, `WildsBossDefinition`, `WildsBossModuleSet`, `generateWildsBoss(input)`, `validateWildsBossModules(boss)`, `deriveWildsBossSuccessor(input)`, and a compatible `generateCrystalBurrower` wrapper.

- [x] **Step 1: Write failing family and successor tests**

```ts
it("generates every boss family deterministically with compatible authored modules", () => {
  const bosses = WILDS_BOSS_FAMILIES.map((familyId, index) => generateWildsBoss({ familyId, site: siteFor(familyId), pulse, ordinal: index + 1, existingBosses: [] }));
  assert.deepEqual(bosses.map((boss) => boss.familyId), WILDS_BOSS_FAMILIES);
  assert.equal(bosses.every((boss) => validateWildsBossModules(boss).ok), true);
  assert.equal(new Set(bosses.map((boss) => boss.id)).size, 8);
});

it("derives one new successor identity without respawning its parent", () => {
  const parent = { ...bossFor("skycoil-tempest"), phase: "defeated" as const };
  const successor = deriveWildsBossSuccessor({ parent, causeEventId, pulse: laterPulse, ordinal: 2, existingBosses: [parent] });
  assert.ok(successor);
  assert.notEqual(successor.id, parent.id);
  assert.equal(successor.parentBossId, parent.id);
});
```

- [x] **Step 2: Verify RED**

Run: `node scripts/clean-test-build.mjs && pnpm exec tsc -p tsconfig.test.json`  
Expected: FAIL because `wilds-boss-ecology.ts` and its exports do not exist.

- [x] **Step 3: Implement the deterministic grammar**

Define all eight family tables with names, silhouettes, territories, anatomy, openers, escalations, finales, hazards, weaknesses, support objectives, transformations, aftermath, compatible successor families, and normalized health ranges. Probe at most 128 deterministic safe territories, reject density/region/settlement-assault violations, and keep the Crystal wrapper output compatible with existing tests.

- [x] **Step 4: Verify GREEN and legacy compatibility**

Run: `node scripts/clean-test-build.mjs && pnpm exec tsc -p tsconfig.test.json && node scripts/patch-test-imports.mjs && node --test .test-build/tests/wilds-boss-ecology.test.js .test-build/tests/wilds-boss-generator.test.js .test-build/tests/wilds-dynamic-sites.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-boss-ecology.ts src/features/play/wilds-boss-generator.ts tests/wilds-boss-ecology.test.ts tests/wilds-boss-generator.test.ts
git commit -m "feat: define the Wilds boss ecology"
```

### Task 2: Raid rounds, leases, queueing, and fair rotation

**Files:**
- Modify: `src/features/play/wilds-raid-core.ts`
- Create: `src/features/play/wilds-raid-round.ts`
- Create: `tests/wilds-raid-round.test.ts`
- Modify: `tests/wilds-raid-core.test.ts`

**Interfaces:**
- Consumes: `WildsBossDefinition`, existing six-by-six admission, SHA-256 helpers.
- Produces: `WildsRaidRound`, `WildsRaidLease`, `WildsRaidQueueEntry`, `createWildsRaidRound(input)`, `admitWildsRaidParticipant(round, input)`, `renewWildsRaidLease(round, input)`, `rotateExpiredWildsRaidSlots(round, now)`, `retreatWildsRaidParticipant(round, input)`, `settleWildsRaidRound(round, input)`.

- [x] **Step 1: Write failing round-capacity and lease tests**

```ts
it("admits 36 fighters, 144 support participants, and rejects overflow", () => {
  const filled = fillRound(createWildsRaidRound({ boss, ordinal: 1, openedAt }));
  assert.equal(filled.squads.flat().length, 36);
  assert.equal(filled.supportPlayerIds.length, 144);
  assert.throws(() => admitWildsRaidParticipant(filled, participant(181)), /capacity_full/);
});

it("preserves a fighter for 90 seconds then rotates the oldest support request", () => {
  const disconnected = renewWildsRaidLease(round, { playerId: fighterId, status: "disconnected", occurredAt });
  assert.deepEqual(rotateExpiredWildsRaidSlots(disconnected, plusSeconds(occurredAt, 89)), disconnected);
  const rotated = rotateExpiredWildsRaidSlots(disconnected, plusSeconds(occurredAt, 91));
  assert.equal(rotated.squads.flat().includes(waitingSupportId), true);
});
```

- [x] **Step 2: Verify RED**

Run: compile the test build.  
Expected: missing raid-round module errors.

- [x] **Step 3: Implement bounded round state**

Use phases `forming | active | transformation_lock | resolving | settled | expired`, deterministic 10–15 minute duration, 20-second minimum formation, maximum 180 participants, one admission per actor, stable lowest-fill allocation, 90-second leases, FIFO queue by admitted event order, idempotent renew/retreat/rotation, and immutable prior contribution references.

- [x] **Step 4: Verify GREEN and old raid regression**

Run the new round tests and existing raid-core tests.  
Expected: PASS with the legacy raid wrapper retaining its old public behavior.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-raid-core.ts src/features/play/wilds-raid-round.ts tests/wilds-raid-round.test.ts tests/wilds-raid-core.test.ts
git commit -m "feat: bound global raid rounds"
```

### Task 3: Semantic raid encounter reducer and card roles

**Files:**
- Create: `src/features/play/wilds-raid-roles.ts`
- Create: `src/features/play/wilds-raid-encounter.ts`
- Create: `tests/wilds-raid-roles.test.ts`
- Create: `tests/wilds-raid-encounter.test.ts`

**Interfaces:**
- Consumes: verified `PortableCardAsset`, boss modules, `WildsRaidRound`, canonical event order.
- Produces: `WildsRaidRole`, `WildsRaidIntent`, `WildsRaidEncounterState`, `projectWildsRaidRoles(card)`, `createWildsRaidEncounter(input)`, `applyWildsRaidIntent(state, intent, authority)`, and `projectWildsRaidTelegraph(state)`.

- [x] **Step 1: Write failing semantic-action tests**

```ts
it("derives role and impact from the verified card instead of client damage", () => {
  const roles = projectWildsRaidRoles(card);
  const next = applyWildsRaidIntent(encounter, { type: "strike", commandId }, authorityFor(card));
  assert.equal(roles.primary.length > 0, true);
  assert.equal(next.acceptedImpact > 0, true);
  assert.equal("damage" in next.acceptedIntent, false);
});

it("uses support objectives, telegraphs, guard, cooldowns, and vulnerability deterministically", () => {
  const replay = intents.reduce(apply, encounter);
  assert.deepEqual(intents.reduce(apply, encounter), replay);
  assert.throws(() => applyWildsRaidIntent(replay, duplicateCooldownIntent, authority), /cooldown/);
});
```

- [x] **Step 2: Verify RED**

Run test-build compilation.  
Expected: missing role and encounter modules.

- [x] **Step 3: Implement six roles and semantic intents**

Map sealed traits deterministically to Vanguard, Striker, Warden, Resonator, Wayfinder, and Steward. Implement fighter intents `strike | guard | focus | interrupt | ability | revive | retreat` and support intents `stabilize | scout | supply | rescue | ward | rotate_request`. Derive normalized impact, cooldown, guard, hazard, combo, objective, transformation, and vulnerability entirely from canonical state and verified card facts.

- [x] **Step 4: Verify GREEN**

Run role/encounter tests plus portable-card and living-card proof regressions.  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-raid-roles.ts src/features/play/wilds-raid-encounter.ts tests/wilds-raid-roles.test.ts tests/wilds-raid-encounter.test.ts
git commit -m "feat: derive canonical raid actions"
```

### Task 4: Canonical boss ecology events, projections, scheduler, and commands

**Files:**
- Modify: `src/features/play/wilds-world-event.ts`
- Modify: `src/features/play/wilds-world-state.ts`
- Modify: `src/features/play/wilds-world-service.ts`
- Modify: `src/features/play/wilds-world-record.ts`
- Modify: `src/lib/receiz/wilds-world-server.ts`
- Modify: `app/api/wilds/world/command/route.ts`
- Create: `tests/wilds-boss-world-service.test.ts`

**Interfaces:**
- Consumes: Tasks 1–3 boss, round, and encounter reducers.
- Produces: boss/round/encounter projections; event kinds for rumor, tracking, movement, assault, round opening/admission/action/lease/rotation/settlement, transformation, vulnerability, defeat, memorial, withdrawal, and successor; commands `boss.track`, `raid.enter`, `raid.act`, `raid.lease`, and `raid.retreat`.

- [x] **Step 1: Write failing authority/replay/concurrency tests**

```ts
it("admits semantic actions in Pulse/Kai-Klok order and replays exact global health", () => {
  const result = service.execute({ type: "raid.act", bossId, roundId, intent: "strike", position, cardProofDigest, commandId }, authority);
  assert.equal(result.projection.bosses[bossId]!.health < before, true);
  assert.deepEqual(replayWildsWorld(service.events()), result.projection);
});

it("admits one winning event, closes the round, and rejects every later action", () => {
  const won = service.execute(lethalSemanticIntent, authority);
  assert.equal(won.projection.bosses[bossId]!.phase, "defeated");
  assert.throws(() => service.execute(lateIntent, authority), /boss_defeated|round_settled/);
});
```

- [x] **Step 2: Verify RED**

Run the new service test.  
Expected: new commands/event kinds are absent.

- [ ] **Step 3: Implement canonical reducers and protected operations**

Add exact payload validation, position/ownership/proof/phase/capacity/lease/cooldown checks, server-derived intent impact, persistent health across rounds, one active round per boss, scheduler density, movement clearance, one active assault, irreversible defeat, aftermath, memorial, and at most one deduplicated successor. Audit major outcomes and preserve existing Slice 1 event interpretation.

- [ ] **Step 4: Verify GREEN and replay regression**

Run boss service, world event, replay, recovery, ecology service, and legacy world-service tests.  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-world-event.ts src/features/play/wilds-world-state.ts src/features/play/wilds-world-service.ts src/features/play/wilds-world-record.ts src/lib/receiz/wilds-world-server.ts app/api/wilds/world/command/route.ts tests/wilds-boss-world-service.test.ts
git commit -m "feat: admit global boss ecology events"
```

### Task 5: Save V8 raid receipts and portable recovery

**Files:**
- Create: `src/features/play/wilds-raid-history.ts`
- Modify: `src/features/play/game-state.ts`
- Modify: `src/features/play/wilds-player-vault.ts`
- Verify existing PNG transport: `src/features/play/card-export.ts`
- Create: `tests/wilds-raid-history.test.ts`
- Modify: `tests/play-game-state.test.ts`
- Modify: `tests/wilds-player-vault.test.ts`
- Verify existing PNG transport: `tests/wilds-player-vault.test.ts`

**Interfaces:**
- Consumes: canonical boss/round/action event IDs, card proof digests, canonical cursor, existing Save V7 and V3 vault merge.
- Produces: `WildsRaidReceipt`, `WildsBossKnowledge`, `projectWildsRaidHistory(events)`, PlayState fields `raidEvents`, `bossKnowledge`, `bossMastery`, `raidAchievements`, and `receiz.wilds.save.v8` accepting V2–V7.

- [x] **Step 1: Write failing receipt and migration tests**

```ts
it("accepts proof-bound participation once and rejects a forged winning receipt", () => {
  const projection = projectWildsRaidHistory([receipt, receipt, forgedWinner]);
  assert.deepEqual(projection.events, [receipt]);
  assert.equal(projection.mastery[receipt.familyId] > 0, true);
});

it("migrates V7 and restores V8 raid history through PNG and player vault", () => {
  assert.deepEqual(restorePlayState(v7).raidEvents, []);
  assert.deepEqual(roundTripV8(stateWithReceipt).raidEvents, [receipt]);
});
```

- [x] **Step 2: Verify RED**

Run the raid-history, game-state, vault, and PNG tests.  
Expected: Save V8 fields and receipt module are absent.

- [x] **Step 3: Implement bounded append-only history**

Verify schema, actor, boss/family/round/action/source event, role, squad/support placement, contribution band, result, revision, time, proof digest, and receipt digest. Bound history to 4,096 events, deduplicate source/kind identity, derive personal knowledge/mastery/achievements, migrate V2–V7 safely, and reconcile without changing canonical health, phase, winner, monument, successor, league, or lease.

- [x] **Step 4: Verify GREEN**

Run the focused persistence tests and full game-state regressions.  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-raid-history.ts src/features/play/game-state.ts src/features/play/wilds-player-vault.ts src/features/play/wilds-save-png.ts tests/wilds-raid-history.test.ts tests/game-state.test.ts tests/wilds-player-vault.test.ts tests/wilds-save-png.test.ts
git commit -m "feat: carry global raids through the player vault"
```

### Task 6: Atlas tracking, territory entry, and aftermath

**Files:**
- Modify: `src/features/play/wilds-world-atlas.ts`
- Modify: `src/features/play/WildsWorldMap.tsx`
- Modify: `src/features/play/wilds-rift-travel.ts`
- Create: `tests/wilds-boss-atlas.test.ts`

**Interfaces:**
- Consumes: canonical boss projections, player `bossKnowledge`, permanent geography, safe Rift logic.
- Produces: `WildsAtlasBoss` visibility `rumor | trace | exact | contested | aftermath | historical`, uncertainty fields without coordinate leakage, movement path segments, assault/raid pills, and outside-territory Rift approaches.

- [x] **Step 1: Write failing privacy and coordinate tests**

```ts
it("omits exact boss coordinates until accepted tracking knowledge", () => {
  const rumor = projectWildsAtlas({ ...input, bosses: [boss], bossKnowledge: {} }).bosses[0]!;
  assert.equal("position" in rumor, false);
  const exact = projectWildsAtlas({ ...input, bosses: [boss], bossKnowledge: exactKnowledge }).bosses[0]!;
  assert.deepEqual("position" in exact ? exact.position : null, boss.position);
});

it("Rifts outside the boss territory and requires walking to enter", () => {
  const approach = bossTerritoryApproachPoint(boss);
  assert.equal(distance(approach, boss.position) > boss.radius, true);
});
```

- [x] **Step 2: Verify RED**

Run the new atlas test.  
Expected: boss atlas projection and approach function are absent.

- [x] **Step 3: Implement progressive tracking projection**

Project rumor/trace objects without `position`, exact/current paths only from valid knowledge, physical territory entry, raid/assault status, health bands without private participant data, exact aftermath monuments, and a non-scrolling one-viewpoint atlas panel. Keep remote raid entry impossible.

- [x] **Step 4: Verify GREEN and atlas/Rift regressions**

Run boss atlas, ecology atlas, world atlas, and Rift tests.  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-world-atlas.ts src/features/play/WildsWorldMap.tsx src/features/play/wilds-rift-travel.ts tests/wilds-boss-atlas.test.ts
git commit -m "feat: track global bosses through the atlas"
```

### Task 7: Local procedural boss territories and transformations

**Files:**
- Create: `src/features/play/WildsBossEnvironment.tsx`
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Modify: `src/features/play/wilds-quality-profile.ts`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: active boss projection, encounter phase, player position, quality profile, world mode.
- Produces: one interest-managed detailed boss, eight recognizable family kits, pooled hazards/signals, three transformation poses, distant boss beacons, and diagnostic boss/fighter/support counts.

- [ ] **Step 1: Add failing rendering-contract assertions**

```ts
assert.match(bossEnvironment, /WILDS_BOSS_FAMILIES/);
assert.match(bossEnvironment, /slice\(0,\s*1\)/);
assert.match(bossEnvironment, /instancedMesh/);
assert.match(bossEnvironment, /crystal-burrower|skycoil-tempest|voidroot-devourer/);
assert.match(worldCanvas, /WildsBossEnvironment/);
assert.doesNotMatch(bossEnvironment, /<Canvas/);
```

- [ ] **Step 2: Verify RED**

Run the render contract.  
Expected: environment file is missing.

- [ ] **Step 3: Implement eight local boss kits**

Build family-specific silhouettes from shared local geometry/material pools, instanced repeated parts, deterministic anatomy transforms, phase poses, telegraph markers, territory props, hazards, and support stations. Render one detailed boss, aggregate support, cap detailed fighters by quality tier, dispose owned resources, and expose counts/budgets through `__THREE_GAME_DIAGNOSTICS__`.

- [ ] **Step 4: Verify GREEN and typecheck**

Run render contracts and `pnpm typecheck`.  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/WildsBossEnvironment.tsx src/features/play/WildsWorldCanvas.tsx src/features/play/wilds-quality-profile.ts tests/wilds-render-contract.test.ts
git commit -m "feat: render the global boss ecology"
```

### Task 8: Full-screen raid experience and responsive controls

**Files:**
- Create: `src/features/play/WildsRaidExperience.tsx`
- Create: `src/features/play/WildsRaidActionDock.tsx`
- Modify: `app/globals.css`
- Modify: `tests/mobile-layout-css.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: boss, round, encounter, verified card/roles, world mode, semantic action callbacks, audio callbacks.
- Produces: focus-safe raid dialog, global health/phase/telegraph, six-squad strip, support state, objective, timer, role/action dock, reconnect/retreat/error/result states, and exact return behavior.

- [ ] **Step 1: Add failing source/CSS contracts**

```ts
assert.match(experience, /aria-modal="true"/);
assert.match(experience, /previousFocus\.current\?\.focus/);
assert.match(css, /\.wilds-raid-experience\s*\{[^}]*height:\s*100dvh;[^}]*overflow:\s*hidden/s);
assert.match(css, /\.wilds-raid-action\s*\{[^}]*min-height:\s*44px/s);
assert.match(css, /\.wilds-raid-squads\s*\{[^}]*overflow-x:\s*auto/s);
```

- [ ] **Step 2: Verify RED**

Run mobile CSS and render contracts.  
Expected: raid experience contracts fail.

- [ ] **Step 3: Implement one-viewport encounter UI**

Use game-HUD composition rather than dashboard cards: fixed global health, telegraph strip, world arena, compact player/card/role pin, objective signal, swipeable squad strip, stable action dock, 44px controls, safe areas, reduced motion, Escape/confirmation, body scroll lock, focus restore, reconnect, retreat, error/rebase, settled, defeat, and practice/canonical provenance.

- [ ] **Step 4: Verify GREEN**

Run the focused UI/CSS/render tests and typecheck.  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/WildsRaidExperience.tsx src/features/play/WildsRaidActionDock.tsx app/globals.css tests/mobile-layout-css.test.ts tests/wilds-render-contract.test.ts
git commit -m "feat: open the global raid experience"
```

### Task 9: Campaign integration, local audio, receipts, and world return

**Files:**
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `src/features/play/use-wilds-world.ts`
- Modify: `src/features/play/WildsLivingWorldHud.tsx`
- Modify: `src/features/play/WildsWorldControls.tsx`
- Modify: `src/features/play/wilds-audio.ts`
- Modify: `tests/wilds-presentation.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: Tasks 4–8 commands, projections, personal history, atlas, environment, and raid UI.
- Produces: nearest-boss Pulse, physical tracking/entry, semantic action dispatch, accepted receipt dispatch, reconnect/retreat, exact return coordinate, family motifs, and resolution/aftermath cues.

- [ ] **Step 1: Add failing end-to-end source/audio contracts**

```ts
assert.match(campaign, /<WildsRaidExperience/);
assert.match(campaign, /record-raid-event/);
assert.match(worldHook, /type:\s*"raid\.act"/);
assert.match(worldHook, /type:\s*"raid\.lease"/);
assert.equal(bossAudioCue("telegraph", "skycoil-tempest"), "boss-skycoil");
assert.equal(bossAudioCue("defeat", "crystal-burrower"), "boss-defeat");
```

- [ ] **Step 2: Verify RED**

Run presentation and render contracts.  
Expected: integration and boss audio mappings are absent.

- [ ] **Step 3: Implement the complete campaign loop**

Project nearest eligible boss, require physical territory radius, track/enter with Pulse, dispatch semantic commands only, append personal receipts only from accepted canonical/practice projections with correct provenance, maintain/release lease, restore focus and exact player coordinate, project boss knowledge into atlas, and synthesize/dispose family, telegraph, support, transformation, vulnerability, defeat, and aftermath cues locally.

- [ ] **Step 4: Verify GREEN and persistence regression**

Run presentation, render, raid-history, game-state, and world-client tests.  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/PlayCampaign.tsx src/features/play/use-wilds-world.ts src/features/play/WildsLivingWorldHud.tsx src/features/play/WildsWorldControls.tsx src/features/play/wilds-audio.ts tests/wilds-presentation.test.ts tests/wilds-render-contract.test.ts
git commit -m "feat: connect players to global boss raids"
```

### Task 10: Slice 4 release qualification and evidence

**Files:**
- Create: `tests/wilds-boss-ecology-release.test.ts`
- Create: `docs/superpowers/evidence/2026-07-15-wilds-v3-slice-4.md`
- Modify: `docs/superpowers/specs/2026-07-15-wilds-v3-living-world-program-design.md`

**Interfaces:**
- Consumes: all Slice 4 systems.
- Produces: one regression contract, browser artifacts, authority/recovery/audio/asset ledgers, renderer evidence, visual scorecard, and honest Slice 4 boundary.

- [ ] **Step 1: Add the release contract before final qualification fixes**

Cover all eight families, compatibility, persistent health, rounds, 36/144 capacity, leases/rotation, semantic-only actions, one winning event, successor deduplication, rumor privacy, physical entry, Save V8/vault recovery, practice/canonical provenance, local-only assets/audio, mobile CSS, and diagnostics.

- [ ] **Step 2: Run the complete verification matrix**

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands exit 0 with zero failed tests.

- [ ] **Step 3: Run production WebKit qualification**

Exercise rumor → tracking → near-Rift → walk → enter → fighter/support actions → telegraph → transformation → vulnerability → reconnect/rotation → retreat → round settlement → later round → global defeat → aftermath → successor → vault restore at 320×568, 390×844, 430×932, and 1440×900. Capture active mobile/desktop screenshots, exact overflow/touch metrics, console output, nonblank canvas, and `__THREE_GAME_DIAGNOSTICS__` with `withinBudget: true`.

- [ ] **Step 4: Write and audit the evidence**

Record commits, commands, test counts, multi-client consistency, browser matrix, screenshots, renderer metrics, local-only visual/audio ledger, authority/recovery evidence, the exact ten-category scorecard, automatic failures, and Slice 5 boundary. Scan changed Slice 4 files for unfinished markers and run the director report audit plus `git diff --check`.

- [ ] **Step 5: Commit**

```bash
git add tests/wilds-boss-ecology-release.test.ts docs/superpowers/evidence/2026-07-15-wilds-v3-slice-4.md docs/superpowers/specs/2026-07-15-wilds-v3-living-world-program-design.md
git commit -m "docs: seal Wilds V3 slice four evidence"
```
