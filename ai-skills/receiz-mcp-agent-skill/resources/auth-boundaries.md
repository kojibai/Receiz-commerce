# Auth Boundaries

## Delegated Access

Receiz Connect/OIDC bearer tokens authorize scoped SDK/API calls. They do not become proof authority. They sit beneath Receiz ID, Receiz Key, Identity Record, Identity Seal, sealed artifacts, verified appends, and settlement primitives.

Agents can acquire delegated access when the user consents through the official OIDC Authorization Code + PKCE flow or the MCP delegated-agent setup flow. The agent may use `receiz_mcp_login` to get the dashboard path, recommended scopes, config shape, and authorize URL when `clientId`, `redirectUri`, and `codeChallenge` are supplied. After the user completes consent and the host exchanges the authorization code, the resulting scoped access token permits MCP/SDK calls within granted scopes.

## MCP Login Helper

`receiz_mcp_login` returns the official delegated agent-token setup path and recommended scopes. Treat it as setup mechanics. Do not print or request secret token values in the skill output.

Its `clientId` becomes `RECEIZ_APPLICATION_ID`: the exact registered OIDC client ID. Preserve case, `rc_`, underscores, and hyphens. Do not substitute subject Receiz ID, username, tenant slug, or client secret. Client secrets stay server-side. A syntactically valid native application ID does not authorize an unknown/inactive client.

For native proof-authority writes, follow the [registered source/session sequence](../../receiz-proof-authority/examples/registered-native-session.md). Genuine device-held consent, the exact minimum grant, current sealed subject-source publication, and authenticated session opening are distinct steps. Foreign application/audience, revoked client/key, insufficient scopes, and nonce replay remain rejected. Restricted ChatGPT Marketplace profiles do not inherit the full library's permitted tool surface.

## Public Reads

Public proof, public store, public app-state, public wallet ledger, public action ledger, and public world reads can be used without a delegated token when the underlying rail is public.

## Delegated Writes

Publishing app-state, publishing public-store state through agent/server authority, querying private proof rails, delegated checkout/transfer, settlement, or ownership-affecting actions require their exact delegated admission. Value-affecting mutations also require explicit confirmation. Public embedded merchant checkout and legacy token-claim adapters use their existing merchant/provider/token admission rather than an artificial delegated grant; see the [full financial tool map](full-financial-tool-map.md).

Having delegated authority does not remove the confirmation requirement for write actions. It only proves the agent has scoped permission to call the rail.
