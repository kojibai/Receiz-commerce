"use client";

import { useEffect, useMemo, useState } from "react";
import { createReceizClient, type ReceizIdentityAccountProjection } from "@receiz/sdk";
import { seedCommerceState } from "@/data/seed";
import {
  cleanHost,
  isPlatformHost,
  normalizeCustomDomain,
  normalizeTenantSlug,
  subdomainForSlug,
  tenantSlugFromHost
} from "@/lib/hosting/domain-utils";
import type { CommerceState, ProofEvent } from "@/types/domain";
import { makeId } from "@/lib/utils";

const STORAGE_KEY = "receiz-app-commerce-state-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeObject<T extends Record<string, unknown>>(base: T, value: unknown): T {
  return isRecord(value) ? ({ ...base, ...value } as T) : base;
}

function mergeArray<T>(base: T[], value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : base;
}

function safeTenantSlug(value: unknown) {
  try {
    return normalizeTenantSlug(typeof value === "string" ? value : seedCommerceState.hosting.subdomain);
  } catch {
    return seedCommerceState.hosting.tenantSlug;
  }
}

function migrateStoredState(value: unknown): CommerceState {
  if (!isRecord(value)) return seedCommerceState;

  const base = seedCommerceState;
  const stored = value as Partial<CommerceState>;
  const storedHosting = (isRecord(stored.hosting) ? stored.hosting : {}) as Partial<CommerceState["hosting"]>;
  const tenantSlug = safeTenantSlug(storedHosting.tenantSlug ?? storedHosting.subdomain);
  const subdomain =
    typeof storedHosting.subdomain === "string" && storedHosting.subdomain.includes(".")
      ? storedHosting.subdomain
      : subdomainForSlug(tenantSlug);
  const liveUrl = typeof storedHosting.liveUrl === "string" ? storedHosting.liveUrl : `https://${subdomain}`;
  const receizId = mergeObject(base.auth.receizId, isRecord(stored.auth) ? stored.auth.receizId : undefined);
  const merchantReceizId =
    typeof storedHosting.merchantReceizId === "string"
      ? storedHosting.merchantReceizId
      : receizId.handle || base.hosting.merchantReceizId;

  return {
    ...base,
    ...stored,
    brand: mergeObject(base.brand, stored.brand),
    storefront: mergeObject(base.storefront, stored.storefront),
    hosting: {
      ...base.hosting,
      ...storedHosting,
      tenantSlug,
      subdomain,
      liveUrl,
      merchantReceizId,
      settlementAccountLabel:
        typeof storedHosting.settlementAccountLabel === "string"
          ? storedHosting.settlementAccountLabel
          : base.hosting.settlementAccountLabel,
      subdomainStatus: {
        ...base.hosting.subdomainStatus,
        ...(isRecord(storedHosting.subdomainStatus) ? storedHosting.subdomainStatus : {}),
        domain: subdomain,
        liveUrl
      },
      customDomain: {
        ...base.hosting.customDomain,
        ...(isRecord(storedHosting.customDomain) ? storedHosting.customDomain : {})
      }
    },
    billing: {
      ...mergeObject(base.billing, stored.billing),
      plans: mergeArray(base.billing.plans, isRecord(stored.billing) ? stored.billing.plans : undefined),
      invoices: mergeArray(base.billing.invoices, isRecord(stored.billing) ? stored.billing.invoices : undefined)
    },
    navigation: mergeArray(base.navigation, stored.navigation),
    pages: mergeArray(base.pages, stored.pages),
    collections: mergeArray(base.collections, stored.collections),
    products: mergeArray(base.products, stored.products),
    cart: {
      ...mergeObject(base.cart, stored.cart),
      lines: mergeArray(base.cart.lines, isRecord(stored.cart) ? stored.cart.lines : undefined)
    },
    orders: mergeArray(base.orders, stored.orders),
    customers: mergeArray(base.customers, stored.customers),
    rewards: mergeArray(base.rewards, stored.rewards),
    rewardRules: mergeArray(base.rewardRules, stored.rewardRules),
    assets: mergeArray(base.assets, stored.assets),
    listings: mergeArray(base.listings, stored.listings),
    qualifiers: mergeArray(base.qualifiers, stored.qualifiers),
    campaigns: mergeArray(base.campaigns, stored.campaigns),
    game: mergeObject(base.game, stored.game),
    receiz: mergeObject(base.receiz, stored.receiz),
    checkout: mergeObject(base.checkout, stored.checkout),
    auth: {
      ...base.auth,
      ...(isRecord(stored.auth) ? stored.auth : {}),
      admin: mergeObject(base.auth.admin, isRecord(stored.auth) ? stored.auth.admin : undefined),
      customer: mergeObject(base.auth.customer, isRecord(stored.auth) ? stored.auth.customer : undefined),
      receizId
    },
    publish: {
      ...mergeObject(base.publish, stored.publish),
      checklist: mergeArray(base.publish.checklist, isRecord(stored.publish) ? stored.publish.checklist : undefined)
    },
    proofEvents: mergeArray(base.proofEvents, stored.proofEvents)
  };
}

