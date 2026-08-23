# SDK map

- `receizKaiNow()` returns the canonical live `{ pulse, uPulse }` coordinate derived from the Receiz genesis and the phi-exact ties-to-even bridge. UTC supplies elapsed duration only; it is not authority.
- `createReceizProofAuthorityChallenge({ applicationId, artifactDigest, scopes, consentStatementDigest, ttlPulses, nonce })` builds the canonical whole-pulse signable challenge. The existing whole-pulse issue fields are never reinterpreted as micro-pulses.
- `client.identity.exchangeProofAuthority({ artifact, challenge, applicationId, scopes })` binds explicit in-application consent to the exact verified artifact and issues a short-lived, non-refreshable authority.
- `client.runtime.openAuthoritySessionV124(input)` verifies the signed challenge, sealed subject source, bearer, grant, scopes, and exact heads before issuing an authenticated short-lived session.
- `client.runtime.refreshAuthoritySessionV124(input)` rotates a held or canonically persisted authenticated session without making the session identity authority.
- `client.runtime.closeAuthoritySessionV124(input)` binds closure to the issuing authority and consumes the active session.
- `client.runtime.qualifyV124(input)` reports whether every required production dependency is operational; method presence alone is insufficient.
- `client.auth.scopesForRails(rails)` returns the authoritative OAuth/OIDC scopes required by Settlement and Reserve.
- `client.auth.missingScopesForRails(grantedScopes, rails)` identifies exact missing permissions.
- `client.auth.canUseRails(grantedScopes, rails)` answers whether every required rail scope was granted.
- `client.auth.grantedScopes(authority)` introspects the capability's actual granted scopes.

The application verifies the proof object at the edge. The remote service independently repeats deterministic verification before admitting a write capability; that repetition does not replace object authority.
