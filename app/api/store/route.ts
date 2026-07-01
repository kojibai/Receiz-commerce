import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import {
  isStoreStateRecord,
  storeStateProjectionSource
} from "@/lib/receiz/proof-state";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { publishReceizStoreState } from "@/lib/receiz/store-state-publication";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { receizAccessTokenFromRequest, receizAuthorityRequired } from "@/lib/receiz/session";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { prepareStoreStateMediaForPublish } from "@/lib/receiz/media-publication";
import { mockStorage } from "@/lib/storage/mock-storage";
import { tenantFallbackState } from "@/lib/hosting/tenant-state";
import { hydrateProofStoreFromReceizStoreState } from "@/lib/receiz/store-state-ledger";
import { buildPublishedCommerceState } from "@/lib/hosting/published-state";
import {
  merchantLocalProofObjectFromState,
  merchantProofAuthorityRequirement
} from "@/lib/hosting/merchant-proof-authority";
import type { CommerceState, StorefrontHomepageMode } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  pragma: "no-cache",
  expires: "0"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isHomepageMode(value: unknown): value is StorefrontHomepageMode {
  return value === "store" || value === "blog" || value === "game";
}

function mergePublishedState(input: unknown): CommerceState {
  const base = mockStorage.getState();
  if (!isRecord(input)) return base;
  const storefront = isRecord(input.storefront) ? { ...base.storefront, ...input.storefront } : base.storefront;

  return {
    ...base,
    brand: isRecord(input.brand) ? { ...base.brand, ...input.brand } : base.brand,
    storefront: {
      ...storefront,
      homepageMode: isHomepageMode(storefront.homepageMode) ? storefront.homepageMode : base.storefront.homepageMode
    },
    hosting: isRecord(input.hosting) ? { ...base.hosting, ...input.hosting } : base.hosting,
    navigation: Array.isArray(input.navigation) ? (input.navigation as CommerceState["navigation"]) : base.navigation,
    pages: Array.isArray(input.pages) ? (input.pages as CommerceState["pages"]) : base.pages,
    blogPosts: Array.isArray(input.blogPosts) ? (input.blogPosts as CommerceState["blogPosts"]) : base.blogPosts,
    collections: Array.isArray(input.collections) ? (input.collections as CommerceState["collections"]) : base.collections,
    products: Array.isArray(input.products) ? (input.products as CommerceState["products"]) : base.products,
    rewards: Array.isArray(input.rewards) ? (input.rewards as CommerceState["rewards"]) : base.rewards,
    rewardRules: Array.isArray(input.rewardRules) ? (input.rewardRules as CommerceState["rewardRules"]) : base.rewardRules,
    assets: Array.isArray(input.assets) ? (input.assets as CommerceState["assets"]) : base.assets,
    qualifiers: Array.isArray(input.qualifiers) ? (input.qualifiers as CommerceState["qualifiers"]) : base.qualifiers,
    campaigns: Array.isArray(input.campaigns) ? (input.campaigns as CommerceState["campaigns"]) : base.campaigns,
    game: isRecord(input.game) ? { ...base.game, ...input.game } : base.game,
    checkout: isRecord(input.checkout) ? { ...base.checkout, ...input.checkout } : base.checkout
  };
}

