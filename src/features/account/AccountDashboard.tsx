"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { MetricCard, Panel, RewardCard, SealEventTimeline, SectionHeader, StatusPill } from "@/components/ui";
import { brandThemeStyle } from "@/lib/theme";
import { useTemplateStore } from "@/lib/storage/use-template-store";
import { ProductCatalog } from "@/features/storefront/ProductCatalog";
import { platform } from "@/lib/platform";

export function AccountDashboard() {
  const { state, actions, hostContext } = useTemplateStore();
  const customer = state.customers[0] ?? state.auth.customer;
  const tenantSurface = hostContext.surface === "tenant";
  const ownedAssets = state.assets.filter((asset) => customer.assetIds.includes(asset.id));
  const orders = state.orders.filter((order) => order.customerId === customer.id);
  const rewards = state.rewards.filter((reward) => customer.rewardIds.includes(reward.id));

  return (
    <main className="account-page" style={brandThemeStyle(state.brand)}>
      <header className="account-header">
        <Link className="kit-logo" href="/">
          <span className="receiz-mark">
            <Icons.receiz size={23} />
          </span>
          <strong>{platform.name}</strong>
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
          <StatusPill tone="green">{customer.tier}</StatusPill>
          <span className="receiz-id-line">
            <Icons.receiz size={15} /> {state.auth.receizId.handle}
          </span>
        </div>
        <div className="account-hero-metrics">
          <MetricCard label="Rewards" value={customer.rewardsValueLabel} />
          <MetricCard label="Beans" value={String(customer.beans)} />
          <MetricCard label="Streak" value={customer.streak} />
        </div>
      </section>

      <div className="account-grid">
        <Panel>
          <SectionHeader title="Receiz ID login" action={<StatusPill tone="green">One click</StatusPill>} />
          <div className="identity-account-card">
            <span className="identity-icon">
              <Icons.receiz size={24} />
            </span>
            <div>
              <strong>{state.auth.receizId.handle}</strong>
              <p>
                Existing Receiz IDs can sign in, new users can create one, and Receiz Key or Identity Seal artifacts
                restore the same account locally.
              </p>
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
              <button className="button button-primary" onClick={actions.signInWithReceizId} type="button">
                Continue with Receiz ID
              </button>
              <button className="button button-outline" onClick={actions.createReceizId} type="button">
                Create Receiz ID
              </button>
            </div>
          )}
        </Panel>

        <Panel>
          <SectionHeader title="Orders" />
          <div className="simple-list">
            {orders.map((order) => (
              <div className="simple-row" key={order.id}>
                <div>
                  <strong>Order #{order.id}</strong>
                  <span>{order.itemCount} items · {order.totalLabel}</span>
                </div>
                <StatusPill tone={order.sealed ? "green" : "neutral"}>
                  {order.sealed ? "Sealed" : "Pending"}
                </StatusPill>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeader title="Owned Receized assets" />
          <div className="simple-list">
            {ownedAssets.map((asset) => (
              <div className="simple-row" key={asset.id}>
                <div>
                  <strong>{asset.name}</strong>
                  <span>{asset.proofSource} · {asset.priceLabel}</span>
                </div>
                <button className="link-button" onClick={() => actions.sealAsset(asset.id)} type="button">
                  {asset.status === "listed" ? "Listed" : "List"}
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeader title="Owned rewards" />
          {rewards.map((reward) => (
            <RewardCard brandLabel={state.brand.logoText} key={reward.id} reward={reward} />
          ))}
        </Panel>

        <Panel>
          <SectionHeader title="Proof trail" />
          <SealEventTimeline events={state.proofEvents} />
        </Panel>
      </div>

      <ProductCatalog
        brandLabel={state.brand.logoText}
        products={state.products.slice(0, 4)}
        onAddToCart={actions.addToCart}
        showAdminActions={!tenantSurface}
      />
    </main>
  );
}
