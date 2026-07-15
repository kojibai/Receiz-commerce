# Wilds World Atlas and Living Landmarks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first 3D Wilds atlas with privacy-safe player presence, authorized Rift Drop travel, Walk/Run and contextual Pulse controls, plus three enterable flagship landmark experiences.

**Architecture:** Extend the existing deterministic region projection with pure atlas, Rift, context-action, landmark, and activity modules. React owns modal/control state, React Three Fiber owns bounded visuals, and same-origin server routes own relocation, competitive activity, scores, and rewards; the existing `PlayState`, portable-card verification, multiplayer room, and quality-profile boundaries remain authoritative.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.6, Three.js 0.182, `@react-three/fiber`, `@react-three/drei`, Lucide React, Node test runner, Receiz SDK.

## Global Constraints

- Keep one active full world renderer; the atlas uses a bounded lightweight scene and does not run concurrently with full landmark simulation.
- Keep the current D-pad/trackpad geometry and place one independent Walk/Run control and one independent Pulse control beside it.
- All visible compact controls have at least 44 CSS-pixel touch targets, accessible names, visible focus, and safe-area clearance.
- Preserve the existing 12-units-per-second rejection for ordinary multiplayer movement; only a validated Rift grant may relocate a player discontinuously.
- Exact player position is shown only for nearby players or explicit friends; wide-area strangers are aggregated.
- Valuable card creation, ownership transfer, lineage, growth, competitive scores, achievements, and rewards remain authoritative and idempotent.
- Atlas high-quality budget is at most 90 draw calls and 120,000 visible triangles; mobile target is at least 30 FPS.
- Reduced-motion, mute, adaptive quality, keyboard equivalents, scroll containment, and a non-WebGL fallback are required.
- Follow red-green-refactor for every behavior change and commit each independently reviewable task.

---

## File map

- `src/features/play/wilds-world-atlas.ts`: pure atlas nodes, zoom-level projection, discovery fog, and privacy-safe player clusters.
- `src/features/play/wilds-landmarks.ts`: stable flagship landmark registry and entrance requirements.
- `src/features/play/wilds-rift-travel.ts`: Rift request/grant validation, cooldown, lock reasons, and safe arrival.
- `app/api/wilds/atlas/route.ts`: bounded privacy-safe regional activity and permitted nearby identity projection.
- `app/api/wilds/rift/route.ts`: session-derived authoritative Rift grant endpoint.
- `src/features/play/wilds-context-action.ts`: deterministic single Pulse-action resolver.
- `src/features/play/wilds-movement.ts`: persisted Walk/Run mode and movement multipliers.
- `src/features/play/WildsWorldMap.tsx`: accessible atlas dialog, focus lifecycle, destination sheet, hold-to-confirm control, and fallback list.
- `src/features/play/WildsAtlasCanvas.tsx`: bounded R3F atlas scene and pointer/keyboard camera controls.
- `src/features/play/WildsWorldControls.tsx`: Walk/Run, unchanged trackpad integration, and Pulse controls.
- `src/features/play/wilds-activity-core.ts`: pure lobby/admission/active/result/reward/exit lifecycle.
- `src/features/play/wilds-minigames.ts`: deterministic Prism activity reducers.
- `src/features/play/WildsLandmarkExperience.tsx`: landmark lobby/activity presentation and exit recovery.
- `src/features/play/PlayCampaign.tsx`: composes map, controls, travel, landmark entry, and existing play state.
- `src/features/play/game-state.ts`: applies granted relocation without treating it as normal movement.
- `src/components/icons.tsx`: exports map, walk, run, Pulse, locate, and activity glyphs.
- `app/globals.css`: atlas, safe-area dialog, control row, landmark, and reduced-motion styling.
- `tests/wilds-world-atlas.test.ts`: atlas, privacy, clustering, landmark, and level-of-detail tests.
- `tests/wilds-rift-travel.test.ts`: travel validation, locks, safe spawn, cooldown, and idempotency tests.
- `tests/wilds-context-action.test.ts`: Pulse priority and Walk/Run tests.
- `tests/wilds-landmark-activities.test.ts`: activity lifecycle, card pinning, scores, rewards, reconnect, and all minigames.
- `tests/wilds-render-contract.test.ts`: composition, labels, focus, close reachability, and responsive contract checks.
- `tests/mobile-layout-css.test.ts`: no-overlap and safe-area layout assertions.

### Task 1: Deterministic atlas and flagship landmark registry

**Files:**
- Create: `src/features/play/wilds-landmarks.ts`
- Create: `src/features/play/wilds-world-atlas.ts`
- Create: `tests/wilds-world-atlas.test.ts`

**Interfaces:**
- Consumes: `WILDS_REGION_SIZE`, `regionForPosition`, `WildsPresence`, and `projectWildsBiome(tileX, tileZ, missionProgress, worldMastery)`.
- Produces: `WILDS_FLAGSHIP_LANDMARKS`, `landmarkAtPosition(position)`, `projectWildsAtlas(input)`, `WildsAtlasProjection`, and `WildsAtlasNode`.

