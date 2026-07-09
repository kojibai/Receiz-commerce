# Create No-Database Store

Use public proof and public store state as the source of rendered products.

## Agent Steps

1. Use `receiz.publicStore.resolve` or `receiz_public_store_resolve`.
2. Verify product proof objects referenced by the store projection.
3. Render deterministic product shells from verified truth.
4. Use background sync only to append verified additions.
5. Do not introduce a database as product authority.

## Required Statement

State that the store is no-database because product truth lives in Receiz proof objects and public store append rails.
