"use client";

import {
  type DocumentVerifyResponse,
  type ReceizAssetManifest,
  type ReceizAssetManifestProjection as SdkReceizAssetManifestProjection,
  type ReceizIdentityAccountProjection,
  type ReceizKeyFile,
  type ReceizMediaUploadOptions
} from "@receiz/sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { seedCommerceState } from "@/data/seed";
import {
  normalizeCustomDomain,
  normalizeTenantSlug,
  subdomainForSlug
} from "@/lib/hosting/domain-utils";
import { BASE_STORAGE_KEY, currentHostContext, hostContextFromHost, type HostContext } from "@/lib/hosting/host-context";
import { merchantProofAuthorityRequirement, type MerchantAuthorityAction } from "@/lib/hosting/merchant-proof-authority";
import { checkoutTenantHost } from "@/lib/checkout/checkout-request";
import {
  checkoutCompletionState,
  checkoutFulfillmentKind,
  checkoutOrderFulfillment,
  validShippingAddress
} from "@/lib/checkout/customer-purchase";
import type { CommerceImportInput, CommerceImportResult } from "@/lib/import/commerce-importer";
import { selectClientInitialState } from "@/lib/storage/client-state";
import { externalWorkspaceState } from "@/lib/storage/workspace-sync";
import { safeGetLocalStorage, safeRemoveLocalStorage, safeSetLocalStorage } from "@/lib/storage/browser-storage";
import { mergeCustomDomainHostingResponse } from "@/lib/storage/hosting-response";
import { pendingPublishStorageKey, shouldResumePendingPublish } from "@/lib/storage/pending-publish";
import { mergeStoreApiProjection, mergeStoreCommerceProjection } from "@/lib/storefront/store-api-projection";
import {
  applyLocalReceizIdentitySession,
  applyPlatformBrowserReceizIdSession
} from "@/lib/storefront/local-identity-session";
import {
  stateWithCartProduct,
  stateWithCartQuantity,
  stateWithoutCartProduct
} from "@/lib/storefront/product-purchase";
import {
  buildExchangeTradePreview,
  stateWithListedExchangeAsset,
  stateWithExchangeLiquidity,
  type ExchangeTradeSide
} from "@/lib/storefront/proof-exchange";
import {
  assertPublishRequestBodySize,
  compressInlineImageDataUrlForPublish,
  preparePublishRequestBody
} from "@/lib/receiz/publish-payload-media";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { canonicalReceizVerifyUrl, receizVerifyUrl } from "@/lib/receiz/verify-url";
import {
  applyBrowserReceizIdSession,
  applyTenantCustomerSession,
  BROWSER_RECEIZ_ID_SESSION_KEY,
  buildBrowserReceizIdSession,
  buildTenantCustomerSession,
  parseBrowserReceizIdSession,
  parseTenantCustomerSession,
  tenantCustomerSessionKey
} from "@/lib/storefront/tenant-customer-session";
import {
  receizProfileMatchesWorkspace,
  receizProfileOwnerKey
} from "@/lib/storage/receiz-profile-workspace";
import type { ActionFeedbackMap, ActionFeedbackStatus } from "@/types/action-feedback";
import type { EmbeddedPaymentPurpose, EmbeddedPaymentSession } from "@/types/embedded-payment";
import type {
  BlogPost,
  CommerceState,
  CustomerAccount,
  Order,
  Product,
  ProofEvent,
  ReceizAssetManifestProjection,
  ReceizedAsset,
  SitePage,
  StorefrontHomepageMode
} from "@/types/domain";
import { makeId } from "@/lib/utils";
import { compactPublishedState } from "@/lib/receiz/proof-state";
import type { PortableCardAsset } from "@/features/play/portable-card";
import { portableCardPngBlob } from "@/features/play/card-export";

function readState(hostContext: HostContext, fallbackState: CommerceState = seedCommerceState): CommerceState {
  if (typeof window === "undefined") return fallbackState;

  return selectClientInitialState(hostContext, fallbackState, {
    scoped: safeGetLocalStorage(window.localStorage, hostContext.storageKey),
    base: hostContext.surface === "tenant" ? null : safeGetLocalStorage(window.localStorage, BASE_STORAGE_KEY)
  });
}

function makeEvent(type: ProofEvent["type"], detail: string): ProofEvent {
  const status =
    type === "ASSET_RECEIZED"
      ? "sealed"
      : type === "DOMAIN_CONNECTED" || type === "RECEIZ_ID_CONNECTED"
        ? "linked"
        : type === "BILLING_METHOD_ADDED" || type === "HOSTING_PLAN_UPDATED" || type === "THEME_UPDATED"
          ? "success"
          : "verified";

  return {
    id: makeId("event"),
    type,
    title: type,
    detail,
    status,
    timestampLabel: "now",
    createdAt: new Date().toISOString()
  };
}

function slugify(value: string, fallback = "untitled") {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);

  return slug || fallback;
}

function pageWithDefaults(page: SitePage): SitePage {
  const path = page.slug.startsWith("/") ? page.slug : `/${slugify(page.slug || page.title, "page")}`;

  return {
    ...page,
    slug: path,
    seo: page.seo ?? {
      title: page.title,
      description: page.sections[0]?.body ?? "",
      canonicalPath: path,
      keywords: [],
      socialImageUrl: null
    }
  };
}

function blogPostWithDefaults(post: BlogPost): BlogPost {
  const path = post.slug.startsWith("/blog/") ? post.slug : `/blog/${slugify(post.slug || post.title, "post")}`;

  return {
    ...post,
    slug: path,
    seo: {
      ...post.seo,
      canonicalPath: post.seo.canonicalPath || path,
      title: post.seo.title || post.title,
      description: post.seo.description || post.excerpt
    }
  };
}

function productWithDefaults(product: Product): Product {
  return {
    ...product,
    id: product.id || makeId("product"),
    seo: product.seo ?? {
      title: product.name,
      description: product.description || product.subtitle,
      canonicalPath: `/products/${slugify(product.name, "product")}`,
      keywords: [product.type.replace("_", " "), product.name],
      socialImageUrl: null
    }
  };
}

const DEFAULT_PRODUCT_IDS = new Set(["coffee-pack", "cold-brew", "ceramic-mug", "gift-card"]);
const DEFAULT_PAGE_IDS = new Set(["home", "shop", "rewards", "game", "about", "account"]);
const DEFAULT_BLOG_POST_IDS = new Set(["blog-origin-roast", "blog-rewards-guide"]);

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function brandInitials(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.slice(0, 1).toLowerCase())
    .join("");

  return initials || "rz";
}

function compactSentence(value: string, maxLength = 152) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;

  return `${clean.slice(0, maxLength - 1).trim()}...`;
}

function brandNameFromTwinBrief(brief: string, fallback: string) {
  const explicit = brief.match(/(?:business called|business named|store called|store named|called|named|brand(?:ed)? as)\s+["']?([^,.!?"]{2,56})/i);
  if (explicit?.[1]) {
    const name = explicit[1].split(/\s+(?:with|for|that|where|who)\s+/i)[0];
    return titleCase(name);
  }

  const stopWords = new Set([
    "a",
    "an",
    "and",
    "app",
    "brand",
    "build",
    "business",
    "create",
    "for",
    "i",
    "is",
    "launch",
    "make",
    "my",
    "of",
    "shop",
    "site",
    "store",
    "that",
    "the",
    "to",
    "want",
    "website"
  ]);
  const words = brief
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 3);

  return words.length ? titleCase(words.join(" ")) : fallback;
}

function twinBusinessProfile(brief: string) {
  const lower = brief.toLowerCase();

  if (/(coffee|cafe|espresso|roast|bean|brew)/.test(lower)) {
    return {
      category: "Coffee",
      signature: "Signature roast",
      access: "Member tasting pass",
      heroBody: "Fresh drops, verified sourcing, member rewards, and proof-sealed coffee customers can trust.",
      story: "How every roast carries a proof trail",
      storyTag: "sourcing",
      productTone: "bag" as const,
      palette: ["#4d1f78", "#00a88a", "#ff8f70"]
    };
  }

  if (/(fitness|gym|training|wellness|health|coach)/.test(lower)) {
    return {
      category: "Training",
      signature: "Starter training pack",
      access: "Member access pass",
      heroBody: "Programs, products, access, and rewards that stay attached to each customer Receiz ID.",
      story: "How members unlock verified progress rewards",
      storyTag: "wellness",
      productTone: "class" as const,
      palette: ["#111827", "#00a88a", "#ffbd00"]
    };
  }

  if (/(fashion|clothing|streetwear|apparel|drop|merch)/.test(lower)) {
    return {
      category: "Drops",
      signature: "Signature drop",
      access: "Early access pass",
      heroBody: "Limited products, gated access, and proof-sealed member perks for every drop.",
      story: "How proof-sealed drops protect members",
      storyTag: "drops",
      productTone: "card" as const,
      palette: ["#121212", "#00a88a", "#ff6b86"]
    };
  }

  if (/(course|education|creator|community|membership|lesson)/.test(lower)) {
    return {
      category: "Access",
      signature: "Starter resource pack",
      access: "Community access pass",
      heroBody: "Sell access, digital products, rewards, and proof-sealed member benefits from one mobile storefront.",
      story: "How members use proof-sealed access",
      storyTag: "members",
      productTone: "access" as const,
      palette: ["#1f3a8a", "#00a88a", "#ffbd00"]
    };
  }

  return {
    category: "Featured",
    signature: "Signature product",
    access: "Member perk",
    heroBody: "Products, payments, rewards, access, and proof-sealed customer accounts in one store.",
    story: "How proof-sealed commerce works here",
    storyTag: "proof",
    productTone: "bag" as const,
    palette: ["#122033", "#00a88a", "#ff6b86"]
  };
}

function homepageModeFromTwinBrief(brief: string, current: StorefrontHomepageMode): StorefrontHomepageMode {
  const lower = brief.toLowerCase();
  if (/\b(blog|publication|journal|stories|content)\b/.test(lower)) return "blog";
  if (/\b(exchange|market|trade|trading|fractional|shares|liquidity|asset market)\b/.test(lower)) return "exchange";
  if (/\b(game|play|quest|arcade|challenge)\b/.test(lower)) return "game";
  return current || "store";
}

