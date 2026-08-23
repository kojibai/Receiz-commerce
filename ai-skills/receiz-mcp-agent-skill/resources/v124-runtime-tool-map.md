# V124 Runtime MCP Tool Map

This is the exact universal V124 MCP adapter surface. It is not application-specific. Each tool calls the named SDK primitive and must not reimplement SDK verification, authority, clock, replay, or execution law. The machine-readable companion is [v124-runtime-tool-map.json](v124-runtime-tool-map.json).

## Authority hierarchy

- The sealed Receiz proof object remains proof authority.
- The Receiz identity artifact remains identity authority.
- A grant, challenge, bearer, authority session, handle, MCP reference, server response, or database row is not proof or identity authority.
- The database supports durable coordination, synchronization, and recovery beneath proof-object continuity.
- UTC supplies elapsed duration to the genesis-derived Kai bridge; UTC is not Kai authority.

## Exact tools, SDK methods, and scopes

`Fixed scopes` means every listed scope is required by that route. `Conditional scopes` means the exact challenge/session scope set or the one scope selected by the sealed source kind; it never means all scopes may be inferred.

`applicationId` and `audience` are pinned by the authenticated MCP runtime. They are never model-supplied tool inputs.

| MCP tool | Canonical SDK method | Fixed and conditional scopes | Input refs | Output refs |
|---|---|---|---|---|
| `receiz_v124_kai_now` | `receizKaiNow` | none | none | none |
| `receiz_v124_proof_authority_challenge_create` | `createReceizProofAuthorityChallenge` | exact requested scopes within the registered application grant | none | none |
| `receiz_v124_execution_plan_atomic_operation` | `client.execution.planAtomicOperationV124` | none | none | `planRef` |
| `receiz_v124_execution_stage` | `client.execution.stage` | fixed `receiz:domains.write` | `planRef` | `handleRef` |
| `receiz_v124_execution_stage_prepared` | `client.execution.stagePrepared` | fixed `receiz:domains.write` | `planRef`, `transitionSetRef` | `handleRef` |
| `receiz_v124_execution_execute` | `client.execution.execute` | fixed `receiz:domains.write`; exact stored grant; Settlement/Reserve rail grant when that category is executed | `handleRef`, `sessionRef` | `planRef` only for an unknown outcome retained for recovery |
| `receiz_v124_execution_resolve` | `client.execution.resolve` | fixed `receiz:domains.read` | none | `planRef` only for an unknown outcome retained for recovery |
| `receiz_v124_execution_resolve_by_idempotency` | `client.execution.resolveByIdempotencyKey` | fixed `receiz:domains.read` | none | `planRef` only for an unknown outcome retained for recovery |
| `receiz_v124_execution_cancel` | `client.execution.cancel` | fixed `receiz:domains.write`; exact stored grant; Settlement/Reserve rail grant when that category is cancelled | `handleRef`, `sessionRef` | `planRef` only for an unknown outcome retained for recovery |
| `receiz_v124_runtime_authority_session_open` | `client.runtime.openAuthoritySessionV124` | exact signed-challenge scopes plus `receiz:<requested-rail>.write` for every requested rail | `identityArtifactRef`, `subjectSourceArtifactRef`, `signedChallengeRef` | `sessionRef`; optional `persistedSessionRef` |
| `receiz_v124_runtime_authority_session_refresh` | `client.runtime.refreshAuthoritySessionV124` | exact signed-challenge and stored-session scopes plus `receiz:<requested-rail>.write` | `sessionRef`, `identityArtifactRef`, `signedChallengeRef` | rotated `sessionRef`; optional `persistedSessionRef` |
| `receiz_v124_runtime_authority_session_close` | `client.runtime.closeAuthoritySessionV124` | exact stored session grant | `sessionRef` | none |
| `receiz_v124_runtime_qualify` | `client.runtime.qualifyV124` | application-bound bearer | none | none |
| `receiz_v124_domain_verified_additions` | `client.domains.verifiedAdditionsV124` | fixed `receiz:domains.read` | none | none |
| `receiz_v124_domain_verified_replay` | `client.domains.verifiedReplayV124` | fixed `receiz:domains.read` | none | none |
| `receiz_v124_domain_verified_checkpoint` | `client.domains.verifiedCheckpointV124` | fixed `receiz:domains.read` | none | none |
| `receiz_v124_domain_verified_private_additions` | `client.domains.verifiedPrivateAdditionsV124` | fixed `receiz:world.private` plus exact stored grant | `sessionRef` | trusted-host `privateAdditionsRef` only |
| `receiz_v124_domain_replay_proof_object_export` | `client.domains.exportVerifiedReplayProofObjectV124` | none | none | none; returns an unsealed candidate with `exactBytesB64u` |
| `receiz_v124_domain_replay_proof_object_restore` | `client.domains.restoreVerifiedReplayProofObjectV124` | none | `sealedReplayProofObjectRef` | none |
| `receiz_v124_subject_namespaces_resolve` | `client.subjects.resolveNamespacesV124` | fixed `receiz:subjects.read` | none | none |
| `receiz_v124_identity_public_recipient_resolve` | `client.identity.resolvePublicRecipientV124` | fixed `receiz:subjects.read` plus exact stored grant | `sessionRef` | none |
| `receiz_v124_source_publish_sealed` | `client.sources.publishSealedSourceV124` | subject: `receiz:subjects.write`, no session; replay/checkpoint: `receiz:domains.write` plus exact stored grant | `sealedSourceArtifactRef`; `sessionRef` for replay/checkpoint | none |

## Reference and trusted-host custody

- `planRef`, `transitionSetRef`, identity/source artifact references, signed-challenge references, sealed-source references, and sealed replay references resolve only through application-bound trusted-host custody. The model never supplies the underlying material.
- `handleRef` is always process-local and non-authoritative. `receiz_v124_execution_stage` and `receiz_v124_execution_stage_prepared` keep the exact SDK handle in the MCP client runtime.
- `sessionRef` may name a local held session or a trusted-host-persisted session. A returned `persistedSessionRef` is supplied to a later tool as its `sessionRef` value. The canonical SDK/server path re-verifies the persisted session before use; the reference and persisted projection are not authority.
- Execute and cancel require the process-local held handle and a re-verified held/persisted authority session. Never reconstruct either object from JSON.
- Refresh rotates session custody and invalidates the prior local reference. Close consumes the authenticated session.
- Private additions remain entirely in trusted-host custody under `privateAdditionsRef`. The model receives only authenticated safe coordinates, counts, and event digests—not the exact encrypted additions or recipient material.
- Replay export returns an unsealed, non-authoritative candidate containing `exactBytesB64u`. It is not a sealed proof object. Canonically Record -> Seal those exact bytes, admit the result into trusted-host custody as `sealedReplayProofObjectRef`, and only then call restore.
- Restore accepts only `sealedReplayProofObjectRef`; the SDK verifies the exact sealed proof object before restoring replay custody. Caller-constructed replay JSON is forbidden.

## Mutation and recovery law

Challenge creation, stage, execute, cancel, authority-session open/refresh/close, and sealed-source publication require the exact MCP confirmation digest before mutation. A confirmation digest authorizes only the exact pending request and never becomes proof, identity, session, or execution authority. Recovery reads use the durable semantic idempotency coordinate before any replacement plan is created.

All tool output remains a subordinate projection. Secret-bearing values and private proof material must not be echoed by the MCP adapter.
