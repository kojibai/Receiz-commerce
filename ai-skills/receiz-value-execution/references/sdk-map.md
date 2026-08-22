# SDK map

- `client.value.executeSettlement(intent, authority)` executes a Settlement intent once.
- `client.value.executeReserve(intent, authority)` executes a Reserve intent once.
- `client.value.executionByIdempotencyKey(key, authority)` recovers the exact `committed`, `zero-write`, or `unknown` outcome.
- `client.auth.grantedScopes(authority)` returns the granted OAuth/OIDC scope set.

Persist the canonical intent before execution. After an ambiguous response, look up the idempotency key before any retry and never manufacture a replacement plan.