- [ ] **Step 1: Write failing landmark and atlas projection tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WILDS_FLAGSHIP_LANDMARKS, landmarkAtPosition } from "../src/features/play/wilds-landmarks";
import { projectWildsAtlas } from "../src/features/play/wilds-world-atlas";

describe("Wilds world atlas", () => {
  it("keeps three flagship landmarks at stable unique coordinates", () => {
    assert.deepEqual(WILDS_FLAGSHIP_LANDMARKS.map((landmark) => landmark.id), [
      "hearttree-sanctum", "arena-of-echoes", "prism-arcade"
    ]);
    assert.equal(new Set(WILDS_FLAGSHIP_LANDMARKS.map((item) => `${item.position.x}:${item.position.z}`)).size, 3);
    assert.equal(landmarkAtPosition({ x: 0, z: 0 })?.id, "hearttree-sanctum");
  });

  it("reveals selected detail but aggregates distant strangers", () => {
    const atlas = projectWildsAtlas({
      center: { x: 0, z: 0 }, zoom: "world", missionProgress: 30, worldMastery: 8,
      discoveredLandmarkIds: ["hearttree-sanctum"], selfId: "self", now: Date.parse("2026-07-15T12:00:00Z"),
      players: Array.from({ length: 30 }, (_, index) => ({
        playerId: `p-${index}`, handle: `Player ${index}`, style: "female" as const,
        x: 24 + index / 10, z: 24, heading: 0, status: "available" as const,
        lastSeenAt: "2026-07-15T12:00:00Z", practice: false,
        activeCard: {
          assetId: `a-${index}`, name: "Card", proofDigest: `sha256:${"a".repeat(64)}`,
          stats: { health: 10, power: 10, guard: 10, speed: 10 },
          abilities: [{ name: "Pulse", power: 4 }, { name: "Ward", power: 3 }]
        }
      }))
    });
    assert.equal(atlas.landmarks.find((item) => item.id === "hearttree-sanctum")?.discovered, true);
    assert.equal(atlas.playerClusters.reduce((sum, cluster) => sum + cluster.count, 0), 24);
    assert.equal(atlas.playerClusters.every((cluster) => cluster.handle === undefined), true);
  });
});
```

- [ ] **Step 2: Run the atlas test and verify missing-module failure**

Run: `pnpm test -- --test-name-pattern="Wilds world atlas"`  
Expected: FAIL because `wilds-landmarks.ts` and `wilds-world-atlas.ts` do not exist.

- [ ] **Step 3: Implement the stable registry and bounded projection**

```ts
// src/features/play/wilds-landmarks.ts
export type WildsLandmarkId = "hearttree-sanctum" | "arena-of-echoes" | "prism-arcade";
export type WildsLandmarkDefinition = {
  id: WildsLandmarkId; name: string; subtitle: string; kind: "mastery" | "competition" | "arcade";
  position: { x: number; z: number }; radius: number; accent: string; icon: "tree" | "trophy" | "sparkles";
  occupancy: "solo" | "public" | "matchmade"; cardRequired: boolean;
};
export const WILDS_FLAGSHIP_LANDMARKS: readonly WildsLandmarkDefinition[] = [
  { id: "hearttree-sanctum", name: "Hearttree Sanctum", subtitle: "Awaken the history inside your cards", kind: "mastery", position: { x: 0, z: 0 }, radius: 6, accent: "#71e8c3", icon: "tree", occupancy: "solo", cardRequired: true },
  { id: "arena-of-echoes", name: "Arena of Echoes", subtitle: "Meet, compete, and seal every victory", kind: "competition", position: { x: 144, z: -96 }, radius: 8, accent: "#f7c948", icon: "trophy", occupancy: "matchmade", cardRequired: true },
  { id: "prism-arcade", name: "Prism Arcade", subtitle: "Cooperative worlds hidden inside light", kind: "arcade", position: { x: -144, z: 96 }, radius: 8, accent: "#ff72bf", icon: "sparkles", occupancy: "public", cardRequired: true }
] as const;
export function landmarkAtPosition(position: { x: number; z: number }) {
  return WILDS_FLAGSHIP_LANDMARKS.find((item) => Math.hypot(item.position.x - position.x, item.position.z - position.z) <= item.radius) ?? null;
}
```

Implement `projectWildsAtlas` with zoom radii `world=4`, `region=2`, `landmark=1` regions, `visiblePresence(...).slice(0, 24)`, stranger clustering by region, and exact handles only within `WILDS_INTERACTION_DISTANCE`.

- [ ] **Step 4: Run atlas and biome tests**

Run: `pnpm test -- --test-name-pattern="Wilds world atlas|Verdant Crown biome projection"`  
Expected: PASS with deterministic repeated projections and no change to the origin sanctuary.

- [ ] **Step 5: Commit the atlas model**

```bash
git add src/features/play/wilds-landmarks.ts src/features/play/wilds-world-atlas.ts tests/wilds-world-atlas.test.ts
git commit -m "feat: add deterministic Wilds atlas model"
```

### Task 2: Server-authorized Rift Drop

**Files:**
- Create: `src/features/play/wilds-rift-travel.ts`
- Create: `app/api/wilds/rift/route.ts`
- Create: `tests/wilds-rift-travel.test.ts`
- Modify: `src/features/play/game-state.ts`

**Interfaces:**
- Consumes: session identity resolution, world bounds, landmark positions, and ordinary `validatePresenceMove` unchanged.
- Produces: `requestRiftGrant(input, authority)`, `validateRiftGrant(grant, request)`, `RiftTravelGrant`, and `WildsInput { type: "apply-rift-grant"; grant }`.

- [ ] **Step 1: Write failing validation and reducer tests**

```ts
it("authorizes a bounded safe Rift without weakening ordinary movement", () => {
  const request = { idempotencyKey: "rift-1", source: { x: 0, z: 0 }, destination: { x: 144, z: -96 }, requestedAt: "2026-07-15T12:00:00Z" };
  const result = authorizeRiftTravel(request, { playerId: "player-1", now: Date.parse("2026-07-15T12:00:00Z"), lastRiftAt: null, locked: false });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.grant.destination, { x: 144, z: -96 });
  assert.equal(validatePresenceMove({ x: 0, z: 0, at: request.requestedAt }, { x: 144, z: -96, at: "2026-07-15T12:00:01Z" }).ok, false);
});

