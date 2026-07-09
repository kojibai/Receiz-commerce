# Receiz AI Skills

This package teaches AI agents how to understand, verify, build with, and operate Receiz from the existing repository surfaces.

Receiz is a proof-native artifact system. A Receiz object is not a database row. It is a proof-carrying artifact. The artifact's witnessed history is the truth boundary. Server state, database state, UI state, marketplace state, and model memory are projections only. Old witnessed truth is not stale. If a projection is wrong, rebuild it from object history. If truth is missing, append new truth. Never mutate witnessed truth.

## SDK, MCP, And Skills

- SDK: `@receiz/sdk` is for building apps. It exposes validators, projections, proof memory, identity artifact helpers, public app-state, public store, commerce, wallet, sports, world, offline queues, webhooks, and sandbox helpers.
- MCP: `@receiz/mcp-server` is for agent tool access. It exposes SDK-backed tools for diagnostics, public reads, offline verification, app-state/public-store actions, deterministic previews, and delegated writes.
- Skills: this package is operating doctrine. It tells an AI which Receiz primitive is active, which source of truth wins, which SDK or MCP rail to use, and what must never be assumed.

Agents may acquire scoped delegated access through the official Receiz Connect/OIDC Authorization Code + PKCE flow or through the MCP delegated-agent setup path exposed by `receiz_mcp_login`. That acquired access is permission to call scoped SDK/MCP rails after user consent. It is not proof authority and must never outrank artifact truth.

## How Agents Should Use This Package

Start with `receiz-skill-bundle` when the request spans multiple Receiz domains. Use `receiz-proof-skill` for any verification, proof object, vault, profile, pack, card, post, product, listing, receipt, marketplace, or offline artifact question. Use narrower skills only after the primitive is named.

Do not invent APIs. Use the SDK and MCP maps inside the skills, then inspect the repo when a requested operation is not listed.

## Developer Install Or Reference

Reference this directory directly from an agent host, or copy the individual skill folders into an agent skill directory. Keep the package together when possible because the router skill depends on the domain skills.

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
