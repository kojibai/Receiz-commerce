# V125 SDK map

- `client.value.edge.planSettlement(input)` and `planReserve(input)` create the canonical explicit-rail edge plan.
- `client.value.edge.inspect(plan, participant)` independently verifies the sender or receiver role and exact intent.
- `client.value.edge.verifyTransitionSet(set, { audience })` reopens every exact sealed source under pinned roots and live Kai.
- `client.value.edge.prepareCommitSet(verified)` returns same-runtime local commit mechanics only after canonical verification.
- `client.value.edge.createRecovery({ applicationId, transitionSet, committedTransitions })` packages only SDK-issued committed transitions.
- `client.value.edge.confirmSettlementSend`, `receiveSettlement`, `confirmReserveSend`, and `receiveReserve` independently recover and settle the exact participant transition at that user's edge.
- `client.execution.exportCommittedRecovery(outcome)` exports the canonical recovery only when a committed compatibility execution still carries SDK custody.

The server and database may synchronize the resulting proof globally. They are not transaction authority.

## Historical remote compatibility

- `client.execution.planAtomicOperationV124(input)` validates and binds one canonical multi-domain plan before mutation, including direct value intents.
- `client.execution.stage(plan)` and `client.execution.stagePrepared(plan, transitionSet)` durably stage the exact canonical plan beneath authenticated proof authority.
- `client.execution.execute(handle, authoritySession)` performs the staged plan exactly once. Both SDK objects remain same-runtime-custodied.
- `client.execution.resolve(input)` reads the authenticated durable outcome.
- `client.execution.resolveByIdempotencyKey(input)` recovers the exact durable outcome by semantic idempotency coordinate after ambiguous delivery.
- `client.execution.cancel(handle, authoritySession)` authenticates both active and terminal cancellation attempts against the issuing authority.
- `client.value.executeSettlement(intent, authority)` executes a Settlement intent once.
- `client.value.executeReserve(intent, authority)` executes a Reserve intent once.
- `client.value.executionByIdempotencyKey(key, authority)` recovers the exact `committed`, `zero-write`, or `unknown` outcome.
- `client.auth.grantedScopes(authority)` returns the granted OAuth/OIDC scope set.

Persist the canonical intent before compatibility execution. After an ambiguous response, look up the idempotency key before any retry and never manufacture a replacement plan.

V124 execution routes require `receiz:domains.write` for stage, execute, and cancel, and `receiz:domains.read` for resolution. The authenticated authority session must additionally carry the exact rail scopes used by the plan. A route scope, bearer, handle, session, outcome, or database row never outranks the verified proof object, authenticated heads, or receipt.
