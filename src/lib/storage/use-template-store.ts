"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  appendReceizIdentityArtifactTrailerToPng,
  createReceizClient,
  type ReceizIdentityAccountProjection
} from "@receiz/sdk";
import { seedCommerceState } from "@/data/seed";
import {
  normalizeCustomDomain,
  normalizeTenantSlug,
  subdomainForSlug
} from "@/lib/hosting/domain-utils";
import { BASE_STORAGE_KEY, currentHostContext, hostContextFromHost, type HostContext } from "@/lib/hosting/host-context";
import type { CommerceImportInput, CommerceImportResult } from "@/lib/import/commerce-importer";
import { selectClientInitialState } from "@/lib/storage/client-state";
import { safeGetLocalStorage, safeRemoveLocalStorage, safeSetLocalStorage } from "@/lib/storage/browser-storage";
import { pendingPublishStorageKey, shouldResumePendingPublish } from "@/lib/storage/pending-publish";
import { mergeStoreApiProjection } from "@/lib/storefront/store-api-projection";
import { applyLocalReceizIdentitySession } from "@/lib/storefront/local-identity-session";
import { stateWithCartProduct } from "@/lib/storefront/product-purchase";
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
import type { BlogPost, CommerceState, CustomerAccount, Order, Product, ProofEvent, SitePage, StorefrontHomepageMode } from "@/types/domain";
import { makeId } from "@/lib/utils";

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
    timestampLabel: "now"
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
      merchantReceizId: current.auth.receizId.connected ? current.auth.receizId.handle : current.hosting.merchantReceizId,
      settlementAccountLabel: `${brandName} Receiz account`
    },
    navigation: current.navigation.map((item) =>
      item.id === "blog" || item.id === "account" || item.id === "rewards" ? { ...item, visible: true } : item
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
  return appendReceizIdentityArtifactTrailerToPng(pngBytes, keyFile as never);
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

function normalizeProfileHandle(value: string | undefined, fallback: string) {
  const handle = compactString(value, fallback).replace(/^@/, "");
  return handle.includes(".") ? handle : `${handle}.receiz.id`;
}

function ownerKeyFromProfile(profile: ReceizProfile) {
  return compactString(profile.id, compactString(profile.handle, compactString(profile.email, "receiz-account")));
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
      headline: "Proof-sealed commerce",
      subheadline: "Sell products, access, benefits, and Receized assets.",
      heroBody: "Your store is ready for products, payments, rewards, and proof.",
      ctaLabel: "Shop now"
    },
    hosting: {
      ...current.hosting,
      mode: "hosted_platform",
      tenantSlug,
      subdomain,
      liveUrl: `https://${subdomain}`,
      merchantReceizId: handle,
      settlementAccountLabel: `${displayName} Receiz account`,
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
        message: "Choose and claim this free Receiz.app subdomain"
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
      trialEndsAt: "Free subdomain available",
      invoices: []
    },
    navigation: seedCommerceState.navigation,
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

  const ownerKey = ownerKeyFromProfile(profile);
  const resetTemplate = current.auth.workspaceOwnerId !== ownerKey && current.hosting.published;
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

async function fetchPublishedStoreProjection() {
  const response = await fetch("/api/store", {
    cache: "no-store",
    headers: {
      accept: "application/json",
      "x-receiz-storefront-fetch": "1"
    }
  });

  if (!response.ok) return null;

  return response.json() as Promise<unknown>;
}

class ReceizLoginRequiredError extends Error {
  connectUrl: string;

  constructor(connectUrl: string, message = "Receiz rails authorization is required for this server action. Continue with Receiz ID, then try again.") {
    super(message);
    this.name = "ReceizLoginRequiredError";
    this.connectUrl = connectUrl;
  }
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
  options: { deferLoginRedirect?: boolean } = {}
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));

  if (response.status === 401 && typeof payload.connectUrl === "string") {
    if (!options.deferLoginRedirect && typeof window !== "undefined") {
      window.location.assign(payload.connectUrl);
    }
    throw new ReceizLoginRequiredError(payload.connectUrl, String(payload.message ?? "Receiz rails authorization required"));
  }

  if (!response.ok || payload.ok === false) {
    throw new Error(String(payload.message ?? payload.error ?? "Request failed"));
  }

  return payload as T;
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

