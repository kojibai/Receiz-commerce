"use client";

import { useState, type ReactNode } from "react";
import { Icons } from "@/components/icons";
import { BrandMark, Button, Panel, ProductVisual, SectionHeader, StatusPill } from "@/components/ui";
import { brandThemeStyle } from "@/lib/theme";
import { useTemplateStore } from "@/lib/storage/use-template-store";
import type { CommerceState, CustomerAccount, Product, ReceizedAsset, Reward } from "@/types/domain";
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

export function PublicStorefront() {
  const { state, actions } = useTemplateStore();
  const [mobileView, setMobileView] = useState<MobileView>("store");
  const customer = state.customers[0];
  const reward = state.rewards[0];

  const sealObject = () => actions.appendProofEvent("OBJECT_VERIFIED", "Coffee Pack · Serial #BC-88421");
  const issueReward = () => actions.appendProofEvent("REWARD_ISSUED", "$12 reward · Boost Coffee");
  const claimReward = () => actions.appendProofEvent("REWARD_CLAIMED", "$12 reward claimed");

  return (
    <main className="commerce-app" style={brandThemeStyle(state.brand)}>
      <StoreSidebar state={state} />
      <div className="app-body">
        <StoreTopbar state={state} />
        <MobileHeader state={state} />
        <div className="content-grid">
          <section className="main-column">
            <div className="page-title">
              <h1>{state.storefront.headline}</h1>
              <p>{state.storefront.subheadline}</p>
            </div>

            <HeroProduct
              onCheckout={actions.completeMockCheckout}
              onSeal={sealObject}
              state={state}
            />

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

            <PlayCampaign
              enabled={state.game.enabled}
              onComplete={(beans) =>
                actions.appendProofEvent("GAME_COMPLETED", `Boost Coffee Challenge · ${beans} beans`)
              }
            />

            <ProductCatalog products={state.products} onAddToCart={actions.addToCart} />

            <a className="mobile-fork" href="https://github.com" target="_blank" rel="noreferrer">
              <Icons.github size={29} />
              <div>
                <strong>Fork this template</strong>
                <span>Launch your own proof-sealed store in minutes.</span>
              </div>
              <Icons.chevronRight size={20} />
            </a>
          </section>

          <aside className="right-rail">
            <ReceizIdAccess
              onCreate={actions.createReceizId}
              onSignIn={actions.signInWithReceizId}
              receizId={state.auth.receizId}
            />
            <RewardDeck customer={customer} reward={reward} />
            <SealEvents events={state.proofEvents} />
          </aside>
        </div>
        <MobileStage
          activeView={mobileView}
          customer={customer}
          onAddToCart={actions.addToCart}
          onCheckout={actions.completeMockCheckout}
          onClaimReward={claimReward}
          onCreateReceizId={actions.createReceizId}
          onIssueReward={issueReward}
          onSeal={sealObject}
          onSignInReceizId={actions.signInWithReceizId}
          onPlayComplete={(beans) =>
            actions.appendProofEvent("GAME_COMPLETED", `Boost Coffee Challenge · ${beans} beans`)
          }
          reward={reward}
          state={state}
        />
        <BottomNav activeView={mobileView} onChange={setMobileView} />
      </div>
    </main>
  );
}

function MobileStage({
  activeView,
  customer,
  onAddToCart,
  onCheckout,
  onClaimReward,
  onCreateReceizId,
  onIssueReward,
  onPlayComplete,
  onSeal,
  onSignInReceizId,
  reward,
  state
}: {
  activeView: MobileView;
  customer: CustomerAccount;
  onAddToCart: (productId: string) => void;
  onCheckout: () => void;
  onClaimReward: () => void;
  onCreateReceizId: () => void;
  onIssueReward: () => void;
  onPlayComplete: (beans: number) => void;
  onSeal: () => void;
  onSignInReceizId: () => void;
  reward: Reward;
  state: CommerceState;
}) {
  return (
    <div className="mobile-stage" data-active-view={activeView}>
      <MobileStorePanel
        active={activeView === "store"}
        onAddToCart={onAddToCart}
        onCheckout={onCheckout}
        onSeal={onSeal}
        products={state.products}
        state={state}
      />
      <MobileRewardsPanel
        active={activeView === "rewards"}
        customer={customer}
        onClaimReward={onClaimReward}
        onIssueReward={onIssueReward}
        reward={reward}
      />
      <MobileAssetsPanel
        active={activeView === "assets"}
        assets={state.assets}
        onCreateReceizId={onCreateReceizId}
        onSignInReceizId={onSignInReceizId}
        state={state}
      />
      <MobilePlayPanel
        active={activeView === "play"}
        enabled={state.game.enabled}
        onComplete={onPlayComplete}
      />
      <MobileAccountPanel
        active={activeView === "account"}
        customer={customer}
        onCreateReceizId={onCreateReceizId}
        onSignInReceizId={onSignInReceizId}
        state={state}
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
  state,
  onAddToCart,
  onCheckout,
  onSeal
}: {
  active: boolean;
  products: Product[];
  state: CommerceState;
  onAddToCart: (productId: string) => void;
  onCheckout: () => void;
  onSeal: () => void;
}) {
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
            <button onClick={onSeal} type="button">
              Seal object
            </button>
          </div>
        </div>
        <div className="mobile-featured-product">
          <BrandMark label={state.brand.logoText} />
          <strong>House Blend</strong>
          <small>$18.00</small>
        </div>
      </div>

      <div className="mobile-category-row" aria-label="Shop categories">
        {["Coffee", "Access", "Rewards", "Drops"].map((label) => (
          <button key={label} type="button">
            {label}
          </button>
        ))}
      </div>

      <div className="mobile-mini-products">
        {products.slice(0, 2).map((product) => (
          <article key={product.id}>
            <ProductVisual product={product} />
            <div>
              <strong>{product.name}</strong>
              <span>{product.subtitle}</span>
              <b>{product.priceLabel}</b>
            </div>
            <button aria-label={`Add ${product.name} to cart`} onClick={() => onAddToCart(product.id)} type="button">
              <Icons.cart size={16} />
            </button>
          </article>
        ))}
      </div>
      <div className="mobile-store-footer">
        <span><Icons.seal size={15} /> Proof-sealed orders</span>
        <span><Icons.gift size={15} /> Rewards enabled</span>
      </div>
    </MobilePane>
  );
}

