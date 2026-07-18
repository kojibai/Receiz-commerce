---
name: receiz-receipt-admission
description: Use when inspecting admission evidence while preserving the rule that receipts and heads are witnesses beneath the verified proof object.
---

# Receiz Receipt Admission

Current admission evidence begins with the complete verified proof object. Historical receipts may remain immutable witnesses of the law and digest they recorded, but they do not authorize or qualify a current v111 outcome.

## Exact SDK operation

Use the current root SDK artifact verifier. Do not call historical proof-head or receipt endpoints from a current operation.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient();
const opened = await receiz.artifacts.verifyAndOpen(completeArtifactFile);
if (opened.sealedArtifact.artifactSha256 !== expectedArtifactSha256) {
  throw new Error("artifact_digest_mismatch");
}
if (opened.verifiedPayload.sha256 !== expectedPayloadSha256) {
  throw new Error("payload_binding_mismatch");
}
```

## Required authority

Read-only inspection requires no delegated mutation scope. The enclosing sealed artifact, accepted identity proof, or other native Receiz primitive supplies the truth boundary. A receipt, registry row, plan digest, MCP response, or UI success state remains weaker evidence.

## Required proof object

Supply and verify the complete artifact. Require integrity, Signature V4 where current native output requires it, owner/claim/path binding, artifact digest, and payload binding before reading inner content.

## Deterministic behavior

The same complete bytes must produce the same artifact digest and verified payload digest. Historical receipt bytes remain immutable historical evidence; do not regenerate them for a current operation and do not use them as a prerequisite.

## Offline behavior

Verify carried proof locally when all verification material is present. A queued operation has no proof of global admission merely because a transport queue marks it settled.

## Conflict behavior

Reject artifact mutation, owner substitution, claim substitution, path substitution, payload substitution, or receipt claims that disagree with the stronger artifact. Preserve the last verified proof and append a new lawful correction rather than repairing history.

## Result verification

Require exact artifact-byte identity, artifact and payload digest agreement, native carrier, signature, owner/claim binding, and independent verification. An explanation or trace is evidence only.

## User confirmation

Read-only verification requires no confirmation. Any mutation that creates a new proof object requires its own exact Record -> Seal plan confirmation; inspecting an old receipt cannot substitute for that confirmation.

## MCP parity

Use `receiz_artifact_verify`, `receiz_artifact_round_trip_check`, and `receiz_artifact_explain`. They share the current SDK verifier and cannot authorize mutation. Do not call retired proof-head or receipt tools for a v111 outcome.

## Emulator fixture

Run the current native artifact round-trip and cross-boundary substitution rejection contracts. Historical receipt fixtures remain historical evidence only.

## v111 migration and recovery receipts

A v111 legacy admission receipt states exactly what bytes and provenance were preserved, what authority is granted, and what remains read-only. The receipt and bounded explanation are evidence projections, never authority. Recovery mutation requires the SDK-issued plan, verified capability, stable operation identity, expected head, and one atomic commit.

## v111 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission must retain and canonically reverify the exact enclosing artifact bytes under the complete frozen verifier context. Recovery-authoritative history requires explicit independently verified evidence roots and fails closed on divergent verified heads. Canonical identity and `canSign` require enclosing-owner binding, identity-owner binding, key identity, and a domain-separated private-key challenge. Recovery planning re-derives state from verified admission and verified history.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, capabilities, plans, or confirmations cannot authorize a current v111 receiver; re-admit the historical artifact's exact bytes under the current verifier.
