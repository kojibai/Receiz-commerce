# Wilds World-Class Production Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Wilds oscillator tones and browser speech with a locally shipped adaptive cinematic sound system covering music, ambience, gameplay effects, creatures, bosses, and a full human-sounding voice cast.

**Architecture:** A typed asset manifest and semantic audio director sit behind the existing `wilds-audio.ts` compatibility boundary. Short assets decode into bounded Web Audio buffers; long music, ambience, and dialogue use managed media elements. Six mix buses, regional banks, priority/concurrency rules, dialogue ducking, spatial emitters, and lifecycle cleanup make the system responsive without unbounded memory or playback.

**Tech Stack:** TypeScript, React 19, Web Audio API, HTMLMediaElement, Three.js positional context, Node test runner, ElevenLabs asset generation tooling, MP3 44.1 kHz runtime assets, JSON/TypeScript production manifests.

## Global Constraints

- Work directly on `main` as explicitly authorized by the user.
- Store runtime audio locally; no browser runtime generation service or third-party audio dependency.
- Do not use browser speech synthesis or oscillator-tone fallback.
- Use only original generated/recorded assets with per-file provenance and usage-rights metadata.
- Preserve user-gesture unlock, mute, pause/resume, page visibility, route cleanup, and disposal behavior.
- Keep critical gameplay information redundant through visuals/text; every spoken line has subtitles.
- Use six buses: `master`, `music`, `ambience`, `effects`, `creatures`, and `dialogue`.
- Use adaptive regional identities: organic mythic sci-fi for Verdant Heartlands/Amberweald, epic fantasy for Echo Highlands/Moonwater Reach, and futuristic electronic for Prism Coast.
- Run TDD for runtime behavior and manifest contracts; observe each new test fail before implementation.
- Generate files with the Three.js audio generator and record prompt, duration, loop flag, format, voice ID, and output path.
- Do not commit API keys, bearer tokens, provider secrets, scratch recordings containing private speech, or unlicensed third-party material.

## File Structure

### Create

- `src/features/play/audio/wilds-audio-types.ts` — shared manifest, event, bus, bank, voice, and runtime types.
- `src/features/play/audio/wilds-audio-catalog.ts` — typed production asset catalog and required coverage lists.
- `src/features/play/audio/wilds-audio-loader.ts` — fetch/decode/stream loading, cache, preload, eviction, and diagnostics.
- `src/features/play/audio/wilds-audio-mixer.ts` — six buses, ducking, mute, volume, and lifecycle graph.
- `src/features/play/audio/wilds-audio-director.ts` — semantic event routing, variants, cooldowns, concurrency, banks, and adaptive music state.
- `src/features/play/audio/wilds-dialogue.ts` — cast registry, subtitle queue, priority, interruption, and cooldown policy.
- `src/features/play/audio/wilds-spatial-audio.ts` — listener/emitter projection and distance policy.
- `src/features/play/audio/wilds-audio-production.ts` — source prompts, voice IDs, formats, and generation metadata.
- `scripts/validate-wilds-audio.mjs` — file existence, orphan, coverage, metadata, and oscillator/browser-voice scan.
- `tests/wilds-audio-catalog.test.ts` — manifest and coverage contracts.
- `tests/wilds-audio-loader.test.ts` — load/cache/eviction/failure behavior.
- `tests/wilds-audio-mixer.test.ts` — buses, ducking, mute, and disposal.
- `tests/wilds-audio-director.test.ts` — routing, regions, variants, cooldowns, transitions, and concurrency.
- `tests/wilds-dialogue.test.ts` — cast, subtitles, interruption, and cooldowns.
- `tests/wilds-spatial-audio.test.ts` — listener and emitter projection.
- `public/audio/wilds/` — generated runtime assets grouped by `global`, `regions`, `ecology`, `creatures`, `bosses`, and `voice`.

### Modify

- `src/features/play/wilds-audio.ts` — replace oscillator runtime with the compatibility facade over the new director.
- `src/features/play/use-wilds-presentation.ts` — create/unlock/dispose the production runtime and update semantic world state.
- `src/features/play/WildsAudioSettings.tsx` — add creature/dialogue buses, subtitles, and reduced-intensity control.
- `src/features/play/PlayCampaign.tsx` — provide region, listener position, world state, and dialogue events.
- `src/features/play/WildsSettlementExperience.tsx` — route settlement dialogue and spatial ambience through semantic events.
- `src/features/play/wilds-player-vault.ts` — persist new audio settings with backward-compatible defaults.
- `package.json` — add `validate:audio` and include it in the release gate.
- Existing audio tests — remove oscillator assertions and assert production asset behavior.

