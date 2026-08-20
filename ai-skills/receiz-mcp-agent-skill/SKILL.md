---
name: receiz-mcp-agent-skill
description: Use when an agent has or needs Receiz MCP tool access for verification routing, public reads, app-state actions, proof inspection, storefront operations, sports proof inspection, deterministic previews, or delegated writes.
---

# receiz-mcp-agent-skill

Receiz MCP is an agent-callable tool layer beneath Receiz proof truth. It can call SDK/API rails, but it is not a proof authority.

## When To Use This Skill

- Use before calling any `receiz_*` MCP tool.
- Use for tool selection, input validation, output interpretation, action confirmation, auth boundaries, and failure reporting.
- Use when a user asks an agent to verify, inspect, publish, append, build, preview, or resolve Receiz state through tools.

## When Not To Use This Skill

- Do not use when no MCP host exists and the task can be completed from repo files only.
- Do not use for pure SDK app generation unless MCP tools are part of the workflow.
- Do not use to bypass confirmation for write, transfer, settlement, publishing, or append actions.

## Core Receiz Laws

- MCP is not authority; it calls canonical Receiz SDK/API rails and reports source primitives.
- If SDK artifact verification is unavailable, the agent must not pretend verification happened.
- Read-only MCP resolution and inspection may be allowed without confirmation when they do not expose private data; they are not verification.
- Writes require explicit user confirmation.
- Never treat a database, server, marketplace, UI, model response, or cache as final authority.
- Never invent tools, inputs, outputs, ownership, witness IDs, rarity, transfer history, or verification status.

## Required Behavior

1. Choose a tool from [resources/mcp-tool-map.md](resources/mcp-tool-map.md).
2. Validate required inputs before calling.
3. Classify the action as read-only, preview-only, delegated write, settlement-risk, ownership-risk, or public-proof-risk.
4. Ask for confirmation before write or settlement-affecting actions.
5. Interpret output with the authority boundary included in the tool response.
6. Report failures honestly using [resources/response-templates.md](resources/response-templates.md).

## Forbidden Behavior

- Do not call a nonexistent tool.
- Do not infer success from a failed or missing tool call.
- Do not pass empty IDs, guessed hosts, guessed witness IDs, guessed owners, guessed amounts, or guessed rarity.
- Do not run write tools without delegated runtime authority and explicit user confirmation.
- Do not let an MCP result outrank sealed artifact truth, deterministic proof object state, verified local truth, or verified append.

## MCP Usage Rules

Read [resources/safe-tool-calling.md](resources/safe-tool-calling.md) before executing tools. Read [resources/auth-boundaries.md](resources/auth-boundaries.md) before delegated actions. Read [resources/action-confirmation-rules.md](resources/action-confirmation-rules.md) before any publish, append, transfer, checkout, or settlement action.

## SDK Usage Rules

MCP tools wrap SDK rails such as `doctor`, `capabilities`, `appState`, `publicStore`, `publicProof`, `identity`, `wallet`, `sports`, `world`, `proof`, and `sandbox`. Do not describe MCP as a separate SDK. If code is being generated, use SDK imports in the app and MCP only for agent-side resolution, inspection, or operations. Use SDK `verification.verifyArtifact(file)` for the indivisible integrity-and-continuity verdict.

## Output Format

```md
Tool:
Action class:
Inputs used:
Source primitive:
Result:
Authority boundary:
What is proven:
What is not proven:
Confirmation status:
Next safe action:
```

## Safety And Security Boundaries

Agents may acquire scoped delegated access through Receiz Connect/OIDC Authorization Code + PKCE or the MCP delegated-agent setup path when the user consents and provides the required client/authorization inputs. Never print bearer tokens, passphrases, private keys, private identity artifact payloads, or private recovery contents. Use delegated access as permission for scoped SDK/MCP calls, never as proof authority. Stop before destructive or value-affecting actions unless the user explicitly confirms the action and exact inputs.

## Examples

- [Agent verify object](examples/agent-verify-object.md)
- [Agent build app](examples/agent-build-app.md)
- [Agent append proof](examples/agent-append-proof.md)
- [Agent inspect vault](examples/agent-inspect-vault.md)

Resources:

- [MCP tool map](resources/mcp-tool-map.md)
- [Agent operating rules](resources/agent-operating-rules.md)
- [Safe tool calling](resources/safe-tool-calling.md)
- [Auth boundaries](resources/auth-boundaries.md)
- [Action confirmation rules](resources/action-confirmation-rules.md)
- [Response templates](resources/response-templates.md)

## v120 artifact recovery tools

Use exactly `receiz_artifact_verify`, `receiz_artifact_admit`, `receiz_artifact_append_plan`, `receiz_artifact_transition_seal_and_stage`, and `receiz_artifact_transition_commit`. Never put an admission, history, actor, plan, verified capability, candidate, or store in MCP JSON; same-runtime custody is mandatory and exact bytes crossing a process require `reverify-exact-bytes`.

## v121 living-subject contract

Use canonical head → entire proof history → bounded index retrieval → exact primary-object resolution → reasoning → provenance. The 96-object window is working context, never history truncation. AI speech and performance remain non-authoritative. Consequential actions require typed deterministic command admission; meetings, relationships, trades, gifts, and battles require atomic multi-subject transactions. Autonomous execution requires a current digest-bound mandate at lease time. Bearer transfer preserves identity, full history, memory policy, inventory disposition, and unknown namespace bytes while immediately revoking former-owner authority.

Concrete v120 evidence must include: a creature speaking from exact long-form proof memory; absent-owner exploration inside a mandate; a mutual relationship; a bounded autonomous trade; an atomic battle; exact device restoration; queued-action revocation; partition convergence without history replacement; rejection of an AI-invented event; and cross-application subject continuity.
