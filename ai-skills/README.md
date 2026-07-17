# Receiz AI Skills

`receiz-build-production-system` remains the constitutional orchestration skill for substantial
Receiz applications. Fourteen focused constitutional skills supply architecture,
domain, law, command, authority, replay, offline, causal, artifact, migration,
performance, observability, testing, and release contracts. The earlier nine
domain skills remain packaged for compatibility. v107 adds seven executable
operation skills for identity profiles, portable continuity, generic bearer
ownership, offline commands, proof media, cross-app state, and receipt admission.
Every current manifest requires SDK/MCP `>=107.0.0 <108.0.0`, ruleset `107.0.0`, and registry digest `4d0caa6172a69c3bf5817c1c35db5630e555b5d6d824091d45a90fb426b86ef6`.

This package teaches AI agents how to understand, verify, build with, and operate Receiz from the existing repository surfaces.

It is published as `@receiz/ai-skills` and is an exact-version dependency of both `@receiz/sdk` and `@receiz/mcp-server`. Installing either package places all thirty-one skill directories under `node_modules/@receiz/ai-skills` for explicit loading by an agent host.

Receiz is a proof-native artifact system. A Receiz object is not a database row. It is a proof-carrying artifact. The artifact's witnessed history is the truth boundary. Server state, database state, UI state, marketplace state, and model memory are projections only. Old witnessed truth is not stale. If a projection is wrong, rebuild it from object history. If truth is missing, append new truth. Never mutate witnessed truth.

## SDK, MCP, And Skills

- SDK: `@receiz/sdk` is the universal runtime; `@receiz/sdk/react` is React-only; `@receiz/sdk/compiler` is Node-only; `@receiz/sdk/testing` is browser-safe sandbox and conformance support.
- MCP: `@receiz/mcp-server` is for agent tool access. It exposes SDK-backed tools for diagnostics, public reads, offline shape inspection, app-state/public-store actions, deterministic previews, and delegated writes. Artifact verification remains SDK `verification.verifyArtifact(file)` and requires continuity.
- Skills: this package is operating doctrine. It tells an AI which Receiz primitive is active, which source of truth wins, which SDK or MCP rail to use, and what must never be assumed.

Agents may acquire scoped delegated access through the official Receiz Connect/OIDC Authorization Code + PKCE flow or through the MCP delegated-agent setup path exposed by `receiz_mcp_login`. That acquired access is permission to call scoped SDK/MCP rails after user consent. It is not proof authority and must never outrank artifact truth.

## How Agents Should Use This Package

Start with `receiz-build-production-system` when work spans multiple constitutional domains. Its machine-readable manifest requires the exact active signed registry digest, command-only mutation, independent verification, MCP conformance, and a passing release lock. Use a focused v107 operation skill for SDK/MCP implementation and a constitutional skill for broader system law. The compatibility router `receiz-skill-bundle` and proof/domain skills remain available for earlier workflows.

The v107 operation skills are executable contracts. Each binds exact SDK calls,
MCP plan/execute tools, delegated scopes, proof heads, idempotency, offline and
conflict behavior, receipt verification, confirmation boundaries, and deterministic
emulator fixtures. They never grant autonomous mutation authority.

Do not invent APIs. Use the SDK and MCP maps inside the skills, then inspect the repo when a requested operation is not listed.

## Developer Install Or Reference

Install `@receiz/sdk`, `@receiz/mcp-server`, or `@receiz/ai-skills` directly. Reference `node_modules/@receiz/ai-skills` from an agent host, or copy the individual skill folders into an agent skill directory. Keep the package together when possible because the router skill depends on the domain skills.

When SDK or MCP changes:

1. Inspect `packages/receiz-sdk/src/index.ts`, `packages/receiz-sdk/src/identity.ts`, `packages/receiz-sdk/src/react.ts`, and `packages/receiz-mcp-server/src/index.ts`.
2. Update `receiz-proof-skill/resources/sdk-reference.md` and both MCP tool maps.
3. Update domain skills only when the changed rail affects their primitive.
4. Run `pnpm validate:ai-skills`.
5. Run package tests when the SDK or MCP behavior changed.

## Safety Boundaries

- Verify before claiming.
- Never invent ownership, witness IDs, rarity, transfer history, verification status, proof IDs, append IDs, or settlement state.
- Never treat a database, server, marketplace, UI, model response, or cache as final authority.
- Never mutate witnessed history.
- Append new truth only.
- If a view is wrong, rebuild the projection from witnessed history.
- If history is missing, append the missing truth.
- Generated apps must preserve Receiz proof semantics.
- Generated apps should not require a traditional database unless the user explicitly asks for one.
