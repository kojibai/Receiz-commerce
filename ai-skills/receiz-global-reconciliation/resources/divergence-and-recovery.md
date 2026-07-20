# Divergence and Recovery

Classify verified history relationships structurally:

- same scoped command: `idempotent`, original receipt, no new writes;
- same artifact accepted through another command: `already-accepted`, no invented receipt/effects/idempotency success;
- local verified descendant: one atomic `accepted` command;
- remote verified descendant: `remote-ahead`, no mutation;
- sibling branches: `SIBLING_BRANCHES`;
- conflicting target namespace: `TARGET_NAMESPACE_CONFLICT`;
- no verified common predecessor: reject.

Never auto-merge, rebase, use last-write-wins, or use Chronos to choose a branch.

For `COMMIT_OUTCOME_UNKNOWN`, retain the original idempotency key. Retry the identical operation or call `resolveReconciliationAttempt`. Do not create a new attempt identity for an unknown prior outcome.
