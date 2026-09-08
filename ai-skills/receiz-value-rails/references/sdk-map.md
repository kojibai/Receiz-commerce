# SDK map

- `client.value.edge.planSettlement`
- `client.value.edge.planReserve`
- `client.value.edge.inspect`
- `client.value.edge.verifyTransitionSet`
- `client.value.edge.prepareCommitSet`
- `client.value.edge.createRecovery`
- `client.value.edge.confirmSettlementSend`
- `client.value.edge.receiveSettlement`
- `client.value.edge.confirmReserveSend`
- `client.value.edge.receiveReserve`
- `client.execution.exportCommittedRecovery`
- `client.value.quoteDisplayUsd`
- `client.value.validateDisplayPrice`
- `client.value.validateIntent`
- `validateReceizExecutionReceiptV122`

`amountPhiMicro` is the only moved quantity. The display quote is pinned but subordinate. Every edge method is local and canonical; the server/database may synchronize the resulting recovery but cannot originate or redefine the transaction.