function receizWriteSucceeded(result: unknown) {
  return !(isRecord(result) && result.ok === false);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function loadPublishOwner(accessToken: string | undefined) {
  if (!accessToken) return null;

  try {
    return await loadReceizConnectProfile(accessToken);
  } catch {
    return null;
  }
}

async function requireStorePublishAuthority(accessToken: string | undefined, localIdentityState?: unknown) {
  const profile = await loadPublishOwner(accessToken);
  const localIdentity = merchantLocalProofObjectFromState(localIdentityState);
  const delegatedPermission = Boolean(profile) || (Boolean(accessToken) && !localIdentity.localProofVerified);
  const gate = merchantProofAuthorityRequirement({
    action: "publish",
    delegatedPermission,
    handle: profile?.handle ?? localIdentity.handle,
    localReceizIdConnected: localIdentity.connected,
    localProofVerified: localIdentity.localProofVerified
  });

  if (gate.ok) {
    return {
      ok: true as const,
      profile,
      handle: gate.handle,
      source: gate.source,
      localIdentity
    };
  }

  return {
    ok: false as const,
    response: NextResponse.json(
      {
        ...receizAuthorityRequired("/admin"),
        message: gate.message
      },
      { status: 401, headers: noStoreHeaders }
    )
  };
}

export async function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(host);
  const tenantHostParam = request.nextUrl.searchParams.get("tenantHost");
  const projectionHostContext =
    hostContext.surface === "tenant" || !tenantHostParam
      ? hostContext
      : hostContextFromHost(tenantHostParam);
  const proofStore = await getServerProofStateStore();
  const tenantHost = projectionHostContext.tenantHost ?? projectionHostContext.host;
  let recovery = { admitted: 0, recovered: 0 };

  if (projectionHostContext.surface === "tenant") {
    recovery = await hydrateProofStoreFromReceizStoreState(proofStore, tenantHost);
  }

  const projectionSource = projectionHostContext.surface === "tenant" ? storeStateProjectionSource(proofStore.records(), tenantHost) : "platform";
  const trustedPublishedState = projectionSource === "published";

  if (projectionHostContext.surface === "tenant" && projectionSource === "fallback") {
    console.info("[store] tenant fallback projection", {
      tenantHost,
      recovered: recovery.recovered,
      entries: proofStore.snapshot().head.count
    });
  }

  const projectedState =
    projectionHostContext.surface === "tenant"
      ? tenantFallbackState(proofStore.projectHost(mockStorage.getState(), tenantHost), projectionHostContext, { trustedPublishedState })
      : mockStorage.getState();

  return NextResponse.json(
    {
      ok: true,
      source: projectionSource,
      publishedState: trustedPublishedState,
      hostContext: projectionHostContext,
      requestHostContext: hostContext,
      storefront: projectedState.storefront,
      brand: projectedState.brand,
      navigation: projectedState.navigation,
      pages: projectedState.pages,
      collections: projectedState.collections,
      products: projectedState.products,
      rewards: projectedState.rewards,
      rewardRules: projectedState.rewardRules,
      assets: projectedState.assets,
      listings: projectedState.listings,
      qualifiers: projectedState.qualifiers,
      campaigns: projectedState.campaigns,
      blogPosts: projectedState.blogPosts,
      game: projectedState.game,
      checkout: projectedState.checkout,
      receiz: projectedState.receiz,
      orders: projectedState.orders,
      customers: projectedState.customers,
      proofEvents: projectedState.proofEvents,
      hosting: projectedState.hosting,
      proofMemory: {
        knownHead: proofStore.knownHead(100),
        entries: proofStore.snapshot().head.count,
        recovery
      }
    },
    { headers: noStoreHeaders }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = String(isRecord(body) ? body.action ?? "publish" : "publish");
  const accessToken = receizAccessTokenFromRequest(request);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(host);

  if (action !== "publish") {
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  }

  const merchantAuthority = await requireStorePublishAuthority(
    accessToken,
    isRecord(body) ? body.merchantProof ?? body.merchantSession ?? body.state : null
  );
  if (!merchantAuthority.ok) return merchantAuthority.response;

  const publishOwner = merchantAuthority.profile;
  const state = buildPublishedCommerceState(mockStorage.getState(), mergePublishedState(isRecord(body) ? body.state : null), {
    customDomain: publishOwner?.customDomain,
    displayName: publishOwner?.name ?? merchantAuthority.localIdentity.displayName,
    merchantReceizId: publishOwner?.handle ?? merchantAuthority.handle,
    tenantSlug: publishOwner?.subdomain
  });
  const tenantHost = state.hosting.customDomain.domain || state.hosting.subdomain || hostContext.tenantHost || host;
  const actorReceizId = state.hosting.merchantReceizId || state.auth.receizId.handle;
  let publishState = state;

  if (accessToken && merchantAuthority.source === "delegated_permission") {
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });

    try {
      publishState = await prepareStoreStateMediaForPublish(state, {
        tenantHost,
        merchantReceizId: actorReceizId,
        upload: (file, options) => receiz.uploadMedia(file, options)
      });
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "receiz_media_publish_failed",
          message: errorMessage(error)
        },
        { status: 502, headers: noStoreHeaders }
      );
    }
  }

  const receizRecord = await publishReceizStoreState(accessToken, publishState, {
    actorReceizId,
    tenantHost,
    reason: "publish"
  });

  if (!receizWriteSucceeded(receizRecord)) {
    const error = isRecord(receizRecord) ? String(receizRecord.error ?? "receiz_store_state_record_failed") : "receiz_store_state_record_failed";

    return NextResponse.json(
      {
        ok: false,
        error: "receiz_store_state_record_failed",
        message: error === "receiz_authority_required"
          ? "The proof object authorized publish locally, but the durable Receiz public-store write needs a valid server write rail before the live site can update cold-starts."
          : error,
        receizRecord
      },
      { status: error === "receiz_authority_required" ? 401 : 502, headers: noStoreHeaders }
    );
  }

  if (!isRecord(receizRecord) || !isStoreStateRecord(receizRecord.record)) {
    return NextResponse.json(
      {
        ok: false,
        error: "receiz_store_state_record_missing",
        message: "Receiz store-state publish completed without a completed proof record."
      },
      { status: 502, headers: noStoreHeaders }
    );
  }

  const record = receizRecord.record;
  const proofStore = await getServerProofStateStore(String(record.merchantReceizId));
  await proofStore.admitStoreRecord(record);

  return NextResponse.json(
    {
      ok: true,
      action,
      hosting: publishState.hosting,
      state: publishState,
      record,
      receizRecord,
      proofMemory: {
        knownHead: proofStore.knownHead(100),
        entries: proofStore.snapshot().head.count
      }
    },
    { headers: noStoreHeaders }
  );
}
