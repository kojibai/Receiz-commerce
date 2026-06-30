import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { buildStoreStateRecord, type StoreStateRecord } from "@/lib/receiz/proof-state";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { receizAccessTokenFromRequest, receizLoginRequired } from "@/lib/receiz/session";
import { mockStorage } from "@/lib/storage/mock-storage";
import { tenantFallbackState } from "@/lib/hosting/tenant-state";
import type { CommerceState } from "@/types/domain";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergePublishedState(input: unknown): CommerceState {
  const base = mockStorage.getState();
  if (!isRecord(input)) return base;

  return {
    ...base,
    brand: isRecord(input.brand) ? { ...base.brand, ...input.brand } : base.brand,
    storefront: isRecord(input.storefront) ? { ...base.storefront, ...input.storefront } : base.storefront,
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

    return await receiz.connectRecord(record);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Receiz store-state record failed"
    };
  }
}

export async function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(host);
  const proofStore = await getServerProofStateStore();
  const projectedState =
    hostContext.surface === "tenant"
      ? tenantFallbackState(proofStore.projectHost(mockStorage.getState(), hostContext.tenantHost ?? hostContext.host), hostContext)
      : mockStorage.getState();

  return NextResponse.json({
    ok: true,
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
      entries: proofStore.snapshot().head.count
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

  if (!accessToken) {
    return NextResponse.json(receizLoginRequired("/admin"), { status: 401 });
  }

  const state = mergePublishedState(isRecord(body) ? body.state : null);
  const tenantHost = state.hosting.customDomain.domain || state.hosting.subdomain || hostContext.tenantHost || host;
  const record = buildStoreStateRecord(state, {
    actorReceizId: state.auth.receizId.handle,
    tenantHost,
    reason: "publish"
  });
  const proofStore = await getServerProofStateStore(record.merchantReceizId);
  await proofStore.admitStoreRecord(record);
  const receizRecord = await recordWithReceiz(accessToken, record);

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
