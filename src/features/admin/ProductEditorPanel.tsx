import { Icons } from "@/components/icons";
import { Button, ProductVisual, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { Product } from "@/types/domain";

export function ProductEditorPanel({
  brandLabel,
  products
}: {
  brandLabel: string;
  products: Product[];
}) {
  return (
    <Panel className="admin-panel">
      <SectionHeader title="Product editor" action={<button className="link-button">View all</button>} />
      <div className="admin-product-table">
        <div className="admin-product-row head">
          <span>Product</span>
          <span>Price</span>
          <span>Status</span>
          <span>Inventory</span>
        </div>
        {products.slice(0, 5).map((product) => (
          <div className="admin-product-row" key={product.id}>
            <div>
              <ProductVisual brandLabel={brandLabel} product={product} />
              <strong>{product.name}</strong>
            </div>
            <span>{product.priceLabel}</span>
            <StatusPill tone="green">Active</StatusPill>
            <span>{product.inventoryLabel}</span>
          </div>
        ))}
        {products.length === 0 ? (
          <div className="panel-empty-state">
            <Icons.products size={22} />
            <strong>No products yet</strong>
            <span>Add products, benefits, access passes, or Receized assets.</span>
          </div>
        ) : null}
      </div>
      <Button variant="outline">Add product</Button>
    </Panel>
  );
}
