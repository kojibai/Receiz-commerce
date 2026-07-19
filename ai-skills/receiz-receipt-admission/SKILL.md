---
name: receiz-receipt-admission
description: Use when inspecting admission evidence while preserving the rule that receipts and heads are witnesses beneath the verified proof object.
---

# Receiz Receipt Admission

Current admission evidence begins with the complete verified proof object. Historical receipts may remain immutable witnesses of the law and digest they recorded, but they do not authorize or qualify a current v112 outcome.

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

Use the exact current artifact MCP tools: `receiz_artifact_verify`, `receiz_artifact_admit`, `receiz_artifact_append_plan`, `receiz_artifact_transition_seal_and_stage`, and `receiz_artifact_transition_commit`. MCP confirmation and result objects remain non-authoritative.

## Emulator fixture

Run the current native artifact round-trip and cross-boundary substitution rejection contracts. Historical receipt fixtures remain historical evidence only.

## v112 append receipts

A v112 receipt reports the exact accepted artifact digest, transition and plan identity, named commit domain, reported actor, head, effects, and idempotency outcome. It grants no authority and cannot be supplied to admission, identity, capability, planning, staging, or commitment APIs. The accepted artifact—not the receipt—is the source of committed history.

## v112 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission begins from runtime-custodied verification of the exact enclosing artifact bytes under the complete frozen verifier context. Verified history and actor evidence remain same-runtime objects and fail closed on divergence or structural reconstruction. Identity Seal signing uses a locally held Ed25519 or P-256 key and emits a signed capability claim; only current verification of that claim against the exact plan produces capability authority.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, actors, capabilities, plans, candidates, stores, or confirmations cannot authorize a current v112 receiver; exact bytes crossing a process require `reverify-exact-bytes`, followed by current profile admission and `same-runtime-custody` through plan, capability, seal, stage, independent byte resolution, atomic named-domain acceptance, and report-only receipt.
