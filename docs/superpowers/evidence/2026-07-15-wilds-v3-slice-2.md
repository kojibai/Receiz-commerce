# Wilds V3 Slice 2 release evidence

Date: 2026-07-15  
Branch: `main`  
Result: Landmark Civilization slice release-qualified

## Shipped boundary

Slice 2 adds one deep permanent civilization anchor, Wayfinder Hollow, at the same exact `{x:72,z:40}` coordinate in the atlas and walkable world. A Rift lands outside the settlement, the explorer must cross the physical entrance radius on foot, and Pulse opens the settlement experience. Five stable districts provide orientation, live social presence, verified-card attunement, a deterministic route-memory activity, and shared-world monuments. Mira Vale, Oren Moss, and Sola Reed remain permanent residents with append-only civic encounters.

Civic events and regional reputation are deterministic, deduplicated, migrated into save schema V6, embedded in portable PNG saves, and reconciled through the V3 player vault. Card attunement verifies the existing proof and records its exact digest without rewriting card identity or history. Monument Walk reads defeated boss IDs only from the living-world projection and labels `receiz_live` history as canonical while visibly isolating local practice memory.

All new visual and audio assets are local. The settlement uses authored procedural Three.js geometry, shared materials, instanced lamps, CSS icons, and Web Audio synthesis. No third-party asset service, model API, image API, map API, audio API, CDN asset, or external runtime asset was added.

## Implementation commits

- `68a3dd9e` Slice 2 design
- `1be89f7d` implementation plan
- `271afba4` stable Wayfinder Hollow settlement contract
- `1eda054a` deterministic civic-history projection
- `dc543d10` deterministic route-memory activity
- `8343c0b6` save V6, PNG, and V3 vault civic persistence
- `546c92f8` procedural settlement environment in the shared canvas
- `9caa969d` five-district civic experience
- `de2be20e` physical entry, discovery, civic dispatch, and synthesized audio
- `c9955a77` release contract and mobile touch-target proof

## Automated verification

Commands executed from the repository root:

```text
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Final result: 466 tests across 106 suites, 466 passed, 0 failed. TypeScript and ESLint passed. The optimized Next.js 15.5.19 production build compiled successfully and generated all 21 static pages.

The Slice 2 suites prove stable settlement coordinates, five districts, three residents, deterministic civic replay, duplicate-source reputation caps, actor normalization, exact three-direction route completion, invalid proof rejection, V5-to-V6 migration, V3 vault reconciliation, unchanged canonical projection authority, atlas/world coordinate equality, monument authority, local synthesized-audio disposal, compact mobile CSS, and the complete rendering/integration contract.

## Production browser playthrough

Production-mode WebKit completed the actual player journey rather than opening the settlement directly:

1. select an explorer;
2. open the full-screen atlas;
3. select Wayfinder Hollow and hold to Rift;
4. land outside at approximately `{x:82,z:50}`;
5. use the camera-relative movement pad to walk across the entrance boundary;
6. Pulse `Enter Wayfinder Hollow`;
7. meet Mira, complete orientation, visit Dawn Commons, meet Oren, offline-verify and attune SealCub, complete the West–East–North route, meet Sola, and study the world archive;
8. return to the exact world position with civic reputation preserved.

Viewport checks passed at 320×568, 390×844, 430×932, and 1440×1000. Every settlement control measured at least 44×44 CSS pixels. The 320px document and dialog both measured exactly 320px wide, the 430px document measured exactly 430px wide, and neither produced page-level overflow. The close control and fixed return control remained reachable. Final console inspection returned zero errors and zero warnings on mobile and zero errors on desktop.

Artifacts:

- `output/playwright/v3-wayfinder-world-390x844.png`
- `output/playwright/v3-wayfinder-settlement-390x844.png`
- `output/playwright/v3-wayfinder-settlement-320x568.png`
- `output/playwright/v3-wayfinder-settlement-430x932.png`
- `output/playwright/v3-wayfinder-desktop.png`

## Renderer and resource evidence

The profiled 430×932 WebKit run reported:

- 154 draw calls against a 160-call budget;
- 117,754 triangles, 65.4% of the configured budget;
- 96 geometries and 4 textures;
- DPR 1.25 on the medium quality tier;
- `withinBudget: true`;
- Three.js 0.182.0 with the warning-free compatibility profile;
- one existing shared renderer, not a second settlement renderer.

Procedural settlement modules reuse geometry/material instances and bound lamp population. Audio cues are created through the existing gesture-safe local synthesizer and release oscillator, gain, and context resources through the tested lifecycle. No new downloaded binary assets or network asset dependencies exist.

## Slice scorecard

This is a score for the Slice 2 boundary, not a claim that all of V3 is complete.

| Category | Score | Evidence |
| --- | ---: | --- |
| World coherence and orientation | 9.5 | One atlas/walkable coordinate; near-Rift plus physical entry; persistent settlement identity |
| Landmark identity and atmosphere | 9.2 | Five authored districts, local procedural silhouette, stable residents, day-to-day civic purpose |
| Mobile usability | 9.5 | Four viewports, no page overflow, 44px controls, reachable fixed exits |
| Card utility and Receiz continuity | 9.5 | Offline proof verification, exact digest pinning, no mutation of card identity/history |
| Activities and discovery | 9.0 | Orientation, social commons, attunement, deterministic route memory, archive |
| Social and historical life | 9.0 | Live nearby-presence projection and authoritative/practice monument separation |
| Persistence and recovery | 9.6 | Save V6, legacy migration, portable PNG, V3 vault reconciliation |
| Visual clarity and polish | 9.2 | Responsive full-screen civic frame, consistent district language, local icon system |
| Audio and feedback | 8.9 | Local arrival/service/route cues with bounded lifecycle; broader regional score belongs to Slice 7 |
| Performance and stability | 9.3 | Budget-positive renderer diagnostics, clean console, full automated/build pass |

Slice 2 evidence-backed average: **9.27/10**. No scored category is below the program's 8.5 floor.

## Slice 3 boundary

Slice 2 intentionally proves the reusable permanent-civilization grammar with one deep settlement. It does not claim the complete dynamic ecology: migrations, wandering markets, festivals, portals, ruins, disasters, threat propagation, rumor lifecycles, or multiple generated settlement events remain Slice 3. The wider boss ecology, mature teams/leagues, expanded card economy, narrative seasons, and final whole-program qualification remain Slices 4–8.
