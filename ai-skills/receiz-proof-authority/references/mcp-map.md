# V124 proof-authority MCP map

The universal adapters for this skill are:

| Tool | SDK method | Scope contract | Custody boundary |
|---|---|---|---|
| `receiz_v124_kai_now` | `receizKaiNow` | no bearer scope | Read-only genesis-derived Kai coordinate; UTC is elapsed-duration input, not authority. |
| `receiz_v124_proof_authority_challenge_create` | `createReceizProofAuthorityChallenge` | exact requested scopes must remain within the registered application grant | The signable challenge is not identity authority. |
| `receiz_v124_runtime_authority_session_open` | `client.runtime.openAuthoritySessionV124` | exact signed-challenge scopes plus `receiz:<requested-rail>.write` | Uses `identityArtifactRef`, `subjectSourceArtifactRef`, and `signedChallengeRef`; returns local `sessionRef` and optional trusted-host `persistedSessionRef`. |
| `receiz_v124_runtime_authority_session_refresh` | `client.runtime.refreshAuthoritySessionV124` | exact signed-challenge and stored-session scopes plus `receiz:<requested-rail>.write` | Uses `sessionRef`, `identityArtifactRef`, and `signedChallengeRef`; canonical SDK/server verification precedes rotation. |
| `receiz_v124_runtime_authority_session_close` | `client.runtime.closeAuthoritySessionV124` | exact stored session scopes | Close re-verifies and consumes the local or trusted-host-persisted session reference. |
| `receiz_v124_runtime_qualify` | `client.runtime.qualifyV124` | application-bound bearer | Operational capability evidence is a deployment descriptor, never proof or identity authority. |

The complete retained 26-tool V124/V124.1 surface is the [universal V124 runtime tool map](../../receiz-mcp-agent-skill/resources/v124-runtime-tool-map.md).

The sealed proof object and Receiz identity artifact remain authority. A grant, bearer, session, MCP reference, server response, or database row never becomes identity authority. `applicationId` and `audience` are runtime-pinned, never model inputs. Canonically persisted sessions cross client recreation only through SDK/server authentication; MCP does not re-admit serialized session objects.
