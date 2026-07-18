# MCP Tool Map

## v108 Application Compiler

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

## v108 Current Profile And Ownership Outcomes

| Need | Tool | Mutation |
|---|---|---|
| Plan authenticated profile update | `receiz_identity_profile_update_plan` | Read-only plan; accepts `{ profile }` only |
| Execute authenticated profile update | `receiz_identity_profile_update_execute` | Exact confirmation; calls `client.profile.update(profile)` and requires the same-UID result |
| Plan bearer ownership claim | `receiz_bearer_asset_claim_plan` | Accepts `{ artifactBase64, filename, mimeType }` for the complete sealed artifact |
| Execute bearer ownership claim | `receiz_bearer_asset_claim_execute` | Exact confirmation; returns the newly claimed complete native artifact bytes and evidence |

The profile plan performs no profile read and accepts no account selector, key, caller head, or idempotency field. The authenticated session/OIDC actor is the account, and execution requires the returned UID to remain unchanged.

The bearer plan verifies the complete sealed artifact with `client.artifacts.verifyAndOpen`. Execution passes only `opened.sealedArtifact` to `client.ownership.claimBearerAsset` and returns the new native Record -> Seal artifact. Prior ownership comes from the verified carried proof. MCP never accepts a detached payload, caller owner, claim key, or caller head.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object. These MCP tools invoke that same SDK continuity and never create an origin-platform lock or parallel chain.

## v108 Complete Artifact Custody

| Need | Tool | Boundary |
|---|---|---|
| Plan native Record -> Seal | `receiz_artifact_record_seal_plan` | Read-only digest-bound plan |
| Execute native Record -> Seal | `receiz_artifact_record_seal_execute` | Exact confirmation required |
| Verify complete artifact | `receiz_artifact_verify` | Shared SDK verifier; no extraction |
| Extract verified payload | `receiz_artifact_extract_verified` | Enclosing verification must pass first |
| Check exact round trip | `receiz_artifact_round_trip_check` | Complete artifact byte identity |
| Explain artifact evidence | `receiz_artifact_explain` | Read-only evidence; never authority |

These six tools preserve artifact and payload as separate byte domains. They never relabel payload bytes, repack a native artifact, or treat MCP state as proof authority.

Stable v107 operation schemas remain available only through their explicit historical compatibility import. They are not part of this active/default tool inventory.

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

Use SDK `artifacts.verifyAndOpen(file)` when a workflow needs verified artifact custody and payload extraction. `verification.verifyArtifact(file)` is inspection evidence and does not create an ownership-capable artifact handle.
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