---

### Task 1: Typed Catalog and Release Validator

**Files:**
- Create: `src/features/play/audio/wilds-audio-types.ts`
- Create: `src/features/play/audio/wilds-audio-catalog.ts`
- Create: `src/features/play/audio/wilds-audio-production.ts`
- Create: `scripts/validate-wilds-audio.mjs`
- Create: `tests/wilds-audio-catalog.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `WildsAudioAsset`, `WildsAudioAssetId`, `WildsAudioBus`, `WildsAudioBankId`, `WildsAudioCatalog`, `WILDS_AUDIO_ASSETS`, `WILDS_AUDIO_PRODUCTION`, `requiredWildsAudioCoverage()`.
- Consumes: existing `WildsAudioCue`, ecology family IDs, boss family IDs, and world geography names.

- [ ] **Step 1: Write failing catalog tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WILDS_AUDIO_ASSETS,
  requiredWildsAudioCoverage,
} from "../src/features/play/audio/wilds-audio-catalog";

describe("Wilds production audio catalog", () => {
  it("covers every required semantic cue with local production assets", () => {
    const ids = new Set(WILDS_AUDIO_ASSETS.map((asset) => asset.id));
    for (const id of requiredWildsAudioCoverage()) assert.ok(ids.has(id), `missing ${id}`);
    for (const asset of WILDS_AUDIO_ASSETS) {
      assert.match(asset.url, /^\/audio\/wilds\//);
      assert.ok(!asset.url.includes("placeholder"));
      assert.ok(asset.variants.length >= 1);
    }
  });

  it("requires complete production provenance for every declared asset", () => {
    for (const asset of WILDS_AUDIO_ASSETS) {
      assert.ok(asset.production.prompt.length >= 24);
      assert.ok(asset.production.format.length > 0);
      assert.ok(asset.production.generatedAt.length > 0);
    }
  });
});
```

- [ ] **Step 2: Run the catalog test and verify RED**

Run: `pnpm exec node --import tsx --test tests/wilds-audio-catalog.test.ts`

Expected: FAIL because `wilds-audio-catalog.ts` does not exist.

- [ ] **Step 3: Define complete catalog contracts**

```ts
export type WildsAudioBus = "music" | "ambience" | "effects" | "creatures" | "dialogue";
export type WildsAudioAssetId = string;
export type WildsAudioBankId =
  | "global"
  | "verdant-heartlands"
  | "amberweald"
  | "echo-highlands"
  | "moonwater-reach"
  | "prism-coast"
  | `ecology:${string}`
  | `boss:${string}`
  | `voice:${string}`;

export type WildsAudioVariant = Readonly<{
  url: string;
  durationSeconds: number;
  loop: boolean;
  gain: number;
}>;

export type WildsAudioProductionMetadata = Readonly<{
  provider: "elevenlabs" | "recorded-original";
  prompt: string;
  format: "mp3_44100_128";
  generatedAt: string;
  voiceId?: string;
  rights: "original-account-generation" | "original-recording";
}>;

export type WildsAudioAsset = Readonly<{
  id: WildsAudioAssetId;
  bus: WildsAudioBus;
  bank: WildsAudioBankId;
  priority: number;
  cooldownMs: number;
  maxConcurrent: number;
  stream: boolean;
  spatial: boolean;
  variants: readonly WildsAudioVariant[];
  production: WildsAudioProductionMetadata;
}>;

export type WildsAudioCatalog = ReadonlyMap<WildsAudioAssetId, WildsAudioAsset>;
```

- [ ] **Step 4: Implement the coverage lists and initial catalog entries**

Create stable IDs for every existing `WildsAudioCue`, five regional suites, eight ecology families, eight boss banks, global UI/proof/movement cues, creature behavior families, and the canonical dialogue cast. Use final paths under `/audio/wilds/`; no temporary IDs.

- [ ] **Step 5: Add the release validator**

