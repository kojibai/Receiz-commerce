import { NextRequest, NextResponse } from "next/server";
import { mockHosting } from "@/lib/hosting/mock-hosting";
import { normalizeCustomDomain, normalizeTenantSlug, subdomainForSlug } from "@/lib/hosting/domain-utils";
import {
  merchantLocalProofObjectFromState,
  merchantProofAuthorityRequirement,
  type MerchantAuthorityAction
} from "@/lib/hosting/merchant-proof-authority";
import {
  VercelDomainError,
  addProjectDomain,
  customDomainStatusFromVercel,
  dnsInstructionsForDomain,
  dnsRecordsForDomain,
  hasVercelDomainConfig,
  missingVercelEnvDomainStatus,
  verifyProjectDomain,
  wildcardDomainStatusFromVercel
} from "@/lib/hosting/vercel-domains";
import { checkPublicDns, checkVercelDomainDns } from "@/lib/hosting/dns-check";
import { buildPublishedStateForHostingSync } from "@/lib/hosting/published-domain-sync";
import { buildPublishedCommerceState } from "@/lib/hosting/published-state";
import {
  hostingBillingFromPlatformPayment,
  hostingPlanUpdateFromPlatformPayment,
  platformPaymentConfirmed
} from "@/lib/hosting/platform-billing";
import { createWalletFirstReceizSettlement } from "@/lib/checkout/receiz-settlement";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { buildStoreStateRecord } from "@/lib/receiz/proof-state";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import {
  publishAndAdmitReceizStoreState,
  receizStoreStateSyncCompleted,
  receizStoreStateWriteSucceeded,
  summarizeReceizStoreStatePublicationResult,
  summarizeStoreStateRecord
} from "@/lib/receiz/store-state-publication";
import { receizAuthorityRequired, receizRequestSession } from "@/lib/receiz/session";
import { prepareStoreStateMediaForPublish } from "@/lib/receiz/media-publication";
import { mockStorage } from "@/lib/storage/mock-storage";
import type { DomainStatus, HostingConfig } from "@/types/domain";

export const runtime = "nodejs";

const PLATFORM_RECORD_SCHEMA = "receiz.app.hosting_event.v1";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function badRequest(error: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: "invalid_input",
      message: errorMessage(error)
    },
    { status: 400 }
  );
}

function publicStoreWriteFailureMessage(error: string) {
  if (error === "receiz_authority_required") {
    return "Receiz public-store sync needs proof-authorized write permission. The proof object was admitted locally first.";
  }

  if (error === "receiz_access_token_required") {
    return "Receiz public-store sync needs a signed local proof object append. Restore the Identity Seal in app, then publish again.";
  }

  return error;
}

async function loadPublishOwner(accessToken: string | undefined) {
  if (!accessToken) return null;

  try {
    return await loadReceizConnectProfile(accessToken);
  } catch (error) {
    console.error("[publish] Receiz profile unavailable", { error: errorMessage(error) });
    return null;
  }
}

async function requireMerchantAuthority(
  accessToken: string | undefined,
  action: MerchantAuthorityAction,
  returnTo: string,
  localIdentityState?: unknown
) {
  const profile = await loadPublishOwner(accessToken);
  const localIdentity = merchantLocalProofObjectFromState(localIdentityState);
  const delegatedPermission = Boolean(profile) || (Boolean(accessToken) && !localIdentity.localProofVerified);
  const gate = merchantProofAuthorityRequirement({
    action,
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
        ...receizAuthorityRequired(returnTo),
        message: gate.message
      },
      { status: 401 }
    )
  };
}

function returnToFromRequest(request: NextRequest) {
  const referer = request.headers.get("referer");
  if (!referer) return "/admin";

  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}`;
  } catch {
    return "/admin";
  }
}

function originFromRequest(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!forwardedHost) return request.nextUrl.origin;

  const forwardedProto = request.headers.get("x-forwarded-proto") ?? (request.nextUrl.protocol || "https:").replace(":", "");
  return `${forwardedProto}://${forwardedHost}`;
}

function domainErrorStatus(domain: string, error: unknown): DomainStatus {
  if (error instanceof VercelDomainError && error.status === 428) {
    return missingVercelEnvDomainStatus(domain);
  }

  return {
    domain,
    status: "error",
    sslStatus: "unknown",
    verified: false,
    liveUrl: `https://${domain}`,
    dnsRecords: dnsRecordsForDomain(domain),
    dnsInstructions: dnsInstructionsForDomain(domain),
    message: errorMessage(error),
    lastCheckedAt: new Date().toISOString()
  };
}

