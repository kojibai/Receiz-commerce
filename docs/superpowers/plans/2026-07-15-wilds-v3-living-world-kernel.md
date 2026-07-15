# Wilds V3 Living World Kernel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first complete Wilds V3 vertical slice: one Receiz-backed canonical world, one deterministic temporary site and modular boss, one globally shared capped raid, starter teams and a league, live atlas/gameplay projection, and a proof-bound V3 player vault that restores the player's complete local history before reconciling canonical facts.

**Architecture:** Pure TypeScript event envelopes, reducers, generators, raid rules, and vault reconciliation form the deterministic kernel. A narrow server service owns command authorization, Pulse/Kai-Klok ordering, replay, checkpointing, and idempotency. Authenticated world writes publish a recoverable Receiz app-state projection and append major facts to Receiz audit; failed canonical publication never masquerades as success. React consumes a read-only snapshot and sends typed commands. Existing V1/V2 vaults and V2-V5 local saves remain readable.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.6, Three.js 0.182, React Three Fiber 9.6, Receiz SDK 100, Node test runner, Web Crypto-compatible SHA-256 helpers.

## Global Constraints

- Canonical world id is `wilds:global:v3`; event, checkpoint, projection, and vault schemas are versioned independently.
- Pulse supplies authority time. Kai-Klok is a deterministic integer sequence within a Pulse; reducers never call `Date.now()`, `Math.random()`, or network APIs.
- The canonical event envelope is immutable, hash-addressed, idempotent, replayable, and validates actor, cause, Pulse, Kai-Klok, payload, and previous-event continuity.
- Authenticated valuable mutations succeed only after a Receiz projection write succeeds. Guest mode is labeled `local_practice` and cannot create canonical rewards, defeats, scores, ownership, or league standings.
- The first boss has exactly 36 active fighter slots arranged as six squads of six. Additional nearby players enter the unlimited support field and still earn bounded contribution credit.
- A defeated canonical boss never respawns. Its exact identity is memorialized; later bosses receive new deterministic identities.
- Permanent authored landmarks remain stable. Dynamic content may not overlap flagship landmark radii, their approach points, or a 12-unit navigation corridor.
- The V3 player vault contains verified cards, normalized player state, progression, settings, personal event history, receipts, and the last observed canonical cursor. It never overwrites newer canonical ownership, boss, league, or world facts during restore.
- Existing card proof verification remains mandatory. V1/V2 vault PNGs restore cards only; V3 restores the full player payload.
- All compact controls retain 44 CSS-pixel hit targets, safe-area clearance, keyboard names, reduced-motion behavior, and no gameplay text selection.
- Follow red-green-refactor. Every task ends in focused tests and an independently reviewable commit.

---

## File map

