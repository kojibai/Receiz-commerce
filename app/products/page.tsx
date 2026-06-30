import Link from "next/link";
import { BrandMark, ProductVisual, StatusPill } from "@/components/ui";
import { loadStorefrontState, type StorefrontSearchParams } from "@/lib/storefront/server-state";

type ProductsPageProps = {
  searchParams?: Promise<StorefrontSearchParams>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { state } = await loadStorefrontState(await searchParams);
  const activeProducts = state.products.filter((product) => product.status === "active");

  return (
    <main className="detail-shell">
      <header className="detail-topbar">
        <Link href="/" className="detail-brand">
          <BrandMark imageUrl={state.brand.logoImageUrl} label={state.brand.logoText} compact />
          <span>{state.brand.name}</span>
        </Link>
        <Link className="detail-link" href="/account">Account</Link>
      </header>
      <section className="detail-hero compact">
        <div>
          <StatusPill tone="green">Receiz checkout ready</StatusPill>
          <h1>Shop {state.brand.name}</h1>
          <p>{state.storefront.heroBody}</p>
        </div>
      </section>
      <section className="detail-grid">
        {activeProducts.map((product) => (
          <Link className="detail-card product-detail-card" href={`/products/${product.seo?.canonicalPath?.split("/").filter(Boolean).at(-1) ?? product.id}`} key={product.id}>
            <ProductVisual brandImageUrl={state.brand.logoImageUrl} brandLabel={state.brand.logoText} product={product} />
            <div>
              <strong>{product.name}</strong>
              <span>{product.subtitle}</span>
              <small>{product.priceLabel}</small>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
