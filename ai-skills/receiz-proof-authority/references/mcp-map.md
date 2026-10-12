# V124 proof-authority MCP map

The universal adapters for this skill are:

Configure the full MCP library with the exact registered OIDC client ID in `RECEIZ_APPLICATION_ID` and its application-bound bearer. Keep client secrets server-side. The [registered native session example](../examples/registered-native-session.md) includes the retained `receiz_v123_identity_exchange_proof_authority` and `receiz_v123_auth_granted_scopes` adapters. The V123 exchange takes exact private exchange input and must be invoked by the trusted host outside model context; it is not a V124 material-ref adapter. V124 tools pin application/audience and keep source/session material behind the established host refs. Restricted ChatGPT Marketplace profiles remain restricted.

| Tool | SDK method | Scope contract | Custody boundary |
|---|---|---|---|
| `receiz_v124_kai_now` | `receizKaiNow` | no bearer scope | Read-only genesis-derived Kai coordinate; UTC is elapsed-duration input, not authority. |
| `receiz_v124_proof_authority_challenge_create` | `createReceizProofAuthorityChallenge` | exact requested scopes must remain within the registered application grant | The signable challenge is not identity authority. |
| `receiz_v124_source_publish_sealed` | `client.sources.publishSealedSourceV124` | subject: `receiz:subjects.write`; replay/checkpoint: `receiz:domains.write` and exact session grant | Subject publication uses `sealedSourceArtifactRef` with no session; publish the current complete subject source before session opening. Replay/checkpoint requires `sessionRef`. |
| `receiz_v124_runtime_authority_session_open` | `client.runtime.openAuthoritySessionV124` | exact signed-challenge scopes plus `receiz:<requested-rail>.write` | Uses `identityArtifactRef`, `subjectSourceArtifactRef`, and `signedChallengeRef`; returns local `sessionRef` and optional trusted-host `persistedSessionRef`. |
| `receiz_v124_runtime_authority_session_refresh` | `client.runtime.refreshAuthoritySessionV124` | exact signed-challenge and stored-session scopes plus `receiz:<requested-rail>.write` | Uses `sessionRef`, `identityArtifactRef`, and `signedChallengeRef`; canonical SDK/server verification precedes rotation. |
| `receiz_v124_runtime_authority_session_close` | `client.runtime.closeAuthoritySessionV124` | exact stored session scopes | Close re-verifies and consumes the local or trusted-host-persisted session reference. |
| `receiz_v124_runtime_qualify` | `client.runtime.qualifyV124` | application-bound bearer | Operational capability evidence is a deployment descriptor, never proof or identity authority. |

The complete retained 26-tool V124/V124.1 surface is the [universal V124 runtime tool map](../../receiz-mcp-agent-skill/resources/v124-runtime-tool-map.md).

The sealed proof object and Receiz identity artifact remain authority. A grant, bearer, session, MCP reference, server response, or database row never becomes identity authority. `applicationId` and `audience` are runtime-pinned, never model inputs. Canonically persisted sessions cross client recreation only through SDK/server authentication; MCP does not re-admit serialized session objects.

Qualify every actually used runtime family and its dependencies with `receiz_v124_runtime_qualify`, then record live deployed requests separately from generated config and fixture evidence. Payment, wallet funding, bearer delivery, claim, and asset use require their own evidence.
