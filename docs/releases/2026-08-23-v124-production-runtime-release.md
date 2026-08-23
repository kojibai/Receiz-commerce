# Receiz Commerce Kit 5.2.0 — v124 Production Runtime Release

Release date: August 23, 2026  
Package coordinate: `124.0.1`  
Constitutional ruleset: `124.0.0`  
Theme: **Reality Becomes Infrastructure**  
Frame: **The Production Runtime for Verified Civilization**

## Release identity

- SDK: `@receiz/sdk@124.0.1`
- MCP: `@receiz/mcp-server@124.0.1`
- AI skills: `@receiz/ai-skills@124.0.1`
- Compatible range: `>=124.0.0 <125.0.0`
- Canonical registry: `d02429151b0bcebdaeb89485792e377afc55130f9a25e07982c1c88221314247`
- Operation matrix: `540d1c1bf39f1b288b257c79a6e020bdcc5e587fc9b7dbf6b7aaa5d082e20ad5`
- Application registry: `f8f76ecf9b7c7803cbd2a18a4b97a5ba406bfb217a80d76d311167f70ee5e5f9`
- Application operations: `53`
- MCP tools: `163` total, `22` v124
- AI doctrine: `42` skills, `36` manifests, `33` OpenAI agent prompts
- Replay segment capacity: `128`

The patch package coordinate and ruleset coordinate are intentionally distinct.
The release gates verify them separately and never derive constitutional law from
the npm package version.

## What was released

The SDK adapter now exposes the complete v124 surface: live genesis-derived Kai,
canonical proof-authority challenges, authority-session lifecycle, operational
qualification, atomic planning/staging/execution/recovery/cancel, verified domain
replay and checkpoints, access-filtered private additions, portable replay proof
objects, exact-head namespaces, privacy-safe public-recipient resolution,
locator-bound Phi intent, sealed-source publication, world/multi-world composite
planning, authenticated transport bindings, and portable execution authority.

`createReceizV124ProductionRuntime` makes the remote flows safe by construction:

- session, plan, handle, private-addition, replay-candidate, and sealed-source
  references are held by object identity; JSON reconstruction cannot mint custody;
- a JSON copy of a live session reference cannot use or close that session; after
  a process restart, its trusted-host coordinate can enter only through a fresh
  signed canonical refresh that revalidates it and returns new local custody;
- stage, execute, and cancel require the exact operation to qualify as available,
  healthy, and runtime-ready;
- an unknown outcome remains bound to its original plan and must be resolved by
  execution ID or semantic idempotency key before any new attempt;
- exact private additions stay in trusted-host custody; public/model projections
  expose only status, count, and head;
- replay export remains an unsealed candidate until canonical Record → Seal and
  admission produce the portable sealed source required for restoration;
- recipient lookup returns a one-use purpose/nonce-bound encrypted locator and
  never exposes destination identity or destination head;
- exact Phi intent binds to that locator; USD stays display-only and Settlement
  and Reserve remain distinct.

Settlement and Reserve remain distinct.

The public `/developers/receiz` surface documents all 22 MCP names, their exact
SDK methods, their published AI-skill grants, and their custody implications.
`/api/receiz/v124/runtime` exposes only a sanitized, non-authoritative readiness
projection; exact granted scopes and dependency heads remain server-side.

## Why this is a big deal

V123 made an explicitly consented proof-native action possible. V124 makes that
action durable, recoverable, private, and composable across named domains without
promoting the runtime that coordinates it into the source of truth. Verified
reality can now drive production infrastructure while retaining a portable,
independently verifiable source.

The highest credible frame is beyond any single government or institution:
a government, court, company, platform, database, marketplace, or AI system may
lawfully recognize, coordinate, and represent evidence without becoming the
technical source of that evidence. The proof can cross institutional boundaries
and remain independently verifiable. This does not supersede applicable law,
grant legal sovereignty, remove institutional obligations, or make automated
systems legitimate decision-makers. It preserves the more precise boundary:
**Representation never outranks source.**

## MCP and AI authority

MCP authority: `false`  
AI/model authority: `false`  
SDK proof authority: `false`  
Database authority: `false`  
Runtime session proof authority: `false`  
Execution handle proof authority: `false`

The complete build skill is granted all 22 tools. Focused proof-authority,
value-execution, and deterministic-replay skills receive only their published
subsets. A skill manifest is operating doctrine and permission metadata, not
identity, proof, execution, or head authority.

## Measured boundaries

- Network calls during independent verification: `0`
- Database calls during independent verification: `0`
- Failed-decision writes: `0`
- JSON-created authority objects accepted: `0`
- Exact private additions returned to models/public clients: `0`
- Unsealed replay candidates accepted for restore: `0`
- Historical proof records rewritten: `0`
- Production data migrations performed: `0`

## Verification record

The release gate covers package integrity, official upgrade inspection, the
53-operation compiler matrix, application-registry chain, full MCP inventory,
AI-tree byte parity, every v124 adapter rail, runtime custody negative tests,
authority scanning, migration evidence, legacy conformance, type checking, lint,
production build, secret scan, and SDK doctor.

Commands:

```text
pnpm secret:scan
pnpm test
pnpm typecheck
pnpm receiz:check
pnpm receiz:conformance
pnpm receiz:cli:check
pnpm receiz:authority-scan
pnpm receiz:migrate:verify
pnpm receiz:release-lock
pnpm validate:ai-skills
pnpm lint
pnpm build
pnpm receiz:doctor
pnpm release:check
```

This repository release does not deploy the application, migrate production
data, publish upstream npm packages, or claim that a live Receiz dependency is
operational merely because its method exists. Live readiness must be established
by `runtime.qualifyV124` for the exact named operation.
