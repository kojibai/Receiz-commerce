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
import { buildPublishedCommerceState } from "@/lib/hosting/published-state";
import { hostingBillingFromPlatformPayment } from "@/lib/hosting/platform-billing";
import { proofObjectCheckoutFunding } from "@/lib/checkout/wallet-authority";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { buildStoreStateRecord } from "@/lib/receiz/proof-state";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { publishReceizStoreState } from "@/lib/receiz/store-state-publication";
import { receizAccessTokenFromRequest, receizAuthorityRequired } from "@/lib/receiz/session";
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

function receizWriteSucceeded(result: unknown) {
  return !(isRecord(result) && result.ok === false);
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

function amountForPlan(plan: HostingConfig["plan"]) {
  if (plan === "starter") return "0.00";
  if (plan === "scale") return process.env.RECEIZ_SCALE_PLAN_USD ?? "199.00";
  return process.env.RECEIZ_PRO_PLAN_USD ?? "49.00";
}

function isPositiveAmount(amountUsd: string) {
  return Number(amountUsd) > 0;
}

function centsFromAmountUsd(amountUsd: string) {
  const amount = Number(String(amountUsd).replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
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
    authorizedByProofObject?: boolean;
  }
) {
  const liveBilling = process.env.RECEIZ_PLATFORM_BILLING_MODE === "live";

  if (!liveBilling || !isPositiveAmount(input.amountUsd)) {
    const noCharge = liveBilling && !isPositiveAmount(input.amountUsd);
    return {
      ok: true,
      mode: noCharge ? "no_charge" : "sandbox",
      amountUsd: input.amountUsd,
      paid: noCharge,
      message: liveBilling ? "No positive platform fee configured" : "Set RECEIZ_PLATFORM_BILLING_MODE=live to charge through Receiz"
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
    if (input.authorizedByProofObject) {
      const funding = proofObjectCheckoutFunding(centsFromAmountUsd(input.amountUsd));
      return {
        ok: true,
        mode: "proof_object_wallet_first",
        amountUsd: input.amountUsd,
        paid: !funding.cardRequired,
        funding,
        paymentRails: {
          preferred: "receiz_wallet",
          fallback: "credit_card",
          settlement: "platform_receiz_reserve",
          recipientUserId
        },
        message: funding.cardRequired
          ? "Verified Receiz proof object authorized wallet-first platform billing; card funds the remaining delta."
          : "Verified Receiz proof object authorized platform settlement."
      };
    }

    return { ...receizAuthorityRequired("/admin"), status: 401 };
  }

  try {
    const receiz = createReceizCommerceAdapter({
      baseUrl: process.env.RECEIZ_BASE_URL,
      accessToken
    });
    const transfer = await receiz.connectTransfer(
      {
        recipientUserId,
        unit: "usd",
        amountUsd: input.amountUsd,
        note: input.note,
        clientNonce: input.idempotencyKey
      },
      input.idempotencyKey
    );

    return {
      ok: true,
      mode: "live",
      amountUsd: input.amountUsd,
      paid: true,
      transfer
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
  const accessToken = receizAccessTokenFromRequest(request);
  const returnTo = returnToFromRequest(request);

  if (action === "plan") {
    const plan = String(body.plan ?? "pro") as HostingConfig["plan"];
    if (!["starter", "pro", "scale"].includes(plan)) {
      return badRequest(new Error("Unknown hosting plan."));
    }
    const merchantAuthority = await requireMerchantAuthority(
      accessToken,
      "billing",
      returnTo,
      isRecord(body) ? body.merchantProof ?? body.merchantSession ?? body.state : null
    );
    if (!merchantAuthority.ok) return merchantAuthority.response;

    const platformBilling = await chargePlatformFee(merchantAuthority.source === "delegated_permission" ? accessToken : undefined, {
      amountUsd: amountForPlan(plan),
      note: `${platform.productName} ${plan} hosting plan`,
      idempotencyKey: `receiz-app:hosting-plan:${plan}`,
      authorizedByProofObject: merchantAuthority.source === "proof_object"
    });

    if (!platformBilling.ok) {
      const status = Number(platformBilling.status ?? 402);
      return NextResponse.json(platformBilling, { status });
    }

    const result = mockHosting.selectHostingPlan(plan);
    const billing = mockHosting.updateBilling(hostingBillingFromPlatformPayment(result.billing, plan, platformBilling));
    await recordReceizHostingEvent(accessToken, "hosting.plan.selected", {
      plan,
      platformBilling,
      hosting: result.hosting,
      billing
    });

    return NextResponse.json({ ok: true, action, platformBilling, ...result, billing });
  }

  if (action === "payment") {
    const merchantAuthority = await requireMerchantAuthority(
      accessToken,
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
      accessToken,
      "custom_domain",
      returnTo,
      isRecord(body) ? body.merchantProof ?? body.merchantSession ?? body.state : null
    );
    if (!merchantAuthority.ok) return merchantAuthority.response;

    const platformBilling = await chargePlatformFee(merchantAuthority.source === "delegated_permission" ? accessToken : undefined, {
      amountUsd: process.env.RECEIZ_CUSTOM_DOMAIN_SETUP_USD ?? "0.00",
      note: `${platform.productName} custom domain setup for ${domain}`,
      idempotencyKey: `receiz-app:custom-domain:${domain}`,
      authorizedByProofObject: merchantAuthority.source === "proof_object"
    });

    if (!platformBilling.ok) {
      const status = Number(platformBilling.status ?? 402);
      return NextResponse.json(platformBilling, { status });
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

    return NextResponse.json({ ok: true, action, hosting, platformBilling, receizRecord });
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

    return NextResponse.json({ ok: true, action, hosting, receizRecord });
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
    await proofStore.admitStoreRecord(storeStateRecord);
    const storeStateReceizRecord = await publishReceizStoreState(accessToken, storeStateRecord);

    if (!receizWriteSucceeded(storeStateReceizRecord)) {
      const error = isRecord(storeStateReceizRecord) ? String(storeStateReceizRecord.error ?? "receiz_store_state_record_failed") : "receiz_store_state_record_failed";

      console.error("[publish] Receiz store-state record failed", {
        tenantHost: storeStateRecord.tenantHost,
        merchantReceizId: storeStateRecord.merchantReceizId,
        storeStateRecordId: storeStateRecord.id,
        error
      });

      return NextResponse.json(
        {
          ok: false,
          error: "receiz_store_state_record_failed",
          message: error === "receiz_authority_required"
            ? "The proof object authorized publish locally, but the durable Receiz public-store write needs a valid server write rail before the live site can update cold-starts."
            : error,
          storeStateReceizRecord
        },
        { status: error === "receiz_authority_required" ? 401 : 502 }
      );
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
      state: publishState,
      storeStateRecord,
      storeStateReceizRecord,
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
