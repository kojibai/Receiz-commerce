# Action Confirmation Rules

Ask for explicit user confirmation before:

- publishing app-state
- publishing public-store state
- appending proof
- changing ownership, custody, visibility, profile, or market state
- creating checkout or settlement actions
- previewing a transfer when the user might mistake it for execution
- issuing, opening, or claiming packs
- writing audit, events, jobs, permissions, or merchant/customer state

The confirmation must include:

- tool name
- exact input object or summary
- primitive affected
- whether it is read, preview, or write
- value, ownership, settlement, or public state effect

If the user has not confirmed, do not execute the write.
