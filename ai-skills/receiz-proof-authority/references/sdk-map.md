# SDK map

- `receizKaiNow()` returns the canonical live `{ pulse, uPulse }` coordinate derived from the Receiz genesis and the phi-exact ties-to-even bridge. UTC supplies elapsed duration only; it is not authority.
- `createReceizProofAuthorityChallenge({ applicationId, artifactDigest, scopes, consentStatementDigest, ttlPulses, nonce })` builds the canonical whole-pulse signable challenge. The existing whole-pulse issue fields are never reinterpreted as micro-pulses.
- `client.identity.exchangeProofAuthority({ artifact, challenge, applicationId, scopes })` binds explicit in-application consent to the exact verified artifact and issues a short-lived, non-refreshable authority.
- `client.identity.signLoginProof({ keyFile, challengeB64Url, passphrase })` signs the exact canonical challenge with the locally held identity key after explicit consent; the key and passphrase stay local.
- `client.sources.publishSealedSourceV124({ applicationId, authoritySessionHandle: null, sourceArtifact })` publishes the current complete sealed subject source under `receiz:subjects.write` before session opening. Replay-segment/checkpoint sources use the active handle and `receiz:domains.write` instead.
- `client.runtime.openAuthoritySessionV124(input)` verifies the signed challenge, sealed subject source, bearer, grant, scopes, and exact heads before issuing an authenticated short-lived session.
- `client.runtime.refreshAuthoritySessionV124(input)` rotates a held or canonically persisted authenticated session without making the session identity authority.
- `client.runtime.closeAuthoritySessionV124(input)` binds closure to the issuing authority and consumes the active session.
- `client.runtime.qualifyV124(input)` reports whether every required production dependency is operational; method presence alone is insufficient.
- `client.auth.scopesForRails(...rails)` returns the OAuth/OIDC scope requirements for the named rails.
- `await client.auth.missingScopesForRails(...rails)` introspects the runtime bearer and identifies exact missing permissions.
- `await client.auth.canUseRails(...rails)` introspects the runtime bearer and answers whether every required rail scope was granted.
- `await client.auth.grantedScopes()` introspects the runtime bearer's actual granted scopes; it takes no argument.

For registered native APIs, `applicationId` is the exact registered OIDC client ID supplied as `RECEIZ_APPLICATION_ID`, distinct from subject identity, username, and client secret. Keep client secrets server-side; never normalize the registered ID or use an unregistered alias. See the [executable prerequisite sequence](../examples/registered-native-session.md). Qualify the actual called operations and deployed dependencies, then run them in a live integration test; method presence alone cannot establish remote support or purchase completion.

The application verifies the proof object at the edge. The remote service independently repeats deterministic verification before admitting a write capability; that repetition does not replace object authority.