function customDomainCanServeStorefront(customDomain: DomainStatus) {
  return Boolean(
    customDomain.domain &&
      customDomain.verified &&
      customDomain.dnsResolved &&
      (customDomain.status === "active" || customDomain.status === "ready") &&
      customDomain.sslStatus === "valid"
  );
}

function hostingFromRequest(value: unknown): HostingConfig {
  const current = mockHosting.getHostingStatus();
  if (!isRecord(value)) return current;

  return {
    ...current,
    ...(value as Partial<HostingConfig>),
    subdomainStatus: {
      ...current.subdomainStatus,
      ...(isRecord(value.subdomainStatus) ? value.subdomainStatus : {})
    },
    customDomain: {
      ...current.customDomain,
      ...(isRecord(value.customDomain) ? value.customDomain : {})
    }
  };
}

function amountForPlan(plan: HostingConfig["plan"]) {
  if (plan === "starter") return "0.00";
  if (plan === "scale") return process.env.RECEIZ_SCALE_PLAN_USD ?? "199.00";
  return process.env.RECEIZ_PRO_PLAN_USD ?? "49.00";
}

function isPositiveAmount(amountUsd: string) {
  return Number(amountUsd) > 0;
}

async function recordReceizHostingEvent(
  accessToken: string | undefined,
  event: string,
  data: Record<string, unknown>
) {
  if (!accessToken) {
    return { ok: false, skipped: true, error: "receiz_authority_required" };
  }

  try {
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });

    return await receiz.connectRecord({
      schema: PLATFORM_RECORD_SCHEMA,
      event,
      platform: platform.productName,
      recordedAt: new Date().toISOString(),
      data
    });
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

async function chargePlatformFee(
  accessToken: string | undefined,
  input: {
    amountUsd: string;
    note: string;
    idempotencyKey: string;
    tenantHost: string;
    successUrl?: string;
    cancelUrl?: string;
  }
) {
  const liveBilling = process.env.RECEIZ_PLATFORM_BILLING_MODE === "live";

  if (!isPositiveAmount(input.amountUsd)) {
    return {
      ok: true,
      mode: "no_charge",
      amountUsd: input.amountUsd,
      paid: true,
      message: "No positive platform fee configured"
    };
  }

  if (!liveBilling) {
    return {
      ok: true,
      mode: "sandbox",
      amountUsd: input.amountUsd,
      paid: false,
      message: "Set RECEIZ_PLATFORM_BILLING_MODE=live to charge through Receiz"
    };
  }

  const recipientUserId = process.env.RECEIZ_PLATFORM_ACCOUNT_ID ?? process.env.RECEIZ_PLATFORM_USER_ID;
  if (!recipientUserId) {
    return {
      ok: false,
      status: 428,
      error: "missing_platform_receiz_account",
      message: "Set RECEIZ_PLATFORM_ACCOUNT_ID to collect platform/custom-domain fees into your Receiz account."
    };
  }

  if (!accessToken) {
    return {
      ...receizAuthorityRequired("/admin"),
      status: 401,
      message: "Connect Receiz ID before billing so Receiz can move wallet funds and open card payment for any delta."
    };
  }

  try {
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });
    const settlement = await createWalletFirstReceizSettlement({
      receiz,
      amountUsd: input.amountUsd,
      tenantHost: input.tenantHost,
      recipientUserId,
      idempotencyKey: input.idempotencyKey,
      note: input.note,
      description: input.note,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: {
        platform: platform.productName,
        billingKind: "platform_fee"
      },
      cart: {
        items: [
          {
            id: input.idempotencyKey,
            title: input.note,
            quantity: 1,
            amountUsd: input.amountUsd
          }
        ]
      }
    });

    return {
      ok: true,
      mode: "live",
      amountUsd: input.amountUsd,
      paid: settlement.paid,
      funding: settlement.funding,
      wallet: settlement.wallet,
      transfer: settlement.walletTransfer,
      checkoutSession: settlement.checkoutSession,
      receiptId: settlement.receiptId,
      proofBundle: settlement.proofBundle,
      paymentRail: settlement.paymentRail,
      settlementStatus: settlement.settlementStatus,
      paymentRails: {
        preferred: "receiz_wallet",
        fallback: "credit_card",
        settlement: "platform_receiz_reserve",
        recipientUserId
      },
      message: settlement.paid
        ? "Receiz wallet settlement completed."
        : "Card payment is required for the remaining Receiz billing delta."
    };
  } catch (error) {
    return {
      ok: false,
      status: 402,
      error: "receiz_platform_fee_failed",
      message: errorMessage(error)
    };
  }
}

