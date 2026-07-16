# Authority Boundaries

- Inspection reports repository evidence. It proves no artifact bytes.
- Verification validates the sealed proof object's integrity, owner, namespace,
  and continuity through the SDK verifier.
- Publication appends an authenticated projection; it does not create ownership
  or settlement by implication.
- Settlement requires the implemented settlement primitive and appropriate
  delegated or identity-proof authority.
- Proof creation requires a real authenticated Receiz ID and native Record
  before Seal continuity.

When authority is unavailable, return
`blocked_missing_capability_or_authority`. Never synthesize a Receiz ID, owner,
namespace, prior head, scope, token, proof ID, verification, or settlement.
