# KKSv1.0 Temporal Authority

KKSv1.0 is the single temporal authority for Receiz proof objects. A proof coordinate is the Kai pulse monotonically counted at the canonical KKS frequency from Genesis. It is deterministic and locally computable; no network, server, database, registry lookup, or time API is required.

`createdAt` is descriptive Chronos only. `created_at`, ISO dates, Unix timestamps, browser clocks, server clocks, and database timestamps are also Chronos representations. They may describe or display an already established Kai coordinate. They must never create, recover, order, repair, compare, or override proof authority.

## Exact SDK contract

Use `receizKaiNow()` only to obtain the locally computed KKS coordinate candidate for a new proof action. The number is not temporal authority by itself.

Use `createReceizKksV1LiveProofCoordinate({ prove, previousKaiSigilProofHead })` to bind that exact candidate through the existing, unchanged KaiSigil BLAKE3 -> Poseidon -> Groth16 circuit. The supplied `prove` adapter must use the canonical KaiSigil proving artifacts; this function does not introduce a new circuit or verifier.

Use `admitReceizKksV1ProofCoordinate(value, context)` at a typed boundary. Admission is closed: it rejects a bare pulse string, added fields such as `createdAt`, a mismatched pulse/micro-pulse pair, a broken KKS lattice projection, a mismatched BLAKE3/Poseidon commitment, an invalid Groth16 proof or public signal, an unrecognized pinned verification key, an unexpected previous proof head, a non-monotonic append, or a coordinate beyond the caller's admitted causal bound.

Use `projectReceizKksV1SealedProofCoordinate(coordinate, context)` only after the enclosing verified proof object supplies the complete KaiSigil-bound coordinate. It re-runs the same admission and returns the exact deterministic Kai moment projection. A bare pulse string is never authority.

```ts
import {
  admitReceizKksV1ProofCoordinate,
  createReceizKksV1LiveProofCoordinate,
  projectReceizKksV1SealedProofCoordinate,
} from "@receiz/sdk";

const live = await createReceizKksV1LiveProofCoordinate({
  prove: kaiSigilProver,
  previousKaiSigilProofHead: priorHead,
});
const admitted = await admitReceizKksV1ProofCoordinate(live, {
  expectedPreviousKaiSigilProofHead: priorHead,
  minimumExclusiveKaiUpulse: priorUpulse,
  maximumInclusiveKaiUpulse: admittedCurrentUpulse,
});
const sealed = await projectReceizKksV1SealedProofCoordinate(admitted);
```

## Exact MCP contract

- `receiz_v124_kai_now` returns a locally computed KKSv1.0 coordinate candidate while retaining its historical numeric `pulse` and `uPulse` compatibility fields. Its response explicitly declares that the candidate is not temporal authority and requires KaiSigil proof admission.
- `receiz_sealed_kai_moment` accepts only the complete KaiSigil-bound coordinate carried by a verified proof object. It verifies that coordinate and returns its exact KKSv1.0 moment projection.

MCP does not create temporal authority. It exposes the canonical SDK computation and projection beneath the proof object.

## Required implementation behavior

- New proof: acquire the exact candidate from local KKSv1.0 computation, seal it with the unchanged KaiSigil proof circuit, and admit the full proof-bearing coordinate.
- Existing proof: read the full KaiSigil-bound coordinate from the verified sealed object and verify it before projection.
- Ordering and causality: require the exact verified previous proof head and a strictly greater admitted Kai micro-pulse.
- Actor authority: independently bind the causal append payload and prior head to Receiz ID/PBI authorship. KaiSigil proves the coordinate binding; it does not substitute for actor authorship or the enclosing proof object.
- Chronos display: derive it from Kai after authority is established.
- Missing Kai: fail closed or omit the proof claim; never synthesize it from `createdAt`.
- Global sync: append verified additions at their carried Kai coordinates; never rewrite settled proof history.

## Conformance

Run `runReceizV125TemporalAuthorityConformance()` or `pnpm test:temporal-authority-conformance`. The suite verifies the real public KaiSigil vector, exact KKS lattice, BLAKE3/Poseidon binding, Groth16 public signals and proof, pinned verification key, previous-head binding, strict monotonicity, future-coordinate rejection, Chronos rejection, and exact sealed projection. The report is evidence beneath the verified proof coordinate; it is never temporal authority.

The machine-readable equivalent is `skills.json.temporalAuthority`. Every current manifest carries the identical object and forbids `created-at-as-proof-authority`.

Temporal derivation also obeys the shared forward-only authority flow in
`forward-only-authority-flow.md`. KKS establishes causal order for source-bound
proof history; it never creates an authority above the actual sealed object.
