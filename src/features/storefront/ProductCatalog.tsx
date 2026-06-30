"use client";

import { Icons } from "@/components/icons";
import { Button, ProductVisual, SectionHeader, StatusPill } from "@/components/ui";
import type { Product } from "@/types/domain";

export function ProductCatalog({
  brandLabel,
  showAdminActions = true,
  products,
  onAddToCart
}: {
  brandLabel: string;
  showAdminActions?: boolean;
  products: Product[];
  onAddToCart: (productId: string) => void;
}) {
  return (
    <section className="panel catalog-panel" id="products">
      <SectionHeader
        title="Store catalog"
        action={
          showAdminActions ? (
            <div className="section-actions">
              <button className="link-button" type="button">
                View all products
              </button>
              <Button variant="primary">Add product</Button>
            </div>
          ) : null
        }
      />
      <div className="desktop-table">
        <div className="table-row table-head">
          <span>Product</span>
          <span>Type</span>
          <span>Price</span>
          <span>Status</span>
          <span>Receiz</span>
          {showAdminActions ? <span>Actions</span> : null}
        </div>
        {products.slice(0, 4).map((product) => (
          <div className="table-row" key={product.id}>
            <div className="product-cell">
              <ProductVisual brandLabel={brandLabel} product={product} />
              <div>
                <strong>{product.name}</strong>
                <p>{product.subtitle}</p>
              </div>
            </div>
            <span>{product.type.replace("_", " ")}</span>
            <span>{product.priceLabel}</span>
            <StatusPill tone="green">Active</StatusPill>
            <span className="verified-cell">
              <Icons.seal size={15} /> {product.sealed ? "Sealed" : "Ready"}
            </span>
            {showAdminActions ? (
              <div className="row-actions">
                <button
                  aria-label={`Add ${product.name} to cart`}
                  onClick={() => onAddToCart(product.id)}
                  type="button"
                >
                  <Icons.cart size={15} />
                </button>
                <button aria-label={`Edit ${product.name}`} type="button">
                  <Icons.sliders size={15} />
                </button>
              </div>
            ) : null}
          </div>
        ))}
        {products.length === 0 ? (
          <div className="panel-empty-state table-empty-state">
            <Icons.products size={22} />
            <strong>No products yet</strong>
            <span>{showAdminActions ? "Add products in Admin Studio to start selling." : "This store is getting its catalog ready."}</span>
          </div>
        ) : null}
      </div>

      <div className="mobile-product-grid">
        {products.length ? (
          products.slice(0, 4).map((product) => (
            <article className="mobile-product-card" key={product.id}>
              <ProductVisual brandLabel={brandLabel} product={product} />
              <strong>{product.name}</strong>
              <p>{product.subtitle}</p>
              <div>
                <span>{product.priceLabel}</span>
                <button
                  aria-label={`Add ${product.name} to cart`}
                  onClick={() => onAddToCart(product.id)}
                  type="button"
                >
                  <Icons.cart size={18} />
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="panel-empty-state">
            <Icons.products size={22} />
            <strong>No products yet</strong>
            <span>{showAdminActions ? "Add products in Admin Studio to start selling." : "This store is getting its catalog ready."}</span>
          </div>
        )}
      </div>
    </section>
  );
}
