# Wilds V3 Dynamic World Ecology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship eight deterministic, canonical ecology families that progress from rumor through physical discovery, shared activity, aftermath, history, and portable player recovery.

**Architecture:** Add a generalized ecology contract beside the existing Crystal Burrow boss-site contract so prior V3 events remain unchanged. Extend the canonical projection and service with ecology events and bounded Pulse scheduling, project player-specific knowledge into the atlas, render nearby sites in the existing Three.js canvas, and reuse one activity shell for family-specific deterministic modules. Save V7 carries only append-only personal knowledge and receipts; the canonical projection remains authority for world position, phase, and outcome.

**Tech Stack:** Next.js 15, React 19, TypeScript, Three.js/React Three Fiber, Node test runner, Web Crypto-compatible SHA-256 helpers, local Web Audio, Playwright CLI WebKit.

## Global Constraints

- Preserve all V2–V6 saves, existing Crystal Burrow events, cards, proofs, settlements, and V3 vaults.
- Every canonical mutation requires Pulse/Kai-Klok ordering and the existing Receiz publication path.
- Practice state must remain visibly isolated and cannot publish canonical facts.
- No third-party model, image, map, audio, generation, telemetry, or runtime asset API.
- Eight ecology families: `wandering-market`, `echo-ruin`, `unstable-portal`, `convergence-festival`, `creature-migration`, `resource-bloom`, `stormfront`, `settlement-distress`.
- Lifecycle: `foreshadowed → discovered → active → resolving → aftermath → historical`, with authored expiry from nonterminal pre-resolution phases.
- Maximum 24 non-historical sites globally, 5 per region, and 2 active high-intensity sites per region.
- Render no more than two detailed ecology manifestations and retain the 160 draw-call, 180,000-triangle, 110-geometry, and 6-texture budgets.
- Every required control is at least 44×44 CSS pixels and the experience has no page-level overflow at 320px.

---

### Task 1: Ecology contracts, generators, lifecycle, and causal grammar

**Files:**
- Create: `src/features/play/wilds-ecology.ts`
- Create: `tests/wilds-ecology.test.ts`
- Modify: `src/features/play/wilds-dynamic-sites.ts`

**Interfaces:**
- Consumes: `sha256PortableBasis`, `isDynamicSitePositionSafe`, `regionForPosition`, permanent landmark and route clearance.
- Produces: `WILDS_ECOLOGY_FAMILIES`, `WildsEcologyFamilyId`, `WildsEcologyPhase`, `WildsEcologySite`, `generateWildsEcologySite(input)`, `advanceWildsEcologySite(site, phase)`, `generateWildsEcologyEnsemble(input)`, and `deriveWildsEcologyChild(input)`.

- [ ] **Step 1: Write the failing contract tests**

```ts
it("generates every authored family deterministically within density and clearance bounds", () => {
  const sites = generateWildsEcologyEnsemble({ pulse, existingSites: [], ordinalStart: 1 });
  assert.deepEqual(sites.map((site) => site.familyId), WILDS_ECOLOGY_FAMILIES);
  assert.deepEqual(generateWildsEcologyEnsemble({ pulse, existingSites: [], ordinalStart: 1 }), sites);
  assert.equal(sites.every((site) => site.schema === "receiz.wilds_ecology_site.v1"), true);
});

it("allows only authored lifecycle transitions and one deterministic causal child", () => {
  const site = generateWildsEcologySite({ familyId: "stormfront", pulse, ordinal: 1, existingSites: [] });
  const discovered = advanceWildsEcologySite(site, "discovered");
  assert.equal(advanceWildsEcologySite(discovered, "active").phase, "active");
  assert.throws(() => advanceWildsEcologySite(site, "aftermath"), /transition_invalid/);
  assert.deepEqual(deriveWildsEcologyChild({ parent: { ...site, phase: "aftermath" }, ordinal: 2 }), deriveWildsEcologyChild({ parent: { ...site, phase: "aftermath" }, ordinal: 2 }));
});
```

- [ ] **Step 2: Verify RED**

Run: `npx tsx --test tests/wilds-ecology.test.ts`  
Expected: FAIL because `wilds-ecology.ts` does not exist.

- [ ] **Step 3: Implement the bounded deterministic grammar**

