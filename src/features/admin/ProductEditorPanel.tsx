"use client";

import { useMemo, useRef, useState } from "react";
import { Icons } from "@/components/icons";
import { Button, ProductVisual, Panel, SectionHeader, StatusPill } from "@/components/ui";
import { requestTwinAssist } from "@/lib/content/twin-client";
import { hasReceizTwinCapability } from "@/lib/receiz/capabilities";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import { verifyPortableCardPng, verifyPortableVaultPng } from "@/features/play/card-export";
import { registerPublicWildsCard } from "@/features/play/public-card-registry";
import { wildsStoreProduct } from "@/features/play/wilds-store-product";
import type { BrandConfig, Collection, Product, ProductType } from "@/types/domain";

const productTypes: ProductType[] = ["physical", "digital", "access", "benefit", "experience", "receized_asset"];
const imageTones: Product["imageTone"][] = ["bag", "can", "mug", "card", "class", "access"];
const twinEnabled = hasReceizTwinCapability();

function slugify(value: string, fallback = "product") {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || fallback;
}

function newProduct(): Product {
  const id = `product-${Date.now()}`;
  const name = "New product";

  return {
    id,
    name,
    subtitle: "Short product subtitle",
    type: "physical",
    priceLabel: "$18.00",
    status: "draft",
    inventoryLabel: "0",
    rewardEligible: true,
    sealed: false,
    imageTone: "bag",
    imageUrl: null,
    description: "Describe the product, benefit, access pass, service, or Receized asset.",
    seo: {
      title: name,
      description: "A proof-sealed product for this store.",
      canonicalPath: `/products/${slugify(name)}`,
      keywords: ["Receiz", "proof-sealed product"],
      socialImageUrl: null
    }
  };
}

function newCollection(): Collection {
  const id = `collection-${Date.now()}`;
  const name = "New category";

  return {
    id,
    name,
    slug: slugify(name, "category"),
    productIds: [],
    published: true
  };
}

