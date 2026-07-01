import type { CommerceState } from "@/types/domain";

export type LaunchReadinessCategoryId =
  | "developer_sdk"
  | "no_code_setup"
  | "receiz_identity"
  | "catalog"
  | "checkout"
  | "domains"
  | "production_ops";

export type LaunchReadinessCheck = {
  id: string;
  label: string;
  complete: boolean;
  critical?: boolean;
  actionLabel: string;
};

export type LaunchReadinessCategory = {
  id: LaunchReadinessCategoryId;
  label: string;
  score: number;
  status: "ready" | "action_needed" | "blocked";
  summary: string;
  actionLabel: string;
  checks: LaunchReadinessCheck[];
};

export type LaunchReadinessBlocker = {
  id: string;
  label: string;
  categoryId: LaunchReadinessCategoryId;
  actionLabel: string;
};

export type LaunchReadinessAudience = {
  id: "merchant" | "developer";
  label: string;
  summary: string;
};

export type LaunchGuideStep = {
  id: "receiz_id" | "brand" | "catalog" | "content" | "rewards" | "checkout" | "domains" | "publish";
  title: string;
  description: string;
  actionLabel: string;
  categoryId: LaunchReadinessCategoryId;
  complete: boolean;
  status: "done" | "current" | "queued";
};

export type LaunchReadiness = {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D";
  status: "elite_ready" | "nearly_ready" | "needs_work";
  summary: string;
  audiences: LaunchReadinessAudience[];
  categories: LaunchReadinessCategory[];
  blockers: LaunchReadinessBlocker[];
  launchGuide: LaunchGuideStep[];
  nextActions: string[];
  sdkRails: string[];
};

function scoreChecks(checks: LaunchReadinessCheck[]) {
  if (checks.length === 0) return 0;

  return Math.round((checks.filter((check) => check.complete).length / checks.length) * 100);
}

function statusForChecks(checks: LaunchReadinessCheck[]): LaunchReadinessCategory["status"] {
  if (checks.some((check) => check.critical && !check.complete)) return "blocked";
  if (checks.some((check) => !check.complete)) return "action_needed";
  return "ready";
}

function firstAction(checks: LaunchReadinessCheck[], fallback: string) {
  return checks.find((check) => !check.complete)?.actionLabel ?? fallback;
}

function category(input: {
  id: LaunchReadinessCategoryId;
  label: string;
  summary: string;
  checks: LaunchReadinessCheck[];
  readyAction: string;
}): LaunchReadinessCategory {
  return {
    id: input.id,
    label: input.label,
    score: scoreChecks(input.checks),
    status: statusForChecks(input.checks),
    summary: input.summary,
    actionLabel: firstAction(input.checks, input.readyAction),
    checks: input.checks
  };
}

function checklistComplete(state: CommerceState, id: string) {
  return Boolean(state.publish.checklist.find((item) => item.id === id)?.complete);
}

function publishedContentCount(state: CommerceState) {
  return (
    state.pages.filter((page) => page.published).length +
    state.blogPosts.filter((post) => post.status === "published").length
  );
}

function hasLiveDomain(state: CommerceState) {
  return Boolean(
    state.hosting.subdomainStatus.verified ||
      state.hosting.subdomainStatus.status === "active" ||
      state.hosting.subdomainStatus.status === "ready"
  );
}

function hasCustomDomain(state: CommerceState) {
  return Boolean(
    state.hosting.customDomain.domain &&
      (state.hosting.customDomain.verified ||
        state.hosting.customDomain.status === "active" ||
        state.hosting.customDomain.status === "ready")
  );
}

function hasReceizIdentityRail(state: CommerceState) {
  return Boolean(
    state.receiz.connected &&
      state.auth.receizId.handle &&
      state.auth.receizId.localProofVerified &&
      state.auth.receizId.sdkHelpers.length >= 5
  );
}

function gradeForScore(score: number): LaunchReadiness["grade"] {
  if (score >= 100) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
}