it("rejects invalid, locked, duplicate, and cooling-down requests", () => {
  assert.equal(authorizeRiftTravel({ idempotencyKey: "", source: { x: 0, z: 0 }, destination: { x: Infinity, z: 0 }, requestedAt: "bad" }, { playerId: "p", now: 0, lastRiftAt: null, locked: false }).ok, false);
  assert.equal(authorizeRiftTravel(validRequest, { playerId: "p", now, lastRiftAt: now - 1_000, locked: true }).ok, false);
});
```

- [ ] **Step 2: Run the Rift tests and verify missing-export failure**

Run: `pnpm test -- --test-name-pattern="Rift"`  
Expected: FAIL because the Rift authority module and reducer input do not exist.

- [ ] **Step 3: Implement pure Rift authority**

```ts
export const WILDS_RIFT_COOLDOWN_MS = 8_000;
export type RiftTravelRequest = { idempotencyKey: string; source: { x: number; z: number }; destination: { x: number; z: number }; requestedAt: string };
export type RiftTravelGrant = { grantId: string; playerId: string; destination: { x: number; z: number }; issuedAt: string; expiresAt: string };
export function authorizeRiftTravel(request: RiftTravelRequest, authority: { playerId: string; now: number; lastRiftAt: number | null; locked: boolean }) {
  if (authority.locked) return { ok: false as const, error: "wilds_rift_activity_locked" };
  if (!/^[a-z0-9:-]{6,96}$/i.test(request.idempotencyKey)) return { ok: false as const, error: "wilds_rift_idempotency_invalid" };
  if (![request.source.x, request.source.z, request.destination.x, request.destination.z].every(Number.isFinite)) return { ok: false as const, error: "wilds_rift_position_invalid" };
  if (Math.max(Math.abs(request.destination.x), Math.abs(request.destination.z)) > 1_000_000) return { ok: false as const, error: "wilds_rift_position_invalid" };
  if (authority.lastRiftAt !== null && authority.now - authority.lastRiftAt < WILDS_RIFT_COOLDOWN_MS) return { ok: false as const, error: "wilds_rift_cooldown" };
  const issuedAt = new Date(authority.now).toISOString();
  return { ok: true as const, grant: { grantId: `rift:${authority.playerId}:${request.idempotencyKey}`, playerId: authority.playerId, destination: request.destination, issuedAt, expiresAt: new Date(authority.now + 15_000).toISOString() } };
}
```

- [ ] **Step 4: Add the same-origin route and grant-only state relocation**

The route parses a bounded body, derives the actor with `resolveWildsMultiplayerActor`, rejects battle/activity locks, and returns a grant. Add this reducer branch before ordinary movement:

```ts
if (input.type === "apply-rift-grant") {
  if (!validateRiftGrant(input.grant, { playerId: input.playerId, now: Date.now() }).ok) return state;
  return { ...state, player: input.grant.destination, activeAction: "explore", lastEvent: "Rift complete. A new region opens around you." };
}
```

- [ ] **Step 5: Run Rift, multiplayer, and save tests**

Run: `pnpm test -- --test-name-pattern="Rift|Wilds regional multiplayer|versioned Receiz Wilds save"`  
Expected: PASS; ordinary impossible movement still returns `wilds_presence_teleport_rejected`.

- [ ] **Step 6: Commit Rift authority**

```bash
git add src/features/play/wilds-rift-travel.ts app/api/wilds/rift/route.ts src/features/play/game-state.ts tests/wilds-rift-travel.test.ts
git commit -m "feat: authorize Wilds Rift travel"
```

### Task 3: Walk/Run mode and contextual Pulse resolver

**Files:**
- Create: `src/features/play/wilds-movement.ts`
- Create: `src/features/play/wilds-context-action.ts`
- Create: `tests/wilds-context-action.test.ts`
- Modify: `src/features/play/game-state.ts`

**Interfaces:**
- Produces: `WildsMovementMode`, `movementScale(mode)`, `resolveWildsContextAction(input)`, and discriminated `WildsContextAction` values.
- Consumes: nearest landmark, selected/nearby player, encounter state, pending reward, and discovery availability.

- [ ] **Step 1: Write failing priority and movement tests**

```ts
it("chooses one Pulse action in the documented priority order", () => {
  const base = { pendingReward: false, landmark: null, selectedPlayer: null, joinableActivity: null, secret: false };
  assert.equal(resolveWildsContextAction({ ...base, pendingReward: true }).kind, "collect");
  assert.equal(resolveWildsContextAction({ ...base, landmark: WILDS_FLAGSHIP_LANDMARKS[0] }).kind, "enter");
  assert.equal(resolveWildsContextAction({ ...base, selectedPlayer: availablePlayer }).kind, "greet");
  assert.equal(resolveWildsContextAction(base).kind, "scan");
});

