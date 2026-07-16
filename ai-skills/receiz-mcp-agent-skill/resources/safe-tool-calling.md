# Safe Tool Calling

## Read-Only Tools

Usually safe after input validation:

- `receiz_doctor`
- `receiz_capabilities`
- `receiz_required_scopes`
- `receiz_app_state_resolve`
- `receiz_app_state_by_url`
- `receiz_app_state_by_creator`
- `receiz_app_state_by_namespace`
- `receiz_app_state_by_id`
- `receiz_public_store_resolve`
- `receiz_inspect_offline_file`
- `receiz_asset_by_url`
- `receiz_asset_by_id`
- `receiz_inspect_proof_object`
- `receiz_wallet_public_ledger`
- `receiz_action_ledger`
- `receiz_sports_conformance`
- `receiz_world_public_snapshot`

## Preview-Only Tools

These do not mutate proof, ownership, or settlement state:

- `receiz_transfer_preview`
- `receiz_transfer_requires_confirmation`
- `receiz_pack_open_preview`
- `receiz_marketplace_template_generate`
- `receiz_runtime_blueprint`
- `receiz_sandbox_seed_store`
- `receiz_sandbox_checkout`

## Write Or Delegated Tools

Require explicit user confirmation and delegated runtime authority:

- `receiz_app_state_publish`
- `receiz_public_store_publish`
- `receiz_proof_query` when using delegated private proof rails

If a host adds more write tools later, classify by effect, not by name.