- `src/features/play/wilds-world-event.ts`: canonical event envelope, command types, validation, hashing, and ordering.
- `src/features/play/wilds-world-state.ts`: projection, reducer, replay, checkpoints, and canonical digest.
- `src/features/play/wilds-dynamic-sites.ts`: dynamic-site families, safe deterministic placement, and lifecycle.
- `src/features/play/wilds-boss-generator.ts`: authored boss anatomy modules and deterministic Crystal Burrower identities.
- `src/features/play/wilds-raid-core.ts`: six squads, fighter/support admission, contribution, defeat, and memorial outcomes.
- `src/features/play/wilds-team-league.ts`: starter team membership and deterministic league score projection.
- `src/features/play/wilds-world-service.ts`: authorized command-to-event decisions, scheduler tick, idempotency, and atomic in-process append.
- `src/lib/receiz/wilds-world-server.ts`: actor resolution, Receiz hydration/publication/audit, and production capability locking.
- `app/api/wilds/world/snapshot/route.ts`: canonical read projection.
- `app/api/wilds/world/command/route.ts`: typed player command boundary.
- `app/api/wilds/world/tick/route.ts`: protected scheduler boundary.
- `src/features/play/wilds-player-vault.ts`: V3 portable player payload, normalization, digest, and canonical reconciliation.
- `src/features/play/card-export.ts`: V3 PNG envelope compatibility and card-only legacy migration.
- `src/features/play/use-wilds-world.ts`: snapshot polling, command submission, reconnect mode, and local-practice labeling.
- `src/features/play/WildsLivingWorldHud.tsx`: site, boss, raid, team, and world-status presentation.
- `src/features/play/wilds-world-atlas.ts`: dynamic world markers in the existing atlas projection.
- `src/features/play/WildsWorldMap.tsx`: dynamic marker panels and route-safe destination selection.
- `src/features/play/WildsEnvironment.tsx`: bounded in-world site, boss, and memorial geometry.
- `src/features/play/WildsWorldCanvas.tsx`: passes the living-world projection to the environment.
- `src/features/play/PlayCampaign.tsx`: composes world controller, Pulse actions, V3 vault state, and HUD.
- `app/globals.css`: mobile-safe living-world overlays and raid/team surfaces.
- `tests/wilds-world-event.test.ts`: envelope, ordering, replay, and corruption cases.
- `tests/wilds-dynamic-sites.test.ts`: placement and lifecycle determinism.
- `tests/wilds-boss-generator.test.ts`: modular identity stability and uniqueness.
- `tests/wilds-raid-core.test.ts`: cap, squads, support, contributions, and permanent defeat.
- `tests/wilds-team-league.test.ts`: membership and standings replay.
- `tests/wilds-world-service.test.ts`: command authorization, scheduler, idempotency, and recovery.
- `tests/wilds-player-vault.test.ts`: V3 round trip, legacy migration, tamper rejection, and reconciliation.
- `tests/wilds-render-contract.test.ts`: gameplay/atlas composition and mobile accessibility contracts.

## Task 1: Canonical event envelope and Kai-Klok ordering

**Files:** Create `src/features/play/wilds-world-event.ts`; create `tests/wilds-world-event.test.ts`.

**Interfaces:**

```ts
export const WILDS_WORLD_ID = "wilds:global:v3" as const;
export type WildsWorldEventKind =
  | "site.spawned" | "site.phase_changed" | "boss.emerged" | "raid.joined"
  | "raid.contributed" | "boss.defeated" | "site.memorialized"
  | "team.created" | "team.joined" | "league.scored";
export type WildsWorldEvent<T = unknown> = {
  schema: "receiz.wilds_world_event.v3"; worldId: typeof WILDS_WORLD_ID;
  eventId: string; kind: WildsWorldEventKind; actorId: string; causeId: string;
  pulse: string; kaiKlok: number; occurredAt: string; previousEventId: string | null;
  payload: T; digest: string;
};
export function createWildsWorldEvent<T>(input: Omit<WildsWorldEvent<T>, "schema" | "worldId" | "eventId" | "digest">): WildsWorldEvent<T>;
export function verifyWildsWorldEvent(event: WildsWorldEvent, previous?: WildsWorldEvent | null): { ok: boolean; errors: string[] };
export function compareWildsWorldEvents(left: WildsWorldEvent, right: WildsWorldEvent): number;
```

- [ ] Write tests proving identical inputs produce identical ids/digests; Kai-Klok orders events within a Pulse; previous-event discontinuity, malformed actor/cause, invalid timestamps, and payload mutation fail verification.
- [ ] Run `pnpm test -- --test-name-pattern="Wilds world event"`; expect missing-module failure.
- [ ] Implement canonical JSON using the existing SHA-256 helper pattern from `portable-card.ts`; derive `eventId` as `wve:<64-hex digest>` and prohibit non-finite JSON numbers.
- [ ] Re-run the focused test; expect PASS.
- [ ] Commit: `feat: add canonical Wilds world events`.

## Task 2: Replayable projection and checkpoints

**Files:** Create `src/features/play/wilds-world-state.ts`; extend `tests/wilds-world-event.test.ts`.

**Interfaces:**

