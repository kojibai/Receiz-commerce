"use client";

import { useState, type ReactNode } from "react";
import { Icons } from "@/components/icons";
import { BrandMark, Button, Panel, ProductVisual, SectionHeader, StatusPill } from "@/components/ui";
import { platform } from "@/lib/platform";
import { brandThemeStyle } from "@/lib/theme";
import { useTemplateStore } from "@/lib/storage/use-template-store";
import { customerForAccountSurface, customerReceizHandle } from "@/lib/storefront/customer-session";
import type { BlogPost, CommerceState, CustomerAccount, Product, ReceizedAsset, Reward } from "@/types/domain";
import type { HostContext } from "@/lib/hosting/host-context";
import { PlayCampaign } from "@/features/play/PlayCampaign";
import { ProductCatalog } from "@/features/storefront/ProductCatalog";
import { ReceizIdAccess } from "@/features/storefront/ReceizIdAccess";
import { RewardDeck } from "@/features/storefront/RewardDeck";
import { SealEvents } from "@/features/storefront/SealEvents";
import {
  BottomNav,
  HeroProduct,
  MobileHeader,
  type MobileView,
  StoreSidebar,
  StoreTopbar
} from "@/features/storefront/StoreShell";

export function PublicStorefront({
  initialHostContext,
  initialState
}: {
  initialHostContext?: HostContext;
  initialState?: CommerceState;
}) {
  const { state, actions, hostContext } = useTemplateStore(initialState, initialHostContext);
  const [mobileView, setMobileView] = useState<MobileView>("store");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tenantSurface = hostContext.surface === "tenant";
  const customer = customerForAccountSurface(state, tenantSurface);
  const receizHandle = customerReceizHandle(state, customer);
  const reward = state.rewards[0] ?? null;
  const campaignName = state.campaigns[0]?.name ?? "Reward Challenge";

  const sealObject = () => actions.appendProofEvent("OBJECT_VERIFIED", "Coffee Pack · Serial #BC-88421");
  const issueReward = () => actions.appendProofEvent("REWARD_ISSUED", `${reward?.name ?? "Reward"} · ${state.brand.name}`);
  const claimReward = () => actions.appendProofEvent("REWARD_CLAIMED", `${reward?.name ?? "Reward"} claimed`);
  const selectMobileView = (view: MobileView) => {
    setMobileView(view);
    setMobileMenuOpen(false);
  };

  return (
    <main className={tenantSurface ? "commerce-app tenant-store" : "commerce-app"} style={brandThemeStyle(state.brand)}>
      <StoreSidebar state={state} tenantSurface={tenantSurface} />
      <div className="app-body">
        <StoreTopbar state={state} tenantSurface={tenantSurface} />
        <MobileHeader
          menuOpen={mobileMenuOpen}
          onAccount={() => selectMobileView("account")}
          onMenu={() => setMobileMenuOpen((open) => !open)}
          state={state}
        />
        <div className="content-grid">
          <section className="main-column">
            <div className="page-title">
              <h1>{state.storefront.headline}</h1>
              <p>{state.storefront.subheadline}</p>
            </div>

            <HeroProduct
              onCheckout={actions.startCheckout}
              onSeal={sealObject}
              state={state}
              tenantSurface={tenantSurface}
            />

            {tenantSurface ? null : (
              <div className="quick-actions">
                <button onClick={sealObject} type="button">
                  <Icons.seal size={30} />
                  <div>
                    <strong>Seal object</strong>
                    <span>Turn physical or digital objects into verified records.</span>
                  </div>
                  <Icons.chevronRight size={20} />
                </button>
                <button onClick={issueReward} type="button">
                  <Icons.gift size={30} />
                  <div>
                    <strong>Issue reward</strong>
                    <span>Reward customers for actions, purchases, or achievements.</span>
                  </div>
                  <Icons.chevronRight size={20} />
                </button>
                <button onClick={claimReward} type="button">
                  <Icons.star size={30} />
                  <div>
                    <strong>Claim reward</strong>
                    <span>Customers claim perks, discounts, and experiences.</span>
                  </div>
                  <Icons.chevronRight size={20} />
                </button>
              </div>
            )}

            <PlayCampaign
              campaignName={campaignName}
              enabled={state.game.enabled}
              onComplete={(beans) =>
                actions.appendProofEvent("GAME_COMPLETED", `${campaignName} · ${beans} beans`)
              }
            />

            <ProductCatalog
              brandImageUrl={state.brand.logoImageUrl}
              brandLabel={state.brand.logoText}
              products={state.products}
              onAddToCart={actions.addToCart}
              showAdminActions={!tenantSurface}
            />

            <BlogHighlights posts={state.blogPosts} showAdminActions={!tenantSurface} />

            {tenantSurface ? null : (
              <a className="mobile-fork" href="https://github.com" target="_blank" rel="noreferrer">
                <Icons.github size={29} />
                <div>
                  <strong>{platform.repoLabel}</strong>
                  <span>{platform.tagline}</span>
                </div>
                <Icons.chevronRight size={20} />
              </a>
            )}
          </section>

          <aside className="right-rail">
            <ReceizIdAccess
              onSignIn={actions.signInWithReceizId}
              receizId={state.auth.receizId}
            />
            <RewardDeck
              brandImageUrl={state.brand.logoImageUrl}
              brandLabel={state.brand.logoText}
              customer={customer}
              reward={reward}
              showAdminActions={!tenantSurface}
            />
            {tenantSurface ? null : <SealEvents events={state.proofEvents} />}
          </aside>
        </div>
        <MobileStage
          activeView={mobileView}
          customer={customer}
          customerReceizHandle={receizHandle}
          onAddToCart={actions.addToCart}
          onCheckout={actions.startCheckout}
          onClaimReward={claimReward}
          onIssueReward={issueReward}
          onSeal={sealObject}
          onSignInReceizId={actions.signInWithReceizId}
          tenantSurface={tenantSurface}
          onPlayComplete={(beans) =>
            actions.appendProofEvent("GAME_COMPLETED", `${campaignName} · ${beans} beans`)
          }
          campaignName={campaignName}
          reward={reward}
          state={state}
        />
        <MobileCommandMenu
          activeView={mobileView}
          onClose={() => setMobileMenuOpen(false)}
          onNavigate={selectMobileView}
          onSeal={sealObject}
          onSignInReceizId={actions.signInWithReceizId}
          open={mobileMenuOpen}
          state={state}
          tenantSurface={tenantSurface}
          customerReceizHandle={receizHandle}
        />
        <BottomNav activeView={mobileView} onChange={selectMobileView} />
      </div>
    </main>
  );
}

