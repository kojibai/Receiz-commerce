"use client";

import type { KeyboardEvent } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { Button, ProductVisual, SectionHeader, StatusPill } from "@/components/ui";
import { productRoutePath } from "@/lib/storefront/product-purchase";
import type { Product } from "@/types/domain";

function openProductPath(path: string, openProduct?: () => void) {
  if (openProduct) {
    openProduct();
    return;
  }

  window.location.assign(path);
}

function openProductPathFromKeyboard(event: KeyboardEvent<HTMLElement>, path: string, openProduct?: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openProductPath(path, openProduct);
  }
}

export function ProductCatalog({
  brandImageUrl,
  brandLabel,
  addedProductId,
  showAdminActions = true,
  showCartActions = true,
  products,
  onAddToCart,
  onProductOpen
}: {
  addedProductId?: string | null;
  brandImageUrl?: string | null;
  brandLabel: string;
  showAdminActions?: boolean;
  showCartActions?: boolean;
  products: Product[];
  onAddToCart: (productId: string) => void;
  onProductOpen?: (product: Product) => void;
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
        {products.slice(0, 4).map((product) => {
          const openProduct = onProductOpen ? () => onProductOpen(product) : undefined;

          return (
          <div className="table-row" key={product.id}>
            <button
              className="product-cell product-cell-link product-cell-button"
              onClick={() => openProductPath(productRoutePath(product), openProduct)}
              type="button"
            >
              <ProductVisual brandImageUrl={brandImageUrl} brandLabel={brandLabel} product={product} />
              <div>
                <strong>{product.name}</strong>
                <p>{product.subtitle}</p>
              </div>
            </button>
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
                    className={addedProductId === product.id ? "cart-add-button added" : "cart-add-button"}
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
          );
        })}
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
          products.slice(0, 4).map((product) => {
            const productPath = productRoutePath(product);
            const openProduct = onProductOpen ? () => onProductOpen(product) : undefined;

            return (
            <article
              className="mobile-product-card clickable-product-card"
              key={product.id}
              onClick={() => openProductPath(productPath, openProduct)}
              onKeyDown={(event) => openProductPathFromKeyboard(event, productPath, openProduct)}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-product-link">
                <ProductVisual brandImageUrl={brandImageUrl} brandLabel={brandLabel} product={product} />
                <strong>{product.name}</strong>
                <p>{product.subtitle}</p>
              </div>
              <div>
                <span>{product.priceLabel}</span>
                {showCartActions ? (
                  <button
                    aria-label={`Add ${product.name} to cart`}
                    className={addedProductId === product.id ? "cart-add-button added" : "cart-add-button"}
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddToCart(product.id);
                    }}
                    type="button"
                  >
                    <Icons.cart size={18} />
                  </button>
                ) : null}
              </div>
            </article>
            );
          })
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
