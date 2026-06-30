"use client";

import { useEffect, useMemo, useState } from "react";
import { createReceizClient, type ReceizIdentityAccountProjection } from "@receiz/sdk";
import { seedCommerceState } from "@/data/seed";
import type { CommerceState, ProofEvent } from "@/types/domain";
import { makeId } from "@/lib/utils";

const STORAGE_KEY = "receiz-app-commerce-state-v1";

function readState(): CommerceState {
  if (typeof window === "undefined") return seedCommerceState;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedCommerceState;

  try {
    return JSON.parse(raw) as CommerceState;
  } catch {
    return seedCommerceState;
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
      claimSubdomain(subdomain: string) {
        setState((current) => ({
          ...current,
          hosting: { ...current.hosting, subdomain },
          proofEvents: [makeEvent("DOMAIN_CONNECTED", `${subdomain} active`), ...current.proofEvents]
        }));
      },
      connectCustomDomain(domain: string) {
        setState((current) => ({
          ...current,
          hosting: {
            ...current.hosting,
            customDomain: {
              domain,
              status: "connected",
              sslStatus: "valid"
            }
          },
          proofEvents: [makeEvent("DOMAIN_CONNECTED", `${domain} connected`), ...current.proofEvents]
        }));
      },
      selectHostingPlan(plan: CommerceState["hosting"]["plan"]) {
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
      },
      addBillingMethod(label: string) {
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
      },
      signInWithReceizId() {
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
        setState((current) => ({
          ...current,
          hosting: { ...current.hosting, published: true, lastPublishedAt: "now" },
          proofEvents: [makeEvent("SITE_PUBLISHED", `${current.hosting.subdomain} published`), ...current.proofEvents]
        }));
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
