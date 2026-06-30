import type { BlogPost, CommerceState, Product, SitePage } from "../../types/domain";

export function slugifyRouteSegment(value: string) {
  const lastSegment = value
    .trim()
    .replace(/^https?:\/\/[^/]+/i, "")
    .split("/")
    .filter(Boolean)
    .at(-1);

  return (lastSegment || value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function productRouteCandidates(product: Product) {
  return new Set(
    [
      product.id,
      product.name,
      product.seo?.canonicalPath,
      `/products/${product.id}`,
      `/products/${slugifyRouteSegment(product.name)}`
    ]
      .filter(Boolean)
      .map((value) => slugifyRouteSegment(String(value)))
  );
}

function blogRouteCandidates(post: BlogPost) {
  return new Set(
    [post.id, post.title, post.slug, post.seo.canonicalPath]
      .filter(Boolean)
      .map((value) => slugifyRouteSegment(String(value)))
  );
}

function pageRouteCandidates(page: SitePage) {
  return new Set(
    [page.id, page.title, page.slug, page.seo?.canonicalPath]
      .filter(Boolean)
      .map((value) => slugifyRouteSegment(String(value)))
  );
}

export function resolveProductBySlug(state: CommerceState, slug: string): Product | null {
  const normalized = slugifyRouteSegment(slug);
  return state.products.find((product) => product.status === "active" && productRouteCandidates(product).has(normalized)) ?? null;
}

export function resolveBlogPostBySlug(state: CommerceState, slug: string): BlogPost | null {
  const normalized = slugifyRouteSegment(slug);
  return state.blogPosts.find((post) => post.status === "published" && blogRouteCandidates(post).has(normalized)) ?? null;
}

export function resolvePageBySlug(state: CommerceState, slug: string): SitePage | null {
  const normalized = slugifyRouteSegment(slug);
  return state.pages.find((page) => page.published && pageRouteCandidates(page).has(normalized)) ?? null;
}
