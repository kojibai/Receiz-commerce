import Link from "next/link";
import { BrandMark, StatusPill } from "@/components/ui";
import { loadStorefrontState, type StorefrontSearchParams } from "@/lib/storefront/server-state";

type BlogIndexPageProps = {
  searchParams?: Promise<StorefrontSearchParams>;
};

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const { state } = await loadStorefrontState(await searchParams);
  const posts = state.blogPosts.filter((post) => post.status === "published");

  return (
    <main className="detail-shell">
      <header className="detail-topbar">
        <Link href="/" className="detail-brand">
          <BrandMark imageUrl={state.brand.logoImageUrl} label={state.brand.logoText} compact />
          <span>{state.brand.name}</span>
        </Link>
        <Link className="detail-link" href="/">Store</Link>
      </header>
      <section className="detail-hero compact">
        <div>
          <StatusPill tone="green">Proof content</StatusPill>
          <h1>{state.brand.name} journal</h1>
          <p>Stories, product drops, reward guides, and proof-sealed commerce updates.</p>
        </div>
      </section>
      <section className="detail-grid blog-grid">
        {posts.map((post) => (
          <Link className="detail-card blog-detail-card" href={post.slug} key={post.id}>
            <span>{post.tags.slice(0, 2).join(" · ") || "Update"}</span>
            <strong>{post.title}</strong>
            <p>{post.excerpt}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
