---
name: receiz-proof-authority
description: Use when exchanging a verified Receiz proof object for narrow application authority without a website redirect.
---

# receiz-proof-authority

The object is authority. An application may exchange explicit consent bound to an independently verified proof object for short-lived, non-refreshable remote capability without redirecting a person to receiz.com.

## Constitutional workflow

1. Verify the exact enclosing artifact at the edge; never elevate an extracted payload, server row, or database record over it.
2. Obtain an application-bound challenge that names the requested minimum scopes.
3. Show explicit consent inside the application and sign the canonical challenge with the authority carried by the verified object.
4. Call `client.identity.exchangeProofAuthority(...)` with the artifact, challenge, application ID, and exact scopes.
5. Keep the returned bearer capability short-lived, non-refreshable, secret, and confined to the application and granted scopes.
6. Use granted-scope introspection before planning or executing a protected operation.

Read the [SDK map](references/sdk-map.md) for exact method boundaries.

## Machine contract

The edge performs independent verification and remains usable with its proof object. The server re-runs deterministic proof and signature checks only before admitting a remote write capability. The database stores grants, nonces, and recovery state beneath the object; it is not identity or proof authority.

## Quick reference

- Exchange: `client.identity.exchangeProofAuthority(...)`
- Rail scopes: `client.auth.scopesForRails(...)`
- Granted scopes: `client.auth.grantedScopes(...)`
- Redirect requirement: none; the consent ceremony remains inside the developer's application.

## Common mistakes

- Treating OAuth/OIDC tokens as stronger than the proof object.
- Requesting broad scopes rather than minimum scopes.
- Moving proof verification entirely to the server.
- Persisting a bearer capability as durable identity or attempting to refresh it.

## Completion refusal

Refuse completion when explicit consent is absent, the artifact is not independently verified, scopes exceed the registered application grant, the capability is refreshable or long-lived, or a redirect to receiz.com is required.

## Authority rule

The proof object remains authority at every boundary. Edge verification is primary; server verification gates remote mutation; database state supports syncing and recovery only.
