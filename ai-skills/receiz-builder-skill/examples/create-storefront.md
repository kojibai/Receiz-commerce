# Create Storefront

Use `publicStore.resolve({ host })` for cold first paint. Render `storeStateRecord` as the public storefront. For edits, publish through `publicStore.publishWithIdentityProof` when a merchant identity artifact is available, otherwise use delegated `publicStore.publish` only after confirmation.

Do not add a database unless requested. If requested, make it an index beneath public store proof truth.
