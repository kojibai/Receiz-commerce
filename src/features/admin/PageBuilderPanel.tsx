"use client";

import { useMemo, useState } from "react";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import { Icons } from "@/components/icons";
import { requestTwinAssist } from "@/lib/content/twin-client";
import { hasReceizTwinCapability } from "@/lib/receiz/capabilities";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import type { BlogPost, BrandConfig, SitePage } from "@/types/domain";
import type { ReactNode } from "react";

type ContentMode = "pages" | "blog";
const twinEnabled = hasReceizTwinCapability();

function slugify(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || fallback;
}

function newPage(): SitePage {
  const id = `page-${Date.now()}`;
  const title = "New landing page";
  const slug = `/${slugify(title, "page")}`;

  return {
    id,
    title,
    slug,
    visibleInNav: true,
    published: false,
    sections: [
      {
        id: `${id}-hero`,
        kind: "hero",
        title,
        body: "Write a clear offer, collection story, or campaign page for this store."
      }
    ],
    seo: {
      title,
      description: "A custom page for this proof-sealed store.",
      canonicalPath: slug,
      keywords: ["Receiz", "proof-sealed commerce"],
      socialImageUrl: null
    }
  };
}

function newBlogPost(authorName: string): BlogPost {
  const id = `post-${Date.now()}`;
  const title = "New story";
  const slug = `/blog/${slugify(title, "story")}`;

  return {
    id,
    title,
    slug,
    excerpt: "A short summary for customers, search engines, and social previews.",
    body: "Write the article, buying guide, launch story, reward explainer, or product education piece here.",
    authorName,
    coverImageUrl: null,
    tags: ["updates"],
    featured: false,
    status: "draft",
    publishedAt: new Date().toISOString(),
    seo: {
      title,
      description: "A proof-sealed commerce story.",
      canonicalPath: slug,
      keywords: ["Receiz", "commerce"],
      socialImageUrl: null
    }
  };
}

