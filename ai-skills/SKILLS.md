# Receiz AI Skills v118

V118 preserves sealed proof/object authority and adds
`receiz.native_capture.v1` plus
`receiz.pbi.proof-object-authorship.v1`. Native Capture binds dedicated camera
ceremony bytes. PBI authorship requires canonical predecessor verification,
appends ordered history, settles locally before optional publication, and does
not transfer ownership.

This package ships 32 skills, 26 machine-readable manifests, and 23 OpenAI agent prompts. Every current manifest binds registry digest `c284bd39a891c1a828b532523bd548507570819c32e307d79b8043f06d2d3360` and application-operation-matrix digest `153b2472830567ec3b445c2c1b4102e4c036ed4c45cc374d40d0079096a40f54` from the v118 SDK source.

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
