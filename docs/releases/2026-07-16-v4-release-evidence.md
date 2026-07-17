# Receiz Commerce Kit v4.0.0 release evidence

Date: 2026-07-16
Status: qualified

## Release identity

- Repository version: `4.0.0`
- SDK: `@receiz/sdk@106.0.0`
- MCP: `@receiz/mcp-server@106.0.0`
- AI skills: `@receiz/ai-skills@106.0.0`
- Ruleset: `106.0.0`
- Constitution registry digest: `bf851c209e807309672c0f466411baa5607ce6b3195fe4eb16755edfeb7f5a1a`
- Authority: sealed Receiz proof objects and verified local history remain stronger than every tool or projection.

## V4 scope verified by the suite

- V3 world, atlas, ecology, bosses, raids, social systems, mastery, narrative, and legacy portability remain compatible.
- Hearttree exact-card expedition, deterministic replay, real consequences, authority admission, mobile UI contract, and local production audio are covered.
- Wayfinder exact-card contract generation, movement, negotiation, replay, consequences, authority admission, mobile UI contract, and local production audio are covered.
- Arena living revisions, exact fighter projection, movement, combat, mortal teams, NPC policy, campaign path, replay consequences, offline signing, atomic storage, causal merge, memorials, and portable Vault carriage are covered.
- The v106 registry, law evaluation, causal binding, MCP constitutional operations, all twenty-four AI skills, and coordinated release lock are covered.
- The final player-facing Arena renderer, touch HUD, global sync route, production Arena sound bank, and browser qualification are explicitly outside this release claim.

## Required evidence

- `pnpm test`: 738 passing, zero failures across 168 suites.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed; 21 static pages generated and the complete Next application route graph compiled.
- `pnpm secret:scan`: passed across 816 tracked files.
- `pnpm receiz:check`: passed against target `106.0.0` with `integration_compliant` and no blocking findings.
- `pnpm receiz:conformance`: 13/13 passed without network or database authority; evidence digest `cd890dd125ed00a52d385414006e16ea2053f7dc0a3d2d7bd9cd90b7e6dbadba`.
- `pnpm validate:ai-skills`: all 24 skills passed.
- `pnpm receiz:release-lock`: package, registry, MCP, AI-skill, lockfile, and conformance parity passed.
- `pnpm receiz:doctor`: passed with SDK `106.0.0`, no missing capabilities, no warnings, and no credential values exposed.
- `pnpm receiz:migrate:dry-run`: produced plan `526bd9ea04a65dba58052ecdc5db4f18ddc6f371978bd7cf371e47e85d1c6d84` with zero safe changes and 81 fail-closed syntax findings; every category and authority disposition is recorded in `docs/releases/2026-07-16-v106-migration-audit.md`, and no ambiguous rewrite was applied.

This evidence is not admission, a proof object, or authority to rewrite existing history.
