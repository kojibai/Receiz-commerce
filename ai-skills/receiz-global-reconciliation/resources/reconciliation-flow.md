# Reconciliation Flow

Use `client.coordination.remoteDomain({ namespace, commitDomain })`. Supply the player's returned Connect access token to `createReceizClient`; never read it from an environment variable.

Call `planOfflineReconciliation` with the stable artifact ID, selected admitted `issuerKeyId`, discriminated expected accepted head, exact sealed artifact, optional runtime-custodied local history, optional reporting receipts, and idempotency key. Receipts may add `LOCAL_RECEIPT_INCONSISTENT`; they cannot invalidate verified artifact truth.

Sign only `prepared.capabilityPayload` with `client.identity.signCapability`. Then call stage with the exact plan, signed capability, exact artifact, and stage confirmation. Commit with the exact plan, signed capability, returned immutable staged reference, and commit confirmation.

The convenience `reconcileOffline` call is lawful only when it receives an explicit `authorize(payload)` callback and performs these same boundaries.