```ts
export type WildsWorldProjection = {
  schema: "receiz.wilds_world_projection.v3"; worldId: typeof WILDS_WORLD_ID;
  revision: number; cursor: { pulse: string; kaiKlok: number; eventId: string } | null;
  sites: Record<string, WildsDynamicSite>; bosses: Record<string, WildsBoss>;
  raids: Record<string, WildsRaid>; teams: Record<string, WildsTeam>;
  league: WildsLeagueProjection; defeatedBossIds: string[]; recentEventIds: string[];
};
export type WildsWorldCheckpoint = {
  schema: "receiz.wilds_world_checkpoint.v3"; worldId: typeof WILDS_WORLD_ID;
  revision: number; lastEventId: string | null; projectionDigest: string; projection: WildsWorldProjection;
};
export function reduceWildsWorldEvent(state: WildsWorldProjection, event: WildsWorldEvent): WildsWorldProjection;
export function replayWildsWorld(events: readonly WildsWorldEvent[], checkpoint?: WildsWorldCheckpoint): WildsWorldProjection;
export function checkpointWildsWorld(state: WildsWorldProjection): WildsWorldCheckpoint;
```

- [ ] Test empty projection, ordered replay, duplicate event idempotency, out-of-order rejection, checkpoint continuation, and projection-digest tamper rejection.
- [ ] Run focused tests; expect missing exports.
- [ ] Implement exhaustive reducer switches. Unknown kinds and illegal lifecycle transitions throw; recent ids are bounded to 512.
- [ ] Run focused tests; expect PASS.
- [ ] Commit: `feat: add replayable Wilds world projection`.

## Task 3: Deterministic Crystal Burrow site

**Files:** Create `src/features/play/wilds-dynamic-sites.ts`; create `tests/wilds-dynamic-sites.test.ts`.

**Interfaces:**

```ts
export type WildsDynamicSitePhase = "rumored" | "tracked" | "emerged" | "assaulting" | "engaged" | "defeated" | "memorialized" | "expired";
export type WildsDynamicSite = {
  id: string; familyId: "crystal-burrow"; name: "Crystal Burrow";
  position: { x: number; z: number }; radius: 9; phase: WildsDynamicSitePhase;
  spawnedAt: string; expiresAt: string; bossId: string | null; seedDigest: string;
};
export function generateCrystalBurrow(input: { pulse: string; ordinal: number; activeSites: readonly WildsDynamicSite[] }): WildsDynamicSite;
export function advanceDynamicSite(site: WildsDynamicSite, phase: WildsDynamicSitePhase): WildsDynamicSite;
```

- [ ] Test stable generation, different ordinals yielding different ids/coordinates, world-bound placement, 12-unit landmark/navigation clearance, active-site separation, and legal phase transitions.
- [ ] Run the focused test; expect missing-module failure.
- [ ] Implement hash-to-region placement using existing `WILDS_REGION_SIZE`, then deterministic bounded probes until all clearance rules pass. The initial family lives in Verdant Crown regions 2..5 from origin and expires after 72 Pulse-hours unless engaged.
- [ ] Run focused tests; expect PASS.
- [ ] Commit: `feat: generate deterministic Wilds sites`.

## Task 4: Authored modular Crystal Burrower boss

**Files:** Create `src/features/play/wilds-boss-generator.ts`; create `tests/wilds-boss-generator.test.ts`.

**Interfaces:**

```ts
export type WildsBoss = {
  id: string; familyId: "crystal-burrower"; name: string; siteId: string;
  anatomy: { core: "prism-heart"; shell: "basalt" | "jade"; limbs: "tunneler" | "crusher"; crown: "shard" | "halo" };
  behavior: { opener: "burrow" | "shard-rain"; escalation: "fracture" | "swarm"; finale: "last-light" };
  affinities: readonly ["guard" | "speed" | "bond", "guard" | "speed" | "bond"];
  maxHealth: number; health: number; phase: "emerged" | "engaged" | "defeated";
  emergedAt: string; defeatedAt: string | null; seedDigest: string;
};
export function generateCrystalBurrower(input: { site: WildsDynamicSite; pulse: string; ordinal: number }): WildsBoss;
```