The validator must parse the TypeScript catalog through `tsx`, require production metadata, and print category counts. In `--catalog-only` mode it skips runtime scans and file existence because Task 2 removes the legacy runtime and Task 4 creates the first complete asset banks. Full mode checks every file, rejects orphan files, and rejects `createOscillator`, `speechSynthesis`, and `SpeechSynthesisUtterance` under `src/features/play`.

Add a catalog-only command. The full file gate is enabled in Task 4 after the first complete asset banks exist:

```json
{
  "scripts": {
    "validate:audio:catalog": "node --import tsx scripts/validate-wilds-audio.mjs --catalog-only"
  }
}
```

- [ ] **Step 6: Run catalog and validator tests**

Run: `pnpm exec node --import tsx --test tests/wilds-audio-catalog.test.ts`

Expected: PASS because the catalog contracts and production metadata are complete.

Run: `pnpm validate:audio:catalog`

Expected: PASS with nonzero catalog counts and complete metadata. Full file and forbidden-runtime checks remain a Task 4 gate.

- [ ] **Step 7: Commit Task 1**

```bash
git add package.json scripts/validate-wilds-audio.mjs src/features/play/audio tests/wilds-audio-catalog.test.ts
git commit -m "feat: add Wilds production audio catalog"
```

### Task 2: Mixer, Loader, and Lifecycle Runtime

**Files:**
- Create: `src/features/play/audio/wilds-audio-loader.ts`
- Create: `src/features/play/audio/wilds-audio-mixer.ts`
- Create: `tests/wilds-audio-loader.test.ts`
- Create: `tests/wilds-audio-mixer.test.ts`
- Modify: `src/features/play/wilds-audio.ts`
- Modify: `src/features/play/use-wilds-presentation.ts`

**Interfaces:**
- Consumes: `WildsAudioAsset`, `WildsAudioBus`, `WildsAudioBankId`, `WILDS_AUDIO_ASSETS`.
- Produces: `createWildsAudioLoader(options)`, `createWildsAudioMixer(context)`, and compatibility `createWildsAudioRuntime(factory, options)`.

- [ ] **Step 1: Write failing loader tests**

```ts
it("deduplicates loads and evicts inactive banks within budget", async () => {
  const loader = createWildsAudioLoader({ fetchImpl, decode, maxDecodedBytes: 1024 });
  await Promise.all([loader.preloadBank("global"), loader.preloadBank("global")]);
  assert.equal(fetchCount, expectedGlobalVariantCount);
  await loader.preloadBank("prism-coast");
  loader.retainBanks(new Set(["prism-coast"]));
  assert.ok(loader.snapshot().decodedBytes <= 1024);
});

it("reports a missing asset and resolves without oscillator fallback", async () => {
  const loader = createWildsAudioLoader({ fetchImpl: async () => new Response(null, { status: 404 }), decode });
  await assert.rejects(loader.load("effects.confirm"), /audio_asset_load_failed/);
  assert.equal(loader.snapshot().failures.length, 1);
});
```

- [ ] **Step 2: Run loader tests and verify RED**

Run: `pnpm exec node --import tsx --test tests/wilds-audio-loader.test.ts`

Expected: FAIL because the loader is missing.

- [ ] **Step 3: Implement loader with bounded cache**

Implement one in-flight promise per URL, decoded-size accounting from buffer length/channel count, explicit `preloadBank`, `retainBanks`, `load`, `snapshot`, and `dispose`. Missing assets throw in development and return a diagnostic result in production.

- [ ] **Step 4: Write failing mixer tests**

```ts
it("controls six buses and applies bounded dialogue ducking", () => {
  const mixer = createWildsAudioMixer(fakeContext);
  mixer.setSettings({ master: 0.8, music: 0.6, ambience: 0.5, effects: 0.7, creatures: 0.7, dialogue: 1, muted: false });
  mixer.setDialogueActive(true);
  assert.equal(mixer.snapshot().musicDucked, true);
  assert.ok(mixer.snapshot().musicGain < 0.48);
  mixer.setDialogueActive(false);
  assert.equal(mixer.snapshot().musicDucked, false);
});

it("disconnects every node on dispose", async () => {
  const mixer = createWildsAudioMixer(fakeContext);
  await mixer.dispose();
  assert.equal(mixer.snapshot().disposed, true);
  assert.equal(disconnectCount, 7);
});
```

