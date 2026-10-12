# Receiz Commerce 5.5.0 / Receiz v129

The app pins the published `@receiz/sdk`, `@receiz/mcp-server` and `@receiz/ai-skills` packages at `129.0.0`. Their npm integrity values are retained in the lockfile and the new migration record. No upstream Receiz code, credentials, historical migration records or payment recovery coordinates are changed.

The active app contract and generated boundaries use the SDK's complete 60-operation matrix. The full installed MCP inventory contains 356 tools. The 43-skill local mirror matches the published v129 package bytes; constitutional ruleset `127.0.0` remains a separate coordinate. The app's current-package law advances to v129, while prior release evidence stays in Git and the existing migration records.

## Payment boundary

New native payments now use the exact registered `RECEIZ_CLIENT_ID` for both application and audience, preserving case, underscores and hyphens. V129 accepts Receiz's registered `rc_` client format. The previous separate `receiz-commerce-kit` binding was incorrect for the registered native-session flow. A retained original attempt still uses its original application coordinate; this upgrade does not relabel its source or recovery.

In-app buyer and billing consent now requests `receiz:subjects.write` in addition to the existing Reserve/domain scopes. After the exact purchase consent and participant verification, the existing custody wrapper publishes the held subject source with a null session handle before opening the native session. Publication failure prevents session opening, staging and execution. The qualifier uses the SDK's actual `source-publication` and `durable-execution` families, and staging and execution independently require durable execution readiness. Registration and explicit consent still control the granted scopes.

The new declared `@receiz/sdk/valuation` entrypoint supplies proof valuation, completed-sale verification and portable replay. These operations are local and read-only. They do not prepare a Reserve debit, supply missing participant sources, create card payments, refund a split or grant hosting access.

The published v129 completed-sale contract joins an admitted Settlement payment and accepted asset delivery under one atomic operation. Its public recovery excludes private identity files. A Reserve/card checkout must not be relabeled as that completed sale, and existing Reserve recovery remains on the SDK's explicit Reserve send/receive path.

Automatic preparation of a first Reserve purchase, merchant history recovery without retained coordinates, abandoned split compensation and live acceptance remain pending. The embedded card checkout, monthly renewal, complete original Reserve attempt retention and source verification continue through the installed SDK. A package upgrade alone is not end-to-end payment evidence.

## Checks and rollback

Run `pnpm test`, `pnpm typecheck`, `pnpm receiz:check`, `pnpm receiz:release-lock`, `pnpm validate:ai-skills`, `pnpm lint` and `pnpm build` to verify the coordinated migration and retained app behavior. The official scanner's published-document findings are reviewed only at exact documented file paths and while their bytes match the installed package; application findings remain blocking.

Local verification on 2026-10-11 passed: 916 tests across 197 suites, TypeScript, lint, SDK inspection, migration/release lock, all 43 AI skills, frozen-lockfile installation, production build and the tracked-file secret scan. Lint retains the existing image warning, and the build retains the installed SDK worker dependency warning. Chrome loaded the rebuilt local admin permission screen with the styled file picker and zero passphrase inputs before consumption. No Identity Seal was submitted, financial operation executed or deployment made during this verification.

To roll back, restore the prior app commit and install its frozen lockfile. Keep all user-held proof objects and original payment coordinates; never replan an unresolved payment or rewrite a historical artifact during rollback.
