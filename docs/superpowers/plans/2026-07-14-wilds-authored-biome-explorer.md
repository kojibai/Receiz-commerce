# Wilds Authored Biome and Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise the active Wilds world from a readable procedural prototype to a premium authored vertical slice with a memorable explorer, layered Verdant Crown biome, gameplay-significant landmarks, richer materials, weather, and event-driven motion while preserving deterministic placement and mobile budgets.

**Architecture:** Keep deterministic world decisions in a pure `wilds-biome` projection module and visual construction in focused React Three Fiber components. `WildsWorldCanvas` remains the scene compositor; it delegates explorer anatomy, environment layers, and atmosphere to new components that consume existing authoritative state and quality profiles without changing proof, battle, ownership, or reward decisions.

**Tech Stack:** Next.js 15, React 19, React Three Fiber 9, Three.js 0.182, TypeScript, Node test runner, Playwright production browser QA.

## Global Constraints

- The PNG remains the portable proof object; this phase may not alter card or vault verification.
- Creature placement, variants, combat, growth, and lineage remain deterministic from sealed inputs.
- Mobile remains a primary target with DPR at or below 1.5, at most 120 draw calls, and at most 180,000 triangles.
- Decorative world objects must communicate traversal, habitat, climate, progression, or encounter state.
- External hero/model generation is blocked by the recorded missing Tripo and Gemini credentials, so authored geometry must retain a later GLB substitution boundary.
- Existing versioned saves and verified cards remain readable.
- Use failing tests before production changes and commit each independently reviewable task.

---

### Task 1: Deterministic Verdant Crown biome projection

**Files:**
- Create: `src/features/play/wilds-biome.ts`
- Test: `tests/wilds-biome.test.ts`

**Interfaces:**
- Produces: `projectWildsBiome(tileX: number, tileZ: number, missionProgress: number): WildsBiomeTile`.
- Produces: `WildsBiomeTile` with stable `ground`, `trail`, `canopy`, `weather`, `landmark`, `ecology`, and `seed` fields.
- Consumed by: `WildsEnvironment` in Task 2.

- [ ] **Step 1: Write the failing deterministic projection tests**

```ts
const first = projectWildsBiome(3, -7, 38);
assert.deepEqual(first, projectWildsBiome(3, -7, 38));
assert.notDeepEqual(first, projectWildsBiome(4, -7, 38));
assert.ok(["sun-shower", "pollen-drift", "clear"].includes(first.weather));
assert.ok(first.ecology.treeCount >= 2 && first.ecology.treeCount <= 5);
assert.equal(projectWildsBiome(0, 0, 100).landmark.kind, "hearttree-sanctum");
```

- [ ] **Step 2: Run the suite and verify failure because the module is absent**

Run: `pnpm test`
Expected: FAIL resolving `wilds-biome`.

- [ ] **Step 3: Implement the pure projection and named material palette**

```ts
export type WildsWeather = "clear" | "sun-shower" | "pollen-drift";
export type WildsLandmark = { kind: "hearttree-sanctum" | "root-arch" | "spring" | "none"; rotation: number; scale: number };
export type WildsBiomeTile = {
  seed: number;
  ground: { base: string; moss: string; soil: string };
  trail: { base: string; edge: string };
  canopy: { deep: string; mid: string; highlight: string };
  weather: WildsWeather;
  landmark: WildsLandmark;
  ecology: { treeCount: number; bushCount: number; rockCount: number; flowerCount: number };
};
```

