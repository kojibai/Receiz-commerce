import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark, ProductVisual, StatusPill } from "@/components/ui";
import { loadStorefrontState, type StorefrontSearchParams } from "@/lib/storefront/server-state";
import { resolveProductBySlug } from "@/lib/storefront/content-routing";
import { ProductPurchasePanel } from "@/features/storefront/ProductPurchasePanel";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<StorefrontSearchParams>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { state } = await loadStorefrontState(await searchParams);
  const product = resolveProductBySlug(state, slug);

  if (!product) return {};

  return {
    title: product.seo?.title ?? `${product.name} | ${state.brand.name}`,
    description: product.seo?.description ?? product.description ?? product.subtitle,
    openGraph: {
      title: product.seo?.title ?? product.name,
      description: product.seo?.description ?? product.description ?? product.subtitle,
      images: product.seo?.socialImageUrl ? [product.seo.socialImageUrl] : undefined
    }
  };
}

export default async function ProductDetailPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const { hostContext, state } = await loadStorefrontState(await searchParams);
  const product = resolveProductBySlug(state, slug);

  if (!product) notFound();

  return (
    <main className="detail-shell">
      <header className="detail-topbar">
        <Link href="/" className="detail-brand">
          <BrandMark imageUrl={state.brand.logoImageUrl} label={state.brand.logoText} compact />
          <span>{state.brand.name}</span>
        </Link>
        <Link className="detail-link" href="/products">All products</Link>
      </header>
      <section className="product-detail-hero">
        <div className="product-detail-media">
          <ProductVisual brandImageUrl={state.brand.logoImageUrl} brandLabel={state.brand.logoText} product={product} />
        </div>
        <div className="product-detail-copy">
          <StatusPill tone={product.sealed ? "green" : "neutral"}>
            {product.sealed ? "Proof sealed" : "Ready to seal"}
          </StatusPill>
          <h1>{product.name}</h1>
          <p>{product.description ?? product.subtitle}</p>
          <ProductPurchasePanel initialHostContext={hostContext} initialState={state} product={product} />
        </div>
      </section>
      <section className="detail-proof-band">
        <div>
          <strong>Receiz proof object</strong>
          <span>{product.type.replace("_", " ")} · rewards {product.rewardEligible ? "eligible" : "off"}</span>
        </div>
        <div>
          <strong>Settlement</strong>
          <span>{state.hosting.merchantReceizId}</span>
        </div>
        <div>
          <strong>Store</strong>
          <span>{state.hosting.customDomain.domain || state.hosting.subdomain}</span>
        </div>
      </section>
    </main>
  );
}
