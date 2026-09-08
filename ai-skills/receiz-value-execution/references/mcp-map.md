# V125 edge value-execution MCP map

| Tool | SDK method | Custody boundary |
|---|---|---|
| `receiz_v125_edge_value_plan_settlement` | `client.value.edge.planSettlement` | Returns safe coordinates plus opaque `planRef`; exact plan bytes stay outside model context. |
| `receiz_v125_edge_value_plan_reserve` | `client.value.edge.planReserve` | Same boundary for the Reserve rail. |
| `receiz_v125_edge_value_plan_inspect` | `client.value.edge.inspect` | Resolves and validates the exact held plan for one sender/receiver participant. |
| `receiz_v125_edge_value_transition_set_verify` | `client.value.edge.verifyTransitionSet` | Exact portable set may come from trusted-host custody; verified SDK object remains same-runtime. |
| `receiz_v125_edge_value_commit_set_prepare` | `client.value.edge.prepareCommitSet` | Prepared commit units remain same-runtime behind `preparedCommitSetRef`. |
| `receiz_v125_edge_value_recovery_create` | `client.value.edge.createRecovery` | Committed transitions must retain SDK custody; output recovery may be portably persisted. |
| `receiz_v125_edge_value_settlement_send_confirm` | `client.value.edge.confirmSettlementSend` | Exact recovery digest and sender identity require confirmation. |
| `receiz_v125_edge_value_settlement_receive` | `client.value.edge.receiveSettlement` | Exact recovery digest and receiver identity require confirmation. |
| `receiz_v125_edge_value_reserve_send_confirm` | `client.value.edge.confirmReserveSend` | Exact recovery digest and sender identity require confirmation. |
| `receiz_v125_edge_value_reserve_receive` | `client.value.edge.receiveReserve` | Exact recovery digest and receiver identity require confirmation. |

These local tools require no delegated server scope. The MCP runtime pins the application audience; model input cannot select it. MCP is not authority and the server/database role is global sync only.

## Historical V124 remote compatibility map

The generic V124 execution adapters can coordinate exact atomic domain plans that include Settlement or Reserve value intents. They do not replace the existing direct V123 rail tools.

| Tool | SDK method | Fixed route scopes | Custody boundary |
|---|---|---|---|
| `receiz_v124_execution_plan_atomic_operation` | `client.execution.planAtomicOperationV124` | none | Read-only deterministic plan; the plan is not proof or commit authority. |
| `receiz_v124_execution_stage` | `client.execution.stage` | `receiz:domains.write` | Confirmed mutation; returns only a process-local non-authoritative `handleRef`. |
| `receiz_v124_execution_stage_prepared` | `client.execution.stagePrepared` | `receiz:domains.write` | Confirmed mutation; returns only a process-local non-authoritative `handleRef`. |
| `receiz_v124_execution_execute` | `client.execution.execute` | `receiz:domains.write`, exact stored grant, and Settlement/Reserve grant when the operation category requires it | Requires the process-local exact handle and a local or trusted-host-persisted session re-verified by the canonical SDK/server path. |
| `receiz_v124_execution_resolve` | `client.execution.resolve` | `receiz:domains.read` | Read-only durable authenticated resolution. |
| `receiz_v124_execution_resolve_by_idempotency` | `client.execution.resolveByIdempotencyKey` | `receiz:domains.read` | Required recovery lookup for ambiguous delivery before any retry or replacement plan. |
| `receiz_v124_execution_cancel` | `client.execution.cancel` | `receiz:domains.write`, exact stored grant, and Settlement/Reserve grant when the operation category requires it | Confirmed mutation requiring the process-local exact handle and re-verified local/persisted session, including terminal retries. |

The authority session must also carry the exact value rail scopes required by the plan: Settlement uses `receiz:settlement.read` and `receiz:settlement.write`; Reserve uses `receiz:reserve.read` and `receiz:reserve.write`; wallet projection/transfer uses `receiz:wallet.read` and `receiz:wallet.transfer`. Fixed route scopes and exact plan scopes are separate requirements.

The complete 26-tool retained V124 surface is the [universal V124 runtime tool map](../../receiz-mcp-agent-skill/resources/v124-runtime-tool-map.md).
