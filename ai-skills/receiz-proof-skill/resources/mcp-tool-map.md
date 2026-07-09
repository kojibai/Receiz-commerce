# Receiz MCP Tool Map For Proof Work

Source: `packages/receiz-mcp-server/src/index.ts`.

## Authority Boundary

MCP is not authority. It calls canonical Receiz SDK/API rails and reports the source primitive. Its responses remain beneath sealed artifact truth, deterministic proof object state, verified local truth, verified register append, and authenticated SDK/API projection.

## Verification And Inspection

| Need | Tool | Boundary |
| --- | --- | --- |
| Public proof by URL, ID, or creator | `receiz_verify_asset` | Resolves through SDK public proof rails. |
| Local JSON manifest verification | `receiz_verify_offline_file` | Uses SDK manifest validators before network calls. |
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
