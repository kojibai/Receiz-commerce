import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark, StatusPill } from "@/components/ui";
import { resolveBlogPostBySlug } from "@/lib/storefront/content-routing";
import { loadStorefrontState } from "@/lib/storefront/server-state";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { state } = await loadStorefrontState();
  const post = resolveBlogPostBySlug(state, slug);

  if (!post) return {};

  return {
    title: post.seo.title,
    description: post.seo.description,
    openGraph: {
      title: post.seo.title,
      description: post.seo.description,
      images: post.seo.socialImageUrl ? [post.seo.socialImageUrl] : undefined
    }
  };
}

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const { state } = await loadStorefrontState();
  const post = resolveBlogPostBySlug(state, slug);

  if (!post) notFound();

  return (
    <main className="detail-shell">
      <header className="detail-topbar">
        <Link href="/" className="detail-brand">
          <BrandMark imageUrl={state.brand.logoImageUrl} label={state.brand.logoText} compact />
          <span>{state.brand.name}</span>
        </Link>
        <Link className="detail-link" href="/blog">All posts</Link>
      </header>
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
