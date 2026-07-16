# Verify Post

Treat a Receiz post as public proof only when it carries proof object identity, public proof record, provenance, source URL, verification affordance, or admitted local truth.

Use `receiz_asset_by_url` or SDK `publicProof.byUrl` to resolve public proof rails, then SDK `verification.verifyArtifact(file)` for verification. If the post is visible only as a UI projection, report that the public proof surface still needs proof-object continuity evidence.

Never claim global visibility or canonical profile truth from an owner-only view or DB row alone.
