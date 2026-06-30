import type { CommerceState } from "../../types/domain";
import type { HostContext } from "./host-context";
import { subdomainForSlug } from "./domain-utils";

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
    products: state.products.map((product) => ({
      ...product,
      subtitle: tenantText(product.subtitle, brandName),
      description: product.description ? tenantText(product.description, brandName) : product.description,
      seo: product.seo
        ? {
            ...product.seo,
            title: tenantText(product.seo.title, brandName),
            description: tenantText(product.seo.description, brandName),
            keywords: product.seo.keywords.map((keyword) => tenantText(keyword, brandName))
          }
        : product.seo
    })),
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
  return brandName !== "Boost Coffee" && JSON.stringify(state).includes("Boost");
}

export function tenantFallbackState(state: CommerceState, hostContext: HostContext): CommerceState {
  if (hostContext.surface !== "tenant") return state;

  if (hostContext.tenantSlug) {
    const subdomain = subdomainForSlug(hostContext.tenantSlug);
    const isStoredTenant = state.hosting.subdomain === subdomain;
    const brandName = isStoredTenant ? state.brand.name : titleFromHost(hostContext.tenantSlug);
    const logoText = logoTextFromHost(hostContext.tenantSlug);
    const trustedStoredTenant = isStoredTenant && !containsTemplateBrand(state, brandName);
    const contentState = trustedStoredTenant ? state : tenantSafeFallbackContent(state, brandName);

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
        }
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
              statusLabel: "Continue with Receiz ID"
            }
      }
    };
  }

  if (hostContext.customDomain) {
    const isStoredDomain = state.hosting.customDomain.domain === hostContext.customDomain;
    const brandName = isStoredDomain ? state.brand.name : titleFromHost(hostContext.customDomain);
    const logoText = logoTextFromHost(hostContext.customDomain);
    const trustedStoredDomain = isStoredDomain && !containsTemplateBrand(state, brandName);
    const contentState = trustedStoredDomain ? state : tenantSafeFallbackContent(state, brandName);

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
              statusLabel: "Continue with Receiz ID"
            }
      }
    };
  }

  return state;
}
