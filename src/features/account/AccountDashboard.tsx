"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import {
  MetricCard,
  OfficialReceizLoginButton,
  Panel,
  PoweredByReceizBadge,
  RewardCard,
  SealEventTimeline,
  SectionHeader,
  StatusPill
} from "@/components/ui";
import { brandThemeStyle } from "@/lib/theme";
import { useTemplateStore } from "@/lib/storage/use-template-store";
import { customerForAccountSurface, customerReceizHandle } from "@/lib/storefront/customer-session";
import { ProductCatalog } from "@/features/storefront/ProductCatalog";
import { platform } from "@/lib/platform";
import type { CommerceState } from "@/types/domain";
import type { HostContext } from "@/lib/hosting/host-context";

export function AccountDashboard({
  initialHostContext,
  initialState
}: {
  initialHostContext?: HostContext;
  initialState?: CommerceState;
}) {
  const { state, actions, hostContext } = useTemplateStore(initialState, initialHostContext);
  const tenantSurface = hostContext.surface === "tenant";
  const customer = customerForAccountSurface(state, tenantSurface);
  const receizHandle = customerReceizHandle(state, customer);
  const ownedAssets = state.assets.filter((asset) => customer.assetIds.includes(asset.id));
  const orders = state.orders.filter((order) => order.customerId === customer.id);
  const rewards = state.rewards.filter((reward) => customer.rewardIds.includes(reward.id));
  const shipping = customer.shippingAddress ?? orders.find((order) => order.shipping)?.shipping;
  const recentProofs = state.proofEvents.slice(0, 6);
  const storeHost = tenantSurface ? hostContext.tenantHost ?? state.hosting.liveUrl : state.hosting.liveUrl;
  const walletRailLabel = state.auth.receizId.connected ? "Receiz wallet ready" : "Sign in to use Receiz wallet";
  const checkoutFallbackLabel = "Credit card fallback";

  return (
    <main className="account-page" style={brandThemeStyle(state.brand)}>
      <header className="account-header">
        <Link className="kit-logo" href="/">
          <span className="receiz-mark">
            <Icons.receiz size={23} />
          </span>
          <strong>{tenantSurface ? state.brand.name : platform.name}</strong>
        </Link>
        <div>
          <StatusPill tone="green">{state.auth.receizId.statusLabel}</StatusPill>
          <Link className="button button-outline" href="/">
            Storefront
          </Link>
        </div>
      </header>

      <section className="account-hero panel">
        <div className="avatar large-avatar">{customer.name.slice(0, 1)}</div>
        <div>
          <h1>{customer.name}</h1>
          <p>{customer.email}</p>
          <div className="account-hero-pills">
            <StatusPill tone="green">{customer.tier}</StatusPill>
            <StatusPill tone={tenantSurface ? "neutral" : "gold"}>{storeHost}</StatusPill>
          </div>
          <span className="receiz-id-line">
            <Icons.receiz size={15} /> {receizHandle}
          </span>
          <PoweredByReceizBadge className="account-powered-by-receiz" />
        </div>
        <div className="account-hero-metrics">
          <MetricCard label="Rewards" value={customer.rewardsValueLabel} />
          <MetricCard label="Beans" value={String(customer.beans)} />
          <MetricCard label="Streak" value={customer.streak} />
        </div>
      </section>

      <div className="account-grid">
        <Panel>
          <SectionHeader title="Customer Receiz ID" action={<StatusPill tone="green">One click</StatusPill>} />
          <div className="identity-account-card">
            <span className="identity-icon">
              <Icons.receiz size={24} />
            </span>
            <div>
              <strong>{receizHandle}</strong>
              <p>
                Continue with Receiz ID for this store rewards, orders, benefits, and Receized assets.
              </p>
            </div>
          </div>
          <div className="customer-account-scope">
            <Icons.lock size={18} />
            <div>
              <strong>Store-scoped account</strong>
              <span>
                This profile, orders, rewards, and assets belong to {state.brand.name}. The same Receiz ID can sign in elsewhere without mixing store data.
              </span>
            </div>
          </div>
          <div className="identity-proof-strip account-proof-strip">
            <div>
              <span>Artifact</span>
              <strong>{state.auth.receizId.artifactKind.replace(/_/g, " ")}</strong>
            </div>
            <div>
              <span>Account proof</span>
              <strong>{state.auth.receizId.localProofVerified ? "Verified" : state.auth.receizId.portableStateStatus}</strong>
            </div>
          </div>
          {state.auth.receizId.connected ? null : (
            <div className="identity-actions">
              <OfficialReceizLoginButton onClick={actions.signInWithReceizId} />
            </div>
          )}
        </Panel>

        <Panel>
          <SectionHeader title="Checkout and wallet" action={<StatusPill tone={state.checkout.mode === "live" ? "green" : "gold"}>{state.checkout.label}</StatusPill>} />
          <div className="payment-rail-grid">
            <div>
              <Icons.receiz size={20} />
              <strong>{walletRailLabel}</strong>
              <span>Customers can pay from their Receiz balance first.</span>
            </div>
            <div>
              <Icons.creditCard size={20} />
              <strong>{checkoutFallbackLabel}</strong>
              <span>If wallet funds are not available, checkout can continue by card.</span>
            </div>
            <div>
              <Icons.seal size={20} />
              <strong>Proof-sealed settlement</strong>
              <span>Orders route to {state.hosting.settlementAccountLabel}.</span>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeader title="Shipping profile" action={<StatusPill tone={shipping ? "green" : "neutral"}>{shipping ? "Saved" : "Checkout"}</StatusPill>} />
          <div className="shipping-profile">
            <Icons.package size={22} />
            {shipping ? (
              <div>
                <strong>{shipping.name}</strong>
                <span>{shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ""}</span>
                <span>{[shipping.city, shipping.region, shipping.postalCode].filter(Boolean).join(", ")} · {shipping.country}</span>
                <span>{shipping.email}</span>
              </div>
            ) : (
              <div>
                <strong>Collected during checkout</strong>
                <span>Shipping details stay attached to this store account and sealed order history.</span>
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionHeader title="Orders" action={<StatusPill tone="neutral">{orders.length}</StatusPill>} />
          <div className="customer-order-list">
            {orders.length ? (
              orders.map((order) => (
                <div className="customer-order-card" key={order.id}>
                  <div>
                    <strong>Order #{order.id}</strong>
                    <span>{order.itemCount} items · {order.totalLabel}</span>
                    <span>{order.paymentRail?.replace(/_/g, " ") ?? "Receiz checkout"} · {order.settlementStatus?.replace(/_/g, " ") ?? order.status}</span>
                    {order.funding ? (
                      <span>
                        Wallet {order.funding.walletAppliedLabel} · Card delta {order.funding.cardDeltaLabel}
                      </span>
                    ) : null}
                  </div>
                  <StatusPill tone={order.sealed ? "green" : "gold"}>
                    {order.sealed ? "Sealed" : order.status.replace(/_/g, " ")}
                  </StatusPill>
                </div>
              ))
            ) : (
              <div className="account-empty-state">
                <Icons.orders size={24} />
                <strong>No orders yet</strong>
                <span>Purchases from {state.brand.name} will appear here with payment rail, shipping, and proof status.</span>
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionHeader title="Owned rewards" action={<StatusPill tone="green">{rewards.length}</StatusPill>} />
          <div className="account-reward-stack">
            {rewards.length ? (
              rewards.map((reward) => (
                <RewardCard brandImageUrl={state.brand.logoImageUrl} brandLabel={state.brand.logoText} key={reward.id} reward={reward} />
              ))
            ) : (
              <div className="account-empty-state">
                <Icons.gift size={24} />
                <strong>No rewards claimed yet</strong>
                <span>Coupons, access, memberships, and benefits from this store will collect here.</span>
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionHeader title="Receized assets" action={<StatusPill tone="green">{ownedAssets.length}</StatusPill>} />
          <div className="simple-list">
            {ownedAssets.length ? (
              ownedAssets.map((asset) => (
                <div className="simple-row" key={asset.id}>
                  <div>
                    <strong>{asset.name}</strong>
                    <span>{asset.proofSource} · {asset.priceLabel}</span>
                  </div>
                  <button className="link-button" onClick={() => actions.sealAsset(asset.id)} type="button">
                    {asset.status === "listed" ? "Listed" : "List"}
                  </button>
                </div>
              ))
            ) : (
              <div className="account-empty-state">
                <Icons.assets size={24} />
                <strong>No assets yet</strong>
                <span>Receized access, claims, collectibles, and benefits you own from this store will appear here.</span>
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionHeader title="Proof trail" action={<StatusPill tone="green">Live</StatusPill>} />
          <SealEventTimeline events={recentProofs} />
        </Panel>
      </div>

      <ProductCatalog
        brandImageUrl={state.brand.logoImageUrl}
        brandLabel={state.brand.logoText}
        products={state.products.slice(0, 4)}
        onAddToCart={actions.addToCart}
        showAdminActions={!tenantSurface}
      />
    </main>
  );
}
