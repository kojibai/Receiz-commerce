# Wilds Presentation Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a warning-free, performance-budgeted presentation kernel with bounded visual events, synthesized Web Audio, accessible settings, and richer renderer diagnostics for Receiz Wilds.

**Architecture:** Pure TypeScript modules own quality selection, event lifetimes, and audio mappings; React hooks adapt those modules to browser APIs and existing game state. The Three.js canvas consumes a selected quality profile and publishes budget status without gaining authority over gameplay, proof, rewards, ownership, or settlement.

**Tech Stack:** TypeScript, React 19, Next.js 15, Three.js 0.182 compatibility pin, React Three Fiber 9.6.1, Web Audio API, Node test runner, CSS.

## Global Constraints

- The PNG remains the portable proof object for an individual card or vault.
- Card verification remains offline-capable and rejects altered image or proof bytes.
- Deterministic gameplay and append-only proof history must not change.
- Mobile is a primary target.
- Audio starts only after a user gesture and cleans up on unmount.
- Normal exploration must remain at or below 120 draw calls and 180,000 visible triangles.
- Adaptive DPR is 1.0 low, 1.25 medium, and 1.5 high.
- No per-frame console warnings or unbounded event/audio resources.
- Every behavior change uses red-green-refactor.

## File structure

- Create `src/features/play/wilds-quality-profile.ts`: deterministic capability-to-quality selection and renderer budgets.
- Create `src/features/play/wilds-visual-events.ts`: typed, bounded, expiring presentation events.
- Create `src/features/play/wilds-audio.ts`: audio settings, game-state-to-audio-event mapping, and injected Web Audio runtime.
- Create `src/features/play/use-wilds-presentation.ts`: browser lifecycle hook that unlocks, applies settings, emits events, and destroys audio resources.
- Create `src/features/play/WildsAudioSettings.tsx`: accessible compact audio settings sheet.
- Modify `src/features/play/WildsWorldCanvas.tsx`: quality-profile renderer configuration, supported shadows, monotonic animation time, and budget diagnostics.
- Modify `src/features/play/PlayCampaign.tsx`: presentation hook and settings integration.
- Modify `app/globals.css`: compact settings and status treatment.
- Create `tests/wilds-presentation.test.ts`: pure behavior tests.
- Modify `tests/wilds-render-contract.test.ts`: integration/source contracts.
- Modify `package.json` and `pnpm-lock.yaml`: pin Three.js 0.182.0 until React Three Fiber replaces its deprecated `Clock` dependency.

---

### Task 1: Deterministic quality profiles

**Files:**
- Create: `src/features/play/wilds-quality-profile.ts`
- Create: `tests/wilds-presentation.test.ts`

**Interfaces:**
- Produces: `WildsQualityTier`, `WildsQualityProfile`, `selectWildsQualityProfile(input)`, `rendererBudgetStatus(profile, render)`.
- Consumes: numeric viewport width, hardware concurrency, device memory, reduced-motion preference, and measured draw calls/triangles.

- [ ] **Step 1: Write the failing quality-profile tests**

Add this suite to `tests/wilds-presentation.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  rendererBudgetStatus,
  selectWildsQualityProfile
} from "../src/features/play/wilds-quality-profile";

describe("Wilds presentation quality", () => {
  it("selects bounded mobile and desktop profiles", () => {
    assert.equal(selectWildsQualityProfile({ width: 390, hardwareConcurrency: 4, deviceMemory: 4, reducedMotion: false }).tier, "medium");
    assert.equal(selectWildsQualityProfile({ width: 360, hardwareConcurrency: 2, deviceMemory: 2, reducedMotion: false }).dpr, 1);
    assert.equal(selectWildsQualityProfile({ width: 1440, hardwareConcurrency: 12, deviceMemory: 8, reducedMotion: false }).dpr, 1.5);
    assert.equal(selectWildsQualityProfile({ width: 1440, hardwareConcurrency: 12, deviceMemory: 8, reducedMotion: true }).particles, 0.35);
  });

  it("reports renderer budget violations", () => {
    const profile = selectWildsQualityProfile({ width: 390, hardwareConcurrency: 4, deviceMemory: 4, reducedMotion: false });
    assert.deepEqual(rendererBudgetStatus(profile, { calls: 45, triangles: 43_672 }), { withinBudget: true, drawCallRatio: 0.375, triangleRatio: 0.2426222222222222 });
    assert.equal(rendererBudgetStatus(profile, { calls: 121, triangles: 100_000 }).withinBudget, false);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
pnpm exec tsc -p tsconfig.test.json && node scripts/patch-test-imports.mjs && node --test .test-build/tests/wilds-presentation.test.js
```

