# MCP map

The v125 edge adapters mirror every `client.value.edge` method:

- `receiz_v125_edge_value_plan_settlement`
- `receiz_v125_edge_value_plan_reserve`
- `receiz_v125_edge_value_plan_inspect`
- `receiz_v125_edge_value_transition_set_verify`
- `receiz_v125_edge_value_commit_set_prepare`
- `receiz_v125_edge_value_recovery_create`
- `receiz_v125_edge_value_settlement_send_confirm`
- `receiz_v125_edge_value_settlement_receive`
- `receiz_v125_edge_value_reserve_send_confirm`
- `receiz_v125_edge_value_reserve_receive`

Planning, inspection, verification, preparation, and recovery packaging perform no server transaction. Sender/receiver settlement requires exact confirmation bound to the held recovery. Opaque references are custody mechanics and never authority. The stable `receiz_v122_value_plan_settlement` and `receiz_v122_value_plan_reserve` identifiers remain historical compatibility, not the current edge lifecycle.
