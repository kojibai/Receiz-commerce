# MCP map

- `receiz_subject_mandate_get`
- `receiz_subject_mandate_plan`
- `receiz_subject_mandate_activate`
- `receiz_subject_mandate_pause`
- `receiz_subject_mandate_revoke`
- `receiz_subject_runtime_enqueue`
- `receiz_subject_runtime_status`
- `receiz_subject_runtime_cancel`

Every result must expose its source SDK primitive, registry digest, reducer digest, and `mcpAuthority: false`. Writes require exact digest confirmation.
