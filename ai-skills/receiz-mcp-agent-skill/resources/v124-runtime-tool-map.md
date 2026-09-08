# V124 Runtime MCP Tool Map

This is the exact universal V124 MCP adapter surface. It is not application-specific. Each tool calls the named SDK primitive and must not reimplement SDK verification, authority, clock, replay, conversation, material, or execution law. The machine-readable companion is [v124-runtime-tool-map.json](v124-runtime-tool-map.json).

## Authority hierarchy

- The enclosing sealed Receiz proof object remains proof authority.
- The Receiz identity artifact remains identity authority and every conversation participant is bound by Receiz ID to exact subject/access heads.
- A grant, challenge, bearer, authority session, handle, source-family digest, MCP reference, server response, or database row is not proof or identity authority.
- The database supports synchronization and recovery beneath proof-object continuity; complete trusted-host custody reconstructs with no fetch.

## Exact tools, SDK methods, and scopes

`applicationId` and `audience` are pinned by the authenticated MCP runtime. They are never model-supplied tool inputs.

| MCP tool | Canonical SDK method | Scopes | Input refs | Output refs |
|---|---|---|---|---|
| `receiz_v124_kai_now` | `receizKaiNow` | none | none | none |
| `receiz_v124_proof_authority_challenge_create` | `createReceizProofAuthorityChallenge` | conditional `exact-requested-scopes-within-registered-application-grant` | none | none |
| `receiz_v124_execution_plan_atomic_operation` | `client.execution.planAtomicOperationV124` | none | none | `planRef` |
| `receiz_v124_execution_stage` | `client.execution.stage` | fixed `receiz:domains.write` | `planRef` | `handleRef` |
| `receiz_v124_execution_stage_prepared` | `client.execution.stagePrepared` | fixed `receiz:domains.write` | `planRef`, `transitionSetRef` | `handleRef` |
| `receiz_v124_execution_execute` | `client.execution.execute` | fixed `receiz:domains.write`; conditional `exact-stored-granted-scopes`; conditional `settlement-or-reserve-granted-rail-when-operation-category-requires-it` | `handleRef`, `sessionRef` | `planRef` |
| `receiz_v124_execution_resolve` | `client.execution.resolve` | fixed `receiz:domains.read` | none | `planRef` |
| `receiz_v124_execution_resolve_by_idempotency` | `client.execution.resolveByIdempotencyKey` | fixed `receiz:domains.read` | none | `planRef` |
| `receiz_v124_execution_cancel` | `client.execution.cancel` | fixed `receiz:domains.write`; conditional `exact-stored-granted-scopes`; conditional `settlement-or-reserve-granted-rail-when-operation-category-requires-it` | `handleRef`, `sessionRef` | `planRef` |
| `receiz_v124_runtime_authority_session_open` | `client.runtime.openAuthoritySessionV124` | conditional `exact-signed-challenge-scopes`; conditional `receiz:<requested-rail>.write` | `identityArtifactRef`, `subjectSourceArtifactRef`, `signedChallengeRef` | `sessionRef`, `persistedSessionRef` |
| `receiz_v124_runtime_authority_session_refresh` | `client.runtime.refreshAuthoritySessionV124` | conditional `exact-signed-challenge-scopes`; conditional `exact-stored-session-scopes`; conditional `receiz:<requested-rail>.write` | `sessionRef`, `identityArtifactRef`, `signedChallengeRef` | `sessionRef`, `persistedSessionRef` |
| `receiz_v124_runtime_authority_session_close` | `client.runtime.closeAuthoritySessionV124` | conditional `exact-stored-session-scopes` | `sessionRef` | none |
| `receiz_v124_runtime_qualify` | `client.runtime.qualifyV124` | conditional `application-bound-bearer` | none | none |
| `receiz_v124_domain_verified_additions` | `client.domains.verifiedAdditionsV124` | fixed `receiz:domains.read` | none | none |
| `receiz_v124_domain_verified_replay` | `client.domains.verifiedReplayV124` | fixed `receiz:domains.read` | none | none |
| `receiz_v124_domain_verified_checkpoint` | `client.domains.verifiedCheckpointV124` | fixed `receiz:domains.read` | none | none |
| `receiz_v124_domain_verified_private_additions` | `client.domains.verifiedPrivateAdditionsV124` | fixed `receiz:world.private`; conditional `exact-stored-granted-scopes` | `sessionRef` | `privateAdditionsRef` |
| `receiz_v124_domain_replay_proof_object_export` | `client.domains.exportVerifiedReplayProofObjectV124` | none | none | none |
| `receiz_v124_domain_replay_proof_object_restore` | `client.domains.restoreVerifiedReplayProofObjectV124` | none | `sealedReplayProofObjectRef` | none |
| `receiz_source_carried_replay_open` | `openReceizSourceCarriedReplayFamilyV124 + projectReceizSourceCarriedReplayBranchesV124` | none | `sealedSourceArtifactRefs` | none |
| `receiz_conversation_source_family_open` | `openReceizConversationSourceFamilyV1` | none | `sealedSourceArtifactRefs` | none |
| `receiz_conversation_epoch_grants_plan` | `planReceizConversationEpochGrantBatchesV1` | none | `epochSecretRef`, `recipientSetRef` | none |
| `receiz_material_source_parts_open` | `openReceizMaterialSourceParts` | none | `materialSourceFamilyRef` | none |
| `receiz_v124_subject_namespaces_resolve` | `client.subjects.resolveNamespacesV124` | fixed `receiz:subjects.read` | none | none |
| `receiz_v124_identity_public_recipient_resolve` | `client.identity.resolvePublicRecipientV124` | fixed `receiz:subjects.read`; conditional `exact-stored-granted-scopes` | `sessionRef` | none |
| `receiz_v124_source_publish_sealed` | `client.sources.publishSealedSourceV124` | conditional `subject:receiz:subjects.write:no-session`; conditional `replay-segment:receiz:domains.write:exact-stored-granted-scopes`; conditional `checkpoint:receiz:domains.write:exact-stored-granted-scopes` | `sealedSourceArtifactRef`, `sessionRef` | none |