- [ ] **Step 5: Run mixer tests and verify RED**

Run: `pnpm exec node --import tsx --test tests/wilds-audio-mixer.test.ts`

Expected: FAIL because the mixer is missing.

- [ ] **Step 6: Implement the six-bus graph and compatibility runtime**

The compatibility facade preserves `unlock`, `setSettings`, `play`, `startAmbience`, `stopAmbience`, and `destroy`, but delegates to loaded assets. Remove `OscillatorLike`, `createOscillator`, frequency tables, and synthetic ambience.

- [ ] **Step 7: Run Task 2 verification**

Run: `pnpm exec node --import tsx --test tests/wilds-audio-loader.test.ts tests/wilds-audio-mixer.test.ts tests/wilds-presentation.test.ts`

Expected: PASS with no oscillator mocks.

- [ ] **Step 8: Commit Task 2**

```bash
git add src/features/play/audio src/features/play/wilds-audio.ts src/features/play/use-wilds-presentation.ts tests
git commit -m "feat: replace Wilds oscillator audio runtime"
```

### Task 3: Semantic Director, Adaptive Music, and Spatial World Audio

**Files:**
- Create: `src/features/play/audio/wilds-audio-director.ts`
- Create: `src/features/play/audio/wilds-spatial-audio.ts`
- Create: `tests/wilds-audio-director.test.ts`
- Create: `tests/wilds-spatial-audio.test.ts`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `src/features/play/use-wilds-presentation.ts`

**Interfaces:**
- Produces: `WildsAudioWorldState`, `WildsSemanticAudioEvent`, `createWildsAudioDirector`, `regionAudioIdentityForPosition`, `projectWildsSpatialEmitter`.
- Consumes: catalog, loader, mixer, player position, geography, encounter state, ecology state, and boss state.

- [ ] **Step 1: Write failing director tests**

```ts
it("maps the five regions to the approved sonic identities", () => {
  assert.equal(regionAudioIdentityForPosition({ x: 0, z: 0 }), "organic-mythic-scifi");
  assert.equal(regionAudioIdentityForPosition({ x: 96, z: -72 }), "epic-high-fantasy");
  assert.equal(regionAudioIdentityForPosition({ x: -128, z: 94 }), "futuristic-electronic");
  assert.equal(regionAudioIdentityForPosition({ x: -24, z: -158 }), "epic-high-fantasy");
  assert.equal(regionAudioIdentityForPosition({ x: 126, z: 68 }), "organic-mythic-scifi");
});

it("prevents repetition and respects cue cooldown and concurrency", async () => {
  const director = createWildsAudioDirector(harness);
  await director.emit({ type: "effect", cue: "battle-hit", emitterId: "target:1" });
  await director.emit({ type: "effect", cue: "battle-hit", emitterId: "target:1" });
  assert.equal(harness.plays.length, 1);
});
```

- [ ] **Step 2: Verify director tests fail**

Run: `pnpm exec node --import tsx --test tests/wilds-audio-director.test.ts`

Expected: FAIL because the director is missing.

- [ ] **Step 3: Implement semantic routing and musical state**

Use deterministic variant rotation, per-emitter cooldown keys, bounded active-voice counts, and a music state machine with `exploration`, `wonder`, `tension`, `encounter`, `battle`, `boss`, `raid`, and `aftermath` intensity. Schedule crossfades; do not restart unchanged stems.

- [ ] **Step 4: Write and implement spatial projection tests**

```ts
it("projects a bounded positional emitter relative to the listener", () => {
  assert.deepEqual(
    projectWildsSpatialEmitter({ listener: { x: 10, y: 1, z: 10 }, source: { x: 18, y: 1, z: 6 }, maxDistance: 32 }),
    { x: 8, y: 0, z: -4, distance: Math.sqrt(80), audible: true }
  );
});
```

- [ ] **Step 5: Wire world state into the director**

`PlayCampaign` sends listener position and semantic state changes. Existing helpers such as `audioCuesForTransition`, `ecologyAudioCue`, `bossAudioCue`, and `settlementAudioCue` remain pure event mappers and no longer select frequencies.

