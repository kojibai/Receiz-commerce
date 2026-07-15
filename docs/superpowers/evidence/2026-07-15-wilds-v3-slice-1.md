# Wilds V3 Slice 1 release evidence

Date: 2026-07-15  
Branch: `main`  
Result: Living World Kernel slice release-qualified

## Shipped boundary

Slice 1 establishes the V3 architecture once, end to end: a Pulse/Kai-Klok ordered world event stream; replayable projection and verified checkpoint; deterministic generated Crystal Burrow; unique modular Crystal Burrower; six squads of six plus a deduplicated support field; irreversible shared defeat and memorial facts; starter teams and Genesis League; Receiz publication, audit, and recovery routes; a proof-bound V3 player vault; atlas/gameplay coordinate coherence; and responsive raid/world controls.

Guest play uses a visibly labelled, isolated `local_practice` service. It can never publish or audit canonical facts. A recovered Receiz checkpoint with revision greater than zero selects `receiz_live`. Authenticated canonical mutation rolls back when projection publication fails, so the UI cannot report a valuable local-only canonical success.

## Implementation commits

- `3963abe9` canonical world events
- `0b57c935` replayable world projection and checkpoint
- `f7c61fc8` deterministic generated sites
- `1ced50ae` modular Crystal Burrower
- `de1c69a2` global raid capacity and permanent defeat
- `e0333412` teams and Genesis League
- `c5dec4fe` authorized living-world service
- `fb366506` Receiz publication, audit, recovery, and protected tick routes
- `b8081889` proof-bound V3 player vault and reconciliation
- `8d672f6e` client polling and command controller
- `ef1ba06c` atlas and walkable-world event projection
- `06eff311` explicit isolated practice-world boot
- `61e558af`, `52674183` mobile world-status clearance at 390px and 320px

## Verification record

Commands executed from the repository root:

```text
pnpm test
pnpm typecheck
pnpm lint
pnpm build
curl -sS http://127.0.0.1:3001/api/wilds/world/snapshot
```

Final automated result before evidence closure: 447 tests across 102 suites, 447 passed, 0 failed. TypeScript and ESLint passed. The optimized Next.js 15.5.19 build compiled, generated 21 static pages, and exposed `/api/wilds/world/snapshot`, `/command`, and `/tick` as dynamic server routes.

The production snapshot probe returned revision 4 in `local_practice`, one `Crystal Burrow` at `{x:227,z:220}`, one unique `Vesperclast, Crystal Burrower`, and one forming raid. The ordered cursor ended at Kai-Klok 4. Representative schemas were:

```text
receiz.wilds_world_event.v3
receiz.wilds_world_projection.v3
receiz.wilds_world_checkpoint.v3
receiz.wilds_player_vault.v3
receiz.wilds_vault_png_proof.v3
```

The release suite specifically proves 36 fighter admissions, stable six-squad allocation, unlimited deduplicated support admission, idempotent contributions, one irreversible defeat, deterministic replay, checkpoint digest verification, no client revision rollback, exact atlas/game coordinates, complete V3 vault restoration, older vault compatibility, and camera-relative mobile movement.

## Mobile WebKit proof

Production-mode WebKit was exercised at 320×568, 390×844, and 430×932. The flow opened Play, selected an explorer, opened the full-screen atlas, found Crystal Burrow, selected its destination, confirmed an exact Rift, landed at `{x:239,z:232}` 17m from the site, and exposed `Join shared boss raid` only after arrival. The atlas close control remained reachable. The centered movement pad, three controls on each side, world surface, command dock, and app dock retained independent space. The compact 320px status uses `Burrow` rather than truncating or covering the player identity. WebKit console checks returned zero errors and zero warnings on the final 390px/430px runs and zero errors on the 320px run.

Artifacts:

- `output/playwright/wilds-v3-320x568-final2.png`
- `output/playwright/wilds-v3-390x844-final-fresh.png`
- `output/playwright/wilds-v3-430x932.png`

## Performance and boundedness

- World service retains a bounded event tail and verified checkpoint.
- Raid fighters are capped at 36; support identities and contribution events are deduplicated.
- Atlas projection and generated environment reuse the existing canvas rather than mounting a second renderer.
- Client world snapshots poll at a bounded interval and reject older revisions.
- Player-vault proof material is embedded in one portable PNG and remains offline-verifiable.

## Slice 2 boundary

Slice 1 deliberately ships one generated-site family and one modular boss family to prove the complete architecture. It does not claim the broader permanent-landmark civilization, dynamic migrations/markets/festivals/portals/ruins, the full boss ecology, mature team administration, expanded card-role economy, narrative seasons, or final whole-program content-density score. Those remain Slices 2–8 and must extend these schemas and authority rules without replacing them.