export function PageBuilderPanel({
  authorName,
  blogPosts,
  brand,
  onAddBlogPost,
  onAddPage,
  onUpdateBlogPost,
  onUpdatePage,
  pages
}: {
  authorName: string;
  blogPosts: BlogPost[];
  brand: BrandConfig;
  onAddBlogPost: (post: BlogPost) => void;
  onAddPage: (page: SitePage) => void;
  onUpdateBlogPost: (postId: string, input: Partial<BlogPost>) => void;
  onUpdatePage: (pageId: string, input: Partial<SitePage>) => void;
  pages: SitePage[];
}) {
  const [mode, setMode] = useState<ContentMode>("pages");
  const [activePageId, setActivePageId] = useState(pages[0]?.id ?? "");
  const [activePostId, setActivePostId] = useState(blogPosts[0]?.id ?? "");
  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? pages[0] ?? null,
    [activePageId, pages]
  );
  const activePost = useMemo(
    () => blogPosts.find((post) => post.id === activePostId) ?? blogPosts[0] ?? null,
    [activePostId, blogPosts]
  );

  const addPage = () => {
    const page = newPage();
    onAddPage(page);
    setMode("pages");
    setActivePageId(page.id);
  };

  const addPost = () => {
    const post = newBlogPost(authorName);
    onAddBlogPost(post);
    setMode("blog");
    setActivePostId(post.id);
  };

  return (
    <Panel className="admin-panel content-builder-panel">
      <SectionHeader
        title="Content builder"
        action={
          <div className="section-actions">
            <Button onClick={addPage} variant="outline">Add page</Button>
            <Button onClick={addPost} variant="primary">Add blog</Button>
          </div>
        }
      />
      <div className="content-builder-tabs" role="tablist" aria-label="Content type">
        {[
          ["pages", `Pages ${pages.length}`],
          ["blog", `Blog ${blogPosts.length}`]
        ].map(([tab, label]) => (
          <button
            aria-selected={mode === tab}
            className={mode === tab ? "active" : undefined}
            key={tab}
            onClick={() => setMode(tab as ContentMode)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "pages" ? (
      <PageEditor
        activePage={activePage}
        brand={brand}
        onSelect={setActivePageId}
          onUpdatePage={onUpdatePage}
          pages={pages}
        />
      ) : (
        <BlogEditor
          activePost={activePost}
          blogPosts={blogPosts}
          brand={brand}
          onSelect={setActivePostId}
          onUpdateBlogPost={onUpdateBlogPost}
        />
      )}
    </Panel>
  );
}

function PageEditor({
  activePage,
  brand,
  onSelect,
  onUpdatePage,
  pages
}: {
  activePage: SitePage | null;
  brand: BrandConfig;
  onSelect: (pageId: string) => void;
  onUpdatePage: (pageId: string, input: Partial<SitePage>) => void;
  pages: SitePage[];
}) {
  const [twinLoading, setTwinLoading] = useState(false);
  const [twinError, setTwinError] = useState("");
  const askTwin = async () => {
    if (!activePage) return;
    setTwinLoading(true);
    setTwinError("");

    try {
      const draft = await requestTwinAssist({
        kind: "page",
        brand,
        page: activePage,
        topic: activePage.title
      });
      onUpdatePage(activePage.id, {
        title: draft.title,
        slug: draft.slug,
        sections: [
          {
            ...(activePage.sections[0] ?? { id: `${activePage.id}-hero`, kind: "hero" as const }),
            title: draft.title,
            body: draft.body
          },
          ...activePage.sections.slice(1)
        ],
        seo: draft.seo
      });
    } catch (error) {
      setTwinError(error instanceof Error ? error.message : "Receiz Twin assist failed");
    } finally {
      setTwinLoading(false);
    }
  };

  return (
    <div className="content-builder-grid">
      <div className="admin-list">
        {pages.map((page) => (
          <button
            className={activePage?.id === page.id ? "builder-list-row active" : "builder-list-row"}
            key={page.id}
            onClick={() => onSelect(page.id)}
            type="button"
          >
            <span className="drag-handle">⋮⋮</span>
            <strong>{page.title}</strong>
            <span>{page.slug}</span>
            <StatusPill tone={page.published ? "green" : "neutral"}>
              {page.published ? "Published" : "Draft"}
            </StatusPill>
          </button>
        ))}
        {pages.length === 0 ? <EmptyContent icon={<Icons.pages size={22} />} label="No pages yet" /> : null}
      </div>

      {activePage ? (
        <div className="builder-editor">
          {twinEnabled ? (
            <TwinAssistRow
              error={twinError}
              loading={twinLoading}
              onClick={askTwin}
              text="Use your Receiz Twin to draft this page from the store brand, proof rails, and current outline."
            />
          ) : null}
          <label className="builder-field">
            <span>Page title</span>
            <input
              value={activePage.title}
              onChange={(event) =>
                onUpdatePage(activePage.id, {
                  title: event.target.value,
                  seo: { ...activePage.seo, title: event.target.value } as SitePage["seo"]
                })
              }
            />
          </label>
          <label className="builder-field">
            <span>URL path</span>
            <input value={activePage.slug} onChange={(event) => onUpdatePage(activePage.id, { slug: event.target.value })} />
          </label>
          <label className="builder-field">
            <span>Hero heading</span>
            <input
              value={activePage.sections[0]?.title ?? ""}
              onChange={(event) =>
                onUpdatePage(activePage.id, {
                  sections: [
                    { ...(activePage.sections[0] ?? { id: `${activePage.id}-hero`, kind: "hero" as const, body: "" }), title: event.target.value },
                    ...activePage.sections.slice(1)
                  ]
                })
              }
            />
          </label>
          <label className="builder-field">
            <span>Page body</span>
            <textarea
              rows={4}
              value={activePage.sections[0]?.body ?? ""}
              onChange={(event) =>
                onUpdatePage(activePage.id, {
                  sections: [
                    { ...(activePage.sections[0] ?? { id: `${activePage.id}-hero`, kind: "hero" as const, title: activePage.title }), body: event.target.value },
                    ...activePage.sections.slice(1)
                  ]
                })
              }
            />
          </label>
          <SeoFields
            canonicalPath={activePage.seo?.canonicalPath ?? activePage.slug}
            description={activePage.seo?.description ?? ""}
            keywords={activePage.seo?.keywords ?? []}
            socialImageUrl={activePage.seo?.socialImageUrl ?? null}
            title={activePage.seo?.title ?? activePage.title}
            onChange={(seo) => onUpdatePage(activePage.id, { seo })}
          />
          <div className="builder-switch-row">
            <button className={activePage.visibleInNav ? "toggle active" : "toggle"} onClick={() => onUpdatePage(activePage.id, { visibleInNav: !activePage.visibleInNav })} type="button">
              <span />
            </button>
            <strong>Show in navigation</strong>
            <button className={activePage.published ? "toggle active" : "toggle"} onClick={() => onUpdatePage(activePage.id, { published: !activePage.published })} type="button">
              <span />
            </button>
            <strong>{activePage.published ? "Published" : "Draft"}</strong>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BlogEditor({
  activePost,
  blogPosts,
  brand,
  onSelect,
  onUpdateBlogPost
}: {
  activePost: BlogPost | null;
  blogPosts: BlogPost[];
  brand: BrandConfig;
  onSelect: (postId: string) => void;
  onUpdateBlogPost: (postId: string, input: Partial<BlogPost>) => void;
}) {
  const [twinLoading, setTwinLoading] = useState(false);
  const [twinError, setTwinError] = useState("");
  const askTwin = async () => {
    if (!activePost) return;
    setTwinLoading(true);
    setTwinError("");

    try {
      const draft = await requestTwinAssist({
        kind: "blog",
        brand,
        post: activePost,
        topic: activePost.title
      });
      onUpdateBlogPost(activePost.id, {
        title: draft.title,
        slug: draft.slug,
        excerpt: draft.excerpt ?? activePost.excerpt,
        body: draft.body,
        tags: draft.tags ?? activePost.tags,
        seo: draft.seo
      });
    } catch (error) {
      setTwinError(error instanceof Error ? error.message : "Receiz Twin assist failed");
    } finally {
      setTwinLoading(false);
    }
  };

  return (
    <div className="content-builder-grid">
      <div className="admin-list">
        {blogPosts.map((post) => (
          <button
            className={activePost?.id === post.id ? "builder-list-row active" : "builder-list-row"}
            key={post.id}
            onClick={() => onSelect(post.id)}
            type="button"
          >
            <Icons.book size={17} />
            <strong>{post.title}</strong>
            <span>{post.slug}</span>
            <StatusPill tone={post.status === "published" ? "green" : "neutral"}>
              {post.status}
            </StatusPill>
          </button>
        ))}
        {blogPosts.length === 0 ? <EmptyContent icon={<Icons.book size={22} />} label="No blog posts yet" /> : null}
      </div>

      {activePost ? (
        <div className="builder-editor">
          {twinEnabled ? (
            <TwinAssistRow
              error={twinError}
              loading={twinLoading}
              onClick={askTwin}
              text="Use your Receiz Twin to write the post, summary, tags, and SEO from the brand voice."
            />
          ) : null}
          <label className="builder-field">
            <span>Post title</span>
            <input
              value={activePost.title}
              onChange={(event) =>
                onUpdateBlogPost(activePost.id, {
                  title: event.target.value,
                  seo: { ...activePost.seo, title: event.target.value }
                })
              }
            />
          </label>
          <label className="builder-field">
            <span>URL path</span>
            <input value={activePost.slug} onChange={(event) => onUpdateBlogPost(activePost.id, { slug: event.target.value })} />
          </label>
          <label className="builder-field">
            <span>Excerpt</span>
            <textarea rows={2} value={activePost.excerpt} onChange={(event) => onUpdateBlogPost(activePost.id, { excerpt: event.target.value })} />
          </label>
          <label className="builder-field">
            <span>Article body</span>
            <textarea rows={7} value={activePost.body} onChange={(event) => onUpdateBlogPost(activePost.id, { body: event.target.value })} />
          </label>
          <div className="builder-field-grid">
            <label className="builder-field">
              <span>Author</span>
              <input value={activePost.authorName} onChange={(event) => onUpdateBlogPost(activePost.id, { authorName: event.target.value })} />
            </label>
            <ImageUploadField
              label="Cover image"
              value={activePost.coverImageUrl}
              onChange={(coverImageUrl) =>
                onUpdateBlogPost(activePost.id, {
                  coverImageUrl,
                  seo: { ...activePost.seo, socialImageUrl: coverImageUrl }
                })
              }
            />
            <label className="builder-field">
              <span>Tags</span>
              <input value={activePost.tags.join(", ")} onChange={(event) => onUpdateBlogPost(activePost.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
            </label>
          </div>
          <SeoFields
            canonicalPath={activePost.seo.canonicalPath}
            description={activePost.seo.description}
            keywords={activePost.seo.keywords}
            socialImageUrl={activePost.seo.socialImageUrl ?? null}
            title={activePost.seo.title}
            onChange={(seo) => onUpdateBlogPost(activePost.id, { seo })}
          />
          <div className="builder-switch-row">
            <button className={activePost.featured ? "toggle active" : "toggle"} onClick={() => onUpdateBlogPost(activePost.id, { featured: !activePost.featured })} type="button">
              <span />
            </button>
            <strong>Featured</strong>
            <button
              className={activePost.status === "published" ? "toggle active" : "toggle"}
              onClick={() => onUpdateBlogPost(activePost.id, { status: activePost.status === "published" ? "draft" : "published" })}
              type="button"
            >
              <span />
            </button>
            <strong>{activePost.status === "published" ? "Published" : "Draft"}</strong>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SeoFields({
  canonicalPath,
  description,
  keywords,
  onChange,
  socialImageUrl,
  title
}: {
  canonicalPath: string;
  description: string;
  keywords: string[];
  onChange: (value: { title: string; description: string; canonicalPath: string; keywords: string[]; socialImageUrl?: string | null }) => void;
  socialImageUrl?: string | null;
  title: string;
}) {
  return (
    <div className="seo-fields">
      <strong>SEO</strong>
      <label className="builder-field">
        <span>SEO title</span>
        <input value={title} onChange={(event) => onChange({ title: event.target.value, description, canonicalPath, keywords, socialImageUrl })} />
      </label>
      <label className="builder-field">
        <span>Meta description</span>
        <textarea rows={2} value={description} onChange={(event) => onChange({ title, description: event.target.value, canonicalPath, keywords, socialImageUrl })} />
      </label>
      <label className="builder-field">
        <span>Canonical path</span>
        <input value={canonicalPath} onChange={(event) => onChange({ title, description, canonicalPath: event.target.value, keywords, socialImageUrl })} />
      </label>
      <label className="builder-field">
        <span>Keywords</span>
        <input value={keywords.join(", ")} onChange={(event) => onChange({ title, description, canonicalPath, keywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean), socialImageUrl })} />
      </label>
      <ImageUploadField
        label="SEO/social image"
        value={socialImageUrl ?? null}
        onChange={(nextImage) => onChange({ title, description, canonicalPath, keywords, socialImageUrl: nextImage })}
      />
    </div>
  );
}

function TwinAssistRow({
  error,
  loading,
  onClick,
  text
}: {
  error: string;
  loading: boolean;
  onClick: () => void;
  text: string;
}) {
  return (
    <div className="twin-assist-row">
      <button disabled={loading} onClick={onClick} type="button">
        <Icons.sparkle size={17} />
        <span>{loading ? "Asking Twin..." : "Ask Receiz Twin"}</span>
      </button>
      <small>{error || text}</small>
    </div>
  );
}

function EmptyContent({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="panel-empty-state">
      {icon}
      <strong>{label}</strong>
      <span>Create rich content from the mobile or desktop admin console.</span>
    </div>
  );
}