## Reference and trusted-host custody

- `receiz_v124_kai_now`: No authority object is created; the SDK returns the genesis-derived Kai pulse coordinate.
- `receiz_v124_proof_authority_challenge_create`: The canonical signable challenge is not identity authority and must remain exact through local artifact signing.
- `receiz_v124_execution_plan_atomic_operation`: The SDK plan is a deterministic execution projection, not proof or commit authority.
- `receiz_v124_execution_stage`: The MCP runtime holds the exact SDK handle and returns only a process-local non-authoritative handleRef.
- `receiz_v124_execution_stage_prepared`: The MCP runtime holds the exact SDK handle and returns only a process-local non-authoritative handleRef.
- `receiz_v124_execution_execute`: Requires the process-local exact handle plus a local or trusted-host-persisted authority session; the canonical SDK/server path re-verifies the session and JSON reconstruction is rejected.
- `receiz_v124_execution_resolve`: Reads the durable authenticated execution projection through the SDK; the projection does not become proof authority.
- `receiz_v124_execution_resolve_by_idempotency`: Resolves the durable semantic idempotency coordinate without manufacturing or replaying a replacement plan.
- `receiz_v124_execution_cancel`: Requires the process-local exact handle plus a local or trusted-host-persisted authority session; the canonical SDK/server path re-verifies terminal authorization.
- `receiz_v124_runtime_authority_session_open`: Returns a non-authoritative local sessionRef and, when configured, a trusted-host persistedSessionRef; every later use is re-verified by the canonical SDK/server path.
- `receiz_v124_runtime_authority_session_refresh`: Refresh re-verifies a local sessionRef or trusted-host persistedSessionRef supplied as sessionRef, rotates custody, and returns new local and optional persisted references.
- `receiz_v124_runtime_authority_session_close`: Close re-verifies a local or trusted-host-persisted session reference and consumes the active session custody.
- `receiz_v124_runtime_qualify`: Capability descriptors report operational dependencies but cannot establish proof, identity, or execution authority.
- `receiz_v124_domain_verified_additions`: The SDK authenticates transport and verifies additions against the exact predecessor before admission into its replay context.
- `receiz_v124_domain_verified_replay`: Verified replay custody belongs to the canonical SDK client runtime, never to an MCP property bag.
- `receiz_v124_domain_verified_checkpoint`: Checkpoint creation consumes SDK-held verified replay custody and binds the authenticated exact head.
- `receiz_v124_domain_verified_private_additions`: The exact authenticated private-additions result remains in trusted host custody behind privateAdditionsRef; the model receives only safe coordinates, counts, and digests.
- `receiz_v124_domain_replay_proof_object_export`: Returns an unsealed non-authoritative candidate containing exactBytesB64u. It must pass the canonical Record -> Seal ceremony before admission as sealedReplayProofObjectRef.
- `receiz_v124_domain_replay_proof_object_restore`: Accepts only sealedReplayProofObjectRef, resolves the exact sealed artifact in trusted host custody, and requires canonical SDK verification before restoring replay custody.
- `receiz_source_carried_replay_open`: Resolves exact sealed replay sources through trusted-host references, preserves every valid branch, and returns only stable coordinates and counts. Exact source bytes are never returned or persisted by MCP.
- `receiz_conversation_source_family_open`: Resolves exact sealed conversation replay sources through trusted-host references, preserves every valid sibling branch, and returns member, epoch, message-digest, and head coordinates only. Exact sources and clear message bodies never enter model output.
- `receiz_conversation_epoch_grants_plan`: Resolves the exact epoch secret and complete recipient binding set through trusted-host references, emits at most 128 encrypted recipient grants per call, and returns no clear epoch secret. Repeat nextRecipientOffset without a total membership cap.
- `receiz_material_source_parts_open`: Resolves and verifies the complete held material source family, then returns at most 256 segment coordinates per call. Exact material bytes and content-bearing locators never enter model output.
- `receiz_v124_subject_namespaces_resolve`: Returns authenticated namespace projections bound to exact heads; projections cannot replace sealed subject truth.
- `receiz_v124_identity_public_recipient_resolve`: Returns only the privacy-safe public recipient projection needed for transfer planning; it is not identity authority.
- `receiz_v124_source_publish_sealed`: The exact sealedSourceArtifactRef stays in trusted host custody. Subject publication needs no session; replay-segment/checkpoint publication re-verifies a local or persisted session's exact stored grant.

## Source-carried boundaries

- `receiz_conversation_source_family_open` verifies exact sealed sources and returns branch coordinates only; clear bodies remain outside model context.
- `receiz_conversation_epoch_grants_plan` is a bounded encrypted plan. The epoch secret remains host-custodied, revocation requires epoch rotation, and repeated windows support any total invited membership.
- `receiz_material_source_parts_open` verifies complete custody and pages coordinates only. It never serializes content-bearing locators or large bytes into MCP JSON.
- Legacy and whole-SHA media stays whole-artifact-required. Signed progressive media uses a compact enclosing commitment plus a carried ledger that must recompute its root; unsigned byte ranges, segment offsets, manifests, or container indexes cannot become range authority.

## Mutation and recovery law

Confirmed mutation tools require the exact MCP confirmation digest. A confirmation digest authorizes only the exact pending request and never becomes proof, identity, session, or execution authority. All MCP outputs are non-authoritative projections beneath sealed proof-object truth.
