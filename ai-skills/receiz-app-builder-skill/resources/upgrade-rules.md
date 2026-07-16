# Upgrade Rules

Compare the repository, contract, installed SDK/MCP/AI-skills versions, and
target SDK version. Keep findings deterministic and version-aware.

- Preserve valid historical proof objects.
- Never rewrite witnessed history.
- Append missing truth.
- Rebuild incorrect projections from stronger verified truth.
- Align package versions and reject published `workspace:` dependency ranges.
- Re-run tarball installation and conformance after upgrades.
