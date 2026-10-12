# Agent Build App

Use MCP diagnostics first:

1. `receiz_capabilities`
2. `receiz_required_scopes`
3. `receiz_runtime_blueprint`
4. `receiz_public_store_resolve` for existing tenant state

Generate application runtime code with SDK imports. The agent uses MCP to inspect and coordinate its actual supported SDK operations, including the full library's financial adapters in the [full financial tool map](../resources/full-financial-tool-map.md).

For registered native APIs, follow the [registered native session example](../../receiz-proof-authority/examples/registered-native-session.md). Supply the exact registered OIDC client ID as `RECEIZ_APPLICATION_ID`, separate from subject identity, username, and server-side client secret. `receiz_mcp_login` emits configuration using that same `clientId`; generated config is setup evidence only.

Use the actual full-library tools in order: `receiz_v124_proof_authority_challenge_create`, trusted-host `receiz_v123_identity_exchange_proof_authority`, `receiz_v123_auth_granted_scopes`, `receiz_v124_source_publish_sealed` for the current complete subject source without a session, then `receiz_v124_runtime_authority_session_open` with fresh device-held signed consent and the source refs. Preserve V124 host-pinned application/audience and exact scopes; private V123 exchange inputs remain outside model context.

Call `receiz_v124_runtime_qualify` for actual operations such as `source-publication`, `verified-replay`, and `durable-execution` when used. Inspect their deployed dependencies and run the real live integration, including replay source publication, export, canonical sealing, and restore after reload. Do not invent a tool to cover an unavailable route or widen restricted ChatGPT Marketplace profiles. Report untested payment, wallet funding, delivery, claim, and use separately.