Expected: compilation fails because `wilds-quality-profile.ts` does not exist.

- [ ] **Step 3: Implement the quality selector and budget status**

Create `src/features/play/wilds-quality-profile.ts` with these exports:

```ts
export type WildsQualityTier = "low" | "medium" | "high";

export type WildsQualityProfile = {
  tier: WildsQualityTier;
  dpr: 1 | 1.25 | 1.5;
  shadowMapSize: 512 | 1024;
  foliage: number;
  particles: number;
  maxDrawCalls: 120;
  maxTriangles: 180_000;
};

export function selectWildsQualityProfile(input: {
  width: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  reducedMotion: boolean;
}): WildsQualityProfile {
  const cores = input.hardwareConcurrency ?? 4;
  const memory = input.deviceMemory ?? 4;
  const tier: WildsQualityTier = input.width <= 380 || cores <= 2 || memory <= 2
    ? "low"
    : input.width < 900 || cores < 8 || memory < 8 ? "medium" : "high";
  const base = tier === "low"
    ? { dpr: 1 as const, shadowMapSize: 512 as const, foliage: 0.58, particles: 0.55 }
    : tier === "medium"
      ? { dpr: 1.25 as const, shadowMapSize: 1024 as const, foliage: 0.8, particles: 0.78 }
      : { dpr: 1.5 as const, shadowMapSize: 1024 as const, foliage: 1, particles: 1 };
  return { ...base, tier, particles: input.reducedMotion ? 0.35 : base.particles, maxDrawCalls: 120, maxTriangles: 180_000 };
}

export function rendererBudgetStatus(profile: WildsQualityProfile, render: { calls: number; triangles: number }) {
  const drawCallRatio = render.calls / profile.maxDrawCalls;
  const triangleRatio = render.triangles / profile.maxTriangles;
  return { withinBudget: drawCallRatio <= 1 && triangleRatio <= 1, drawCallRatio, triangleRatio };
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Step 2 command again.

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-quality-profile.ts tests/wilds-presentation.test.ts
git commit -m "feat: add Wilds renderer quality profiles"
```

---

### Task 2: Bounded visual event timeline

**Files:**
- Create: `src/features/play/wilds-visual-events.ts`
- Modify: `tests/wilds-presentation.test.ts`

**Interfaces:**
- Produces: `WildsVisualEventKind`, `WildsVisualEvent`, `appendWildsVisualEvent(events, event, now)`, `activeWildsVisualEvents(events, now)`.
- Consumes: immutable presentation events only; no gameplay state mutations.

- [ ] **Step 1: Write failing event-bound tests**

Append:

```ts
import { activeWildsVisualEvents, appendWildsVisualEvent } from "../src/features/play/wilds-visual-events";

describe("Wilds visual events", () => {
  it("deduplicates, expires, and bounds presentation events", () => {
    const first = appendWildsVisualEvent([], { id: "scan-1", kind: "search", createdAt: 100, durationMs: 800, intensity: 0.7 }, 100);
    const duplicate = appendWildsVisualEvent(first, { id: "scan-1", kind: "search", createdAt: 120, durationMs: 800, intensity: 1 }, 120);
    assert.equal(duplicate.length, 1);
    let events = duplicate;
    for (let index = 0; index < 40; index += 1) {
      events = appendWildsVisualEvent(events, { id: `impact-${index}`, kind: "impact", createdAt: 200 + index, durationMs: 900, intensity: 1 }, 200 + index);
    }
    assert.equal(events.length, 24);
    assert.equal(activeWildsVisualEvents(events, 2_000).length, 0);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run the Task 1 focused-test command.

Expected: compilation fails because `wilds-visual-events.ts` does not exist.

- [ ] **Step 3: Implement immutable bounded events**

Create:

```ts
export type WildsVisualEventKind = "search" | "rustle" | "emerge" | "impact" | "capture" | "seal" | "reveal" | "evolve" | "lineage" | "player-arrival";
export type WildsVisualEvent = { id: string; kind: WildsVisualEventKind; createdAt: number; durationMs: number; intensity: number };
const MAX_ACTIVE_EVENTS = 24;