it("keeps walking precise and running faster", () => {
  assert.equal(movementScale("walk"), 1);
  assert.equal(movementScale("run"), 1.65);
});
```

- [ ] **Step 2: Run focused tests and verify missing exports**

Run: `pnpm test -- --test-name-pattern="Pulse|walking precise"`  
Expected: FAIL because the movement and context modules do not exist.

- [ ] **Step 3: Implement the discriminated resolver**

```ts
export type WildsContextAction =
  | { kind: "collect"; label: "Collect reward" }
  | { kind: "enter"; label: string; landmarkId: WildsLandmarkId }
  | { kind: "activate"; label: string; targetId: string }
  | { kind: "greet"; label: string; playerId: string }
  | { kind: "join"; label: string; activityId: string }
  | { kind: "scan"; label: "Pulse the world" };

export function resolveWildsContextAction(input: WildsContextInput): WildsContextAction {
  if (input.pendingReward) return { kind: "collect", label: "Collect reward" };
  if (input.landmark) return { kind: "enter", label: `Enter ${input.landmark.name}`, landmarkId: input.landmark.id };
  if (input.secret) return { kind: "activate", label: "Awaken hidden signal", targetId: input.secret };
  if (input.selectedPlayer) return { kind: "greet", label: `Greet ${input.selectedPlayer.handle}`, playerId: input.selectedPlayer.playerId };
  if (input.joinableActivity) return { kind: "join", label: `Join ${input.joinableActivity.name}`, activityId: input.joinableActivity.id };
  return { kind: "scan", label: "Pulse the world" };
}
```

- [ ] **Step 4: Apply movement scale without changing state authority**

Change `movePlayerVector(player, x, z)` to accept `scale = 1`, multiply `worldBounds.analogStep * scale`, clamp to the same bounds, and pass the UI-selected movement scale in the `move-vector` input.

- [ ] **Step 5: Run context, game-state, and multiplayer tests**

Run: `pnpm test -- --test-name-pattern="Pulse|walking precise|Wilds regional multiplayer|Receiz Wilds"`  
Expected: PASS with unchanged movement rejection and deterministic game results.

- [ ] **Step 6: Commit world verbs**

```bash
git add src/features/play/wilds-movement.ts src/features/play/wilds-context-action.ts src/features/play/game-state.ts tests/wilds-context-action.test.ts
git commit -m "feat: add Wilds movement modes and Pulse action"
```

### Task 4: Accessible cinematic 3D atlas dialog

**Files:**
- Create: `src/features/play/WildsAtlasCanvas.tsx`
- Create: `src/features/play/WildsWorldMap.tsx`
- Modify: `src/components/icons.tsx`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: `WildsAtlasProjection`, `WildsQualityProfile`, current player position, remote players, and `onRift(destination)`.
- Produces: `WildsWorldMap({ open, onClose, ... })` and `WildsAtlasCanvas({ projection, selectedId, onSelect })`.

- [ ] **Step 1: Add failing source and accessibility contracts**

```ts
it("opens a focus-safe 3D atlas with an accessible fallback", async () => {
  const map = await readFile("src/features/play/WildsWorldMap.tsx", "utf8");
  const canvas = await readFile("src/features/play/WildsAtlasCanvas.tsx", "utf8");
  assert.match(map, /role="dialog"/);
  assert.match(map, /aria-modal="true"/);
  assert.match(map, /aria-label="Close world map"/);
  assert.match(map, /wilds-atlas-fallback/);
  assert.match(map, /focus\(\)/);
  assert.match(map, /event\.key === "Escape"/);
  assert.match(map, /Hold to Rift Drop/);
  assert.match(canvas, /<Canvas/);
  assert.match(canvas, /OrbitControls/);
  assert.match(canvas, /maxDistance/);
  assert.match(canvas, /qualityProfile\.dpr/);
});
```

- [ ] **Step 2: Run the render contract and verify missing-file failure**

Run: `pnpm test -- --test-name-pattern="focus-safe 3D atlas"`  
Expected: FAIL because both atlas components are absent.

- [ ] **Step 3: Implement the bounded atlas canvas**

Use one `Canvas`, `OrbitControls` with pan/zoom bounds, instanced biome nodes, three authored landmark beacons, clustered player lights, a current-position beam, and a selected-destination arc. Set `frameloop="demand"` when reduced motion is active, cap visible nodes from `projectWildsAtlas`, and publish atlas draw calls/triangles into diagnostics.

- [ ] **Step 4: Implement dialog, fallback, destination sheet, and hold control**

The dialog stores the previously focused element, focuses its heading on open, handles Escape, restores focus on close, and uses pointer-down/up/cancel timers for a 700ms Rift confirmation. The fallback renders the same landmarks as buttons and invokes the same selection and Rift callbacks.

- [ ] **Step 5: Run render contracts, typecheck, and lint**

Run: `pnpm test -- --test-name-pattern="focus-safe 3D atlas|Wilds rendering contract"`  
Expected: PASS.  
Run: `pnpm typecheck && pnpm lint`  
Expected: both exit 0.

- [ ] **Step 6: Commit atlas presentation**

```bash
git add src/features/play/WildsAtlasCanvas.tsx src/features/play/WildsWorldMap.tsx src/components/icons.tsx tests/wilds-render-contract.test.ts
git commit -m "feat: add cinematic Wilds world map"
```

### Task 5: Integrate globe, Rift, Walk/Run, and Pulse into PlayCampaign

**Files:**
- Create: `src/features/play/WildsWorldControls.tsx`
- Create: `app/api/wilds/atlas/route.ts`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `app/globals.css`
- Modify: `tests/wilds-render-contract.test.ts`
- Modify: `tests/mobile-layout-css.test.ts`

**Interfaces:**
- Consumes: atlas dialog, movement scale, Pulse resolver, multiplayer presence, and Rift route.
- Produces: a compact top-left utility cluster and a five-part control row: existing two-action cluster, Walk/Run, unchanged trackpad, Pulse, existing two-action cluster.

- [ ] **Step 1: Write failing composition and mobile no-overlap contracts**

```ts
assert.match(campaign, /className="wilds-utility-cluster"/);
assert.match(campaign, /aria-label="Open world map"/);
assert.match(campaign, /<WildsWorldMap/);
assert.match(campaign, /<WildsWorldControls/);
assert.match(controls, /aria-label="Switch to running"/);
assert.match(controls, /pulse\.label/);
assert.match(css, /\.wilds-screen-controls\s*\{[^}]*grid-template-columns:[^;}]*auto auto minmax\(68px, 108px\) auto auto/s);
assert.match(css, /\.wilds-world-map-close\s*\{[^}]*top:\s*max\([^}]*safe-area-inset-top/s);
assert.match(css, /\.wilds-world-map-body\s*\{[^}]*overflow:\s*auto/s);
```

- [ ] **Step 2: Run focused contracts and verify failure**

Run: `pnpm test -- --test-name-pattern="compact controls|mobile layout|world map"`  
Expected: FAIL because the utility cluster and integrated controls are absent.

- [ ] **Step 3: Implement world-control state and actions**

Persist mode under `receiz:wilds:movement-mode:v1`. Pass scaled `move-vector` input into the existing trackpad. Pulse invokes reward, landmark entry, selected-player interaction, join, or existing `search-point` behavior according to the resolver. Use icon-only visible controls and exact `aria-label` text.

- [ ] **Step 4: Add the privacy-safe atlas presence route**

The route derives the requesting actor, reads only bounded active regional projections, and returns at most 64 region clusters as `{ regionX, regionZ, count, updatedAt }`. It may additionally return exact `{ playerId, handle, x, z }` only for a server-confirmed nearby player or an explicit friend location-sharing grant. Clamp each count, omit complete card data and exact stranger coordinates, expire stale records, and set `cache-control: private, no-store`.

```ts
return NextResponse.json({
  ok: true,
  clusters: projectAtlasPresence(snapshotByRegion, { actorId: actor.playerId, now: Date.now(), maxClusters: 64 }),
  nearby: permittedNearbyPresence(snapshotByRegion, actor.playerId).slice(0, 24)
}, { headers: { "cache-control": "private, no-store" } });
```

- [ ] **Step 5: Integrate Rift request and granted relocation**

`PlayCampaign` posts `{ source, destination, idempotencyKey, locked }` to `/api/wilds/rift`, applies only a returned valid grant, closes the atlas after arrival, clears selected remote-player state, and leaves the source position unchanged on errors.

- [ ] **Step 6: Add responsive styles**

Use safe-area positioning for the utility cluster and map close action; internal scrolling for the atlas destination sheet; bounded 44px control cells; a 68px mobile control row; container queries/media rules that shrink visible glyphs before controls; and reduced-motion rules that remove orbit, Rift, beacon, and Pulse transition animation.

- [ ] **Step 7: Run focused and full verification**

Run: `pnpm test -- --test-name-pattern="Wilds rendering contract|mobile layout|Rift|Pulse"`  
Expected: PASS.  
Run: `pnpm typecheck && pnpm lint && pnpm build`  
Expected: all exit 0.

- [ ] **Step 8: Commit the playable navigation slice**

```bash
git add src/features/play/WildsWorldControls.tsx app/api/wilds/atlas/route.ts src/features/play/PlayCampaign.tsx app/globals.css tests/wilds-render-contract.test.ts tests/mobile-layout-css.test.ts
git commit -m "feat: connect Wilds atlas and world controls"
```

### Task 6: Authoritative landmark activity lifecycle

**Files:**
- Create: `src/features/play/wilds-activity-core.ts`
- Create: `tests/wilds-landmark-activities.test.ts`
- Modify: `src/features/play/portable-card.ts`

**Interfaces:**
- Produces: `createLandmarkSession`, `admitActivityCard`, `advanceActivity`, `resolveActivityResult`, `exitActivity`, and `WildsActivitySession` states `lobby | ready | active | result | reward | exited`.
- Consumes: `verifyAnyWildsCard`, stable landmark IDs, actor ID, idempotency keys, and exact proof digests.

- [ ] **Step 1: Write failing lifecycle and proof-pinning tests**

```ts
it("admits one exact verified card and advances append-only", () => {
  const lobby = createLandmarkSession({ id: "session-1", landmarkId: "hearttree-sanctum", actorIds: ["player-1"], createdAt: now });
  const ready = admitActivityCard(lobby, "player-1", verifiedCard, "admit-1");
  assert.equal(ready.phase, "ready");
  assert.equal(ready.admissions["player-1"].proofDigest, verifiedCard.proof.digest);
  assert.throws(() => admitActivityCard(ready, "player-1", alteredCard, "admit-2"), /verification/);
  assert.deepEqual(admitActivityCard(lobby, "player-1", verifiedCard, "admit-1"), ready);
});
```

- [ ] **Step 2: Run the activity test and verify missing-module failure**

Run: `pnpm test -- --test-name-pattern="landmark activity"`  
Expected: FAIL because `wilds-activity-core.ts` is absent.

- [ ] **Step 3: Implement the pure append-only lifecycle**

Store monotonic revision, admitted `assetId/proofDigest`, participant readiness, deterministic seed, events, result, reward status, and return coordinate. Reject phase skips, foreign actors, proof changes, replayed mutation keys, duplicate rewards, and result changes.

- [ ] **Step 4: Run activity and portable-card suites**

Run: `pnpm test -- --test-name-pattern="landmark activity|portable card|living card"`  
Expected: PASS with all existing tamper rejection intact.

- [ ] **Step 5: Commit the landmark kernel**

```bash
git add src/features/play/wilds-activity-core.ts tests/wilds-landmark-activities.test.ts src/features/play/portable-card.ts
git commit -m "feat: add Wilds landmark activity kernel"
```

### Task 7: Enterable Hearttree Sanctum vertical slice

**Files:**
- Create: `src/features/play/WildsLandmarkExperience.tsx`
- Create: `src/features/play/hearttree-trial.ts`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `app/globals.css`
- Modify: `tests/wilds-landmark-activities.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Produces: deterministic `createHearttreeTrial`, `applyHearttreeIntent`, and an enter/trial/Master/result/reward/exit UI.
- Consumes: active verified card, activity lifecycle, existing battle-stat projection, Pulse intent, and return coordinate.

