---
name: receiz-mcp-agent-skill
description: Use when an agent has or needs Receiz MCP tool access for verification routing, public reads, app-state actions, proof inspection, storefront operations, sports proof inspection, deterministic previews, or delegated writes.
---

# receiz-mcp-agent-skill

Receiz MCP is an agent-callable tool layer beneath Receiz proof truth. It can call SDK/API rails, but it is not a proof authority.

## KKSv1.0 temporal authority

Read [the shared KKSv1.0 temporal-authority contract](../resources/kks-v1-temporal-authority.md). Use `receiz_v124_kai_now` for a new locally computed KKSv1.0 coordinate and `receiz_sealed_kai_moment` only for a pulse carried by a verified sealed proof object. Never send or infer `createdAt` as Kai authority; MCP is a projection rail beneath the proof object.

## When To Use This Skill

- Use before calling any `receiz_*` MCP tool.
- Use for tool selection, input validation, output interpretation, action confirmation, auth boundaries, and failure reporting.
- Use when a user asks an agent to verify, inspect, publish, append, build, preview, or resolve Receiz state through tools.

## When Not To Use This Skill

- Do not use when no MCP host exists and the task can be completed from repo files only.
- Do not use for pure SDK app generation unless MCP tools are part of the workflow.
- Do not use to bypass confirmation for write, transfer, settlement, publishing, or append actions.

## Core Receiz Laws

- MCP is not authority; it calls canonical Receiz SDK/API rails and reports source primitives.
- If SDK artifact verification is unavailable, the agent must not pretend verification happened.
- Read-only MCP resolution and inspection may be allowed without confirmation when they do not expose private data; they are not verification.
- Writes require explicit user confirmation.
- Never treat a database, server, marketplace, UI, model response, or cache as final authority.
- Never invent tools, inputs, outputs, ownership, witness IDs, rarity, transfer history, or verification status.

## Required Behavior

1. Choose a tool from [resources/mcp-tool-map.md](resources/mcp-tool-map.md). For current economy operations use the exact [V125 economy tool map](resources/v125-economy-tool-map.md); for retained production-runtime operations use the exact [V124 runtime tool map](resources/v124-runtime-tool-map.md).
2. Validate required inputs before calling.
3. Classify the action as read-only, preview-only, delegated write, settlement-risk, ownership-risk, or public-proof-risk.
4. Ask for confirmation before write or settlement-affecting actions.
5. Interpret output with the authority boundary included in the tool response.
6. Report failures honestly using [resources/response-templates.md](resources/response-templates.md).

## Forbidden Behavior

- Do not call a nonexistent tool.
- Do not infer success from a failed or missing tool call.
- Do not pass empty IDs, guessed hosts, guessed witness IDs, guessed owners, guessed amounts, or guessed rarity.
- Do not run write tools without delegated runtime authority and explicit user confirmation.
- Do not let an MCP result outrank sealed artifact truth, deterministic proof object state, verified local truth, or verified append.

## MCP Usage Rules

Read [resources/safe-tool-calling.md](resources/safe-tool-calling.md) before executing tools. Read [resources/auth-boundaries.md](resources/auth-boundaries.md) before delegated actions. Read [resources/action-confirmation-rules.md](resources/action-confirmation-rules.md) before any publish, append, transfer, checkout, settlement, retained V124 execution, or authority-session action. Use the [V125 economy tool map](resources/v125-economy-tool-map.md) and [V124 runtime tool map](resources/v124-runtime-tool-map.md) for exact SDK mappings, scopes, references, process-local handles, and trusted-host custody.

## SDK Usage Rules

MCP tools wrap SDK rails such as `doctor`, `capabilities`, `appState`, `publicStore`, `publicProof`, `identity`, `wallet`, `sports`, `world`, `proof`, and `sandbox`. Do not describe MCP as a separate SDK. If code is being generated, use SDK imports in the app and MCP only for agent-side resolution, inspection, or operations. Use SDK `verification.verifyArtifact(file)` for the indivisible integrity-and-continuity verdict.

## Output Format

```md
Tool:
Action class:
Inputs used:
Source primitive:
Result:
Authority boundary:
What is proven:
What is not proven:
Confirmation status:
Next safe action:
```

## Safety And Security Boundaries

