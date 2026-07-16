# MCP Tool Map

## v105 Application Compiler And Semantic Operations

| Need | Tool | Mutation |
|---|---|---|
| Inspect repository | `receiz_project_inspect` | Read-only |
| Propose contract | `receiz_app_contract_create` | Read-only |
| Compile plan | `receiz_app_plan` | Read-only |
| Preview/apply | `receiz_app_apply` | Exact digest confirmation required |
| Check conformance | `receiz_app_check` | Read-only |
| Plan upgrade | `receiz_app_upgrade` | Read-only |
| Explain finding | `receiz_app_explain` | Read-only |
| Repair application | `receiz_app_repair` | Exact digest confirmation required |
| Trace proof | `receiz_proof_trace` | Read-only; canonical bytes required for verified verdict |
| Replay webhook | `receiz_webhook_replay` | Signature verification and exact confirmation required |
| Explain scope | `receiz_scope_explain` | Read-only |
| Qualify release | `receiz_release_qualify` | Read-only |

Repository inspection is not verification. These tools never supply an artifact
verification verdict or proof authority.

Source: `packages/receiz-mcp-server/src/index.ts`.

## Diagnostics And Setup

- `receiz_doctor`: SDK doctor for app/tenant diagnostics.
- `receiz_capabilities`: use `capabilities.describe` for deterministic support and probe mode for readiness.
- `receiz_required_scopes`: return stable scope constants by rail.
- `receiz_runtime_blueprint`: return app runtime blueprint.
- `receiz_authorize_url`: build Connect/OIDC authorize URL.
- `receiz_mcp_login`: return delegated agent-token setup path.
- `receiz_ensure_tenant_session`: build tenant customer-session entry path.

## App-State And Store

- `receiz_app_state_publish`: publish durable public app-state projection. Delegated write.
- `receiz_app_state_resolve`: resolve by URL, host, namespace, ID, or creator.
- `receiz_app_state_by_url`
- `receiz_app_state_by_creator`
- `receiz_app_state_by_namespace`
- `receiz_app_state_by_id`
- `receiz_public_store_publish`: publish typed public-store projection. Delegated write.
- `receiz_public_store_resolve`: resolve public-store projection.

## Resolution, Inspection, And Proof

- `receiz_inspect_offline_file`: shape inspection only; never a verified artifact verdict.
- `receiz_asset_by_url`
- `receiz_asset_by_id`
- `receiz_inspect_proof_object`
- `receiz_proof_query`: delegated proof query projection.

Use SDK `verification.verifyArtifact(file)` for verification; it requires enclosing integrity and ownership continuity.
Emulator output is labeled `sandboxVerified`; never translate it into Receiz verification.

## Sports, Wallet, World

- `receiz_pitch_proof_by_witness_id`
- `receiz_card_history`
- `receiz_sports_conformance`
- `receiz_wallet_public_ledger`
- `receiz_action_ledger`
- `receiz_world_public_snapshot`

## Preview And Sandbox

- `receiz_transfer_preview`: preview only.
- `receiz_transfer_requires_confirmation`: confirmation policy.
- `receiz_pack_open_preview`: preview only.
- `receiz_marketplace_template_generate`: template envelope only.
- `receiz_sandbox_seed_store`: deterministic sandbox store.
- `receiz_sandbox_checkout`: deterministic sandbox checkout.

## Resource Templates

- `receiz://asset/{id}`
- `receiz://proof/{id}`
- `receiz://pitch/{witnessId}`
- `receiz://store/{tenantHost}`
- `receiz://sdk/docs`
- `receiz://schemas/proof-object-v1`
