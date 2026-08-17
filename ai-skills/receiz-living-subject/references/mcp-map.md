# MCP map

- `receiz_subject_resolve`
- `receiz_subject_state`
- `receiz_subject_history`
- `receiz_bearer_transfer_preview`
- `receiz_bearer_instrument_issue`
- `receiz_bearer_instrument_inspect`
- `receiz_bearer_instrument_claim`

Every result must expose its source SDK primitive, registry digest, reducer digest, and `mcpAuthority: false`. Writes require exact digest confirmation.
