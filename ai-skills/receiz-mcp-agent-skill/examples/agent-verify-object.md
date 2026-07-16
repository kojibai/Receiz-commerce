# Agent Verify Object

For a public URL, call `receiz_asset_by_url`. For a local manifest, call `receiz_inspect_offline_file` and report that `verified` remains false. Use SDK `verification.verifyArtifact(file)` when artifact bytes must receive the integrity-and-continuity verdict. If the tool is unavailable, state that live verification was not performed.
