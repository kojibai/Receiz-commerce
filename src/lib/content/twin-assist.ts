import type { BlogPost, BrandConfig, Product, SeoConfig, SitePage } from "@/types/domain";

export type TwinAssistKind = "page" | "blog" | "product";

export type TwinAssistInput = {
  kind: TwinAssistKind;
  brand: Pick<BrandConfig, "name" | "tagline" | "logoText">;
  topic?: string;
  page?: SitePage;
  post?: BlogPost;
  product?: Product;
};

export type TwinAssistResult = {
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  seo: SeoConfig;
  source: "receiz_twin" | "local_twin_template";
  rail: "receiz_world_message" | "receiz_connect_record" | "local_preview";
};

function slugify(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);

  return slug || fallback;
}

function keywords(input: TwinAssistInput) {
  const base = [input.brand.name, input.brand.tagline, "Receiz", "proof-sealed commerce"];
  const topic = input.topic ? [input.topic] : [];
  return Array.from(new Set([...base, ...topic].map((item) => item.trim()).filter(Boolean))).slice(0, 8);
}

function seo(title: string, description: string, canonicalPath: string, input: TwinAssistInput): SeoConfig {
  return {
    title,
    description,
    canonicalPath,
    keywords: keywords(input),
    socialImageUrl: null
  };
}

export function createTwinAssistDraft(input: TwinAssistInput): TwinAssistResult {
  const brand = input.brand.name || "Your store";
  const topic =
    input.topic?.trim() ||
    input.post?.title ||
    input.page?.title ||
    input.product?.name ||
    `${brand} launch`;

  if (input.kind === "product") {
    const title = input.product?.name && input.product.name !== "New product" ? input.product.name : topic;
    const subtitle = `${brand} proof-sealed ${input.product?.type?.replace("_", " ") ?? "product"}`;
    const description = [
      `${title} is built for customers who want the experience, access, and proof behind what they buy.`,
      `Each order can be connected to Receiz ID, wallet checkout, rewards, and a proof object so ownership and benefits stay clear after purchase.`,
      `Use this product for physical goods, digital access, member benefits, or Receized assets.`
    ].join("\n\n");
    const canonicalPath = `/products/${slugify(title, "product")}`;

    return {
      title,
      slug: canonicalPath,
      subtitle,
      body: description,
      description,
      seo: seo(`${title} | ${brand}`, `${subtitle}. ${description.slice(0, 110)}`, canonicalPath, input),
      source: "local_twin_template",
      rail: "local_preview"
    };
  }

  if (input.kind === "blog") {
    const title = input.post?.title && input.post.title !== "New story" ? input.post.title : topic;
    const slug = `/blog/${slugify(title, "story")}`;
    const excerpt = `A useful guide from ${brand} about ${title.toLowerCase()}, rewards, and proof-sealed commerce.`;
    const body = [
      `# ${title}`,
      `${brand} uses Receiz to connect identity, checkout, rewards, and proof objects into one customer experience.`,
      `This post should teach customers what matters, why it matters, and what action they can take next. Start with the customer problem, show the product or benefit, then explain how Receiz proof makes it trustworthy.`,
      `Finish with a clear call to action: shop the collection, join the rewards program, claim a benefit, or sign in with Receiz ID.`
    ].join("\n\n");

    return {
      title,
      slug,
      excerpt,
      body,
      tags: ["guide", "rewards", "proof"],
      seo: seo(`${title} | ${brand}`, excerpt, slug, input),
      source: "local_twin_template",
      rail: "local_preview"
    };
  }

  const title = input.page?.title && input.page.title !== "New landing page" ? input.page.title : topic;
  const slug = input.page?.slug && input.page.slug !== "/" ? input.page.slug : `/${slugify(title, "page")}`;
  const body = [
    `${brand} gives customers a fast, proof-sealed way to shop, earn rewards, and keep ownership records connected to Receiz ID.`,
    `Use this page to explain the offer, highlight the collection, and guide customers into checkout, rewards, access, or a Receized asset.`,
    `Every section should be direct: what customers get, why it is valuable, and what action they should take next.`
  ].join("\n\n");

  return {
    title,
    slug,
    body,
    seo: seo(`${title} | ${brand}`, body.slice(0, 150), slug, input),
    source: "local_twin_template",
    rail: "local_preview"
  };
}