```ts
export const WILDS_ECOLOGY_FAMILIES = [
  "wandering-market", "echo-ruin", "unstable-portal", "convergence-festival",
  "creature-migration", "resource-bloom", "stormfront", "settlement-distress"
] as const;
export type WildsEcologyFamilyId = typeof WILDS_ECOLOGY_FAMILIES[number];
export type WildsEcologyPhase = "foreshadowed" | "discovered" | "active" | "resolving" | "aftermath" | "historical" | "expired";
export function generateWildsEcologySite(input: WildsEcologyGeneratorInput): WildsEcologySite;
export function advanceWildsEcologySite(site: WildsEcologySite, phase: WildsEcologyPhase): WildsEcologySite;
export function generateWildsEcologyEnsemble(input: WildsEcologyEnsembleInput): WildsEcologySite[];
export function deriveWildsEcologyChild(input: { parent: WildsEcologySite; ordinal: number }): WildsEcologySite | null;
```

Use a fixed family definition table for names, radii, intensity, activity modules, visual kits, audio motifs, durations, compatible causes, and aftermath modules. Probe at most 128 deterministic positions and return no site when density or placement is exhausted.

- [ ] **Step 4: Verify GREEN and regress Crystal Burrow**

Run: `npx tsx --test tests/wilds-ecology.test.ts tests/wilds-dynamic-sites.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-ecology.ts src/features/play/wilds-dynamic-sites.ts tests/wilds-ecology.test.ts
git commit -m "feat: define the Wilds ecology grammar"
```

### Task 2: Canonical ecology projection, events, scheduler, and commands

**Files:**
- Modify: `src/features/play/wilds-world-event.ts`
- Modify: `src/features/play/wilds-world-state.ts`
- Modify: `src/features/play/wilds-world-service.ts`
- Modify: `src/features/play/wilds-world-record.ts`
- Modify: `src/app/api/wilds/world/command/route.ts`
- Create: `tests/wilds-ecology-world-service.test.ts`

**Interfaces:**
- Consumes: Task 1 ecology definitions and existing event append/checkpoint/publication machinery.
- Produces: projection fields `ecologySites` and `ecologyHistory`; event kinds `ecology.spawned`, `ecology.phase_changed`, `ecology.discovered`, `ecology.contributed`, `ecology.resolved`, `ecology.historicized`; commands `ecology.discover` and `ecology.contribute`.

- [ ] **Step 1: Write failing replay and authority tests**

```ts
it("Pulse admits one deterministic bounded ecology ensemble and replay is exact", () => {
  const service = new WildsWorldService();
  const result = service.tickEcology({ pulse, occurredAt: pulse, systemActorId: "receiz:pulse" });
  assert.equal(Object.keys(result.projection.ecologySites).length, 8);
  assert.deepEqual(replayWildsWorld(service.events()), result.projection);
});

it("requires physical canonical discovery and deduplicates contributions", () => {
  assert.throws(() => service.execute({ type: "ecology.discover", siteId, position: far, commandId: "discover:far" }, authority), /location_invalid/);
  const first = service.execute({ type: "ecology.discover", siteId, position: near, commandId: "discover:near" }, authority);
  const duplicate = service.execute({ type: "ecology.discover", siteId, position: near, commandId: "discover:near" }, authority);
  assert.equal(first.events.length, 1);
  assert.equal(duplicate.events.length, 0);
});
```

- [ ] **Step 2: Verify RED**

Run: `npx tsx --test tests/wilds-ecology-world-service.test.ts`  
Expected: FAIL because ecology projection fields and commands are absent.

- [ ] **Step 3: Implement canonical reducers and bounded commands**

Add exact event-kind validation, projection reducers, `tickEcology`, location checks, verified-card digest checks, phase/capacity checks, idempotent cause IDs, deterministic contribution receipts, resolution, one causal child, and historical compaction. Keep `tick()` behavior compatible for Crystal Burrow and call the ecology scheduler only through an explicit protected Pulse operation.

- [ ] **Step 4: Verify GREEN and world replay regression**

Run: `npx tsx --test tests/wilds-ecology-world-service.test.ts tests/wilds-world-event.test.ts tests/wilds-world-replay.test.ts tests/wilds-world-service.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-world-event.ts src/features/play/wilds-world-state.ts src/features/play/wilds-world-service.ts src/features/play/wilds-world-record.ts src/app/api/wilds/world/command/route.ts tests/wilds-ecology-world-service.test.ts
git commit -m "feat: admit canonical Wilds ecology events"
```

### Task 3: Personal ecology knowledge and Save V7 continuity

