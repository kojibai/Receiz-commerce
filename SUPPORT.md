# Support

Use GitHub issues for public bugs, docs gaps, and feature requests.

Use private security reporting for vulnerabilities. See `SECURITY.md`.

## Before Filing

Check:

- `README.md`
- `docs/DEVELOPER_KERNEL.md`
- `docs/SDK_RAILS.md`
- `docs/PRODUCTION_READINESS.md`
- `docs/OPEN_SOURCE_RELEASE.md`

Run diagnostics when relevant:

```bash
pnpm receiz:doctor
```

The doctor prints SDK version, scopes, callback URL, tenant host, missing rails, warnings, and capabilities without printing token values.

## Useful Issue Details

Include:

- Route or feature.
- SDK rail involved, if known.
- Local or deployed environment.
- Expected behavior.
- Actual behavior.
- Reproduction steps.
- Verification already run.
- Screenshots for UI issues.

Never paste secrets, access tokens, webhook secrets, identity key files, or private identity artifacts into issues.
