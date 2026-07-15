# Wilds V3 Slice 3 — Dynamic World Ecology Evidence

Date: 2026-07-15  
Scope: Slice 3 only  
Result: Qualified

## Shipped boundary

Slice 3 adds a deterministic living-ecology layer beside the existing permanent landmarks and Crystal Burrow kernel. It ships eight families—wandering market, echo ruin, unstable portal, convergence festival, creature migration, resource bloom, stormfront, and settlement distress—with bounded placement, authored lifecycle, causal descendants, physical discovery, canonical contributions, aftermath, history, local procedural presentation, local synthesized audio, player-specific atlas knowledge, and portable recovery.

This evidence does not claim final V3 completion. Boss ecology, mature global raids, full teams/leagues, card civilization, narrative scale, and final multi-client/device qualification remain Slices 4–8.

## Commits

- `9fb40fa6` — dynamic-ecology design
- `b58e4d41` — implementation plan
- `5f7574ed` — deterministic ecology grammar
- `12458947` — canonical events, projection, scheduler, and commands
- `277ad30b` — Save V7 ecology receipts and vault continuity
- `53147c34` — rumor privacy and atlas projection
- `8be190a4` — local procedural ecology environment
- `16add460` — eight playable activity modules and responsive shell
- `8ca36f95` — physical discovery, receipts, local audio, and campaign integration

## Automated verification

- `pnpm test` — PASS: 500 tests, 112 suites, 0 failures, 0 skipped.
- `pnpm typecheck` — PASS.
- `pnpm lint` — PASS.
- `pnpm build` — PASS with Next.js 15.5.19 optimized production output.
- `git diff --check` — PASS.
- unfinished-marker scan across Slice 3 runtime and test files — no TODO, FIXME, HACK, or placeholder hits.

The release contract covers the eight distinct activity families, deterministic generation, lifecycle starting state, coordinate privacy, exact knowledge projection, Save V7 round-trip, local-only rendering/audio, 44px controls, focus-safe viewport ownership, and renderer diagnostics.

## Authority and continuity

- Canonical ecology mutations enter the existing `WildsWorldService` event history and preserve Pulse/Kai-Klok ordering.
- Discovery requires the submitted position to be inside the site's physical radius.
- Contributions require canonical authority, valid card proof syntax, bounded integer magnitude, legal phase, physical presence, and idempotent command IDs.
- Resolution enters aftermath once the shared contribution threshold reaches ten; a later Pulse can derive at most one deterministic causally linked child.
- Practice mode is visibly labeled `Local practice · cannot publish`; it does not claim Receiz-live authority.
- Rumor and approximate atlas projections omit the `position` property. Exact coordinates appear only after valid personal knowledge.
- Existing Crystal Burrow, boss, raid, team, league, settlement, card, and proof behavior remains covered by the full regression suite.

## Recovery evidence

- Save schema advances to `receiz.wilds.save.v7` while accepting V2–V6 inputs.
- Ecology receipts are proof-digested, append-only, source-deduplicated, bounded to 2,048, and derive knowledge/mastery rather than storing canonical site authority.
- V3 player-vault reconciliation and the portable PNG save path carry ecology history with the rest of the player state.
- Production WebKit deep flow persisted two receipts, exact Wayfarer Market knowledge, mastery `4`, and the unchanged return coordinate `{ x: -139, z: -32 }` after discovery plus one accepted contribution.

## Production WebKit qualification

URL: `http://127.0.0.1:3001/#play` against `pnpm start -p 3001` after the successful production build.

Deep representative path:

1. Restored the local test explorer and placed only that disposable browser save at the canonical Wayfarer Market coordinate.
2. Observed the local procedural market and nearest-event HUD at `0m`.
3. Activated `Discover Wayfarer Market` from the physical Pulse control.
4. Observed world phase `foreshadowed → discovered`, an exact personal receipt, mastery `1`, and the full-screen activity.
5. Completed Attune → Carry → Seal in the deterministic order.
6. Submitted the verified SealCub contribution.
7. Observed world phase `active`, participant count `2`, mastery `4`, exact knowledge, and a return action.
8. Confirmed the player coordinate remained `{ x: -139, z: -32 }`.

