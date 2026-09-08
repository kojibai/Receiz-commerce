# V125 Economy MCP Tool Map

This is the exact current v125 economy adapter surface. Every tool calls the named canonical SDK method. Settlement and Reserve transactions occur at the sender and receiver edges; server/database work is additive global sync only. MCP references are custody mechanics and never proof or transaction authority.

| MCP tool | Canonical SDK method | Scopes | Input refs | Output refs |
|---|---|---|---|---|
| `receiz_v125_lawful_action_law_register` | `lawfulActions.registerLaw` | `receiz:lawful-actions.laws.write` | `proofReference` | none |
| `receiz_v125_lawful_action_admit` | `lawfulActions.admit` | `receiz:lawful-actions.write` | `proofReference` | none |
| `receiz_v125_lawful_action_value_head_derive` | `lawfulActions.deriveValueHead` | `receiz:lawful-actions.value.write` | none | none |
| `receiz_v125_edge_value_plan_settlement` | `client.value.edge.planSettlement` | none | none | `planRef` |
| `receiz_v125_edge_value_plan_reserve` | `client.value.edge.planReserve` | none | none | `planRef` |
| `receiz_v125_edge_value_plan_inspect` | `client.value.edge.inspect` | none | `planRef` | none |
| `receiz_v125_edge_value_transition_set_verify` | `client.value.edge.verifyTransitionSet` | none | `transitionSetRef` | `verifiedTransitionSetRef` |
| `receiz_v125_edge_value_commit_set_prepare` | `client.value.edge.prepareCommitSet` | none | `verifiedTransitionSetRef` | `preparedCommitSetRef` |
| `receiz_v125_edge_value_recovery_create` | `client.value.edge.createRecovery` | none | `transitionSetRef`, `committedTransitionsRef` | `recoveryRef` |
| `receiz_v125_edge_value_settlement_send_confirm` | `client.value.edge.confirmSettlementSend` | none | `recoveryRef` | none |
| `receiz_v125_edge_value_settlement_receive` | `client.value.edge.receiveSettlement` | none | `recoveryRef` | none |
| `receiz_v125_edge_value_reserve_send_confirm` | `client.value.edge.confirmReserveSend` | none | `recoveryRef` | none |
| `receiz_v125_edge_value_reserve_receive` | `client.value.edge.receiveReserve` | none | `recoveryRef` | none |
| `receiz_v125_attestation_domain_resolve` | `client.attestations.createAuthority` | `receiz:proof.read` | `proofReference` | none |
| `receiz_v125_attestation_application_plan` | `client.attestations.planInitialSource` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_attestation_application_apply` | `client.attestations.applyInitialSource` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_attestation_workflow_plan` | `client.attestations.planEvent` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_attestation_workflow_apply` | `client.attestations.applyEvent` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_attestation_evidence_plan` | `client.attestations.planEvent` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_attestation_evidence_apply` | `client.attestations.applyEvent` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_attestation_evaluation_plan` | `client.attestations.planEvent` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_attestation_evaluation_apply` | `client.attestations.applyEvent` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_attestation_review_plan` | `client.attestations.planEvent` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_attestation_review_apply` | `client.attestations.applyEvent` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_attestation_approval_plan` | `client.attestations.planEvent` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_attestation_approval_apply` | `client.attestations.applyEvent` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_credential_issue_plan` | `client.credentials.planInitialSource` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_credential_issue_apply` | `client.credentials.applyInitialSource` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_credential_lifecycle_plan` | `client.credentials.planLifecycle` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_credential_lifecycle_apply` | `client.credentials.applyLifecycle` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_credential_currentness_resolve` | `client.credentials.resolveCurrentness` | `receiz:proof.read` | `proofReference` | none |
| `receiz_v125_pbi_ceremony_challenge_create` | `client.presentations.createChallenge` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_pbi_ceremony_approve` | `client.presentations.approveChallenge` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_pbi_ceremony_receipt_issue` | `client.presentations.issuePresenceReceipt` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_pbi_ceremony_receipt_verify` | `client.presentations.verifyPresenceReceipt` | `receiz:proof.read` | `proofReference` | none |
| `receiz_v125_pbi_ceremony_challenge_redeem` | `client.presentations.verifyPresenceReceipt` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_credential_presentation_create` | `client.presentations.create` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_credential_presentation_verify` | `client.presentations.verify` | `receiz:proof.read` | `proofReference` | none |
| `receiz_v125_credential_presentation_handoff_resolve` | `client.presentations.verify` | `receiz:proof.read` | `proofReference` | none |
| `receiz_v125_subject_relationship_plan` | `client.subjectCoordination.planRelationship` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_subject_relationship_apply` | `client.subjectCoordination.applyRelationship` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_subject_introduction_plan` | `client.subjectCoordination.planRelationship` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_subject_introduction_apply` | `client.subjectCoordination.applyRelationship` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_subject_message_plan` | `client.subjectCoordination.planMessage` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_subject_message_apply` | `client.subjectCoordination.applyMessage` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_subject_presence_plan` | `client.subjectCoordination.planPresence` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_subject_presence_apply` | `client.subjectCoordination.applyPresence` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_subject_discovery_resolve` | `client.subjectCoordination.discover` | `receiz:proof.read` | `proofReference` | none |
| `receiz_v125_external_execution_plan` | `client.externalExecution.plan` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_external_execution_execute` | `client.externalExecution.createRuntime` | `receiz:proof.write` | `proofReference` | none |
| `receiz_v125_external_execution_resolve` | `client.externalExecution.createRuntime` | `receiz:proof.read` | `proofReference` | none |
| `receiz_v125_external_execution_verify` | `client.externalExecution.verifyOutcome` | `receiz:proof.read` | `proofReference` | none |

