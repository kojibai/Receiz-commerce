---
name: receiz-receipt-admission
description: Use when verifying a v107 canonical admission receipt, checking proof-head continuity, or refusing tampered and mismatched outcomes.
---

# Receiz Receipt Admission

A canonical receipt proves admitted append evidence but remains beneath the sealed proof object. Never treat a plan, MCP response, self-hash, or UI success state as admission.

## Exact SDK operation

Use `proofHead.get` and `receipts.verify` after the canonical mutation returns its receipt.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const before = await receiz.proofHead.get({ aggregateId });
const result = await executeConfirmedOperation(before);
if (!await receiz.receipts.verify(result.receipt)) throw new Error("receipt_invalid");
if (result.receipt.head.aggregateId !== aggregateId) throw new Error("receipt_invalid");
const after = await receiz.proofHead.get({ aggregateId });
if (after.digest !== result.receipt.head.digest) throw new Error("stale_proof_head");
```

## Required authority

Proof-head reads require `receiz:record`. Verification is local cryptographic/structural evidence; it does not grant mutation authority or outrank the sealed artifact.

## Required proof head

Record the aggregate's verified head before mutation. The receipt must bind the same aggregate and its admission head digest; compare the returned canonical head after admission.

## Idempotency

An exact duplicate request must reproduce the original admitted outcome and receipt. Reusing the key with different intent must fail `idempotency_conflict`.

## Offline behavior

Verify carried receipts locally when all verification material is present. A queued command has no canonical receipt and must remain `globallyCommitted: false`.

## Conflict behavior

Reject tampering, aggregate mismatch, prior-head mismatch, invalid digest, and stale head. Preserve the last verified head and require a new confirmed plan; never repair a receipt in place.

## Receipt verification

Require exact canonical schema, admission receipt, receipt digest, head/admission digest equality, and `receipts.verify(...) === true`. Then compare operation, aggregate, and expected transition.

## User confirmation

Receipt verification is read-only. The mutation producing it still requires confirmation of operation, authority, expected head, consequences, and idempotency key. Do not ask users to confirm a receipt after the fact as a substitute for verification.

## MCP parity

Call `receiz_proof_head_get` before planning. After the operation-specific execute tool returns, call `receiz_receipt_verify` independently. The plan digest confirms user intent; the canonical receipt verifies admission; neither replaces the proof object.

## Emulator fixture

Run `duplicate-idempotency-and-conflicting-reuse` and `canonical-receipt-tampering-rejection`.