- [ ] Test deterministic module selection, legal module compatibility, health bounds 180,000..260,000, unique ids per site/ordinal, and refusal to generate for non-emerged sites.
- [ ] Run focused tests; expect failure.
- [ ] Implement module registries as readonly authored data and hash-index selection; identity includes site id, Pulse, ordinal, and complete module digest.
- [ ] Run focused tests; expect PASS.
- [ ] Commit: `feat: add modular Crystal Burrower boss`.

## Task 5: Shared raid admission, support, and permanent defeat

**Files:** Create `src/features/play/wilds-raid-core.ts`; create `tests/wilds-raid-core.test.ts`.

**Interfaces:**

```ts
export const WILDS_RAID_SQUADS = 6;
export const WILDS_RAID_FIGHTERS_PER_SQUAD = 6;
export type WildsRaidRole = "fighter" | "support";
export type WildsRaid = {
  id: string; bossId: string; phase: "forming" | "active" | "settled";
  squads: [string[], string[], string[], string[], string[], string[]];
  supportPlayerIds: string[]; contributions: Record<string, { damage: number; support: number; eventIds: string[] }>;
  openedAt: string; settledAt: string | null; winningEventId: string | null;
};
export function admitRaidPlayer(raid: WildsRaid, playerId: string, preferredSquad?: number): { raid: WildsRaid; role: WildsRaidRole; squad: number | null };
export function applyRaidContribution(input: { raid: WildsRaid; boss: WildsBoss; playerId: string; eventId: string; damage: number; support: number }): { raid: WildsRaid; boss: WildsBoss; defeated: boolean };
```

- [ ] Test exactly 36 fighter admissions, stable lowest-fill squad allocation, unlimited deduplicated support admission, per-event idempotency, bounded damage/support, contribution credit for both roles, and one irreversible global defeat.
- [ ] Run focused tests; expect failure.
- [ ] Implement caps: fighter damage 1..2,500; support points 1..1,000; support converts to at most 10% mitigation/bonus in projection and cannot directly reduce boss health.
- [ ] Run focused tests; expect PASS.
- [ ] Commit: `feat: add globally shared Wilds raids`.

## Task 6: Starter teams and one global league

**Files:** Create `src/features/play/wilds-team-league.ts`; create `tests/wilds-team-league.test.ts`.

**Interfaces:**

```ts
export type WildsTeam = { id: string; name: string; captainId: string; memberIds: string[]; createdAt: string };
export type WildsLeagueProjection = { seasonId: "v3-genesis"; scores: Record<string, number>; standings: { teamId: string; score: number; rank: number }[] };
export function createWildsTeam(input: { captainId: string; name: string; occurredAt: string }): WildsTeam;
export function joinWildsTeam(team: WildsTeam, playerId: string): WildsTeam;
export function scoreWildsLeague(input: { league: WildsLeagueProjection; teamId: string; eventId: string; raidContribution: number }): WildsLeagueProjection;
```

- [ ] Test sanitized unique names, 24-member cap, duplicate membership rejection, deterministic bounded scoring, stable tie rank, and replay idempotency.
- [ ] Run focused tests; expect failure.
- [ ] Implement score metadata internally so an event id can never score twice; expose sorted top 100 standings.
- [ ] Run focused tests; expect PASS.
- [ ] Commit: `feat: add Wilds teams and Genesis League`.

## Task 7: Authorized world service and deterministic scheduler

**Files:** Create `src/features/play/wilds-world-service.ts`; create `tests/wilds-world-service.test.ts`.

**Interfaces:**

```ts
export type WildsWorldCommand =
  | { type: "raid.join"; bossId: string; preferredSquad?: number; commandId: string }
  | { type: "raid.contribute"; bossId: string; damage: number; support: number; cardProofDigest: string; commandId: string }
  | { type: "team.create"; name: string; commandId: string }
  | { type: "team.join"; teamId: string; commandId: string };
export type WildsWorldAuthority = { actorId: string; canonical: boolean; pulse: string; occurredAt: string };
export class WildsWorldService {
  snapshot(): WildsWorldProjection;
  execute(command: WildsWorldCommand, authority: WildsWorldAuthority): { events: WildsWorldEvent[]; projection: WildsWorldProjection };
  tick(input: { pulse: string; occurredAt: string; systemActorId: "receiz:pulse" }): { events: WildsWorldEvent[]; projection: WildsWorldProjection };
}
```