## Custody boundaries

- `receiz_v125_lawful_action_law_register`: Trusted host resolves the enclosing sealed law artifact after exact confirmation; proof bytes never enter model context.
- `receiz_v125_lawful_action_admit`: Trusted host resolves the enclosing sealed action artifact after exact confirmation; the embedded portable execution-authority proof is reverified and proof bytes never enter model context.
- `receiz_v125_lawful_action_value_head_derive`: The canonical service recomputes value from admitted proof/Kai coordinates; the model cannot supply Phi.
- `receiz_v125_edge_value_plan_settlement`: Canonical local planning returns safe coordinates; exact plan bytes remain trusted-host or same-runtime material.
- `receiz_v125_edge_value_plan_reserve`: Canonical local planning returns safe coordinates; exact plan bytes remain trusted-host or same-runtime material.
- `receiz_v125_edge_value_plan_inspect`: The exact held plan is independently revalidated for one sender or receiver participant.
- `receiz_v125_edge_value_transition_set_verify`: Portable input may resolve through the host; the verified SDK object remains same-runtime-custodied.
- `receiz_v125_edge_value_commit_set_prepare`: Verified and prepared SDK objects remain same-runtime; exact commit units never enter model output.
- `receiz_v125_edge_value_recovery_create`: Committed transitions must retain SDK-issued same-runtime custody; the resulting recovery is portable.
- `receiz_v125_edge_value_settlement_send_confirm`: Sender independently reverifies the complete recovery at the edge after content-bound confirmation.
- `receiz_v125_edge_value_settlement_receive`: Receiver independently reverifies the complete recovery at the edge after content-bound confirmation.
- `receiz_v125_edge_value_reserve_send_confirm`: Sender independently reverifies the complete recovery at the edge after content-bound confirmation.
- `receiz_v125_edge_value_reserve_receive`: Receiver independently reverifies the complete recovery at the edge after content-bound confirmation.
- `receiz_v125_attestation_domain_resolve`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_application_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_application_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_workflow_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_workflow_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_evidence_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_evidence_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_evaluation_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_evaluation_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_review_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_review_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_approval_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_attestation_approval_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_credential_issue_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_credential_issue_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_credential_lifecycle_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_credential_lifecycle_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_credential_currentness_resolve`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_pbi_ceremony_challenge_create`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_pbi_ceremony_approve`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_pbi_ceremony_receipt_issue`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_pbi_ceremony_receipt_verify`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_pbi_ceremony_challenge_redeem`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_credential_presentation_create`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_credential_presentation_verify`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_credential_presentation_handoff_resolve`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_subject_relationship_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_subject_relationship_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_subject_introduction_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_subject_introduction_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_subject_message_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_subject_message_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_subject_presence_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_subject_presence_apply`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_subject_discovery_resolve`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_external_execution_plan`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_external_execution_execute`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_external_execution_resolve`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.
- `receiz_v125_external_execution_verify`: The trusted host resolves and verifies the enclosing sealed Receiz proof object; exact bytes, private claims, identity secrets, and raw provider evidence never enter model context, and MCP never becomes authority.

The runtime pins the application audience outside model input. A reference, plan, verified set, prepared set, recovery, confirmation, server response, or database row cannot replace the enclosing sealed proof objects or SDK-issued committed transition custody.
