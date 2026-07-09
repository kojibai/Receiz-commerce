# MCP Tool Map

Source: `packages/receiz-mcp-server/src/index.ts`.

## Diagnostics And Setup

- `receiz_doctor`: SDK doctor for app/tenant diagnostics.
- `receiz_capabilities`: inspect SDK capability readiness.
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

## Verification And Proof

- `receiz_verify_asset`
- `receiz_verify_offline_file`
- `receiz_asset_by_url`
- `receiz_asset_by_id`
- `receiz_inspect_proof_object`
- `receiz_proof_query`: delegated proof query projection.

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