Agents may acquire scoped delegated access through Receiz Connect/OIDC Authorization Code + PKCE or the MCP delegated-agent setup path when the user consents and provides the required client/authorization inputs. Never print bearer tokens, passphrases, private keys, private identity artifact payloads, or private recovery contents. Use delegated access as permission for scoped SDK/MCP calls, never as proof authority. Stop before destructive or value-affecting actions unless the user explicitly confirms the action and exact inputs.

## Examples

- [Agent verify object](examples/agent-verify-object.md)
- [Agent build app](examples/agent-build-app.md)
- [Agent append proof](examples/agent-append-proof.md)
- [Agent inspect vault](examples/agent-inspect-vault.md)

Resources:

- [MCP tool map](resources/mcp-tool-map.md)
- [V124 runtime tool map](resources/v124-runtime-tool-map.md)
- [Machine-readable V124 runtime map](resources/v124-runtime-tool-map.json)
- [V125 economy tool map](resources/v125-economy-tool-map.md)
- [Machine-readable V125 economy map](resources/v125-economy-tool-map.json)
- [Agent operating rules](resources/agent-operating-rules.md)
- [Safe tool calling](resources/safe-tool-calling.md)
- [Auth boundaries](resources/auth-boundaries.md)
- [Action confirmation rules](resources/action-confirmation-rules.md)
- [Response templates](resources/response-templates.md)

## v120 artifact recovery tools

Use exactly `receiz_artifact_verify`, `receiz_artifact_admit`, `receiz_artifact_append_plan`, `receiz_artifact_transition_seal_and_stage`, and `receiz_artifact_transition_commit`. Never put an admission, history, actor, plan, verified capability, candidate, or store in MCP JSON; same-runtime custody is mandatory and exact bytes crossing a process require `reverify-exact-bytes`.

## v121 living-subject contract

Use canonical head → entire proof history → bounded index retrieval → exact primary-object resolution → reasoning → provenance. The 96-object window is working context, never history truncation. AI speech and performance remain non-authoritative. Consequential actions require typed deterministic command admission; meetings, relationships, trades, gifts, and battles require atomic multi-subject transactions. Autonomous execution requires a current digest-bound mandate at lease time. Bearer transfer preserves identity, full history, memory policy, inventory disposition, and unknown namespace bytes while immediately revoking former-owner authority.

Concrete v120 evidence must include: a creature speaking from exact long-form proof memory; absent-owner exploration inside a mandate; a mutual relationship; a bounded autonomous trade; an atomic battle; exact device restoration; queued-action revocation; partition convergence without history replacement; rejection of an AI-invented event; and cross-application subject continuity.

## v124 production-runtime contract

Use only the 26 exact retained adapters in the [V124 runtime tool map](resources/v124-runtime-tool-map.md). `handleRef` is a non-authoritative process-local reference. `sessionRef` may resolve a local session or a trusted-host `persistedSessionRef`, but the canonical SDK/server path must re-verify it before use. Execute and cancel require the process-local handle plus the re-verified session. Refresh rotates session custody; close consumes it. Replay export returns an unsealed non-authoritative candidate with `exactBytesB64u`; canonically Record -> Seal those exact bytes before admitting `sealedReplayProofObjectRef` for restore. Exact private additions remain in trusted-host custody under `privateAdditionsRef` and never enter model output. `applicationId` and `audience` are runtime-pinned and never tool inputs. Never reconstruct authority from MCP JSON.

## v125 economy contract

The [V125 economy and trust tool map](resources/v125-economy-tool-map.md) contains the thirteen retained economy tools and 39 canonical trust tools. Use the thirteen economy tools for lawful action and Settlement/Reserve; use the named trust operations for their source-bound families. Lawful-action proof bytes resolve only through the proof host after confirmation. Edge plans and portable transition/recovery materials resolve through the existing material host. Verified transition sets, prepared commit sets, and SDK-issued committed transitions remain same-runtime-custodied. Settlement and Reserve send/receive independently reverify the exact recovery at the respective user edge; server and database state only synchronize the resulting proof globally.

<!-- receiz-v124.1-capability-map:start -->
## V124.1 callable capability bindings