async function syncPublishedStoreStateForHosting(input: {
  accessToken: string | undefined;
  submittedState: unknown;
  hosting: HostingConfig;
  merchantAuthority: {
    profile: Awaited<ReturnType<typeof loadPublishOwner>>;
    handle: string;
    source: "delegated_permission" | "proof_object";
    localIdentity: ReturnType<typeof merchantLocalProofObjectFromState>;
  };
}) {
  const state = buildPublishedStateForHostingSync(mockStorage.getState(), input.submittedState, input.hosting, {
    customDomain: input.merchantAuthority.profile?.customDomain,
    displayName: input.merchantAuthority.profile?.name ?? input.merchantAuthority.localIdentity.displayName,
    merchantReceizId: input.merchantAuthority.profile?.handle ?? input.merchantAuthority.handle,
    tenantSlug: input.merchantAuthority.profile?.subdomain
  });

  if (!state) {
    return {
      ok: true as const,
      skipped: true as const,
      reason: "workspace_not_published"
    };
  }

  const actorReceizId = state.hosting.merchantReceizId || state.auth.receizId.handle;
  const tenantHost = state.hosting.customDomain.domain || state.hosting.subdomain;
  let publishState = state;

  if (input.accessToken) {
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken: input.accessToken
    });

    try {
      publishState = await prepareStoreStateMediaForPublish(state, {
        tenantHost,
        merchantReceizId: actorReceizId,
        upload: (file, options) => receiz.uploadMedia(file, options)
      });
    } catch (error) {
      return {
        ok: false as const,
        error: "receiz_media_publish_failed",
        message: errorMessage(error)
      };
    }
  }

  const storeStateRecord = buildStoreStateRecord(publishState, {
    actorReceizId,
    tenantHost,
    reason: "sync"
  });
  const proofStore = await getServerProofStateStore(storeStateRecord.merchantReceizId);
  const storeStateReceizRecord = await publishAndAdmitReceizStoreState({
    accessToken: input.accessToken,
    record: storeStateRecord,
    proofStore,
    proof: {
      keyFile: input.merchantAuthority.localIdentity.keyFile,
      passphrase: input.merchantAuthority.localIdentity.passphrase
    }
  });
  const storeStateSyncOk = receizStoreStateWriteSucceeded(storeStateReceizRecord);
  const storeStateSynced = receizStoreStateSyncCompleted(storeStateReceizRecord);
  const summarizedStoreStateRecord = summarizeStoreStateRecord(storeStateRecord);
  const summarizedStoreStateReceizRecord = summarizeReceizStoreStatePublicationResult(storeStateReceizRecord);

  if (!storeStateSyncOk) {
    const error = isRecord(storeStateReceizRecord)
      ? String(storeStateReceizRecord.error ?? "receiz_store_state_record_failed")
      : "receiz_store_state_record_failed";

    return {
      ok: true as const,
      synced: false as const,
      error,
      warning: publicStoreWriteFailureMessage(error),
      storeStateRecord: summarizedStoreStateRecord,
      storeStateReceizRecord: summarizedStoreStateReceizRecord
    };
  }

  if (!storeStateSynced) {
    return {
      ok: true as const,
      synced: false as const,
      warning: "Receiz public-store sync is pending; the proof object was admitted locally first.",
      storeStateRecord: summarizedStoreStateRecord,
      storeStateReceizRecord: summarizedStoreStateReceizRecord
    };
  }

  return {
    ok: true as const,
    synced: true as const,
    skipped: false as const,
    state: input.accessToken ? publishState : { hosting: publishState.hosting },
    storeStateRecord: summarizedStoreStateRecord,
    storeStateReceizRecord: summarizedStoreStateReceizRecord
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hosting: mockHosting.getHostingStatus(),
    billing: mockHosting.getBillingStatus(),
    checklist: mockHosting.getPublishChecklist(),
    platform: {
      domain: platform.domain,
      wildcardDomain: `*.${platform.domain}`,
      vercelDomainAutomation: hasVercelDomainConfig(),
      receizPlatformBilling: process.env.RECEIZ_PLATFORM_BILLING_MODE === "live"
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "subdomain");
  const requestSession = receizRequestSession(request);
  const accessToken = requestSession.accessToken;
  const payerAccessToken = requestSession.cookieAccessToken;
  const returnTo = returnToFromRequest(request);
  const origin = originFromRequest(request);

  if (action === "plan") {
    const plan = String(body.plan ?? "pro") as HostingConfig["plan"];
    if (!["starter", "pro", "scale"].includes(plan)) {
      return badRequest(new Error("Unknown hosting plan."));
    }
    const merchantAuthority = await requireMerchantAuthority(
      payerAccessToken,
      "billing",
      returnTo,
      isRecord(body) ? body.merchantProof ?? body.merchantSession ?? body.state : null
    );
    if (!merchantAuthority.ok) return merchantAuthority.response;

    const platformBilling = await chargePlatformFee(merchantAuthority.source === "delegated_permission" ? payerAccessToken : undefined, {
      amountUsd: amountForPlan(plan),
      note: `${platform.productName} ${plan} hosting plan`,
      idempotencyKey: `receiz-app:hosting-plan:${merchantAuthority.handle}:${plan}`,
      tenantHost: platform.domain,
      successUrl: `${origin}/admin?billing=success&plan=${encodeURIComponent(plan)}`,
      cancelUrl: `${origin}/admin?billing=cancel&plan=${encodeURIComponent(plan)}`
    });

    if (!platformBilling.ok) {
      const status = Number(platformBilling.status ?? 402);
      return NextResponse.json(platformBilling, { status });
    }

    const currentHosting = hostingFromRequest(isRecord(body) ? body.hosting ?? (isRecord(body.state) ? body.state.hosting : null) : null);
    const planUpdate = hostingPlanUpdateFromPlatformPayment(currentHosting, plan, platformBilling);
    if (!planUpdate.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "hosting_plan_payment_required",
          message: planUpdate.message,
          platformBilling,
          hosting: planUpdate.hosting,
          billing: mockHosting.getBillingStatus()
        },
        { status: 402 }
      );
    }

    const result = mockHosting.selectHostingPlan(plan);
    const hosting = planUpdate.hosting;
    const billing = mockHosting.updateBilling(hostingBillingFromPlatformPayment(result.billing, plan, platformBilling));
    await recordReceizHostingEvent(accessToken, "hosting.plan.selected", {
      plan,
      platformBilling,
      hosting,
      billing
    });

    return NextResponse.json({ ok: true, action, platformBilling, ...result, hosting, billing });
  }

  if (action === "payment") {
    const merchantAuthority = await requireMerchantAuthority(
      payerAccessToken,
      "billing",
      returnTo,
      isRecord(body) ? body.merchantProof ?? body.merchantSession ?? body.state : null
    );
    if (!merchantAuthority.ok) return merchantAuthority.response;

    const billing = mockHosting.updateBilling({
      status: "trial",
      paymentMethodLabel: "Receiz wallet + card fallback connected",
      trialEndsAt: "Select a paid plan to collect payment"
    });
    await recordReceizHostingEvent(accessToken, "hosting.billing.connected", { billing });
    return NextResponse.json({ ok: true, action, billing });
  }

  if (action === "custom_domain") {
    let domain = "";
    try {
      domain = normalizeCustomDomain(String(body.domain ?? body.customDomain ?? ""));
    } catch (error) {
      return badRequest(error);
    }

    const merchantAuthority = await requireMerchantAuthority(
      payerAccessToken,
      "custom_domain",
      returnTo,
      isRecord(body) ? body.merchantProof ?? body.merchantSession ?? body.state : null
    );
    if (!merchantAuthority.ok) return merchantAuthority.response;

    const platformBilling = await chargePlatformFee(merchantAuthority.source === "delegated_permission" ? payerAccessToken : undefined, {
      amountUsd: process.env.RECEIZ_CUSTOM_DOMAIN_SETUP_USD ?? "0.00",
      note: `${platform.productName} custom domain setup for ${domain}`,
      idempotencyKey: `receiz-app:custom-domain:${domain}`,
      tenantHost: domain,
      successUrl: `${origin}/admin?domain=${encodeURIComponent(domain)}&billing=success`,
      cancelUrl: `${origin}/admin?domain=${encodeURIComponent(domain)}&billing=cancel`
    });

    if (!platformBilling.ok) {
      const status = Number(platformBilling.status ?? 402);
      return NextResponse.json(platformBilling, { status });
    }

    if (!platformPaymentConfirmed(platformBilling)) {
      return NextResponse.json(
        {
          ok: false,
          error: "custom_domain_payment_required",
          message: "Custom domain setup waits for confirmed wallet and card settlement.",
          platformBilling
        },
        { status: 402 }
      );
    }

    let customDomain: DomainStatus;
    try {
      const vercelDomain = await addProjectDomain(domain);
      const dns = await checkVercelDomainDns(domain);
      customDomain = customDomainStatusFromVercel(domain, vercelDomain, dns);
    } catch (error) {
      customDomain = domainErrorStatus(domain, error);
    }

    const hosting = {
      ...mockHosting.updateCustomDomain(customDomain),
      mode: "hosted_platform" as const,
      customDomain
    };
    const receizRecord = await recordReceizHostingEvent(accessToken, "hosting.custom_domain.connected", {
      domain,
      customDomain,
      platformBilling
    });
    const storeStateSync = customDomainCanServeStorefront(customDomain)
      ? await syncPublishedStoreStateForHosting({
          accessToken,
          submittedState: isRecord(body) ? body.state : null,
          hosting,
          merchantAuthority
        })
      : {
          ok: true as const,
          skipped: true as const,
          reason: "domain_not_live"
        };

    return NextResponse.json({ ok: true, action, hosting, platformBilling, receizRecord, storeStateSync });
  }

  if (action === "verify_domain") {
    let domain = "";
    try {
      domain = normalizeCustomDomain(String(body.domain ?? ""));
    } catch (error) {
      return badRequest(error);
    }

    const merchantAuthority = await requireMerchantAuthority(
      accessToken,
      "verify_domain",
      returnTo,
      isRecord(body) ? body.merchantProof ?? body.merchantSession ?? body.state : null
    );
    if (!merchantAuthority.ok) return merchantAuthority.response;

    let customDomain: DomainStatus;

    try {
      const vercelDomain = await verifyProjectDomain(domain);
      const dns = await checkVercelDomainDns(domain);
      customDomain = customDomainStatusFromVercel(domain, vercelDomain, dns);
    } catch (error) {
      customDomain = domainErrorStatus(domain, error);
    }

    const hosting = {
      ...mockHosting.updateCustomDomain(customDomain),
      mode: "hosted_platform" as const,
      customDomain
    };
    const receizRecord = await recordReceizHostingEvent(accessToken, "hosting.custom_domain.verified", {
      domain,
      customDomain
    });
    const storeStateSync = customDomainCanServeStorefront(customDomain)
      ? await syncPublishedStoreStateForHosting({
          accessToken,
          submittedState: isRecord(body) ? body.state : null,
          hosting,
          merchantAuthority
        })
      : {
          ok: true as const,
          skipped: true as const,
          reason: "domain_not_live"
        };

    return NextResponse.json({ ok: true, action, hosting, receizRecord, storeStateSync });
  }

  if (action === "publish") {
    const merchantAuthority = await requireMerchantAuthority(
      accessToken,
      "publish",
      returnTo,
      isRecord(body) ? body.merchantProof ?? body.merchantSession ?? body.state : null
    );
    if (!merchantAuthority.ok) return merchantAuthority.response;
    const publishOwner = merchantAuthority.profile;
    const submittedHosting = {
      ...(isRecord(body.state) && isRecord(body.state.hosting) ? body.state.hosting : mockHosting.getHostingStatus()),
      published: true,
      lastPublishedAt: "now"
    };
    const state = buildPublishedCommerceState(mockStorage.getState(), {
      ...(isRecord(body.state) ? body.state : {}),
      hosting: submittedHosting
    }, {
      customDomain: publishOwner?.customDomain,
      displayName: publishOwner?.name ?? merchantAuthority.localIdentity.displayName,
      merchantReceizId: publishOwner?.handle ?? merchantAuthority.handle,
      tenantSlug: publishOwner?.subdomain
    });
    const actorReceizId = state.hosting.merchantReceizId || state.auth.receizId.handle;
    const tenantHost = state.hosting.customDomain.domain || state.hosting.subdomain;
    let publishState = state;

    if (accessToken) {
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
          { status: 502 }
        );
      }
    }

    const storeStateRecord = buildStoreStateRecord(publishState, {
      actorReceizId,
      tenantHost,
      reason: "publish"
    });
    const proofStore = await getServerProofStateStore(storeStateRecord.merchantReceizId);
    const storeStateReceizRecord = await publishAndAdmitReceizStoreState({
      accessToken,
      record: storeStateRecord,
      proofStore,
      proof: {
        keyFile: merchantAuthority.localIdentity.keyFile,
        passphrase: merchantAuthority.localIdentity.passphrase
      }
    });
    const storeStateSyncOk = receizStoreStateWriteSucceeded(storeStateReceizRecord);
    const storeStateSynced = receizStoreStateSyncCompleted(storeStateReceizRecord);
    const summarizedStoreStateRecord = summarizeStoreStateRecord(storeStateRecord);
    const summarizedStoreStateReceizRecord = summarizeReceizStoreStatePublicationResult(storeStateReceizRecord);
    let storeStateSyncWarning: string | undefined;

    if (!storeStateSyncOk) {
      const error = isRecord(storeStateReceizRecord) ? String(storeStateReceizRecord.error ?? "receiz_store_state_record_failed") : "receiz_store_state_record_failed";

      console.error("[publish] Receiz store-state record failed", {
        tenantHost: storeStateRecord.tenantHost,
        merchantReceizId: storeStateRecord.merchantReceizId,
        storeStateRecordId: storeStateRecord.id,
        error
      });
      storeStateSyncWarning = publicStoreWriteFailureMessage(error);
    } else if (!storeStateSynced) {
      storeStateSyncWarning = "Receiz public-store sync is pending; the proof object was admitted locally first.";
    }

    console.info("[publish] Receiz store-state record written", {
      tenantHost: storeStateRecord.tenantHost,
      merchantReceizId: storeStateRecord.merchantReceizId,
      storeStateRecordId: storeStateRecord.id
    });

    const receizRecord = await recordReceizHostingEvent(accessToken, "store.published", {
      hosting: publishState.hosting,
      storeStateRecordId: storeStateRecord.id
    });

    return NextResponse.json({
      ok: true,
      action,
      hosting: publishState.hosting,
      state: accessToken ? publishState : { hosting: publishState.hosting },
      storeStateRecord: summarizedStoreStateRecord,
      storeStateReceizRecord: summarizedStoreStateReceizRecord,
      storeStateSync: {
        ok: storeStateSyncOk,
        synced: storeStateSynced,
        warning: storeStateSyncWarning,
        result: summarizedStoreStateReceizRecord
      },
      receizRecord,
      proofMemory: {
        knownHead: proofStore.knownHead(100),
        entries: proofStore.snapshot().head.count
      }
    });
  }

  let tenantSlug = "";
  try {
    tenantSlug = normalizeTenantSlug(String(body.subdomain ?? platform.defaultSubdomain));
  } catch (error) {
    return badRequest(error);
  }
  const subdomain = subdomainForSlug(tenantSlug);
  let subdomainStatus: DomainStatus;

  try {
    const wildcard = await addProjectDomain(`*.${platform.domain}`);
    subdomainStatus = wildcardDomainStatusFromVercel(subdomain, wildcard);
    const dns = await checkPublicDns(subdomain);

    if (!dns.resolved) {
      subdomainStatus = {
        ...subdomainStatus,
        status: "needs_dns",
        sslStatus: "pending",
        dnsResolved: false,
        dnsInstructions: [
          `Add DNS record: *.${platform.domain} CNAME ${process.env.VERCEL_CNAME_TARGET ?? "cname.vercel-dns-0.com"}`,
          "Wait for DNS propagation, then claim the subdomain again.",
          ...(subdomainStatus.dnsInstructions ?? [])
        ],
        message: `Wildcard domain is verified in Vercel, but ${subdomain} does not resolve in public DNS yet`
      };
    } else {
      subdomainStatus = {
        ...subdomainStatus,
        dnsResolved: true
      };
    }
  } catch (error) {
    subdomainStatus = domainErrorStatus(subdomain, error);
  }

  const hosting = {
    ...mockHosting.claimSubdomain(subdomain),
    mode: "hosted_platform" as const,
    tenantSlug,
    subdomain,
    subdomainStatus,
    liveUrl: `https://${subdomain}`
  };
  const receizRecord = await recordReceizHostingEvent(accessToken, "hosting.subdomain.claimed", {
    tenantSlug,
    subdomain,
    subdomainStatus
  });

  return NextResponse.json({ ok: true, action, hosting, receizRecord });
}
