---
name: receiz-proof-authority
description: Use when exchanging a verified Receiz proof object for narrow application authority without a website redirect.
---

# receiz-proof-authority

The object is authority. An application may exchange explicit consent bound to an independently verified proof object for short-lived, non-refreshable remote capability without redirecting a person to receiz.com.

## Registered application binding

For registered native APIs, set `RECEIZ_APPLICATION_ID` and SDK `applicationId` to the **exact registered OIDC client ID** returned by Receiz, including its `rc_` prefix, case, underscores, and hyphens. This is separate from the subject's Receiz ID, username, and client secret. Never lowercase, normalize, strip `rc_`, or substitute a slug/username alias. Existing valid native slugs remain syntax-compatible; syntax alone never authorizes an unregistered application. Keep client secrets server-side.

Follow the [registered native session example](examples/registered-native-session.md) for the actual grant, subject publication, session, and live qualification sequence. The same registered ID must bind the challenge audience, issued grant, bearer, SDK configuration, authority session, source publication, and request coordinates.

## Constitutional workflow

1. Verify the exact enclosing artifact at the edge; never elevate an extracted payload, server row, or database record over it.
2. Obtain an application-bound challenge that names the requested minimum scopes.
3. Show explicit consent inside the application and sign the canonical challenge with the authority carried by the verified object.
4. Call `client.identity.exchangeProofAuthority(...)` with the artifact, challenge, application ID, and exact scopes.
5. Keep the returned bearer capability short-lived, non-refreshable, secret, and confined to the application and granted scopes.
6. Configure the protected client with the issued bearer and the same exact application ID; call `client.auth.grantedScopes()` and check the actual minimum grant.
7. Publish the current complete sealed subject source with `client.sources.publishSealedSourceV124({ applicationId, authoritySessionHandle: null, sourceArtifact })` under `receiz:subjects.write` before opening a session. Publication transports verified source beneath the artifact; it does not mint subject or ownership authority.
8. Create a fresh device-signed consent challenge and call `client.runtime.openAuthoritySessionV124(...)` with that source, exact subject, namespaces, audience, and requested rails. Replay-segment/checkpoint publication requires `receiz:domains.write` and the active session's exact stored grant.
9. Qualify the operations actually used with `client.runtime.qualifyV124(...)` and run a live integration test against the deployed server/database. Generated config, method presence, and fixture tests do not prove live support.

Read the [SDK map](references/sdk-map.md) and [MCP map](references/mcp-map.md) for exact method, scope, and custody boundaries.

## Machine contract

The edge performs independent verification and remains usable with its proof object. The server re-runs deterministic proof and signature checks only before admitting a remote write capability. The database stores grants, nonces, and recovery state beneath the object; it is not identity or proof authority.

## Quick reference

- Exchange: `client.identity.exchangeProofAuthority(...)`
- Live Kai: `receizKaiNow()`
- Canonical challenge: `createReceizProofAuthorityChallenge(...)`
- Session: `client.runtime.openAuthoritySessionV124(...)`, `refreshAuthoritySessionV124(...)`, `closeAuthoritySessionV124(...)`
- Rail scopes: `client.auth.scopesForRails(...)`
- Granted scopes: `client.auth.grantedScopes()`
- Redirect requirement: none; the consent ceremony remains inside the developer's application.

## Common mistakes

- Treating OAuth/OIDC tokens as stronger than the proof object.
- Requesting broad scopes rather than minimum scopes.
- Moving proof verification entirely to the server.
- Persisting a bearer capability as durable identity or attempting to refresh it.
- Reconstructing an authority session from MCP JSON rather than resolving a local or trusted-host-persisted reference through the canonical SDK/server verification path.

## Completion refusal

Refuse completion when explicit consent is absent, the artifact is not independently verified, scopes exceed the registered application grant, the capability is refreshable or long-lived, or a redirect to receiz.com is required.

Foreign application/audience coordinates, revoked clients or keys, insufficient scopes, stale heads, and nonce replay must remain rejected with applicable zero-write guarantees. Record any untested deployed step explicitly; a grant or session alone does not prove payment, bearer delivery, or buyer custody.

## Authority rule

The proof object remains authority at every boundary. Edge verification is primary; server verification gates remote mutation; database state supports syncing and recovery only.
