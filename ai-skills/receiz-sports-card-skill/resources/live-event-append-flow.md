# Live Event Append Flow

Live event proof appends to a sports card or related witness object.

## Flow

1. Identify card proof identity or witness ID.
2. Resolve existing card history.
3. Verify event source through `receiz_pitch_proof_by_witness_id`, `receiz_card_history`, or SDK sports rails.
4. Present the event as an append to memory.
5. Do not rewrite the base card.

## Write Boundary

Appending a live event is a proof write. Require user confirmation, scoped delegated access, and the exact card or witness identity before action.

## Output

Report event time, witness identity, event type, append target, and verification status.