export function ProductEditorPanel({
  brandImageUrl,
  brandLabel,
  brand,
  collections,
  onAddCollection,
  onUpdateCollection,
  onAddProduct,
  onUpdateProduct,
  products
}: {
  brandImageUrl?: string | null;
  brand: BrandConfig;
  brandLabel: string;
  collections: Collection[];
  onAddCollection: (collection: Collection) => void;
  onUpdateCollection: (collectionId: string, input: Partial<Collection>) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (productId: string, input: Partial<Product>) => void;
  products: Product[];
}) {
  const [activeProductId, setActiveProductId] = useState(products[0]?.id ?? "");
  const [twinLoading, setTwinLoading] = useState(false);
  const [twinError, setTwinError] = useState("");
  const [wildsPrice, setWildsPrice] = useState("25.00");
  const [wildsImportMessage, setWildsImportMessage] = useState("");
  const [wildsImporting, setWildsImporting] = useState(false);
  const wildsInput = useRef<HTMLInputElement>(null);
  const activeProduct = useMemo(
    () => products.find((product) => product.id === activeProductId) ?? products[0] ?? null,
    [activeProductId, products]
  );

  const addProduct = () => {
    const product = newProduct();
    onAddProduct(product);
    setActiveProductId(product.id);
  };
  const addCollection = () => {
    onAddCollection(newCollection());
  };
  const importWildsProducts = async (files: File[]) => {
    setWildsImporting(true);
    setWildsImportMessage("Verifying and publishing card links…");
    let added = 0;
    let rejected = 0;

    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const card = verifyPortableCardPng(bytes);
      const vault = card.ok ? null : verifyPortableVaultPng(bytes);
      const assets = card.ok && card.asset ? [card.asset] : vault?.ok ? vault.assets : [];
      if (!assets.length) {
        rejected += 1;
        continue;
      }
      for (const asset of assets) {
        if (products.some((product) => product.wildsAsset?.assetId === asset.id)) continue;
        try {
          await registerPublicWildsCard(asset);
          const product = wildsStoreProduct(asset, wildsPrice);
          onAddProduct(product);
          setActiveProductId(product.id);
          added += 1;
        } catch {
          rejected += 1;
        }
      }
    }

    setWildsImporting(false);
    setWildsImportMessage(added
      ? `${added} verified card${added === 1 ? "" : "s"} added as one-of-one shop products${rejected ? ` · ${rejected} rejected` : ""}. Set individual prices below, then publish changes.`
      : "No products were added. Connect the owner’s Receiz ID and upload an untampered card or vault PNG.");
  };
  const toggleCollectionProduct = (collection: Collection, productId: string) => {
    const productIds = collection.productIds.includes(productId)
      ? collection.productIds.filter((id) => id !== productId)
      : [...collection.productIds, productId];
    onUpdateCollection(collection.id, { productIds });
  };
  const fillWithTwin = async () => {
    if (!activeProduct) return;
    setTwinLoading(true);
    setTwinError("");

    try {
      const draft = await requestTwinAssist({
        kind: "product",
        brand,
        product: activeProduct,
        topic: activeProduct.name
      });
      onUpdateProduct(activeProduct.id, {
        name: draft.title,
        subtitle: draft.subtitle ?? activeProduct.subtitle,
        description: draft.description ?? draft.body,
        seo: draft.seo
      });
    } catch (error) {
      setTwinError(error instanceof Error ? error.message : "Receiz Twin assist failed");
    } finally {
      setTwinLoading(false);
    }
  };

  return (
    <Panel className="admin-panel product-builder-panel">
      <SectionHeader
        title="Product builder"
        action={<Button onClick={addProduct} variant="primary">Add product</Button>}
      />
      <div className="wilds-shop-importer">
        <div>
          <strong>Sell earned Wilds cards</strong>
          <span>Import a card or vault PNG. Receiz verifies it and creates one product per verified card.</span>
        </div>
        <label>
          <span>Starting price per card</span>
          <input aria-label="Starting Wilds card price" inputMode="decimal" min="0.01" onChange={(event) => setWildsPrice(event.target.value)} step="0.01" type="number" value={wildsPrice} />
        </label>
        <Button disabled={wildsImporting} onClick={() => wildsInput.current?.click()} variant="outline">
          {wildsImporting ? "Publishing…" : "Import card or vault"}
        </Button>
        <input
          ref={wildsInput}
          accept="image/png,.png"
          hidden
          multiple
          onChange={async (event) => {
            await importWildsProducts(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = "";
          }}
          type="file"
        />
        {wildsImportMessage ? <p aria-live="polite">{wildsImportMessage}</p> : null}
      </div>
      <div className="product-builder-grid">
        <div className="collection-builder-panel">
          <div className="collection-builder-head">
            <div>
              <strong>Categories</strong>
              <span>Customize storefront filters and product grouping.</span>
            </div>
            <Button onClick={addCollection} variant="outline">Add category</Button>
          </div>
          <div className="collection-editor-list">
            {collections.map((collection) => (
              <div className="collection-editor-card" key={collection.id}>
                <div className="builder-field-grid">
                  <label className="builder-field">
                    <span>Name</span>
                    <input
                      value={collection.name}
                      onChange={(event) =>
                        onUpdateCollection(collection.id, {
                          name: event.target.value,
                          slug: slugify(event.target.value, collection.slug || "category")
                        })
                      }
                    />
                  </label>
                  <label className="builder-field">
                    <span>Slug</span>
                    <input
                      value={collection.slug}
                      onChange={(event) => onUpdateCollection(collection.id, { slug: slugify(event.target.value, "category") })}
                    />
                  </label>
                </div>
                <label className="inline-toggle">
                  <input
                    checked={collection.published}
                    onChange={(event) => onUpdateCollection(collection.id, { published: event.target.checked })}
                    type="checkbox"
                  />
                  <span>Show on storefront</span>
                </label>
                <div className="collection-product-picker">
                  {products.map((product) => (
                    <button
                      className={collection.productIds.includes(product.id) ? "active" : undefined}
                      key={product.id}
                      onClick={() => toggleCollectionProduct(collection, product.id)}
                      type="button"
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {collections.length === 0 ? (
              <div className="panel-empty-state">
                <Icons.collections size={22} />
                <strong>No categories yet</strong>
                <span>Add custom categories for the mobile storefront filter row.</span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="admin-product-table">
          <div className="admin-product-row head">
            <span>Product</span>
            <span>Price</span>
            <span>Status</span>
            <span>Inventory</span>
          </div>
          {products.map((product) => (
            <button
              className={activeProduct?.id === product.id ? "admin-product-row product-select-row active" : "admin-product-row product-select-row"}
              key={product.id}
              onClick={() => setActiveProductId(product.id)}
              type="button"
            >
              <div>
                <ProductVisual brandImageUrl={brandImageUrl} brandLabel={brandLabel} product={product} />
                <strong>{product.name}</strong>
              </div>
              <span>{product.priceLabel}</span>
              <StatusPill tone={product.status === "active" ? "green" : "neutral"}>{product.status}</StatusPill>
              <span>{product.inventoryLabel}</span>
            </button>
          ))}
          {products.length === 0 ? (
            <div className="panel-empty-state">
              <Icons.products size={22} />
              <strong>No products yet</strong>
              <span>Add products, benefits, access passes, or Receized assets.</span>
            </div>
          ) : null}
        </div>

        {activeProduct ? (
          <div className="builder-editor">
            {twinEnabled ? (
              <div className="twin-assist-row">
                <button disabled={twinLoading} onClick={fillWithTwin} type="button">
                  <Icons.sparkle size={17} />
                  <span>{twinLoading ? "Filling product..." : "Fill with Twin"}</span>
                </button>
                <small>{twinError || "Receiz Twin writes the name, proof copy, SEO, and product positioning."}</small>
              </div>
            ) : null}
            <div className="product-editor-preview">
              <ProductVisual brandImageUrl={brandImageUrl} brandLabel={brandLabel} product={activeProduct} />
              <div>
                <strong>{activeProduct.name}</strong>
                <span>{activeProduct.subtitle}</span>
              </div>
              <StatusPill tone={activeProduct.sealed ? "green" : "gold"}>
                {activeProduct.sealed ? "Sealed" : "Ready to seal"}
              </StatusPill>
            </div>
            <div className="builder-field-grid">
              <label className="builder-field">
                <span>Name</span>
                <input
                  value={activeProduct.name}
                  onChange={(event) =>
                    onUpdateProduct(activeProduct.id, {
                      name: event.target.value,
                      seo: { ...(activeProduct.seo ?? { description: "", keywords: [], socialImageUrl: null }), title: event.target.value, canonicalPath: `/products/${slugify(event.target.value)}` }
                    })
                  }
                />
              </label>
              <label className="builder-field">
                <span>Price</span>
                <input value={activeProduct.priceLabel} onChange={(event) => onUpdateProduct(activeProduct.id, { priceLabel: event.target.value })} />
              </label>
              <label className="builder-field">
                <span>Inventory</span>
                <input value={activeProduct.inventoryLabel} onChange={(event) => onUpdateProduct(activeProduct.id, { inventoryLabel: event.target.value })} />
              </label>
              <label className="builder-field">
                <span>Type</span>
                <select value={activeProduct.type} onChange={(event) => onUpdateProduct(activeProduct.id, { type: event.target.value as ProductType })}>
                  {productTypes.map((type) => (
                    <option key={type} value={type}>{type.replace("_", " ")}</option>
                  ))}
                </select>
              </label>
              <label className="builder-field">
                <span>Visual</span>
                <select value={activeProduct.imageTone} onChange={(event) => onUpdateProduct(activeProduct.id, { imageTone: event.target.value as Product["imageTone"] })}>
                  {imageTones.map((tone) => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </select>
              </label>
              <label className="builder-field">
                <span>Status</span>
                <select value={activeProduct.status} onChange={(event) => onUpdateProduct(activeProduct.id, { status: event.target.value as Product["status"] })}>
                  <option value="active">active</option>
                  <option value="draft">draft</option>
                </select>
              </label>
            </div>
            <ImageUploadField
              label="Product image"
              value={activeProduct.imageUrl ?? null}
              onChange={(imageUrl) =>
                onUpdateProduct(activeProduct.id, {
                  imageUrl,
                  seo: { ...(activeProduct.seo ?? { canonicalPath: "", description: "", keywords: [], title: activeProduct.name }), socialImageUrl: imageUrl }
                })
              }
            />
            <label className="builder-field">
              <span>Subtitle</span>
              <input value={activeProduct.subtitle} onChange={(event) => onUpdateProduct(activeProduct.id, { subtitle: event.target.value })} />
            </label>
            <label className="builder-field">
              <span>Description</span>
              <textarea rows={4} value={activeProduct.description ?? ""} onChange={(event) => onUpdateProduct(activeProduct.id, { description: event.target.value })} />
            </label>
            <div className="seo-fields">
              <strong>SEO</strong>
              <label className="builder-field">
                <span>SEO title</span>
                <input
                  value={activeProduct.seo?.title ?? activeProduct.name}
                  onChange={(event) => onUpdateProduct(activeProduct.id, { seo: { ...(activeProduct.seo ?? { canonicalPath: "", description: "", keywords: [], socialImageUrl: null }), title: event.target.value } })}
                />
              </label>
              <label className="builder-field">
                <span>Meta description</span>
                <textarea
                  rows={2}
                  value={activeProduct.seo?.description ?? activeProduct.subtitle}
                  onChange={(event) => onUpdateProduct(activeProduct.id, { seo: { ...(activeProduct.seo ?? { canonicalPath: "", keywords: [], socialImageUrl: null, title: activeProduct.name }), description: event.target.value } })}
                />
              </label>
              <label className="builder-field">
                <span>Canonical path</span>
                <input
                  value={activeProduct.seo?.canonicalPath ?? `/products/${slugify(activeProduct.name)}`}
                  onChange={(event) => onUpdateProduct(activeProduct.id, { seo: { ...(activeProduct.seo ?? { description: "", keywords: [], socialImageUrl: null, title: activeProduct.name }), canonicalPath: event.target.value } })}
                />
              </label>
              <label className="builder-field">
                <span>Keywords</span>
                <input
                  value={(activeProduct.seo?.keywords ?? []).join(", ")}
                  onChange={(event) => onUpdateProduct(activeProduct.id, { seo: { ...(activeProduct.seo ?? { canonicalPath: "", description: "", socialImageUrl: null, title: activeProduct.name }), keywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } })}
                />
              </label>
            </div>
            <div className="builder-switch-row">
              <button className={activeProduct.rewardEligible ? "toggle active" : "toggle"} onClick={() => onUpdateProduct(activeProduct.id, { rewardEligible: !activeProduct.rewardEligible })} type="button">
                <span />
              </button>
              <strong>Reward eligible</strong>
              <button className={activeProduct.sealed ? "toggle active" : "toggle"} onClick={() => onUpdateProduct(activeProduct.id, { sealed: !activeProduct.sealed })} type="button">
                <span />
              </button>
              <strong>{activeProduct.sealed ? "Receiz sealed" : "Seal later"}</strong>
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
