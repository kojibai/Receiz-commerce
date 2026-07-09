# Auth Boundaries

## Delegated Access

Receiz Connect/OIDC bearer tokens authorize scoped SDK/API calls. They do not become proof authority. They sit beneath Receiz ID, Receiz Key, Identity Record, Identity Seal, sealed artifacts, verified appends, and settlement primitives.

Agents can acquire delegated access when the user consents through the official OIDC Authorization Code + PKCE flow or the MCP delegated-agent setup flow. The agent may use `receiz_mcp_login` to get the dashboard path, recommended scopes, config shape, and authorize URL when `clientId`, `redirectUri`, and `codeChallenge` are supplied. After the user completes consent and the host exchanges the authorization code, the resulting scoped access token permits MCP/SDK calls within granted scopes.

## MCP Login Helper

`receiz_mcp_login` returns the official delegated agent-token setup path and recommended scopes. Treat it as setup mechanics. Do not print or request secret token values in the skill output.

## Public Reads

Public proof, public store, public app-state, public wallet ledger, public action ledger, and public world reads can be used without a delegated token when the underlying rail is public.

## Delegated Writes

Publishing app-state, publishing public-store state through agent/server authority, querying private proof rails, checkout, transfer, settlement, or ownership-affecting actions require delegated authority and explicit confirmation.

Having delegated authority does not remove the confirmation requirement for write actions. It only proves the agent has scoped permission to call the rail.