**Files:**
- Create: `src/features/play/wilds-ecology-history.ts`
- Create: `tests/wilds-ecology-history.test.ts`
- Modify: `src/features/play/game-state.ts`
- Modify: `src/features/play/wilds-player-vault.ts`
- Modify: `src/features/play/wilds-save-png.ts`
- Modify: `tests/wilds-player-vault.test.ts`
- Modify: `tests/wilds-save-png.test.ts`

**Interfaces:**
- Consumes: canonical ecology site IDs, event IDs, proof digests, projection cursor, existing V6 restore and V3 vault merge.
- Produces: `WildsEcologyReceipt`, `projectWildsEcologyHistory(events)`, PlayState fields `ecologyEvents`, `ecologyKnowledge`, `ecologyMastery`, and Save schema `receiz.wilds.save.v7` accepting V2–V6.

- [ ] **Step 1: Write failing persistence tests**

```ts
it("projects valid ecology receipts once and rejects forged participation", () => {
  const projection = projectWildsEcologyHistory([receipt, receipt]);
  assert.equal(projection.events.length, 1);
  assert.equal(projection.mastery[receipt.familyId], receipt.mastery);
  assert.equal(verifyWildsEcologyReceipt({ ...receipt, digest: `sha256:${"0".repeat(64)}` }).ok, false);
});

it("migrates V6 and round-trips V7 ecology history through PNG and V3 vault", () => {
  const migrated = restorePlayState(JSON.stringify({ schema: "receiz.wilds.save.v6", state: initialPlayState }));
  assert.deepEqual(migrated.ecologyEvents, []);
  assert.deepEqual(reconcileWildsPlayerVault({ local: initialPlayState, restored: vault, canonical, actorId }).state.ecologyEvents, [receipt]);
});
```

- [ ] **Step 2: Verify RED**

Run: `npx tsx --test tests/wilds-ecology-history.test.ts tests/wilds-player-vault.test.ts tests/wilds-save-png.test.ts`  
Expected: FAIL because ecology receipts and V7 state are absent.

- [ ] **Step 3: Implement append-only validation and migration**

Bound history at 2,048 receipts, verify IDs/times/family/phase/proof/canonical cursor, deduplicate by receipt ID and source event, derive knowledge/mastery from receipts, embed V7 in portable PNG, and merge valid history without changing canonical site state.

- [ ] **Step 4: Verify GREEN**

Run: `npx tsx --test tests/wilds-ecology-history.test.ts tests/wilds-player-vault.test.ts tests/wilds-save-png.test.ts tests/game-state.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-ecology-history.ts src/features/play/game-state.ts src/features/play/wilds-player-vault.ts src/features/play/wilds-save-png.ts tests/wilds-ecology-history.test.ts tests/wilds-player-vault.test.ts tests/wilds-save-png.test.ts
git commit -m "feat: carry Wilds ecology through the player vault"
```

### Task 4: Atlas rumor, uncertainty, discovery, and Rift projection

**Files:**
- Modify: `src/features/play/wilds-world-atlas.ts`
- Modify: `src/features/play/WildsWorldMap.tsx`
- Modify: `src/features/play/wilds-rift.ts`
- Create: `tests/wilds-ecology-atlas.test.ts`

**Interfaces:**
- Consumes: canonical ecology projection and player `ecologyKnowledge`.
- Produces: `WildsAtlasEcologySite` with `visibility: "rumor" | "approximate" | "exact" | "aftermath" | "historical"`, bounded uncertainty, safe near-Rift destination, and full-screen map overlays.

- [ ] **Step 1: Write failing privacy and coordinate tests**

```ts
it("never leaks an exact coordinate before physical discovery", () => {
  const rumor = projectWildsAtlas({ ...input, ecologySites: [site], ecologyKnowledge: {} }).ecologySites[0]!;
  assert.equal(rumor.visibility, "rumor");
  assert.equal("position" in rumor, false);
  const exact = projectWildsAtlas({ ...input, ecologySites: [site], ecologyKnowledge: { [site.id]: discovered } }).ecologySites[0]!;
  assert.deepEqual(exact.position, site.position);
});
```

- [ ] **Step 2: Verify RED**

Run: `npx tsx --test tests/wilds-ecology-atlas.test.ts`  
Expected: FAIL because ecology atlas projection is absent.

- [ ] **Step 3: Implement player-specific atlas projection and map UI**