- [ ] **Step 6: Run Task 3 verification and commit**

Run: `pnpm exec node --import tsx --test tests/wilds-audio-director.test.ts tests/wilds-spatial-audio.test.ts tests/wilds-render-contract.test.ts`

Expected: PASS.

```bash
git add src/features/play tests
git commit -m "feat: add adaptive Wilds audio director"
```

### Task 4: Global, Regional, and Ecology Asset Production

**Files:**
- Create: `public/audio/wilds/global/**`
- Create: `public/audio/wilds/regions/**`
- Create: `public/audio/wilds/ecology/**`
- Modify: `src/features/play/audio/wilds-audio-catalog.ts`
- Modify: `src/features/play/audio/wilds-audio-production.ts`
- Test: `tests/wilds-audio-catalog.test.ts`

**Interfaces:**
- Produces final local assets for global UI/proof/gameplay, five regional music/ambience banks, and eight ecology banks.
- Consumes the generation script at `/Users/bjklock/.codex/skills/threejs-audio-generator/scripts/threejs_audio_asset.py`.

- [ ] **Step 1: Probe credentials and record the literal result**

Run: `bash /Users/bjklock/.codex/skills/threejs-game-director/scripts/probe_asset_credentials.sh`

Expected: `ELEVENLABS_API_KEY=SET`. If missing, stop asset generation and report the credential blocker without weakening the design.

- [ ] **Step 2: Generate the global interaction pack**

Generate at least three variants for frequent UI/movement/combat cues and one or two variants for rare cinematic cues. Example command:

```bash
python3 /Users/bjklock/.codex/skills/threejs-audio-generator/scripts/threejs_audio_asset.py sfx \
  --prompt "short proof seal confirmation for premium mythic science-fiction adventure game, tactile crystal lock and warm paper-fiber snap, clear transient, luminous orchestral shimmer tail, no melody, no voice, readable under gameplay mix" \
  --duration 1.2 \
  --prompt-influence 0.72 \
  --out public/audio/wilds/global/proof/seal-confirm-01.mp3
```

- [ ] **Step 3: Generate five regional ambience suites**

Use 12–22 second seamless loops. Example:

```bash
python3 /Users/bjklock/.codex/skills/threejs-audio-generator/scripts/threejs_audio_asset.py sfx \
  --prompt "seamless Verdant Heartlands ambience for organic mythic science-fiction world, living forest canopy, close leaves and distant creature breath, subtle resonant crystal technology, warm air, no melody, no voice, spacious but gameplay-readable" \
  --duration 18 \
  --loop \
  --prompt-influence 0.46 \
  --out public/audio/wilds/regions/verdant-heartlands/ambience-day-01.mp3
```

- [ ] **Step 4: Generate adaptive regional music stems**

For each region create compatible `exploration`, `wonder`, `rhythm`, `tension`, `battle`, and `aftermath` loops. Prompts must name the region identity, shared Receiz motif, stem role, tempo compatibility, absence of dialogue, and seamless looping requirement.

- [ ] **Step 5: Generate eight ecology suites**

Create discovery, active loop, step/action, resolution, and aftermath assets for wandering market, echo ruin, unstable portal, convergence festival, migration, lumen bloom, stormfront, and settlement distress.

- [ ] **Step 6: Update provenance and validate every asset**

Add the full release command once every declared global, regional, and ecology asset exists:

```json
{
  "scripts": {
    "validate:audio": "node --import tsx scripts/validate-wilds-audio.mjs"
  }
}
```

Run: `pnpm validate:audio`

Expected: PASS with global, five regional, and eight ecology banks complete.

- [ ] **Step 7: Commit Task 4**

```bash
git add public/audio/wilds src/features/play/audio
git commit -m "feat: add Wilds regional production audio"
```

### Task 5: Creature, Combat, and Boss Production

**Files:**
- Create: `public/audio/wilds/creatures/**`
- Create: `public/audio/wilds/bosses/**`
- Modify: `src/features/play/audio/wilds-audio-catalog.ts`
- Modify: `src/features/play/audio/wilds-audio-production.ts`
- Create: `tests/wilds-creature-audio.test.ts`

**Interfaces:**
- Produces: `creatureAudioProfile(form)`, anatomical vocal banks, evolution-stage layers, and eight complete boss banks.
- Consumes: creature catalog anatomy, form stage, traits, boss family IDs, semantic battle actions.