function statusFromFunding(funding: NonNullable<Order["funding"]>): Order["status"] {
  return funding.cardRequired ? "card_required" : "settled";
}

function settlementFromFunding(funding: NonNullable<Order["funding"]>): Order["settlementStatus"] {
  return funding.cardRequired ? "card_required" : "wallet_reserved";
}

function customerShipping(customer: CustomerAccount) {
  return (
    customer.shippingAddress ?? {
      name: customer.name,
      email: customer.email,
      line1: "Add shipping address",
      city: "Pending",
      region: "",
      postalCode: "",
      country: "US"
    }
  );
}

function upsertCheckoutCustomer(customers: CustomerAccount[], customer: CustomerAccount, orderId: string) {
  const nextCustomer = {
    ...customer,
    receizHandle: customer.receizHandle,
    shippingAddress: customerShipping(customer),
    orderIds: Array.from(new Set([orderId, ...customer.orderIds]))
  };

  if (!customers.some((item) => item.id === customer.id)) {
    return [nextCustomer, ...customers];
  }

  return customers.map((item) => (item.id === customer.id ? { ...item, ...nextCustomer } : item));
}

function appendUniqueById<T extends { id: string }>(current: T[], imported: T[]) {
  const seen = new Set(current.map((item) => item.id));
  return [...imported.filter((item) => !seen.has(item.id)), ...current];
}

function publishedStatePayload(state: CommerceState) {
  return {
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
    game: state.game,
    checkout: state.checkout
  };
}