- [ ] Test a single tick spawns Crystal Burrow then boss/raid in lifecycle order, repeated Pulse is idempotent, command ids are idempotent, Kai-Klok increments without gaps, guests cannot make canonical commands, nonmembers cannot contribute, invalid card digest fails, and defeat emits `boss.defeated`, `site.phase_changed`, `site.memorialized`, and league events once.
- [ ] Run focused tests; expect failure.
- [ ] Implement append under a module-local promise mutex; decide all events before append; validate/replay the full proposed batch; retain 2,048 events plus a verified checkpoint.
- [ ] Run focused tests; expect PASS.
- [ ] Commit: `feat: orchestrate the Wilds living world kernel`.

## Task 8: Receiz-backed canonical server and routes

**Files:** Create `src/lib/receiz/wilds-world-server.ts`; create `app/api/wilds/world/snapshot/route.ts`; create `app/api/wilds/world/command/route.ts`; create `app/api/wilds/world/tick/route.ts`; extend `tests/wilds-world-service.test.ts`.

**Server contract:**

```ts
export type WildsWorldPublication = { published: boolean; mode: "receiz_live" | "local_practice" | "receiz_recovery_pending"; revision: number };
export async function hydrateWildsWorldFromReceiz(request: NextRequest): Promise<void>;
export async function executeWildsWorldCommand(request: NextRequest, body: unknown): Promise<{ projection: WildsWorldProjection; publication: WildsWorldPublication }>;
export async function tickWildsWorld(request: NextRequest): Promise<{ projection: WildsWorldProjection; publication: WildsWorldPublication }>;
```

- [ ] Test recursive recovery of `receiz.wilds_world_checkpoint.v3`, authenticated versus guest actors, malformed command rejection, stable source URL `/api/wilds/world/snapshot`, revision idempotency keys, and failed publication returning no canonical success.
- [ ] Run focused tests; expect missing modules.
- [ ] Reuse `resolveWildsMultiplayerActor`, `readAppStateByUrl`, and `publishPublicStore`. Publish `{checkpoint,eventTail}` under namespace `wilds:global:v3` with key `wilds:global:v3:<revision>:<lastEventId>`.
- [ ] Append only `boss.emerged`, `boss.defeated`, `site.memorialized`, `team.created`, and `league.scored` to `auditAppend`; audit failure after projection publication returns `receiz_recovery_pending` but preserves the recoverable canonical projection.
- [ ] Protect `/tick` with constant-time comparison to `WILDS_PULSE_TICK_SECRET`; return 503 `wilds_pulse_authority_unconfigured` when absent. The route accepts no caller-supplied time and derives Pulse/ISO time server-side.
- [ ] Ensure guest commands use an isolated practice service and never publish/audit. Authenticated mutation publication failure restores the pre-command checkpoint and returns 503.
- [ ] Run focused tests plus `pnpm typecheck`; expect PASS.
- [ ] Commit: `feat: persist the canonical Wilds world with Receiz`.

## Task 9: Proof-bound V3 player vault

**Files:** Create `src/features/play/wilds-player-vault.ts`; modify `src/features/play/card-export.ts`; create `tests/wilds-player-vault.test.ts`; extend `tests/card-export.test.ts`.

**Interfaces:**

```ts
export type WildsPlayerVaultPayload = {
  schema: "receiz.wilds_player_vault.v3"; playerId: string; exportedAt: string;
  playState: PlayState; settings: { avatarStyle: "female" | "male" | null; movementMode: "walk" | "run"; audio: Record<string, boolean | number> };
  personalEvents: { eventId: string; kind: string; occurredAt: string; receiptDigest?: string }[];
  canonicalCursor: { worldId: typeof WILDS_WORLD_ID; revision: number; eventId: string | null };
  receipts: { eventId: string; digest: string }[]; payloadDigest: string;
};
export type PortableVaultPngProofV3 = { schema: "receiz.wilds_vault_png_proof.v3"; imageDigest: string; vaultDigest: string; assets: PortableCardAsset[]; player: WildsPlayerVaultPayload };
export function createWildsPlayerVault(input: Omit<WildsPlayerVaultPayload, "schema" | "payloadDigest">): WildsPlayerVaultPayload;
export function reconcileWildsPlayerVault(input: { local: PlayState; restored: WildsPlayerVaultPayload; canonical: WildsWorldProjection; actorId: string }): { state: PlayState; warnings: string[] };
```

