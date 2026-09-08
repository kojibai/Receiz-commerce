# Examples

## Settlement

Use `client.value.edge.planSettlement` with `amountPhiMicro`, the Settlement proof object/head, destination subject/head, idempotency key, attempt identity, and canonical price basis. Sender and receiver inspect the exact plan. Verify the portable transition set, prepare and atomically commit the participant set locally, create one recovery, then call `confirmSettlementSend` and `receiveSettlement` at the respective edges.

## Reserve

Use `client.value.edge.planReserve` with the Reserve proof object/head and the same exact bindings, then use `confirmReserveSend` and `receiveReserve`. Do not convert this into Settlement or a generic balance.

## Prohibited

Do not accept `amountUsdCents` as movement authority. Do not update a USD display independently of the pinned Phi receipt. Do not let a server or database create, approve, price, or redefine the transaction. Do not commit only one participant.