export function activeWildsVisualEvents(events: WildsVisualEvent[], now: number) {
  return events.filter((event) => now - event.createdAt < event.durationMs);
}

export function appendWildsVisualEvent(events: WildsVisualEvent[], event: WildsVisualEvent, now: number) {
  if (events.some((candidate) => candidate.id === event.id)) return activeWildsVisualEvents(events, now);
  return [...activeWildsVisualEvents(events, now), event].slice(-MAX_ACTIVE_EVENTS);
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Expected: 3 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-visual-events.ts tests/wilds-presentation.test.ts
git commit -m "feat: add bounded Wilds visual events"
```

---

### Task 3: Synthesized audio contract and runtime

**Files:**
- Create: `src/features/play/wilds-audio.ts`
- Modify: `tests/wilds-presentation.test.ts`

**Interfaces:**
- Produces: `WildsAudioSettings`, `WildsAudioCue`, `DEFAULT_WILDS_AUDIO_SETTINGS`, `normalizeWildsAudioSettings(value)`, `audioCuesForTransition(previous, next)`, `createWildsAudioRuntime(factory)`.
- Runtime methods: `unlock()`, `setSettings(settings)`, `play(cue)`, `startAmbience()`, `stopAmbience()`, `destroy()`.
- Consumes: encounter phase/proximity and presentation-only events. It does not dispatch gameplay inputs.

- [ ] **Step 1: Write failing settings, cue, and cleanup tests**

Append tests that assert:

```ts
import {
  DEFAULT_WILDS_AUDIO_SETTINGS,
  audioCuesForTransition,
  createWildsAudioRuntime,
  normalizeWildsAudioSettings
} from "../src/features/play/wilds-audio";

it("normalizes persisted audio settings", () => {
  assert.deepEqual(normalizeWildsAudioSettings({ master: 2, effects: -1, ambience: 0.4, music: 0.3, muted: true }), { master: 1, effects: 0, ambience: 0.4, music: 0.3, muted: true });
  assert.deepEqual(normalizeWildsAudioSettings(null), DEFAULT_WILDS_AUDIO_SETTINGS);
});

it("maps encounter changes onto intentional cues", () => {
  assert.deepEqual(audioCuesForTransition({ phase: "idle", proximity: "cold" }, { phase: "hint", proximity: "hot" }), ["search", "proximity-hot", "rustle"]);
  assert.deepEqual(audioCuesForTransition({ phase: "capsule", proximity: "hot" }, { phase: "sealed", proximity: "hot" }), ["seal"]);
});

it("destroys every synthesized audio resource", async () => {
  const calls: string[] = [];
  const runtime = createWildsAudioRuntime(() => ({
    resume: async () => { calls.push("resume"); },
    close: async () => { calls.push("close"); },
    createOscillator: () => ({ connect() {}, start() {}, stop() { calls.push("stop"); }, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }),
    currentTime: 0,
    destination: {}
  }));
  await runtime.unlock();
  runtime.play("search");
  await runtime.destroy();
  assert.deepEqual(calls, ["resume", "stop", "close"]);
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Expected: compilation fails because `wilds-audio.ts` does not exist.

- [ ] **Step 3: Implement settings, transition mapping, and injected oscillator runtime**

Implement the declared interfaces with:

- finite clamping to `[0, 1]`;
- cue frequencies and durations stored in a readonly mapping;
- master/effects scaling applied before oscillator start;
- no oscillator creation while muted or before `unlock()`;
- every created oscillator retained until its scheduled stop;
- idempotent `destroy()` that stops retained oscillators and closes the context once;
- ambience implemented as a low-volume two-oscillator bed started only once and stopped explicitly.

Use `OscillatorNode`, `GainNode`, and `AudioContext` only behind the injected factory so Node tests never require browser globals.

- [ ] **Step 4: Run focused tests and verify GREEN**

Expected: 6 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/wilds-audio.ts tests/wilds-presentation.test.ts
git commit -m "feat: add synthesized Wilds audio runtime"
```

---

### Task 4: Browser presentation hook and accessible audio controls

**Files:**
- Create: `src/features/play/use-wilds-presentation.ts`
- Create: `src/features/play/WildsAudioSettings.tsx`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `app/globals.css`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- `useWildsPresentation({ encounter, enabled })` returns `{ audioSettings, setAudioSettings, audioReady, unlockAudio, visualEvents }`.
- `WildsAudioSettings` receives those settings, readiness state, `onChange`, and `onUnlock`.

- [ ] **Step 1: Write failing source-contract assertions**

Add a render-contract test that requires:

```ts
const campaign = await readFile("src/features/play/PlayCampaign.tsx", "utf8");
const hook = await readFile("src/features/play/use-wilds-presentation.ts", "utf8");
const controls = await readFile("src/features/play/WildsAudioSettings.tsx", "utf8");
assert.match(campaign, /useWildsPresentation/);
assert.match(campaign, /<WildsAudioSettings/);
assert.match(hook, /pointerdown/);
assert.match(hook, /runtime\.destroy\(\)/);
assert.match(controls, /aria-label="Wilds audio settings"/);
assert.match(controls, /Master volume/);
assert.match(controls, /Effects volume/);
assert.match(controls, /Ambience volume/);
assert.match(controls, /Music volume/);
assert.match(controls, /Mute Wilds audio/);
```

- [ ] **Step 2: Run the render-contract test and verify RED**

Run:

```bash
pnpm test -- wilds-render-contract
```

Expected: failure because the hook and settings component do not exist.

- [ ] **Step 3: Implement the hook lifecycle**

The hook must:

- restore settings from `receiz:wilds:audio:v1` through `normalizeWildsAudioSettings`;
- instantiate one runtime per mounted campaign;
- register one `pointerdown` unlock listener with `{ once: true }` while enabled;
- start ambience after unlock;
- compare previous and current encounter presentation state and play mapped cues;
- append matching bounded visual events using stable phase-transition IDs;
- persist settings defensively;
- stop ambience and call `runtime.destroy()` in its effect cleanup.

- [ ] **Step 4: Build the accessible compact settings component**

Use a `<details className="wilds-audio-settings">` whose summary is an icon-only button surface with `aria-label="Wilds audio settings"`. Include four labeled `input type="range" min="0" max="1" step="0.05"` controls and one mute checkbox. Show `Sound ready` or `Tap world for sound` as a live status; do not put permanent text beside the closed toolbar icon.

- [ ] **Step 5: Integrate with `PlayCampaign` and CSS**

Call the hook after encounter state exists, pass settings to `WildsAudioSettings`, and place it in the existing game toolbar. CSS must keep the closed control visually at 32px while retaining a 44px interactive target, fit its expanded sheet inside `min(320px, calc(100vw - 24px))`, and respect safe-area padding and reduced motion.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run the full presentation test and render-contract test.

Expected: all focused tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/play/use-wilds-presentation.ts src/features/play/WildsAudioSettings.tsx src/features/play/PlayCampaign.tsx app/globals.css tests/wilds-render-contract.test.ts
git commit -m "feat: integrate Wilds audio and presentation settings"
```

---

### Task 5: Warning-free renderer compatibility and diagnostics

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- `WildsWorldCanvas` gains `qualityProfile: WildsQualityProfile`.
- Browser diagnostics gain `quality`, `budget`, and `warningFreeCompatibility` fields.

- [ ] **Step 1: Write failing compatibility assertions**

Add assertions:

```ts
const pkg = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(pkg.dependencies.three, "0.182.0");
assert.doesNotMatch(world, /shadows\s*>/);
assert.match(world, /shadows=\{\{ type: THREE\.PCFShadowMap \}\}/);
assert.match(world, /qualityProfile\.dpr/);
assert.match(world, /rendererBudgetStatus/);
assert.match(world, /warningFreeCompatibility/);
```

- [ ] **Step 2: Run the contract test and verify RED**

Expected: package version and canvas configuration assertions fail.

- [ ] **Step 3: Pin the compatible Three.js release**

Run:

```bash
pnpm add three@0.182.0 --save-exact
```

Reason: React Three Fiber 9.6.1 is the current release and constructs `THREE.Clock`; Three.js 0.183+ deprecates that class. Pinning 0.182.0 removes the vendor warning without patching dependencies or filtering the console.

- [ ] **Step 4: Apply explicit supported shadow and DPR configuration**

Replace the boolean `shadows` prop with `shadows={{ type: THREE.PCFShadowMap }}`, set `dpr={qualityProfile.dpr}`, and set the directional-light shadow map size from `qualityProfile.shadowMapSize`. Remove the redundant `gl.shadowMap.type` mutation from `onCreated`.

- [ ] **Step 5: Remove component reliance on R3F clock time**

Create a module helper:

```ts
function frameSeconds() {
  return performance.now() / 1_000;
}
```

Replace every `useFrame(({ clock }) => ...)` access in `WildsWorldCanvas.tsx` with `useFrame(() => { const elapsed = frameSeconds(); ... })`. This makes presentation components independent of the deprecated state clock and prepares a future R3F Timer migration.

- [ ] **Step 6: Publish quality and budget diagnostics**

Pass the quality profile into `WildsDiagnostics` and `publishWildsDiagnostics`; calculate `rendererBudgetStatus(profile, { calls, triangles })`. Publish:

```ts
quality: { tier: profile.tier, dpr: profile.dpr },
budget: rendererBudgetStatus(profile, { calls: gl.info.render.calls, triangles: gl.info.render.triangles }),
warningFreeCompatibility: { three: "0.182.0", shadowType: "PCFShadowMap" }
```

- [ ] **Step 7: Select the profile in `PlayCampaign`**

Use a lazy state initializer reading `window.innerWidth`, `navigator.hardwareConcurrency`, optional `navigator.deviceMemory`, and `matchMedia("(prefers-reduced-motion: reduce)")`. Recompute on resize and preference change, then pass the profile into `WildsWorldCanvas`.

- [ ] **Step 8: Run focused tests and verify GREEN**

Expected: presentation and render-contract tests pass.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml src/features/play/WildsWorldCanvas.tsx src/features/play/PlayCampaign.tsx tests/wilds-render-contract.test.ts
git commit -m "fix: make Wilds renderer warning-free and budgeted"
```

---

### Task 6: Production browser and release qualification

**Files:**
- Modify only files implicated by observed failures.

**Interfaces:**
- No new public interface; this task verifies the phase deliverable.

- [ ] **Step 1: Run the full automated suite**

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm receiz:doctor
```

Expected: 0 failures, 0 type errors, 0 lint errors, SDK doctor `ok: true` with SDK 100.0.0.

- [ ] **Step 2: Run the optimized build**

```bash
pnpm build
```

Expected: optimized production build exits 0.

- [ ] **Step 3: Start a production preview**

```bash
pnpm start -p 3000
```

Expected: app listens on `http://127.0.0.1:3000`.

- [ ] **Step 4: Verify real desktop input and audio lifecycle**

Using Playwright WebKit: open `/#play`, select an explorer if needed, click terrain, move with the trackpad, open audio settings, change each volume, mute/unmute, and confirm diagnostics change after movement. Capture `output/playwright/wilds-foundation-desktop.png`.

Expected: real state changes, settings persist after reload, and console contains 0 errors plus no `Clock` or `PCFSoftShadowMap` warnings.

- [ ] **Step 5: Verify mobile fit and pixel evidence**

At 390x844: repeat terrain search and movement, open/close audio settings, inspect that the canvas is nonblank and controls do not cover the settings sheet. Capture `output/playwright/wilds-foundation-mobile.png` and diagnostics.

Expected: drawing buffer is nonzero, DPR matches selected profile, budget `withinBudget` is true, and settings remain reachable.

- [ ] **Step 6: Verify cleanup**

Navigate away from Play and back twice.

Expected: one ambience graph after return, no repeated audio, no growing warning count, and no unbounded request or timer growth.

- [ ] **Step 7: Commit any verified corrections**

```bash
git add src/features/play app/globals.css tests/wilds-presentation.test.ts tests/wilds-render-contract.test.ts package.json pnpm-lock.yaml
git commit -m "fix: qualify Wilds presentation foundation"
```

Skip this commit when browser verification requires no code correction.

## Plan self-review

- Spec coverage in this sub-project: quality profiles, bounded presentation events, audio runtime/settings, supported render configuration, diagnostics, responsive audio controls, cleanup, and release proof.
- Deferred to later approved plans: authored avatar/world, cinematic encounter replacement, full UI restructuring, durable authenticated multiplayer/escrow, and endless world chapters.
- Placeholder scan: no implementation placeholder remains; each production behavior and command has an explicit acceptance condition.
- Type consistency: `WildsQualityProfile`, `WildsVisualEvent`, `WildsAudioSettings`, and hook/component interfaces are defined before consumption.