function statusForScore(score: number, blockers: LaunchReadinessBlocker[]): LaunchReadiness["status"] {
  if (score >= 100 && blockers.length === 0) return "elite_ready";
  if (score >= 90 && blockers.length === 0) return "nearly_ready";
  return "needs_work";
}

function summaryForReadiness(score: number, blockers: LaunchReadinessBlocker[]) {
  if (score >= 100 && blockers.length === 0) {
    return "Ready for a developer clone and a no-code merchant launch path.";
  }

  if (blockers.length === 0) {
    return "Production path is mostly ready; finish the remaining quality gates before launch.";
  }

  return `${blockers.length} critical launch gate${blockers.length === 1 ? "" : "s"} need attention.`;
}

function nextActionsFor(categories: LaunchReadinessCategory[], blockers: LaunchReadinessBlocker[]) {
  if (blockers.length > 0) {
    return blockers.slice(0, 4).map((blocker) => blocker.actionLabel);
  }

  const actions = categories
    .flatMap((item) => item.checks)
    .filter((check) => !check.complete)
    .map((check) => check.actionLabel);

  return actions.length > 0
    ? actions.slice(0, 4)
    : [
        "Run pnpm release:check before production deploy.",
        "Publish the store-state record through Receiz after merchant edits."
      ];
}

function launchGuideStep(input: Omit<LaunchGuideStep, "status">): Omit<LaunchGuideStep, "status"> {
  return input;
}

function buildLaunchGuide(state: CommerceState): LaunchGuideStep[] {
  const brandReady = checklistComplete(state, "brand") && Boolean(state.brand.name && state.brand.logoText);
  const catalogReady =
    state.products.some((product) => product.status === "active") &&
    state.collections.some((collection) => collection.published);
  const contentReady = checklistComplete(state, "pages") && publishedContentCount(state) > 0;
  const rewardsReady = checklistComplete(state, "rewards") && state.rewardRules.some((rule) => rule.active);
  const checkoutReady = checklistComplete(state, "checkout") && state.checkout.mode === "live";
  const domainsReady = hasLiveDomain(state) && hasCustomDomain(state);
  const publishReady = state.hosting.published && Boolean(state.hosting.lastPublishedAt);

  const steps = [
    launchGuideStep({
      id: "receiz_id",
      title: "Sign in with Receiz ID",
      description: "Connect the merchant owner before checkout, domains, proof, and publish actions.",
      actionLabel: "Open Receiz ID",
      categoryId: "receiz_identity",
      complete: hasReceizIdentityRail(state)
    }),
    launchGuideStep({
      id: "brand",
      title: "Set brand and storefront copy",
      description: "Finish the name, logo, colors, headline, and public storefront message.",
      actionLabel: "Open Brand",
      categoryId: "no_code_setup",
      complete: brandReady
    }),
    launchGuideStep({
      id: "catalog",
      title: "Add products and collections",
      description: "Add active products, publish a collection, and seal at least one product.",
      actionLabel: "Open Product builder",
      categoryId: "catalog",
      complete: catalogReady
    }),
    launchGuideStep({
      id: "content",
      title: "Publish pages or stories",
      description: "Publish system pages, navigation, and at least one story or page.",
      actionLabel: "Open Content builder",
      categoryId: "no_code_setup",
      complete: contentReady
    }),
    launchGuideStep({
      id: "rewards",
      title: "Activate rewards",
      description: "Create customer rewards so purchases, claims, and perks have a live path.",
      actionLabel: "Open Rewards",
      categoryId: "no_code_setup",
      complete: rewardsReady
    }),
    launchGuideStep({
      id: "checkout",
      title: "Enable checkout",
      description: "Use Receiz checkout with merchant settlement metadata and order projection.",
      actionLabel: "Open Checkout mode",
      categoryId: "checkout",
      complete: checkoutReady
    }),
    launchGuideStep({
      id: "domains",
      title: "Connect domains",
      description: "Verify the free Receiz subdomain and the merchant custom domain.",
      actionLabel: "Open Domains",
      categoryId: "domains",
      complete: domainsReady
    }),
    launchGuideStep({
      id: "publish",
      title: "Publish and verify",
      description: "Publish the Receiz store-state record, then verify the hosted storefront.",
      actionLabel: "Publish store",
      categoryId: "production_ops",
      complete: publishReady
    })
  ];
  const currentIndex = steps.findIndex((step) => !step.complete);

  return steps.map((step, index) => ({
    ...step,
    status: step.complete && (currentIndex === -1 || index < currentIndex)
      ? "done"
      : index === currentIndex
        ? "current"
        : "queued"
  }));
}

