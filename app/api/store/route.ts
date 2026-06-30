import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import {
  buildStoreStateConnectRecord,
  buildStoreStateRecord,
  storeStateProjectionSource,
  type StoreStateRecord
} from "@/lib/receiz/proof-state";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { receizAccessTokenFromRequest, receizLoginRequired } from "@/lib/receiz/session";
import { mockStorage } from "@/lib/storage/mock-storage";
import { tenantFallbackState } from "@/lib/hosting/tenant-state";
import { hydrateProofStoreFromReceizStoreState } from "@/lib/receiz/store-state-ledger";
import { buildPublishedCommerceState } from "@/lib/hosting/published-state";
import type { CommerceState, StorefrontHomepageMode } from "@/types/domain";

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

async function recordWithReceiz(accessToken: string | undefined, record: StoreStateRecord) {
  if (!accessToken) {
    return { ok: false, skipped: true, error: "receiz_login_required" };
  }

  try {
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });

    return await receiz.connectRecord(buildStoreStateConnectRecord(record));
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Receiz store-state record failed"
    };
  }
}

function receizWriteSucceeded(result: unknown) {
  return !(isRecord(result) && result.ok === false);
}

export async function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(host);
  const proofStore = await getServerProofStateStore();
  const tenantHost = hostContext.tenantHost ?? hostContext.host;
  let recovery = { admitted: 0, recovered: 0 };

  if (hostContext.surface === "tenant") {
    recovery = await hydrateProofStoreFromReceizStoreState(proofStore, tenantHost);
  }

  const projectionSource = hostContext.surface === "tenant" ? storeStateProjectionSource(proofStore.records(), tenantHost) : "platform";
  const trustedPublishedState = projectionSource === "published";

  const projectedState =
    hostContext.surface === "tenant"
      ? tenantFallbackState(proofStore.projectHost(mockStorage.getState(), tenantHost), hostContext, { trustedPublishedState })
      : mockStorage.getState();

  return NextResponse.json({
    ok: true,
    source: projectionSource,
    publishedState: trustedPublishedState,
    hostContext,
    storefront: projectedState.storefront,
    brand: projectedState.brand,
    navigation: projectedState.navigation,
    pages: projectedState.pages,
    products: projectedState.products,
    rewards: projectedState.rewards,
    assets: projectedState.assets,
    blogPosts: projectedState.blogPosts,
    orders: projectedState.orders,
    customers: projectedState.customers,
    proofEvents: projectedState.proofEvents,
    hosting: projectedState.hosting,
    proofMemory: {
      knownHead: proofStore.knownHead(100),
      entries: proofStore.snapshot().head.count,
      recovery
    }
  });
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

  if (!accessToken && process.env.NEXT_PUBLIC_AUTH_MODE === "receiz_id") {
    return NextResponse.json(receizLoginRequired("/admin"), { status: 401 });
  }

  const state = buildPublishedCommerceState(mockStorage.getState(), mergePublishedState(isRecord(body) ? body.state : null));
  const tenantHost = state.hosting.customDomain.domain || state.hosting.subdomain || hostContext.tenantHost || host;
  const record = buildStoreStateRecord(state, {
    actorReceizId: state.hosting.merchantReceizId || state.auth.receizId.handle,
    tenantHost,
    reason: "publish"
  });
  const proofStore = await getServerProofStateStore(record.merchantReceizId);
  await proofStore.admitStoreRecord(record);
  const receizRecord = await recordWithReceiz(accessToken, record);

  if (!receizWriteSucceeded(receizRecord)) {
    const error = isRecord(receizRecord) ? String(receizRecord.error ?? "receiz_store_state_record_failed") : "receiz_store_state_record_failed";

    return NextResponse.json(
      {
        ok: false,
        error: "receiz_store_state_record_failed",
        message: error,
        receizRecord
      },
      { status: error === "receiz_login_required" ? 401 : 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    action,
    record,
    receizRecord,
    proofMemory: {
      knownHead: proofStore.knownHead(100),
      entries: proofStore.snapshot().head.count
    }
  });
}
