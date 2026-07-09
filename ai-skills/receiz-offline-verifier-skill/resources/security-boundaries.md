# Security Boundaries

Offline verification may inspect proof, but it must protect private material.

## Never Print

- Bearer tokens.
- Private keys.
- Passphrases.
- Private identity artifact payloads.
- Recovery material.
- Hidden private proof payloads.

## Safe Output

Report hashes, public proof IDs, public URLs, schema names, verification status, and exact failure classes when those fields are not secret.

## Upload Rule

Do not upload private artifacts to an external verifier unless the user explicitly requests it and accepts the target boundary.
