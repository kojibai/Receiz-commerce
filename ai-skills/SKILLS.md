# Receiz AI Skills v113

This package ships 32 skills, 26 machine-readable manifests, and 23 OpenAI agent prompts. Every current manifest binds registry digest `4c4aa85f9785d205dcf7e4e5109837a83f8c3bf8e166130ae7e87353f299c637` and application-operation-matrix digest `091ab9e6b3acb05283510a19754e53c637dbd96b47b499a524dc44c34f8e783b` from the v113 SDK source.

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