function buildTwinLaunchState(current: CommerceState, brief: string): CommerceState {
  const brandName = brandNameFromTwinBrief(brief, current.brand.name || "Receiz Store");
  const profile = twinBusinessProfile(brief);
  const baseSlug = slugify(brandName, "store");
  const logoText = current.brand.logoImageUrl ? current.brand.logoText : brandInitials(brandName);
  const [primaryColor, secondaryColor, accentColor] = profile.palette;
  const productAId = `${baseSlug}-signature`;
  const productBId = `${baseSlug}-access`;
  const rewardId = `${baseSlug}-reward`;
  const now = new Date().toISOString();
  const heroBody = compactSentence(brief, 168) || profile.heroBody;
  const starterProducts: Product[] = [
    productWithDefaults({
      id: productAId,
      name: profile.signature,
      subtitle: `${brandName} proof-sealed product`,
      type: "physical",
      priceLabel: "$18.00",
      status: "active",
      inventoryLabel: "100",
      rewardEligible: true,
      sealed: true,
      imageTone: profile.productTone,
      imageUrl: current.products[0]?.imageUrl ?? null,
      description: `${profile.signature} from ${brandName}. Every purchase can create a proof-sealed order, reward progress, and customer account history.`,
      seo: {
        title: `${profile.signature} | ${brandName}`,
        description: `${brandName} ${profile.signature.toLowerCase()} with Receiz ID checkout, rewards, and proof-sealed order history.`,
        canonicalPath: `/products/${slugify(profile.signature, "product")}`,
        keywords: [brandName, profile.category, "Receiz", "proof-sealed commerce"],
        socialImageUrl: current.products[0]?.imageUrl ?? current.brand.logoImageUrl
      }
    }),
    productWithDefaults({
      id: productBId,
      name: profile.access,
      subtitle: `${brandName} customer benefit`,
      type: "access",
      priceLabel: "$9.00",
      status: "active",
      inventoryLabel: "Unlimited",
      rewardEligible: true,
      sealed: true,
      imageTone: "access",
      imageUrl: current.products[1]?.imageUrl ?? null,
      description: `${profile.access} gives customers a native account, store rewards, and portable Receiz proof for ${brandName}.`,
      seo: {
        title: `${profile.access} | ${brandName}`,
        description: `Buy ${profile.access.toLowerCase()} from ${brandName} with wallet-first Receiz checkout and proof-sealed account benefits.`,
        canonicalPath: `/products/${slugify(profile.access, "access")}`,
        keywords: [brandName, "access", "Receiz rewards", "proof object"],
        socialImageUrl: current.products[1]?.imageUrl ?? current.brand.logoImageUrl
      }
    })
  ];
  const starterCollections: CommerceState["collections"] = [
    {
      id: `${baseSlug}-featured`,
      name: profile.category,
      slug: slugify(profile.category, "featured"),
      productIds: [productAId],
      published: true
    },
    {
      id: `${baseSlug}-access`,
      name: "Access",
      slug: "access",
      productIds: [productBId],
      published: true
    },
    {
      id: `${baseSlug}-rewards`,
      name: "Rewards",
      slug: "rewards",
      productIds: [productAId, productBId],
      published: true
    },
    {
      id: `${baseSlug}-drops`,
      name: "Drops",
      slug: "drops",
      productIds: [productAId],
      published: true
    }
  ];
  const starterPages: SitePage[] = [
    pageWithDefaults({
      id: `${baseSlug}-about`,
      title: `About ${brandName}`,
      slug: "/about",
      visibleInNav: true,
      published: true,
      sections: [
        {
          id: `${baseSlug}-about-hero`,
          kind: "hero",
          title: `About ${brandName}`,
          body: `${brandName} is built around ${profile.category.toLowerCase()}, customer accounts, rewards, and proof-sealed commerce. ${profile.heroBody}`
        }
      ],
      seo: {
        title: `About ${brandName}`,
        description: `${brandName} store, rewards, and proof-sealed customer experience.`,
        canonicalPath: "/about",
        keywords: [brandName, profile.category, "Receiz"],
        socialImageUrl: current.brand.logoImageUrl
      }
    }),
    pageWithDefaults({
      id: `${baseSlug}-rewards-page`,
      title: `${brandName} rewards`,
      slug: "/rewards",
      visibleInNav: true,
      published: true,
      sections: [
        {
          id: `${baseSlug}-rewards-hero`,
          kind: "rewards",
          title: "Rewards built into every action",
          body: "Customers can earn perks from purchases, proof actions, member access, campaigns, and game completion."
        }
      ],
      seo: {
        title: `${brandName} rewards`,
        description: `Earn proof-sealed rewards at ${brandName}.`,
        canonicalPath: "/rewards",
        keywords: [brandName, "rewards", "Receiz ID"],
        socialImageUrl: current.brand.logoImageUrl
      }
    }),
    pageWithDefaults({
      id: `${baseSlug}-proof-page`,
      title: "Shipping and proof",
      slug: "/shipping-and-proof",
      visibleInNav: true,
      published: true,
      sections: [
        {
          id: `${baseSlug}-proof-hero`,
          kind: "content",
          title: "Proof-sealed orders",
          body: "Each checkout can attach payment rail, settlement status, shipping detail, and proof history to the customer account for this store."
        }
      ],
      seo: {
        title: `Shipping and proof | ${brandName}`,
        description: `How ${brandName} handles checkout, shipping, and proof-sealed orders.`,
        canonicalPath: "/shipping-and-proof",
        keywords: [brandName, "shipping", "proof-sealed orders"],
        socialImageUrl: current.brand.logoImageUrl
      }
    })
  ];
  const starterPosts: BlogPost[] = [
    blogPostWithDefaults({
      id: `${baseSlug}-story`,
      title: `${profile.story}`,
      slug: `/blog/${slugify(profile.story, "story")}`,
      excerpt: `A customer-friendly look at how ${brandName} connects products, accounts, rewards, and proof.`,
      body: `${brandName} uses Receiz ID, wallet-first checkout, proof-sealed orders, and reward rules to make every customer action portable and verifiable. ${heroBody}`,
      authorName: brandName,
      coverImageUrl: current.blogPosts[0]?.coverImageUrl ?? current.brand.logoImageUrl,
      tags: [profile.storyTag, "Receiz", "rewards"],
      featured: true,
      status: "published",
      publishedAt: now,
      seo: {
        title: `${profile.story} | ${brandName}`,
        description: `Learn how ${brandName} uses proof-sealed commerce and Receiz rewards.`,
        canonicalPath: `/blog/${slugify(profile.story, "story")}`,
        keywords: [brandName, profile.storyTag, "Receiz"],
        socialImageUrl: current.blogPosts[0]?.coverImageUrl ?? current.brand.logoImageUrl
      }
    })
  ];
  const hasStarterCatalog = current.products.length === 0 || current.products.some((product) => DEFAULT_PRODUCT_IDS.has(product.id));
  const hasStarterPages = current.pages.length === 0 || current.pages.some((page) => DEFAULT_PAGE_IDS.has(page.id));
  const hasStarterPosts = current.blogPosts.length === 0 || current.blogPosts.some((post) => DEFAULT_BLOG_POST_IDS.has(post.id));
  const merchantReceizId = current.auth.receizId.connected ? current.auth.receizId.handle : current.hosting.merchantReceizId;
  const starterExchangeDraft: CommerceState = {
    ...current,
    exchange: {
      ...current.exchange,
      enabled: true,
      headline: `${brandName} Exchange`,
      subheadline: `List, fractionally own, trade, and settle ${brandName} proof objects peer to peer.`,
      selectedAssetId: "",
      proofMemoryHead: {
        afterEntryId: null,
        afterKaiUpulse: null,
        afterCreatedAt: null
      },
      assets: []
    },
    proofEvents: []
  };
  const starterExchangeState = starterProducts.reduce<CommerceState>(
    (draft, product, index) =>
      stateWithListedExchangeAsset(draft, {
        source: "product",
        product,
        actorReceizId: merchantReceizId,
        recordedAt: new Date(Date.parse(now) + index * 1000).toISOString()
      }),
    starterExchangeDraft
  );

  return {
    ...current,
    brand: {
      ...current.brand,
      name: brandName,
      logoText,
      tagline: `${profile.category} with proof-sealed rewards`,
      primaryColor,
      secondaryColor,
      accentColor,
      neutralColor: "#111827",
      backgroundColor: current.brand.backgroundColor || "#ffffff"
    },
    storefront: {
      ...current.storefront,
      homepageMode: homepageModeFromTwinBrief(brief, current.storefront.homepageMode),
      headline: brandName,
      subheadline: `${brandName} is ready for products, payments, rewards, and proof.`,
      heroBody,
      ctaLabel: "Shop now"
    },
    hosting: {
      ...current.hosting,
      merchantReceizId,
      settlementAccountLabel: `${brandName} Receiz account`
    },
    navigation: current.navigation.map((item) =>
      item.id === "blog" || item.id === "account" || item.id === "exchange" || item.id === "rewards" ? { ...item, visible: true } : item
    ),
    products: hasStarterCatalog
      ? starterProducts
      : [...starterProducts, ...current.products.filter((product) => product.id !== productAId && product.id !== productBId)],
    collections: hasStarterCatalog
      ? starterCollections
      : [
          ...starterCollections,
          ...current.collections.filter((collection) => !starterCollections.some((starter) => starter.id === collection.id))
        ],
    pages: hasStarterPages
      ? starterPages
      : [...starterPages, ...current.pages.filter((page) => !starterPages.some((starter) => starter.slug === page.slug))],
    blogPosts: hasStarterPosts
      ? starterPosts
      : [...starterPosts, ...current.blogPosts.filter((post) => !starterPosts.some((starter) => starter.slug === post.slug))],
    rewards: [
      {
        ...(current.rewards[0] ?? {
          id: rewardId,
          type: "coupon" as const,
          progress: 0,
          target: 1,
          status: "active" as const,
          transferability: ["redeem_only" as const, "shareable" as const],
          expiresAt: "No expiration"
        }),
        id: rewardId,
        name: `${brandName} member reward`,
        description: `Earn a ${brandName} benefit from purchases, proof actions, and campaigns.`,
        requirement: "Complete a purchase, claim an access pass, or finish the reward game.",
        status: "active"
      },
      ...current.rewards.slice(1)
    ],
    rewardRules: [
      {
        id: `${baseSlug}-purchase-rule`,
        label: "Purchase reward",
        trigger: "Proof-sealed order completed",
        rewardId,
        active: true
      },
      {
        id: `${baseSlug}-game-rule`,
        label: "Game completion",
        trigger: "Customer completes branded reward game",
        rewardId,
        active: true
      }
    ],
    campaigns: [
      {
        ...(current.campaigns[0] ?? {
          id: `${baseSlug}-campaign`,
          enabled: true,
          eligibleObjectIds: [],
          scoreRule: "Purchase, verify, or complete game actions.",
          rewardId
        }),
        name: `${brandName} reward quest`,
        enabled: true,
        rewardId
      },
      ...current.campaigns.slice(1)
    ],
    exchange: starterExchangeState.exchange,
    game: {
      ...current.game,
      enabled: true,
      campaignId: current.campaigns[0]?.id ?? `${baseSlug}-campaign`
    },
    proofEvents: [makeEvent("THEME_UPDATED", `Receiz Twin built ${brandName} from merchant brief`), ...current.proofEvents]
  };
}

function identityArtifactKind(file: File): CommerceState["auth"]["receizId"]["artifactKind"] {
  const name = file.name.toLowerCase();

  if (name.includes("record")) return "identity_record";
  if (file.type.startsWith("image/")) return "identity_seal";
  if (name.includes("receiz-id")) return "receiz_id";

  return "receiz_key";
}

function roundedRectPath(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

async function createIdentitySealImageBytes(keyFile: unknown, receizId: CommerceState["auth"]["receizId"]) {
  if (typeof document === "undefined") throw new Error("identity_seal_browser_required");

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 900;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("identity_seal_canvas_required");

  const gradient = context.createLinearGradient(0, 0, 900, 900);
  gradient.addColorStop(0, "#001b2d");
  gradient.addColorStop(0.52, "#00a58a");
  gradient.addColorStop(1, "#ffffff");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 900, 900);

  context.fillStyle = "rgba(255,255,255,0.92)";
  roundedRectPath(context, 86, 86, 728, 728, 74);
  context.fill();

  context.fillStyle = "#001b2d";
  context.font = "800 58px Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.textAlign = "center";
  context.fillText("Receiz ID", 450, 230);

  context.strokeStyle = "#00a58a";
  context.lineWidth = 18;
  roundedRectPath(context, 320, 300, 260, 260, 74);
  context.stroke();

  context.fillStyle = "#00a58a";
  context.beginPath();
  context.moveTo(390, 424);
  context.lineTo(438, 472);
  context.lineTo(524, 374);
  context.lineWidth = 28;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke();

  context.fillStyle = "#001b2d";
  context.font = "800 42px Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText(receizId.handle, 450, 650);

  context.fillStyle = "#667085";
  context.font = "600 28px Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText("Identity Seal image", 450, 704);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error("identity_seal_canvas_export_failed"));
    }, "image/png");
  });

  const pngBytes = new Uint8Array(await blob.arrayBuffer());
  return createReceizCommerceAdapter().appendIdentityArtifactTrailerToPng(pngBytes, keyFile as ReceizKeyFile);
}