- [ ] Test complete state/history/settings/cursor round trip, payload tamper rejection, owner mismatch rejection, V1/V2 card-only migration, deduplicated event merge, newer local state preservation by event/revision, and canonical defeat/team/league facts winning over restored stale facts.
- [ ] Run focused tests; expect failure.
- [ ] Extend `PortableVaultPngProof` to include V3. Overload `embedPortableVaultInPng(source, assets, player?)`; emitting V2 without player preserves callers, emitting V3 with player includes the payload in `vaultDigest`.
- [ ] Return `{assets, player}` from V3 verification while retaining current `assets` for all versions. Never accept an invalid card or player digest.
- [ ] Wire `downloadPortableVault(assets, player?)` without changing legacy call sites.
- [ ] Run player-vault and card-export tests; expect PASS.
- [ ] Commit: `feat: restore complete Wilds player vaults`.

## Task 10: Client world controller

**Files:** Create `src/features/play/use-wilds-world.ts`; create `tests/wilds-world-client.test.ts`.

**Interfaces:**

```ts
export function useWildsWorld(input: { enabled: boolean; guestId: string; activeCard: PortableCardAsset | null }) {
  return { snapshot, mode, error, pendingCommand, refresh, joinRaid, contribute, createTeam, joinTeam };
}
```

- [ ] Test request shapes, 2-second snapshot polling, one in-flight command, abort on unmount, retryable reconnect state, explicit `local_practice`, and no optimistic boss health/defeat mutation.
- [ ] Run focused tests; expect failure.
- [ ] Implement the controller with `AbortController`, response schema guards, and command ids from `crypto.randomUUID()`; apply server snapshots only when revision is not older.
- [ ] Run focused tests; expect PASS.
- [ ] Commit: `feat: connect clients to the living Wilds world`.

## Task 11: Atlas and in-world coherence

**Files:** Modify `src/features/play/wilds-world-atlas.ts`; modify `src/features/play/WildsWorldMap.tsx`; modify `src/features/play/WildsEnvironment.tsx`; modify `src/features/play/WildsWorldCanvas.tsx`; extend `tests/wilds-world-atlas.test.ts`; extend `tests/wilds-render-contract.test.ts`.

- [ ] Test that the same site/boss coordinates project into atlas and gameplay; rumored sites show a soft region signal, tracked/emerged sites show exact markers, defeated sites become memorials, and expired sites disappear.
- [ ] Run focused tests; expect failure.
- [ ] Add `dynamicSites` and `bosses` to `WildsAtlasInput/Projection`. Render one accessible marker/panel per active site in `WildsWorldMap`; selecting it sets a nearby destination but never enters the activity from the map.
- [ ] Add bounded environment geometry within the existing render distance: crystal ring, burrow mouth, boss silhouette/health beacon, then glass-scar memorial. Reuse materials/geometries and avoid a second canvas.
- [ ] Keep actual entrance interaction proximity-based in gameplay. Preserve camera, D-pad, Rift, permanent landmarks, and player presence.
- [ ] Run focused tests and `pnpm typecheck`; expect PASS.
- [ ] Commit: `feat: project living events across the Wilds`.

## Task 12: Raid, team, and Pulse HUD integration

**Files:** Create `src/features/play/WildsLivingWorldHud.tsx`; modify `src/features/play/PlayCampaign.tsx`; modify `src/features/play/wilds-context-action.ts`; modify `app/globals.css`; extend `tests/wilds-render-contract.test.ts`; extend `tests/mobile-layout-css.test.ts`.

