# MCP Tool Map

## V113 Application Compiler

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

## V113 Current Profile And Ownership Outcomes

| Need | Tool | Mutation |
|---|---|---|
| Plan authenticated profile update | `receiz_identity_profile_update_plan` | Read-only plan; accepts `{ profile }` only |
| Execute authenticated profile update | `receiz_identity_profile_update_execute` | Exact confirmation; calls `client.profile.update(profile)` and requires the same-UID result |
| Plan bearer ownership claim | `receiz_bearer_asset_claim_plan` | Accepts `{ artifactBase64, filename, mimeType }` for the complete sealed artifact |
| Execute bearer ownership claim | `receiz_bearer_asset_claim_execute` | Exact confirmation; returns the newly claimed complete native artifact bytes and evidence |

The profile plan performs no profile read and accepts no account selector, key, caller head, or idempotency field. The authenticated session/OIDC actor is the account, and execution requires the returned UID to remain unchanged.

The bearer plan verifies the complete sealed artifact with `client.artifacts.verifyAndOpen`. Execution passes only `opened.sealedArtifact` to `client.ownership.claimBearerAsset` and returns the new native Record -> Seal artifact. Prior ownership comes from the verified carried proof. MCP never accepts a detached payload, caller owner, claim key, or caller head.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object. These MCP tools invoke that same SDK continuity and never create an origin-platform lock or parallel chain.

## V113 Current Artifact Coordination

| Need | Tool | Boundary |
|---|---|---|
| Verify exact artifact bytes | `receiz_artifact_verify` | Shared SDK verifier; no mutation |
| Admit verified artifact to a profile | `receiz_artifact_admit` | Profile membership only; no operation authority |
| Plan a governed append | `receiz_artifact_append_plan` | Zero writes; binds actor, history, effects, idempotency, registry, and domain |
| Seal and durably stage candidate bytes | `receiz_artifact_transition_seal_and_stage` | Candidate proof object; no accepted-head write |
| Resolve, reverify, and atomically accept | `receiz_artifact_transition_commit` | Named-domain atomic acceptance and report-only receipt |
| Resolve authenticated global head | `receiz_artifact_global_resolve` | Read-only locator; returned exact bytes require independent verification |
| Plan offline reconciliation | `receiz_artifact_reconcile_plan` | Read-only plan and capability payload; zero writes |
| Stage reconciliation candidate | `receiz_artifact_reconcile_stage` | Neutral immutable bytes only; zero accepted-head writes |
| Commit reconciliation | `receiz_artifact_reconcile_commit` | Distinct confirmation and atomic expected-head acceptance |

These nine current tools preserve artifact and payload as separate byte domains. They never relabel payload bytes, repack a native artifact, or treat MCP state as proof authority. The first five are the historical v112 compatibility inventory; that historical inventory is not a second current surface.

Obsolete versioned operation schemas are not shipped as installable compatibility surfaces. Historical sealed artifacts and release evidence remain verifiable without carrying obsolete developer APIs forward.

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

## V113 artifact coordination authority

- `receiz_artifact_verify` — exact-byte verification; bytes crossing a process require `reverify-exact-bytes`.
- `receiz_artifact_admit` — profile admission from the same-runtime verified artifact; zero writes.
- `receiz_artifact_append_plan` — plans the transition, registry-derived effects, idempotency identity, expected head, and named commit domain; zero writes.
- `receiz_artifact_transition_seal_and_stage` — seals a proof-object candidate and durably stages it with zero head writes; the staging locator is non-authoritative.
- `receiz_artifact_transition_commit` — independently resolves and reverifies staged bytes, then atomically accepts them within the named domain and returns a report-only receipt.
- `receiz_artifact_global_resolve` — resolves one authenticated named-domain head; returned bytes are not artifact truth until independently verified.
- `receiz_artifact_reconcile_plan` — plans the verified additions, expected head, effects ceiling, and plan-bound capability payload with zero writes.
- `receiz_artifact_reconcile_stage` — stages confirmed exact bytes without changing the accepted head.
- `receiz_artifact_reconcile_commit` — independently resolves the exact staged version and atomically accepts only the expected head after distinct confirmation.

These are exactly the nine tools in the single current MCP artifact inventory. The first five remain explicitly documented as the historical v112 compatibility inventory only. MCP property bags, confirmations, receipts, and reported actors never become proof, identity, capability, or commit authority.
