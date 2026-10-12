# Create Product Page

Use `receiz-commerce-skill` with `receiz-proof-skill`.

## Agent Steps

1. Resolve the product proof object with `receiz_asset_by_url` or SDK verification.
2. Name the commerce primitive and source of truth.
3. Build the page around proof identity, product media, provenance, ownership, price display, and purchase action.
4. Put checkout behind explicit confirmation.
5. Verify receipt proof, payment, seller proceeds, bearer delivery, buyer claim/custody, and asset use separately; card checkout success alone is not purchase or ownership evidence.

For native application setup and live qualification, use the [registered session example](../../receiz-proof-authority/examples/registered-native-session.md). For shortfall funding, retries, and concurrent buyer evidence, use the [complete commerce sequence](create-no-db-store.md).

## Output Shape

```md
## Product Page Plan
Proof identity:
Product media:
Ownership:
Provenance:
Settlement boundary:
Receipt boundary:
SDK rails:
MCP rails:
```
