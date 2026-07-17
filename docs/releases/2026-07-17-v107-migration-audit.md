# Receiz v106 to v107 migration audit

Date: July 17, 2026

The official `receiz migrate v106-v107 --dry-run` command was run through the repository's source-only verifier. Generated build, test, package-store, coverage, distribution, output, and temporary trees were excluded so the migration plan is deterministic and cannot be changed by unrelated local artifacts.

- Source version: `106.0.0`
- Destination version: `107.0.0`
- Plan digest: `300409f203001447b97ef6782028e75a34071eebb4d245829e951b50f7b9abce`
- Blocked: `false`
- Safe changes proposed: `0`
- SDK write dispositions accounted for: `73`
- Pending outbox entries: `0`
- Writes performed: `0`
- Existing proof history was not rewritten.

All sealed-artifact, canonical-receipt, and proof-head digests were identical before and after the dry-run projection. No apply state was fabricated because the plan contained no source rewrite. Recovery remains roll-forward from a verified checkpoint, and a queued offline command remains a signed proposal rather than a global commitment.

The reviewed machine-readable attestation is `receiz.migration.v106-v107.json`. Sealed Receiz proof objects remain stronger truth than the migration report, SDK, MCP, server, database, session, AI, or UI projection.
