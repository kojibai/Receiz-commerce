---
name: receiz-attestation-lifecycle
description: Use when building or verifying generic Receiz attestations, credentials, selective presentations, holder-presence ceremonies, subject coordination, or typed external execution.
---

# receiz-attestation-lifecycle

## When To Use This Skill

Use this skill to compose the generic v125 attestation and credential lifecycle from a verified domain-authority artifact, or to verify a portable credential presentation without exposing private proof material.

## When Not To Use This Skill

Do not use it to invent an application-specific issuer, accept a self-authored role grant, treat an MCP reference as proof, or replace a sealed Receiz object with a database, provider, session, or model representation.

## Core Receiz Laws

- Verify the enclosing sealed proof object before parsing any claim, evidence, credential, presentation, presence, or outcome payload.
- Follow `source → evidence → relationship → permissible inference → representation`; never backward.
- Bind every application, evidence, evaluation, approval, issuance, lifecycle, presence, consent, and execution append to its exact accepted head and lawful KKS coordinate.
- Report credential validity, currentness, and holder presence separately.
- A presentation, QR code, NFC handoff, MCP response, provider receipt, database row, and server response are subordinate representations.
- Never treat a database, server, marketplace, UI, model response, or cache as final authority.

## Required Behavior

1. Resolve the sealed domain-authority artifact and verify its grant history before accepting a role.
2. Resolve every evidence reference through trusted custody, verify the enclosing artifact, then admit only its verified subject, custody, content, and head bindings.
3. Plan mutations first and require the exact confirmation digest before apply.
4. Verify causal Kai ordering and exact predecessor heads at every transition.
5. For selective presentation, expose public claims plus explicitly consented selective claims; keep private claims commitment-only.
6. For holder presence, bind the PBI/Receiz-ID proof to the exact verifier, credential proof object, accepted head, presentation, disclosure set, consent, nonce, and expiry.
7. For external execution, accept only a verified terminal mapping. `pending` and `unknown` are never success.

## Forbidden Behavior

- Never put sealed artifact bytes, private claim values, private keys, recovery material, access tokens, or raw provider evidence into model context.
- Never accept a bare digest, bare Kai number, filename, display copy, or self-hashable embedded namespace as authority.
- Never let revocation rewrite historically lawful earlier events.
- Never collapse credential validity, currentness, and live holder presence into one boolean.
- Never fabricate proof, approval, NFC/tap capability, provider delivery, or production success.

## MCP Usage Rules

Use only the `receiz_v125_*` trust tools named in the manifest. Pass opaque `proofReference` values; the trusted host retains exact bytes and private evidence. For a mutation, call once for the preview, show the user the exact intended operation, then repeat with the returned `confirmationDigest`. If the tool reports `unavailable`, name the missing boundary and stop.

## SDK Usage Rules

Use the canonical SDK exports for domain parsing, application/event verification, credential lifecycle/currentness, PBI ceremony, selective presentation, subject coordination, and external execution. A callback or transport adapter may supply custody mechanics, but it cannot redefine verification or authority.

## Output Format

Report:

- enclosing proof verification result;
- exact proof-object ID and accepted head;
- operation and Kai coordinate;
- writes performed (`0` or `1`);
- credential validity, currentness, and holder presence as separate fields when relevant;
- missing capability boundary instead of inferred success;
- authority statement naming the sealed Receiz proof object as stronger truth.

## Safety And Security Boundaries

MCP and AI Skills are representations. They may locate opaque proof references, invoke canonical Receiz verification, and project safe results. They never receive authority by being callable and never authorize publication, deployment, production mutation, or disclosure of private material.

## Examples

- [Domain-neutral membership definition](examples/domain-definition.ts)
- [Selective credential presentation](examples/selective-presentation.ts)
- [Typed external execution](examples/external-execution.ts)

## Execution boundaries

For the stdio executable, configure `RECEIZ_APPLICATION_ID` and
`RECEIZ_V125_TRUST_HOST_MODULE`. The host module supplies
`createReceizV125TrustHostConfiguration`; the executable binds that configuration
to the canonical SDK dispatcher and its exact client/audience.

`subjectCoordination.planMessage` and `applyMessage`, and their two MCP names,
currently support the source-bound thread `close` effect. They admit the complete
sealed thread/source family and exact Identity/PBI authorship, preserve historical
source bytes, and atomically check participant heads and consume PBI at append.
Encrypted message effects are unsupported and must remain rejected.

The four external-execution MCP operations call the SDK plan, execute/recover,
and outcome verifier. No delivery occurs before exact preview consent. The
provider receives the privately held request with its exact plan/delivery identity.
Pending or unknown evidence is nonterminal and performs zero outcome writes.
A retry requires a fresh host confirmation and preserves the same idempotency
identity; terminal outcome recovery does not repeat provider delivery. Provider
responses and outcome projections never replace enclosing sealed source proof.
