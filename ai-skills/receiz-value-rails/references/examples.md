# Examples

## Settlement

Use `planSettlement` with `amountPhiMicro`, the Settlement proof object/head, destination subject/head, idempotency key, and canonical price basis. Execute it atomically with the world transaction.

## Reserve

Use `planReserve` with the Reserve proof object/head and the same exact bindings. Do not convert this into Settlement or a generic balance.

## Prohibited

Do not accept `amountUsdCents` as movement authority. Do not update a USD display independently of the pinned Phi receipt. Do not commit the value rail separately from its world event.
