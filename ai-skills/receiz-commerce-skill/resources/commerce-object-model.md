# Commerce Object Model

Receiz commerce objects are proof-native artifacts projected into commerce surfaces.

## Required Fields To Name

- Object identity: deterministic proof identity, public proof URL, artifact ID, or manifest identity.
- Product identity: product name, media, description, and included proof payload.
- Ownership or custody: current owner, seller, custody state, or absent proof.
- Provenance: origin, creator, chain, public witness, register append, or artifact history.
- Settlement boundary: purchase route, funded state, certificate value, note issue value, reserve state, or display price.
- Receipt boundary: proof of purchase, certificate, note, or receipt artifact.

## Truth Order

1. Sealed artifact truth or embedded proof.
2. Deterministic proof object state.
3. Verified local truth or durable local projection.
4. Verified register append.
5. Authenticated snapshot.
6. Server append and public store state.
7. Database, session, UI, or market projection.

When conflict appears, report the stronger proof first and mark the weaker projection as inconsistent.

## Language

Use direct language:

- Product proof object
- Ownership surface
- Receipt proof
- Public proof surface
- Settlement route
- Certificate value
- Note issue route
- Verified product projection

Avoid generic language as product truth:

- Generic listing
- Plain SKU
- Cart item as final authority
- Backend order as final authority