- [ ] **Step 1: Write failing deterministic trial tests**

```ts
it("replays a Hearttree trial and grants one bounded mastery reward", () => {
  const first = ["pulse", "north", "guard", "ability:0"].reduce(applyIntent, createHearttreeTrial(seed, admittedCard));
  const replay = ["pulse", "north", "guard", "ability:0"].reduce(applyIntent, createHearttreeTrial(seed, admittedCard));
  assert.deepEqual(replay, first);
  assert.equal(first.reward?.kind, "achievement");
  assert.equal(new Set(first.events.map((event) => event.id)).size, first.events.length);
});
```

- [ ] **Step 2: Run Hearttree tests and verify missing-module failure**

Run: `pnpm test -- --test-name-pattern="Hearttree trial"`  
Expected: FAIL because the trial reducer is absent.

- [ ] **Step 3: Implement the deterministic trial and Master battle adapter**

Derive chamber order, clue pattern, and Master stats from session seed plus pinned proof digest. Accept bounded movement/Pulse/battle intents, never rescale mid-fight, and emit exactly one achievement/cosmetic/lore eligibility result.

- [ ] **Step 4: Implement the landmark experience UI**

Render a streamed-feeling interior with unique Hearttree lighting/audio classes, card admission, clear rules, trial feedback, Master battle presentation, proof-backed result, reward status, and Return to World. Escape asks for confirmation only during an active trial; result and lobby exits return immediately.