- [ ] **Step 1: Write failing creature identity tests**

```ts
it("gives every creature form a stable complete production profile", () => {
  for (const family of WILDS_CREATURE_FAMILIES) {
    for (const form of family.forms) {
      const profile = creatureAudioProfile(form);
      assert.ok(profile.idle.length >= 2);
      assert.ok(profile.attack.length >= 2);
      assert.ok(profile.hurt.length >= 2);
      assert.ok(profile.capture.length >= 1);
      assert.equal(profile.stage, form.stage);
    }
  }
});
```

- [ ] **Step 2: Verify RED and implement the vocal grammar**

Map anatomy and behavior to authored source banks, then layer species material, size, breath, environment, and stage identity without single-sample pitch substitution.

- [ ] **Step 3: Generate anatomical vocal source banks**

Create multiple performances for idle, notice, movement, attack, hurt, bond, capture, victory, and evolution across the catalog anatomy groups. Prompts describe fictional creatures and must not imitate real people.

- [ ] **Step 4: Generate eight boss suites**

Each boss bank includes presence, idle, movement, reveal, family telegraphs, semantic actions, impact, damage, vulnerable, transformation, defeat, aftermath, and compatible music layers.

- [ ] **Step 5: Validate, test, and commit**

Run: `pnpm exec node --import tsx --test tests/wilds-creature-audio.test.ts tests/wilds-boss-ecology-release.test.ts`

Run: `pnpm validate:audio`

Expected: PASS with all 750 forms mapped and eight boss banks complete.

```bash
git add public/audio/wilds src/features/play/audio tests
git commit -m "feat: add creature and boss production audio"
```

### Task 6: Human Voice Cast, Dialogue Queue, and Subtitles

**Files:**
- Create: `src/features/play/audio/wilds-dialogue.ts`
- Create: `tests/wilds-dialogue.test.ts`
- Create: `public/audio/wilds/voice/**`
- Modify: `src/features/play/audio/wilds-audio-catalog.ts`
- Modify: `src/features/play/audio/wilds-audio-production.ts`
- Modify: `src/features/play/WildsSettlementExperience.tsx`
- Modify: narrative and boss presentation call sites.

**Interfaces:**
- Produces: `WILDS_VOICE_CAST`, `WILDS_DIALOGUE_LINES`, `createWildsDialogueQueue`, `WildsDialogueLine`, subtitle events.
- Consumes: mixer dialogue ducking, semantic director, canonical narrative characters, bosses, settlements, and story state.

- [ ] **Step 1: Write failing dialogue policy tests**

```ts
it("protects critical dialogue and emits subtitles for every spoken line", () => {
  const queue = createWildsDialogueQueue({ now: () => 1000 });
  queue.enqueue(line("resident-bark", 20));
  queue.enqueue(line("boss-warning", 100));
  assert.equal(queue.current()?.id, "boss-warning");
  assert.ok(queue.current()?.subtitle.length);
  assert.equal(queue.snapshot().ducking, true);
});

it("rejects browser-generated voice and repeated bark spam", () => {
  const queue = createWildsDialogueQueue({ now: () => 1000 });
  assert.equal(queue.enqueue(line("merchant-greeting", 30)), true);
  assert.equal(queue.enqueue(line("merchant-greeting", 30)), false);
});
```

- [ ] **Step 2: Verify RED and implement the cast/queue**

Define stable fictional voice IDs for narrator, guides, merchants, rivals, recurring residents, story characters, and bosses. Every line requires rendered asset URL, subtitle, direction, priority, interruption class, cooldown, and trigger.

- [ ] **Step 3: Generate human-sounding voice assets**

Use licensed provider voice IDs and exact scripts. Example:

```bash
python3 /Users/bjklock/.codex/skills/threejs-audio-generator/scripts/threejs_audio_asset.py tts \
  --text "The Heartlands remember every step. Walk gently, and they will answer." \
  --voice-id JBFqnCBsd6RMkjVDRZzb \
  --out public/audio/wilds/voice/narrator/heartlands-arrival-01.mp3
```

