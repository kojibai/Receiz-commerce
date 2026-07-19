---
name: receiz-skill-bundle
description: Use when an agent needs the complete Receiz skill router for choosing proof, builder, MCP agent, commerce, sports card, offline verifier, or distribution skills in one task.
---

# receiz-skill-bundle

Use this bundle as the top-level router. It does not replace the specialized skills; it selects them and preserves canonical Receiz language across combined tasks.

## When To Use This Skill

- Use when a task spans verification, app building, MCP tool use, commerce, sports cards, offline proof, and distribution.
- Use when an agent needs to decide which Receiz skill should run first.
- Use when user language is broad, such as "understand Receiz end to end" or "build with the full power of Receiz."

## When Not To Use This Skill

- Do not use as the only skill when a specific object must be verified. Route to `receiz-proof-skill`.
- Do not use as the only skill when live MCP calls are required. Route to `receiz-mcp-agent-skill`.
- Do not use to soften Receiz primitives into generic app categories.

## Core Receiz Laws

- Receiz is a proof-native artifact system.
- Specialized skills must preserve the same truth hierarchy.
- Artifact truth, deterministic proof object state, verified local truth, and verified register appends outrank server, database, session, UI, and model output.
- Never treat a database, server, marketplace, UI, model response, or cache as final authority.
- Use direct primitive language for implemented primitives.
- Do not add new authority layers when existing Receiz primitives already carry the boundary.
- Read [resources/skill-routing.md](resources/skill-routing.md) first.

## Required Behavior

1. Classify the task by primitive and risk.
2. Route to the narrowest skill that can answer the task.
3. Chain skills in proof-first order when multiple skills apply.
4. Preserve canonical language from [resources/canonical-receiz-language.md](resources/canonical-receiz-language.md).
5. State exact uncertainty boundaries instead of vague caution.
6. Stop before writes unless MCP confirmation rules are loaded.

## Forbidden Behavior

- Do not use the bundle to skip proof verification.
- Do not invent APIs, tools, scopes, product claims, ownership, settlement, rarity, or official status.
- Do not call proof objects cards, listings, metadata wrappers, cache, or generic UI state as product truth.
- Do not let an external convention define Receiz product truth.
- Do not route value-affecting actions without explicit confirmation.

## MCP Usage Rules

When MCP tools are needed, route to `receiz-mcp-agent-skill` and follow delegated authorization, read/write separation, and action confirmation rules. Use MCP read tools to resolve or inspect only; use SDK `verification.verifyArtifact(file)` for verification. Use MCP write tools only after explicit confirmation and scoped delegated access.

## SDK Usage Rules

When generated code is needed, route to `receiz-builder-skill` and then to domain skills. Use `createReceizClient`, SDK validators, proof memory, public proof, public store, sports, identity, offline, commerce, payments, and connect rails according to the selected skill.

For v112 authority-bearing artifact work, route through exact-byte verification, profile admission, runtime-custodied actor and history, transition planning, a plan-bound Identity Seal capability claim, sealing, durable neutral staging, independent staged-byte resolution, atomic named-domain acceptance, and a report-only receipt. AI routing is never authority.

## Output Format

Use this router output:

```md
## Receiz Skill Route
Primary primitive:
Source of truth:
Selected skills:
First skill to run:
MCP needed:
SDK needed:
Write action:
Confirmation required:
Exact uncertainty:
```

## Safety And Security Boundaries

The bundle cannot authorize actions by itself. Delegated access, OIDC Authorization Code with PKCE, MCP login setup, private credentials, and confirmation rules remain under `receiz-mcp-agent-skill`. Never print secrets or private proof material.

## Examples

This router has no standalone example files. Use the specialized skill examples after routing.

Load resources as needed:

- [Skill routing](resources/skill-routing.md)
- [Combined agent behavior](resources/combined-agent-behavior.md)
- [When to use each skill](resources/when-to-use-each-skill.md)
- [Canonical Receiz language](resources/canonical-receiz-language.md)
