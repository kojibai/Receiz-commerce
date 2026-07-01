import type { CommerceState } from "../../types/domain";
import type { HostContext } from "./host-context";
import { subdomainForSlug } from "./domain-utils";

function systemPage(brandName: string, slug: "/about" | "/rewards" | "/account") {
  const labels = {
    "/about": {
      title: `About ${brandName}`,
      body: `${brandName} runs on Receiz proof rails for storefront state, Receiz ID, checkout, rewards, assets, and customer trust.`
    },
    "/rewards": {
      title: `${brandName} Rewards`,
      body: `Customers can earn, redeem, and carry ${brandName} rewards through Receiz ID and proof-sealed commerce actions.`
    },
    "/account": {
      title: `${brandName} Account`,
      body: `Receiz ID keeps orders, rewards, assets, and recovery portable for each ${brandName} customer.`
    }
  }[slug];

  return {
    id: slug.slice(1),
    title: labels.title,
    slug,
    visibleInNav: true,
    published: true,
    sections: [
      {
        id: `${slug.slice(1)}-overview`,
        kind: "content" as const,
        title: labels.title,
        body: labels.body
      }
    ],
    seo: {
      title: labels.title,
      description: labels.body,
      canonicalPath: slug,
      keywords: [brandName, "Receiz", "proof commerce"],
      socialImageUrl: null
    }
  };
}

function withRequiredTenantPages(state: CommerceState, brandName: string): CommerceState {
  const required = ["/about", "/rewards", "/account"] as const;
  const existingSlugs = new Set(state.pages.map((page) => page.slug.toLowerCase()));
  const missingPages = required
    .filter((slug) => !existingSlugs.has(slug))
    .map((slug) => systemPage(brandName, slug));

  if (missingPages.length === 0) return state;

  return {
    ...state,
    pages: [...state.pages, ...missingPages]
  };
}