Use `JBFqnCBsd6RMkjVDRZzb` for the narrator candidate shown above. Select every additional fictional cast voice from the account's available licensed voices, audition it against its authored line set, and record each selected concrete voice ID in `wilds-audio-production.ts` before generation.

- [ ] **Step 4: Wire subtitles and dialogue settings**

Expose dialogue volume and subtitles independently. Critical dialogue queues above incidental barks, dialogue applies bounded ducking, and a missing voice asset displays subtitles in silence.

- [ ] **Step 5: Test, validate, and commit**

Run: `pnpm exec node --import tsx --test tests/wilds-dialogue.test.ts tests/wilds-render-contract.test.ts`

Run: `pnpm validate:audio`

Expected: PASS with no `speechSynthesis` references.

```bash
git add public/audio/wilds/voice src/features/play tests
git commit -m "feat: add Wilds human voice cast"
```

### Task 7: Settings, Mastering, Browser QA, and Release Gate

**Files:**
- Modify: `src/features/play/WildsAudioSettings.tsx`
- Modify: `src/features/play/wilds-player-vault.ts`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `tests/wilds-presentation.test.ts`
- Modify: `tests/wilds-player-vault.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`
- Modify: `scripts/release-check.mjs`
- Create: `docs/superpowers/evidence/2026-07-15-wilds-production-audio.md`

**Interfaces:**
- Produces final settings persistence, accessibility controls, mastered asset set, browser evidence, and release qualification.
- Consumes all prior task interfaces and assets.

- [ ] **Step 1: Write failing settings migration tests**

```ts
it("migrates legacy four-bus settings into the complete production mix", () => {
  assert.deepEqual(normalizeWildsAudioSettings({ master: .8, effects: .7, ambience: .5, music: .4, muted: false }), {
    master: .8,
    effects: .7,
    ambience: .5,
    music: .4,
    creatures: .72,
    dialogue: .9,
    muted: false,
    subtitles: true,
    reducedIntensity: false,
  });
});
```

- [ ] **Step 2: Implement settings and vault migration**

Add creature/dialogue volume, subtitles, and reduced audio intensity while preserving existing saved values.

- [ ] **Step 3: Master and inspect assets**

Verify no clipping, consistent category loudness, seamless loops, dialogue intelligibility, mobile-safe low frequency, and headroom for bosses/raids. Replace any failed asset rather than hiding it with runtime gain.

- [ ] **Step 4: Add audio validation to release check**

`scripts/release-check.mjs` must run `pnpm validate:audio` before tests/build and fail on missing assets, forbidden fallback APIs, or incomplete banks.

- [ ] **Step 5: Run the complete automated gate**

Run: `pnpm validate:audio`

Run: `pnpm test`

Run: `pnpm typecheck`

Run: `pnpm lint`

Run: `pnpm build`

Expected: all commands exit 0; tests report zero failures; the build completes all routes.

- [ ] **Step 6: Browser qualification**

Verify on desktop and mobile WebKit/Chromium:

- user-gesture unlock;
- no decode/load console errors;
- all six volume controls and mute;
- subtitles and reduced intensity;
- seamless region transition;
- ambience start/stop without stacking;
- battle, boss, raid, proof, creature, settlement, and dialogue triggers;
- background-tab suspension and clean resume;
- route cleanup and no long-session node growth.

- [ ] **Step 7: Write evidence and commit final qualification**

Record the credential probe result, reference ledger, complete audio matrix, generated file paths, prompts, formats, durations, loops, voice IDs, runtime mappings, test/build/browser results, rights assumptions, and any genuinely deferred non-required content.

```bash
git add src scripts tests docs/superpowers/evidence package.json public/audio/wilds
git commit -m "release: qualify Wilds production audio"
```

## Final Review Checklist

- [ ] Every spec section maps to at least one task.
- [ ] All current oscillator and browser speech paths are absent from production runtime.
- [ ] Five regional identities and cross-region cohesion are implemented.
- [ ] Global, ecology, creature, boss, music, ambience, gameplay, proof, and voice categories are complete.
- [ ] Every named line has a rendered human-sounding asset and subtitle.
- [ ] All 750 forms map to stable complete creature audio profiles.
- [ ] Eight boss suites pass coverage.
- [ ] Runtime memory, concurrency, lifecycle, and failure behavior are bounded.
- [ ] Automated and browser release gates pass.
