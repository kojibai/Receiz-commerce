# Receiz AI Skills v120

V120 preserves sealed proof/object authority and adds
`receiz.native_capture.v1` plus
`receiz.pbi.proof-object-authorship.v1`. Native Capture binds dedicated camera
ceremony bytes. PBI authorship requires canonical predecessor verification,
appends ordered history, settles locally before optional publication, and does
not transfer ownership.

This package ships 39 skills, 33 machine-readable manifests, and 30 OpenAI agent prompts. Every current manifest binds registry digest `29a793a5bcc0195ab41d30614d37ac51df66023af354fa4335460764eb0af413` and application-operation-matrix digest `208553829ba78a5536524b864577ce59989e2d0a994fad9598d39ae3d557c4f5` from the v120 SDK source.

## Current MCP artifact inventory: nine tools

The single current inventory is:

1. `receiz_artifact_verify`
2. `receiz_artifact_admit`
3. `receiz_artifact_append_plan`
4. `receiz_artifact_transition_seal_and_stage`
5. `receiz_artifact_transition_commit`
6. `receiz_artifact_global_resolve`
7. `receiz_artifact_reconcile_plan`
8. `receiz_artifact_reconcile_stage`
9. `receiz_artifact_reconcile_commit`

The first five tools are also the historical v112 compatibility inventory. That historical label preserves the v112 contract; it does not define a second current surface.

## Current MCP living-subject inventory: 37 tools

The exact v121 living-subject inventory covers `receiz_subject_resolve`, `receiz_subject_state`, `receiz_subject_history`, `receiz_subject_memory_query`, `receiz_subject_relationships`, `receiz_subject_inventory`, `receiz_subject_twin_profile`, `receiz_subject_twin_message`, `receiz_subject_twin_mind_export`, `receiz_subject_twin_mind_import_plan`, `receiz_subject_mandate_get`, `receiz_subject_mandate_plan`, `receiz_subject_mandate_activate`, `receiz_subject_mandate_pause`, `receiz_subject_mandate_revoke`, `receiz_world_additions`, `receiz_world_command_plan`, `receiz_world_command_validate`, `receiz_world_command_execute`, `receiz_world_transaction_plan`, `receiz_world_transaction_execute`, `receiz_world_receipt`, `receiz_world_replay`, `receiz_subject_runtime_enqueue`, `receiz_subject_runtime_status`, `receiz_subject_runtime_cancel`, `receiz_living_subject_conformance`, `receiz_subject_brain_head`, `receiz_subject_brain_search`, `receiz_subject_brain_resolve`, `receiz_subject_brain_stream`, `receiz_bearer_transfer_preview`, `receiz_bearer_instrument_issue`, `receiz_bearer_instrument_inspect`, `receiz_bearer_instrument_claim`, `receiz_bearer_transfer_cancel`, and `receiz_bearer_transfer_status`.

Every tool calls the SDK primitive named by its skill map, returns the source primitive and v120 registry/reducer digests, requires exact plan/permit/instrument confirmation for writes, resolves exact bytes before commit, and returns structured zero-write failure. MCP and skill prose never become authority.

## Skill inventory

The canonical machine-readable index is [skills.json](skills.json). Start with `receiz-build-production-system` for multi-domain work, `receiz-global-reconciliation` for named-domain head resolution and offline reconciliation, or a focused primitive skill for narrower work.

## Forbidden AI operations

All current skills forbid: `last-write-wins`, `timestamp-as-head-authority`, `connect-token-as-proof-authority`, `local-receipt-as-global-authority`, `projection-as-current-owner`, `silent-divergence-resolution`, `remote-reconciliation-before-first-paint`, `unverified-server-artifact-render`, `environment-player-token-fallback`, `accepted-means-effects-delivered`, and `indeterminate-means-failed`.

These instructions remain beneath exact sealed artifact bytes, independently verified history, verified identity evidence, plan-bound capability authority, and atomic named-domain acceptance.

## v121 living-subject skills

- `receiz-living-subject`: immutable identity, byte-preserved namespaces, ownership continuity, state, history, additions, and portable artifacts.
- `receiz-subject-twin`: complete exact-head proof retrieval, speech/intention/fact/memory separation, subject mind portability, and provenance.
- `receiz-autonomous-mandate`: owner-confirmed digest scope, runtime re-verification, expiration, pause, and revocation.
- `receiz-world-event-runtime`: typed command admission, deterministic receipts, durable ticks, retries, replay, and zero-write failure.
- `receiz-multi-subject-transaction`: atomic meetings, relationships, battles, gifts, inventory, and trades.
- `receiz-event-derived-memory`: admitted-event citations and rebuildable projections.
- `receiz-live-proof-character`: streamed voice and performance cues that never become canonical fact.
