"use client";

import Link from "next/link";
import { BrandMark, ProductVisual, StatusPill } from "@/components/ui";
import type { HostContext } from "@/lib/hosting/host-context";
import { useTemplateStore } from "@/lib/storage/use-template-store";
import { normalizeRoutePath, resolveBlogPostBySlug, resolvePageBySlug, resolveProductBySlug } from "@/lib/storefront/content-routing";
import type { BlogPost, CommerceState, Product, SitePage } from "@/types/domain";
import { ProductDetailBottomNav } from "@/features/storefront/ProductDetailBottomNav";
import { ProductPurchasePanel } from "@/features/storefront/ProductPurchasePanel";

function DetailTopbar({ state, href, label }: { state: CommerceState; href: string; label: string }) {
  return (
    <header className="detail-topbar">
      <Link href="/" className="detail-brand">
        <BrandMark imageUrl={state.brand.logoImageUrl} label={state.brand.logoText} compact />
        <span>{state.brand.name}</span>
      </Link>
      <Link className="detail-link" href={href}>{label}</Link>
    </header>
  );
}

function MerchantRouteLoading({
  initialHostContext,
  initialState
}: {
  initialHostContext?: HostContext;
  initialState: CommerceState;
}) {
  const { state } = useTemplateStore(initialState, initialHostContext);

  return (
    <main className="detail-shell">
      <DetailTopbar href="/admin" label="Admin" state={state} />
      <section className="article-detail page-detail">
        <StatusPill tone="neutral">Loading saved route</StatusPill>
        <h1>{state.brand.name}</h1>
        <p className="article-excerpt">Resolving your saved merchant workspace.</p>
      </section>
    </main>
  );
}

function MerchantRouteMissing({ state, type }: { state: CommerceState; type: "page" | "product" | "story" }) {
  return (
    <main className="detail-shell">
      <DetailTopbar href="/admin" label="Admin" state={state} />
      <section className="article-detail page-detail">
        <StatusPill tone="gold">Saved {type} not found</StatusPill>
        <h1>{state.brand.name}</h1>
        <p className="article-excerpt">This route is not in the current saved merchant workspace.</p>
        <Link className="detail-primary-action" href="/admin">Open Admin Studio</Link>
      </section>
    </main>
  );
}

function ProductDetail({
  hostContext,
  product,
  state
}: {
  hostContext: HostContext;
  product: Product;
  state: CommerceState;
}) {
  return (
    <main className="detail-shell">
      <DetailTopbar href="/products" label="All products" state={state} />
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
      <ProductDetailBottomNav />
    </main>
  );
}

function PageDetail({ page, state }: { page: SitePage; state: CommerceState }) {
  return (
    <main className="detail-shell">
      <DetailTopbar href="/" label="Store" state={state} />
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

function BlogDetail({ post, state }: { post: BlogPost; state: CommerceState }) {
  return (
    <main className="detail-shell">
      <DetailTopbar href="/blog" label="All posts" state={state} />
      <article className="article-detail">
        <StatusPill tone="green">Receiz story</StatusPill>
        <h1>{post.title}</h1>
        <p className="article-excerpt">{post.excerpt}</p>
        <div className="article-meta">
          <span>{post.authorName}</span>
          <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <div className="article-body">
          {post.body.split(/\n{2,}/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}

export function PlatformMerchantProductRoute({
  initialHostContext,
  initialState,
  slug
}: {
  initialHostContext?: HostContext;
  initialState: CommerceState;
  slug: string;
}) {
  const { state, hostContext, hydrated } = useTemplateStore(initialState, initialHostContext);

  if (!hydrated) return <MerchantRouteLoading initialHostContext={initialHostContext} initialState={initialState} />;

  const product = resolveProductBySlug(state, slug);
  if (!product) return <MerchantRouteMissing state={state} type="product" />;

  return <ProductDetail hostContext={hostContext} product={product} state={state} />;
}

export function PlatformMerchantPageRoute({
  initialHostContext,
  initialState,
  path
}: {
  initialHostContext?: HostContext;
  initialState: CommerceState;
  path: string;
}) {
  const { state, hydrated } = useTemplateStore(initialState, initialHostContext);

  if (!hydrated) return <MerchantRouteLoading initialHostContext={initialHostContext} initialState={initialState} />;

  const page = resolvePageBySlug(state, normalizeRoutePath(path));
  if (!page || normalizeRoutePath(page.slug) === "/") return <MerchantRouteMissing state={state} type="page" />;

  return <PageDetail page={page} state={state} />;
}

export function PlatformMerchantBlogRoute({
  initialHostContext,
  initialState,
  slug
}: {
  initialHostContext?: HostContext;
  initialState: CommerceState;
  slug: string;
}) {
  const { state, hydrated } = useTemplateStore(initialState, initialHostContext);

  if (!hydrated) return <MerchantRouteLoading initialHostContext={initialHostContext} initialState={initialState} />;

  const post = resolveBlogPostBySlug(state, slug);
  if (!post) return <MerchantRouteMissing state={state} type="story" />;

  return <BlogDetail post={post} state={state} />;
}
