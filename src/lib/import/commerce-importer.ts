import type { BlogPost, Product, ProductType, SitePage } from "../../types/domain";

export type CommerceImportSourceType =
  | "shopify"
  | "wordpress"
  | "woocommerce"
  | "wix"
  | "generic_site"
  | "csv"
  | "json";

export type CommerceImportInput = {
  sourceType: CommerceImportSourceType;
  payload: string;
  sourceUrl?: string;
};

export type CommerceImportResult = {
  products: Product[];
  blogPosts: BlogPost[];
  pages: SitePage[];
  warnings: string[];
  summary: {
    products: number;
    blogPosts: number;
    pages: number;
  };
};

function stripHtml(value: unknown) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string, fallback = "item") {
  return (
    stripHtml(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 76) || fallback
  );
}

function numberPrice(value: unknown) {
  const amount = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function priceLabel(value: unknown) {
  const amount = numberPrice(value);
  return amount > 0 ? `$${amount.toFixed(2)}` : "$0.00";
}

function imageToneFor(name: string, type?: string): Product["imageTone"] {
  const text = `${name} ${type ?? ""}`.toLowerCase();
  if (text.includes("mug")) return "mug";
  if (text.includes("card") || text.includes("gift")) return "card";
  if (text.includes("class") || text.includes("event")) return "class";
  if (text.includes("pass") || text.includes("access") || text.includes("member")) return "access";
  if (text.includes("drink") || text.includes("brew") || text.includes("can")) return "can";
  return "bag";
}

function productTypeFor(name: string, sourceType?: string): ProductType {
  const text = `${name} ${sourceType ?? ""}`.toLowerCase();
  if (text.includes("gift card") || text.includes("digital")) return "digital";
  if (text.includes("access") || text.includes("pass") || text.includes("member")) return "access";
  if (text.includes("class") || text.includes("event") || text.includes("ticket")) return "experience";
  if (text.includes("benefit") || text.includes("perk")) return "benefit";
  return "physical";
}

function makeProduct(input: {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  price?: unknown;
  inventory?: unknown;
  status?: string;
  type?: string;
  imageUrl?: string | null;
}): Product {
  const name = stripHtml(input.name || "Imported product");
  const slug = slugify(name, input.id);
  const description = stripHtml(input.description || input.subtitle || "Imported product ready for Receiz proof-sealed commerce.");
  const subtitle = stripHtml(input.subtitle || description).slice(0, 120) || "Imported product";

  return {
    id: `import-${slug}-${String(input.id).replace(/[^a-z0-9]+/gi, "").slice(0, 16)}`,
    name,
    subtitle,
    type: productTypeFor(name, input.type),
    priceLabel: priceLabel(input.price),
    status: input.status === "draft" ? "draft" : "active",
    inventoryLabel: String(input.inventory ?? "0"),
    rewardEligible: true,
    sealed: false,
    imageTone: imageToneFor(name, input.type),
    imageUrl: input.imageUrl ?? null,
    description,
    seo: {
      title: name,
      description,
      canonicalPath: `/products/${slug}`,
      keywords: [name, input.type ?? "imported product"].filter(Boolean),
      socialImageUrl: input.imageUrl ?? null
    }
  };
}

function makeBlogPost(input: {
  id: string;
  title: string;
  excerpt?: string;
  body?: string;
  authorName?: string;
  publishedAt?: string;
  tags?: string[];
  imageUrl?: string | null;
}): BlogPost {
  const title = stripHtml(input.title || "Imported post");
  const slug = slugify(title, input.id);
  const excerpt = stripHtml(input.excerpt || input.body || "Imported content.").slice(0, 180);
  const body = stripHtml(input.body || input.excerpt || "Imported content.");

  return {
    id: `import-post-${slug}-${String(input.id).replace(/[^a-z0-9]+/gi, "").slice(0, 16)}`,
    title,
    slug: `/blog/${slug}`,
    excerpt,
    body,
    authorName: input.authorName || "Imported",
    coverImageUrl: input.imageUrl ?? null,
    tags: input.tags ?? ["imported"],
    featured: false,
    status: "published",
    publishedAt: input.publishedAt || new Date().toISOString(),
    seo: {
      title,
      description: excerpt,
      canonicalPath: `/blog/${slug}`,
      keywords: input.tags ?? ["imported content"],
      socialImageUrl: input.imageUrl ?? null
    }
  };
}

function makePage(input: { id: string; title: string; body?: string }): SitePage {
  const title = stripHtml(input.title || "Imported page");
  const slug = `/${slugify(title, input.id)}`;
  const body = stripHtml(input.body || "Imported page content.");

  return {
    id: `import-page-${slugify(title, input.id)}-${String(input.id).replace(/[^a-z0-9]+/gi, "").slice(0, 16)}`,
    title,
    slug,
    visibleInNav: false,
    published: true,
    sections: [
      {
        id: `section-${slugify(title, input.id)}`,
        kind: "content",
        title,
        body
      }
    ],
    seo: {
      title,
      description: body.slice(0, 155),
      canonicalPath: slug,
      keywords: ["imported page"],
      socialImageUrl: null
    }
  };
}

function parseJson(payload: string): unknown {
  return JSON.parse(payload);
}

function arrayFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["products", "items", "posts", "pages", "data"]) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
  }
  return [];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function rendered(value: unknown) {
  const data = record(value);
  return typeof data.rendered === "string" ? data.rendered : String(value ?? "");
}

