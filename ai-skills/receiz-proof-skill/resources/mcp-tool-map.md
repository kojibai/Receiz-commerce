# Receiz MCP Tool Map For Proof Work

Source: `packages/receiz-mcp-server/src/index.ts`.

## Authority Boundary

MCP is not authority. It calls canonical Receiz SDK/API rails and reports the source primitive. Its responses remain beneath sealed artifact truth, deterministic proof object state, verified local truth, verified register append, and authenticated SDK/API projection.

## V113 Current Artifact Tools

The single current nine-tool inventory is exactly `receiz_artifact_verify`, `receiz_artifact_admit`, `receiz_artifact_append_plan`, `receiz_artifact_transition_seal_and_stage`, `receiz_artifact_transition_commit`, `receiz_artifact_global_resolve`, `receiz_artifact_reconcile_plan`, `receiz_artifact_reconcile_stage`, and `receiz_artifact_reconcile_commit`. Verification, admission, resolution, and planning write nothing. Staging durably preserves sealed candidate bytes but advances no head. Commit independently resolves and reverifies staged bytes before atomic named-domain acceptance and returns a report-only receipt.

The first five names are the historical v112 compatibility inventory. They remain addressable history, not a second current inventory.

## Verification And Inspection

| Need | Tool | Boundary |
| --- | --- | --- |
| Public proof by URL or ID | `receiz_asset_by_url`, `receiz_asset_by_id` | Resolves through SDK public proof rails; does not claim verification. |
| Local JSON manifest inspection | `receiz_inspect_offline_file` | Uses SDK shape validators and always reports `verified: false`. |
| Public asset by URL | `receiz_asset_by_url` | Public proof surface read. |
| Public asset by ID | `receiz_asset_by_id` | Public proof surface read. |
| Payload inspection | `receiz_inspect_proof_object` | Structural inspection, not final verifier authority. |
| Proof query | `receiz_proof_query` | Delegated proof query projection; requires delegated write/read authority in runtime. |

## Sports Proof

| Need | Tool | Boundary |
| --- | --- | --- |
| Sports card history | `receiz_card_history` | Local-first SDK card memory rail. |
| Pitch witness | `receiz_pitch_proof_by_witness_id` | Requires already-admitted local pitch day proof truth. |
| Sports conformance | `receiz_sports_conformance` | Reads conformance status. |
| Pack preview | `receiz_pack_open_preview` | Preview only; does not append card truth. |

## Settlement And Ownership

| Need | Tool | Boundary |
| --- | --- | --- |
| Transfer preview | `receiz_transfer_preview` | Deterministic preview; no settlement mutation. |
| Transfer confirmation policy | `receiz_transfer_requires_confirmation` | Confirmation requirement only. |
| Wallet ledger | `receiz_wallet_public_ledger` | Settlement projection over ledger truth. |
| Action ledger | `receiz_action_ledger` | Provenance projection. |

## App And Store Proof Surfaces

| Need | Tool |
| --- | --- |
| App-state resolve | `receiz_app_state_resolve`, `receiz_app_state_by_url`, `receiz_app_state_by_creator`, `receiz_app_state_by_namespace`, `receiz_app_state_by_id` |
| Public store resolve | `receiz_public_store_resolve` |
| Template envelope | `receiz_marketplace_template_generate` |
| Runtime blueprint | `receiz_runtime_blueprint` |

## Writes

`receiz_app_state_publish`, `receiz_public_store_publish`, and `receiz_proof_query` can require delegated runtime authority. Ask for explicit confirmation before any action that appends, publishes, changes settlement, changes ownership, or affects public state.
