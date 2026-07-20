# MCP Tool Map

The current artifact inventory contains nine tools.

Historical v112 compatibility inventory (the first five current tools):

1. `receiz_artifact_verify`
2. `receiz_artifact_admit`
3. `receiz_artifact_append_plan`
4. `receiz_artifact_transition_seal_and_stage`
5. `receiz_artifact_transition_commit`

Multi-addition v113 reconciliation flow:

1. `receiz_artifact_global_resolve`
2. `receiz_artifact_reconcile_plan`
3. `receiz_artifact_reconcile_stage`
4. `receiz_artifact_reconcile_commit`

Resolve and plan are read-only. Stage writes only neutral exact bytes. Commit requires a distinct confirmation binding expected head, plan, capability, exact staged reference, command, domain, registry, and operation matrix. All nine tools use the same SDK production adapter; there is no parallel mutation language.