Render uncertainty fields and family markers without exact coordinates, exact markers only after valid knowledge, safe near-Rift travel, lifecycle pills, route/weather effects, and one non-scrolling detail panel. Keep remote activity entry impossible.

- [ ] **Step 4: Verify GREEN and atlas regression**

Run: `npx tsx --test tests/wilds-ecology-atlas.test.ts tests/wilds-world-atlas.test.ts tests/wilds-rift.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-world-atlas.ts src/features/play/WildsWorldMap.tsx src/features/play/wilds-rift.ts tests/wilds-ecology-atlas.test.ts
git commit -m "feat: reveal Wilds ecology through discovery"
```

### Task 5: Local procedural ecology environment

**Files:**
- Create: `src/features/play/WildsEcologyEnvironment.tsx`
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Modify: `src/features/play/wilds-quality.ts`
- Modify: `tests/wilds-three-rendering.test.ts`

**Interfaces:**
- Consumes: ecology projection, player position, world mode, quality tier.
- Produces: one interest-managed `WildsEcologyEnvironment` that renders at most two detailed sites using shared geometries/materials and instanced repeated parts.

- [ ] **Step 1: Add failing rendering-contract assertions**

```ts
assert.match(ecologyEnvironment, /WILDS_ECOLOGY_FAMILIES/);
assert.match(ecologyEnvironment, /slice\(0,\s*2\)/);
assert.match(ecologyEnvironment, /instancedMesh/);
assert.match(worldCanvas, /WildsEcologyEnvironment/);
```

- [ ] **Step 2: Verify RED**

Run: `npx tsx --test tests/wilds-three-rendering.test.ts`  
Expected: FAIL because the ecology environment does not exist.

- [ ] **Step 3: Implement eight procedural kits in the existing canvas**

Use distinct silhouette grammars: folding merchant canopies, broken ruin arches, portal rings, festival ribbons, pooled migration actors, bloom clusters, storm pylons/cloud bands, and settlement rescue beacons. Reuse geometry/material objects, gate particles and actors by quality tier, and expose ecology counts in `__THREE_GAME_DIAGNOSTICS__`.

- [ ] **Step 4: Verify GREEN**

Run: `npx tsx --test tests/wilds-three-rendering.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/WildsEcologyEnvironment.tsx src/features/play/WildsWorldCanvas.tsx src/features/play/wilds-quality.ts tests/wilds-three-rendering.test.ts
git commit -m "feat: render the living Wilds ecology"
```

### Task 6: Reusable ecology activity shell and eight playable modules

**Files:**
- Create: `src/features/play/wilds-ecology-activity.ts`
- Create: `tests/wilds-ecology-activity.test.ts`
- Create: `src/features/play/WildsEcologyExperience.tsx`
- Modify: `app/globals.css`
- Modify: `tests/mobile-layout-css.test.ts`

**Interfaces:**
- Consumes: ecology site, verified card, participants, world mode, contribution command callback.
- Produces: `createWildsEcologyActivity(site)`, `applyWildsEcologyActivityInput(state, input)`, and focus-safe `WildsEcologyExperience`.

- [ ] **Step 1: Write failing deterministic activity tests**

```ts
for (const familyId of WILDS_ECOLOGY_FAMILIES) {
  it(`${familyId} has one deterministic completable module`, () => {
    const first = createWildsEcologyActivity(siteFor(familyId));
    assert.deepEqual(createWildsEcologyActivity(siteFor(familyId)), first);
    assert.equal(runCorrectSequence(first).phase, "submitted");
    assert.equal(first.objectives.length > 0, true);
  });
}
```

- [ ] **Step 2: Verify RED**

Run: `npx tsx --test tests/wilds-ecology-activity.test.ts tests/mobile-layout-css.test.ts`  
Expected: FAIL because the activity engine and shell do not exist.

- [ ] **Step 3: Implement the activity engine and compact experience**

Use one reducer with authored module definitions for delivery, symbol route, node stabilization, harmony, escort, sustain, shelter repair, and rescue stations. Add provenance, participant count, verified-card role, receipt state, reachable exits, focus restoration, Escape handling, safe-area footer, horizontal district-style activity rail where needed, and 44px controls at 320px.

- [ ] **Step 4: Verify GREEN**