Use one stable integer hash; reserve the origin for `hearttree-sanctum`; derive other landmarks sparsely so they never expose hidden creature coordinates.

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-biome.ts tests/wilds-biome.test.ts
git commit -m "feat: project the Verdant Crown biome deterministically"
```

### Task 2: Layered environment and meaningful landmark kit

**Files:**
- Create: `src/features/play/WildsEnvironment.tsx`
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: `projectWildsBiome`, `PlayState["player"]`, `missionProgress`, and `WildsQualityProfile`.
- Produces: `WildsEnvironment({ player, missionProgress, qualityProfile })` with ground, trails, foreground ecology, middle-distance landmark, and far silhouettes.

- [ ] **Step 1: Add failing render-contract assertions**

```ts
assert.match(environmentSource, /data-world-layer="play"/);
assert.match(environmentSource, /data-world-layer="mid"/);
assert.match(environmentSource, /data-world-layer="far"/);
assert.match(environmentSource, /HearttreeSanctum/);
assert.match(environmentSource, /InstancedMesh/);
```

- [ ] **Step 2: Run tests and verify the missing component failure**

Run: `pnpm test`
Expected: FAIL because `WildsEnvironment.tsx` does not exist.

- [ ] **Step 3: Build the environment kit**

Create reusable authored pieces with exact responsibilities: `HearttreeSanctum` owns flared roots, hollow trunk, layered crown, and proof-light core; `RootArch` owns curved `TubeGeometry` roots marking traversal; `SpringLandmark` owns the recovery-semantic stone basin, water disc, and reeds; `VerdantTree` owns a tapered trunk, branch forks, and three crown forms; `FacetedRock` owns rotated stone clusters and moss caps.

Retain instancing for repeated trees, shrubs, rocks, flowers, grass blades, and far canopy silhouettes. Add narrow trail edge strips and leaf-litter decals. Never render collectible rings or hotspot markers.

- [ ] **Step 4: Replace the old terrain/forest/ground-cover implementation**

`WildsWorldCanvas` should render `WildsEnvironment` inside `SearchableTerrain` while pointer search still converts local hit coordinates into stable world coordinates.

- [ ] **Step 5: Run tests, typecheck, and lint**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/play/WildsEnvironment.tsx src/features/play/WildsWorldCanvas.tsx tests/wilds-render-contract.test.ts
git commit -m "feat: build a layered Verdant Crown world kit"
```

### Task 3: Authored explorer anatomy and locomotion

**Files:**
- Create: `src/features/play/WildsExplorer.tsx`
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Produces: `WildsExplorer({ style, worldPosition, remote? })`.
- Consumes: existing male/female selection and world-coordinate movement only.
- Provides named joints for `hips`, `spine`, `head`, shoulders, elbows, hands, knees, ankles, hair, satchel, and scarf.

- [ ] **Step 1: Add failing anatomy and motion contracts**

```ts
for (const joint of ["hips", "spine", "leftElbow", "rightElbow", "leftKnee", "rightKnee", "satchel", "scarf"]) {
  assert.match(explorerSource, new RegExp(joint));
}
assert.match(explorerSource, /movingUntil/);
assert.match(explorerSource, /breath/);
assert.match(explorerSource, /footPlant/);
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test`
Expected: FAIL because `WildsExplorer.tsx` does not exist.

- [ ] **Step 3: Build the layered explorer**

Use tapered capsule limbs with separate upper/lower segments, pelvis and shaped jacket layers, neck and jaw silhouette, ears, nose, hair mass plus strands, hands, boots with soles, scarf, belt, satchel, and Receiz wrist capsule. Preserve the friendly rear-facing miniature proportions and keep the head unobstructed.

- [ ] **Step 4: Add procedural locomotion and secondary motion**

Animate stride, elbow counter-swing, knee lift, foot planting, hip shift, torso counter-rotation, idle breathing, head look, scarf delay, satchel bounce, and eased facing. Remote explorers reuse the same component with reduced secondary motion.