async function receizIdentityForAutomaticCustomerSession(snapshot: CommerceState, reason: string) {
  if (snapshot.auth.receizId.connected) {
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

  const client = createReceizClient();
  let projection: ReceizIdentityAccountProjection | null = null;
  let keyFile: unknown | null = null;
  let handle = `${slugify(snapshot.brand.logoText || snapshot.brand.name, "customer")}-${makeId("id").slice(-6)}`;
  let displayName = "Receiz customer";

  try {
    const identity = await client.identity.createReceizId({
      username: handle,
      displayName,
      deviceName: snapshot.brand.name
    });
    keyFile = identity.keyFile;
    projection = await client.identity.projectAccount(identity.keyFile);
    handle = accountHandle(projection, `${handle}.receiz.id`);
    displayName = projection?.owner.displayName ?? displayName;
  } catch {
    handle = handle.includes(".") ? handle : `${handle}.receiz.id`;
  }

  return {
    keyFile,
    detail: `${handle} created for ${reason}`,
    apply: (state: CommerceState) =>
      applyLocalReceizIdentitySession(
        state,
        {
          accountImageLabel: "Local Receiz ID",
          artifactKind: "receiz_id",
          artifactStatus: projection?.portableStateVerified ? "verified" : "created",
          displayName,
          email: projection?.owner.email ?? undefined,
          handle,
          keyId: projection?.keyId ?? state.auth.receizId.keyId,
          localProofVerified: Boolean(projection?.portableStateVerified),
          loginMode: "new_receiz_id",
          portableStateStatus: projection?.portableStateStatus ?? "missing",
          statusLabel: projection?.portableStateVerified ? "New Receiz ID locally verified" : "New Receiz ID created"
        },
        currentHostContext().surface === "tenant"
      )
  };
}

export function useTemplateStore(initialState: CommerceState = seedCommerceState, initialHostContext?: HostContext) {
  const [state, setState] = useState<CommerceState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [receizSessionPending, setReceizSessionPending] = useState(false);
  const [hostContext, setHostContext] = useState<HostContext>(() => initialHostContext ?? hostContextFromHost(null));
  const stateRef = useRef(initialState);
  const pendingBrowserIdentityKeyFileRef = useRef<unknown | null>(null);
  const publishResumeAttemptedRef = useRef(false);

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
    const restoredState = restoredCustomerSession
      ? applyTenantCustomerSession(readState(context, initialState), restoredCustomerSession)
      : applyBrowserReceizIdSession(readState(context, initialState), restoredBrowserIdentitySession);

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

  const actions = useMemo(
    () => ({
      reset() {
        setState(seedCommerceState);
        if (typeof window !== "undefined") {
          safeRemoveLocalStorage(window.localStorage, currentHostContext().storageKey);
          safeRemoveLocalStorage(window.localStorage, BASE_STORAGE_KEY);
        }
      },
      updateBrand(input: Partial<CommerceState["brand"]>) {
        setState((current) => ({
          ...current,
          brand: { ...current.brand, ...input }
        }));
      },
      saveTheme() {
        setState((current) => ({
          ...current,
          proofEvents: [makeEvent("THEME_UPDATED", `${current.brand.name} theme saved`), ...current.proofEvents]
        }));
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
          setState((current) => ({
            ...current,
            proofEvents: [makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Invalid subdomain"), ...current.proofEvents]
          }));
          return;
        }

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
          setState((current) => ({
            ...current,
            hosting: result.hosting,
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", `${result.hosting.subdomainStatus.message ?? result.hosting.subdomain} · ${result.hosting.subdomainStatus.status}`),
              ...current.proofEvents
            ]
          }));
        } catch (error) {
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
          setState((current) => ({
            ...current,
            proofEvents: [makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Invalid custom domain"), ...current.proofEvents]
          }));
          return;
        }

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
          const result = await postJson<{ hosting: CommerceState["hosting"] }>("/api/hosting", {
            action: "custom_domain",
            domain: normalizedDomain
          });
          setState((current) => ({
            ...current,
            hosting: result.hosting,
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", `${result.hosting.customDomain.message ?? normalizedDomain} · ${result.hosting.customDomain.status}`),
              ...current.proofEvents
            ]
          }));
        } catch (error) {
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
          setState((current) => ({
            ...current,
            proofEvents: [makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Invalid custom domain"), ...current.proofEvents]
          }));
          return;
        }

        try {
          const result = await postJson<{ hosting: CommerceState["hosting"] }>("/api/hosting", {
            action: "verify_domain",
            domain: normalizedDomain
          });
          setState((current) => ({
            ...current,
            hosting: result.hosting,
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", `${result.hosting.customDomain.message ?? normalizedDomain} · ${result.hosting.customDomain.status}`),
              ...current.proofEvents
            ]
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            proofEvents: [
              makeEvent("DOMAIN_CONNECTED", error instanceof Error ? error.message : "Domain verification failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      async selectHostingPlan(plan: CommerceState["hosting"]["plan"]) {
        setState((current) => {
          const selected = current.billing.plans.find((item) => item.id === plan);
          return {
            ...current,
            hosting: { ...current.hosting, plan },
            billing: {
              ...current.billing,
              monthlyTotalLabel: selected?.priceLabel ?? current.billing.monthlyTotalLabel
            },
            proofEvents: [
              makeEvent("HOSTING_PLAN_UPDATED", `${selected?.name ?? plan} hosting plan selected`),
              ...current.proofEvents
            ]
          };
        });

        try {
          const result = await postJson<{
            hosting: CommerceState["hosting"];
            billing: CommerceState["billing"];
          }>("/api/hosting", {
            action: "plan",
            plan
          });
          setState((current) => ({
            ...current,
            hosting: result.hosting,
            billing: result.billing,
            proofEvents: [makeEvent("HOSTING_PLAN_UPDATED", `${plan} plan synced with Receiz billing`), ...current.proofEvents]
          }));
        } catch (error) {
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
        setState((current) => ({
          ...current,
          billing: {
            ...current.billing,
            status: "active",
            paymentMethodLabel: label,
            trialEndsAt: "Active subscription"
          },
          proofEvents: [makeEvent("BILLING_METHOD_ADDED", `${label} added for hosting`), ...current.proofEvents]
        }));

        try {
          const result = await postJson<{ billing: CommerceState["billing"] }>("/api/hosting", {
            action: "payment",
            paymentMethodLabel: label
          });
          setState((current) => ({
            ...current,
            billing: result.billing,
            proofEvents: [makeEvent("BILLING_METHOD_ADDED", "Receiz account billing synced"), ...current.proofEvents]
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            proofEvents: [
              makeEvent("BILLING_METHOD_ADDED", error instanceof Error ? error.message : "Billing sync failed"),
              ...current.proofEvents
            ]
          }));
        }
      },
      signInWithReceizId() {
        if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_AUTH_MODE === "receiz_id") {
          const returnTo = `${window.location.pathname}${window.location.search}`;
          window.location.assign(`/api/auth/receiz/start?returnTo=${encodeURIComponent(returnTo || "/account")}`);
          return;
        }

        setState((current) => ({
          ...current,
          auth: {
            ...current.auth,
            receizId: {
              ...current.auth.receizId,
              connected: true,
              loginMode: "existing_receiz_id",
              statusLabel: "Signed in with existing Receiz ID"
            }
          },
          proofEvents: [
            makeEvent("RECEIZ_ID_CONNECTED", `${current.auth.receizId.handle} signed in`),
            ...current.proofEvents
          ]
        }));
      },
      async connectExistingReceizId() {
        if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_AUTH_MODE === "receiz_id") {
          const result = await fetchReceizProfile().catch(() => null);
          if (result?.connected && result.profile) {
            const surface = result.surface ?? currentHostContext().surface;
            setState((current) => ({
              ...applyReceizProfile(current, result.profile!, surface),
              proofEvents: [
                makeEvent("RECEIZ_ID_CONNECTED", `${normalizeProfileHandle(result.profile!.handle, current.auth.receizId.handle)} signed in`),
                ...current.proofEvents
              ]
            }));
            return true;
          }
        }

        if (typeof window !== "undefined") {
          const browserSession = parseBrowserReceizIdSession(
            safeGetLocalStorage(window.localStorage, BROWSER_RECEIZ_ID_SESSION_KEY)
          );

          if (browserSession) {
            setState((current) => ({
              ...applyBrowserReceizIdSession(current, browserSession),
              proofEvents: [
                makeEvent("RECEIZ_ID_CONNECTED", `${browserSession.receizId.handle} continued from browser proof memory`),
                ...current.proofEvents
              ]
            }));
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
          setState((current) => ({
            ...applyBrowserReceizIdSession(current, existingBrowserSession),
            proofEvents: [
              makeEvent("RECEIZ_ID_CONNECTED", `${existingBrowserSession.receizId.handle} continued from browser proof memory`),
              ...current.proofEvents
            ]
          }));
          return;
        }

        const client = createReceizClient();
        let projection: ReceizIdentityAccountProjection | null = null;
        let handle = `${slugify(snapshot.brand.logoText || snapshot.brand.name, "customer")}-${makeId("id").slice(-6)}`;
        let displayName = "Receiz customer";

        try {
          const identity = await client.identity.createReceizId({
            username: handle,
            displayName,
            deviceName: snapshot.brand.name
          });
          pendingBrowserIdentityKeyFileRef.current = identity.keyFile;
          projection = await client.identity.projectAccount(identity.keyFile);
          handle = accountHandle(projection, `${handle}.receiz.id`);
          displayName = projection?.owner.displayName ?? displayName;
        } catch {
          handle = handle.includes(".") ? handle : `${handle}.receiz.id`;
        }

        setState((current) => ({
          ...applyLocalReceizIdentitySession(
            current,
            {
              accountImageLabel: "Local Receiz ID",
              artifactKind: "receiz_id",
              artifactStatus: projection?.portableStateVerified ? "verified" : "created",
              displayName,
              email: projection?.owner.email ?? undefined,
              handle,
              keyId: projection?.keyId ?? current.auth.receizId.keyId,
              localProofVerified: Boolean(projection?.portableStateVerified),
              loginMode: "new_receiz_id",
              portableStateStatus: projection?.portableStateStatus ?? "missing",
              statusLabel: projection?.portableStateVerified ? "New Receiz ID locally verified" : "New Receiz ID created"
            },
            currentHostContext().surface === "tenant"
          ),
          proofEvents: [
            makeEvent("RECEIZ_ID_CONNECTED", `${handle} created locally`),
            ...current.proofEvents
          ]
        }));
      },
      async ensureCustomerSession(reason = "this store") {
        const snapshot = stateRef.current;
        if (snapshot.auth.receizId.connected) return true;

        const identity = await receizIdentityForAutomaticCustomerSession(snapshot, reason);
        if (identity.keyFile) {
          pendingBrowserIdentityKeyFileRef.current = identity.keyFile;
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
        const client = createReceizClient();
        let projection: ReceizIdentityAccountProjection | null = null;
        let keyFileForBrowserMemory: unknown | null = null;
        let failed = false;

        try {
          const keyFile = await client.identity.readArtifact(file);
          projection = await client.identity.projectAccount(keyFile);
          keyFileForBrowserMemory = keyFile;
        } catch {
          failed = true;
        }

        setState((current) => {
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
                currentHostContext().surface === "tenant"
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
              ...current.proofEvents
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
        setState((current) => {
          const publishRequestState = {
            ...current,
            hosting: { ...current.hosting, published: true, lastPublishedAt: "now" }
          };
          const publishHostContext = currentHostContext();
          markPendingPublish(publishHostContext.storageKey);

          void postJson<{ hosting: CommerceState["hosting"] }>("/api/hosting", {
            action: "publish",
            state: publishedStatePayload(publishRequestState)
          }, { deferLoginRedirect: true })
            .then((result) => {
              clearPendingPublish(publishHostContext.storageKey);
              setState((latest) => ({
                ...latest,
                hosting: result.hosting,
                proofEvents: [makeEvent("SITE_PUBLISHED", "Store published to Receiz proof rails"), ...latest.proofEvents]
              }));
            })
            .catch((error) => {
              if (error instanceof ReceizLoginRequiredError) {
                clearPendingPublish(publishHostContext.storageKey);
                setState((latest) => ({
                  ...latest,
                  proofEvents: [
                    makeEvent("SITE_PUBLISHED", "Receiz ID required to publish. Continue with Receiz ID in Account, then publish again."),
                    ...latest.proofEvents
                  ]
                }));
                return;
              }

              clearPendingPublish(publishHostContext.storageKey);
              setState((latest) => ({
                ...latest,
                proofEvents: [
                  makeEvent("SITE_PUBLISHED", error instanceof Error ? error.message : "Publish sync failed"),
                  ...latest.proofEvents
                ]
              }));
            });

          return {
            ...current,
            proofEvents: [makeEvent("SITE_PUBLISHED", "Publishing store to Receiz proof rails"), ...current.proofEvents]
          };
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
      addToCart(productId: string) {
        setState((current) => stateWithCartProduct(current, productId));
      },
      completeMockCheckout() {
        setState((current) => {
          const id = `${Math.floor(10000 + Math.random() * 89999)}`;
          const customer = {
            ...current.auth.customer,
            receizHandle: current.auth.receizId.handle
          };
          const order = {
            id,
            customerId: customer.id,
            customerEmail: customer.email,
            totalLabel: "$18.00",
            status: "mock_paid" as const,
            itemCount: Math.max(1, current.cart.lines.length),
            sealed: true,
            createdAt: new Date().toISOString(),
            merchantReceizId: current.hosting.merchantReceizId,
            tenantHost: current.hosting.customDomain.domain || current.hosting.subdomain,
            checkoutSessionId: `mock-${id}`,
            paymentRail: "sandbox" as const,
            settlementStatus: "sandbox" as const,
            shipping: customerShipping(customer)
          };

          return {
            ...current,
            cart: { lines: [] },
            orders: [order, ...current.orders],
            customers: upsertCheckoutCustomer(current.customers, customer, order.id),
            proofEvents: [makeEvent("ORDER_VERIFIED", `Order #${order.id} sealed`), ...current.proofEvents]
          };
        });
      },
      async startCheckout(productId?: string) {
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

        if (checkoutMode === "mock") {
          const id = `${Math.floor(10000 + Math.random() * 89999)}`;
          setState((current) => {
            const base = identity.apply(current);
            const customer = {
              ...base.auth.customer,
              receizHandle: base.auth.receizId.handle
            };
            const order = {
              id,
              customerId: customer.id,
              customerEmail: customer.email,
              totalLabel,
              status: "mock_paid" as const,
              itemCount,
              sealed: true,
              createdAt: new Date().toISOString(),
              merchantReceizId: base.hosting.merchantReceizId,
              tenantHost: base.hosting.customDomain.domain || base.hosting.subdomain,
              checkoutSessionId: `mock-${id}`,
              paymentRail: "sandbox" as const,
              settlementStatus: "sandbox" as const,
              funding: {
                ...fallbackFunding(totalLabel, "$0.00"),
                walletAppliedLabel: totalLabel,
                walletBalanceLabel: totalLabel,
                cardRequired: false
              },
              shipping: customerShipping(customer)
            };

            return {
              ...base,
              cart: { lines: [] },
              orders: [order, ...base.orders],
              customers: upsertCheckoutCustomer(base.customers, customer, order.id),
              proofEvents: [
                makeEvent("RECEIZ_ID_CONNECTED", identity.detail),
                makeEvent("ORDER_VERIFIED", `Order #${order.id} sealed`),
                ...base.proofEvents
              ]
            };
          });
          return;
        }

        try {
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
          }>("/api/checkout", {
            amountUsd: cartAmountUsd(checkoutSnapshot),
            totalLabel,
            itemCount,
            customerId: checkoutSnapshot.auth.customer.id,
            customerEmail: checkoutSnapshot.auth.customer.email,
            referenceId: `order-${Date.now()}`,
            description: `${checkoutSnapshot.brand.name} proof-sealed order`,
            tenantSlug: checkoutSnapshot.hosting.tenantSlug,
            tenantHost: checkoutSnapshot.hosting.subdomain,
            merchantReceizId: checkoutSnapshot.hosting.merchantReceizId,
            successUrl: `${window.location.origin}/?checkout=success`,
            cancelUrl: `${window.location.origin}/?checkout=cancel`
          }, { deferLoginRedirect: true });

          setState((current) => {
            const base = identity.apply(current);
            const funding = fundingFromPayload(result.funding, totalLabel);
            const checkoutSessionId = result.session?.checkoutSessionId ?? `receiz-${Date.now()}`;
            const customer = {
              ...base.auth.customer,
              receizHandle: base.auth.receizId.handle
            };
            const order = {
              id: checkoutSessionId.replace(/^checkout[_-]/, "").slice(0, 18) || `${Date.now()}`,
              customerId: customer.id,
              customerEmail: customer.email,
              totalLabel,
              status: statusFromFunding(funding),
              itemCount,
              sealed: !funding.cardRequired,
              createdAt: new Date().toISOString(),
              merchantReceizId: result.paymentRails?.merchantReceizId ?? base.hosting.merchantReceizId,
              tenantHost: base.hosting.customDomain.domain || base.hosting.subdomain,
              checkoutSessionId,
              paymentRail: railFromFunding(funding),
              settlementStatus: settlementFromFunding(funding),
              funding,
              shipping: customerShipping(customer)
            };

            return {
              ...base,
              cart: { lines: [] },
              orders: [order, ...base.orders],
              customers: upsertCheckoutCustomer(base.customers, customer, order.id),
              proofEvents: [
                makeEvent("RECEIZ_ID_CONNECTED", identity.detail),
                makeEvent(
                  "ORDER_VERIFIED",
                  funding.cardRequired
                    ? `Wallet applied ${funding.walletAppliedLabel}; card delta ${funding.cardDeltaLabel}`
                    : `Receiz wallet funded ${funding.totalLabel} for ${order.merchantReceizId}`
                ),
                ...base.proofEvents
              ]
            };
          });
        } catch (error) {
          if (error instanceof ReceizLoginRequiredError) {
            setState((current) => {
              const base = identity.apply(current);
              const id = `card-${Date.now()}`;
              const funding = fallbackFunding(totalLabel);
              const customer = {
                ...base.auth.customer,
                receizHandle: base.auth.receizId.handle
              };
              const order = {
                id,
                customerId: customer.id,
                customerEmail: customer.email,
                totalLabel,
                status: "card_required" as const,
                itemCount,
                sealed: false,
                createdAt: new Date().toISOString(),
                merchantReceizId: base.hosting.merchantReceizId,
                tenantHost: base.hosting.customDomain.domain || base.hosting.subdomain,
                checkoutSessionId: `in-app-${id}`,
                paymentRail: "card_fallback" as const,
                settlementStatus: "card_required" as const,
                funding,
                shipping: customerShipping(customer)
              };

              return {
                ...base,
                cart: { lines: [] },
                orders: [order, ...base.orders],
                customers: upsertCheckoutCustomer(base.customers, customer, order.id),
                proofEvents: [
                  makeEvent("RECEIZ_ID_CONNECTED", identity.detail),
                  makeEvent("ORDER_VERIFIED", `Card delta ${funding.cardDeltaLabel} ready in app`),
                  ...base.proofEvents
                ]
              };
            });
            return;
          }

          setState((latest) => ({
            ...latest,
            proofEvents: [
              makeEvent("ORDER_VERIFIED", error instanceof Error ? error.message : "Receiz checkout failed"),
              ...latest.proofEvents
            ]
          }));
        }
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
    []
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

  return { state, actions, hydrated, hostContext, receizSessionPending };
}
