import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark, StatusPill } from "@/components/ui";
import { normalizeRoutePath, resolvePageBySlug } from "@/lib/storefront/content-routing";
import { shouldHydratePlatformMerchantRoute } from "@/lib/storefront/platform-merchant-route";
import { loadStorefrontState, type StorefrontSearchParams } from "@/lib/storefront/server-state";
import { PlatformMerchantPageRoute } from "@/features/storefront/PlatformMerchantRoutes";

type SitePageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams?: Promise<StorefrontSearchParams>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function pathFromSlug(slug: string[]) {
  return normalizeRoutePath(`/${slug.join("/")}`);
}

export async function generateMetadata({ params, searchParams }: SitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { state } = await loadStorefrontState(await searchParams);
  const page = resolvePageBySlug(state, pathFromSlug(slug));

  if (!page) return {};

  return {
    title: page.seo?.title ?? `${page.title} | ${state.brand.name}`,
    description: page.seo?.description ?? state.storefront.subheadline
  };
}

export default async function SiteDetailPage({ params, searchParams }: SitePageProps) {
  const { slug } = await params;
  const path = pathFromSlug(slug);
  const { hostContext, state } = await loadStorefrontState(await searchParams);
  const page = resolvePageBySlug(state, path);

  if (shouldHydratePlatformMerchantRoute(hostContext, Boolean(page))) {
    return <PlatformMerchantPageRoute initialHostContext={hostContext} initialState={state} path={path} />;
  }

  if (!page || normalizeRoutePath(page.slug) === "/") notFound();

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
