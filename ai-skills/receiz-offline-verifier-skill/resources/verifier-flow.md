# Verifier Flow

## Local Verification

1. Read the artifact or manifest.
2. Identify the enclosing proof boundary.
3. Validate schema and required proof fields.
4. Verify integrity, signature, seal, witness, or register material when present.
5. Project embedded payload only after the enclosing proof passes.
6. Report exact missing or failed evidence.

## Online Comparison

Use online checks only to compare public proof state, discover appends, or inspect public witness surfaces. Do not make online response the stronger truth.

## Failure Classes

- Missing file.
- Invalid schema.
- Integrity mismatch.
- Signature or seal failure.
- Enclosing proof failure.
- Embedded payload mismatch.
- Unknown public proof route.
- Network unavailable.