function BlogHighlights({
  posts,
  showAdminActions
}: {
  posts: BlogPost[];
  showAdminActions: boolean;
}) {
  const visiblePosts = posts.filter((post) => post.status === "published" || showAdminActions).slice(0, 3);

  return (
    <section className="panel blog-panel" id="blog">
      <SectionHeader
        title="Blog"
        action={showAdminActions ? <Button onClick={() => window.location.assign("/admin")} variant="outline">Add post</Button> : null}
      />
      {visiblePosts.length ? (
        <div className="blog-card-grid">
          {visiblePosts.map((post) => (
            <article className={post.featured ? "blog-card featured" : "blog-card"} key={post.id}>
              <div className="blog-cover">
                {post.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={post.coverImageUrl} />
                ) : (
                  <Icons.book size={24} />
                )}
              </div>
              <div>
                <span>{post.tags.slice(0, 2).join(" · ") || "Update"}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </div>
              <StatusPill tone={post.status === "published" ? "green" : "neutral"}>{post.status}</StatusPill>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel-empty-state">
          <Icons.book size={22} />
          <strong>No posts yet</strong>
          <span>This store has not published blog content yet.</span>
        </div>
      )}
    </section>
  );
}

function MobileCommandMenu({
  activeView,
  onClose,
  onNavigate,
  onSeal,
  onSignInReceizId,
  open,
  state,
  customerReceizHandle,
  tenantSurface
}: {
  activeView: MobileView;
  customerReceizHandle: string;
  onClose: () => void;
  onNavigate: (view: MobileView) => void;
  onSeal: () => void;
  onSignInReceizId: () => void;
  open: boolean;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  const navItems = [
    ["store", "Store", Icons.store],
    ["rewards", "Rewards", Icons.gift],
    ["assets", "Assets", Icons.assets],
    ["play", "Play", Icons.game],
    ["account", "Account", Icons.user]
  ] as const;

  const runAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div aria-hidden={!open} className={open ? "mobile-command-menu open" : "mobile-command-menu"}>
      <div aria-label="Mobile menu" aria-modal="true" className="mobile-command-sheet" role="dialog">
        <div className="mobile-command-head">
          <div>
            <span>{state.hosting.subdomain}</span>
            <strong>{state.brand.name}</strong>
          </div>
          <button aria-label="Close menu" className="icon-button" onClick={onClose} type="button">
            <Icons.close size={22} />
          </button>
        </div>

        <div className="mobile-command-grid" aria-label="Switch view">
          {navItems.map(([view, label, Icon]) => (
            <button
              aria-current={activeView === view ? "page" : undefined}
              className={activeView === view ? "active" : undefined}
              key={view}
              onClick={() => onNavigate(view)}
              type="button"
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="mobile-command-actions">
          {state.auth.receizId.connected ? null : (
            <>
              <button onClick={() => runAction(onSignInReceizId)} type="button">
                  <Icons.user size={21} />
                <div>
                  <strong>Continue with Receiz ID</strong>
                  <span>{customerReceizHandle}</span>
                </div>
              </button>
            </>
          )}
          {tenantSurface ? null : (
            <button onClick={() => runAction(onSeal)} type="button">
              <Icons.seal size={21} />
              <div>
                <strong>Seal object</strong>
                <span>Verify an asset, reward, or product</span>
              </div>
            </button>
          )}
          {tenantSurface ? null : (
            <button onClick={() => window.location.assign("/admin")} type="button">
              <Icons.settings size={21} />
              <div>
                <strong>Admin Studio</strong>
                <span>Edit brand, store, rewards, and hosting</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileStage({
  activeView,
  campaignName,
  customer,
  onAddToCart,
  onCheckout,
  onClaimReward,
  onIssueReward,
  onPlayComplete,
  onSeal,
  onSignInReceizId,
  reward,
  state,
  customerReceizHandle,
  tenantSurface
}: {
  activeView: MobileView;
  campaignName: string;
  customer: CustomerAccount;
  customerReceizHandle: string;
  onAddToCart: (productId: string) => void;
  onCheckout: () => void;
  onClaimReward: () => void;
  onIssueReward: () => void;
  onPlayComplete: (beans: number) => void;
  onSeal: () => void;
  onSignInReceizId: () => void;
  reward: Reward | null;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  return (
    <div className="mobile-stage" data-active-view={activeView}>
      <MobileStorePanel
        active={activeView === "store"}
        blogPosts={state.blogPosts}
        collections={state.collections}
        onAddToCart={onAddToCart}
        onCheckout={onCheckout}
        onSeal={onSeal}
        products={state.products}
        state={state}
        tenantSurface={tenantSurface}
      />
      <MobileRewardsPanel
        active={activeView === "rewards"}
        brandImageUrl={state.brand.logoImageUrl}
        brandLabel={state.brand.logoText}
        customer={customer}
        onClaimReward={onClaimReward}
        onIssueReward={onIssueReward}
        reward={reward}
        tenantSurface={tenantSurface}
      />
      <MobileAssetsPanel
        active={activeView === "assets"}
        assets={state.assets}
        customerReceizHandle={customerReceizHandle}
        onSignInReceizId={onSignInReceizId}
        state={state}
        tenantSurface={tenantSurface}
      />
      <MobilePlayPanel
        active={activeView === "play"}
        campaignName={campaignName}
        enabled={state.game.enabled}
        onComplete={onPlayComplete}
      />
      <MobileAccountPanel
        active={activeView === "account"}
        customer={customer}
        customerReceizHandle={customerReceizHandle}
        onSignInReceizId={onSignInReceizId}
        state={state}
        tenantSurface={tenantSurface}
      />
    </div>
  );
}

function MobilePane({
  active,
  children,
  title,
  action
}: {
  active: boolean;
  children: ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <section aria-hidden={!active} className={active ? "mobile-pane active" : "mobile-pane"}>
      <div className="mobile-pane-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function MobileStorePanel({
  active,
  products,
  blogPosts,
  collections,
  state,
  tenantSurface,
  onAddToCart,
  onCheckout,
  onSeal
}: {
  active: boolean;
  blogPosts: BlogPost[];
  collections: CommerceState["collections"];
  products: Product[];
  state: CommerceState;
  tenantSurface: boolean;
  onAddToCart: (productId: string) => void;
  onCheckout: () => void;
  onSeal: () => void;
}) {
  const firstProduct = products[0];
  const firstPost = blogPosts.find((post) => post.status === "published") ?? blogPosts[0];
  const visibleCollections = collections.filter((collection) => collection.published).slice(0, 5);
  const categoryLabels = visibleCollections.length
    ? visibleCollections.map((collection) => collection.name)
    : ["Featured", "Access", "Rewards", "Drops"];

  return (
    <MobilePane active={active} action={<StatusPill tone="green">Live</StatusPill>} title="Store">
      <div className="mobile-shop-hero">
        <div>
          <span>{state.hosting.subdomain}</span>
          <h3>{state.brand.name}</h3>
          <p>{state.brand.tagline}</p>
          <div className="mobile-shop-actions">
            <button onClick={onCheckout} type="button">
              Shop now
            </button>
            {tenantSurface ? null : (
              <button onClick={onSeal} type="button">
                Seal object
              </button>
            )}
          </div>
        </div>
        <div className="mobile-featured-product">
          <BrandMark imageUrl={state.brand.logoImageUrl} label={state.brand.logoText} />
          <strong>{firstProduct?.name ?? "Add products"}</strong>
          <small>{firstProduct?.priceLabel ?? "Ready"}</small>
        </div>
      </div>

      <div className="mobile-category-row" aria-label="Shop categories">
        {categoryLabels.map((label) => (
          <button key={label} type="button">
            {label}
          </button>
        ))}
      </div>

      <div className="mobile-mini-products">
        {products.length ? (
          products.slice(0, 2).map((product) => (
            <article key={product.id}>
              <ProductVisual brandImageUrl={state.brand.logoImageUrl} brandLabel={state.brand.logoText} product={product} />
              <div>
                <strong>{product.name}</strong>
                <span>{product.subtitle}</span>
                <b>{product.priceLabel}</b>
              </div>
              <button aria-label={`Add ${product.name} to cart`} onClick={() => onAddToCart(product.id)} type="button">
                <Icons.cart size={16} />
              </button>
            </article>
          ))
        ) : (
          <div className="mobile-empty-state">
            <Icons.products size={24} />
            <strong>No products yet</strong>
            <span>{tenantSurface ? "This store is getting its catalog ready." : "Add products in Admin Studio to open the storefront."}</span>
          </div>
        )}
      </div>
      <div className="mobile-store-footer">
        <span><Icons.seal size={15} /> Proof-sealed orders</span>
        <span><Icons.gift size={15} /> Rewards enabled</span>
      </div>
      {firstPost ? (
        <article className="mobile-blog-card">
          <Icons.book size={19} />
          <div>
            <strong>{firstPost.title}</strong>
            <span>{firstPost.excerpt}</span>
          </div>
        </article>
      ) : null}
    </MobilePane>
  );
}

function MobileRewardsPanel({
  active,
  brandImageUrl,
  brandLabel,
  customer,
  onClaimReward,
  onIssueReward,
  reward,
  tenantSurface
}: {
  active: boolean;
  brandImageUrl?: string | null;
  brandLabel: string;
  customer: CustomerAccount;
  onClaimReward: () => void;
  onIssueReward: () => void;
  reward: Reward | null;
  tenantSurface: boolean;
}) {
  const progress = reward ? Math.min(100, Math.round((reward.progress / reward.target) * 100)) : 0;

  return (
    <MobilePane active={active} action={<StatusPill tone="gold">{customer.beans} beans</StatusPill>} title="Rewards">
      {reward ? (
        <div className="mobile-reward-card">
          <BrandMark imageUrl={brandImageUrl} label={brandLabel} />
          <div>
            <StatusPill tone="gold">Active</StatusPill>
            <h3>{reward.name}</h3>
            <p>{reward.description}</p>
            <span>{reward.requirement}</span>
          </div>
          <div className="progress-wrap">
            <div className="progress-bar">
              <span style={{ width: `${progress}%` }} />
            </div>
            <strong>{reward.progress} / {reward.target}</strong>
          </div>
        </div>
      ) : (
        <div className="mobile-empty-state">
          <Icons.gift size={24} />
          <strong>No rewards yet</strong>
          <span>{tenantSurface ? "Rewards will appear here when this store launches them." : "Create branded rewards in Admin Studio."}</span>
        </div>
      )}
      <div className="mobile-action-grid">
        {tenantSurface ? null : (
          <button onClick={onIssueReward} type="button">
            <Icons.gift size={21} />
            <span>Issue reward</span>
          </button>
        )}
        <button onClick={onClaimReward} type="button">
          <Icons.star size={21} />
          <span>Claim perk</span>
        </button>
      </div>
      <div className="mobile-stat-row">
        <div><strong>{customer.rewardsValueLabel}</strong><span>Rewards</span></div>
        <div><strong>{customer.streak}</strong><span>Streak</span></div>
      </div>
    </MobilePane>
  );
}

function MobileAssetsPanel({
  active,
  assets,
  customerReceizHandle,
  onSignInReceizId,
  state,
  tenantSurface: _tenantSurface
}: {
  active: boolean;
  assets: ReceizedAsset[];
  customerReceizHandle: string;
  onSignInReceizId: () => void;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  return (
    <MobilePane active={active} action={<StatusPill tone="green">Receized</StatusPill>} title="Assets">
      <div className="mobile-receiz-id-card">
        <span className="identity-icon">
          <Icons.receiz size={22} />
        </span>
        <div>
          <strong>{customerReceizHandle}</strong>
          <p>Own, list, sell, trade, and share proof-sealed assets.</p>
        </div>
      </div>
      {state.auth.receizId.connected ? null : (
        <div className="mobile-action-grid">
          <button onClick={onSignInReceizId} type="button">
            <Icons.user size={21} />
            <span>Continue</span>
          </button>
        </div>
      )}
      <div className="mobile-asset-list">
        {assets.length ? (
          assets.slice(0, 3).map((asset) => (
            <div key={asset.id}>
              <strong>{asset.name}</strong>
              <span>{asset.proofSource} · {asset.priceLabel}</span>
              <StatusPill tone={asset.status === "listed" ? "green" : "neutral"}>{asset.status}</StatusPill>
            </div>
          ))
        ) : (
          <div className="mobile-empty-row">
            <strong>No assets yet</strong>
            <span>Sold products, benefits, and access can become Receized assets.</span>
          </div>
        )}
      </div>
    </MobilePane>
  );
}

function MobilePlayPanel({
  active,
  campaignName,
  enabled,
  onComplete
}: {
  active: boolean;
  campaignName: string;
  enabled: boolean;
  onComplete: (beans: number) => void;
}) {
  return (
    <MobilePane active={active} action={<StatusPill tone="pink">Game on</StatusPill>} title="Play">
      <div className="mobile-play-wrap">
        <PlayCampaign campaignName={campaignName} enabled={enabled} onComplete={onComplete} />
      </div>
    </MobilePane>
  );
}

function MobileAccountPanel({
  active,
  customer,
  customerReceizHandle,
  onSignInReceizId,
  state,
  tenantSurface
}: {
  active: boolean;
  customer: CustomerAccount;
  customerReceizHandle: string;
  onSignInReceizId: () => void;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  return (
    <MobilePane active={active} action={<StatusPill tone="green">{customer.tier}</StatusPill>} title="Account">
      <div className="mobile-account-card">
        <div className="avatar large-avatar">{customer.name.slice(0, 1)}</div>
        <div>
          <h3>{customer.name}</h3>
          <p>{customer.email}</p>
          <span><Icons.receiz size={15} /> {customerReceizHandle}</span>
        </div>
      </div>
      {state.auth.receizId.connected ? null : (
        <div className="mobile-action-grid">
          <button onClick={onSignInReceizId} type="button">
            <Icons.user size={21} />
            <span>Continue with Receiz ID</span>
          </button>
        </div>
      )}
      <div className="mobile-stat-row">
        <div><strong>{customer.rewardsValueLabel}</strong><span>Rewards</span></div>
        <div><strong>{customer.beans}</strong><span>Beans</span></div>
        <div><strong>{customer.streak}</strong><span>Streak</span></div>
      </div>
      {tenantSurface ? null : (
        <Button className="mobile-admin-button" variant="outline" onClick={() => window.location.assign("/admin")}>
          Admin Studio
        </Button>
      )}
    </MobilePane>
  );
}
