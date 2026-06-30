import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark, StatusPill } from "@/components/ui";
import { resolvePageBySlug } from "@/lib/storefront/content-routing";
import { loadStorefrontState } from "@/lib/storefront/server-state";

type SitePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { state } = await loadStorefrontState();
  const page = resolvePageBySlug(state, slug);

  if (!page) return {};

  return {
    title: page.seo?.title ?? `${page.title} | ${state.brand.name}`,
    description: page.seo?.description ?? state.storefront.subheadline
  };
}

export default async function SiteDetailPage({ params }: SitePageProps) {
  const { slug } = await params;
  const { state } = await loadStorefrontState();
  const page = resolvePageBySlug(state, slug);

  if (!page || page.slug === "/") notFound();

  return (
    <main className="detail-shell">
      <header className="detail-topbar">
        <Link href="/" className="detail-brand">
          <BrandMark imageUrl={state.brand.logoImageUrl} label={state.brand.logoText} compact />
          <span>{state.brand.name}</span>
        </Link>
        <Link className="detail-link" href="/">Store</Link>
      </header>
      <section className="article-detail page-detail">
        <StatusPill tone="green">Proof page</StatusPill>
        <h1>{page.title}</h1>
        {page.sections.length ? (
          page.sections.map((section) => (
            <div className="page-section-block" key={section.id}>
              <span>{section.kind}</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </div>
          ))
        ) : (
          <p className="article-excerpt">{state.storefront.heroBody}</p>
        )}
      </section>
    </main>
  );
}