- [ ] **Step 5: Verify Hearttree end to end**

Run: `pnpm test -- --test-name-pattern="Hearttree trial|landmark activity|Wilds rendering contract"`  
Expected: PASS.  
Run: `pnpm typecheck && pnpm lint && pnpm build`  
Expected: all exit 0.

- [ ] **Step 6: Commit Hearttree**

```bash
git add src/features/play/WildsLandmarkExperience.tsx src/features/play/hearttree-trial.ts src/features/play/PlayCampaign.tsx app/globals.css tests/wilds-landmark-activities.test.ts tests/wilds-render-contract.test.ts
git commit -m "feat: open the Hearttree Sanctum"
```

### Task 8: Arena of Echoes shared competition

**Files:**
- Create: `src/features/play/arena-of-echoes.ts`
- Create: `app/api/wilds/activities/arena/route.ts`
- Modify: `src/features/play/WildsLandmarkExperience.tsx`
- Modify: `tests/wilds-landmark-activities.test.ts`

**Interfaces:**
- Consumes: existing challenge/PvP battle engine, pinned cards, multiplayer actor, and activity lifecycle.
- Produces: shared concourse, friendly matchmaking queue, authoritative one-versus-one match, proof-sealed result summary, and reconnect cursor.

- [ ] **Step 1: Write failing matchmaking and idempotency tests**