function downloadIdentitySealBytes(bytes: Uint8Array, filename: string) {
  const payload = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(payload).set(bytes);

  const blob = new Blob([payload], { type: "image/png" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function accountHandle(projection: ReceizIdentityAccountProjection | null, fallback: string) {
  const username = projection?.owner.username?.trim();
  if (!username) return fallback;
  return username.includes(".") ? username : `${username}.receiz.id`;
}

type ReceizProfile = {
  id?: string;
  name?: string;
  email?: string;
  handle?: string;
  imageUrl?: string;
  subdomain?: string;
  customDomain?: string;
};

type ReceizProfileResponse = {
  ok: boolean;
  connected: boolean;
  profile?: ReceizProfile;
  surface?: HostContext["surface"];
};

function compactString(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(record: Record<string, unknown> | undefined | null, key: string) {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function recordField(record: Record<string, unknown> | undefined | null, key: string) {
  const value = record?.[key];
  return isRecord(value) ? value : null;
}

function firstString(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() ?? null;
}

function custodyFromUnknown(value: unknown): ReceizAssetManifestProjection["owner"]["custody"] {
  return value === "transferred" || value === "fractionalized" ? value : "current";
}

async function sha256BasisForBlob(file: Blob) {
  try {
    if (globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const hex = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      return `sha256:${hex}`;
    }
  } catch {
    // The SDK verification remains authoritative; this is only a local projection fallback.
  }

  return `sha256:${file.size}-${file.type || "receiz-proof-object"}`;
}

async function readManifestCandidate(file: Blob, filename: string) {
  const likelyJson = file.type.includes("json") || filename.toLowerCase().endsWith(".json");
  if (!likelyJson) return null;

  try {
    return JSON.parse(await file.text()) as unknown;
  } catch {
    return null;
  }
}

function priceLabelFromProjection(projection: SdkReceizAssetManifestProjection | null) {
  const row = projection?.rows.find((item) => /\b(value|price|floor)\b/i.test(item.label) && /^\$?\d/.test(item.value));
  return row?.value ?? "$1.00";
}

function receizedAssetType(assetType: string): ReceizedAsset["type"] {
  if (assetType === "market_certificate" || assetType === "wallet_note") return "benefit";
  if (assetType === "profile_original" || assetType === "document") return "claim";
  if (assetType === "proof_object") return "limited_drop";
  return "access";
}

function domainManifestFromSdkProjection(
  projection: SdkReceizAssetManifestProjection,
  actorReceizId: string,
  artifactSha256Basis: string
): ReceizAssetManifestProjection {
  const proof = projection.manifest.proof as Record<string, unknown>;
  const owner = isRecord(projection.manifest.owner) ? projection.manifest.owner : null;
  const assetId = projection.assetId || `proof-${makeId("asset").slice(-8)}`;
  const kaiPulse = firstString(
    stringField(proof, "kaiPulseEternal"),
    stringField(proof, "kaiPulse"),
    stringField(proof, "kaiUpulse"),
    String(proof.createdAtMs ?? "")
  ) ?? String(Date.now());
  const claimId = firstString(
    stringField(proof, "receizClaimId"),
    stringField(proof, "claimId"),
    assetId
  ) ?? assetId;
  const fallbackVerifyUrl = receizVerifyUrl(claimId, kaiPulse);
  const verifyUrl = canonicalReceizVerifyUrl(
    firstString(projection.verifyUrl, stringField(proof, "verifyUrl"), stringField(proof, "verifyPath")),
    fallbackVerifyUrl
  );

  return {
    schema: "receiz.asset_manifest.v1",
    assetId,
    assetType: projection.assetType,
    proof: {
      kind: "receiz.proof_bundle",
      verifyUrl,
      kaiPulseEternal: kaiPulse,
      kaiKlok: firstString(stringField(proof, "kaiKlok"), `kai:${kaiPulse}`) ?? `kai:${kaiPulse}`,
      receizClaimId: claimId,
      artifactSha256Basis:
        firstString(
          stringField(proof, "artifactSha256Basis"),
          stringField(proof, "sigilClaimSeed"),
          stringField(proof, "groth16ProofDigest")
        ) ?? artifactSha256Basis
    },
    owner: {
      receizSubject: stringField(owner, "receizSubject") ?? actorReceizId,
      displayName: projection.ownerLabel ?? stringField(owner, "displayName") ?? actorReceizId,
      custody: custodyFromUnknown(owner?.custody)
    },
    links: {
      verify: verifyUrl,
      asset: projection.primaryUrl ?? undefined
    }
  };
}

function domainManifestFromVerifiedArtifact(
  file: File,
  verified: DocumentVerifyResponse,
  actorReceizId: string,
  artifactSha256Basis: string
): ReceizAssetManifestProjection {
  const verifiedRecord = verified as Record<string, unknown>;
  const bundle = recordField(verifiedRecord, "bundle");
  const anchor = recordField(verifiedRecord, "anchor");
  const pkg = recordField(verifiedRecord, "package");
  const baseId = slugify(file.name.replace(/\.[a-z0-9]+$/i, ""), "proof-object");
  const kaiPulse = firstString(
    stringField(bundle, "kaiPulseEternal"),
    stringField(bundle, "kaiPulse"),
    stringField(anchor, "kaiPulse"),
    String(Date.now())
  ) ?? String(Date.now());
  const claimId = firstString(
    stringField(bundle, "receizClaimId"),
    stringField(bundle, "claimId"),
    stringField(anchor, "claimId"),
    `${baseId}-${kaiPulse}`
  ) ?? `${baseId}-${kaiPulse}`;
  const assetId = firstString(stringField(bundle, "assetId"), stringField(pkg, "assetId"), `asset-${baseId}`) ?? `asset-${baseId}`;
  const fallbackVerifyUrl = receizVerifyUrl(claimId, kaiPulse);
  const verifyUrl = canonicalReceizVerifyUrl(
    firstString(stringField(bundle, "verifyUrl"), stringField(bundle, "verifyPath"), stringField(anchor, "verifyUrl")),
    fallbackVerifyUrl
  );

  return {
    schema: "receiz.asset_manifest.v1",
    assetId,
    assetType: "proof_object",
    proof: {
      kind: "receiz.proof_bundle",
      verifyUrl,
      kaiPulseEternal: kaiPulse,
      kaiKlok: firstString(stringField(bundle, "kaiKlok"), `kai:${kaiPulse}`) ?? `kai:${kaiPulse}`,
      receizClaimId: claimId,
      artifactSha256Basis:
        firstString(
          stringField(bundle, "artifactSha256Basis"),
          stringField(bundle, "sigilClaimSeed"),
          stringField(anchor, "appendHash")
        ) ?? artifactSha256Basis
    },
    owner: {
      receizSubject: actorReceizId,
      displayName: actorReceizId,
      custody: "current"
    },
    links: {
      verify: verifyUrl
    }
  };
}

async function receizedAssetFromProofObject(file: File, actorReceizId: string): Promise<ReceizedAsset> {
  const receiz = createReceizCommerceAdapter();
  const opened = await receiz.verifyAndOpenArtifact(file);
  const verified = opened.verification;
  const artifactSha256Basis = `sha256:${opened.sealedArtifact.artifactSha256}`;
  const payloadBytes = new Uint8Array(opened.verifiedPayload.bytes.byteLength);
  payloadBytes.set(opened.verifiedPayload.bytes);
  const verifiedPayload = new Blob([payloadBytes.buffer], { type: opened.verifiedPayload.mimeType });
  const manifestCandidate = await readManifestCandidate(verifiedPayload, opened.verifiedPayload.filename);
  let projection: SdkReceizAssetManifestProjection | null = null;

  if (manifestCandidate) {
    try {
      projection = receiz.projectAssetManifest(manifestCandidate as ReceizAssetManifest);
    } catch {
      projection = null;
    }
  }

  const manifest = projection
    ? domainManifestFromSdkProjection(projection, actorReceizId, artifactSha256Basis)
    : domainManifestFromVerifiedArtifact(file, verified, actorReceizId, artifactSha256Basis);
  const assetName = projection?.title || file.name.replace(/\.[a-z0-9]+$/i, "") || manifest.assetId;

  return {
    id: `proof-${slugify(manifest.assetId, "asset")}`,
    name: titleCase(assetName.replace(/[-_]+/g, " ")),
    type: receizedAssetType(manifest.assetType),
    ownerId: actorReceizId,
    status: "owned",
    priceLabel: priceLabelFromProjection(projection),
    proofSource: manifest.proof.receizClaimId || manifest.assetId,
    manifest,
    verifiedArtifact: {
      filename: file.name || "Receiz proof object",
      kind: verified.kind || manifest.proof.kind,
      verifiedAt: new Date().toISOString(),
      warnings: verified.warnings,
      sha256Basis: artifactSha256Basis
    }
  };
}

function normalizeProfileHandle(value: string | undefined, fallback: string) {
  const handle = compactString(value, fallback).replace(/^@/, "");
  return handle.includes(".") ? handle : `${handle}.receiz.id`;
}

function displayNameFromProfile(profile: ReceizProfile) {
  const fromHandle = profile.handle?.replace(/\.receiz\.id$/i, "").replace(/[._-]+/g, " ");
  return compactString(profile.name, compactString(fromHandle, "New Receiz Store"));
}

function logoTextFromProfile(profile: ReceizProfile) {
  const source = profile.handle?.replace(/\.receiz\.id$/i, "") ?? profile.name ?? "store";
  const cleaned = source.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8);
  return cleaned || "store";
}

function tenantFromProfile(profile: ReceizProfile) {
  const source = profile.subdomain ?? profile.handle?.replace(/\.receiz\.id$/i, "") ?? profile.name ?? "store";
  try {
    return normalizeTenantSlug(source);
  } catch {
    return "store";
  }
}

function customDomainFromProfile(profile: ReceizProfile) {
  if (!profile.customDomain) return "";
  try {
    return normalizeCustomDomain(profile.customDomain);
  } catch {
    return "";
  }
}

function customerFromProfile(current: CustomerAccount, profile: ReceizProfile, fallbackHandle: string): CustomerAccount {
  const handle = normalizeProfileHandle(profile.handle, fallbackHandle);

  return {
    ...current,
    id: current.id || "customer-receiz-owner",
    name: displayNameFromProfile(profile),
    email: compactString(profile.email, current.email),
    receizHandle: handle,
    tier: current.tier || "Owner"
  };
}

function createFreshMerchantWorkspace(current: CommerceState, profile: ReceizProfile): CommerceState {
  const displayName = displayNameFromProfile(profile);
  const handle = normalizeProfileHandle(profile.handle, current.auth.receizId.handle);
  const tenantSlug = tenantFromProfile(profile);
  const subdomain = subdomainForSlug(tenantSlug);
  const customDomain = customDomainFromProfile(profile);
  const customer: CustomerAccount = {
    id: current.auth.customer.id || "customer-receiz-owner",
    name: displayName,
    email: compactString(profile.email, current.auth.customer.email),
    tier: "Owner",
    rewardsValueLabel: "$0.00",
    beans: 0,
    streak: "0x",
    orderIds: [],
    rewardIds: [],
    assetIds: [],
    receizHandle: handle
  };

  return {
    ...current,
    brand: {
      ...current.brand,
      name: displayName,
      logoText: logoTextFromProfile(profile),
      logoImageUrl: profile.imageUrl || null,
      tagline: "Proof-sealed commerce by Receiz"
    },
    storefront: {
      homepageMode: "store",
      headline: "",
      subheadline: "",
      heroBody: "",
      ctaLabel: "Shop now"
    },
    hosting: {
      ...current.hosting,
      mode: "hosted_platform",
      tenantSlug,
      subdomain,
      liveUrl: `https://${subdomain}`,
      merchantReceizId: handle,
      settlementUserId: profile.id,
      settlementAccountLabel: `${displayName} Receiz account`,
      plan: "starter",
      published: false,
      lastPublishedAt: "Not published",
      subdomainStatus: {
        ...seedCommerceState.hosting.subdomainStatus,
        domain: subdomain,
        status: "pending",
        sslStatus: "pending",
        verified: false,
        dnsResolved: false,
        liveUrl: `https://${subdomain}`,
        message: "Free Receiz.app subdomain ready to claim"
      },
      customDomain: {
        ...seedCommerceState.hosting.customDomain,
        domain: customDomain,
        status: customDomain ? "ready" : "pending",
        sslStatus: customDomain ? "valid" : "pending",
        verified: Boolean(customDomain),
        dnsResolved: Boolean(customDomain),
        liveUrl: customDomain ? `https://${customDomain}` : "",
        verification: undefined,
        dnsInstructions: undefined,
        message: customDomain ? "Loaded from Receiz profile" : "Connect a custom domain when ready"
      }
    },
    billing: {
      ...current.billing,
      status: "trial",
      paymentMethodLabel: "No payment method yet",
      monthlyTotalLabel: "$0 / mo",
      trialEndsAt: "Free starter hosting",
      invoices: []
    },
    navigation: [],
    pages: [],
    blogPosts: [],
    collections: [],
    products: [],
    cart: { lines: [] },
    orders: [],
    customers: [customer],
    rewards: [],
    rewardRules: [],
    assets: [],
    listings: [],
    qualifiers: [],
    campaigns: [],
    game: {
      ...current.game,
      enabled: false,
      campaignId: "",
      leaderboardEnabled: false
    },
    auth: {
      ...current.auth,
      admin: {
        ...current.auth.admin,
        name: displayName,
        email: compactString(profile.email, current.auth.admin.email)
      },
      customer
    },
    publish: {
      ...current.publish,
      checklist: current.publish.checklist.map((item) => ({
        ...item,
        complete: item.id === "receiz",
        warning: item.id === "game" ? true : item.warning
      }))
    },
    proofEvents: [makeEvent("RECEIZ_ID_CONNECTED", `${handle} workspace initialized`)]
  };
}

function applyCustomerReceizProfile(current: CommerceState, profile: ReceizProfile): CommerceState {
  const fallbackHandle = current.auth.customer.receizHandle ?? current.auth.receizId.handle;
  const handle = normalizeProfileHandle(profile.handle, fallbackHandle);
  const displayName = displayNameFromProfile(profile);
  const customer = {
    ...customerFromProfile(current.auth.customer, profile, handle),
    tier: current.auth.customer.tier || "Member"
  };
  const customers = current.customers.some((item) => item.id === customer.id)
    ? current.customers.map((item) => (item.id === customer.id ? { ...item, ...customer } : item))
    : [customer, ...current.customers];

  return {
    ...current,
    customers,
    auth: {
      ...current.auth,
      signedInAs: "customer",
      customer,
      receizId: {
        ...current.auth.receizId,
        connected: true,
        handle,
        displayName,
        keyId: compactString(profile.id, current.auth.receizId.keyId),
        loginMode: "existing_receiz_id",
        accountImageLabel: "Receiz account image",
        statusLabel: "Receiz ID connected"
      }
    }
  };
}

function applyReceizProfile(
  current: CommerceState,
  profile: ReceizProfile,
  surface: HostContext["surface"] = "platform"
): CommerceState {
  if (surface === "tenant") {
    return applyCustomerReceizProfile(current, profile);
  }

  const ownerKey = receizProfileOwnerKey(profile);
  const resetTemplate = !receizProfileMatchesWorkspace(current, profile);
  const base = resetTemplate ? createFreshMerchantWorkspace(current, profile) : current;
  const handle = normalizeProfileHandle(profile.handle, base.auth.receizId.handle);
  const displayName = displayNameFromProfile(profile);
  const customer = customerFromProfile(base.auth.customer, profile, handle);
  const tenantSlug = profile.subdomain ? tenantFromProfile(profile) : base.hosting.tenantSlug;
  const subdomain = subdomainForSlug(tenantSlug);
  const customDomain = customDomainFromProfile(profile) || base.hosting.customDomain.domain;

  return {
    ...base,
    brand: {
      ...base.brand,
      logoImageUrl: base.brand.logoImageUrl || profile.imageUrl || null
    },
    customers: base.customers.length ? base.customers.map((item, index) => (index === 0 ? customer : item)) : [customer],
    hosting: {
      ...base.hosting,
      tenantSlug,
      subdomain,
      liveUrl: customDomain || base.hosting.liveUrl === base.hosting.customDomain.liveUrl ? `https://${customDomain || subdomain}` : base.hosting.liveUrl,
      merchantReceizId: handle,
      settlementUserId: profile.id ?? base.hosting.settlementUserId,
      settlementAccountLabel: `${displayName} Receiz account`,
      subdomainStatus: {
        ...base.hosting.subdomainStatus,
        domain: subdomain,
        liveUrl: `https://${subdomain}`
      },
      customDomain: {
        ...base.hosting.customDomain,
        domain: customDomain,
        liveUrl: customDomain ? `https://${customDomain}` : base.hosting.customDomain.liveUrl,
        status: customDomain ? base.hosting.customDomain.status : "pending",
        message: customDomain ? base.hosting.customDomain.message : "Connect a custom domain when ready"
      }
    },
    auth: {
      ...base.auth,
      workspaceOwnerId: ownerKey,
      templateClearedAt: resetTemplate ? new Date().toISOString() : base.auth.templateClearedAt,
      admin: {
        ...base.auth.admin,
        name: displayName,
        email: compactString(profile.email, base.auth.admin.email)
      },
      customer,
      receizId: {
        ...base.auth.receizId,
        connected: true,
        handle,
        displayName,
        keyId: compactString(profile.id, base.auth.receizId.keyId),
        loginMode: "existing_receiz_id",
        accountImageLabel: "Receiz account image",
        statusLabel: "Receiz ID connected"
      }
    }
  };
}

function applyReceizDisconnected(current: CommerceState): CommerceState {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "receiz_id") return current;

  return {
    ...current,
    auth: {
      ...current.auth,
      receizId: {
        ...current.auth.receizId,
        connected: false,
        statusLabel: "Connect Receiz ID"
      }
    }
  };
}

async function fetchReceizProfile(): Promise<ReceizProfileResponse | null> {
  const response = await fetch("/api/auth/receiz/me", {
    headers: { accept: "application/json" }
  });

  if (!response.ok) return null;
  return (await response.json()) as ReceizProfileResponse;
}

async function fetchPublishedStoreProjection(tenantHost?: string) {
  const endpoint = tenantHost ? `/api/store?tenantHost=${encodeURIComponent(tenantHost)}` : "/api/store";
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      "x-receiz-storefront-fetch": "1"
    }
  });

  if (!response.ok) return null;

  return response.json() as Promise<unknown>;
}

async function uploadPublishMedia(file: Blob, options: ReceizMediaUploadOptions = {}) {
  const form = new FormData();
  const filename = typeof options.filename === "string" ? options.filename : "receiz-media";

  form.set("file", file, filename);

  for (const key of ["tenantHost", "purpose", "filename", "idempotencyKey"] as const) {
    const value = options[key];
    if (typeof value === "string" && value.trim()) {
      form.set(key, value);
    }
  }

  if (options.metadata && typeof options.metadata === "object") {
    form.set("metadata", JSON.stringify(options.metadata));
  }

  const response = await fetch("/api/media", {
    method: "POST",
    body: form
  });

  return response.json().catch(() => ({
    ok: false,
    error: "receiz_media_upload_failed",
    message: response.ok ? "Receiz media upload returned invalid JSON." : "Receiz media upload failed."
  }));
}

class ReceizAuthorityRequiredError extends Error {
  connectUrl: string;

  constructor(connectUrl: string, message = "Create or restore a verified Receiz proof object in app, then try again.") {
    super(message);
    this.name = "ReceizAuthorityRequiredError";
    this.connectUrl = connectUrl;
  }
}

type ReceizCheckoutSessionPayload = {
  checkoutUrl?: string;
  checkoutSessionId?: string;
  clientSecret?: string;
  status?: string;
};

class ReceizPaymentRequiredError extends Error {
  payload: Record<string, unknown>;

  constructor(payload: Record<string, unknown>, message = "Payment is required") {
    super(message);
    this.name = "ReceizPaymentRequiredError";
    this.payload = payload;
  }
}

function checkoutSessionFromPayload(payload: unknown): ReceizCheckoutSessionPayload | undefined {
  if (!isRecord(payload)) return undefined;
  const session = isRecord(payload.session)
    ? payload.session
    : isRecord(payload.checkoutSession)
      ? payload.checkoutSession
      : isRecord(payload.platformBilling) && isRecord(payload.platformBilling.checkoutSession)
        ? payload.platformBilling.checkoutSession
        : undefined;

  if (!session) return undefined;

  return {
    checkoutUrl: typeof session.checkoutUrl === "string" ? session.checkoutUrl : undefined,
    checkoutSessionId: typeof session.checkoutSessionId === "string" ? session.checkoutSessionId : undefined,
    clientSecret: typeof session.clientSecret === "string" ? session.clientSecret : undefined,
    status: typeof session.status === "string" ? session.status : undefined
  };
}

function markPendingPublish(storageKey: string) {
  if (typeof window === "undefined") return;
  safeSetLocalStorage(window.localStorage, pendingPublishStorageKey(storageKey), JSON.stringify({ createdAt: Date.now() }));
}

function clearPendingPublish(storageKey: string) {
  if (typeof window === "undefined") return;
  safeRemoveLocalStorage(window.localStorage, pendingPublishStorageKey(storageKey));
}

function hasPendingPublish(storageKey: string) {
  if (typeof window === "undefined") return false;
  return Boolean(safeGetLocalStorage(window.localStorage, pendingPublishStorageKey(storageKey)));
}

async function postJson<T>(
  url: string,
  body: Record<string, unknown>,
  options: { deferAuthorityRedirect?: boolean; maxBodyChars?: number } = {}
): Promise<T> {
  const serializedBody = JSON.stringify(body);
  assertPublishRequestBodySize(serializedBody, options.maxBodyChars);

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: serializedBody
  });
  const payload = await response.json().catch(() => ({}));

  if (response.status === 401 && typeof payload.connectUrl === "string") {
    if (!options.deferAuthorityRedirect && typeof window !== "undefined") {
      window.open(payload.connectUrl, "receiz-connect", "popup=yes,width=560,height=760,resizable=yes,scrollbars=yes");
    }
    throw new ReceizAuthorityRequiredError(payload.connectUrl, String(payload.message ?? "Receiz authority required"));
  }

  if (response.status === 402 && isRecord(payload)) {
    throw new ReceizPaymentRequiredError(payload, String(payload.message ?? payload.error ?? "Payment is required"));
  }

  if (!response.ok || payload.ok === false) {
    throw new Error(String(payload.message ?? payload.error ?? "Request failed"));
  }

  return payload as T;
}

type StoreStateSyncResponse = {
  ok?: boolean;
  synced?: boolean;
  skipped?: boolean;
  reason?: string;
  message?: string;
  warning?: string;
  error?: string;
};