- [ ] Test a nearby emerged boss makes Pulse resolve to `raid.join`; joined fighters/supporters see role, squad/support status, boss health, contribution, and team score; controls have accessible names and no mobile truncation at 320x568 and 430x932.
- [ ] Run focused tests; expect failure.
- [ ] Mount `useWildsWorld` beside multiplayer, pass projection into map/canvas, and add `WildsLivingWorldHud` inside `.wilds-stage`. Pulse priority becomes battle action, landmark entrance, raid join/contribute, nearby player, search.
- [ ] HUD uses compact overlay pills plus one bottom sheet; it does not cover D-pad, action buttons, app dock, audio/globe, or close controls. Apply safe-area padding and scroll only inside the sheet.
- [ ] Build the V3 player payload from PlayState/settings/personal receipts when saving the vault; restore through `reconcileWildsPlayerVault` before dispatching state.
- [ ] Run render/CSS tests, `pnpm typecheck`, and `pnpm lint`; expect PASS.
- [ ] Commit: `feat: add the Wilds living world raid HUD`.

## Task 13: Recovery, concurrency, and browser proof

**Files:** Extend `tests/wilds-world-service.test.ts`; create `tests/wilds-v3-release.test.ts`; update no production files unless a failing test identifies a defect.

- [ ] Add concurrency tests: two simultaneous joins cannot exceed 36; two lethal contributions yield one defeat; duplicate command ids across recovery produce no duplicate facts; corrupt latest checkpoint falls back to the last verified checkpoint/event tail.
- [ ] Add offline/reconnect tests: client sees stale snapshot, reconnects, receives newer revision, and reconciles without rolling back local camera/player controls.
- [ ] Run `pnpm test -- --test-name-pattern="Wilds world|Crystal Burrow|shared Wilds raid|Genesis League|player vault|living world"`; expect PASS.
- [ ] Run full `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`; expect zero failures.
- [ ] Start the production server and use the existing Playwright CLI skill to verify WebKit at 320x568, 390x844, and 430x932: open map, locate Crystal Burrow, Rift nearby, walk to it, join raid, close every panel, move camera/D-pad, save and restore V3 vault, and confirm zero console errors.
- [ ] Commit: `test: prove the Wilds V3 living world slice`.

## Task 14: Release evidence and specification closure

**Files:** Modify `docs/superpowers/specs/2026-07-15-wilds-v3-living-world-program-design.md`; create `docs/superpowers/evidence/2026-07-15-wilds-v3-slice-1.md`.

- [ ] Record commit ids, exact test/build commands, browser viewport results, event/checkpoint schema examples, Receiz live/practice behavior, performance counts, and known Slice 2 boundaries.
- [ ] Mark Slice 1 complete only if all release gates pass. Slice 2 remains the wider permanent-landmark/content expansion; do not label unbuilt families or bosses as shipped.
- [ ] Run `rg -n "TODO|TBD|placeholder|mock success" src/features/play/wilds-world-* src/features/play/wilds-* app/api/wilds/world tests/wilds-* docs/superpowers/evidence/2026-07-15-wilds-v3-slice-1.md`; expect no unresolved implementation markers.
- [ ] Run `git diff --check`; expect no whitespace errors.
- [ ] Commit: `docs: seal Wilds V3 slice one evidence`.

## Final acceptance gate

- One authenticated canonical event stream can be recovered from Receiz and replayed to the same digest.
- One deterministic temporary Crystal Burrow and one unique Crystal Burrower appear at the same coordinates in map and gameplay.
- Thirty-six active fighters and unlimited support participants share one boss; the boss dies exactly once for everyone and leaves one permanent memorial.
- Starter teams and Genesis League scores derive only from canonical raid facts.
- Guest practice is unmistakably noncanonical; canonical publication failure cannot produce a false success or valuable local-only reward.
- A V3 vault image restores verified cards plus player state, history, progression, settings, receipts, and cursor, then reconciles newer canonical facts. V1/V2 vaults remain readable.
- Mobile gameplay retains independent space for world, camera, centered D-pad, side controls, HUD, app dock, globe/audio icons, and reachable close buttons.
- Full tests, typecheck, lint, production build, WebKit mobile flows, and console checks pass with recorded evidence.
