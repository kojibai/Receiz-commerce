# Receiz AI Skills

`receiz-build-production-system` remains the constitutional orchestration skill for substantial
Receiz applications. Fourteen focused constitutional skills supply architecture,
domain, law, command, authority, replay, offline, causal, artifact, migration,
performance, observability, testing, and release contracts. The earlier nine
domain skill names remain packaged for compatibility. Seven operation skill names first introduced in v107 now
describe current v108 outcomes for identity profiles, portable continuity, bearer ownership, offline transport,
proof media, cross-app state, and admission evidence. Their retired v107 mechanisms are not active defaults.
Every current manifest uses schema and version `v108` / `108.0.0`, requires SDK/MCP `>=108.0.0 <109.0.0`, and binds ruleset `108.0.0` to registry digest `126ca9283fee4ef4c398dbcb958e861cbea191724fdab8eb08df55ff0c14bb79`.

This package teaches AI agents how to understand, verify, build with, and operate Receiz from the existing repository surfaces.

It is published as `@receiz/ai-skills` and is an exact-version dependency of both `@receiz/sdk` and `@receiz/mcp-server`. Installing either package places all thirty-one skill directories under `node_modules/@receiz/ai-skills` for explicit loading by an agent host.

Receiz is a proof-native artifact system. Sealed proof/object truth is strongest: a Receiz object is not a database row, but a proof-carrying artifact whose witnessed history is the truth boundary. The proof object carries continuity; SDK and MCP may verify, extract, append, or project beneath that carried truth. Receiz.com reference behavior comes before SDK, MCP, AI, and other developer rails. Server state, database state, UI state, marketplace state, and model memory are projections only. Old witnessed truth is not stale. If a projection is wrong, rebuild it from object history. If truth is missing, append new truth. Never mutate witnessed truth.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object. AI skills adapt to that continuity and never invent an origin-platform authority or parallel chain.

## SDK, MCP, And Skills

- SDK: `@receiz/sdk` is the universal runtime; `@receiz/sdk/react` is React-only; `@receiz/sdk/compiler` is Node-only; `@receiz/sdk/testing` is browser-safe sandbox and conformance support.
- MCP: `@receiz/mcp-server` is for agent tool access. Its six artifact custody tools plan/execute native Record -> Seal, verify the complete artifact, extract only after verification, check exact byte round trip, and explain evidence through the same SDK artifact verifier. Diagnostics, public reads, app-state/public-store actions, previews, and delegated writes remain beneath proof truth.
- Skills: this package is operating doctrine. It tells an AI which Receiz primitive is active, which source of truth wins, which SDK or MCP rail to use, and what must never be assumed.

Agents may acquire scoped delegated access through the official Receiz Connect/OIDC Authorization Code + PKCE flow or through the MCP delegated-agent setup path exposed by `receiz_mcp_login`. That acquired access is permission to call scoped SDK/MCP rails after user consent. It is not proof authority and must never outrank artifact truth.

## How Agents Should Use This Package

Start with `receiz-build-production-system` when work spans multiple constitutional domains. Its machine-readable manifest requires the exact active signed registry digest, command-only mutation, independent verification, MCP conformance, and a passing release lock. Use a focused operation skill for SDK/MCP implementation and a constitutional skill for broader system law. Stable v107 wire schemas remain available only through the explicit historical `@receiz/sdk/v107` package entry; current skills never teach their key, head, receipt, reconcile, or signed-command mechanics as a v108 outcome.

The v108 operation skills are executable contracts. Current profile work uses the neutral authenticated same-UID profile operation. Current bearer ownership accepts a complete verified artifact, derives prior ownership from carried proof, and returns a native Record -> Seal artifact. Proof media uses the same native artifact custody and projects only a verified URL beneath it. These outcomes have no active identity-key, caller-head, claim-key, or receipt prerequisite. MCP calls the same SDK outcomes and never creates a parallel authority.

Stable v107 schema names and their head/receipt mechanics remain explicitly historical compatibility, not the active/default profile, bearer, or proof-media contract.

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
