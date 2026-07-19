# Generated-File Repair

Receiz-owned generated files carry `@receiz-generated` or the
`receiz.generated-files.v1` manifest. Preview regeneration, compare the digest,
and request confirmation before writing.

Automatic edits are limited to generated files, approved `package.json` fields,
and explicit generated blocks. Unmarked source becomes a manual action. Preserve
the declared owner of every Receiz-generated file. `receiz.extensions.ts` is always
developer-owned and must never be overwritten, regenerated, or adopted by Receiz.
Preserve all unrelated code. Reject traversal, symlink escape, stale previews, and content
whose digest changed after review.
