# Receiz AI Skills

The `120.0.0` package is a registry-bound operating-contract distribution beneath Receiz proof authority. AI instructions, MCP confirmations, JSON objects, database rows, staging references, and receipts never become proof or runtime authority.

## V120 artifact authority chain

V120 carries two established proof-object laws unchanged:
`receiz.native_capture.v1` binds exact bytes from Receiz's dedicated camera
ceremony, and `receiz.pbi.proof-object-authorship.v1` appends verified PBI
authorship to an already verified predecessor. Signing is unavailable before
canonical verification. Multi-signer history remains ordered forever, local
settlement completes before optional global publication, and authorship never
changes ownership, media bytes, capture provenance, or prior proof.

The exact current sequence is: verify exact bytes → profile admission → verified actor/history → transition → plan/domain/effects/idempotency → plan-bound capability → seal → durable stage → independent byte resolution → atomic named-domain acceptance → report-only receipt.

Exact bytes cross a process only as bytes and require `reverify-exact-bytes`. Verified artifacts, admissions, histories, actors, plans, verified capabilities, candidates, and stores require `same-runtime-custody`. Identity Seal signing uses local key custody, supports Ed25519 and P-256, and produces a signed claim—not verified capability authority. Private keys and passphrases are never serialized.

The single current MCP artifact inventory contains nine tools: `receiz_artifact_verify`, `receiz_artifact_admit`, `receiz_artifact_append_plan`, `receiz_artifact_transition_seal_and_stage`, `receiz_artifact_transition_commit`, `receiz_artifact_global_resolve`, `receiz_artifact_reconcile_plan`, `receiz_artifact_reconcile_stage`, and `receiz_artifact_reconcile_commit`. The first five are also the explicitly historical v112 compatibility inventory, not a second current surface. A sealed candidate is a proof object but not the accepted head. Stage writes no head and its reference is non-authoritative. Commit resolves and reverifies staged bytes before atomic named-domain acceptance. `COMMIT_DOMAIN_MISMATCH` is distinct from same-domain `IDEMPOTENCY_CONFLICT`; registry-derived effects stay outside the portable transition digest; unknown namespaces remain byte-preserved.

The same v120 package carries 37 living-subject MCP tools: subject resolve/state/history/memory/relationships/inventory; subject Twin profile/message/mind export/import planning; mandate get/plan/activate/pause/revoke; world additions/command plan/validate/execute/transaction plan/execute/receipt/replay; subject runtime enqueue/status/cancel; living-subject conformance; proof-brain head/search/resolve/stream; and bearer preview/issue/inspect/claim/cancel/status. Each generated skill map binds those exact names to SDK primitives, strict input/output types, source primitive, registry/reducer digests, zero-write failure, and the non-authority boundary.

`client.admission.browserStore` is durable admission coordination only: it stores no proof object or sealed artifact bytes and never blocks known-artifact first paint. V120 production reconciliation preserves the provider-neutral `client.coordination` rail and never exposes Supabase mechanics. Receiz-generated files retain declared ownership, while `receiz.extensions.ts` is developer-owned and must never be overwritten.

`receiz-build-production-system` remains the constitutional orchestration skill for substantial
Receiz applications. Fifteen focused constitutional skills supply architecture,
domain, law, command, authority, replay, offline, causal, artifact, migration,
performance, observability, testing, and release contracts. The earlier nine
domain skill names remain packaged for compatibility. Seven operation skill names first introduced in obsolete-versioned now
describe current v120 outcomes for identity profiles, portable continuity, bearer ownership, offline transport,
proof media, cross-app state, and admission evidence. Their retired obsolete-versioned mechanisms are not active defaults.
One dedicated `receiz-global-reconciliation` skill governs accepted-head resolution, verified offline reconciliation, structural divergence, first paint, indeterminate recovery, and effects. Every current manifest uses package version `120.0.0`, requires SDK/MCP `>=120.0.0 <121.0.0`, and binds ruleset `120.0.0` to registry digest `0728651789b26e1d10c1991ec1c06c1ea4a576f0c6520537b250b171f8857073` and operation-matrix digest `1c779ee5ade4b877ae9c6922ab02ba96fffffeb7580f1cf105a59fbb4424f351` from SDK source.

This package teaches AI agents how to understand, verify, build with, and operate Receiz from the existing repository surfaces.

It is published as `@receiz/ai-skills` and is an exact-version dependency of both `@receiz/sdk` and `@receiz/mcp-server`. Installing either package places all 39 skills under `node_modules/@receiz/ai-skills`: 33 manifests and 30 OpenAI agent prompts are included for explicit loading by an agent host.

