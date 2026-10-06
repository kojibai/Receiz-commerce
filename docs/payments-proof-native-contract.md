# Receiz payment implementation contract

SDK, MCP and AI skills are pinned to 128.0.0. Active ruleset 127.0.0 has registry digest `8d0b5b839d02d9efbd4306cc99410595a183705c2670b76d2567eaaaade99065` and operation matrix digest `940c316b5b7d6212240e699d03b3c1fd419cbbecc6ee51ddd7aa7783d9e523b0`.

## Authority and custody

The complete sealed proof object carries identity, ownership, admitted value and witnessed history. Exact source bytes must be independently reopened and admitted in the current SDK runtime. UI state, wallet responses, signed checkout continuations, OAuth capabilities, receipt JSON and in-memory events are projections or coordination material. They cannot create spendable Reserve, ownership, paid orders or account entitlements.

Memory Crystals carry source and predecessor continuity. Recovery opens complete held source families, verifies each enclosing source, preserves sibling branches and unknown namespaces, and rebuilds projections beneath that history. It does not choose a newer database row or timestamp as truth. A JSON export is not a sealed Memory Crystal.

No external database, storage client, payment-provider SDK or new dependency is added. The Receiz SDK owns the integration boundary. Browser ledgers hold subordinate coordinates. Reserve continuation transport additionally carries the complete SDK recovery encrypted with the existing server secret, preserving original source bytes across a reload. The encrypted envelope itself grants no authority: each use must independently reopen both edges through the SDK. Runtime sessions and handles remain in the existing trusted-host custody coordinator, and signing keys and passphrases stay local.

## Account entry

Merchant and customer entry stays on the application domain. Create or restore the actual Identity Seal locally. Remote permission uses `createReceizProofAuthorityChallenge` and `identity.exchangeProofAuthority` after exact-byte edge verification and explicit in-app consent. Keep the short-lived non-refreshable capability in runtime custody. Do not navigate or open a popup to receiz.com, persist a bearer as identity, or reinterpret an OAuth cookie as proof authority.

## Purchase and upgrade

Bind the admitted product quote to its published seller; platform upgrades bind the receiver to the operator's configured `RECEIZ_PLATFORM_USERNAME` (`bjklock` on the original deployment). An independent fork configures its own receiver. Derive Reserve funding from the admitted Reserve source and its canonical display-price basis, preserving exact Phi quantity and source/destination heads. An HTTP wallet summary is insufficient input to an edge value transfer.

Use `value.edge.planReserve`; inspect the identical SDK-issued plan at sender and receiver; verify its complete transition set; prepare its exact commit set; atomically commit all participant transitions or none. Preserve the precise plan before exposing a card delta or attempting execution. Build canonical recovery only from SDK-issued committed transitions; independently call `confirmReserveSend` and `receiveReserve` for the same application, participants and intent. Global synchronization follows edge settlement and is additive.

A split purchase requires a bound card effect and a finite cancellation/compensation policy. A created session or paid card leg alone cannot become a completed order. Ambiguous delivery resolves the same semantic idempotency coordinate before retry; it cannot replan or create another charge.

Admit order, fulfillment and account-access successors only from verified completed payment history. Deliver the complete reverified successor to customer and merchant custody. Physical fulfillment remains a merchant action; digital delivery carries the actual entitled artifact or access grant. Expiry and renewal follow carried policy and admitted Kai evidence; Chronos display dates cannot authorize a plan.

## Evidence required for completion

Reject altered enclosing bytes, wrong owners or receivers, missing heads, source substitution, partial participant commits, replayed delivery, fabricated paid responses and card/Reserve mismatches. Reopen the saved exact successor with an independent verifier and restore orders and paid access without a database. Run SDK/MCP conformance, mutation/replay tests, compatibility and release lock. Sandbox conformance is not live settlement evidence.

The ChatGPT marketplace connector and direct Receiz MCP are separate hosts. The direct host was independently inspected on 2026-10-06: its existing configuration also selects `marketplace-nonfinancial`, and its runtime qualification reports `V124_MCP_APPLICATION_ID_REQUIRED`. It successfully inspects this local app repository. These host-specific findings do not restrict the SDK's existing app-side edge operations or imply an SDK update. No live charge or transfer has been executed by this task's tools.

## App Reserve composition

The current application accepts a complete prepared Reserve transition set, original price basis and locally signed consent through an in-app file chooser. The preparation is canonically reopened, reproduced by the existing SDK planner and bound to the original payer, receiver, amount, tenant and semantic idempotency key before mutation. SDK-issued session, plan and handle custody remains in `src/lib/receiz/v124/production-runtime.ts`. Reserve must independently recover at sender and receiver before the card remainder can start. No card session is created for Reserve-only payment.

A submitted or ambiguous Reserve attempt is looked up before any retry; the original plan is never restaged by recovery. Card-session failure retains the exact committed Reserve recovery and retries only the original card key. Checkout and billing continuations carry updated recovery, including the current and preceding service month when relevant. Transport capacity is checked before payment mutation.

Automatic preparation from the buyer’s held value source and merchant receiving source, native private order and entitlement journals, finite compensation and live acceptance remain unfinished. A legacy account export, wallet USD projection, signed continuation or passing unit test cannot fill those boundaries.