function MobileRewardsPanel({
  active,
  customer,
  onClaimReward,
  onIssueReward,
  reward
}: {
  active: boolean;
  customer: CustomerAccount;
  onClaimReward: () => void;
  onIssueReward: () => void;
  reward: Reward;
}) {
  const progress = Math.min(100, Math.round((reward.progress / reward.target) * 100));

  return (
    <MobilePane active={active} action={<StatusPill tone="gold">{customer.beans} beans</StatusPill>} title="Rewards">
      <div className="mobile-reward-card">
        <BrandMark label="boost" />
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
      <div className="mobile-action-grid">
        <button onClick={onIssueReward} type="button">
          <Icons.gift size={21} />
          <span>Issue reward</span>
        </button>
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
  onCreateReceizId,
  onSignInReceizId,
  state
}: {
  active: boolean;
  assets: ReceizedAsset[];
  onCreateReceizId: () => void;
  onSignInReceizId: () => void;
  state: CommerceState;
}) {
  return (
    <MobilePane active={active} action={<StatusPill tone="green">Receized</StatusPill>} title="Assets">
      <div className="mobile-receiz-id-card">
        <span className="identity-icon">
          <Icons.receiz size={22} />
        </span>
        <div>
          <strong>{state.auth.receizId.handle}</strong>
          <p>Own, list, sell, trade, and share proof-sealed assets.</p>
        </div>
      </div>
      <div className="mobile-action-grid">
        <button onClick={onSignInReceizId} type="button">
          <Icons.user size={21} />
          <span>Continue</span>
        </button>
        <button onClick={onCreateReceizId} type="button">
          <Icons.receiz size={21} />
          <span>Create ID</span>
        </button>
      </div>
      <div className="mobile-asset-list">
        {assets.slice(0, 3).map((asset) => (
          <div key={asset.id}>
            <strong>{asset.name}</strong>
            <span>{asset.proofSource} · {asset.priceLabel}</span>
            <StatusPill tone={asset.status === "listed" ? "green" : "neutral"}>{asset.status}</StatusPill>
          </div>
        ))}
      </div>
    </MobilePane>
  );
}

function MobilePlayPanel({
  active,
  enabled,
  onComplete
}: {
  active: boolean;
  enabled: boolean;
  onComplete: (beans: number) => void;
}) {
  return (
    <MobilePane active={active} action={<StatusPill tone="pink">Game on</StatusPill>} title="Play">
      <div className="mobile-play-wrap">
        <PlayCampaign enabled={enabled} onComplete={onComplete} />
      </div>
    </MobilePane>
  );
}

function MobileAccountPanel({
  active,
  customer,
  onCreateReceizId,
  onSignInReceizId,
  state
}: {
  active: boolean;
  customer: CustomerAccount;
  onCreateReceizId: () => void;
  onSignInReceizId: () => void;
  state: CommerceState;
}) {
  return (
    <MobilePane active={active} action={<StatusPill tone="green">{customer.tier}</StatusPill>} title="Account">
      <div className="mobile-account-card">
        <div className="avatar large-avatar">{customer.name.slice(0, 1)}S</div>
        <div>
          <h3>{customer.name}</h3>
          <p>{customer.email}</p>
          <span><Icons.receiz size={15} /> {state.auth.receizId.handle}</span>
        </div>
      </div>
      <div className="mobile-action-grid">
        <button onClick={onSignInReceizId} type="button">
          <Icons.user size={21} />
          <span>Receiz login</span>
        </button>
        <button onClick={onCreateReceizId} type="button">
          <Icons.receiz size={21} />
          <span>Create ID</span>
        </button>
      </div>
      <div className="mobile-stat-row">
        <div><strong>{customer.rewardsValueLabel}</strong><span>Rewards</span></div>
        <div><strong>{customer.beans}</strong><span>Beans</span></div>
        <div><strong>{customer.streak}</strong><span>Streak</span></div>
      </div>
      <Button className="mobile-admin-button" variant="outline" onClick={() => window.location.assign("/admin")}>
        Admin Studio
      </Button>
    </MobilePane>
  );
}