Receiz is a proof-native artifact system. Sealed proof/object truth is strongest: a Receiz object is not a database row, but a proof-carrying artifact whose witnessed history is the truth boundary. The proof object carries continuity; SDK and MCP may verify, extract, append, or project beneath that carried truth. Receiz.com reference behavior comes before SDK, MCP, AI, and other developer rails. Server state, database state, UI state, marketplace state, and model memory are projections only. Old witnessed truth is not stale. If a projection is wrong, rebuild it from object history. If truth is missing, append new truth. Never mutate witnessed truth.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object. AI skills adapt to that continuity and never invent an origin-platform authority or parallel chain.

## SDK, MCP, And Skills

- SDK: `@receiz/sdk` is the universal runtime; `@receiz/sdk/react` is React-only; `@receiz/sdk/compiler` is Node-only; `@receiz/sdk/testing` is browser-safe sandbox and conformance support.
- MCP: `@receiz/mcp-server` is for agent tool access. Its current nine artifact tools and 37 living-subject tools expose transition, reconciliation, proof-brain, Twin, mandate, runtime, world, memory, social, inventory, and bearer contracts through the same SDK authority types. Diagnostics, public reads, app-state/public-store actions, previews, and delegated writes remain beneath proof truth.
- Skills: this package is operating doctrine. It tells an AI which Receiz primitive is active, which source of truth wins, which SDK or MCP rail to use, and what must never be assumed.

Agents may acquire scoped delegated access through the official Receiz Connect/OIDC Authorization Code + PKCE flow or through the MCP delegated-agent setup path exposed by `receiz_mcp_login`. That acquired access is permission to call scoped SDK/MCP rails after user consent. It is not proof authority and must never outrank artifact truth.

## How Agents Should Use This Package

Start with `receiz-build-production-system` when work spans multiple constitutional domains and `receiz-global-reconciliation` for named-domain coordination. Machine-readable manifests require the exact active canonical v120 registry and operation-matrix digests, command-only mutation, independent verification, MCP conformance, and a passing release lock. Use a focused operation skill for SDK/MCP implementation and a constitutional skill for broader system law. Stable obsolete-versioned wire schemas remain available only through the explicit historical `@receiz/sdk/obsolete-versioned` package entry; current skills never teach their key, head, receipt, reconcile, or signed-command mechanics as a current outcome.

The v120 operation skills are executable contracts. Current profile work uses the neutral authenticated same-UID profile operation. Current bearer ownership accepts a complete verified artifact, derives prior ownership from carried proof, and returns a native Record -> Seal artifact. Proof media uses the same native artifact custody and projects only a verified URL beneath it. These outcomes have no active identity-key, caller-head, claim-key, or receipt prerequisite. MCP calls the same SDK outcomes and never creates a parallel authority.

Stable obsolete-versioned schema names and their head/receipt mechanics remain explicitly historical compatibility, not the active/default profile, bearer, or proof-media contract.

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

## v120 living-subject skills

- `receiz-living-subject` governs immutable subject identity, byte-preserved namespaces, ownership continuity, state, history, additions, and portable proof artifacts.
- `receiz-subject-twin` governs subject-scoped profile, exact-head messaging, complete proof-brain retrieval, portable mind export/import, memory summaries, and the separation between speech, intentions, facts, memories, and performance.
- `receiz-autonomous-mandate` governs exact-digest owner authorization, bounded actions and regions, privacy, battle, inventory/value exposure, rate limits, provider/safety/application scope, expiry, pause, and immediate revocation.
- `receiz-world-event-runtime` governs typed command planning, exact-head validation, deterministic decision, event admission, receipts, durable ticks, idempotency, replay, and structured zero-write failure.
- `receiz-multi-subject-transaction` governs atomic meetings, relationships, battles, gifts, and trades so every participant head advances together or none do.
- `receiz-event-derived-memory` governs factual memories with admitted event citations and rebuildable AI summaries/projections.
- `receiz-live-proof-character` governs streamed reply, audio, viseme, gaze, blink, breath, emotion, gesture, proposed intention, and completion events as non-authoritative performance over exact proof context.

Every living-subject skill carries its SDK map, MCP map, authority rules, examples, tests, manifest, OpenAI metadata, and the exact v120 registry and operation-matrix digests. The skills teach the same sequence as the implementation: canonical head → entire proof history → compact indexes → relevant references → exact primary proof objects → reasoning → cited answer. They never authorize a world event, transfer, mandate, or release claim by prose.

The updated constitutional skills bind living-subject behavior into app building, command construction, deterministic replay, causal sync, global reconciliation, portable continuity, authority/security, MCP operation, testing, release, constitutional law, and offline-first operation. Their examples cover exact proof-memory speech, absent-owner exploration, mutual relationship formation, bounded trade, atomic battle, cross-device restoration, mandate revocation during a queued action, partition convergence, rejection of an AI-invented event, and cross-application subject continuity.