function applyHostContext(state: CommerceState): CommerceState {
  if (typeof window === "undefined") return state;

  const host = cleanHost(window.location.host);
  const tenantSlug = tenantSlugFromHost(host);

  if (tenantSlug) {
    const subdomain = subdomainForSlug(tenantSlug);
    return {
      ...state,
      hosting: {
        ...state.hosting,
        tenantSlug,
        subdomain,
        liveUrl: `https://${subdomain}`,
        subdomainStatus: {
          ...state.hosting.subdomainStatus,
          domain: subdomain,
          liveUrl: `https://${subdomain}`,
          status: "active",
          sslStatus: "valid",
          verified: true,
          message: "Loaded from hosted subdomain"
        }
      }
    };
  }

  if (host && !isPlatformHost(host)) {
    return {
      ...state,
      hosting: {
        ...state.hosting,
        liveUrl: `https://${host}`,
        customDomain: {
          ...state.hosting.customDomain,
          domain: host,
          liveUrl: `https://${host}`,
          status: "active",
          sslStatus: "valid",
          verified: true,
          message: "Loaded from custom domain"
        }
      }
    };
  }

  return state;
}

function readState(): CommerceState {
  if (typeof window === "undefined") return seedCommerceState;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return applyHostContext(seedCommerceState);

  try {
    return applyHostContext(migrateStoredState(JSON.parse(raw)));
  } catch {
    return applyHostContext(seedCommerceState);
  }
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

function identityArtifactKind(file: File): CommerceState["auth"]["receizId"]["artifactKind"] {
  const name = file.name.toLowerCase();

  if (name.includes("record")) return "identity_record";
  if (file.type.startsWith("image/")) return "identity_seal";
  if (name.includes("receiz-id")) return "receiz_id";

  return "receiz_key";
}

function accountHandle(projection: ReceizIdentityAccountProjection | null, fallback: string) {
  const username = projection?.owner.username?.trim();
  if (!username) return fallback;
  return username.includes(".") ? username : `${username}.receiz.id`;
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));

  if (response.status === 401 && typeof payload.connectUrl === "string") {
    window.location.assign(payload.connectUrl);
    throw new Error("Receiz login required");
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

export function useTemplateStore() {
  const [state, setState] = useState<CommerceState>(seedCommerceState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [hydrated, state]);

  const actions = useMemo(
    () => ({
      reset() {
        setState(seedCommerceState);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
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
          window.location.assign(`/api/auth/receiz/start?returnTo=${encodeURIComponent(returnTo)}`);
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
      createReceizId() {
        setState((current) => {
          const handle = `${current.brand.logoText.toLowerCase().replace(/[^a-z0-9]+/g, "") || "brand"}.receiz.id`;
          return {
            ...current,
            auth: {
              ...current.auth,
              receizId: {
                ...current.auth.receizId,
                connected: true,
                handle,
                displayName: current.brand.name,
                loginMode: "new_receiz_id",
                statusLabel: "New Receiz ID created"
              }
            },
            proofEvents: [
              makeEvent("RECEIZ_ID_CONNECTED", `${handle} created`),
              ...current.proofEvents
            ]
          };
        });
      },
      async restoreReceizIdentityArtifact(file: File) {
        const client = createReceizClient();
        let projection: ReceizIdentityAccountProjection | null = null;
        let failed = false;

        try {
          const keyFile = await client.identity.readArtifact(file);
          projection = await client.identity.projectAccount(keyFile);
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

          return {
            ...current,
            auth: {
              ...current.auth,
              receizId: {
                ...current.auth.receizId,
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
      publish() {
        setState((current) => {
          const next = {
            ...current,
            hosting: { ...current.hosting, published: true, lastPublishedAt: "now" },
            proofEvents: [makeEvent("SITE_PUBLISHED", `${current.hosting.subdomain} published`), ...current.proofEvents]
          };

          void postJson<{ hosting: CommerceState["hosting"] }>("/api/hosting", {
            action: "publish",
            state: {
              brand: next.brand,
              storefront: next.storefront,
              hosting: next.hosting,
              products: next.products,
              rewards: next.rewards,
              rewardRules: next.rewardRules,
              campaigns: next.campaigns,
              game: next.game,
              checkout: next.checkout
            }
          })
            .then((result) => {
              setState((latest) => ({
                ...latest,
                hosting: result.hosting,
                proofEvents: [makeEvent("SITE_PUBLISHED", "Store published to Receiz proof rails"), ...latest.proofEvents]
              }));
            })
            .catch((error) => {
              setState((latest) => ({
                ...latest,
                proofEvents: [
                  makeEvent("SITE_PUBLISHED", error instanceof Error ? error.message : "Publish sync failed"),
                  ...latest.proofEvents
                ]
              }));
            });

          return next;
        });
      },
      addToCart(productId: string) {
        setState((current) => {
          const existing = current.cart.lines.find((line) => line.productId === productId);
          return {
            ...current,
            cart: {
              lines: existing
                ? current.cart.lines.map((line) =>
                    line.productId === productId
                      ? { ...line, quantity: line.quantity + 1 }
                      : line
                  )
                : [...current.cart.lines, { productId, quantity: 1 }]
            }
          };
        });
      },
      completeMockCheckout() {
        setState((current) => {
          const order = {
            id: `${Math.floor(10000 + Math.random() * 89999)}`,
            customerId: current.auth.customer.id,
            totalLabel: "$18.00",
            status: "mock_paid" as const,
            itemCount: Math.max(1, current.cart.lines.length),
            sealed: true,
            createdAt: new Date().toISOString()
          };

          return {
            ...current,
            cart: { lines: [] },
            orders: [order, ...current.orders],
            proofEvents: [makeEvent("ORDER_VERIFIED", `Order #${order.id} sealed`), ...current.proofEvents]
          };
        });
      },
      startCheckout() {
        setState((current) => {
          const checkoutMode = process.env.NEXT_PUBLIC_CHECKOUT_MODE ?? current.checkout.mode;

          if (checkoutMode === "mock") {
            const order = {
              id: `${Math.floor(10000 + Math.random() * 89999)}`,
              customerId: current.auth.customer.id,
              totalLabel: `$${cartAmountUsd(current)}`,
              status: "mock_paid" as const,
              itemCount: Math.max(1, current.cart.lines.length),
              sealed: true,
              createdAt: new Date().toISOString()
            };

            return {
              ...current,
              cart: { lines: [] },
              orders: [order, ...current.orders],
              proofEvents: [makeEvent("ORDER_VERIFIED", `Order #${order.id} sealed`), ...current.proofEvents]
            };
          }

          void postJson<{
            session?: {
              checkoutUrl?: string;
              checkoutSessionId?: string;
              clientSecret?: string;
            };
          }>("/api/checkout", {
            amountUsd: cartAmountUsd(current),
            totalLabel: `$${cartAmountUsd(current)}`,
            itemCount: Math.max(1, current.cart.lines.length),
            customerId: current.auth.customer.id,
            customerEmail: current.auth.customer.email,
            referenceId: `order-${Date.now()}`,
            description: `${current.brand.name} proof-sealed order`,
            tenantSlug: current.hosting.tenantSlug,
            tenantHost: current.hosting.subdomain,
            merchantReceizId: current.hosting.merchantReceizId,
            successUrl: `${window.location.origin}/?checkout=success`,
            cancelUrl: `${window.location.origin}/?checkout=cancel`
          })
            .then((result) => {
              if (result.session?.checkoutUrl) {
                window.location.assign(result.session.checkoutUrl);
                return;
              }

              setState((latest) => ({
                ...latest,
                proofEvents: [
                  makeEvent("ORDER_VERIFIED", `Receiz checkout ${result.session?.checkoutSessionId ?? "session"} ready`),
                  ...latest.proofEvents
                ]
              }));
            })
            .catch((error) => {
              setState((latest) => ({
                ...latest,
                proofEvents: [
                  makeEvent("ORDER_VERIFIED", error instanceof Error ? error.message : "Receiz checkout failed"),
                  ...latest.proofEvents
                ]
              }));
            });

          return current;
        });
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

  return { state, actions, hydrated };
}