```ts
it("pairs compatible Arena entrants and settles a result once", () => {
  const queue = joinArena(joinArena(emptyArena(), entrantA, "join-a"), entrantB, "join-b");
  const match = createArenaMatch(queue, now);
  assert.deepEqual(new Set(match.players), new Set(["a", "b"]));
  const settled = settleArenaMatch(match, authoritativeBattleResult, "settle-1");
  assert.deepEqual(settleArenaMatch(match, authoritativeBattleResult, "settle-1"), settled);
  assert.throws(() => settleArenaMatch(settled, changedResult, "settle-2"), /result_locked/);
});
```

- [ ] **Step 2: Run Arena tests and verify missing-module failure**

Run: `pnpm test -- --test-name-pattern="Arena"`  
Expected: FAIL because Arena state and route are absent.

- [ ] **Step 3: Implement pure queue/match/result state and same-origin route**

Reuse the existing PvP engine and exact proof pinning. Support public concourse summaries, friendly matches, 45-second offer expiry, reconnect cursor, three-missed-turn forfeit, and idempotent result publication. Leave card stake and money stake controls capability-locked.

- [ ] **Step 4: Add Arena lobby, match, spectator summary, and ceremony UI**

Show server-confirmed occupants, card summaries, queue state, opponent readiness, battle turns, reconnect status, and proof-sealed result digest. Never show a reward or ownership change before the authoritative response.

- [ ] **Step 5: Run Arena, multiplayer, and production checks**

Run: `pnpm test -- --test-name-pattern="Arena|Wilds challenge lifecycle|server-authoritative Wilds PvP|landmark activity"`  
Expected: PASS.  
Run: `pnpm typecheck && pnpm lint && pnpm build`  
Expected: all exit 0.

- [ ] **Step 6: Commit Arena**

```bash
git add src/features/play/arena-of-echoes.ts app/api/wilds/activities/arena/route.ts src/features/play/WildsLandmarkExperience.tsx tests/wilds-landmark-activities.test.ts
git commit -m "feat: open the Arena of Echoes"
```

### Task 9: Prism Arcade minigames

**Files:**
- Create: `src/features/play/wilds-minigames.ts`
- Create: `app/api/wilds/activities/prism/route.ts`
- Modify: `src/features/play/WildsLandmarkExperience.tsx`
- Modify: `app/globals.css`
- Modify: `tests/wilds-landmark-activities.test.ts`

**Interfaces:**
- Produces: `createResonanceRun`, `applyResonanceIntent`, `createSignalForge`, `applySignalIntent`, `createMemoryLabyrinth`, `applyLabyrinthIntent`, and authoritative score envelopes.
- Consumes: session seed, pinned cards, participant roles, bounded intents, and activity lifecycle.

- [ ] **Step 1: Write failing replay, cooperation, and score tests**

