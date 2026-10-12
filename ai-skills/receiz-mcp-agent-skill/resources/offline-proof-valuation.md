# Offline proof valuation

V129 makes the existing Kai-sigil calculation reproducible in a developer's browser or Node host. Verify the enclosing proof first: its full Kai-sigil carries the existing lawful, required and fixed source coordinate. A separately supplied evaluation coordinate projects value now or in the future without resealing or resetting issuance. The source is that canonically verified proof object and its admitted carried history. The calculator, policy identifier, chart, SDK result and replay digest are projections beneath it. Calculation performs no custody, payment, admission-membership or purchase-approval write and does not create spendable Settlement.

The current release is a prepared source/package target. Source changes require refreshed candidate archives and qualification; prior archive hashes do not certify them. Package publication, deployed integration and live payment/provider completion require their own recorded evidence.

## Browser and Node entry points

Import calculation, policy, projection and replay functions from `@receiz/sdk/valuation`; the package root also exports them. Public `verifyReceizArtifact` and `createReceizArtifactAdmissionEngine` remain on `@receiz/sdk`. The valuation entry constructs no transport client.

The complete [browser example](https://unpkg.com/@receiz/sdk@129.0.0/examples/offline-proof-valuation/browser.ts) accepts a held `File` and explicit evaluation/sample coordinates. The [Node example](https://unpkg.com/@receiz/sdk@129.0.0/examples/offline-proof-valuation/node.ts) reads exact bytes, optionally admits a complete portable asset's history, and writes the public replay only to the supplied new file. Both branch on the actual result unions and perform the same calculation. Use the Node example from a TypeScript-capable host, or compile it before running its JavaScript output. Neither example derives an evaluation coordinate from the local clock.

```ts
import { verifyReceizArtifact } from "@receiz/sdk";
import {
  projectReceizProofValueV129,
  SIGIL_VALUATION_ALGORITHM,
  SIGIL_VALUATION_POLICY_CHECKSUM,
} from "@receiz/sdk/valuation";

const source = await verifyReceizArtifact(exactHeldBytes);
if (source.status !== "verified-artifact") throw new Error(source.status);
const value = await projectReceizProofValueV129({
  source,
  expectedProofDigest: source.artifactDigest.value,
  policy: { algorithm: SIGIL_VALUATION_ALGORITHM, checksum: SIGIL_VALUATION_POLICY_CHECKSUM },
  valuationKaiUPulse: explicitEvaluationKaiUPulse,
});
if (value.status === "unavailable") {
  console.log(value.code);
} else {
  console.log(value.proofValuePhiMicro, value.calculation, value.inputs.appliedDefaults);
}
```

For carried portable ownership history, first call `createReceizArtifactAdmissionEngine()(verification, { profile: "portable-state" })` and accept only its actual `bearer-recovery` or `foreign-owner` admission for this read. This does not grant ownership. Keep the SDK-issued source in the same runtime. A copied verification/admission object fails custody checks. Optional `expectedProofDigest` and `expectedHistoryHead` reject a foreign source/head.

## Four distinct value categories

| Category | Source and meaning |
| --- | --- |
| Intrinsic proof value | The existing `phi/kosmos-vφ-5` law over the admitted proof's original coordinates, metadata and applicable carried lineage. |
| Market reference value | A selected, published and versioned display rule bound to its sealed issuance and exact operands. Any executed-sale contribution must name the complete rule, amount, receipt and pinned conversion basis. |
| Asking price | The seller's listing or edited offer. It stays outside intrinsic calculator inputs. |
| Executed sale price | The actual amount in independently verified payment and accepted-delivery evidence for the same asset, participants and committed intent. |

USD is a deterministic display conversion with its own explicit algorithm, version and basis digest. It cannot approve payment, become a Settlement receipt or redefine the original proof value. The existing v125 lawful-action Settlement derivation is a separate implemented law; this display calculator does not replace it.

`ReceizProofValueProjectionV129` has `status: "available"`, the actual `proofDigest`, `originProofDigest`, `historyHead`, exact/whole origin and valuation coordinates, all four value fields, optional USD fields, complete `inputs`, `calculation`, `transactions`, `projectionDigest`, and `writesPerformed: 0`. `historyHead` may be null when no admitted history is carried. Missing sale/history evidence stays explicit in `transactions.incompleteHistory`.

The unavailable union has `status: "unavailable"`, `proofDigest`, `historyHead`, `writesPerformed: 0` and one of `VALUATION_ORIGIN_NOT_CARRIED`, `VALUATION_PAYLOAD_NOT_RETAINED` or `VALUATION_PRIVATE_SOURCE_UNSUPPORTED`. Invalid input, custody, policy, digest/head, coordinate or range bindings throw their actual error rather than producing a value. Identity, key, conversation and private account sources are outside this public valuation/replay contract.

## Existing pure calculator

The source implementation is generated from `app/utils/valuation.ts` into `sigilValuationCore.ts`. `computeIntrinsicUnsigned(meta, nowPulse)` takes explicit `SigilMetadataLite` and a whole-pulse evaluation coordinate. It returns the original `unsigned` and `stampPayload`, plus complete `calculation` and `appliedDefaults` records.

The algorithm is `phi/kosmos-vφ-5`, policy checksum `b05b2049`, with one coherent breath as one Phi:

```text
valuePhi = rarityFloor + premiumBandBase × combinedOsc + pv_phi
combinedOsc = breathWave × dayWave × strobeWave × momentAffinityOsc
```

The published source metadata is `SIGIL_VALUATION_ALGORITHM`, `SIGIL_VALUATION_POLICY`, `SIGIL_VALUATION_POLICY_CHECKSUM`, `SIGIL_VALUATION_ROUNDING` and `SIGIL_VALUATION_LEGACY_DEFAULTS`. The policy includes its constants, sorted-key canonical serialization, base unit, formula and rounding. Its original 32-bit FNV-like checksum identifies reproducible policy bytes; it is not proof admission.

The existing calculation uses ECMAScript binary64 numbers and Math functions. Oscillators retain `Math.round(x × 1000000) / 1000000`; Phi micro-unit display retains `Math.round(valuePhi × 1000000)`. `stableStringify` preserves the calculator's original serialization, including JSON number behavior. Version an intentional math change rather than altering existing fixtures or interpreting a rounded display as a new law.

The trace preserves the base unit, origin, age, geometry/moment lifts, provenance and holding terms, adoption and Fibonacci/Lucas accrual, rarity floor, premium band, breath/day/Beatty/affinity oscillators and optional present-value term actually used. Each `SigilCalculationTerm` carries an ID, label, formula, string operands, result, unit and source references. A simplified explanation panel must retain this complete replay data.

`appliedDefaults` identifies legacy compatibility as `reproducibility-only`: absent size becomes 1, quality becomes `med`, creator verification becomes false, reputation becomes 0, and absent cashflows contribute no present value. These defaults do not assert observed rarity, reputation, verified identity or cashflow. The low-level missing-origin fallback exists for legacy numerical compatibility. A proof-bound projection must require the carried origin and return explicit unavailability when it is absent.

## Sealed issuance and platform rarity

`ReceizRarityPolicyV129` declares schema `receiz.rarity-policy.v129`, algorithm, version, platform, rounding `half-up-phi-micro`, and a closed expression. Leaves are canonical decimal integer constants or named inputs. Operators are `add`, `subtract`, `multiply`, `divide`, `min` and `max`; no caller JavaScript executes.

`digestReceizRarityPolicyV129` hashes the validated canonical policy. `evaluateReceizRarityPolicyV129` accepts exactly its named integer operands and returns Phi micro-units, the exact rational numerator/denominator and a full calculation trace. Intermediate fractions remain exact; final nonnegative micro-units use half-up rounding. The limits are 256 expression nodes, depth 16, 64 named operands, 128 decimal digits and 16 arguments per operation. Subtract/divide require two arguments. Missing/foreign operands, division by zero, unsupported operations, negative final values and limits reject.

Pure policy evaluation provides reproducibility. The proof-bound path must first verify the enclosing issuance, match its carried policy digest and derive operands from that admitted source. A matching detached JSON checksum cannot establish this binding. Custom rarity remains a separate market reference projection and preserves the intrinsic Kai-sigil law.

The sealed JSON payload has `sigilMetadata` for supported craft, geometry and IP declarations. Its origin must agree with the verified bundle. The projector deliberately excludes caller/sealed creator verification and reputation flags from verified truth; `inputs.unknownInputs` records those boundaries while `appliedDefaults` preserves policy compatibility.

Custom issuance carries:

```text
receizRarity = { platform, issuanceId, algorithm, version, policyDigest, operands }
```

Pass that exact policy as `rarityPolicy`; the projector compares its digest, platform, algorithm and version to the carried issuance and reads the exact named operands there. Alternatively, select `marketReferenceRule: "last-executed-sale-v129"`; `RECEIZ_LAST_EXECUTED_SALE_RULE_V129` publishes its versioned rule. The market reference uses the unique causally latest applicable completed sale. Unknown exact completion timing in the same whole pulse is not treated as applicable; incomparable candidate heads keep the last sale unknown. Selecting both market-reference rules rejects as ambiguous. `askingPricePhiMicro` is a canonical decimal display input and never feeds either calculation.

An optional `usdBasis` must use algorithm `receiz.display-usd.v122`, version `"1"`, a positive decimal `usdPerPhiMicrocents`, and `priceBasisDigest`. The nested `priceBasis` repeats that same algorithm, version and rate and must recompute its exact canonical digest. The existing `quoteReceizDisplayUsdV122` integer rule projects intrinsic Phi into USD cents; an executed sale's receipt-pinned basis remains separately carried in its transaction trace.

Sports cards retain their own acquisition, score, pack-odds and performance inputs. Their explainable value/chart source is a presentation example. Wildz creatures do not acquire those sports inputs, and Market display helpers cannot supply simulated volume, holders, transfers or completed transactions.

## Exact coordinates and carried history

Evaluation uses an explicit canonical decimal Kai uPulse. The existing SDK bridge projects whole pulses only where the original law requires them. Creation/claim coordinates and lineage come from the admitted proof; login, upload, browser/server wall time, rounded ownership pulse and array arrival order cannot supply them.

The source time already exists in the full Kai-sigil and its verified enclosing proof. Valuation composes the existing read-only coordinate/history readers; it introduces no proof-bundle field, Signature-V4 payload change, compact-link change, producer clock override or temporal setter. Return the precision actually admitted from that source. Historical ownership timing may come from an existing signed `consent.command.kaiUpulse` under SDK-admitted enclosing history; projecting that existing field does not rewrite a history node or create a separate temporal proof.

A successor seal advances the same proof object's history and retains its original value origin. Exact carried ownership uPulse stays exact. Legacy proofs remain verifiable with a whole-pulse origin and null exact precision when their original bytes lack micro-pulse evidence; multiplying a whole pulse cannot create that missing precision.

Ownership changes are deduplicated by admitted claim/head coordinates. Carried older history survives active-journal compaction. Raw peer messages, listing drafts and detached caller histories cannot select an owner or create a sale.

A completed sale requires independently verified payment and accepted delivery for the same asset, named seller/buyer and committed intent. Record its exact Phi amount, receipt/delivery digests and receipt-pinned USD basis. Gifts and claim transfers have a null payment amount. Pending, failed, cancelled, self-authored-message-only and paid-but-undelivered attempts remain outside completed sales. Historical bytes lacking the necessary joins or precision must report their exact unavailable boundary.

## Produce a public completed-sale replay source

This is an explicit source-authoring operation after the existing atomic sale has completed. The valuation and replay readers do not perform it. The Node example's `createPublicSaleReplaySourceInNode` uses the actual public SDK producers, identity signing and identity-bound offline sealer; its inputs require the existing real replay, receipt, witness and committed-runtime objects. It never invents rows or accepted coordinates.

1. Retain the actual `commitArtifactTransition` results for every participant of the same exact atomic plan. The plan's Settlement intent and `proof-value.atomic-sale-binding.v129` operation bind the asset, seller/buyer, payment source/destination and accepted delivery. The seller-to-buyer ownership node carries `proof-value.accepted-delivery.v129`, the same `valueIntentDigest` and semantic transaction key.
2. Before that committed operation, each participant's enclosing predecessor history must carry `namespaceData["proof-value.issuer-key-state.v129"]` with schema `proof-value.issuer-key-state-reference.v129`, that participant's `identityArtifactDigest` and `publicStateDigest`. The preimage is exactly `JSON.parse(serializeReceizIdentityArtifact(actualKeyFile)).portableState`; compute its digest with `digestReceizCanonicalV122`. Preserve the complete four-field wire envelope (`schema`, `exportedAt`, `snapshot`, `proof`), including any signed segmented reference and signed segments. Its strict materialized `receiz.identity-key-state.v113` snapshot contains only `issuerKeyId`, `actorId`, `registryDigest`, `observedThroughKai` and `revokedAtKai`. Existing `appendReceizIdentityPortableState` may sign an actually observed public state in private device custody; neither a fabricated observation horizon nor a digest over only those five fields qualifies. The predecessor carries the reference, not private identity bytes or full account state. Historical absence remains an unavailable public-replay boundary; do not rewrite old nodes or invent revocation observations.
3. Call `exportReceizProofValueSalePublicEvidenceV129(runtimeEvidence)`. It independently reads the SDK-issued committed custody and emits the subordinate public journal body. The body contains exact public payment/delivery sources, plan/commit/receipt evidence, public identity binding and strict signed public issuer state. Detached body JSON is not sale evidence.
4. Carry that exact body in the existing domain replay's canonical event bytes. Use `createReceizDomainAppendCommandsV124` with the actual replay/receipt, source Kai coordinate, actual `acceptedAtKaiUPulses` and external causal-parent heads. Retain the existing insertion, causal and Fibonacci witnesses and predecessor source; no fabricated micro-pulse increments are allowed.
5. Call `createReceizDomainReplaySourceAuthorityV124`, then `createReceizDomainReplaySourceIntentV124` for that exact accepted head, application/audience, replay, journal, ownership, provenance and predecessor. Read the admitted buyer identity with `readReceizIdentityPublicBinding`.
6. Prepare `createReceizProofAuthorityChallenge` with the intent digest, exact buyer identity artifact digest and `receiz:domains.write`. The fixed source Kai pulse must lie in that actual challenge's issued/expiry interval. Present the complete source intent and challenge, obtain actual approval of its exact `consentStatementDigest`, then sign the returned `challengeB64Url` through `signReceizIdentityLoginProof` in the private device host. Build the existing public `ReceizDomainReplaySourceAuthoringEvidenceV124`. Keys and passphrases stay in host custody. If the source/coordinate changes or the challenge expires, prepare and approve its new exact intent.
7. Call `prepareReceizDomainReplaySegmentProofObjectCandidateV124` with the exact replay/journal, authoring evidence, source authority, Kai, predecessor, witnesses and portable source metadata. The candidate is unsealed. After explicit prior device enrollment, call the existing identity-bound `seal({ bytes, filename, mimeType })` with its exact `proofObject.payload.bytes`. The existing sealer establishes its lawful source time; callers add no temporal setter. Canonically verify the complete returned artifact and its carried full Kai-sigil source, then require the existing replay source reader to admit the exact source/intent/witness bindings. If those bindings fail, reject that source rather than replacing its coordinate or automatically retrying a changed intent. This source creation is separate from read-only calculation and transfers no Phi or asset custody.
8. Form `ReceizProofValuePublicSaleRecoveryV129` with schema `receiz.proof-value-public-sale-recovery.v129`, that complete `sourceArtifact`, `applicationId`, `audience` and `domainId`. `verifyReceizProofValueSaleRecoveryV129` opens the enclosing source through the existing pinned-root domain replay reader, rechecks payment/delivery, identity/capability signatures, issuer state/revocation, reducer/history and commit receipts, then issues read-only runtime evidence. It does not issue committed custody.
9. Attach the already sealed `publicRecovery` to the original committed runtime evidence. `exportReceizProofValueSaleRecoveryV129` verifies that public source and compares its completed sale to the original runtime sale before exporting exact public recovery bytes. A receiver verifies those bytes again, then passes the returned SDK-issued evidence in `sales` with the admitted delivered asset's source to projection/sampling/replay export. Duplicates become one completed sale.

The old recovery containing a private Receiz Key remains unavailable for public export. The implemented public producer composes existing public identity projection, signatures, source authorship and verification; it does not redact an old authority artifact or invent a new issuer. Signed fixture mechanics establish this source contract, not live payment or publication.

## Deterministic model samples and offline replay

Call `sampleReceizProofValueV129({ source, ...basis, valuationKaiUPulses })` with 1–256 explicit coordinates. It returns `kind: "recomputed-model-samples"`, the per-coordinate available/unavailable `samples`, separately typed `transactions`, and `writesPerformed: 0`. Sample the same admitted source, head, policy and conversion basis at each coordinate. Identify chart points as recomputed model samples. Keep actual sales and transfers separately typed for overlays. Warm caches, sample order, prior calls, randomness, session state and an implicit current time cannot change a coordinate's canonical value or digest. The calculator's memo tables are bounded at 256 entries.

`exportReceizProofValueReplayV129({ source, ...basis, valuationKaiUPulses })` exports the exact public proof and admitted history needed for the value, selected policy/checksum, evaluation/sample coordinates, conversion basis, transaction references and expected canonical digests. `verifyReceizProofValueReplayV129(unknown)` returns `status: "verified-replay"` with recomputed samples or `status: "invalid-replay"` with its exact code, always `writesPerformed: 0`. The receiver verifies enclosing proof/history with the existing pinned SDK verification roots before recomputation. A recomputed checksum on unverified JSON is insufficient. The replay identifies the SDK-pinned Signature-V4 roots by digest and key IDs; carried root JSON cannot override those roots. Source artifact/payload digests, admitted history head and every expected sample digest must match. Replay is bounded to 64 MiB canonical bytes and 256 sale recoveries.

Public source replay includes verified public sale recoveries produced through the flow above. A recovery that contains private identity key/account custody cannot be exported as public replay; it fails explicitly rather than redacting or resealing that stronger source. Historical missing sale joins or signed issuer-state references remain explicit unavailable boundaries. Exclude private keys, tokens and private conversation history.

## MCP read-only adapters

| Tool | Actual input and SDK function |
| --- | --- |
| `receiz_proof_value_inspect` | `artifactReference`, explicit `valuationKaiUPulse`; calls `projectReceizProofValueV129`. |
| `receiz_proof_value_sample` | Same `artifactReference`, 1–256 explicit `valuationKaiUPulses`; calls `sampleReceizProofValueV129`. |
| `receiz_proof_value_replay_verify` | `replayReference`; calls `verifyReceizProofValueReplayV129`. |

References identify digest-bound local workspace files. The host verifies the complete enclosing artifact and admits portable history where carried; model-supplied metadata, source/runtime or sale JSON is rejected. Optional `saleRecoveryReferences` are exact workspace JSON files verified by the SDK before they become sale evidence. Inspection/sampling accept the actual `policy`, `rarityPolicy`, `marketReferenceRule`, `usdBasis`, `askingPricePhiMicro`, expected digest/head and `includeReplay` fields. `includeReplay: true` returns `{ projection, replay }` only when the projection/samples are available, with the SDK's complete public replay and no file write.

MCP bounds each input file to 64 MiB, arguments to 256 KiB, samples/recoveries to 256 and output to 8 MiB. Oversized output fails without truncating proof or trace. No network, clock-based evaluation, custody, payment or approval write is performed by these readers. Full-library availability and the reviewed restricted profile remain separate inventories.

Browser, Node and MCP must use the same SDK calculation and admission boundaries. MCP inspection, sampling and replay verification are read-only compositions beneath the complete proof. A descriptor list or fixture-forwarding result establishes discovery or forwarding only; qualification records actual offline replay, mutation rejection and platform parity separately from live service evidence.