function titleFromHost(value: string) {
  return value
    .split(".")[0]
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function logoTextFromHost(value: string) {
  return value.split(".")[0]?.replace(/[^a-z0-9]+/gi, "").toLowerCase().slice(0, 8) || "store";
}

function tenantText(value: string, brandName: string) {
  return value
    .replace(/Boost Coffee/g, brandName)
    .replace(/Boost rewards/g, `${brandName} rewards`)
    .replace(/Boost/g, brandName)
    .replace(/boost/gi, brandName.toLowerCase());
}

function tenantSafeFallbackContent(state: CommerceState, brandName: string): CommerceState {
  const fallbackProductIds = state.products.slice(0, 3).map((product) => product.id);

  return {
    ...state,
    storefront: {
      ...state.storefront,
      headline: "Proof-sealed commerce",
      subheadline: `Shop ${brandName} products, rewards, access, and Receized assets.`,
      heroBody: `${brandName} is ready for Receiz ID checkout, proof objects, rewards, and customer accounts.`
    },
    pages: state.pages.map((page) => ({
      ...page,
      title: tenantText(page.title, brandName),
      sections: page.sections.map((section) => ({
        ...section,
        title: tenantText(section.title, brandName),
        body: tenantText(section.body, brandName)
      })),
      seo: page.seo
        ? {
            ...page.seo,
            title: tenantText(page.seo.title, brandName),
            description: tenantText(page.seo.description, brandName),
            keywords: page.seo.keywords.map((keyword) => tenantText(keyword, brandName))
          }
        : page.seo
    })),
    blogPosts: state.blogPosts.map((post) => ({
      ...post,
      title: tenantText(post.title, brandName),
      excerpt: tenantText(post.excerpt, brandName),
      body: tenantText(post.body, brandName),
      authorName: tenantText(post.authorName, brandName),
      seo: {
        ...post.seo,
        title: tenantText(post.seo.title, brandName),
        description: tenantText(post.seo.description, brandName),
        keywords: post.seo.keywords.map((keyword) => tenantText(keyword, brandName))
      }
    })),
    collections: [
      {
        id: "featured",
        name: "Featured",
        slug: "featured",
        productIds: fallbackProductIds,
        published: true
      },
      {
        id: "access",
        name: "Access",
        slug: "access",
        productIds: state.products.filter((product) => product.type === "access" || product.type === "benefit").map((product) => product.id),
        published: true
      },
      {
        id: "rewards",
        name: "Rewards",
        slug: "rewards",
        productIds: state.products.filter((product) => product.rewardEligible).map((product) => product.id),
        published: true
      },
      {
        id: "drops",
        name: "Drops",
        slug: "drops",
        productIds: state.products.filter((product) => product.type === "receized_asset" || product.type === "experience").map((product) => product.id),
        published: true
      }
    ],
    products: state.products.map((product, index) => {
      const fallbackNames = ["Signature item", "Member perk", "Brand essential"];
      const fallbackSubtitles = [
        `${brandName} proof-sealed product`,
        `${brandName} customer benefit`,
        `${brandName} featured offer`
      ];
      const hasDefaultCoffeeCopy = /coffee|cold brew|mug/i.test(`${product.name} ${product.subtitle}`);
      const name = hasDefaultCoffeeCopy ? fallbackNames[index] ?? `${brandName} item` : tenantText(product.name, brandName);
      const subtitle = hasDefaultCoffeeCopy ? fallbackSubtitles[index] ?? `${brandName} proof-sealed item` : tenantText(product.subtitle, brandName);

      return {
        ...product,
        name,
        subtitle,
        description: product.description ? tenantText(product.description, brandName) : product.description,
        seo: product.seo
          ? {
              ...product.seo,
              title: tenantText(product.seo.title, brandName),
              description: tenantText(product.seo.description, brandName),
              keywords: product.seo.keywords.map((keyword) => tenantText(keyword, brandName))
            }
          : product.seo
      };
    }),
    rewards: state.rewards.map((reward) => ({
      ...reward,
      description: tenantText(reward.description, brandName),
      requirement: tenantText(reward.requirement, brandName)
    })),
    campaigns: state.campaigns.map((campaign) => ({
      ...campaign,
      name: tenantText(campaign.name, brandName)
    })),
    proofEvents: state.proofEvents.map((event) => ({
      ...event,
      detail: tenantText(event.detail, brandName)
    }))
  };
}

function containsTemplateBrand(state: CommerceState, brandName: string) {
  return (
    brandName !== "Boost Coffee" &&
    (JSON.stringify(state).includes("Boost") ||
      state.collections.some((collection) => collection.name === "Coffee" || collection.name === "Access and benefits"))
  );
}

export function tenantFallbackState(
  state: CommerceState,
  hostContext: HostContext,
  options: { trustedPublishedState?: boolean } = {}
): CommerceState {
  if (hostContext.surface !== "tenant") return state;

  if (hostContext.tenantSlug) {
    const subdomain = subdomainForSlug(hostContext.tenantSlug);
    const isStoredTenant = state.hosting.subdomain === subdomain;
    const brandName = isStoredTenant ? state.brand.name : titleFromHost(hostContext.tenantSlug);
    const logoText = logoTextFromHost(hostContext.tenantSlug);
    const trustedStoredTenant = isStoredTenant && (options.trustedPublishedState || !containsTemplateBrand(state, brandName));
    const contentState = withRequiredTenantPages(
      trustedStoredTenant ? state : tenantSafeFallbackContent(state, brandName),
      brandName
    );

    return {
      ...contentState,
      brand: trustedStoredTenant
        ? contentState.brand
        : {
            ...contentState.brand,
            name: brandName,
            logoText
          },
      hosting: {
        ...contentState.hosting,
        tenantSlug: hostContext.tenantSlug,
        subdomain,
        liveUrl: `https://${subdomain}`,
        merchantReceizId: trustedStoredTenant ? contentState.hosting.merchantReceizId : `${logoText}.receiz.id`,
        settlementAccountLabel: trustedStoredTenant ? contentState.hosting.settlementAccountLabel : `${brandName} Receiz account`,
        subdomainStatus: {
          ...contentState.hosting.subdomainStatus,
          domain: subdomain,
          liveUrl: `https://${subdomain}`,
          status: "active",
          sslStatus: "valid",
          verified: true,
          message: "Loaded from hosted subdomain"
        },
        customDomain: trustedStoredTenant
          ? contentState.hosting.customDomain
          : {
              ...contentState.hosting.customDomain,
              domain: "",
              liveUrl: "",
              status: "pending",
              sslStatus: "pending",
              verified: false,
              message: "No custom domain connected for this fallback storefront"
            }
      },
      checkout: trustedStoredTenant
        ? contentState.checkout
        : {
            ...contentState.checkout,
            label: "Receiz checkout"
          },
      auth: {
        ...contentState.auth,
        signedInAs: "customer",
        receizId: trustedStoredTenant
          ? contentState.auth.receizId
          : {
              ...contentState.auth.receizId,
              connected: false,
              handle: `${logoText}.receiz.id`,
              displayName: brandName,
              localProofVerified: false,
              portableStateStatus: "missing",
              artifactStatus: "pending",
              statusLabel: "Continue with Receiz ID"
            }
      }
    };
  }

  if (hostContext.customDomain) {
    const isStoredDomain = state.hosting.customDomain.domain === hostContext.customDomain;
    const brandName = isStoredDomain ? state.brand.name : titleFromHost(hostContext.customDomain);
    const logoText = logoTextFromHost(hostContext.customDomain);
    const trustedStoredDomain = isStoredDomain && (options.trustedPublishedState || !containsTemplateBrand(state, brandName));
    const contentState = withRequiredTenantPages(
      trustedStoredDomain ? state : tenantSafeFallbackContent(state, brandName),
      brandName
    );

    return {
      ...contentState,
      brand: trustedStoredDomain
        ? contentState.brand
        : {
            ...contentState.brand,
            name: brandName,
            logoText
          },
      hosting: {
        ...contentState.hosting,
        liveUrl: `https://${hostContext.customDomain}`,
        merchantReceizId: trustedStoredDomain ? contentState.hosting.merchantReceizId : `${logoText}.receiz.id`,
        settlementAccountLabel: trustedStoredDomain ? contentState.hosting.settlementAccountLabel : `${brandName} Receiz account`,
        customDomain: {
          ...contentState.hosting.customDomain,
          domain: hostContext.customDomain,
          liveUrl: `https://${hostContext.customDomain}`,
          status: "active",
          sslStatus: "valid",
          verified: true,
          message: "Loaded from custom domain"
        }
      },
      checkout: trustedStoredDomain
        ? contentState.checkout
        : {
            ...contentState.checkout,
            label: "Receiz checkout"
          },
      auth: {
        ...contentState.auth,
        signedInAs: "customer",
        receizId: trustedStoredDomain
          ? contentState.auth.receizId
          : {
              ...contentState.auth.receizId,
              connected: false,
              handle: `${logoText}.receiz.id`,
              displayName: brandName,
              localProofVerified: false,
              portableStateStatus: "missing",
              artifactStatus: "pending",
              statusLabel: "Continue with Receiz ID"
            }
      }
    };
  }

  return state;
}