```ts
it("replays all Prism games and rejects client-authored scores", () => {
  const resonance = replayResonance(seed, admissions, resonanceIntents);
  assert.deepEqual(replayResonance(seed, admissions, resonanceIntents), resonance);
  const forge = replaySignalForge(seed, admissions, forgeIntents);
  assert.equal(forge.combo > 0, true);
  const labyrinth = replayLabyrinth(seed, admissions, labyrinthIntents);
  assert.equal(labyrinth.visited.every((cell) => labyrinth.route.includes(cell)), true);
  assert.throws(() => acceptPrismScore(resonance, { ...scoreEnvelope, score: 999999 }), /score_invalid/);
});
```

- [ ] **Step 2: Run Prism tests and verify missing-module failure**

Run: `pnpm test -- --test-name-pattern="Prism"`  
Expected: FAIL because the minigame reducers are absent.

- [ ] **Step 3: Implement three deterministic reducers**

Resonance Run uses movement/timing plus legal speed/guard/element roles; Signal Forge uses timestamp windows, Pulse patterns, and complementary elements; Memory Labyrinth uses a seeded valid route, bounded movement, clues, and one secret chamber. Each reducer derives its score from accepted intents and emits a digest.

- [ ] **Step 4: Add authoritative Prism route and activity UI**

The route derives actor/session, admits exact cards, accepts one monotonic intent per participant revision, and returns authoritative state. The UI provides a portal picker, rules, readiness, active feedback, team presence, result, reward, replay, and exit without vertical truncation.

- [ ] **Step 5: Run Prism and complete regression checks**

Run: `pnpm test -- --test-name-pattern="Prism|landmark activity|portable card|Wilds regional multiplayer"`  
Expected: PASS.  
Run: `pnpm typecheck && pnpm lint && pnpm build`  
Expected: all exit 0.

- [ ] **Step 6: Commit Prism Arcade**

```bash
git add src/features/play/wilds-minigames.ts app/api/wilds/activities/prism/route.ts src/features/play/WildsLandmarkExperience.tsx app/globals.css tests/wilds-landmark-activities.test.ts
git commit -m "feat: open the Prism Arcade"
```

### Task 10: Full-story browser verification and release hardening

**Files:**
- Create: `tests/browser/wilds-world-atlas-landmarks.spec.ts`
- Modify: `docs/superpowers/specs/2026-07-14-wilds-world-map-landmarks-design.md`

**Interfaces:**
- Consumes: the complete playable system.
- Produces: release evidence for desktop, narrow mobile, wider mobile, two-player presence, authorized travel, every landmark, accessibility, reduced motion, and performance diagnostics.

- [ ] **Step 1: Add the browser journey**

```ts
test("discovers, travels, enters, plays, and returns", async ({ page }) => {
  await page.goto("/world");
  await page.getByLabel("Open world map").click();
  await expect(page.getByRole("dialog", { name: "Wilds world map" })).toBeVisible();
  await page.getByRole("button", { name: /Arena of Echoes/ }).click();
  await holdButton(page.getByLabel("Hold to Rift Drop"), 750);
  await expect(page.getByLabel(/World coordinates/)).toContainText("144");
  await page.getByLabel(/Enter Arena of Echoes/).click();
  await expect(page.getByRole("heading", { name: "Arena of Echoes" })).toBeVisible();
  await page.getByLabel("Return to world").click();
  await expect(page.getByLabel("Receiz Wilds playable 3D world")).toBeVisible();
});
```

- [ ] **Step 2: Run desktop and mobile browser journeys**

Run the repository Playwright wrapper at 390×844, 430×932, and 1440×900.  
Expected: globe and close controls reachable; atlas and sheets scroll internally; no control, D-pad/trackpad, command dock, or app toolbar overlap; no uncaught console errors.

- [ ] **Step 3: Run two-context multiplayer and privacy verification**

Expected: nearby exact presence, distant aggregation, Rift room transition, Arena matchmaking/reconnect, and Prism cooperation all reflect server-confirmed state; blocked/private users are not exposed.

- [ ] **Step 4: Capture diagnostics and screenshots**

Expected: atlas at or below 90 draw calls and 120,000 triangles on high quality; at least 30 FPS on the supported mobile profile; screenshots for atlas world/region/landmark zoom, Rift confirmation, each flagship lobby, one active activity per landmark, and reduced motion.

- [ ] **Step 5: Run the complete release gate**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`  
Expected: all commands exit 0 with no failing tests, type errors, lint errors, build errors, or recurring Three.js warnings.

- [ ] **Step 6: Update design status and commit release evidence**

Change design status to `Implemented and verified` only after every preceding check passes.

```bash
git add tests/browser/wilds-world-atlas-landmarks.spec.ts docs/superpowers/specs/2026-07-14-wilds-world-map-landmarks-design.md
git commit -m "test: verify Wilds world atlas and landmarks"
```