function storeStateSyncError(sync: StoreStateSyncResponse | undefined) {
  if (!sync || sync.ok !== false) return "";
  return sync.warning || sync.message || sync.error || "Storefront proof-state sync failed";
}

function storeStateSyncPending(sync: StoreStateSyncResponse | undefined) {
  return Boolean(sync && sync.ok === true && sync.synced === false);
}

function priceFromLabel(label: string) {
  const match = label.match(/[0-9]+(?:\.[0-9]+)?/);
  return match ? Number(match[0]) : 0;
}

function cartAmountUsd(state: CommerceState) {
  const total = state.cart.lines.reduce((sum, line) => {
    const product = state.products.find((item) => item.id === line.productId);
    return sum + priceFromLabel(product?.priceLabel ?? "0") * line.quantity;
  }, 0);

  if (total > 0) return total.toFixed(2);

  const firstProduct = state.products.find((product) => product.status === "active");
  return Math.max(1, priceFromLabel(firstProduct?.priceLabel ?? "18")).toFixed(2);
}

function usdLabelFromCents(cents: number) {
  return `$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

function centsFromAmount(value: string | number | undefined) {
  const amount = typeof value === "number" ? value : Number(String(value ?? "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

function fallbackFunding(totalLabel: string, cardDeltaLabel = totalLabel): NonNullable<Order["funding"]> {
  return {
    strategy: "receiz_wallet_first",
    totalLabel,
    walletAppliedLabel: "$0.00",
    walletBalanceLabel: "$0.00",
    cardDeltaLabel,
    cardRequired: centsFromAmount(cardDeltaLabel) > 0
  };
}

type CheckoutFundingPayload = {
  strategy?: string;
  totalLabel?: string;
  walletAppliedLabel?: string;
  walletBalanceLabel?: string;
  cardDeltaLabel?: string;
  cardRequired?: boolean;
  totalUsdCents?: number;
  walletAppliedUsdCents?: number;
  walletBalanceUsdCents?: number;
  cardDeltaUsdCents?: number;
};

function fundingFromPayload(payload: CheckoutFundingPayload | undefined, totalLabel: string): NonNullable<Order["funding"]> {
  if (!payload) return fallbackFunding(totalLabel);

  const cardDeltaLabel = payload.cardDeltaLabel ?? usdLabelFromCents(payload.cardDeltaUsdCents ?? centsFromAmount(totalLabel));
  const walletAppliedLabel = payload.walletAppliedLabel ?? usdLabelFromCents(payload.walletAppliedUsdCents ?? 0);

  return {
    strategy: "receiz_wallet_first",
    totalLabel: payload.totalLabel ?? usdLabelFromCents(payload.totalUsdCents ?? centsFromAmount(totalLabel)),
    walletAppliedLabel,
    walletBalanceLabel: payload.walletBalanceLabel ?? usdLabelFromCents(payload.walletBalanceUsdCents ?? centsFromAmount(walletAppliedLabel)),
    cardDeltaLabel,
    cardRequired: payload.cardRequired ?? (centsFromAmount(cardDeltaLabel) > 0)
  };
}

function railFromFunding(funding: NonNullable<Order["funding"]>): Order["paymentRail"] {
  const walletCents = centsFromAmount(funding.walletAppliedLabel);
  const cardCents = centsFromAmount(funding.cardDeltaLabel);

  if (walletCents > 0 && cardCents > 0) return "wallet_card_split";
  if (walletCents > 0) return "receiz_wallet";
  if (cardCents > 0) return "card_fallback";
  return "receiz_checkout";
}

function checkoutProducts(state: CommerceState) {
  return state.cart.lines
    .map((line) => state.products.find((product) => product.id === line.productId))
    .filter((product): product is Product => Boolean(product));
}

function customerShipping(customer: CustomerAccount) {
  return validShippingAddress(customer.shippingAddress) ? customer.shippingAddress : undefined;
}

function checkoutCustomerShipping(state: CommerceState, customer: CustomerAccount) {
  const existingCustomer = state.customers.find((item) => item.id === customer.id);
  return customerShipping(customer) ?? (existingCustomer ? customerShipping(existingCustomer) : undefined);
}

function upsertCheckoutCustomer(customers: CustomerAccount[], customer: CustomerAccount, orderId: string) {
  const existingCustomer = customers.find((item) => item.id === customer.id);
  const shippingAddress = customerShipping(customer) ?? (existingCustomer ? customerShipping(existingCustomer) : undefined);
  const nextCustomer = {
    ...customer,
    receizHandle: customer.receizHandle,
    shippingAddress,
    orderIds: Array.from(new Set([orderId, ...customer.orderIds]))
  };

  if (!existingCustomer) {
    return [nextCustomer, ...customers];
  }

  return customers.map((item) => (item.id === customer.id ? { ...item, ...nextCustomer } : item));
}

function appendUniqueById<T extends { id: string }>(current: T[], imported: T[]) {
  const seen = new Set(current.map((item) => item.id));
  return [...imported.filter((item) => !seen.has(item.id)), ...current];
}

function currentMerchantReceizId(state: CommerceState) {
  return state.auth.receizId.connected && state.auth.receizId.handle
    ? state.auth.receizId.handle
    : state.hosting.merchantReceizId;
}

function stateWithCurrentMerchantReceizAccount(state: CommerceState): CommerceState {
  const merchantReceizId = currentMerchantReceizId(state);
  if (!merchantReceizId || state.hosting.merchantReceizId === merchantReceizId) return state;

  return {
    ...state,
    hosting: {
      ...state.hosting,
      merchantReceizId,
      settlementUserId: state.hosting.settlementUserId ?? state.auth.receizId.keyId,
      settlementAccountLabel: `${state.auth.receizId.displayName || state.brand.name || merchantReceizId} Receiz account`
    }
  };
}

function publishedStatePayload(state: CommerceState) {
  return compactPublishedState({
    brand: state.brand,
    storefront: state.storefront,
    hosting: state.hosting,
    navigation: state.navigation,
    pages: state.pages,
    blogPosts: state.blogPosts,
    collections: state.collections,
    products: state.products,
    rewards: state.rewards,
    rewardRules: state.rewardRules,
    assets: state.assets,
    qualifiers: state.qualifiers,
    campaigns: state.campaigns,
    exchange: state.exchange,
    game: state.game,
    checkout: state.checkout
  });
}

function publishTenantHost(state: CommerceState) {
  const context = currentHostContext();
  return state.hosting.customDomain.domain || state.hosting.subdomain || context.tenantHost || context.host;
}

const HOSTING_PUBLISH_REQUEST_BODY_MAX_CHARS = 1_600_000;
const HOSTING_PUBLISH_INLINE_MEDIA_ITEM_MAX_CHARS = 36_000;
const HOSTING_PUBLISH_INLINE_MEDIA_TOTAL_MAX_CHARS = 260_000;

async function prepareHostingStoreStateRequestBody(
  action: "custom_domain" | "verify_domain" | "publish",
  state: CommerceState,
  merchantProofValue: unknown,
  extra: Record<string, unknown> = {}
) {
  const normalizedState = stateWithCurrentMerchantReceizAccount(state);

  return preparePublishRequestBody({
    action,
    extra,
    maxBodyChars: HOSTING_PUBLISH_REQUEST_BODY_MAX_CHARS,
    merchantProof: merchantProofValue,
    state: normalizedState,
    statePayload: publishedStatePayload,
    media: {
      tenantHost: publishTenantHost(normalizedState),
      merchantReceizId: currentMerchantReceizId(normalizedState),
      itemMaxChars: HOSTING_PUBLISH_INLINE_MEDIA_ITEM_MAX_CHARS,
      totalMaxChars: HOSTING_PUBLISH_INLINE_MEDIA_TOTAL_MAX_CHARS,
      upload: typeof window === "undefined" ? undefined : uploadPublishMedia,
      compress: compressInlineImageDataUrlForPublish
    }
  });
}

function merchantProofPayload(state: CommerceState, keyFile?: unknown | null) {
  return {
    ...(keyFile ? { keyFile } : {}),
    auth: {
      receizId: {
        connected: state.auth.receizId.connected,
        handle: state.auth.receizId.handle,
        displayName: state.auth.receizId.displayName,
        localProofVerified: state.auth.receizId.localProofVerified
      }
    }
  };
}

function completePublishChecklistItem(state: CommerceState, id: string): CommerceState {
  return {
    ...state,
    publish: {
      ...state.publish,
      checklist: state.publish.checklist.map((item) =>
        item.id === id ? { ...item, complete: true, warning: false } : item
      )
    }
  };
}

function shouldKeepCurrentMedia(key: string, current: unknown, published: unknown) {
  return (
    key.toLowerCase().endsWith("imageurl") &&
    (published === null || published === "") &&
    typeof current === "string" &&
    current.trim().length > 0
  );
}

function mergePublishedValue<T>(current: T, published: T | undefined, key = ""): T {
  if (published === undefined) return current;
  if (shouldKeepCurrentMedia(key, current, published)) return current;

  if (Array.isArray(current) && Array.isArray(published)) {
    return published.map((item, index) => mergePublishedValue(current[index], item, key)) as T;
  }

  if (isRecord(current) && isRecord(published)) {
    const keys = new Set([...Object.keys(current), ...Object.keys(published)]);

    return Object.fromEntries(
      [...keys].map((childKey) => [
        childKey,
        mergePublishedValue(current[childKey], published[childKey], childKey)
      ])
    ) as T;
  }

  return published;
}

function mergePublishedPublicState(
  current: CommerceState,
  published: Partial<CommerceState> | undefined,
  hosting: CommerceState["hosting"]
): CommerceState {
  if (!published) {
    return {
      ...current,
      hosting
    };
  }

  return {
    ...current,
    brand: mergePublishedValue(current.brand, published.brand),
    storefront: mergePublishedValue(current.storefront, published.storefront),
    hosting,
    navigation: mergePublishedValue(current.navigation, published.navigation),
    pages: mergePublishedValue(current.pages, published.pages),
    blogPosts: mergePublishedValue(current.blogPosts, published.blogPosts),
    collections: mergePublishedValue(current.collections, published.collections),
    products: mergePublishedValue(current.products, published.products),
    rewards: mergePublishedValue(current.rewards, published.rewards),
    rewardRules: mergePublishedValue(current.rewardRules, published.rewardRules),
    assets: mergePublishedValue(current.assets, published.assets),
    qualifiers: mergePublishedValue(current.qualifiers, published.qualifiers),
    campaigns: mergePublishedValue(current.campaigns, published.campaigns),
    exchange: mergePublishedValue(current.exchange, published.exchange),
    game: mergePublishedValue(current.game, published.game),
    checkout: mergePublishedValue(current.checkout, published.checkout)
  };
}

async function createLocalReceizIdentitySessionInput(snapshot: CommerceState, fallbackDisplayName: string) {
  const receiz = createReceizCommerceAdapter();
  let projection: ReceizIdentityAccountProjection | null = null;
  let keyFile: unknown | null = null;
  let handle = `${slugify(snapshot.brand.logoText || snapshot.brand.name, "customer")}-${makeId("id").slice(-6)}`;
  let displayName = fallbackDisplayName;
  let createdProof = false;

  try {
    const identityResult = await receiz.createReceizId({
      username: handle,
      displayName,
      deviceName: snapshot.brand.name
    });
    keyFile = identityResult.identity.keyFile;
    projection = identityResult.projection;
    handle = accountHandle(projection, `${handle}.receiz.id`);
    displayName = projection?.owner.displayName ?? displayName;
    createdProof = true;
  } catch {
    handle = handle.includes(".") ? handle : `${handle}.receiz.id`;
  }

  return {
    keyFile,
    input: {
      accountImageLabel: "Local Receiz ID",
      artifactKind: "receiz_id" as const,
      artifactStatus: createdProof || projection?.portableStateVerified ? ("verified" as const) : ("pending" as const),
      displayName,
      email: projection?.owner.email ?? undefined,
      handle,
      keyId: projection?.keyId ?? snapshot.auth.receizId.keyId,
      localProofVerified: createdProof || Boolean(projection?.portableStateVerified),
      loginMode: "new_receiz_id" as const,
      portableStateStatus: createdProof || projection?.portableStateVerified ? ("verified" as const) : ("missing" as const),
      statusLabel: createdProof || projection?.portableStateVerified ? "Receiz ID locally verified" : "Receiz ID proof pending"
    }
  };
}

async function receizIdentityForAutomaticCustomerSession(snapshot: CommerceState, reason: string) {
  if (snapshot.auth.receizId.connected && snapshot.auth.receizId.localProofVerified) {
    return {
      keyFile: null as unknown | null,
      detail: "",
      apply: (state: CommerceState) => state
    };
  }

  if (typeof window !== "undefined") {
    const existingBrowserSession = parseBrowserReceizIdSession(
      safeGetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY)
    );

    if (existingBrowserSession) {
      return {
        keyFile: existingBrowserSession.keyFile ?? null,
        detail: `${existingBrowserSession.receizId.handle} continued for ${reason}`,
        apply: (state: CommerceState) => applyBrowserReceizIdSession(state, existingBrowserSession)
      };
    }
  }

  const identity = await createLocalReceizIdentitySessionInput(snapshot, "Receiz customer");

  return {
    keyFile: identity.keyFile,
    detail: `${identity.input.handle} created for ${reason}`,
    apply: (state: CommerceState) =>
      applyLocalReceizIdentitySession(
        state,
        identity.input,
        currentHostContext().surface === "tenant"
      )
  };
}

export function useTemplateStore(initialState: CommerceState = seedCommerceState, initialHostContext?: HostContext) {
  const [state, setState] = useState<CommerceState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [receizSessionPending, setReceizSessionPending] = useState(false);
  const [actionFeedback, setActionFeedbackState] = useState<ActionFeedbackMap>({});
  const [embeddedPayment, setEmbeddedPayment] = useState<EmbeddedPaymentSession | null>(null);
  const [hostContext, setHostContext] = useState<HostContext>(() => initialHostContext ?? hostContextFromHost(null));
  const stateRef = useRef(initialState);
  const pendingBrowserIdentityKeyFileRef = useRef<unknown | null>(null);
  const publishResumeAttemptedRef = useRef(false);

  const merchantProofKeyFile = useCallback(() => {
    if (pendingBrowserIdentityKeyFileRef.current) return pendingBrowserIdentityKeyFileRef.current;
    if (typeof window === "undefined") return null;

    return parseBrowserReceizIdSession(
      safeGetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY)
    )?.keyFile ?? null;
  }, []);

  const merchantProof = useCallback(
    (snapshot: CommerceState) => merchantProofPayload(snapshot, merchantProofKeyFile()),
    [merchantProofKeyFile]
  );

  const setActionFeedback = useCallback((id: string, status: ActionFeedbackStatus, message: string) => {
    setActionFeedbackState((current) => ({
      ...current,
      [id]: {
        id,
        message,
        status,
        updatedAt: Date.now()
      }
    }));
  }, []);

  const beginEmbeddedPayment = useCallback((
    session: ReceizCheckoutSessionPayload | undefined,
    purpose: EmbeddedPaymentPurpose,
    title: string,
    resume: Pick<
      EmbeddedPaymentSession,
      | "resumeDomain"
      | "resumePlan"
      | "resumeProductId"
      | "resumeReferenceId"
      | "resumeExchangeAssetId"
      | "resumeExchangeSide"
      | "resumeExchangeShares"
    > = {}
  ) => {
    if (!session?.checkoutUrl && !session?.clientSecret) return false;

    setEmbeddedPayment({
      purpose,
      title,
      checkoutSessionId: session.checkoutSessionId,
      checkoutUrl: session.checkoutUrl,
      clientSecret: session.clientSecret,
      status: session.status,
      ...resume
    });
    return true;
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const context = currentHostContext();
    const restoredCustomerSession =
      context.surface === "tenant"
        ? parseTenantCustomerSession(safeGetLocalStorage(window.localStorage, tenantCustomerSessionKey(context.storageKey)))
        : null;
    const restoredBrowserIdentitySession = parseBrowserReceizIdSession(
      safeGetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY)
    );
    const storedState = readState(context, initialState);
    const restoredState = restoredCustomerSession
      ? applyTenantCustomerSession(storedState, restoredCustomerSession)
      : context.surface === "tenant"
        ? applyBrowserReceizIdSession(storedState, restoredBrowserIdentitySession)
        : applyPlatformBrowserReceizIdSession(storedState, restoredBrowserIdentitySession);

    setHostContext(context);
    setState(restoredState);
    setHydrated(true);
    setReceizSessionPending(process.env.NEXT_PUBLIC_AUTH_MODE === "receiz_id");

    if (process.env.NEXT_PUBLIC_AUTH_MODE === "receiz_id") {
      void fetchReceizProfile()
        .then((result) => {
          if (!result) return;
          const surface = result.surface ?? context.surface;
          setState((current) => {
            if (result.connected && result.profile) {
              return applyReceizProfile(current, result.profile, surface);
            }

            if (context.surface === "tenant" && current.auth.signedInAs === "customer" && current.auth.receizId.connected) {
              return current;
            }

            if (current.auth.receizId.connected) {
              return current;
            }

            return applyReceizDisconnected(current);
          });
        })
        .catch(() => undefined)
        .finally(() => setReceizSessionPending(false));
    }
  }, [initialState]);

  useEffect(() => {
    if (hydrated && hostContext.surface === "platform") {
      safeSetLocalStorage(window.localStorage, hostContext.storageKey, JSON.stringify(state));
    }
  }, [hostContext.storageKey, hostContext.surface, hydrated, state]);

  useEffect(() => {
    if (!hydrated || hostContext.surface !== "platform") return;

    const handleStorage = (event: StorageEvent) => {
      setState((current) => externalWorkspaceState(event, hostContext, current) ?? current);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [hostContext, hydrated]);

  useEffect(() => {
    if (!hydrated || hostContext.surface !== "tenant") return;

    safeSetLocalStorage(window.localStorage, hostContext.storageKey, JSON.stringify({ cart: state.cart }));
  }, [hostContext.storageKey, hostContext.surface, hydrated, state.cart]);

  useEffect(() => {
    if (!hydrated || !state.auth.receizId.connected) return;

    const previous = parseBrowserReceizIdSession(safeGetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY));
    const keyFile = pendingBrowserIdentityKeyFileRef.current ?? previous?.keyFile;
    const session = buildBrowserReceizIdSession(state, keyFile);

    if (session) {
      safeSetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY, JSON.stringify(session));
      pendingBrowserIdentityKeyFileRef.current = null;
    }
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated || hostContext.surface !== "tenant") return;

    const session = buildTenantCustomerSession(state, hostContext.tenantHost ?? hostContext.customDomain);
    const key = tenantCustomerSessionKey(hostContext.storageKey);

    if (session) {
      safeSetLocalStorage(window.localStorage, key, JSON.stringify(session));
    } else {
      safeRemoveLocalStorage(window.localStorage, key);
    }
  }, [hostContext.customDomain, hostContext.storageKey, hostContext.surface, hostContext.tenantHost, hydrated, state]);

  useEffect(() => {
    if (!hydrated || hostContext.surface !== "tenant") return;

    let cancelled = false;

    void fetchPublishedStoreProjection()
      .then((projection) => {
        if (cancelled || !projection) return;
        setState((current) => mergeStoreApiProjection(current, projection) ?? current);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [hostContext.host, hostContext.surface, hostContext.tenantHost, hydrated]);

  useEffect(() => {
    if (!hydrated || hostContext.surface !== "platform") return;

    const tenantHost = state.hosting.customDomain.domain || state.hosting.subdomain;
    if (!tenantHost) return;

    let cancelled = false;

    void fetchPublishedStoreProjection(tenantHost)
      .then((projection) => {
        if (cancelled || !projection) return;
        setState((current) => mergeStoreCommerceProjection(current, projection) ?? current);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [hostContext.surface, hydrated, state.hosting.customDomain.domain, state.hosting.subdomain]);

  const ensureMerchantProofAuthority = useCallback(async (action: MerchantAuthorityAction) => {
    if (typeof window === "undefined" || process.env.NEXT_PUBLIC_AUTH_MODE !== "receiz_id") {
      return true;
    }

    const snapshot = stateRef.current;
    const result = await fetchReceizProfile().catch(() => null);
    const browserIdentity = parseBrowserReceizIdSession(
      safeGetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY)
    );
    const gate = merchantProofAuthorityRequirement({
      action,
      delegatedPermission: Boolean(result?.connected),
      handle: result?.profile?.handle || snapshot.auth.receizId.handle || browserIdentity?.receizId.handle,
      localReceizIdConnected: snapshot.auth.receizId.connected,
      localProofVerified: snapshot.auth.receizId.localProofVerified,
      browserReceizIdConnected: browserIdentity?.receizId.connected,
      browserProofVerified: browserIdentity?.receizId.localProofVerified,
      browserProofKeyFile: merchantProofKeyFile()
    });

    if (gate.ok) {
      if (result?.profile) {
        const surface = result.surface ?? currentHostContext().surface;
        setState((current) => applyReceizProfile(current, result.profile!, surface));
      }

      return true;
    }

    setReceizSessionPending(true);
    setState((current) => ({
      ...current,
      auth: {
        ...current.auth,
        receizId: {
          ...current.auth.receizId,
          statusLabel: gate.statusLabel
        }
      },
      hosting:
        action === "publish"
          ? current.hosting
          : {
              ...current.hosting,
              customDomain: {
                ...current.hosting.customDomain,
                status: current.hosting.customDomain.status === "active" ? "active" : "pending",
                message: gate.message
              }
            },
      proofEvents: [makeEvent(gate.eventType, gate.message), ...current.proofEvents]
    }));
    setReceizSessionPending(false);

    return false;
  }, [merchantProofKeyFile]);

  const publishWorkspace = useCallback(async (options: {
    feedbackId: "publish" | "brand.saveTheme";
    pendingMessage: string;
    successMessage: string;
    pendingEventDetail: string;
    successEventDetail: string;
    eventType: ProofEvent["type"];
    prepareState?: (current: CommerceState) => CommerceState;
  }): Promise<boolean> => {
    if (!(await ensureMerchantProofAuthority("publish"))) {
      setActionFeedback(options.feedbackId, "error", "Create or restore a verified Receiz proof object in app");
      return false;
    }

    setActionFeedback(options.feedbackId, "pending", options.pendingMessage);
    const publishHostContext = currentHostContext();
    const preparedState = options.prepareState?.(stateRef.current) ?? stateRef.current;
    const publishRequestState = stateWithCurrentMerchantReceizAccount({
      ...preparedState,
      hosting: { ...preparedState.hosting, published: true, lastPublishedAt: "now" }
    });

    markPendingPublish(publishHostContext.storageKey);
    setState((current) => {
      const next = options.prepareState?.(current) ?? current;
      return {
        ...next,
        proofEvents: [makeEvent(options.eventType, options.pendingEventDetail), ...next.proofEvents]
      };
    });

    try {
      const result = await postJson<{
        hosting: CommerceState["hosting"];
        state?: Partial<CommerceState>;
        storeStateSync?: StoreStateSyncResponse;
      }>(
        "/api/hosting",
        await prepareHostingStoreStateRequestBody("publish", publishRequestState, merchantProof(publishRequestState)),
        {
          deferAuthorityRedirect: true,
          maxBodyChars: HOSTING_PUBLISH_REQUEST_BODY_MAX_CHARS
        }
      );

      const syncError = storeStateSyncError(result.storeStateSync);
      const syncPending = storeStateSyncPending(result.storeStateSync);

      clearPendingPublish(publishHostContext.storageKey);

      if (syncError || syncPending) {
        const message =
          syncError ||
          result.storeStateSync?.warning ||
          "Receiz public-store sync is pending; publish is not durable yet.";
        setActionFeedback(options.feedbackId, "error", message);
        setState((latest) => ({
          ...latest,
          proofEvents: [makeEvent(options.eventType, message), ...latest.proofEvents]
        }));
        return false;
      }

      setActionFeedback(options.feedbackId, "success", options.successMessage);
      setState((latest) => ({
        ...mergePublishedPublicState(latest, result.state, result.hosting),
        proofEvents: [makeEvent(options.eventType, options.successEventDetail), ...latest.proofEvents]
      }));
      return true;
    } catch (error) {
      clearPendingPublish(publishHostContext.storageKey);

      const message =
        error instanceof ReceizAuthorityRequiredError
          ? "Receiz proof object required to publish"
          : error instanceof Error
            ? error.message
            : "Publish sync failed";
      const eventMessage =
        error instanceof ReceizAuthorityRequiredError
          ? "Receiz proof object required to publish. Create or restore a verified proof object in app, then publish again."
          : message;

      setActionFeedback(options.feedbackId, "error", message);
      setState((latest) => ({
        ...latest,
        proofEvents: [makeEvent(options.eventType, eventMessage), ...latest.proofEvents]
      }));
      return false;
    }
  }, [ensureMerchantProofAuthority, merchantProof, setActionFeedback]);

  const actions = useMemo(
    () => ({
      reset() {
        setState(seedCommerceState);
        if (typeof window !== "undefined") {
          safeRemoveLocalStorage(window.localStorage, currentHostContext().storageKey);
          safeRemoveLocalStorage(window.localStorage, BASE_STORAGE_KEY);
        }
      },
      dismissEmbeddedPayment() {
        setEmbeddedPayment(null);
      },
      updateBrand(input: Partial<CommerceState["brand"]>) {
        setState((current) => ({
          ...current,
          brand: { ...current.brand, ...input }
        }));
      },
      saveTheme() {
        void publishWorkspace({
          feedbackId: "brand.saveTheme",
          pendingMessage: "Publishing theme",
          successMessage: "Theme published",
          pendingEventDetail: "Publishing theme to Receiz proof rails",
          successEventDetail: "Theme published to Receiz proof rails",
          eventType: "THEME_UPDATED",
          prepareState: (current) => completePublishChecklistItem(current, "brand")
        });
      },
      updateStorefront(input: Partial<CommerceState["storefront"]>) {
        setState((current) => ({
          ...current,
          storefront: { ...current.storefront, ...input }
        }));
      },
      launchWithTwinBrief(brief: string) {
        const trimmed = brief.trim();
        if (!trimmed) return;

        setState((current) => buildTwinLaunchState(current, trimmed));
      },
      setHomepageMode(mode: StorefrontHomepageMode) {
        setState((current) => ({
          ...current,
          storefront: { ...current.storefront, homepageMode: mode },
          game: mode === "game" ? { ...current.game, enabled: true } : current.game
        }));
      },
      toggleGame() {
        setState((current) => ({
          ...current,
          game: { ...current.game, enabled: !current.game.enabled }
        }));
      },
      setCheckoutMode(mode: CommerceState["checkout"]["mode"]) {
        setState((current) => ({
          ...current,
          checkout: {
            mode,
            label:
              mode === "mock"
                ? "Receiz sandbox"
                : mode === "live"
                  ? "Receiz checkout"
                  : "Receiz delegated checkout"
          },
          publish: {
            ...current.publish,
            checklist: current.publish.checklist.map((item) =>
              item.id === "checkout"
                ? { ...item, complete: mode === "live", warning: mode !== "live" }
                : item
            )
          }
        }));
      },
      async claimSubdomain(subdomain: string) {
        let tenantSlug = "";
        let domain = "";

        try {
          tenantSlug = normalizeTenantSlug(subdomain);
          domain = subdomainForSlug(tenantSlug);
        } catch (error) {
          setActionFeedback("domains.subdomain", "error", error instanceof Error ? error.message : "Invalid subdomain");
          setState((current) => ({
            ...current,
            proofEvents: [makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Invalid subdomain"), ...current.proofEvents]
          }));
          return;
        }

        setActionFeedback("domains.subdomain", "pending", `Claiming ${domain}`);
        setState((current) => ({
          ...current,
          hosting: {
            ...current.hosting,
            tenantSlug,
            subdomain: domain,
            liveUrl: `https://${domain}`,
            subdomainStatus: {
              ...current.hosting.subdomainStatus,
              domain,
              status: "pending",
              sslStatus: "pending",
              verified: false,
              liveUrl: `https://${domain}`,
              message: "Checking hosted subdomain"
            }
          },
          proofEvents: [makeEvent("DOMAIN_CONNECTED", `${domain} requested`), ...current.proofEvents]
        }));

        try {
          const result = await postJson<{ hosting: CommerceState["hosting"] }>("/api/hosting", {
            action: "subdomain",
            subdomain: domain
          });
          setActionFeedback("domains.subdomain", "success", `${result.hosting.subdomain} claimed`);
          setState((current) => ({
            ...current,
            hosting: result.hosting,
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", `${result.hosting.subdomainStatus.message ?? result.hosting.subdomain} · ${result.hosting.subdomainStatus.status}`),
              ...current.proofEvents
            ]
          }));
        } catch (error) {
          setActionFeedback("domains.subdomain", "error", error instanceof Error ? error.message : "Subdomain claim failed");
          setState((current) => ({
            ...current,
            hosting: {
              ...current.hosting,
              subdomainStatus: {
                ...current.hosting.subdomainStatus,
                status: "error",
                sslStatus: "unknown",
                message: error instanceof Error ? error.message : "Subdomain claim failed"
              }
            },
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Subdomain claim failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      async connectCustomDomain(domain: string) {
        let normalizedDomain = "";

        try {
          normalizedDomain = normalizeCustomDomain(domain);
        } catch (error) {
          setActionFeedback("domains.customDomain", "error", error instanceof Error ? error.message : "Invalid custom domain");
          setState((current) => ({
            ...current,
            proofEvents: [makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Invalid custom domain"), ...current.proofEvents]
          }));
          return;
        }

        if (!(await ensureMerchantProofAuthority("custom_domain"))) {
          setActionFeedback("domains.customDomain", "error", "Create or restore a verified Receiz proof object in app");
          return;
        }

        setActionFeedback("domains.customDomain", "pending", `Connecting ${normalizedDomain}`);
        setState((current) => ({
          ...current,
          hosting: {
            ...current.hosting,
            customDomain: {
              ...current.hosting.customDomain,
              domain: normalizedDomain,
              status: "pending",
              sslStatus: "pending",
              verified: false,
              liveUrl: `https://${normalizedDomain}`,
              message: "Adding domain to Vercel"
            }
          },
          proofEvents: [makeEvent("DOMAIN_CONNECTED", `${normalizedDomain} requested`), ...current.proofEvents]
        }));

        try {
          const snapshot = stateRef.current;
          const result = await postJson<{ hosting: CommerceState["hosting"]; storeStateSync?: StoreStateSyncResponse }>(
            "/api/hosting",
            await prepareHostingStoreStateRequestBody("custom_domain", snapshot, merchantProof(snapshot), { domain: normalizedDomain }),
            { maxBodyChars: HOSTING_PUBLISH_REQUEST_BODY_MAX_CHARS }
          );
          const syncError = storeStateSyncError(result.storeStateSync);
          const syncPending = storeStateSyncPending(result.storeStateSync);
          setActionFeedback(
            "domains.customDomain",
            syncError ? "error" : syncPending ? "pending" : "success",
            syncError
              ? `Domain connected; storefront sync failed: ${syncError}`
              : syncPending
                ? `${normalizedDomain} connected; storefront proof admitted and sync pending`
              : result.hosting.customDomain.status === "active"
                ? `${normalizedDomain} connected and storefront synced`
                : "DNS records ready"
          );
          setState((current) => ({
            ...current,
            hosting: mergeCustomDomainHostingResponse(stateWithCurrentMerchantReceizAccount(current).hosting, result.hosting),
            proofEvents: [
              makeEvent(
                "DOMAIN_CONNECTED",
                syncError
                  ? `${normalizedDomain} connected; storefront sync failed`
                  : syncPending
                    ? `${normalizedDomain} connected; storefront proof admitted and sync pending`
                  : `${result.hosting.customDomain.message ?? normalizedDomain} · ${result.hosting.customDomain.status}`
              ),
              ...current.proofEvents
            ]
          }));
        } catch (error) {
          if (error instanceof ReceizPaymentRequiredError) {
            const session = checkoutSessionFromPayload(error.payload);
            const opened = beginEmbeddedPayment(session, "custom_domain", `Fund ${normalizedDomain}`, {
              resumeDomain: normalizedDomain
            });
            setActionFeedback(
              "domains.customDomain",
              opened || session?.clientSecret ? "pending" : "error",
              opened
                ? "Opening card payment"
                : session?.clientSecret
                  ? "Card payment session ready. Complete the card delta before the domain connects."
                  : error.message
            );
            setState((current) => ({
              ...current,
              hosting: {
                ...current.hosting,
                customDomain: {
                  ...current.hosting.customDomain,
                  status: "payment_required",
                  sslStatus: "pending",
                  message: "Card payment required before connecting this domain."
                }
              },
              proofEvents: [
                makeEvent("DOMAIN_CONNECTED", `Card payment required before ${normalizedDomain} can connect`),
                ...current.proofEvents
              ]
            }));
            return;
          }

          setActionFeedback("domains.customDomain", "error", error instanceof Error ? error.message : "Custom domain failed");
          setState((current) => ({
            ...current,
            hosting: {
              ...current.hosting,
              customDomain: {
                ...current.hosting.customDomain,
                status: "error",
                sslStatus: "unknown",
                message: error instanceof Error ? error.message : "Custom domain failed"
              }
            },
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Custom domain failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      async verifyCustomDomain(domain: string) {
        let normalizedDomain = "";

        try {
          normalizedDomain = normalizeCustomDomain(domain);
        } catch (error) {
          setActionFeedback("domains.verifyDomain", "error", error instanceof Error ? error.message : "Invalid custom domain");
          setState((current) => ({
            ...current,
            proofEvents: [makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Invalid custom domain"), ...current.proofEvents]
          }));
          return;
        }

        if (!(await ensureMerchantProofAuthority("verify_domain"))) {
          setActionFeedback("domains.verifyDomain", "error", "Create or restore a verified Receiz proof object in app");
          return;
        }

        setActionFeedback("domains.verifyDomain", "pending", `Checking DNS for ${normalizedDomain}`);
        setState((current) => ({
          ...current,
          hosting: {
            ...current.hosting,
            customDomain: {
              ...current.hosting.customDomain,
              domain: normalizedDomain,
              status: current.hosting.customDomain.status === "active" ? "active" : "needs_dns",
              sslStatus: current.hosting.customDomain.sslStatus === "valid" ? "valid" : "pending",
              verified: false,
              dnsResolved: false,
              liveUrl: `https://${normalizedDomain}`,
              lastCheckedAt: new Date().toISOString(),
              message: "Checking DNS propagation"
            }
          },
          proofEvents: [makeEvent("DOMAIN_CONNECTED", `${normalizedDomain} DNS verification requested`), ...current.proofEvents]
        }));

        try {
          const snapshot = stateRef.current;
          const result = await postJson<{ hosting: CommerceState["hosting"]; storeStateSync?: StoreStateSyncResponse }>(
            "/api/hosting",
            await prepareHostingStoreStateRequestBody("verify_domain", snapshot, merchantProof(snapshot), { domain: normalizedDomain }),
            { maxBodyChars: HOSTING_PUBLISH_REQUEST_BODY_MAX_CHARS }
          );
          const syncError = storeStateSyncError(result.storeStateSync);
          const syncPending = storeStateSyncPending(result.storeStateSync);
          setActionFeedback(
            "domains.verifyDomain",
            syncError ? "error" : syncPending ? "pending" : result.hosting.customDomain.status === "active" ? "success" : "pending",
            syncError
              ? `DNS verified; storefront sync failed: ${syncError}`
              : syncPending
                ? "DNS verified; storefront proof admitted and sync pending"
              : result.hosting.customDomain.message ?? `${normalizedDomain} checked`
          );
          setState((current) => ({
            ...current,
            hosting: mergeCustomDomainHostingResponse(stateWithCurrentMerchantReceizAccount(current).hosting, result.hosting),
            proofEvents: [
              makeEvent(
                "DOMAIN_CONNECTED",
                syncError
                  ? `${normalizedDomain} DNS verified; storefront sync failed`
                  : syncPending
                    ? `${normalizedDomain} DNS verified; storefront proof admitted and sync pending`
                  : `${result.hosting.customDomain.message ?? normalizedDomain} · ${result.hosting.customDomain.status}`
              ),
              ...current.proofEvents
            ]
          }));
        } catch (error) {
          setActionFeedback("domains.verifyDomain", "error", error instanceof Error ? error.message : "Domain verification failed");
          setState((current) => ({
            ...current,
            hosting: {
              ...current.hosting,
              customDomain: {
                ...current.hosting.customDomain,
                status: "error",
                sslStatus: "unknown",
                verified: false,
                dnsResolved: false,
                lastCheckedAt: new Date().toISOString(),
                message: error instanceof Error ? error.message : "Domain verification failed"
              }
            },
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Domain verification failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      async selectHostingPlan(plan: CommerceState["hosting"]["plan"]) {
        setActionFeedback("billing.plan", "pending", `Selecting ${plan}`);
        setState((current) => ({
          ...current,
          proofEvents: [
            makeEvent("HOSTING_PLAN_UPDATED", `${plan} hosting plan payment requested`),
            ...current.proofEvents
          ]
        }));

        try {
          const result = await postJson<{
            hosting: CommerceState["hosting"];
            billing: CommerceState["billing"];
          }>("/api/hosting", {
            action: "plan",
            plan,
            hosting: stateWithCurrentMerchantReceizAccount(stateRef.current).hosting,
            merchantProof: merchantProof(stateRef.current)
          }, { maxBodyChars: HOSTING_PUBLISH_REQUEST_BODY_MAX_CHARS });
          setActionFeedback("billing.plan", "success", `${plan} plan synced`);
          setState((current) => {
            const ownerState = stateWithCurrentMerchantReceizAccount(current);

            return {
              ...ownerState,
              hosting: {
                ...ownerState.hosting,
                plan: result.hosting.plan
              },
              billing: result.billing,
              proofEvents: [makeEvent("HOSTING_PLAN_UPDATED", `${plan} plan synced with Receiz billing`), ...current.proofEvents]
            };
          });
        } catch (error) {
          if (error instanceof ReceizPaymentRequiredError) {
            const session = checkoutSessionFromPayload(error.payload);
            const opened = beginEmbeddedPayment(session, "hosting_plan", `Fund ${plan} hosting`, {
              resumePlan: plan
            });
            setActionFeedback(
              "billing.plan",
              opened || session?.clientSecret ? "pending" : "error",
              opened
                ? "Opening card payment"
                : session?.clientSecret
                  ? "Card payment session ready. Complete the card delta before the plan changes."
                  : error.message
            );
            setState((current) => ({
              ...current,
              proofEvents: [
                makeEvent("HOSTING_PLAN_UPDATED", `Card payment required before ${plan} hosting can activate`),
                ...current.proofEvents
              ]
            }));
            return;
          }

          setActionFeedback("billing.plan", "error", error instanceof Error ? error.message : "Hosting plan sync failed");
          setState((current) => ({
            ...current,
            proofEvents: [
              makeEvent("HOSTING_PLAN_UPDATED", error instanceof Error ? error.message : "Hosting plan sync failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      async addBillingMethod(label: string) {
        setActionFeedback("billing.payment", "pending", `${label} connecting`);
        setState((current) => ({
          ...current,
          billing: {
            ...current.billing,
            status: "trial",
            paymentMethodLabel: `${label} connecting`,
            trialEndsAt: "Select a paid plan to collect payment"
          },
          proofEvents: [makeEvent("BILLING_METHOD_ADDED", `${label} added for hosting`), ...current.proofEvents]
        }));

        try {
          const result = await postJson<{ billing: CommerceState["billing"] }>("/api/hosting", {
            action: "payment",
            paymentMethodLabel: label,
            merchantProof: merchantProof(stateRef.current)
          }, { maxBodyChars: HOSTING_PUBLISH_REQUEST_BODY_MAX_CHARS });
          setActionFeedback("billing.payment", "success", "Billing synced");
          setState((current) => ({
            ...current,
            billing: result.billing,
            proofEvents: [makeEvent("BILLING_METHOD_ADDED", "Receiz account billing synced"), ...current.proofEvents]
          }));
        } catch (error) {
          setActionFeedback("billing.payment", "error", error instanceof Error ? error.message : "Billing sync failed");
          setState((current) => ({
            ...current,
            proofEvents: [
              makeEvent("BILLING_METHOD_ADDED", error instanceof Error ? error.message : "Billing sync failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      async signInWithReceizId() {
        const snapshot = stateRef.current;
        const identity = await createLocalReceizIdentitySessionInput(snapshot, snapshot.brand.name || "Receiz merchant");

        if (identity.keyFile) {
          pendingBrowserIdentityKeyFileRef.current = identity.keyFile;
        }

        setState((current) => {
          const tenantSurface = currentHostContext().surface === "tenant";
          const nextState = applyLocalReceizIdentitySession(
            current,
            identity.input,
            tenantSurface
          );

          return {
            ...nextState,
            proofEvents: [
              makeEvent("RECEIZ_ID_CONNECTED", `${identity.input.handle} signed in with local proof`),
              ...(tenantSurface ? current.proofEvents : [])
            ]
          };
        });
      },
      async connectExistingReceizId() {
        if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_AUTH_MODE === "receiz_id") {
          const result = await fetchReceizProfile().catch(() => null);
          if (result?.connected && result.profile) {
            const surface = result.surface ?? currentHostContext().surface;
            setState((current) => {
              const nextState = applyReceizProfile(current, result.profile!, surface);

              return {
                ...nextState,
                proofEvents: [
                  makeEvent("RECEIZ_ID_CONNECTED", `${normalizeProfileHandle(result.profile!.handle, current.auth.receizId.handle)} signed in`),
                  ...(surface === "tenant" ? current.proofEvents : [])
                ]
              };
            });
            return true;
          }
        }

        if (typeof window !== "undefined") {
          const browserSession = parseBrowserReceizIdSession(
            safeGetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY)
          );

          if (browserSession) {
            setState((current) => {
              const tenantSurface = currentHostContext().surface === "tenant";
              const nextState = tenantSurface
                ? applyBrowserReceizIdSession(current, browserSession)
                : applyLocalReceizIdentitySession(
                    current,
                    {
                      accountImageLabel: browserSession.receizId.accountImageLabel,
                      artifactKind: browserSession.receizId.artifactKind,
                      artifactStatus: browserSession.receizId.artifactStatus,
                      displayName: browserSession.receizId.displayName,
                      handle: browserSession.receizId.handle,
                      keyId: browserSession.receizId.keyId,
                      localProofVerified: browserSession.receizId.localProofVerified,
                      loginMode: browserSession.receizId.loginMode,
                      portableStateStatus: browserSession.receizId.portableStateStatus,
                      statusLabel: browserSession.receizId.statusLabel
                    },
                    false
                  );

              return {
                ...nextState,
                proofEvents: [
                  makeEvent("RECEIZ_ID_CONNECTED", `${browserSession.receizId.handle} continued from browser proof memory`),
                  ...(tenantSurface ? current.proofEvents : [])
                ]
              };
            });
            return true;
          }
        }

        setState((current) => ({
          ...current,
          auth: {
            ...current.auth,
            receizId: {
              ...current.auth.receizId,
              statusLabel: "Upload Identity Seal or Record"
            }
          },
          proofEvents: [
            makeEvent("RECEIZ_ID_CONNECTED", "Existing Receiz ID needs Identity Seal or Record"),
            ...current.proofEvents
          ]
        }));

        return false;
      },
      async createReceizId() {
        const snapshot = stateRef.current;
        const existingBrowserSession =
          typeof window !== "undefined"
            ? parseBrowserReceizIdSession(safeGetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY))
            : null;

        if (existingBrowserSession) {
          setState((current) => {
            const tenantSurface = currentHostContext().surface === "tenant";
            const nextState = tenantSurface
              ? applyBrowserReceizIdSession(current, existingBrowserSession)
              : applyLocalReceizIdentitySession(
                  current,
                  {
                    accountImageLabel: existingBrowserSession.receizId.accountImageLabel,
                    artifactKind: existingBrowserSession.receizId.artifactKind,
                    artifactStatus: existingBrowserSession.receizId.artifactStatus,
                    displayName: existingBrowserSession.receizId.displayName,
                    handle: existingBrowserSession.receizId.handle,
                    keyId: existingBrowserSession.receizId.keyId,
                    localProofVerified: existingBrowserSession.receizId.localProofVerified,
                    loginMode: existingBrowserSession.receizId.loginMode,
                    portableStateStatus: existingBrowserSession.receizId.portableStateStatus,
                    statusLabel: existingBrowserSession.receizId.statusLabel
                  },
                  false
                );

            return {
              ...nextState,
              proofEvents: [
                makeEvent("RECEIZ_ID_CONNECTED", `${existingBrowserSession.receizId.handle} continued from browser proof memory`),
                ...(tenantSurface ? current.proofEvents : [])
              ]
            };
          });
          return;
        }

        const identity = await createLocalReceizIdentitySessionInput(snapshot, "Receiz customer");
        if (identity.keyFile) {
          pendingBrowserIdentityKeyFileRef.current = identity.keyFile;
        }

        setState((current) => {
          const tenantSurface = currentHostContext().surface === "tenant";
          const nextState = applyLocalReceizIdentitySession(
            current,
            identity.input,
            tenantSurface
          );

          return {
            ...nextState,
            proofEvents: [
              makeEvent("RECEIZ_ID_CONNECTED", `${identity.input.handle} created locally`),
              ...(tenantSurface ? current.proofEvents : [])
            ]
          };
        });
      },
      async ensureCustomerSession(reason = "this store") {
        const snapshot = stateRef.current;
        if (snapshot.auth.receizId.connected && snapshot.auth.receizId.localProofVerified) return true;

        const identity = await receizIdentityForAutomaticCustomerSession(snapshot, reason);
        if (identity.keyFile) {
          pendingBrowserIdentityKeyFileRef.current = identity.keyFile;
        }

        if (typeof window !== "undefined") {
          const resolvedState = identity.apply(snapshot);
          const browserSession = buildBrowserReceizIdSession(resolvedState, identity.keyFile ?? undefined);
          if (browserSession) {
            safeSetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY, JSON.stringify(browserSession));
          }
        }

        setState((current) => {
          const nextState = identity.apply(current);

          return {
            ...nextState,
            proofEvents: identity.detail
              ? [makeEvent("RECEIZ_ID_CONNECTED", identity.detail), ...nextState.proofEvents]
              : nextState.proofEvents
          };
        });

        return true;
      },
      async restoreReceizIdentityArtifact(file: File) {
        const receiz = createReceizCommerceAdapter();
        let projection: ReceizIdentityAccountProjection | null = null;
        let keyFileForBrowserMemory: unknown | null = null;
        let failed = false;

        try {
          const identityResult = await receiz.restoreIdentityArtifact(file);
          projection = identityResult.projection;
          keyFileForBrowserMemory = identityResult.keyFile;
        } catch {
          failed = true;
        }

        setState((current) => {
          const tenantSurface = currentHostContext().surface === "tenant";
          const artifactKind = identityArtifactKind(file);
          const handle = accountHandle(projection, current.auth.receizId.handle);
          const displayName = projection?.owner.displayName ?? current.auth.receizId.displayName;
          const localProofVerified = Boolean(projection?.portableStateVerified);
          const portableStateStatus = projection?.portableStateStatus ?? (failed ? "invalid" : "missing");
          const artifactStatus = localProofVerified ? "verified" : failed ? "pending" : "restored";
          const statusLabel = localProofVerified
            ? "Identity artifact locally verified"
            : failed
              ? "Identity artifact needs a valid Receiz proof"
              : "Identity artifact restored";
          const identityState = failed
            ? current
            : applyLocalReceizIdentitySession(
                current,
                {
                  accountImageLabel: file.name,
                  artifactKind,
                  artifactStatus,
                  displayName,
                  email: projection?.owner.email ?? undefined,
                  handle,
                  keyId: projection?.keyId ?? current.auth.receizId.keyId,
                  localProofVerified,
                  loginMode: "restored_identity_artifact",
                  portableStateStatus,
                  statusLabel
                },
                tenantSurface
              );

          if (!failed && keyFileForBrowserMemory) {
            pendingBrowserIdentityKeyFileRef.current = keyFileForBrowserMemory;
          }

          return {
            ...identityState,
            auth: {
              ...identityState.auth,
              receizId: {
                ...identityState.auth.receizId,
                connected: !failed,
                handle,
                displayName,
                keyId: projection?.keyId ?? current.auth.receizId.keyId,
                loginMode: "restored_identity_artifact",
                accountImageLabel: file.name,
                artifactKind,
                artifactStatus,
                portableStateStatus,
                localProofVerified,
                statusLabel
              }
            },
            proofEvents: [
              makeEvent(
                "RECEIZ_ID_CONNECTED",
                failed
                  ? `${file.name} could not be restored`
                  : `${handle} restored from ${artifactKind.replace(/_/g, " ")}`
              ),
              ...(tenantSurface ? current.proofEvents : [])
            ]
          };
        });
      },
      attachPbiRecovery() {
        const browserSession =
          typeof window !== "undefined"
            ? parseBrowserReceizIdSession(safeGetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY))
            : null;
        const keyFile = pendingBrowserIdentityKeyFileRef.current ?? browserSession?.keyFile;

        if (!keyFile) {
          setState((current) => ({
            ...current,
            auth: {
              ...current.auth,
              receizId: {
                ...current.auth.receizId,
                statusLabel: "Attach PBI after creating or uploading an Identity Seal"
              }
            },
            proofEvents: [
              makeEvent("RECEIZ_ID_CONNECTED", "PBI recovery needs a local Receiz ID or Identity Seal first"),
              ...current.proofEvents
            ]
          }));
          return;
        }

        pendingBrowserIdentityKeyFileRef.current = keyFile;
        setState((current) => ({
          ...current,
          auth: {
            ...current.auth,
            receizId: {
              ...current.auth.receizId,
              artifactStatus: "verified",
              localProofVerified: true,
              statusLabel: "PBI recovery attached"
            }
          },
          proofEvents: [
            makeEvent("RECEIZ_ID_CONNECTED", `${current.auth.receizId.handle} attached PBI recovery`),
            ...current.proofEvents
          ]
        }));
      },
      async downloadIdentitySealImage() {
        const browserSession =
          typeof window !== "undefined"
            ? parseBrowserReceizIdSession(safeGetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY))
            : null;
        const keyFile = pendingBrowserIdentityKeyFileRef.current ?? browserSession?.keyFile;

        if (!keyFile) {
          setState((current) => ({
            ...current,
            auth: {
              ...current.auth,
              receizId: {
                ...current.auth.receizId,
                statusLabel: "Create or upload an Identity Seal before exporting"
              }
            },
            proofEvents: [
              makeEvent("RECEIZ_ID_CONNECTED", "Identity Seal export needs a local Receiz ID or uploaded seal"),
              ...current.proofEvents
            ]
          }));
          return;
        }

        try {
          const snapshot = stateRef.current;
          const bytes = await createIdentitySealImageBytes(keyFile, snapshot.auth.receizId);
          const filename = `${slugify(snapshot.auth.receizId.handle.replace(/\.receiz\.id$/i, ""), "receiz-id")}-identity-seal.png`;
          downloadIdentitySealBytes(bytes, filename);
          pendingBrowserIdentityKeyFileRef.current = keyFile;

          setState((current) => ({
            ...current,
            auth: {
              ...current.auth,
              receizId: {
                ...current.auth.receizId,
                accountImageLabel: "Identity Seal image",
                artifactKind: "identity_seal",
                artifactStatus: "verified",
                localProofVerified: true,
                statusLabel: "Identity Seal downloaded"
              }
            },
            proofEvents: [
              makeEvent("RECEIZ_ID_CONNECTED", `${current.auth.receizId.handle} downloaded an Identity Seal image`),
              ...current.proofEvents
            ]
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            auth: {
              ...current.auth,
              receizId: {
                ...current.auth.receizId,
                statusLabel: "Identity Seal export failed"
              }
            },
            proofEvents: [
              makeEvent(
                "RECEIZ_ID_CONNECTED",
                error instanceof Error ? error.message : "Identity Seal export failed"
              ),
              ...current.proofEvents
            ]
          }));
        }
      },
      publish() {
        void publishWorkspace({
          feedbackId: "publish",
          pendingMessage: "Publishing store",
          successMessage: "Store published",
          pendingEventDetail: "Publishing store to Receiz proof rails",
          successEventDetail: "Store published to Receiz proof rails",
          eventType: "SITE_PUBLISHED"
        });
      },
      addPage(page: SitePage) {
        const nextPage = pageWithDefaults(page);
        setState((current) => ({
          ...current,
          pages: [nextPage, ...current.pages],
          proofEvents: [makeEvent("SITE_PUBLISHED", `${nextPage.title} page drafted`), ...current.proofEvents]
        }));
      },
      updatePage(pageId: string, input: Partial<SitePage>) {
        setState((current) => ({
          ...current,
          pages: current.pages.map((page) =>
            page.id === pageId ? pageWithDefaults({ ...page, ...input }) : page
          )
        }));
      },
      addBlogPost(post: BlogPost) {
        const nextPost = blogPostWithDefaults(post);
        setState((current) => ({
          ...current,
          blogPosts: [nextPost, ...current.blogPosts],
          proofEvents: [makeEvent("SITE_PUBLISHED", `${nextPost.title} blog post drafted`), ...current.proofEvents]
        }));
      },
      updateBlogPost(postId: string, input: Partial<BlogPost>) {
        setState((current) => ({
          ...current,
          blogPosts: current.blogPosts.map((post) =>
            post.id === postId ? blogPostWithDefaults({ ...post, ...input }) : post
          )
        }));
      },
      addCollection(collection: CommerceState["collections"][number]) {
        setState((current) => ({
          ...current,
          collections: [collection, ...current.collections],
          proofEvents: [makeEvent("SITE_PUBLISHED", `${collection.name} category added`), ...current.proofEvents]
        }));
      },
      updateCollection(collectionId: string, input: Partial<CommerceState["collections"][number]>) {
        setState((current) => ({
          ...current,
          collections: current.collections.map((collection) =>
            collection.id === collectionId ? { ...collection, ...input } : collection
          )
        }));
      },
      addProduct(product: Product) {
        const nextProduct = productWithDefaults(product);
        setState((current) => ({
          ...current,
          products: [nextProduct, ...current.products],
          proofEvents: [makeEvent("OBJECT_VERIFIED", `${nextProduct.name} product drafted`), ...current.proofEvents]
        }));
      },
      updateProduct(productId: string, input: Partial<Product>) {
        setState((current) => ({
          ...current,
          products: current.products.map((product) =>
            product.id === productId ? productWithDefaults({ ...product, ...input }) : product
          )
        }));
      },
      selectExchangeAsset(assetId: string) {
        setState((current) => ({
          ...current,
          exchange: {
            ...current.exchange,
            selectedAssetId: current.exchange.assets.some((asset) => asset.id === assetId)
              ? assetId
              : current.exchange.selectedAssetId
          }
        }));
      },
      async listExchangeAsset(source?: string | File) {
        if (typeof File !== "undefined" && source instanceof File) {
          const actorReceizId = stateRef.current.auth.receizId.handle || stateRef.current.hosting.merchantReceizId;
          setActionFeedback("exchange.listAsset", "pending", `Verifying ${source.name || "Receiz proof object"}`);

          try {
            const asset = await receizedAssetFromProofObject(source, actorReceizId);
            const snapshot = stateRef.current;
            const form = new FormData();
            form.set("proofObject", source);
            form.set("asset", JSON.stringify(asset));
            form.set("state", JSON.stringify(snapshot));
            form.set("merchantProof", JSON.stringify(merchantProof(snapshot)));
            form.set("actorReceizId", actorReceizId);
            form.set("tenantHost", checkoutTenantHost(snapshot));
            const response = await fetch("/api/exchange", { method: "POST", body: form });
            const result = await response.json().catch(() => ({})) as {
              message?: string;
              error?: string;
              state?: CommerceState;
              storeStateSync?: StoreStateSyncResponse;
            };
            if (!response.ok || !result.state) {
              throw new Error(result.message || result.error || "Exchange listing failed");
            }

            setState((current) => ({
              ...current,
              exchange: result.state!.exchange,
              assets: result.state!.assets,
              proofEvents: result.state!.proofEvents
            }));
            const syncError = storeStateSyncError(result.storeStateSync);
            const syncPending = storeStateSyncPending(result.storeStateSync);
            setActionFeedback(
              "exchange.listAsset",
              syncError || syncPending ? "error" : "success",
              syncError || (syncPending ? `${asset.name} verified; durable Exchange sync is pending` : `${asset.name} listed and saved`)
            );
          } catch (error) {
            setActionFeedback(
              "exchange.listAsset",
              "error",
              error instanceof Error ? error.message : "Receiz proof object verification failed"
            );
          }
          return;
        }
        setActionFeedback("exchange.listAsset", "error", "Choose a Receiz proof object to run the offline verifier before listing");
      },
      async listWildsCard(card: PortableCardAsset, priceCents = 2500) {
        setActionFeedback("exchange.listAsset", "pending", `Offline-verifying ${card.manifest.name}`);
        try {
          const form = new FormData();
          form.set("card", await portableCardPngBlob(card), `${card.manifest.formId}.png`);
          form.set("priceCents", String(priceCents));
          const response = await fetch("/api/exchange/wilds", { method: "POST", body: form });
          const result = await response.json().catch(() => ({})) as {
            ok?: boolean;
            error?: string;
            card?: PortableCardAsset;
            state?: CommerceState;
            storeStateSync?: StoreStateSyncResponse;
          };
          if (!response.ok || result.ok === false) throw new Error(result.error ?? "Wilds PNG verification failed");
          if (!result.card || !result.state) throw new Error("Wilds card listing failed");

          setState((current) => ({
            ...current,
            exchange: result.state!.exchange,
            assets: result.state!.assets,
            proofEvents: result.state!.proofEvents
          }));
          const syncError = storeStateSyncError(result.storeStateSync);
          const syncPending = storeStateSyncPending(result.storeStateSync);
          setActionFeedback(
            "exchange.listAsset",
            syncError || syncPending ? "error" : "success",
            syncError || (syncPending
              ? `${card.manifest.name} verified; durable Exchange sync is pending`
              : `${card.manifest.name} verified and listed`)
          );
          return result.card;
        } catch (error) {
          setActionFeedback(
            "exchange.listAsset",
            "error",
            error instanceof Error ? error.message : "Wilds card verification failed"
          );
          return null;
        }
      },
      async tradeExchangeAsset(assetId: string, side: ExchangeTradeSide, shares: number, resumeReferenceId?: string) {
        const snapshot = stateRef.current;
        const asset = snapshot.exchange.assets.find((candidate) => candidate.id === assetId);
        if (!asset) {
          setActionFeedback("exchange.trade", "error", "Exchange asset not found");
          return;
        }

        const actorReceizId = snapshot.auth.receizId.handle || snapshot.hosting.merchantReceizId;
        const preview = buildExchangeTradePreview(asset, side, shares, snapshot.exchange.walletBalanceCents);
        if (!preview.shares || !preview.counterpartyReceizId) {
          setActionFeedback("exchange.trade", "error", side === "buy" ? "No seller ask is available" : "No buyer bid is available");
          return;
        }

        const referenceId = resumeReferenceId ?? makeId(`exchange-${assetId}-${side}`);
        setActionFeedback("exchange.trade", "pending", `Settling ${preview.shares} ${asset.symbol} shares`);

        try {
          const result = await postJson<{
            paid?: boolean;
            funding?: CheckoutFundingPayload;
            session?: ReceizCheckoutSessionPayload;
            exchange?: {
              state?: CommerceState;
              storeStateSync?: StoreStateSyncResponse;
            } | null;
          }>("/api/checkout", {
            commerceAction: "exchange_trade",
            assetId,
            side,
            shares: preview.shares,
            amountUsd: (preview.totalCents / 100).toFixed(2),
            totalLabel: preview.totalLabel,
            itemCount: preview.shares,
            referenceId,
            description: `${side === "buy" ? "Buy" : "Sell"} ${preview.shares} ${asset.symbol} shares`,
            tenantHost: checkoutTenantHost(snapshot),
            merchantReceizId: snapshot.hosting.merchantReceizId,
            merchantSettlementUserId: preview.counterpartyReceizId,
            customerReceizId: actorReceizId,
            merchantProof: merchantProof(snapshot),
            successUrl: `${window.location.origin}/?exchange=success`,
            cancelUrl: `${window.location.origin}/?exchange=cancel`
          });
          const funding = fundingFromPayload(result.funding, preview.totalLabel);

          if (!result.paid && funding.cardRequired) {
            const opened = beginEmbeddedPayment(result.session, "exchange_trade", `Fund ${preview.shares} ${asset.symbol} shares`, {
              resumeExchangeAssetId: assetId,
              resumeExchangeShares: preview.shares,
              resumeExchangeSide: side,
              resumeReferenceId: referenceId
            });
            setActionFeedback("exchange.trade", opened ? "pending" : "error", opened ? "Opening card payment" : "Card payment could not open");
            return;
          }

          const published = result.exchange?.state;
          if (!result.paid || !published) {
            setActionFeedback("exchange.trade", "error", "Live Receiz settlement is required before ownership changes");
            return;
          }

          setState((current) => ({
            ...current,
            exchange: published.exchange,
            assets: published.assets,
            proofEvents: published.proofEvents
          }));
          const syncError = storeStateSyncError(result.exchange?.storeStateSync);
          const syncPending = storeStateSyncPending(result.exchange?.storeStateSync);
          setActionFeedback(
            "exchange.trade",
            syncError || syncPending ? "error" : "success",
            syncError || (syncPending ? "Trade settled; durable Exchange sync is still pending" : `${preview.shares} ${asset.symbol} shares settled and saved`)
          );
        } catch (error) {
          setActionFeedback("exchange.trade", "error", error instanceof Error ? error.message : "Exchange settlement failed");
        }
      },
      provideExchangeLiquidity(assetId: string, amountCents: number) {
        setState((current) =>
          stateWithExchangeLiquidity(current, {
            assetId,
            amountCents,
            actorReceizId: current.auth.receizId.handle || current.hosting.merchantReceizId
          })
        );
      },
      addToCart(productId: string) {
        setState((current) => stateWithCartProduct(current, productId));
      },
      setCartProductQuantity(productId: string, quantity: number) {
        setState((current) => stateWithCartQuantity(current, productId, quantity));
      },
      removeFromCart(productId: string) {
        setState((current) => stateWithoutCartProduct(current, productId));
      },
      completeMockCheckout() {
        setState((current) => {
          const id = `${Math.floor(10000 + Math.random() * 89999)}`;
          const customer = {
            ...current.auth.customer,
            receizHandle: current.auth.receizId.handle
          };
          const funding = {
            ...fallbackFunding("$18.00", "$0.00"),
            walletAppliedLabel: "$18.00",
            walletBalanceLabel: "$18.00",
            cardRequired: false
          };
          const shipping = checkoutCustomerShipping(current, customer);
          const completion = checkoutCompletionState({
            funding,
            products: checkoutProducts(current),
            shipping
          });
          const order = {
            id,
            customerId: customer.id,
            customerEmail: customer.email,
            totalLabel: "$18.00",
            status: completion.orderStatus === "settled" ? ("mock_paid" as const) : completion.orderStatus,
            itemCount: Math.max(1, current.cart.lines.length),
            sealed: completion.sealed,
            createdAt: new Date().toISOString(),
            merchantReceizId: current.hosting.merchantReceizId,
            tenantHost: current.hosting.customDomain.domain || current.hosting.subdomain,
            checkoutSessionId: `mock-${id}`,
            paymentRail: "sandbox" as const,
            settlementStatus: "sandbox" as const,
            funding,
            shipping,
            fulfillment: checkoutOrderFulfillment(completion)
          };

          return {
            ...current,
            cart: { lines: [] },
            orders: [order, ...current.orders],
            customers: upsertCheckoutCustomer(current.customers, customer, order.id),
            proofEvents: [makeEvent("ORDER_VERIFIED", completion.fulfillmentMessage), ...current.proofEvents]
          };
        });
      },
      async startCheckout(productId?: string, referenceId?: string) {
        setActionFeedback("checkout", "pending", "Starting checkout");
        const checkoutBase = productId ? stateWithCartProduct(stateRef.current, productId) : stateRef.current;

        if (productId) {
          stateRef.current = checkoutBase;
          setState(checkoutBase);
        }

        const identity = await receizIdentityForAutomaticCustomerSession(checkoutBase, "one-click checkout");
        if (identity.keyFile) {
          pendingBrowserIdentityKeyFileRef.current = identity.keyFile;
        }

        const checkoutSnapshot = identity.apply(checkoutBase);
        const checkoutMode = process.env.NEXT_PUBLIC_CHECKOUT_MODE ?? checkoutSnapshot.checkout.mode;
        const totalLabel = `$${cartAmountUsd(checkoutSnapshot)}`;
        const itemCount = Math.max(1, checkoutSnapshot.cart.lines.length);
        const checkoutProductList = checkoutProducts(checkoutSnapshot);
        const checkoutFulfillmentKindValue = checkoutFulfillmentKind(checkoutProductList);

        if (checkoutMode === "mock") {
          const id = `${Math.floor(10000 + Math.random() * 89999)}`;
          setState((current) => {
            const base = identity.apply(current);
            const customer = {
              ...base.auth.customer,
              receizHandle: base.auth.receizId.handle
            };
            const funding = {
              ...fallbackFunding(totalLabel, "$0.00"),
              walletAppliedLabel: totalLabel,
              walletBalanceLabel: totalLabel,
              cardRequired: false
            };
            const shipping = checkoutCustomerShipping(base, customer);
            const completion = checkoutCompletionState({
              funding,
              products: checkoutProducts(base),
              shipping
            });
            const order = {
              id,
              customerId: customer.id,
              customerEmail: customer.email,
              totalLabel,
              status: completion.orderStatus === "settled" ? ("mock_paid" as const) : completion.orderStatus,
              itemCount,
              sealed: completion.sealed,
              createdAt: new Date().toISOString(),
              merchantReceizId: base.hosting.merchantReceizId,
              tenantHost: base.hosting.customDomain.domain || base.hosting.subdomain,
              checkoutSessionId: `mock-${id}`,
              paymentRail: "sandbox" as const,
              settlementStatus: "sandbox" as const,
              funding,
              shipping,
              fulfillment: checkoutOrderFulfillment(completion)
            };

            return {
              ...base,
              cart: { lines: [] },
              orders: [order, ...base.orders],
              customers: upsertCheckoutCustomer(base.customers, customer, order.id),
              proofEvents: [
                makeEvent("RECEIZ_ID_CONNECTED", identity.detail),
                makeEvent("ORDER_VERIFIED", completion.fulfillmentMessage),
                ...base.proofEvents
              ]
            };
          });
          setActionFeedback("checkout", "success", "Payment recorded");
          return;
        }

        try {
          const checkoutReferenceId = referenceId ?? `order-${Date.now()}`;
          const result = await postJson<{
            session?: {
              checkoutUrl?: string;
              checkoutSessionId?: string;
              clientSecret?: string;
              status?: string;
            };
            funding?: CheckoutFundingPayload;
            paymentRails?: {
              preferred: "receiz_wallet";
              fallback: "credit_card";
              settlement: "merchant_receiz_reserve";
              merchantReceizId: string;
            };
            wildsOwnership?: {
              transfers: Array<{ assetId: string; productId: string; ownerReceizId: string }>;
            } | null;
          }>("/api/checkout", {
            cartLines: checkoutSnapshot.cart.lines,
            customerId: checkoutSnapshot.auth.customer.id,
            customerEmail: checkoutSnapshot.auth.customer.email,
            customerName: checkoutSnapshot.auth.customer.name,
            referenceId: checkoutReferenceId,
            description: `${checkoutSnapshot.brand.name} proof-sealed order`,
            shipping: checkoutCustomerShipping(checkoutSnapshot, checkoutSnapshot.auth.customer),
            tenantSlug: checkoutSnapshot.hosting.tenantSlug,
            tenantHost: checkoutTenantHost(checkoutSnapshot),
            fulfillment: {
              kind: checkoutFulfillmentKindValue,
              status: "payment_required",
              message: "Payment must settle before fulfillment starts.",
              deliveryRails:
                checkoutFulfillmentKindValue === "digital_delivery" || checkoutFulfillmentKindValue === "mixed"
                  ? ["receiz_communications", "email"]
                  : undefined
            },
            merchantProof: merchantProof(checkoutSnapshot),
            successUrl: `${window.location.origin}/?checkout=success`,
            cancelUrl: `${window.location.origin}/?checkout=cancel`
          });

          const funding = fundingFromPayload(result.funding, totalLabel);
          if (funding.cardRequired) {
            const checkoutUrl = result.session?.checkoutUrl;
            setState((current) => {
              const base = identity.apply(current);

              return {
                ...base,
                proofEvents: [
                  makeEvent("RECEIZ_ID_CONNECTED", identity.detail),
                  makeEvent("ORDER_VERIFIED", `Wallet applied ${funding.walletAppliedLabel}; card delta ${funding.cardDeltaLabel} requires payment`),
                  ...base.proofEvents
                ]
              };
            });

            if (checkoutUrl || result.session?.clientSecret) {
              setActionFeedback("checkout", "pending", "Card payment ready");
              beginEmbeddedPayment(result.session, "storefront_checkout", "Complete card funding", {
                resumeProductId: productId,
                resumeReferenceId: checkoutReferenceId
              });
              return;
            }

            setActionFeedback(
              "checkout",
              result.session?.clientSecret ? "pending" : "error",
              result.session?.clientSecret
                ? "Card payment session ready. Complete the card delta before the order is created."
                : "Card payment required, but Receiz did not return a card checkout URL."
            );
            return;
          }

          setState((current) => {
            const base = identity.apply(current);
            const checkoutSessionId = result.session?.checkoutSessionId ?? `receiz-${Date.now()}`;
            const wildsTransfers = result.wildsOwnership?.transfers ?? [];
            const soldProductIds = new Set(wildsTransfers.map((transfer) => transfer.productId));
            const customer = {
              ...base.auth.customer,
              receizHandle: base.auth.receizId.handle,
              assetIds: Array.from(new Set([...base.auth.customer.assetIds, ...wildsTransfers.map((transfer) => transfer.assetId)]))
            };
            const shipping = checkoutCustomerShipping(base, customer);
            const completion = checkoutCompletionState({
              funding,
              products: checkoutProducts(base),
              shipping
            });
            const order = {
              id: checkoutReferenceId,
              customerId: customer.id,
              customerEmail: customer.email,
              totalLabel,
              status: completion.orderStatus,
              itemCount,
              sealed: completion.sealed,
              createdAt: new Date().toISOString(),
              merchantReceizId: result.paymentRails?.merchantReceizId ?? base.hosting.merchantReceizId,
              tenantHost: base.hosting.customDomain.domain || base.hosting.subdomain,
              checkoutSessionId,
              paymentRail: railFromFunding(funding),
              settlementStatus: completion.settlementStatus,
              funding,
              shipping,
              fulfillment: checkoutOrderFulfillment(completion)
            };

            return {
              ...base,
              cart: { lines: [] },
              products: base.products.map((item) => soldProductIds.has(item.id) ? { ...item, status: "draft", inventoryLabel: "Sold" } : item),
              orders: [order, ...base.orders],
              customers: upsertCheckoutCustomer(base.customers, customer, order.id),
              proofEvents: [
                makeEvent("RECEIZ_ID_CONNECTED", identity.detail),
                ...(wildsTransfers.length ? [makeEvent("ASSET_RECEIZED", `${wildsTransfers.length} Wilds card ownership transfer${wildsTransfers.length === 1 ? "" : "s"} appended`)] : []),
                makeEvent("ORDER_VERIFIED", completion.fulfillmentMessage),
                ...base.proofEvents
              ]
            };
          });
          setActionFeedback("checkout", "success", "Payment recorded");
        } catch (error) {
          if (error instanceof ReceizAuthorityRequiredError) {
            setState((current) => {
              const base = identity.apply(current);

              return {
                ...base,
                proofEvents: [
                  makeEvent("RECEIZ_ID_CONNECTED", identity.detail),
                  makeEvent("ORDER_VERIFIED", "Receiz checkout needs a payment rail before the order can be created"),
                  ...base.proofEvents
                ]
              };
            });
            setActionFeedback("checkout", "error", "Receiz checkout needs a payment rail before the order can be created.");
            return;
          }

          setActionFeedback("checkout", "error", error instanceof Error ? error.message : "Receiz checkout failed");
          setState((latest) => ({
            ...latest,
            proofEvents: [
              makeEvent("ORDER_VERIFIED", error instanceof Error ? error.message : "Receiz checkout failed"),
              ...latest.proofEvents
            ]
          }));
        }
      },
      updateCheckoutShipping(orderId: string, shipping: NonNullable<Order["shipping"]>) {
        if (!validShippingAddress(shipping)) {
          setActionFeedback("shipping", "error", "Enter a complete shipping address.");
          return;
        }

        setState((current) => {
          const order = current.orders.find((item) => item.id === orderId);
          if (!order) return current;

          const updatedAt = new Date().toISOString();
          const updatedOrder = {
            ...order,
            shipping,
            status: order.status === "pending" ? ("settled" as const) : order.status,
            sealed: order.settlementStatus !== "card_required",
            fulfillment: {
              kind: order.fulfillment?.kind ?? "physical_shipping",
              status: "ready_to_ship" as const,
              message: "Shipping attached. Merchant fulfillment is ready.",
              deliveryRails: order.fulfillment?.deliveryRails,
              updatedAt
            }
          };

          return {
            ...current,
            orders: current.orders.map((item) => (item.id === orderId ? updatedOrder : item)),
            customers: current.customers.map((customer) =>
              customer.id === order.customerId ? { ...customer, shippingAddress: shipping } : customer
            ),
            auth: {
              ...current.auth,
              customer:
                current.auth.customer.id === order.customerId
                  ? { ...current.auth.customer, shippingAddress: shipping }
                  : current.auth.customer
            },
            proofEvents: [
              makeEvent("ORDER_VERIFIED", `Shipping attached to order #${orderId}`),
              ...current.proofEvents
            ]
          };
        });
        setActionFeedback("shipping", "success", "Shipping saved. Merchant fulfillment is ready.");
      },
      async importCommerceContent(input: Omit<CommerceImportInput, "payload"> & { rawContent?: string }) {
        const result = await postJson<{ imported: CommerceImportResult }>("/api/import", {
          sourceType: input.sourceType,
          sourceUrl: input.sourceUrl,
          rawContent: input.rawContent
        });
        const imported = result.imported;

        setState((current) => ({
          ...current,
          products: appendUniqueById(current.products, imported.products),
          blogPosts: appendUniqueById(current.blogPosts, imported.blogPosts),
          pages: appendUniqueById(current.pages, imported.pages),
          proofEvents: [
            makeEvent(
              "SITE_PUBLISHED",
              `Imported ${imported.summary.products} products, ${imported.summary.blogPosts} posts, ${imported.summary.pages} pages`
            ),
            ...current.proofEvents
          ]
        }));

        return imported;
      },
      appendProofEvent(type: ProofEvent["type"], detail: string) {
        setState((current) => ({
          ...current,
          proofEvents: [makeEvent(type, detail), ...current.proofEvents]
        }));
      },
      sealAsset(assetId: string) {
        setState((current) => ({
          ...current,
          assets: current.assets.map((asset) =>
            asset.id === assetId ? { ...asset, status: "listed" } : asset
          ),
          proofEvents: [makeEvent("ASSET_RECEIZED", `${assetId} sealed`), ...current.proofEvents]
        }));
      }
    }),
    [beginEmbeddedPayment, ensureMerchantProofAuthority, merchantProof, publishWorkspace, setActionFeedback]
  );

  useEffect(() => {
    if (
      !hydrated ||
      publishResumeAttemptedRef.current ||
      hostContext.surface !== "platform" ||
      typeof window === "undefined" ||
      !shouldResumePendingPublish(window.location.search) ||
      !hasPendingPublish(hostContext.storageKey)
    ) {
      return;
    }

    publishResumeAttemptedRef.current = true;
    clearPendingPublish(hostContext.storageKey);
    actions.publish();
  }, [actions, hostContext.storageKey, hostContext.surface, hydrated]);

  return { state, actions, actionFeedback, embeddedPayment, hydrated, hostContext, receizSessionPending };
}
