# Product Proof Flow

Use this order whenever a commerce task includes a product, storefront, order, receipt, or buyer claim.

## Read Flow

1. Identify the public proof URL, artifact ID, product manifest, or storefront object ID.
2. Verify the product proof with `receiz_verify_asset`, `receiz_asset_by_url`, `receiz_asset_by_id`, or `receiz_inspect_proof_object`.
3. Resolve storefront projection with `receiz_public_store_resolve` only after the proof boundary is named.
4. Compare product proof, seller claim, price display, and receipt state.
5. Report missing or conflicting evidence directly.

## Write Flow

1. Confirm the user asked for a write.
2. Confirm the exact product object, seller identity, store target, and value-affecting terms.
3. Use `receiz_public_store_publish` for public store append.
4. Use checkout or payment rails only through confirmed SDK/MCP action.
5. Report the resulting proof URL, append result, receipt boundary, and any remaining unverified state.

## Failure Handling

- If the product proof fails, do not publish or sell it.
- If ownership is missing, say ownership is not proven.
- If price is present without settlement context, call it display price only.
- If receipt proof is absent, do not claim purchase proof.
