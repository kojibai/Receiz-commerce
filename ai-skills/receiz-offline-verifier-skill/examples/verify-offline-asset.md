# Verify Offline Asset

## Agent Steps

1. Label the local input as `payload` or `sealed artifact` and preserve its exact bytes.
2. Identify the enclosing proof boundary.
3. Run SDK `artifacts.verifyAndOpen(file)` on the complete sealed artifact; use `receiz_inspect_offline_file` only for manifest shape inspection.
4. Report exact pass or failure.
5. Avoid network dependency unless comparison is requested.

## Output

```md
Artifact:
Verification result:
Source of truth:
Failed boundary:
Network required:
```
