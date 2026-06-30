"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Icons } from "@/components/icons";
import { BrandMark, Button, MetricCard, Panel, SealEventTimeline, SectionHeader, StatusPill } from "@/components/ui";
import { useTemplateStore } from "@/lib/storage/use-template-store";
import { AdminShell } from "@/features/admin/AdminShell";
import { BrandPanel } from "@/features/admin/BrandPanel";
import { HostingBillingPanel } from "@/features/admin/HostingBillingPanel";
import { HostingDomainsPanel } from "@/features/admin/HostingDomainsPanel";
import { LaunchRailsPanel } from "@/features/admin/LaunchRailsPanel";
import { PageBuilderPanel } from "@/features/admin/PageBuilderPanel";
import { ProductEditorPanel } from "@/features/admin/ProductEditorPanel";
import { PublishChecklist } from "@/features/admin/PublishChecklist";
import { ReceizIdentityPanel } from "@/features/admin/ReceizIdentityPanel";
import { RewardsRulesPanel } from "@/features/admin/RewardsRulesPanel";

type TemplateActions = ReturnType<typeof useTemplateStore>["actions"];
type AdminMobileView = "launch" | "brand" | "store" | "rewards" | "domains" | "receiz";

const adminMobileTabs = [
  ["launch", "Launch", Icons.home],
  ["brand", "Brand", Icons.palette],
  ["store", "Store", Icons.store],
  ["rewards", "Rewards", Icons.gift],
  ["domains", "Domains", Icons.globe],
  ["receiz", "Receiz", Icons.receiz]
] as const;