export function buildLaunchReadiness(state: CommerceState): LaunchReadiness {
  const categories = [
    category({
      id: "developer_sdk",
      label: "Developer SDK clone",
      summary: "A forked developer can see the SDK boundary, scopes, diagnostics, and proof rails.",
      readyAction: "Keep SDK docs and doctor output current.",
      checks: [
        {
          id: "sdk_scope_map",
          label: "Full SDK scope map configured",
          complete: true,
          actionLabel: "Keep src/lib/receiz/oauth-scopes.ts aligned with Receiz doctor."
        },
        {
          id: "adapter_boundary",
          label: "Receiz adapter boundary exposes production rails",
          complete: true,
          actionLabel: "Use src/lib/receiz/adapter.ts for new Receiz SDK calls."
        },
        {
          id: "doctor_script",
          label: "SDK doctor command is available",
          complete: true,
          actionLabel: "Run pnpm receiz:doctor before release."
        }
      ]
    }),
    category({
      id: "no_code_setup",
      label: "No-code business setup",
      summary: "A non-coder can shape brand, pages, products, rewards, and publishing from admin.",
      readyAction: "Use the admin studio to customize the business.",
      checks: [
        {
          id: "brand",
          label: "Brand settings are complete",
          complete: checklistComplete(state, "brand") && Boolean(state.brand.name && state.brand.logoText),
          critical: true,
          actionLabel: "Open Brand and finish name, logo, colors, and storefront copy."
        },
        {
          id: "pages",
          label: "Pages and navigation are publishable",
          complete: checklistComplete(state, "pages") && publishedContentCount(state) > 0,
          actionLabel: "Open Store and publish at least one page or story."
        },
        {
          id: "rewards",
          label: "Rewards rules are configured",
          complete: checklistComplete(state, "rewards") && state.rewardRules.some((rule) => rule.active),
          actionLabel: "Open Rewards and activate at least one customer reward."
        }
      ]
    }),
    category({
      id: "receiz_identity",
      label: "Receiz identity and proof",
      summary: "Receiz ID, local proof restore, proof events, and sealed settings are present.",
      readyAction: "Keep Receiz ID and proof settings verified.",
      checks: [
        {
          id: "receiz_identity",
          label: "Receiz rail and identity proof are configured",
          complete: hasReceizIdentityRail(state),
          critical: true,
          actionLabel: "Connect or restore the merchant Receiz ID before publishing."
        },
        {
          id: "proof_events",
          label: "Proof events are visible",
          complete: state.proofEvents.length > 0,
          actionLabel: "Seal at least one product, reward, order, or asset."
        },
        {
          id: "seal_settings",
          label: "Seal settings are checked",
          complete: checklistComplete(state, "receiz"),
          actionLabel: "Open Receiz seal settings and confirm verification rules."
        }
      ]
    }),
    category({
      id: "catalog",
      label: "Catalog and content",
      summary: "Products, collections, and storefront content can support a real business launch.",
      readyAction: "Keep catalog and content fresh before every launch.",
      checks: [
        {
          id: "catalog",
          label: "Active products exist",
          complete: state.products.some((product) => product.status === "active"),
          critical: true,
          actionLabel: "Add at least one active product."
        },
        {
          id: "collections",
          label: "Collections are published",
          complete: state.collections.some((collection) => collection.published),
          actionLabel: "Create a published collection for the storefront."
        },
        {
          id: "sealed_products",
          label: "Products can carry Receiz proof",
          complete: state.products.some((product) => product.sealed),
          actionLabel: "Seal at least one product to demonstrate proof commerce."
        }
      ]
    }),
    category({
      id: "checkout",
      label: "Checkout and settlement",
      summary: "Checkout mode, payment rail, settlement metadata, and order projection are ready.",
      readyAction: "Run a checkout test before launch.",
      checks: [
        {
          id: "checkout_live",
          label: "Checkout configuration is complete",
          complete: checklistComplete(state, "checkout") && state.checkout.mode === "live",
          critical: true,
          actionLabel: "Open Checkout mode and switch to Receiz checkout."
        },
        {
          id: "merchant_settlement",
          label: "Merchant settlement identity exists",
          complete: Boolean(state.hosting.merchantReceizId && state.hosting.settlementAccountLabel),
          actionLabel: "Set the merchant Receiz ID and settlement account."
        },
        {
          id: "orders",
          label: "Orders project into admin",
          complete: state.orders.length > 0,
          actionLabel: "Run a test checkout so orders and fulfillment appear in admin."
        }
      ]
    }),
    category({
      id: "domains",
      label: "Hosting and domains",
      summary: "The free subdomain path and paid custom-domain path are both represented.",
      readyAction: "Verify DNS before public launch.",
      checks: [
        {
          id: "subdomain",
          label: "Free subdomain is live",
          complete: hasLiveDomain(state),
          critical: true,
          actionLabel: "Claim a Receiz-hosted subdomain."
        },
        {
          id: "custom_domain",
          label: "Custom domain upgrade is verified",
          complete: hasCustomDomain(state),
          critical: true,
          actionLabel: "Connect and verify the merchant custom domain."
        },
        {
          id: "hosting_plan",
          label: "Hosting plan is selected",
          complete: Boolean(state.hosting.plan && state.billing.monthlyTotalLabel),
          actionLabel: "Choose a hosting plan for the merchant."
        }
      ]
    }),
    category({
      id: "production_ops",
      label: "Production operations",
      summary: "Publish state, recovery, PWA safety, and isolated release checks are visible before launch.",
      readyAction: "Run pnpm release:check before deploy.",
      checks: [
        {
          id: "publish",
          label: "Store has been published",
          complete: state.hosting.published && Boolean(state.hosting.lastPublishedAt),
          critical: true,
          actionLabel: "Publish the store-state record through Receiz."
        },
        {
          id: "pwa_safe",
          label: "Online-only sensitive actions are protected",
          complete: true,
          actionLabel: "Keep checkout, auth, hosting, and proof writes network-only."
        },
        {
          id: "release_checks",
          label: "Isolated release check is documented",
          complete: true,
          actionLabel: "Run pnpm release:check before deploy."
        }
      ]
    })
  ];
  const blockers = categories.flatMap((item) =>
    item.checks
      .filter((check) => check.critical && !check.complete)
      .map((check) => ({
        id: check.id,
        label: check.label,
        categoryId: item.id,
        actionLabel: check.actionLabel
      }))
  );
  const score = Math.round(
    categories.reduce((total, item) => total + item.score, 0) / categories.length
  );

  return {
    score,
    grade: gradeForScore(score),
    status: statusForScore(score, blockers),
    summary: summaryForReadiness(score, blockers),
    audiences: [
      {
        id: "merchant",
        label: "No-code merchant",
        summary: "Build a real storefront with buttons for brand, catalog, rewards, domains, Receiz ID, checkout, and publish."
      },
      {
        id: "developer",
        label: "Developer clone",
        summary: "Fork the app and use the @receiz/sdk adapter, doctor, scopes, public-store publish, and app-state recovery rails."
      }
    ],
    categories,
    blockers,
    launchGuide: buildLaunchGuide(state),
    nextActions: nextActionsFor(categories, blockers),
    sdkRails: [
      "identity.ensureTenantSession",
      "publicStore.resolve",
      "publicStore.publish",
      "appState.byUrl",
      "doctor/capabilities/required_scopes",
      "wallet/action ledger",
      "sandbox helpers"
    ]
  };
}
