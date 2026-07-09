# Agent Operating Rules

## Before A Tool Call

1. Name the primitive.
2. Identify read, preview, or write class.
3. Verify input source. User-provided IDs, URLs, hosts, amounts, and witness IDs must be explicit.
4. Select an existing tool. Do not invent one.
5. Ask for confirmation when the action publishes, appends, transfers, settles, buys, issues, claims, changes ownership, or changes public state.
6. If delegated access is missing, use the official OIDC/PKCE or `receiz_mcp_login` setup path; do not pretend the agent is authorized.

## After A Tool Call

1. Parse the returned JSON.
2. Preserve `authority.mcpAuthority: false` when present.
3. State source and primitive from the result.
4. Separate result, projection, proof, and missing evidence.
5. Report tool failure directly.

## If A Tool Is Unavailable

Say:

- what can be reasoned from local files, user-provided data, or SDK docs
- what still needs MCP or SDK live execution
- what tool would be used if available

Do not claim verification, publication, transfer, or append happened.
