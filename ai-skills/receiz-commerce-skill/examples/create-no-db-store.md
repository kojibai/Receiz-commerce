# Create No-Database Store

Use complete verified product proof objects as the source of rendered products. Public store state transports or projects beneath those objects.

## Agent Steps

1. Use `receiz.publicStore.resolve` or `receiz_public_store_resolve`.
2. Verify product proof objects referenced by the store projection.
3. Render deterministic product shells from verified truth.
4. Use background sync only to append verified additions.
5. Do not introduce a database as product authority.

## Required Statement

State that the store is no-database because product truth lives in Receiz proof objects and public store append rails.

## Registered native setup

Follow the [registered native session example](../../receiz-proof-authority/examples/registered-native-session.md). The exact registered OIDC client ID is `RECEIZ_APPLICATION_ID`, never the subject's Receiz ID, username, or secret. Keep client secrets server-side. Obtain device-held consent and minimum scopes, publish the current complete sealed subject source, open the bound session, and qualify the actual used operations and their live dependencies. Known verified products paint immediately while verified additions append behind them.

## Separate purchase stages

1. Prove seller publication is visible to a different authenticated buyer. Verify seller custody and current availability; the listing purchase action must become usable. Reject an unavailable or stale reservation before payment when the purchase route requires it.
2. Present the actual quote and obtain approval for its exact payment intent. Use the existing Settlement/Reserve execution rail and its authenticated outcome/recovery path. A wallet read or display price is not payment.
3. For insufficient funds, calculate the actual shortfall and open the real hosted card checkout with `client.connect.checkout(...)`. After return, use `client.connect.checkoutSession(...)` and `client.connect.wallet()` as transport observations, then verify the actual admitted reserve-credit proof event and wallet credit. Resume quote review and approval only after that credit is established.
4. Prove the actual payment, seller proceeds, and delivery of the complete bearer artifact separately. Open it with `client.artifacts.verifyAndOpen(file)`, pass its SDK-issued `sealedArtifact` to `client.ownership.claimBearerAsset({ artifact: opened.sealedArtifact })`, and verify the returned complete sealed successor, buyer custody, and purchased asset use. Preserve the stable object identity, provenance, prior history, and unknown namespaces.
5. Exercise concurrent buyers, stale custody, reload, retries, and lost responses. Resolve the existing idempotency coordinate before retrying an unknown result; never allow duplicate funding, payment, or delivery, or duplicate ownership. Require applicable zero-write failures before unauthorized mutation.

A successful card checkout alone does not establish an asset purchase or ownership transfer. `client.commerce.oneClickCheckout(...)` creates a card session; when wallet funds would be applied, it returns `wallet_settlement_execution_required`, applies zero wallet funds, and makes no card request. Historical commerce adapters require the explicit compatible host; sandbox checkout is fixture evidence only.

Record a live integration result for each stage using a newly registered client and a separate buyer. Generated configuration, inventory membership, and passing fixture tests do not establish deployed support. Mark any untested server/database, funding, payment, bearer delivery, claim, or use stage explicitly.

## Full MCP financial adapters

The full MCP library supports financial workflows; only the reviewed ChatGPT Marketplace plugin profile is restricted to nonfinancial operations. Use the exact full-library adapter appropriate to the source primitive:

- `receiz_commerce_one_click_checkout` calls `client.commerce.oneClickCheckout(...)` with the card-session and zero-wallet-settlement boundary above.
- `receiz_connect_wallet`, `receiz_connect_checkout`, and `receiz_connect_checkout_session` provide actual wallet observations and shortfall card-session creation/status. `receiz_connect_transfer` calls the existing delegated wallet-transfer route; it does not substitute for canonical value admission.
- `receiz_payments_embedded_checkout` creates the existing named-merchant card session, keeping its embedded credential private. `receiz_connect_note_download` preserves and verifies the exact sealed PNG privately; download does not issue or claim a note.
- `receiz_bearer_artifact_claim` accepts an `artifactReference`, verifies the complete enclosing source, and retains its SDK-issued sealed object during preview. Repeat the exact reference with the returned single-use `confirmationDigest` as `confirmation` after approval; execution uses `ownership.claimBearerAsset`, re-verifies the returned sealed successor, and retains the exact private artifact.
- `receiz_v123_value_execute_settlement`, `receiz_v123_value_execute_reserve`, and `receiz_v123_value_execution_by_idempotency` compose the separate canonical rails and lookup-before-retry recovery.
- `receiz_v125_edge_value_plan_settlement`, `receiz_v125_edge_value_plan_reserve`, `receiz_v125_edge_value_plan_inspect`, `receiz_v125_edge_value_transition_set_verify`, `receiz_v125_edge_value_commit_set_prepare`, and `receiz_v125_edge_value_recovery_create` retain the existing plan and same-runtime proof custody.
- `receiz_v125_edge_value_settlement_send_confirm`, `receiz_v125_edge_value_settlement_receive`, `receiz_v125_edge_value_reserve_send_confirm`, and `receiz_v125_edge_value_reserve_receive` independently reverify the exact recovery at the respective user edge.

See the [full financial tool map](../../receiz-mcp-agent-skill/resources/full-financial-tool-map.md) for exact arguments, scopes, merchant admission, confirmation, and private output, and the [economy tool map](../../receiz-mcp-agent-skill/resources/v125-economy-tool-map.md) for edge refs. The current bearer adapter composes the canonical SDK artifact-claim path above; historical V120 instrument tools and retired aliases are not interchangeable with it. The disabled legacy `connect.mintNote(...)` route returns `wallet_note_receiving_seal_required` and has no current MCP mint adapter. Legacy token-only SDK note claims have no current direct MCP adapter because there is no enclosing-note-bound SDK projector; a regex extractor cannot create authority. An inventory entry alone never invents execution or deployed success.
