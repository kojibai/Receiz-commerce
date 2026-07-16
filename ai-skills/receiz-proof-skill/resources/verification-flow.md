# Verification Flow

## Local Artifact Or Manifest

1. Preserve the original bytes or JSON payload.
2. Identify the claimed schema or primitive.
3. For artifact bytes, use `receiz.verification.verifyArtifact(file)` when available.
4. For JSON manifests, use the SDK validators:
   - `assertReceizAssetManifest`
   - `assertReceizSportsCardManifest`
   - `assertReceizWebhookEvent`
5. Project with SDK projectors only after validation.
6. Admit valid proof objects into `ReceizProofMemory`.
7. Use `knownHead()` or `receizProofMemoryAdditionsQuery()` for append-only sync.

## MCP Verification

Use MCP when the agent host exposes Receiz MCP tools:

- `receiz_inspect_offline_file`: inspect a local manifest or proof payload shape; always returns `verified: false`.
- `receiz_asset_by_url` / `receiz_asset_by_id`: resolve public proof records; resolution is not artifact verification.
- SDK `verification.verifyArtifact(file)`: verify enclosing integrity plus ownership continuity.
- `receiz_asset_by_url` and `receiz_asset_by_id`: read public proof surfaces.
- `receiz_inspect_proof_object`: inspect provided payload structure without claiming final verification.
- `receiz_card_history`: resolve Sports card memory from local-first SDK rails.
- `receiz_pitch_proof_by_witness_id`: resolve a pitch witness from already-admitted local day-proof truth.

## Report Boundary

Every report must state:

- what was verified
- what was only inspected
- what source of truth was used
- what remains unknown
- what tool or artifact is required to resolve the unknown

If a tool fails, do not claim verification happened.