function importShopify(value: unknown): Pick<CommerceImportResult, "products" | "blogPosts" | "pages" | "warnings"> {
  const products = arrayFrom(record(value).products ?? value).map((item) => {
    const data = record(item);
    const variant = record(arrayFrom(data.variants)[0]);
    const image = record(data.image);

    return makeProduct({
      id: String(data.id ?? data.handle ?? data.title ?? crypto.randomUUID()),
      name: String(data.title ?? data.name ?? "Imported Shopify product"),
      subtitle: stripHtml(data.product_type || data.vendor || data.body_html),
      description: stripHtml(data.body_html || data.description),
      price: variant.price ?? data.price,
      inventory: variant.inventory_quantity ?? data.inventory_quantity ?? "0",
      status: data.status === "draft" ? "draft" : "active",
      type: String(data.product_type ?? ""),
      imageUrl: typeof image.src === "string" ? image.src : null
    });
  });

  return { products, blogPosts: [], pages: [], warnings: [] };
}

function importWordPress(value: unknown): Pick<CommerceImportResult, "products" | "blogPosts" | "pages" | "warnings"> {
  const data = record(value);
  const productSource = Array.isArray(data.products) ? data.products : data.type === "product" ? arrayFrom(value) : [];
  const postSource = Array.isArray(data.posts) ? data.posts : Array.isArray(value) ? arrayFrom(value) : [];
  const pageSource = Array.isArray(data.pages) ? data.pages : [];
  const products = productSource.map((item) => {
    const entry = record(item);
    const image = record(arrayFrom(entry.images)[0]);

    return makeProduct({
      id: String(entry.id ?? entry.slug ?? entry.name ?? crypto.randomUUID()),
      name: String(entry.name ?? rendered(entry.title) ?? "Imported WordPress product"),
      subtitle: stripHtml(entry.short_description ?? entry.description),
      description: stripHtml(entry.description ?? entry.short_description),
      price: entry.price ?? entry.regular_price,
      inventory: entry.stock_quantity ?? "0",
      status: entry.status === "draft" ? "draft" : "active",
      type: String(entry.type ?? entry.categories ?? ""),
      imageUrl: typeof image.src === "string" ? image.src : null
    });
  });
  const blogPosts = postSource
    .map(record)
    .filter((entry) => entry.type !== "page" && !entry.name)
    .map((entry) =>
      makeBlogPost({
        id: String(entry.id ?? entry.slug ?? crypto.randomUUID()),
        title: rendered(entry.title),
        excerpt: rendered(entry.excerpt),
        body: rendered(entry.content),
        authorName: "WordPress",
        publishedAt: typeof entry.date === "string" ? entry.date : undefined
      })
    );
  const pages = pageSource.map((item) => {
    const entry = record(item);
    return makePage({
      id: String(entry.id ?? entry.slug ?? crypto.randomUUID()),
      title: rendered(entry.title),
      body: rendered(entry.content)
    });
  });

  return { products, blogPosts, pages, warnings: [] };
}

