# V124 value-execution MCP map

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

The complete 22-tool surface is the [universal V124 runtime tool map](../../receiz-mcp-agent-skill/resources/v124-runtime-tool-map.md).
