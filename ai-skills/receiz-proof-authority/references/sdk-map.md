# SDK map

- `client.identity.exchangeProofAuthority({ artifact, challenge, applicationId, scopes })` binds explicit in-application consent to the exact verified artifact and issues a short-lived, non-refreshable authority.
- `client.auth.scopesForRails(rails)` returns the authoritative OAuth/OIDC scopes required by Settlement and Reserve.
- `client.auth.missingScopesForRails(grantedScopes, rails)` identifies exact missing permissions.
- `client.auth.canUseRails(grantedScopes, rails)` answers whether every required rail scope was granted.
- `client.auth.grantedScopes(authority)` introspects the capability's actual granted scopes.

The application verifies the proof object at the edge. The remote service independently repeats deterministic verification before admitting a write capability; that repetition does not replace object authority.