- **source-carried-replay.** Open, compare, merge, and project every verified replay branch from exact sealed sources without a database or last-write-wins collapse. SDK: `openReceizSourceCarriedReplayFamilyV124`, `diffReceizSourceCarriedReplayFamiliesV124`, `mergeReceizSourceCarriedReplayFamiliesV124`, `projectReceizSourceCarriedReplayBranchesV124`. MCP: `receiz_source_carried_replay_open`. Boundary: Each sealed replay source is verified independently. Family and branch projections coordinate exact admitted sources but never replace the enclosing proof objects.
- **receiz-id-conversation.** Compose direct or unlimited invited-member conversations from complete causal history, bounded retrieval windows, encrypted epoch grants, and exact Receiz-ID participant bindings. SDK: `parseReceizConversationParticipantBindingV1`, `createReceizConversationEventV1`, `parseReceizConversationEventV1`, `reduceReceizConversationEventsV1`, `openReceizConversationSourceFamilyV1`, `createReceizConversationEpochSecretV1`, `planReceizConversationEpochGrantBatchesV1`, `openReceizConversationEpochGrantV1`, `encryptReceizConversationMessageV1`, `decryptReceizConversationMessageV1`. MCP: `receiz_conversation_source_family_open`, `receiz_conversation_epoch_grants_plan`. Boundary: Receiz identity bindings and sealed conversation events remain authority. MCP returns safe coordinates and encrypted grant envelopes only; clear messages and epoch secrets stay in trusted-host custody.
- **held-material-reconstruction.** Build, publish, hold, reopen, and reconstruct inline RMA2 or segmented RMC1/RMC2 with raw RMA3 projection while verifying the enclosing artifact before native media use. SDK: `buildReceizMaterialCompositeTransport`, `publishReceizMaterialCompositeTransport`, `resolveReceizMaterialCompositeTransport`, `createReceizMaterialSourceFamily`, `createReceizClosedMaterialPresentationUrl`, `openReceizMaterialSourceParts`, `createReceizRawMaterialCapsuleBlobFromSourceParts`, `decodeReceizRawMaterialCapsuleBytes`, `resolveReceizMaterialCompositeFromSources`, `openVerifiedReceizMaterialUrl`. MCP: `receiz_material_source_parts_open`, `receiz_material_url_open`. Boundary: Transport segments, locators, manifests, object URLs, and storage are projections only. Native bytes are admitted only beneath verification of the enclosing sealed artifact.
- **progressive-range-playback.** Start verified first-frame playback from signed range commitments while remaining ranges settle behind the already playing media. SDK: `buildReceizMaterialProgressiveLedger`, `createReceizMaterialProgressiveCommitment`, `coerceReceizMaterialProgressiveLedger`, `coerceReceizMaterialProgressiveCommitment`, `openReceizMaterialSourceRangeReader`. MCP: `receiz_material_source_parts_open`. Boundary: Only a progressive ledger whose complete root is carried by the enclosing Signature-V4 proof can authorize range projection. Unsigned offsets, container metadata, or transport segments cannot.
- **subject-memory-and-twin.** Resolve complete proof history through bounded cognition windows, cite exact proof objects, and generate local or connected Twin speech without promoting model output into fact or command authority. SDK: `subjects.brain.head`, `subjects.brain.search`, `subjects.brain.resolve`, `subjects.brain.stream`, `subjects.memory.query`, `subjects.memory.project`, `subjects.memory.citations`, `subjects.memory.compact`, `subjects.twin.profile`, `subjects.twin.message`, `subjects.twin.stream`, `subjects.twin.exportMind`, `subjects.twin.importMind`, `subjects.twin.memorySummary`, `subjects.twin.streamPerformance`. MCP: `receiz_subject_memory_query`, `receiz_subject_brain_head`, `receiz_subject_brain_search`, `receiz_subject_brain_resolve`, `receiz_subject_brain_stream`, `receiz_subject_twin_profile`, `receiz_subject_twin_message`, `receiz_subject_twin_mind_export`, `receiz_subject_twin_mind_import_plan`. Boundary: Proof-derived memory cites admitted events and exact primary proof objects. Twin speech, summaries, intent, and performance remain non-authoritative proposals until deterministic command admission accepts a consequential action.
<!-- receiz-v124.1-capability-map:end -->

## v126 complete SDK reference

Read [all public SDK function signatures](../resources/sdk-public-functions.json) and [the entry-point index](../resources/sdk-public-functions.md), including compiler, testing, and React exports. Client capabilities and executable MCP adapters remain separately identified; inventory membership never substitutes for an implemented adapter or SDK proof admission.
