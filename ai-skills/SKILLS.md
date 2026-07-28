# Receiz AI Skills v114

This package ships 32 skills, 26 machine-readable manifests, and 23 OpenAI agent prompts. Every current manifest binds registry digest `ae912154d97b695464c3a19361bceb9440bc5d703a1d9129edac92c64192e29a` and application-operation-matrix digest `fd4ea8fccd867a0b9aab772ea6c5827ea8bdfe4c7fbed017c5a4843a40109c4f` from the v114 SDK source.

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

## Skill inventory

The canonical machine-readable index is [skills.json](skills.json). Start with `receiz-build-production-system` for multi-domain work, `receiz-global-reconciliation` for named-domain head resolution and offline reconciliation, or a focused primitive skill for narrower work.

## Forbidden AI operations

All current skills forbid: `last-write-wins`, `timestamp-as-head-authority`, `connect-token-as-proof-authority`, `local-receipt-as-global-authority`, `projection-as-current-owner`, `silent-divergence-resolution`, `remote-reconciliation-before-first-paint`, `unverified-server-artifact-render`, `environment-player-token-fallback`, `accepted-means-effects-delivered`, and `indeterminate-means-failed`.

These instructions remain beneath exact sealed artifact bytes, independently verified history, verified identity evidence, plan-bound capability authority, and atomic named-domain acceptance.
