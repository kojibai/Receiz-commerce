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

export function normalizeRoutePath(value: string) {
  const pathname = value
    .trim()
    .replace(/^https?:\/\/[^/]+/i, "")
    .split(/[?#]/)[0] ?? "";
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => slugifyRouteSegment(segment))
    .filter(Boolean);

  return segments.length ? `/${segments.join("/")}` : "/";
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
  const values = [page.id, page.title, page.slug, page.seo?.canonicalPath]
    .filter(Boolean)
    .map((value) => String(value));

  return {
    paths: new Set(values.map((value) => normalizeRoutePath(value))),
    segments: new Set(values.map((value) => slugifyRouteSegment(value)))
  };
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
  const normalizedPath = normalizeRoutePath(slug);
  const normalizedSegment = slugifyRouteSegment(slug);

  return state.pages.find((page) => {
    if (!page.published) return false;
    const candidates = pageRouteCandidates(page);
    return candidates.paths.has(normalizedPath) || candidates.segments.has(normalizedSegment);
  }) ?? null;
}
