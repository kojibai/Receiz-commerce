"use client";

import { Icons } from "@/components/icons";
import { Button, ProductVisual, SectionHeader, StatusPill } from "@/components/ui";
import type { Product } from "@/types/domain";

export function ProductCatalog({
  brandLabel,
  products,
  onAddToCart
}: {
  brandLabel: string;
  products: Product[];
  onAddToCart: (productId: string) => void;
}) {
  return (
    <section className="panel catalog-panel" id="products">
      <SectionHeader
        title="Store catalog"
        action={
          <div className="section-actions">
            <button className="link-button" type="button">
              View all products
            </button>
            <Button variant="primary">Add product</Button>
          </div>
        }
      />
      <div className="desktop-table">
        <div className="table-row table-head">
          <span>Product</span>
          <span>Type</span>
          <span>Price</span>
          <span>Status</span>
          <span>Receiz</span>
          <span>Actions</span>
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
          </div>
        ))}
      </div>

      <div className="mobile-product-grid">
        {products.slice(0, 4).map((product) => (
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
        ))}
      </div>
    </section>
  );
}