export function AdminStudio() {
  const { state, actions } = useTemplateStore();
  const campaignName = state.campaigns[0]?.name ?? "Reward Challenge";

  return (
    <AdminShell onPublish={actions.publish} state={state}>
      <MobileAdminConsole actions={actions} campaignName={campaignName} state={state} />
      <div className="admin-content">
        <div className="admin-heading">
          <div>
            <h1>Launch your ecommerce site</h1>
            <p>No-code setup for a hosted store, Receiz ID, checkout, proof objects, rewards, and domains.</p>
          </div>
        </div>

        <div className="status-card-grid">
          <AdminStatusCard icon={<Icons.store size={22} />} label="Storefront status" value="Live" detail={`Published ${state.hosting.lastPublishedAt}`} />
          <AdminStatusCard icon={<Icons.globe size={22} />} label={state.hosting.subdomain} value={state.hosting.subdomainStatus.status} detail={state.hosting.subdomainStatus.message ?? "Subdomain status"} />
          <AdminStatusCard icon={<Icons.lock size={22} />} label="Custom domain" value={state.hosting.customDomain.status} detail={state.hosting.customDomain.domain} />
          <AdminStatusCard
            icon={<Icons.receiz size={22} />}
            label="Receiz ID"
            value={state.auth.receizId.connected ? "Connected" : "Connect"}
            detail={state.auth.receizId.handle}
          />
          <AdminStatusCard icon={<Icons.creditCard size={22} />} label="Hosting billing" value={state.billing.status} detail={state.billing.monthlyTotalLabel} />
          <AdminStatusCard icon={<Icons.game size={22} />} label="Game enabled" value={state.game.enabled ? "Enabled" : "Off"} detail={campaignName} />
        </div>

        <div className="admin-layout-grid">
          <div className="admin-main-grid">
            <LaunchRailsPanel state={state} />
            <BrandPanel
              onBrandUpdate={actions.updateBrand}
              onSaveTheme={actions.saveTheme}
              state={state}
            />
            <ReceizIdentityPanel
              onCreate={actions.createReceizId}
              onRestoreArtifact={actions.restoreReceizIdentityArtifact}
              onSignIn={actions.signInWithReceizId}
              receizId={state.auth.receizId}
            />
            <HostingBillingPanel
              billing={state.billing}
              hosting={state.hosting}
              onAddPayment={actions.addBillingMethod}
              onSelectPlan={actions.selectHostingPlan}
            />
            <PageBuilderPanel pages={state.pages} />
            <ProductEditorPanel brandLabel={state.brand.logoText} products={state.products} />
            <RewardsRulesPanel rules={state.rewardRules} />
            <HostingDomainsPanel
              hosting={state.hosting}
              onCustomDomain={actions.connectCustomDomain}
              onSubdomain={actions.claimSubdomain}
              onVerifyDomain={actions.verifyCustomDomain}
            />
            <Panel className="admin-panel">
              <SectionHeader title="Game module" />
              <div className="game-admin-row">
                <div className="game-admin-thumb" />
                <div>
                  <strong>{campaignName}</strong>
                  <span>Collect beans, unlock perks.</span>
                </div>
                <button className={state.game.enabled ? "toggle active" : "toggle"} onClick={actions.toggleGame} type="button">
                  <span />
                </button>
              </div>
              <div className="settings-list">
                <div><span>Game status</span><strong>{state.game.enabled ? "Active" : "Disabled"}</strong></div>
                <div><span>Leaderboard</span><strong>{state.game.leaderboardEnabled ? "Enabled" : "Off"}</strong></div>
                <div><span>Daily limit</span><strong>{state.game.dailyLimit}</strong></div>
              </div>
              <Button variant="outline">Configure game</Button>
            </Panel>
            <Panel className="admin-panel">
              <SectionHeader title="Receiz seal settings" />
              <div className="settings-list">
                <div><span>Seal mode</span><strong>Automatic</strong></div>
                <div><span>Verification rules</span><strong>Strict</strong></div>
                <div><span>Proof retention</span><strong>Forever</strong></div>
                <div><span>Seal on actions</span><strong>5 actions</strong></div>
                <div><span>Audit logs</span><strong>Enabled</strong></div>
              </div>
              <Button variant="outline">Manage seal rules</Button>
            </Panel>
            <Panel className="admin-panel">
              <SectionHeader title="Checkout mode" />
              <div className="radio-list">
                {[
                  ["live", "Receiz checkout", "Accept Receiz-powered payments on your store."],
                  ["mock", "Receiz sandbox", "Test proof-sealed orders without charging customers."],
                  ["external", "Receiz delegated checkout", "Use a hosted Receiz checkout handoff when needed."]
                ].map(([mode, label, desc]) => (
                  <button
                    className={state.checkout.mode === mode ? "radio-card active" : "radio-card"}
                    key={mode}
                    onClick={() => actions.setCheckoutMode(mode as typeof state.checkout.mode)}
                    type="button"
                  >
                    <span />
                    <div>
                      <strong>{label}</strong>
                      <em>{desc}</em>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
            <Panel className="admin-panel metrics-panel">
              <SectionHeader title="Customers" />
              <MetricCard label="Total customers" value="12,458" delta="+8.2%" />
              <MetricCard label="New this month" value="1,243" delta="+12.4%" />
              <MetricCard label="Returning rate" value="28.6%" delta="+3.1%" />
            </Panel>
            <Panel className="admin-panel metrics-panel">
              <SectionHeader title="Orders" />
              <MetricCard label="Total orders" value="2,341" delta="+14.8%" />
              <MetricCard label="Revenue" value="$48,219" delta="+16.4%" />
              <MetricCard label="Average order value" value="$20.61" delta="+1.2%" />
            </Panel>
            <PublishChecklist onPublish={actions.publish} publish={state.publish} />
          </div>

          <aside className="admin-right-rail">
            <Panel>
              <SectionHeader title="Live storefront preview" action={<StatusPill tone="green">Live</StatusPill>} />
              <div className="storefront-preview">
                <div className="preview-top">
                  <Icons.menu size={18} />
                  <strong>{state.brand.logoText}</strong>
                  <Icons.search size={18} />
                </div>
                <div className="preview-hero">
                  <div>
                    <h3>{state.brand.tagline}</h3>
                    <p>{state.storefront.heroBody}</p>
                    <Button variant="primary">Shop now</Button>
                  </div>
                  <div className="preview-cup">{state.brand.logoText}</div>
                </div>
                <div className="preview-actions">
                  <span>Collect beans</span>
                  <span>Unlock rewards</span>
                  <span>Play & earn</span>
                </div>
                <Link className="link-button preview-link" href="/">Open storefront</Link>
              </div>
            </Panel>
            <Panel>
              <SectionHeader
                title="Seal events"
                action={<span className="live-label"><span /> Live</span>}
              />
              <SealEventTimeline events={state.proofEvents} />
              <button className="link-button" type="button">Open event log</button>
            </Panel>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminStatusCard({
  icon,
  label,
  value,
  detail
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Panel className="status-card">
      <span className="status-icon">{icon}</span>
      <div>
        <strong>{label}</strong>
        <StatusPill tone="green">{value}</StatusPill>
        <p>{detail}</p>
      </div>
      <Icons.chevronRight size={18} />
    </Panel>
  );
}

function MobileAdminConsole({
  actions,
  campaignName,
  state
}: {
  actions: TemplateActions;
  campaignName: string;
  state: ReturnType<typeof useTemplateStore>["state"];
}) {
  const [activeView, setActiveView] = useState<AdminMobileView>("launch");
  const activeDomainStatus = state.hosting.subdomainStatus.status;

  return (
    <section className="mobile-admin-console" aria-label="Mobile admin console">
      <header className="mobile-admin-header">
        <Link aria-label="Open storefront" href="/">
          <BrandMark label={state.brand.logoText} compact />
        </Link>
        <div>
          <span>{state.hosting.subdomain}</span>
          <strong>{state.brand.name}</strong>
        </div>
        <StatusPill tone={state.auth.receizId.connected ? "green" : "gold"}>
          {state.auth.receizId.connected ? "Receiz" : "Connect"}
        </StatusPill>
        <button aria-label="Publish store" className="mobile-admin-publish" onClick={actions.publish} type="button">
          <Icons.external size={17} />
        </button>
      </header>

      <div className="mobile-admin-stage" data-active-view={activeView}>
        <MobileAdminPane active={activeView === "launch"} title="Launch" action={<StatusPill tone={activeDomainStatus === "active" ? "green" : "gold"}>{activeDomainStatus}</StatusPill>}>
          <div className="mobile-admin-snapshot">
            <div>
              <Icons.store size={20} />
              <strong>{state.products.length}</strong>
              <span>Products</span>
            </div>
            <div>
              <Icons.gift size={20} />
              <strong>{state.rewardRules.length}</strong>
              <span>Rewards</span>
            </div>
            <div>
              <Icons.globe size={20} />
              <strong>{state.hosting.published ? "Live" : "Draft"}</strong>
              <span>Store</span>
            </div>
          </div>
          <LaunchRailsPanel state={state} />
          <PublishChecklist onPublish={actions.publish} publish={state.publish} />
        </MobileAdminPane>

        <MobileAdminPane active={activeView === "brand"} title="Brand" action={<StatusPill tone="green">Theme</StatusPill>}>
          <BrandPanel
            onBrandUpdate={actions.updateBrand}
            onSaveTheme={actions.saveTheme}
            state={state}
          />
        </MobileAdminPane>

        <MobileAdminPane active={activeView === "store"} title="Store" action={<StatusPill tone="green">Catalog</StatusPill>}>
          <PageBuilderPanel pages={state.pages} />
          <ProductEditorPanel brandLabel={state.brand.logoText} products={state.products} />
          <Panel className="admin-panel mobile-admin-card">
            <SectionHeader title="Checkout mode" />
            <div className="radio-list">
              {[
                ["live", "Receiz checkout", "Accept Receiz-powered payments."],
                ["mock", "Receiz sandbox", "Test proof-sealed orders."],
                ["external", "Receiz delegated checkout", "Hosted Receiz checkout handoff."]
              ].map(([mode, label, desc]) => (
                <button
                  className={state.checkout.mode === mode ? "radio-card active" : "radio-card"}
                  key={mode}
                  onClick={() => actions.setCheckoutMode(mode as typeof state.checkout.mode)}
                  type="button"
                >
                  <span />
                  <div>
                    <strong>{label}</strong>
                    <em>{desc}</em>
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        </MobileAdminPane>

        <MobileAdminPane active={activeView === "rewards"} title="Rewards" action={<StatusPill tone={state.game.enabled ? "green" : "neutral"}>{state.game.enabled ? "Game" : "Off"}</StatusPill>}>
          <RewardsRulesPanel rules={state.rewardRules} />
          <Panel className="admin-panel mobile-admin-card">
            <SectionHeader title="Game module" />
            <div className="game-admin-row">
              <div className="game-admin-thumb" />
              <div>
                <strong>{campaignName}</strong>
                <span>{state.game.enabled ? "Ready for branded rewards" : "Optional reward game"}</span>
              </div>
              <button className={state.game.enabled ? "toggle active" : "toggle"} onClick={actions.toggleGame} type="button">
                <span />
              </button>
            </div>
            <div className="settings-list">
              <div><span>Leaderboard</span><strong>{state.game.leaderboardEnabled ? "Enabled" : "Off"}</strong></div>
              <div><span>Daily limit</span><strong>{state.game.dailyLimit}</strong></div>
            </div>
          </Panel>
        </MobileAdminPane>

        <MobileAdminPane active={activeView === "domains"} title="Domains" action={<StatusPill tone="gold">{state.billing.monthlyTotalLabel}</StatusPill>}>
          <HostingDomainsPanel
            hosting={state.hosting}
            onCustomDomain={actions.connectCustomDomain}
            onSubdomain={actions.claimSubdomain}
            onVerifyDomain={actions.verifyCustomDomain}
          />
          <HostingBillingPanel
            billing={state.billing}
            hosting={state.hosting}
            onAddPayment={actions.addBillingMethod}
            onSelectPlan={actions.selectHostingPlan}
          />
        </MobileAdminPane>

        <MobileAdminPane active={activeView === "receiz"} title="Receiz" action={<StatusPill tone={state.auth.receizId.connected ? "green" : "gold"}>{state.auth.receizId.statusLabel}</StatusPill>}>
          <ReceizIdentityPanel
            artifactInputId="receiz-identity-artifact-mobile"
            onCreate={actions.createReceizId}
            onRestoreArtifact={actions.restoreReceizIdentityArtifact}
            onSignIn={actions.signInWithReceizId}
            receizId={state.auth.receizId}
          />
          <Panel className="admin-panel mobile-admin-card">
            <SectionHeader title="Seal events" action={<span className="live-label"><span /> Live</span>} />
            <SealEventTimeline events={state.proofEvents} />
          </Panel>
        </MobileAdminPane>
      </div>

      <nav className="mobile-admin-bottom-nav" aria-label="Admin mobile sections">
        {adminMobileTabs.map(([view, label, Icon]) => (
          <button
            aria-label={`Open ${label}`}
            aria-pressed={activeView === view}
            className={activeView === view ? "active" : undefined}
            key={view}
            onClick={() => setActiveView(view)}
            type="button"
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}

function MobileAdminPane({
  active,
  action,
  children,
  title
}: {
  active: boolean;
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <section aria-hidden={!active} className={active ? "mobile-admin-pane active" : "mobile-admin-pane"}>
      <div className="mobile-admin-pane-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
