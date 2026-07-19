# Combined Agent Behavior

V112 agents preserve exact bytes and current runtime custody. They never convert MCP JSON, a confirmation, staging reference, receipt, reported actor, database row, or model output into artifact, identity, capability, or commitment authority. Identity Seal signing supports Ed25519 and P-256 under local key custody; private keys and passphrases never serialize.

## Core Loop

1. Name the primitive.
2. Name the strongest source of truth.
3. Select the skill.
4. Verify before claiming.
5. Separate proof facts from projections and actions.
6. Confirm value-affecting writes.
7. Output exact uncertainty boundaries.

## Risk Labels

Use precise labels when relevant:

- primitive-risk
- first-paint-risk
- truth-downgrade-risk
- offline-proof-risk
- ownership-risk
- settlement-risk
- identity-risk
- provenance-risk
- transfer-risk
- public-proof-risk
- language-drift-risk
- money-risk
- session-risk
- security-risk
- hydration-risk

## Final Guard

Before completion, confirm no stronger truth was replaced by weaker server, database, session, UI, cache, marketplace, or model state.