function parseCsv(payload: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < payload.length; index += 1) {
    const char = payload[index];
    const next = payload[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      field += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  rows.push(row);

  const headers = rows.shift()?.map((item) => item.trim().toLowerCase()) ?? [];
  return rows
    .filter((items) => items.some((item) => item.trim()))
    .map((items) =>
      Object.fromEntries(headers.map((header, index) => [header, items[index]?.trim() ?? ""]))
    );
}

function importCsv(payload: string): Pick<CommerceImportResult, "products" | "blogPosts" | "pages" | "warnings"> {
  const products = parseCsv(payload).map((entry, index) =>
    makeProduct({
      id: entry.id || entry.sku || String(index + 1),
      name: entry.title || entry.name || "Imported product",
      subtitle: entry.subtitle || entry.description,
      description: entry.body || entry.description,
      price: entry.price,
      inventory: entry.inventory || entry.quantity || entry.stock,
      status: entry.status,
      type: entry.type || entry.category,
      imageUrl: entry.image || entry.image_url || null
    })
  );

  return { products, blogPosts: [], pages: [], warnings: [] };
}

function jsonLdObjects(payload: string): Record<string, unknown>[] {
  const scripts = Array.from(payload.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi));
  return scripts.flatMap((match) => {
    try {
      const parsed = JSON.parse(match[1] ?? "{}");
      const graph = record(parsed)["@graph"];
      return Array.isArray(graph) ? graph.map(record) : [record(parsed)];
    } catch {
      return [];
    }
  });
}

function firstMeta(payload: string, pattern: RegExp) {
  return stripHtml(payload.match(pattern)?.[1] ?? "");
}

function importGenericHtml(payload: string): Pick<CommerceImportResult, "products" | "blogPosts" | "pages" | "warnings"> {
  const objects = jsonLdObjects(payload);
  const products = objects
    .filter((item) => String(item["@type"] ?? "").toLowerCase().includes("product"))
    .map((item, index) => {
      const offers = record(item.offers);
      return makeProduct({
        id: String(item.sku ?? item.productID ?? index + 1),
        name: String(item.name ?? "Imported product"),
        subtitle: String(item.description ?? ""),
        description: String(item.description ?? ""),
        price: offers.price,
        inventory: "0",
        type: String(item.category ?? ""),
        imageUrl: Array.isArray(item.image) ? String(item.image[0]) : typeof item.image === "string" ? item.image : null
      });
    });
  const blogPosts = objects
    .filter((item) => /article|blogposting|newsarticle/i.test(String(item["@type"] ?? "")))
    .map((item, index) =>
      makeBlogPost({
        id: String(item.identifier ?? item.url ?? index + 1),
        title: String(item.headline ?? item.name ?? "Imported story"),
        excerpt: String(item.description ?? ""),
        body: String(item.articleBody ?? item.description ?? ""),
        authorName: stripHtml(record(item.author).name ?? item.author ?? "Imported"),
        publishedAt: typeof item.datePublished === "string" ? item.datePublished : undefined,
        imageUrl: Array.isArray(item.image) ? String(item.image[0]) : typeof item.image === "string" ? item.image : null
      })
    );
  const title = firstMeta(payload, /<title[^>]*>([\s\S]*?)<\/title>/i) || firstMeta(payload, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const description = firstMeta(payload, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const pages = title
    ? [
        makePage({
          id: "home",
          title,
          body: description || stripHtml(payload).slice(0, 700)
        })
      ]
    : [];

  return { products, blogPosts, pages, warnings: objects.length ? [] : ["No JSON-LD objects found; imported page metadata only."] };
}

export function parseCommerceImport(input: CommerceImportInput): CommerceImportResult {
  const warnings: string[] = [];
  let imported: Pick<CommerceImportResult, "products" | "blogPosts" | "pages" | "warnings">;

  try {
    if (input.sourceType === "csv") {
      imported = importCsv(input.payload);
    } else if (input.sourceType === "generic_site" || input.sourceType === "wix") {
      imported = input.payload.trim().startsWith("{")
        ? importGenericHtml(`<script type="application/ld+json">${input.payload}</script>`)
        : importGenericHtml(input.payload);
    } else if (input.sourceType === "shopify") {
      imported = importShopify(parseJson(input.payload));
    } else if (input.sourceType === "wordpress" || input.sourceType === "woocommerce") {
      imported = importWordPress(parseJson(input.payload));
    } else {
      const parsed = parseJson(input.payload);
      imported = {
        ...importShopify(parsed),
        blogPosts: importWordPress(parsed).blogPosts,
        pages: importWordPress(parsed).pages
      };
    }
  } catch (error) {
    throw new Error(error instanceof Error ? `Import failed: ${error.message}` : "Import failed");
  }

  warnings.push(...imported.warnings);

  return {
    products: imported.products,
    blogPosts: imported.blogPosts,
    pages: imported.pages,
    warnings,
    summary: {
      products: imported.products.length,
      blogPosts: imported.blogPosts.length,
      pages: imported.pages.length
    }
  };
}
