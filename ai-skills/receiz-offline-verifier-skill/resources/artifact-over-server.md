# Artifact Over Server

Artifact truth outranks server confirmation.

## Correct Order

1. Verify artifact.
2. Parse proof payload.
3. Project identity, ownership, provenance, or settlement state.
4. Optionally compare to server or public registry.
5. Append verified additions when discovered.

## Incorrect Order

- Ask the database whether a local sealed proof is real before verifying the proof.
- Treat server absence as artifact invalidity.
- Replace artifact proof with session state.
- Call verified local truth cache.

## Agent Reporting

If server and artifact disagree, say which layer is stronger and which projection needs correction.