Run: `npx tsx --test tests/wilds-ecology-activity.test.ts tests/mobile-layout-css.test.ts tests/wilds-three-rendering.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-ecology-activity.ts src/features/play/WildsEcologyExperience.tsx app/globals.css tests/wilds-ecology-activity.test.ts tests/mobile-layout-css.test.ts
git commit -m "feat: open playable Wilds ecology events"
```

### Task 7: Campaign integration, local audio, discovery receipts, and world return

**Files:**
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `src/features/play/use-wilds-world.ts`
- Modify: `src/features/play/WildsLivingWorldHud.tsx`
- Modify: `src/features/play/WildsWorldControls.tsx`
- Modify: `src/features/play/wilds-audio.ts`
- Modify: `tests/wilds-audio.test.ts`
- Modify: `tests/wilds-three-rendering.test.ts`

**Interfaces:**
- Consumes: Tasks 2–6 world commands, knowledge projection, environment, and activity UI.
- Produces: nearest-event status, physical discovery Pulse, activity entry/contribution, append-only player receipt dispatch, exact return position, and family-specific local audio cues.

- [ ] **Step 1: Add failing end-to-end source contracts**

```ts
assert.match(campaign, /ecology\.discover/);
assert.match(campaign, /WildsEcologyExperience/);
assert.match(campaign, /record-ecology-event/);
assert.match(audio, /ecology-rumor/);
assert.match(audio, /ecology-resolved/);
```

- [ ] **Step 2: Verify RED**

Run: `npx tsx --test tests/wilds-audio.test.ts tests/wilds-three-rendering.test.ts`  
Expected: FAIL because campaign and audio ecology integration is absent.

- [ ] **Step 3: Implement the complete player loop**

Project the nearest eligible ecology signal, require physical radius before discovery/entry, submit canonical commands through `useWildsWorld`, dispatch only accepted personal receipts, display practice provenance, synthesize and dispose family motifs, close to the unchanged player coordinate, and restore focus to the triggering Pulse control.

- [ ] **Step 4: Verify GREEN**

Run: `npx tsx --test tests/wilds-audio.test.ts tests/wilds-three-rendering.test.ts tests/wilds-ecology-history.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/PlayCampaign.tsx src/features/play/use-wilds-world.ts src/features/play/WildsLivingWorldHud.tsx src/features/play/WildsWorldControls.tsx src/features/play/wilds-audio.ts tests/wilds-audio.test.ts tests/wilds-three-rendering.test.ts
git commit -m "feat: connect explorers to the living ecology"
```

### Task 8: Release qualification and Slice 3 evidence

**Files:**
- Create: `tests/wilds-dynamic-ecology-release.test.ts`
- Create: `docs/superpowers/evidence/2026-07-15-wilds-v3-slice-3.md`
- Modify: `docs/superpowers/specs/2026-07-15-wilds-v3-living-world-program-design.md`

**Interfaces:**
- Consumes: all Slice 3 systems.
- Produces: one regression contract, browser artifacts, renderer/audio ledgers, local-only asset ledger, and honest Slice 3 scorecard.

- [ ] **Step 1: Add the failing release contract before final integration fixes**

Cover all eight families, lifecycle, causal deduplication, rumor privacy, physical discovery, contribution validation, Save V7/vault recovery, exact atlas/world coordinates, practice/canonical provenance, local assets, compact CSS, and diagnostics.

- [ ] **Step 2: Run the complete verification matrix**

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands exit 0 with no failed tests.

- [ ] **Step 3: Run production browser qualification**

Exercise rumor → atlas → near-Rift → walk → discover → enter → contribute → resolve → aftermath → return at 320×568, 390×844, 430×932, and desktop WebKit. Interact with every family, complete one deep representative flow, confirm 44px controls/no overflow, capture screenshots, inspect console, and record `__THREE_GAME_DIAGNOSTICS__` with `withinBudget: true`.

- [ ] **Step 4: Write and audit the evidence**

Record commits, commands, test counts, browser matrix, artifacts, renderer metrics, local procedural asset/audio ledgers, authority/recovery evidence, exact visual scorecard categories, and Slice 4 boundary. Scan the changed Slice 3 files for unfinished markers and run `git diff --check`.

- [ ] **Step 5: Commit**

```bash
git add tests/wilds-dynamic-ecology-release.test.ts docs/superpowers/evidence/2026-07-15-wilds-v3-slice-3.md docs/superpowers/specs/2026-07-15-wilds-v3-living-world-program-design.md
git commit -m "docs: seal Wilds V3 slice three evidence"
```
