"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { Button, ProductVisual, SectionHeader, StatusPill } from "@/components/ui";
import { productRoutePath } from "@/lib/storefront/product-purchase";
import type { Product } from "@/types/domain";

export function ProductCatalog({
  brandImageUrl,
  brandLabel,
  showAdminActions = true,
  showCartActions = true,
  products,
  onAddToCart
}: {
  brandImageUrl?: string | null;
  brandLabel: string;
  showAdminActions?: boolean;
  showCartActions?: boolean;
  products: Product[];
  onAddToCart: (productId: string) => void;
}) {
  const showProductActions = showAdminActions || showCartActions;

  return (
    <section className="panel catalog-panel" id="products">
      <SectionHeader
        title="Store catalog"
        action={
          showAdminActions ? (
            <div className="section-actions">
              <Link className="link-button" href="/products">
                View all products
              </Link>
              <Button onClick={() => window.location.assign("/admin")} variant="primary">Add product</Button>
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
          {showProductActions ? <span>Actions</span> : null}
        </div>
        {products.slice(0, 4).map((product) => (
          <div className="table-row" key={product.id}>
            <Link className="product-cell product-cell-link" href={productRoutePath(product)}>
              <ProductVisual brandImageUrl={brandImageUrl} brandLabel={brandLabel} product={product} />
              <div>
                <strong>{product.name}</strong>
                <p>{product.subtitle}</p>
              </div>
            </Link>
            <span>{product.type.replace("_", " ")}</span>
            <span>{product.priceLabel}</span>
            <StatusPill tone="green">Active</StatusPill>
            <span className="verified-cell">
              <Icons.seal size={15} /> {product.sealed ? "Sealed" : "Ready"}
            </span>
            {showProductActions ? (
              <div className="row-actions">
                {showCartActions ? (
                  <button
                    aria-label={`Add ${product.name} to cart`}
                    onClick={() => onAddToCart(product.id)}
                    type="button"
                  >
                    <Icons.cart size={15} />
                  </button>
                ) : null}
                {showAdminActions ? (
                  <button aria-label={`Edit ${product.name}`} type="button">
                    <Icons.sliders size={15} />
                  </button>
                ) : null}
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
              <Link className="mobile-product-link" href={productRoutePath(product)}>
                <ProductVisual brandImageUrl={brandImageUrl} brandLabel={brandLabel} product={product} />
                <strong>{product.name}</strong>
                <p>{product.subtitle}</p>
              </Link>
              <div>
                <span>{product.priceLabel}</span>
                {showCartActions ? (
                  <button
                    aria-label={`Add ${product.name} to cart`}
                    onClick={() => onAddToCart(product.id)}
                    type="button"
                  >
                    <Icons.cart size={18} />
                  </button>
                ) : null}
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
