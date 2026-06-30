import { NextRequest, NextResponse } from "next/server";
import { createTwinAssistDraft, type TwinAssistInput } from "@/lib/content/twin-assist";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { platform } from "@/lib/platform";
import type { JsonObject } from "@receiz/sdk";

export const runtime = "nodejs";

const CONTENT_ASSIST_SCHEMA = "receiz.app.content_assist.v1";

function isTwinAssistInput(value: unknown): value is TwinAssistInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  const brand = input.brand;
  return (
    (input.kind === "page" || input.kind === "blog" || input.kind === "product") &&
    Boolean(brand) &&
    typeof brand === "object" &&
    !Array.isArray(brand)
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function nestedRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return {};
}

function stringField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function stringArrayField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
    }
  }
  return [];
}

function normalizeWorldUsername(value: string) {
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/\.receiz\.id$/i, "")
    .replace(/[^a-z0-9._-]+/gi, "")
    .slice(0, 72);
}

function usernameFromReceizProfile(userinfo: unknown, input: TwinAssistInput) {
  const root = asRecord(userinfo);
  const appProfile = nestedRecord(root, ["receiz_app", "commerce", "store", "app_metadata", "profile"]);
  const profile = { ...root, ...appProfile };
  const fromProfile = stringField(profile, ["receiz_id", "receizId", "preferred_username", "username", "handle"]);
  const fromBrand = input.brand.logoText || input.brand.name || "receiz";
  return normalizeWorldUsername(fromProfile || fromBrand) || "receiz";
}

function promptForTwin(input: TwinAssistInput, fallback: ReturnType<typeof createTwinAssistDraft>, mandate: JsonObject | null) {
  const subject =
    input.topic?.trim() ||
    input.product?.name ||
    input.post?.title ||
    input.page?.title ||
    `${input.brand.name} ${input.kind}`;
  const current =
    input.product?.description ||
    input.post?.body ||
    input.page?.sections?.map((section) => `${section.title}: ${section.body}`).join("\n") ||
    fallback.body;

  return [
    `You are the Receiz Twin for ${input.brand.name}.`,
    `Create production-ready ${input.kind} content for a proof-sealed ecommerce store.`,
    `Subject: ${subject}`,
    `Brand tagline: ${input.brand.tagline}`,
    mandate ? `Current market mandate context: ${JSON.stringify(mandate)}` : "Use the owner's public World and Twin context.",
    "Return concise, structured content with title, slug, body, excerpt/subtitle/description when useful, SEO title, SEO description, and tags.",
    `Current draft context:\n${current}`
  ].join("\n\n");
}

function draftFromWorldReply(
  fallback: ReturnType<typeof createTwinAssistDraft>,
  worldResponse: JsonObject
) {
  const reply = asRecord(worldResponse.reply);
  const world = asRecord(worldResponse.world);
  const draft = {
    ...nestedRecord(world, ["draft", "contentDraft", "commerceDraft"]),
    ...nestedRecord(reply, ["draft", "content", "contentDraft", "commerceDraft"]),
    ...reply
  };
  const text = stringField(reply, ["text", "content", "message", "body", "reply"]) || stringField(world, ["text", "content", "message"]);
  const title = stringField(draft, ["title", "headline", "name"]) || fallback.title;
  const slug = stringField(draft, ["slug", "path", "canonicalPath"]) || fallback.slug;
  const description = stringField(draft, ["description", "summary"]) || fallback.description;
  const body = stringField(draft, ["body", "content", "copy", "markdown"]) || text || fallback.body;
  const excerpt = stringField(draft, ["excerpt", "summary", "dek"]) || fallback.excerpt;
  const subtitle = stringField(draft, ["subtitle", "subheadline"]) || fallback.subtitle;
  const tags = stringArrayField(draft, ["tags", "keywords"]);
  const seoRecord = nestedRecord(draft, ["seo"]);
  const seoTitle = stringField(seoRecord, ["title"]) || stringField(draft, ["seoTitle"]) || fallback.seo.title;
  const seoDescription =
    stringField(seoRecord, ["description"]) ||
    stringField(draft, ["seoDescription"]) ||
    description ||
    excerpt ||
    fallback.seo.description;
  const canonicalPath = stringField(seoRecord, ["canonicalPath"]) || slug || fallback.seo.canonicalPath;

  return {
    ...fallback,
    title,
    slug,
    body,
    excerpt,
    subtitle,
    description,
    tags: tags.length ? tags : fallback.tags,
    seo: {
      ...fallback.seo,
      title: seoTitle,
      description: seoDescription,
      canonicalPath
    },
    source: "receiz_twin" as const,
    rail: "receiz_world_message" as const
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!isTwinAssistInput(body)) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_twin_assist_request",
        message: "Send kind, brand, and the current page/blog/product draft."
      },
      { status: 400 }
    );
  }

  const hostContext = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  const accessToken = request.cookies.get("receiz_access_token")?.value;
  const sessionScope = request.cookies.get("receiz_session_scope")?.value;
  const hasScopedSession = Boolean(accessToken && sessionScope === hostContext.storageKey);
  const draft = createTwinAssistDraft(body);

  // Local Receiz ID proof memory is enough for first-paint drafting. Connect tokens are only
  // needed when we can call delegated Twin/World rails from the server.
  if (!hasScopedSession || !accessToken) {
    return NextResponse.json({
      ok: true,
      mode: "local_preview",
      note: "Generated locally from this store context. Connect is only needed for delegated Twin/World rails.",
      draft
    });
  }

  try {
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });
    const userinfo = await receiz.client.identity.userinfo().catch(() => ({}));
    const username = usernameFromReceizProfile(userinfo, body);
    const mandateResponse = await receiz.twinMarketMandate().catch(() => null);
    const mandate = mandateResponse?.ok && mandateResponse.mandate ? (mandateResponse.mandate as JsonObject) : null;
    const worldResponse = await receiz.worldMessage(username, {
      visitorKey: hostContext.storageKey,
      threadKey: `content:${body.kind}:${body.topic ?? body.page?.id ?? body.post?.id ?? body.product?.id ?? "draft"}`,
      message: promptForTwin(body, draft, mandate),
      clientContext: {
        app: platform.productName,
        hostScope: hostContext.storageKey,
        tenantHost: hostContext.tenantHost,
        contentKind: body.kind,
        brand: body.brand,
        draft,
        mandate
      }
    });
    const twinDraft = worldResponse.ok
      ? draftFromWorldReply(draft, worldResponse as JsonObject)
      : {
          ...draft,
          source: "receiz_twin" as const,
          rail: "receiz_world_message" as const
        };
    const record = await receiz.connectRecord({
      schema: CONTENT_ASSIST_SCHEMA,
      platform: platform.productName,
      hostScope: hostContext.storageKey,
      tenantHost: hostContext.tenantHost,
      kind: body.kind,
      requestedAt: new Date().toISOString(),
      prompt: body.topic ?? body.page?.title ?? body.post?.title ?? body.product?.name ?? "",
      brand: body.brand,
      userinfo,
      twinUsername: username,
      twinMandate: mandateResponse,
      worldResponse,
      draft: twinDraft
    });

    return NextResponse.json({
      ok: true,
      mode: "receiz_world_twin_recorded",
      draft: twinDraft,
      record
    });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      mode: "local_preview",
      warning: error instanceof Error ? error.message : "Receiz Twin assist was generated locally.",
      draft
    });
  }
}
