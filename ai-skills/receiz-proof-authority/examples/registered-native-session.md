# Registered Native Grant, Source, And Session

The full `@receiz/sdk` and `@receiz/mcp-server` libraries compose the existing identity and sealed-source primitives. The enclosing verified source remains authority; registration, scopes, grants, bearer tokens, sessions, transport receipts, and database state coordinate beneath it.

## Exact application coordinate

Set `RECEIZ_APPLICATION_ID` to the exact registered OIDC `clientId` returned by Receiz. `rc_PtuBxB_Gbm9OkFeflZiwCz-d` illustrates the registered format; use your own newly registered client for live integration evidence. The canonical policy accepts existing native slugs matching `^[a-z][a-z0-9.-]{0,127}$` and generated IDs matching `^rc_[A-Za-z0-9_-]{24}$`. Syntax acceptance never grants authorization to an unknown client.

Never normalize, lowercase, strip `rc_`, or replace the ID with a username or alias. The subject's Receiz ID is identity; `actorSubjectId` identifies the subject proof object; neither is the application coordinate. Keep client secrets server-side. Only the public registered ID is supplied to browser native-client configuration. The bearer must be issued to that same registered application and consenting identity.

## SDK prerequisite sequence

1. Hold the genuine identity artifact and its device-held signing key. Independently verify the enclosing identity proof and complete owned subject source; use the exact current subject source already admitted by the canonical subject runtime. A key ID, username, self-hashed JSON, or old source cannot substitute for that proof.
2. Register the exact application with the minimum allowed scopes. Subject publication needs `receiz:subjects.write`; domain replay reads need `receiz:domains.read`; replay/checkpoint publication and execution need `receiz:domains.write`; namespace and public-recipient reads need `receiz:subjects.read`. Private additions need `receiz:world.private`. Requested Settlement/Reserve rails additionally need their exact `receiz:<rail>.write` grant. Include only the scopes actually used.
3. Present the exact scopes and consent statement to the person. Only after approval, create and locally sign the canonical challenge. Its constructor's `consent.approved` field does not prove that consent occurred. `client.identity.exchangeProofAuthority(...)` independently verifies that proof, preserves the exact application/audience, and returns a short-lived non-refreshable grant bearer.
4. Configure the protected client with that bearer and exact application ID. `client.auth.grantedScopes()` takes no argument and reads the actual authenticated grant. Scope helpers take variadic rail names: `client.auth.scopesForRails(...rails)`, `client.auth.missingScopesForRails(...rails)`, and `client.auth.canUseRails(...rails)`.
5. Publish the current complete sealed subject source with `client.sources.publishSealedSourceV124({ applicationId, authoritySessionHandle: null, sourceArtifact })`. This publication requires no authority session and rejects a non-null session handle. It does not admit a fabricated subject or change ownership.
6. Create a fresh device-signed challenge for session opening. Call `client.runtime.openAuthoritySessionV124(...)` with the same source, identity artifact, exact subject, namespaces, audience, and requested rails. Retain the SDK-held authenticated session. Refresh and close use the canonical SDK path; JSON or an MCP ref cannot recreate authority.
7. Qualify the actual operations and run them live against the deployed compatible server/database. `source-publication` is a qualification family requiring both `receiz:subjects.write` and `receiz:domains.write`; this family-level check does not change the subject-only publication route's single-scope contract.

This reusable function opens a source-bound session after the application has already shown and received the person's explicit consent. Its source input must be the current complete owned subject source, not a newly assembled projection.

```ts
import {
  createReceizClient,
  createReceizProofAuthorityChallenge,
  sha256ReceizBytes,
  type ReceizPortableSealedArtifactV124,
} from "@receiz/sdk";

export async function openRegisteredNativeSession(input: {
  applicationId: string; // Exact public registered clientId from server config.
  identityArtifactBytes: Uint8Array;
  identityPassphrase?: string; // Local signing custody only; never sent/logged.
  subjectSourceArtifact: ReceizPortableSealedArtifactV124;
  actorSubjectId: string;
  requiredNamespaces: readonly string[];
  scopes: readonly string[]; // Exact approved, registered minimum scope set.
  requestedRails: readonly string[];
  consentStatement: string;
  consentApproved: boolean;
}) {
  if (input.consentApproved !== true) throw new Error("Explicit consent required");
  const applicationId = input.applicationId;
  const unsignedClient = createReceizClient({ applicationId });
  const keyFile = await unsignedClient.identity.readArtifact(input.identityArtifactBytes);
  const artifactDigest = await sha256ReceizBytes(input.identityArtifactBytes);
  const consentStatementDigest = await sha256ReceizBytes(
    new TextEncoder().encode(input.consentStatement),
  );
  const signFreshChallenge = async () => {
    const created = createReceizProofAuthorityChallenge({
      applicationId, artifactDigest, scopes: input.scopes,
      consentStatementDigest, ttlPulses: 30,
    });
    const proof = await unsignedClient.identity.signLoginProof({
      keyFile, challengeB64Url: created.challengeB64Url,
      passphrase: input.identityPassphrase,
    });
    return { ...created.challenge, proof };
  };
  const grant = await unsignedClient.identity.exchangeProofAuthority({
    artifact: input.identityArtifactBytes,
    challenge: await signFreshChallenge(),
    applicationId, scopes: input.scopes,
  });
  const client = createReceizClient({ applicationId, accessToken: grant.accessToken });
  const grantedScopes = await client.auth.grantedScopes();
  if (input.scopes.some((scope) => !grantedScopes.includes(scope))) {
    throw new Error("Required scope missing");
  }
  const publication = await client.sources.publishSealedSourceV124({
    applicationId, authoritySessionHandle: null,
    sourceArtifact: input.subjectSourceArtifact,
  });
  const session = await client.runtime.openAuthoritySessionV124({
    applicationId, audience: applicationId,
    actorSubjectId: input.actorSubjectId,
    subjectSourceArtifact: input.subjectSourceArtifact,
    proofArtifact: input.identityArtifactBytes,
    signedChallenge: await signFreshChallenge(),
    requestedRails: input.requestedRails,
    requiredNamespaces: input.requiredNamespaces,
  });
  return { client, publication, session }; // Trusted host custody; no bearer in UI/model output.
}
```