- [ ] **Step 5: Replace local and remote avatar usage and verify**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/play/WildsExplorer.tsx src/features/play/WildsWorldCanvas.tsx tests/wilds-render-contract.test.ts
git commit -m "feat: author the Wilds explorer and locomotion"
```

### Task 4: Atmosphere, lighting, and event-driven world motion

**Files:**
- Create: `src/features/play/WildsAtmosphere.tsx`
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Modify: `src/features/play/wilds-audio.ts`
- Modify: `tests/wilds-presentation.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Produces: `WildsAtmosphere({ player, missionProgress, encounter, qualityProfile })`.
- Consumes: deterministic biome weather and existing encounter proximity.
- Extends audio cue union with `weather-pollen`, `landmark-near`, and `foliage-surge` without changing gameplay state.

- [ ] **Step 1: Add failing atmosphere and cue tests**

```ts
assert.deepEqual(audioCuesForTransition(
  { phase: "hint", proximity: "warm" },
  { phase: "hint", proximity: "hot" }
), ["proximity-hot", "foliage-surge"]);
assert.match(atmosphereSource, /SunShafts/);
assert.match(atmosphereSource, /PollenDrift/);
assert.match(atmosphereSource, /CanopyShadows/);
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test`
Expected: FAIL on the new cue and missing atmosphere component.

- [ ] **Step 3: Implement restrained atmosphere**

Use a hemisphere fill, directional key, warm rim, animated low-cost pollen/leaf motes, sun-shaft cards, subtle canopy shadow discs, and weather-specific particle density. Hot proximity should bend nearby habitat cover and trigger a bounded foliage surge; it must not reveal exact coordinates.

- [ ] **Step 4: Extend synthesized cue mapping and runtime**

Add short filtered oscillator/noise gestures for foliage surge and landmark arrival. Respect all existing settings, unlock, mute, and teardown rules.

- [ ] **Step 5: Run the full static verification set**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build && pnpm receiz:doctor`
Expected: all pass with no deprecated renderer warning.

- [ ] **Step 6: Commit**

```bash
git add src/features/play/WildsAtmosphere.tsx src/features/play/WildsWorldCanvas.tsx src/features/play/wilds-audio.ts tests/wilds-presentation.test.ts tests/wilds-render-contract.test.ts
git commit -m "feat: add Verdant Crown atmosphere and world motion"
```

### Task 5: Production screenshot and performance qualification

**Files:**
- Modify if required by measured failures: `src/features/play/WildsEnvironment.tsx`, `src/features/play/WildsExplorer.tsx`, `src/features/play/WildsAtmosphere.tsx`, `src/features/play/WildsWorldCanvas.tsx`, `app/globals.css`
- Create artifacts: `output/playwright/wilds-biome-desktop.png`, `output/playwright/wilds-biome-mobile.png`

**Interfaces:**
- Consumes: `window.__THREE_GAME_DIAGNOSTICS__` and production browser screenshots.
- Produces: evidence for the exact ten-category visual scorecard.

- [ ] **Step 1: Start the optimized production server and open a fresh browser session**

Run: `pnpm start -p 3000`
Expected: production server ready at `http://127.0.0.1:3000/#play`.

- [ ] **Step 2: Verify active desktop play**

Choose an explorer, drag the movement trackpad, click terrain, and capture the desktop screenshot. Assert one campaign/canvas and zero page errors or warnings.

- [ ] **Step 3: Verify active mobile play**

At 390x844, repeat movement and search, open/close the compact mission tray, and capture the mobile screenshot. Assert all controls remain actionable without overlap.

- [ ] **Step 4: Record renderer diagnostics and enforce budgets**

Expected: DPR <= 1.5, draw calls <= 120, triangles <= 180,000, nonblank canvas, `budget.withinBudget === true`.

- [ ] **Step 5: Score the exact visual categories**

Score Art direction, Hero/player, Obstacles/enemies, Rewards/interactables, World/environment, Materials/textures, Lighting/render, VFX/motion, UI/HUD, and Performance evidence. Do not claim 10/10 if any category remains below 2/3 or an automatic failure remains.

- [ ] **Step 6: Commit measured corrections**

```bash
git add src/features/play app/globals.css tests
git commit -m "fix: qualify the authored Wilds vertical slice"
```
