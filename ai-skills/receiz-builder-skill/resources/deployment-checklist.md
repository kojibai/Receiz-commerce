# Deployment Checklist

Use this before claiming a Receiz app is ready.

- Run the generated app build and lint checks.
- Run Receiz SDK local conformance when SDK proof handling changed.
- Run `receiz doctor` or the SDK `doctor()` rail for tenant wiring when app setup is in scope.
- Confirm public store/app-state first paint resolves without a private session when the surface is public.
- Confirm delegated actions require explicit user confirmation where they append, publish, transfer, or settle.
- Confirm no generated database table is treated as final authority.
- Confirm verify links, source links, ownership/custody state, and proof rows remain visible.
- Confirm offline or local proof routes project known truth before sync.
- Confirm failure states say what is missing and never claim proof that did not verify.