The caller must retain the exact pending request for lost-response recovery. A new operation uses a fresh challenge; do not replay an exchange/session challenge as a new action or bypass canonical idempotent recovery.

## Supported full-library MCP operations

| Stage | Actual tool | Required boundary |
|---|---|---|
| Setup | `receiz_mcp_login` | Generates config from registered `clientId`; it does not complete proof consent or grant exchange. |
| Challenge | `receiz_v124_proof_authority_challenge_create` | Exact pending-request confirmation; host-pinned application/audience; device signing remains outside model output. |
| Grant | `receiz_v123_identity_exchange_proof_authority` | Retained adapter accepts `input.artifactBase64`, signed `input.challenge`, exact `input.applicationId` and `input.scopes`; invoke through trusted host custody after confirmation, never expose private artifact/challenge inputs to model context. Output redacts the token; use the host's SDK exchange to retain the issued bearer for protected-runtime configuration. Redacted output alone cannot configure the bearer. |
| Actual scopes | `receiz_v123_auth_granted_scopes` | Introspects the authenticated runtime bearer; includes missing rail scopes when requested. |
| Subject publication | `receiz_v124_source_publish_sealed` | `sealedSourceArtifactRef`; `receiz:subjects.write`; no session for subject sources. |
| Session | `receiz_v124_runtime_authority_session_open` | `identityArtifactRef`, `subjectSourceArtifactRef`, `signedChallengeRef`; returns `sessionRef`, with optional trusted-host persistence. |
| Qualification | `receiz_v124_runtime_qualify` | Host-pinned application; `input.operations` names every actual runtime family. |
| Replay publication | `receiz_v124_source_publish_sealed` | Complete sealed replay source ref, `sessionRef`, and `receiz:domains.write`; enclosing artifact verified first. |
| Replay/export/restore | `receiz_v124_domain_verified_replay`, `receiz_v124_domain_replay_proof_object_export`, `receiz_v124_domain_replay_proof_object_restore` | Domain read grant; export is an unsealed candidate until canonical Record -> Seal; restore consumes the verified `sealedReplayProofObjectRef`. |

V124 tools pin application/audience in the runtime, never in model-selected coordinates. The V123 exchange input must be bound by the trusted host to that exact registered application. Use `RECEIZ_V124_MATERIAL_HOST_MODULE` for the existing trusted material resolver/persistence seam. The full-library adapter inventory does not widen the restricted ChatGPT Marketplace plugin's reviewed runtime profiles.

The full MCP library supports financial workflows through the existing V123 value rails, V124 admitted execution, V125 Settlement/Reserve edge lifecycle, and commerce adapters. Only the reviewed ChatGPT Marketplace plugin profile is nonfinancial; full-library financial capability does not by itself prove a particular deployed purchase completed.

## Live evidence and refusal boundary

Call `client.runtime.qualifyV124({ applicationId, operations })` or `receiz_v124_runtime_qualify` with the operations actually used: for example `source-publication`, `namespace-resolution`, `verified-replay`, and `durable-execution` only when those operations are in the integration. Inspect every result's status, actual grant, dependency health, public dependency heads, registry/reducer compatibility, runtime readiness, and transport signature. An unknown operation name or missing dependency must not be replaced by an invented qualifier.

Run the live integration with a newly registered Receiz-generated client. Record the exact ID through construction, genuine device-held grant, current subject-source publication, session opening, market-domain replay source publication, `client.domains.verifiedReplayV124(...)`, `client.domains.exportVerifiedReplayProofObjectV124(...)`, canonical sealing, and `client.domains.restoreVerifiedReplayProofObjectV124(...)` after reload. Preserve original sealed application coordinates and witnessed history when rotating a client; inspect application-scoped persistence instead of rewriting users or old artifacts.

Test foreign application/audience, unknown registered-format IDs, revoked client/key, insufficient scopes, stale source/custody, and nonce replay, retaining applicable zero-write guarantees. Generated configuration, callable methods/tools, and fixtures are mechanics evidence. Qualification plus actual deployed requests supplies live integration evidence; neither makes server/database state stronger than the source.

Report any untested server/database, payment, wallet funding, bearer delivery, claim, or use stage explicitly. Session success is not purchase completion. Use the [commerce evidence sequence](../../receiz-commerce-skill/examples/create-no-db-store.md) before claiming purchasing complete.