Viewport matrix:

| Viewport | Horizontal overflow | Minimum required control | Result |
| --- | ---: | ---: | --- |
| 320×568 | 0px | 44px | PASS |
| 390×844 | 0px | 44px | PASS |
| 430×932 | 0px | 44px | PASS |
| 1440×900 | 0px | n/a (world view) | PASS |

Artifacts:

- `output/playwright/wilds-v3-slice3-ecology-320x568.png`
- `output/playwright/wilds-v3-slice3-ecology-390x844.png`
- `output/playwright/wilds-v3-slice3-ecology-430x932.png`
- `output/playwright/wilds-v3-slice3-ecology-desktop-1440x900.png`

Console result: 1 total informational entry, 0 errors, 0 warnings.

## Renderer profile

Active 320×568 ecology scene:

- draw calls: 127 / 160
- triangles: 89,724 / 180,000
- geometries: 67 / 110
- textures: 4 / 6
- DPR: 1.0
- CSS canvas: 280×236
- budget status: `withinBudget: true`

Active 1440×900 world scene:

- draw calls: 136 / 160
- triangles: 116,228 / 180,000
- geometries: 72 / 110
- textures: 4 / 6
- DPR: 1.25
- CSS canvas: 774×484; drawing buffer: 967×605
- budget status: `withinBudget: true`

The ecology renderer selects at most two detailed manifestations, shares geometry/material objects, instances repeated signals/actors, and disposes locally owned resources.

## Local-only asset and audio ledger

No third-party model, map, image, audio, generation, analytics, or runtime asset API was added.

- 3D environment: React Three Fiber and Three.js primitives authored in `WildsEcologyEnvironment.tsx`.
- Repeated detail: local `InstancedMesh` signals, migration actors, and bloom shards.
- UI art: CSS geometry, gradients, rings, and existing local Lucide icon dependency.
- Audio: Web Audio oscillators and gain envelopes synthesized locally after a user gesture.
- Family motifs: market, ruin, portal, festival, migration, bloom, storm, and distress, plus rumor, step, and resolution cues.
- Runtime textures used by the full active world: 4; Slice 3 adds no external texture file.

## Visual scorecard

Scale: 0–3. Premium gate requires every category ≥2 and average ≥2.3.

| Category | Score | Evidence |
| --- | ---: | --- |
| Art direction | 3 | Cohesive living-world materials, restrained family accents, and proof-aware provenance. |
| Hero/player asset | 2 | Existing articulated explorer remains readable; Slice 3 does not replace its asset pass. |
| Obstacles/enemies | 2 | Eight distinct ecology silhouettes; deeper boss/ecology actors remain Slice 4. |
| Rewards/interactables | 3 | Physical Pulse, objective rail, proof-pinned card role, and admitted contribution feedback. |
| World/environment | 3 | Learnable canonical coordinate, detailed market, bounded regional ecology, and atlas continuity. |
| Materials/textures | 2 | Shared roughness, metalness, transmission, and emissive roles; intentionally texture-light/local. |
| Lighting/render | 2 | Clear depth and readable emissive signals within budget; no new post-processing pass. |
| VFX/motion | 2 | Portal rotation, moving instances, signals, and reduced-motion coverage; restrained for mobile cost. |
| UI/HUD | 3 | One-viewpoint shell, safe areas, 44px controls, horizontal objective rail, focus restore, zero overflow. |
| Performance evidence | 3 | Production WebKit diagnostics at mobile and desktop with all stated budgets green. |

Average: **2.5/3 — premium gate PASS.** Showcase gate is not claimed because only four categories score 3; final visual scale remains part of later V3 slices.

## Residual boundary

- The deep browser flow used correctly labeled local practice because live Receiz publication authority was not present in the local environment; canonical event/service behavior is covered by direct authority/replay tests.
- Real multi-client concurrent contribution and causal-child observation remain part of later shared-world qualification.
- No physical-device FPS trace was captured; renderer budgets, DPR, viewport fit, and production WebKit behavior were captured.
- Slice 3 adds eight of the program's target twelve generated site families; the remaining content-scale target belongs to later slices.
