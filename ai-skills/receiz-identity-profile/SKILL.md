---
name: receiz-identity-profile
description: Use when checking username availability or updating a Receiz profile through the authenticated same-account v111 operation.
---

# Receiz Identity Profile

Preserve the admitted Receiz account. A profile update changes that account's projection; it never selects or replaces the active identity.

## Exact SDK operation

Use `identity.checkUsernameAvailability` only as an advisory read. Submit the profile patch directly through `profile.update`.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const availability = await receiz.identity.checkUsernameAvailability(nextUsername);
if (!availability.available && !availability.isCurrent) throw new Error("username_taken");

const result = await receiz.profile.update({
  username: nextUsername,
  displayName,
  bio,
});
if (result.accountUid !== authenticatedAccountUid) throw new Error("profile_identity_mismatch");
```

The returned `accountUid` must equal the authenticated session or OIDC actor UID. The same neutral SDK operation handles a username-only change and a full profile update.

## Required authority

Treat accepted Receiz identity proof plus the admitted same-account binding as the identity primitive. Receiz.com applies the patch to that admitted account. Keep SDK, MCP, and AI beneath those primitives.

Do not require an identity-key projection, choose a latest server key, read a caller proof head, or ask another rail which identity is active. A database or session projection may refresh after commitment; it cannot redefine the actor.

## Required admission

Require the signed-in Receiz session or delegated `profile` scope. Derive the actor from that authenticated session or OIDC token. Do not accept an account UID inside the profile patch.

## Deterministic behavior

Treat username availability as advisory. Let commit-time username uniqueness decide the winner, then require the returned same-UID profile and public path. Do not release the prior username before the replacement commits.

## Offline behavior

Preserve known local identity truth immediately, but do not report an offline profile proposal as saved. Run the authenticated profile operation when service is available; background work may refresh projections only after commitment.

## Conflict behavior

On `username_taken`, keep the same account and request another username. Preserve truthful validation and service errors. Never translate a missing projection or unrelated failure into an identity mismatch.

## Result verification

Require `status === "updated"`, an `accountUid` equal to the authenticated actor, the returned profile projection, and a `/u/` profile path. The current v111 outcome has no caller proof-head or receipt prerequisite.

## User confirmation

Show the exact profile fields and username consequence before mutation. Do not request or display an identity key, caller head, claim key, or receipt as authority for this update.

## MCP parity

Call `receiz_identity_profile_update_plan` with `{ profile }` only. Show the plan consequences, require the exact confirmation digest, then call `receiz_identity_profile_update_execute` with `{ planDigest, confirmation }`. The active MCP path calls `client.profile.update(profile)` and verifies the same-UID result; it performs no identity/profile pre-read.

## Emulator fixture

Run `username-race`. Require one commit-time winner, unchanged account UID, and no identity-key dependency. Emulator evidence is simulation evidence, never production verification.

## v111 identity recovery

`canonical-identity` is an identity continuity verdict from a verified enclosing artifact. Use its explicit permitted actions; do not infer publishing or settlement authority. `foreign-owner` and `verified-legacy-read` remain read-only. `admitAndRecover` plans locally and performs no session, network, database, or hidden mutation.

## v111 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission must retain and canonically reverify the exact enclosing artifact bytes under the complete frozen verifier context. Recovery-authoritative history requires explicit independently verified evidence roots and fails closed on divergent verified heads. Canonical identity and `canSign` require enclosing-owner binding, identity-owner binding, key identity, and a domain-separated private-key challenge. Recovery planning re-derives state from verified admission and verified history.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, capabilities, plans, or confirmations cannot authorize a current v111 receiver; re-admit the historical artifact's exact bytes under the current verifier.
