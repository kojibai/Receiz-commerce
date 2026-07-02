"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { InlineActionFeedback } from "@/components/ActionFeedback";
import { Icons } from "@/components/icons";
import {
  BrandMark,
  Button,
  OfficialReceizLoginButton,
  Panel,
  PoweredByReceizBadge,
  ProductVisual,
  SectionHeader,
  StatusPill
} from "@/components/ui";
import { platform } from "@/lib/platform";
import { brandThemeStyle } from "@/lib/theme";
import { useTemplateStore } from "@/lib/storage/use-template-store";
import { buildCartSummary, type CartSummary } from "@/lib/storefront/cart-summary";
import {
  buildExchangeTradePreview,
  projectExchangeDesk,
  type ExchangeTradeSide
} from "@/lib/storefront/proof-exchange";
import { buildProductPurchaseModel, productRoutePath } from "@/lib/storefront/product-purchase";
import { resolveProductBySlug } from "@/lib/storefront/content-routing";
import { customerForAccountSurface, customerReceizHandle } from "@/lib/storefront/customer-session";
import {
  accountRouteActiveFromMobileView,
  shouldAutoResolveAccountRouteSession,
  shouldShowAccountIdentityEntry
} from "@/lib/storefront/account-route-session";
import type { ActionFeedbackState } from "@/types/action-feedback";
import type { BlogPost, CommerceState, CustomerAccount, Product, ReceizedAsset, Reward } from "@/types/domain";
import type { HostContext } from "@/lib/hosting/host-context";
import { FloatingCart } from "@/features/storefront/FloatingCart";
import { PlayCampaign } from "@/features/play/PlayCampaign";
import { ProductCatalog } from "@/features/storefront/ProductCatalog";
import { ReceizIdAccess } from "@/features/storefront/ReceizIdAccess";
import { ReceizAccountManagementPills, ReceizRecoveryPills } from "@/features/storefront/ReceizRecoveryPills";
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

const mobileViews = new Set<MobileView>(["store", "exchange", "rewards", "assets", "play", "account"]);

function mobileViewFromHash(hash: string): MobileView | null {
  const value = hash.replace(/^#/, "");
  return mobileViews.has(value as MobileView) ? (value as MobileView) : null;
}

function productSlugFromHash(hash: string) {
  const value = hash.replace(/^#/, "").trim();
  if (!value.startsWith("product=")) return null;

  try {
    return decodeURIComponent(value.slice("product=".length)).trim() || null;
  } catch {
    return value.slice("product=".length).trim() || null;
  }
}

export function PublicStorefront({
  initialHostContext,
  initialState
}: {
  initialHostContext?: HostContext;
  initialState?: CommerceState;
}) {
  const { state, actions, actionFeedback, hostContext, hydrated, receizSessionPending } = useTemplateStore(initialState, initialHostContext);
  const [mobileView, setMobileView] = useState<MobileView>("store");
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [identityUploadVisible, setIdentityUploadVisible] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartPulseProductId, setCartPulseProductId] = useState<string | null>(null);
  const [platformAccountResolving, setPlatformAccountResolving] = useState(false);
  const platformAccountAutoResolvedRef = useRef(false);
  const tenantSurface = hostContext.surface === "tenant";
  const customer = customerForAccountSurface(state, tenantSurface);
  const receizHandle = customerReceizHandle(state, customer, tenantSurface);
  const reward = state.rewards[0] ?? null;
  const campaignName = state.campaigns[0]?.name ?? "Reward Challenge";
  const homepageMode = state.storefront.homepageMode ?? "store";
  const gameEnabled = state.game.enabled || homepageMode === "game";
  const cartSummary = buildCartSummary(state);
  const selectedProduct = selectedProductSlug ? resolveProductBySlug(state, selectedProductSlug) : null;
  const identityActionsReady = hydrated && !receizSessionPending;
  const accountRouteActive = !tenantSurface && accountRouteActiveFromMobileView(mobileView);
  const showIdentityEntry = shouldShowAccountIdentityEntry({
    accountRouteActive,
    identityActionsReady,
    receizConnected: state.auth.receizId.connected,
    resolvingAccountSession: platformAccountResolving
  });
  const showIdentityUploadFallback = showIdentityEntry && (identityUploadVisible || !state.auth.receizId.connected);

  useEffect(() => {
    const syncViewFromHash = () => {
      const productSlug = productSlugFromHash(window.location.hash);
      if (productSlug) {
        setSelectedProductSlug(productSlug);
        setMobileView("store");
        return;
      }

      setSelectedProductSlug(null);
      const view = mobileViewFromHash(window.location.hash);
      if (view) {
        setMobileView(view);
      }
    };

    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  const ensureTenantCustomerSession = useCallback(
    async (reason: string) => {
      if (!tenantSurface || state.auth.receizId.connected) return true;
      if (!identityActionsReady) return false;

      await actions.ensureCustomerSession(reason);
      setIdentityUploadVisible(false);
      return true;
    },
    [actions, identityActionsReady, state.auth.receizId.connected, tenantSurface]
  );
  const resolvePlatformMerchantAccount = useCallback(async () => {
    if (
      platformAccountAutoResolvedRef.current ||
      !shouldAutoResolveAccountRouteSession({
        accountRouteActive,
        identityActionsReady,
        receizConnected: state.auth.receizId.connected,
        resolvingAccountSession: platformAccountResolving
      })
    ) {
      return;
    }

    platformAccountAutoResolvedRef.current = true;
    setPlatformAccountResolving(true);
    try {
      const connected = await actions.connectExistingReceizId();
      if (!connected) {
        await actions.signInWithReceizId();
      }
      setIdentityUploadVisible(false);
    } finally {
      setPlatformAccountResolving(false);
    }
  }, [
    accountRouteActive,
    actions,
    identityActionsReady,
    platformAccountResolving,
    state.auth.receizId.connected
  ]);
  const openProductOverlay = useCallback((product: Product) => {
    const path = productRoutePath(product);
    const hash = path.includes("#") ? path.slice(path.indexOf("#")) : `#product=${encodeURIComponent(product.id)}`;
    const slug = productSlugFromHash(hash) ?? product.id;

    setSelectedProductSlug(slug);
    setMobileView("store");
    setMobileMenuOpen(false);
    if (typeof window !== "undefined" && window.location.hash !== hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
    }
  }, []);
  const closeProductOverlay = useCallback(() => {
    setSelectedProductSlug(null);
    if (typeof window !== "undefined" && productSlugFromHash(window.location.hash)) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#store`);
    }
  }, []);
  const sealObject = () => actions.appendProofEvent("OBJECT_VERIFIED", "Coffee Pack · Serial #BC-88421");
  const issueReward = () => actions.appendProofEvent("REWARD_ISSUED", `${reward?.name ?? "Reward"} · ${state.brand.name}`);
  const triggerCartFeedback = (productId: string) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
    setCartPulseProductId(productId);
    window.setTimeout(() => {
      setCartPulseProductId((currentProductId) => (currentProductId === productId ? null : currentProductId));
    }, 650);
    setCartOpen(true);
  };
  const claimReward = () => {
    void (async () => {
      await ensureTenantCustomerSession("claim rewards");
      actions.appendProofEvent("REWARD_CLAIMED", `${reward?.name ?? "Reward"} claimed`);
    })();
  };
  const selectMobileView = (view: MobileView) => {
    setSelectedProductSlug(null);
    setMobileView(view);
    setMobileMenuOpen(false);
    if (!tenantSurface && view === "account") {
      void resolvePlatformMerchantAccount();
    }
    if (window.location.hash !== `#${view}`) {
      window.history.replaceState(null, "", `#${view}`);
    }
    if (view === "account" || view === "assets" || view === "exchange" || view === "rewards") {
      void ensureTenantCustomerSession(`${view} account`);
    }
  };
  const addToCart = (productId: string) => {
    void (async () => {
      await ensureTenantCustomerSession("cart");
      actions.addToCart(productId);
      triggerCartFeedback(productId);
    })();
  };
  const completeGame = (beans: number) => {
    void (async () => {
      await ensureTenantCustomerSession("reward game");
      actions.appendProofEvent("GAME_COMPLETED", `${campaignName} · ${beans} beans`);
    })();
  };
  const restoreIdentityArtifact = async (file: File) => {
    await actions.restoreReceizIdentityArtifact(file);
    setIdentityUploadVisible(false);
    setMobileMenuOpen(false);
  };
  const connectExistingReceizId = async () => {
    const connected = await actions.connectExistingReceizId();
    if (!connected) {
      setIdentityUploadVisible(true);
      setMobileView("account");
    }
    setMobileMenuOpen(false);
  };
  const oneClickCheckout = async () => {
    await actions.startCheckout();
    setIdentityUploadVisible(false);
    setMobileMenuOpen(false);
    if (tenantSurface) {
      setMobileView("account");
    }
  };
  const checkoutProduct = async (productId: string) => {
    await ensureTenantCustomerSession("product checkout");
    await actions.startCheckout(productId);
    setIdentityUploadVisible(false);
    setMobileMenuOpen(false);
    if (tenantSurface) {
      setMobileView("account");
    }
  };
  const selectExchangeAsset = (assetId: string) => {
    actions.selectExchangeAsset(assetId);
    setMobileMenuOpen(false);
  };
  const listExchangeAsset = async (file?: File) => {
    await actions.listExchangeAsset(file);
    setMobileView("exchange");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };
  const tradeExchangeAsset = (assetId: string, side: ExchangeTradeSide, shares: number) => {
    actions.tradeExchangeAsset(assetId, side, shares);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(side === "buy" ? 16 : 10);
    }
  };
  const provideExchangeLiquidity = (assetId: string, amountCents: number) => {
    actions.provideExchangeLiquidity(assetId, amountCents);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
  };

  useEffect(() => {
    if (homepageMode === "game") {
      setMobileView("play");
    } else if (homepageMode === "exchange") {
      setMobileView("exchange");
    } else if (homepageMode === "blog") {
      setMobileView("store");
    }
  }, [homepageMode]);

  useEffect(() => {
    if (mobileView === "account" || mobileView === "assets" || mobileView === "exchange" || mobileView === "rewards") {
      void ensureTenantCustomerSession(`${mobileView} account`);
    }
  }, [ensureTenantCustomerSession, mobileView]);

  useEffect(() => {
    if (!accountRouteActive) {
      platformAccountAutoResolvedRef.current = false;
    }
  }, [accountRouteActive]);

  useEffect(() => {
    if (!tenantSurface && mobileView === "account") {
      void resolvePlatformMerchantAccount();
    }
  }, [mobileView, resolvePlatformMerchantAccount, tenantSurface]);

  useEffect(() => {
    if (!cartSummary.lines.length) {
      setCartOpen(false);
    }
  }, [cartSummary.lines.length]);

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

            {homepageMode === "blog" ? (
              <>
                <BlogHomeSection
                  posts={state.blogPosts}
                  showAdminActions={!tenantSurface}
                  state={state}
                />
                <ProductCatalog
                  addedProductId={cartPulseProductId}
                  brandImageUrl={state.brand.logoImageUrl}
                  brandLabel={state.brand.logoText}
                  products={state.products}
                  onAddToCart={addToCart}
                  onProductOpen={openProductOverlay}
                  showAdminActions={!tenantSurface}
                  showCartActions={tenantSurface}
                />
                <PlayCampaign
                  campaignName={campaignName}
                  enabled={gameEnabled}
                  onComplete={completeGame}
                />
              </>
            ) : homepageMode === "exchange" ? (
              <>
                <ExchangeTradingDesk
                  listAssetFeedback={actionFeedback["exchange.listAsset"]}
                  onListAsset={listExchangeAsset}
                  onProvideLiquidity={provideExchangeLiquidity}
                  onSelectAsset={selectExchangeAsset}
                  onTrade={tradeExchangeAsset}
                  state={state}
                  tenantSurface={tenantSurface}
                />
                <ProductCatalog
                  addedProductId={cartPulseProductId}
                  brandImageUrl={state.brand.logoImageUrl}
                  brandLabel={state.brand.logoText}
                  products={state.products}
                  onAddToCart={addToCart}
                  onProductOpen={openProductOverlay}
                  showAdminActions={!tenantSurface}
                  showCartActions={tenantSurface}
                />
                <BlogHighlights posts={state.blogPosts} showAdminActions={!tenantSurface} />
              </>
            ) : homepageMode === "game" ? (
              <>
                <PlayCampaign
                  campaignName={campaignName}
                  enabled={gameEnabled}
                  onComplete={completeGame}
                />
                <ProductCatalog
                  addedProductId={cartPulseProductId}
                  brandImageUrl={state.brand.logoImageUrl}
                  brandLabel={state.brand.logoText}
                  products={state.products}
                  onAddToCart={addToCart}
                  onProductOpen={openProductOverlay}
                  showAdminActions={!tenantSurface}
                  showCartActions={tenantSurface}
                />
                <BlogHighlights posts={state.blogPosts} showAdminActions={!tenantSurface} />
              </>
            ) : (
              <>
                <HeroProduct
                  onCheckout={oneClickCheckout}
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
                  enabled={gameEnabled}
                  onComplete={completeGame}
                />

                <ProductCatalog
                  addedProductId={cartPulseProductId}
                  brandImageUrl={state.brand.logoImageUrl}
                  brandLabel={state.brand.logoText}
                  products={state.products}
                  onAddToCart={addToCart}
                  onProductOpen={openProductOverlay}
                  showAdminActions={!tenantSurface}
                  showCartActions={tenantSurface}
                />
                <ExchangeTradingDesk
                  compact
                  listAssetFeedback={actionFeedback["exchange.listAsset"]}
                  onListAsset={listExchangeAsset}
                  onProvideLiquidity={provideExchangeLiquidity}
                  onSelectAsset={selectExchangeAsset}
                  onTrade={tradeExchangeAsset}
                  state={state}
                  tenantSurface={tenantSurface}
                />

                <BlogHighlights posts={state.blogPosts} showAdminActions={!tenantSurface} />
              </>
            )}

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
              identityActionsReady={identityActionsReady}
              onDownloadIdentitySeal={actions.downloadIdentitySealImage}
              onExistingReceizId={connectExistingReceizId}
              onRestoreArtifact={restoreIdentityArtifact}
              receizId={state.auth.receizId}
              showUploadFallback={showIdentityUploadFallback}
            />
            <RewardDeck
              brandImageUrl={state.brand.logoImageUrl}
              brandLabel={state.brand.logoText}
              customer={customer}
              reward={reward}
              showAdminActions={!tenantSurface}
            />
            {tenantSurface ? (
              <CartSummaryPanel
                checkoutFeedback={actionFeedback.checkout}
                onCheckout={oneClickCheckout}
                onQuantityChange={actions.setCartProductQuantity}
                onRemove={actions.removeFromCart}
                summary={cartSummary}
              />
            ) : null}
            {tenantSurface ? null : <SealEvents events={state.proofEvents} />}
          </aside>
        </div>
        <MobileStage
          activeView={mobileView}
          addedProductId={cartPulseProductId}
          customer={customer}
          customerReceizHandle={receizHandle}
          onAddToCart={addToCart}
          onCheckout={oneClickCheckout}
          onProductOpen={openProductOverlay}
          exchangeListAssetFeedback={actionFeedback["exchange.listAsset"]}
          onExchangeListAsset={listExchangeAsset}
          onExchangeLiquidity={provideExchangeLiquidity}
          onExchangeSelectAsset={selectExchangeAsset}
          onExchangeTrade={tradeExchangeAsset}
          checkoutFeedback={actionFeedback.checkout}
          onClaimReward={claimReward}
          onDownloadIdentitySeal={actions.downloadIdentitySealImage}
          onIssueReward={issueReward}
          onQuantityChange={actions.setCartProductQuantity}
          onRemoveFromCart={actions.removeFromCart}
          onSeal={sealObject}
          onExistingReceizId={connectExistingReceizId}
          onRestoreArtifact={restoreIdentityArtifact}
          showIdentityEntry={showIdentityEntry}
          showIdentityUpload={showIdentityUploadFallback}
          tenantSurface={tenantSurface}
          onPlayComplete={completeGame}
          campaignName={campaignName}
          reward={reward}
          state={state}
        />
        {selectedProduct ? (
          <ProductPagePopover
            addedProductId={cartPulseProductId}
            checkoutFeedback={actionFeedback.checkout}
            onAddToCart={addToCart}
            onCheckout={checkoutProduct}
            onClose={closeProductOverlay}
            product={selectedProduct}
            state={state}
            tenantSurface={tenantSurface}
          />
        ) : null}
        <MobileCommandMenu
          activeView={mobileView}
          homepageMode={homepageMode}
          onClose={() => setMobileMenuOpen(false)}
          onNavigate={selectMobileView}
          onSeal={sealObject}
          onExistingReceizId={connectExistingReceizId}
          open={mobileMenuOpen}
          showIdentityEntry={showIdentityEntry}
          state={state}
          tenantSurface={tenantSurface}
          customerReceizHandle={receizHandle}
        />
        {tenantSurface ? (
          <FloatingCart
            checkoutFeedback={actionFeedback.checkout}
            onCheckout={oneClickCheckout}
            onClose={() => setCartOpen(false)}
            onOpen={() => setCartOpen(true)}
            onQuantityChange={actions.setCartProductQuantity}
            onRemove={actions.removeFromCart}
            open={cartOpen}
            summary={cartSummary}
          />
        ) : null}
        <BottomNav activeView={mobileView} onChange={selectMobileView} storeLabel={homepageMode === "blog" ? "Blog" : "Store"} />
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

function BlogHomeSection({
  posts,
  showAdminActions,
  state
}: {
  posts: BlogPost[];
  showAdminActions: boolean;
  state: CommerceState;
}) {
  const visiblePosts = posts.filter((post) => post.status === "published" || showAdminActions);
  const featuredPost = visiblePosts.find((post) => post.featured) ?? visiblePosts[0];
  const roll = featuredPost
    ? visiblePosts.filter((post) => post.id !== featuredPost.id).slice(0, 4)
    : [];

  return (
    <section className="panel blog-home-panel" id="blog">
      <SectionHeader
        title="Blog"
        action={showAdminActions ? <Button onClick={() => window.location.assign("/admin")} variant="outline">Add post</Button> : <StatusPill tone="green">Latest</StatusPill>}
      />
      {featuredPost ? (
        <div className="blog-home-layout">
          <article className="blog-home-hero">
            <div className="blog-home-cover">
              {featuredPost.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={featuredPost.coverImageUrl} />
              ) : (
                <BrandMark imageUrl={state.brand.logoImageUrl} label={state.brand.logoText} />
              )}
            </div>
            <div>
              <span>{featuredPost.tags.slice(0, 3).join(" · ") || state.brand.name}</span>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.excerpt}</p>
              <a className="blog-home-link" href={featuredPost.slug}>Read story</a>
            </div>
          </article>
          <div className="blog-roll-list" aria-label="Latest stories">
            {(roll.length ? roll : visiblePosts.slice(0, 3)).map((post) => (
              <a href={post.slug} key={post.id}>
                <span>{post.tags[0] ?? "Story"}</span>
                <strong>{post.title}</strong>
                <em>{post.excerpt}</em>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="panel-empty-state">
          <Icons.book size={22} />
          <strong>No posts yet</strong>
          <span>Add blog posts in Admin Studio to use Blog as the homepage.</span>
        </div>
      )}
    </section>
  );
}

function MobileCommandMenu({
  activeView,
  homepageMode,
  onClose,
  onExistingReceizId,
  onNavigate,
  onSeal,
  open,
  showIdentityEntry,
  state,
  customerReceizHandle,
  tenantSurface
}: {
  activeView: MobileView;
  customerReceizHandle: string;
  homepageMode: CommerceState["storefront"]["homepageMode"];
  onClose: () => void;
  onExistingReceizId: () => void | Promise<void>;
  onNavigate: (view: MobileView) => void;
  onSeal: () => void;
  open: boolean;
  showIdentityEntry: boolean;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  const navItems = [
    ["store", homepageMode === "blog" ? "Blog" : "Store", homepageMode === "blog" ? Icons.book : Icons.store],
    ["exchange", "Exchange", Icons.analytics],
    ["rewards", "Rewards", Icons.gift],
    ["assets", "Assets", Icons.assets],
    ["play", "Play", Icons.game],
    ["account", "Account", Icons.user]
  ] as const;

  const runAction = (action: () => void | Promise<void>) => {
    void action();
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
          {showIdentityEntry ? (
            <OfficialReceizLoginButton
              className="mobile-command-receiz-login"
              onClick={() => runAction(onExistingReceizId)}
            />
          ) : null}
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

function StorefrontProductDetail({
  addedProductId,
  checkoutFeedback,
  onAddToCart,
  onBack,
  onCheckout,
  product,
  state,
  tenantSurface
}: {
  addedProductId?: string | null;
  checkoutFeedback?: ActionFeedbackState;
  onAddToCart: (productId: string) => void;
  onBack: () => void;
  onCheckout: (productId: string) => void | Promise<void>;
  product: Product;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  const model = buildProductPurchaseModel(state, product);

  return (
    <>
      <section className="product-detail-hero storefront-product-detail">
        <div className="product-detail-media">
          <ProductVisual brandImageUrl={state.brand.logoImageUrl} brandLabel={state.brand.logoText} product={product} />
        </div>
        <div className="product-detail-copy">
          <StatusPill tone={product.sealed ? "green" : "neutral"}>
            {product.sealed ? "Proof sealed" : "Ready to seal"}
          </StatusPill>
          <h1>{product.name}</h1>
          <p>{product.description ?? product.subtitle}</p>
          <div className="product-purchase-panel">
            <div className="product-purchase-card">
              <div>
                <StatusPill tone="green">Receiz checkout</StatusPill>
                <strong>{model.priceLabel}</strong>
                <span>{model.inventoryLabel} available</span>
              </div>
              {tenantSurface ? (
                <>
                  <div className="product-purchase-actions">
                    <Button onClick={() => void onCheckout(product.id)} type="button" variant="primary">
                      <Icons.creditCard size={17} />
                      {checkoutFeedback?.status === "pending"
                        ? "Starting checkout"
                        : checkoutFeedback?.status === "success"
                          ? "Checkout recorded"
                          : model.primaryActionLabel}
                    </Button>
                    <Button
                      className={addedProductId === product.id ? "cart-add-button product-cart-action added" : "cart-add-button product-cart-action"}
                      onClick={() => onAddToCart(product.id)}
                      type="button"
                      variant="outline"
                    >
                      <Icons.cart size={17} />
                      {addedProductId === product.id ? "Added to cart" : model.secondaryActionLabel}
                    </Button>
                  </div>
                  <InlineActionFeedback feedback={checkoutFeedback} />
                </>
              ) : (
                <div className="product-platform-actions">
                  <Link className="button button-primary" href="/admin">
                    <Icons.sliders size={17} />
                    Edit in Admin Studio
                  </Link>
                </div>
              )}
              <button className="product-purchase-secondary-link" onClick={onBack} type="button">
                Back to store
              </button>
            </div>
            <div className="product-purchase-facts">
              {model.proofFacts.map((fact) => (
                <div key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="detail-proof-band">
        <div>
          <strong>Receiz proof object</strong>
          <span>{product.type.replace("_", " ")} · rewards {product.rewardEligible ? "eligible" : "off"}</span>
        </div>
        <div>
          <strong>Settlement</strong>
          <span>{state.hosting.merchantReceizId}</span>
        </div>
        <div>
          <strong>Store</strong>
          <span>{state.hosting.customDomain.domain || state.hosting.subdomain}</span>
        </div>
      </section>
    </>
  );
}

function ProductPagePopover({
  addedProductId,
  checkoutFeedback,
  onAddToCart,
  onCheckout,
  onClose,
  product,
  state,
  tenantSurface
}: {
  addedProductId?: string | null;
  checkoutFeedback?: ActionFeedbackState;
  onAddToCart: (productId: string) => void;
  onCheckout: (productId: string) => void | Promise<void>;
  onClose: () => void;
  product: Product;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  return (
    <div aria-modal="true" className="product-page-popover" role="dialog">
      <div className="product-page-popover-shell">
        <div className="product-page-popover-topbar">
          <button aria-label="Back to store" className="icon-button" onClick={onClose} type="button">
            <Icons.chevronLeft size={19} />
          </button>
          <div>
            <span>{state.hosting.customDomain.domain || state.hosting.subdomain}</span>
            <strong>{product.name}</strong>
          </div>
          <button aria-label="Close product" className="icon-button" onClick={onClose} type="button">
            <Icons.close size={18} />
          </button>
        </div>
        <div className="product-page-popover-body">
          <StorefrontProductDetail
            addedProductId={addedProductId}
            checkoutFeedback={checkoutFeedback}
            onAddToCart={onAddToCart}
            onBack={onClose}
            onCheckout={onCheckout}
            product={product}
            state={state}
            tenantSurface={tenantSurface}
          />
        </div>
      </div>
    </div>
  );
}

function MobileProductDetailPanel({
  active,
  addedProductId,
  checkoutFeedback,
  onAddToCart,
  onBack,
  onCheckout,
  product,
  state,
  tenantSurface
}: {
  active: boolean;
  addedProductId?: string | null;
  checkoutFeedback?: ActionFeedbackState;
  onAddToCart: (productId: string) => void;
  onBack: () => void;
  onCheckout: (productId: string) => void | Promise<void>;
  product: Product;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  return (
    <MobilePane active={active} action={<StatusPill tone="green">{product.priceLabel}</StatusPill>} title="Product">
      <StorefrontProductDetail
        addedProductId={addedProductId}
        checkoutFeedback={checkoutFeedback}
        onAddToCart={onAddToCart}
        onBack={onBack}
        onCheckout={onCheckout}
        product={product}
        state={state}
        tenantSurface={tenantSurface}
      />
    </MobilePane>
  );
}

function MobileStage({
  activeView,
  addedProductId,
  campaignName,
  customer,
  checkoutFeedback,
  exchangeListAssetFeedback,
  onAddToCart,
  onCheckout,
  onExchangeListAsset,
  onExchangeLiquidity,
  onExchangeSelectAsset,
  onExchangeTrade,
  onProductOpen,
  onClaimReward,
  onDownloadIdentitySeal,
  onExistingReceizId,
  onIssueReward,
  onPlayComplete,
  onQuantityChange,
  onRemoveFromCart,
  onRestoreArtifact,
  onSeal,
  reward,
  showIdentityEntry,
  showIdentityUpload,
  state,
  customerReceizHandle,
  tenantSurface
}: {
  activeView: MobileView;
  addedProductId?: string | null;
  campaignName: string;
  customer: CustomerAccount;
  checkoutFeedback?: ActionFeedbackState;
  customerReceizHandle: string;
  exchangeListAssetFeedback?: ActionFeedbackState;
  onAddToCart: (productId: string) => void;
  onCheckout: () => void;
  onExchangeListAsset: (file?: File) => void | Promise<void>;
  onExchangeLiquidity: (assetId: string, amountCents: number) => void;
  onExchangeSelectAsset: (assetId: string) => void;
  onExchangeTrade: (assetId: string, side: ExchangeTradeSide, shares: number) => void;
  onProductOpen: (product: Product) => void;
  onClaimReward: () => void;
  onDownloadIdentitySeal: () => void | Promise<void>;
  onExistingReceizId: () => void | Promise<void>;
  onIssueReward: () => void;
  onPlayComplete: (beans: number) => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onRestoreArtifact: (file: File) => void | Promise<void>;
  onSeal: () => void;
  reward: Reward | null;
  showIdentityEntry: boolean;
  showIdentityUpload: boolean;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  return (
    <div className="mobile-stage" data-active-view={activeView}>
      <MobileStorePanel
        active={activeView === "store"}
        addedProductId={addedProductId}
        blogPosts={state.blogPosts}
        collections={state.collections}
        onAddToCart={onAddToCart}
        onCheckout={onCheckout}
        onProductOpen={onProductOpen}
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
      <MobileExchangePanel
        active={activeView === "exchange"}
        listAssetFeedback={exchangeListAssetFeedback}
        onListAsset={onExchangeListAsset}
        onProvideLiquidity={onExchangeLiquidity}
        onSelectAsset={onExchangeSelectAsset}
        onTrade={onExchangeTrade}
        state={state}
        tenantSurface={tenantSurface}
      />
      <MobileAssetsPanel
        active={activeView === "assets"}
        assets={state.assets}
        customerReceizHandle={customerReceizHandle}
        onDownloadIdentitySeal={onDownloadIdentitySeal}
        onExistingReceizId={onExistingReceizId}
        onRestoreArtifact={onRestoreArtifact}
        showIdentityEntry={showIdentityEntry}
        showIdentityUpload={showIdentityUpload}
        state={state}
        tenantSurface={tenantSurface}
      />
      <MobilePlayPanel
        active={activeView === "play"}
        campaignName={campaignName}
        enabled={state.game.enabled || state.storefront.homepageMode === "game"}
        onComplete={onPlayComplete}
      />
      <MobileAccountPanel
        active={activeView === "account"}
        checkoutFeedback={checkoutFeedback}
        customer={customer}
        customerReceizHandle={customerReceizHandle}
        onCheckout={onCheckout}
        onDownloadIdentitySeal={onDownloadIdentitySeal}
        onExistingReceizId={onExistingReceizId}
        onQuantityChange={onQuantityChange}
        onRemoveFromCart={onRemoveFromCart}
        onRestoreArtifact={onRestoreArtifact}
        showIdentityEntry={showIdentityEntry}
        showIdentityUpload={showIdentityUpload}
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
      {active ? (
        <>
          <div className="mobile-pane-heading">
            <h2>{title}</h2>
            {action}
          </div>
          {children}
        </>
      ) : null}
    </section>
  );
}

function CartSummaryPanel({
  checkoutFeedback,
  compact = false,
  onCheckout,
  onQuantityChange,
  onRemove,
  summary
}: {
  checkoutFeedback?: ActionFeedbackState;
  compact?: boolean;
  onCheckout: () => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  summary: CartSummary;
}) {
  return (
    <Panel className={compact ? "cart-summary-panel compact" : "cart-summary-panel"}>
      <SectionHeader
        title="Cart"
        action={<StatusPill tone={summary.canCheckout ? "green" : "neutral"}>{summary.itemCount} items</StatusPill>}
      />
      {summary.lines.length ? (
        <div className="cart-summary-lines">
          {summary.lines.map((line) => (
            <div className="cart-summary-line" key={line.productId}>
              <div className="cart-summary-line-top">
                <a className="cart-summary-line-link" href={line.productPath}>
                  <strong>{line.name}</strong>
                  <span>{line.subtitle}</span>
                </a>
                <em>{line.lineTotalLabel}</em>
              </div>
              <div className="cart-summary-controls">
                <button
                  aria-label={`Decrease ${line.name} quantity`}
                  disabled={line.quantity <= 1}
                  onClick={() => onQuantityChange(line.productId, line.quantity - 1)}
                  type="button"
                >
                  -
                </button>
                <span aria-label={`${line.name} quantity`}>{line.quantity}</span>
                <button
                  aria-label={`Increase ${line.name} quantity`}
                  onClick={() => onQuantityChange(line.productId, line.quantity + 1)}
                  type="button"
                >
                  +
                </button>
                <button
                  aria-label={`Remove ${line.name} from cart`}
                  onClick={() => onRemove(line.productId)}
                  type="button"
                >
                  <Icons.close size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cart-summary-empty">
          <Icons.cart size={20} />
          <strong>Your cart is ready</strong>
          <span>Add a product to unlock checkout.</span>
        </div>
      )}
      <div className="cart-summary-total">
        <span>{summary.paymentRailLabel}</span>
        <strong>{summary.subtotalLabel}</strong>
      </div>
      <Button disabled={!summary.canCheckout} onClick={onCheckout} type="button" variant="primary">
        <Icons.creditCard size={16} />
        {checkoutFeedback?.status === "pending" ? "Starting checkout" : checkoutFeedback?.status === "success" ? "Checkout recorded" : summary.checkoutLabel}
      </Button>
      <InlineActionFeedback feedback={checkoutFeedback} />
      <span className="cart-summary-host">{summary.tenantHost}</span>
    </Panel>
  );
}

function ExchangeTradingDesk({
  compact = false,
  listAssetFeedback,
  onListAsset,
  onProvideLiquidity,
  onSelectAsset,
  onTrade,
  state,
  tenantSurface: _tenantSurface
}: {
  compact?: boolean;
  listAssetFeedback?: ActionFeedbackState;
  onListAsset: (file?: File) => void | Promise<void>;
  onProvideLiquidity: (assetId: string, amountCents: number) => void;
  onSelectAsset: (assetId: string) => void;
  onTrade: (assetId: string, side: ExchangeTradeSide, shares: number) => void;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  const desk = projectExchangeDesk(state);
  const selected = desk.selected;
  const selectedRaw = selected ? state.exchange.assets.find((asset) => asset.id === selected.id) ?? null : null;
  const [side, setSide] = useState<ExchangeTradeSide>("buy");
  const [shares, setShares] = useState(8);
  const [liquidityCents, setLiquidityCents] = useState(5_000);
  const [pulse, setPulse] = useState(false);
  const [listingUploadPending, setListingUploadPending] = useState(false);
  const preview = selectedRaw ? buildExchangeTradePreview(selectedRaw, side, shares, state.exchange.walletBalanceCents) : null;
  const listInputId = compact ? "mobile-exchange-proof-object" : "desktop-exchange-proof-object";

  const runTrade = () => {
    if (!selectedRaw || !preview?.shares) return;
    onTrade(selectedRaw.id, side, preview.shares);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 700);
  };

  const runLiquidity = () => {
    if (!selectedRaw) return;
    onProvideLiquidity(selectedRaw.id, liquidityCents);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 700);
  };

  const handleListAssetFile = async (file: File | undefined) => {
    if (!file) return;
    setListingUploadPending(true);
    try {
      await onListAsset(file);
    } finally {
      setListingUploadPending(false);
    }
  };

  return (
    <section className={compact ? "exchange-desk compact" : "exchange-desk"} id="exchange">
      <SectionHeader
        title={desk.headline}
        action={<StatusPill tone={desk.enabled ? "green" : "neutral"}>{desk.enabled ? "Live proof market" : "Off"}</StatusPill>}
      />
      <div className="exchange-terminal">
        <aside className="exchange-market-list" aria-label="Exchange markets">
          <div className="exchange-terminal-kicker">
            <Icons.analytics size={17} />
            <span>Proof markets</span>
          </div>
          <input
            accept=".json,application/json,image/png,image/jpeg,image/webp"
            className="exchange-proof-object-input"
            id={listInputId}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              void handleListAssetFile(file);
              event.currentTarget.value = "";
            }}
            type="file"
          />
          <label
            aria-busy={listingUploadPending}
            className={listingUploadPending ? "exchange-list-asset-button pending" : "exchange-list-asset-button"}
            htmlFor={listInputId}
          >
            <Icons.seal size={18} />
            <span>{listingUploadPending ? "Verifying" : "List asset"}</span>
          </label>
          <InlineActionFeedback className="exchange-list-feedback" feedback={listAssetFeedback} />
          {desk.assets.length ? (
            desk.assets.map((asset) => (
              <button
                aria-pressed={selected?.id === asset.id}
                className={selected?.id === asset.id ? "active" : undefined}
                key={asset.id}
                onClick={() => onSelectAsset(asset.id)}
                type="button"
              >
                <span>
                  <strong>{asset.symbol}</strong>
                  <em>{asset.title}</em>
                </span>
                <b>{asset.latestPriceLabel}</b>
                <small className={asset.change24hBps >= 0 ? "positive" : "negative"}>{asset.changeLabel}</small>
              </button>
            ))
          ) : (
            <div className="exchange-empty-list">
              <Icons.assets size={20} />
              <strong>No listed assets</strong>
              <span>List a Receiz asset to open the market.</span>
            </div>
          )}
        </aside>

        {selected && selectedRaw && preview ? (
          <>
            <div className="exchange-chart-column">
              <div className="exchange-asset-header">
                <div>
                  <span>{selected.sourcePrimitive}</span>
                  <h3>{selected.title}</h3>
                  <p>{desk.subheadline}</p>
                </div>
                <div className="exchange-price-block">
                  <strong>{selected.latestPriceLabel}</strong>
                  <span className={selected.change24hBps >= 0 ? "positive" : "negative"}>{selected.changeLabel}</span>
                </div>
              </div>

              <div className="exchange-metric-grid">
                <div><span>Deterministic value</span><strong>{selected.deterministicValueLabel}</strong></div>
                <div><span>Liquidity</span><strong>{selected.liquidityLabel}</strong></div>
                <div><span>24h volume</span><strong>{selected.volumeLabel}</strong></div>
                <div><span>Spread</span><strong>{selected.spreadLabel}</strong></div>
              </div>

              <div className={pulse ? "exchange-chart-wrap pulse" : "exchange-chart-wrap"}>
                <ExchangeChart asset={selected} />
              </div>

              <div className="exchange-proof-strip">
                <div>
                  <span>Proof head</span>
                  <strong>{desk.proofMemoryHead.afterKaiUpulse ?? selected.manifest.proof.kaiPulseEternal}</strong>
                </div>
                <div>
                  <span>Anchor</span>
                  <strong>{desk.proofMemoryHead.afterEntryId ?? selected.appendEvents[0]?.appendAnchorId ?? "local"}</strong>
                </div>
                <a href={selected.manifest.links.verify} rel="noreferrer" target="_blank">
                  Verify object
                </a>
              </div>
            </div>

            <aside className="exchange-trade-column">
              <div className="exchange-ticket">
                <div className="exchange-ticket-toggle">
                  <button className={side === "buy" ? "active" : undefined} onClick={() => setSide("buy")} type="button">Buy</button>
                  <button className={side === "sell" ? "active" : undefined} onClick={() => setSide("sell")} type="button">Sell</button>
                </div>
                <label>
                  <span>Shares</span>
                  <input
                    min={1}
                    max={side === "buy" ? selected.availableShares : Math.max(1, selected.userShares)}
                    onChange={(event) => setShares(Math.max(1, Number(event.target.value) || 1))}
                    type="number"
                    value={shares}
                  />
                </label>
                <div className="exchange-ticket-preview">
                  <div><span>Price</span><strong>{selected.latestPriceLabel}</strong></div>
                  <div><span>Total</span><strong>{preview.totalLabel}</strong></div>
                  <div><span>Wallet</span><strong>{preview.walletAppliedLabel}</strong></div>
                  <div><span>Card delta</span><strong>{preview.cardDeltaLabel}</strong></div>
                </div>
                <Button className={pulse ? "exchange-trade-button pulse" : "exchange-trade-button"} onClick={runTrade} type="button" variant="primary">
                  <Icons.receiz size={17} />
                  {side === "buy" ? "Buy shares" : "Sell shares"}
                </Button>
                <span className="exchange-ticket-note">
                  {preview.cardRequired ? "Receiz wallet funds first, card funds the delta." : desk.walletFirstLabel}
                </span>
              </div>

              <div className="exchange-liquidity-box">
                <div>
                  <strong>Provide liquidity</strong>
                  <span>Append deterministic liquidity for this asset market.</span>
                </div>
                <label>
                  <span>Amount</span>
                  <input
                    min={100}
                    onChange={(event) => setLiquidityCents(Math.max(100, Math.round((Number(event.target.value) || 0) * 100)))}
                    type="number"
                    value={Math.round(liquidityCents / 100)}
                  />
                </label>
                <Button onClick={runLiquidity} type="button" variant="outline">
                  <Icons.analytics size={17} />
                  Add liquidity
                </Button>
              </div>
            </aside>

            <aside className="exchange-depth-column">
              <ExchangeOrderBook asset={selected} />
              <ExchangeProofTape asset={selected} />
            </aside>
          </>
        ) : (
          <div className="exchange-empty-state">
            <Icons.assets size={24} />
            <strong>Open the first market</strong>
            <span>List a Receiz asset to create the first proof-object exchange book.</span>
            <label className="button button-primary exchange-empty-upload-button" htmlFor={listInputId}>List asset</label>
          </div>
        )}
      </div>
    </section>
  );
}

function ExchangeChart({ asset }: { asset: ReturnType<typeof projectExchangeDesk>["selected"] }) {
  if (!asset) return null;
  const points = asset.chart.length ? asset.chart : [];
  const prices = points.map((point) => point.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const spread = Math.max(1, max - min);
  const polyline = points
    .map((point, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 88 - ((point.priceCents - min) / spread) * 70;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const last = polyline.split(" ").at(-1) ?? "100,20";

  return (
    <div className="exchange-chart">
      <svg aria-label={`${asset.symbol} live price chart`} preserveAspectRatio="none" role="img" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`exchange-chart-${asset.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,168,138,0.35)" />
            <stop offset="100%" stopColor="rgba(0,168,138,0.02)" />
          </linearGradient>
        </defs>
        <polygon className="exchange-chart-area" points={`0,100 ${polyline} 100,100`} fill={`url(#exchange-chart-${asset.id})`} />
        <polyline className="exchange-chart-line" points={polyline} />
        <circle className="exchange-chart-live-dot" cx={last.split(",")[0]} cy={last.split(",")[1]} r="2.2" />
      </svg>
      <div className="exchange-chart-axis">
        <span>{asset.chart[0]?.kaiPulse ?? asset.manifest.proof.kaiPulseEternal}</span>
        <strong>{asset.latestPriceLabel}</strong>
        <span>{asset.chart.at(-1)?.kaiPulse ?? asset.manifest.proof.kaiPulseEternal}</span>
      </div>
    </div>
  );
}

function ExchangeOrderBook({ asset }: { asset: NonNullable<ReturnType<typeof projectExchangeDesk>["selected"]> }) {
  return (
    <div className="exchange-order-book">
      <div className="exchange-mini-head">
        <strong>Order book</strong>
        <span>{asset.spreadLabel} spread</span>
      </div>
      <div className="exchange-book-side asks">
        {asset.orderBook.asks.slice(0, 4).map((line) => (
          <div key={line.id}>
            <span>{line.shares}</span>
            <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(line.priceCents / 100)}</strong>
          </div>
        ))}
      </div>
      <div className="exchange-mid-price">
        <strong>{asset.latestPriceLabel}</strong>
        <span>{asset.availableShares} shares available</span>
      </div>
      <div className="exchange-book-side bids">
        {asset.orderBook.bids.slice(0, 4).map((line) => (
          <div key={line.id}>
            <span>{line.shares}</span>
            <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(line.priceCents / 100)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExchangeProofTape({ asset }: { asset: NonNullable<ReturnType<typeof projectExchangeDesk>["selected"]> }) {
  return (
    <div className="exchange-proof-tape">
      <div className="exchange-mini-head">
        <strong>Live append tape</strong>
        <span><i /> Live</span>
      </div>
      {asset.appendEvents.slice(0, 5).map((event) => (
        <div className="exchange-tape-row" key={event.id}>
          <Icons.seal size={16} />
          <div>
            <strong>{event.type}</strong>
            <span>{event.detail}</span>
            <em>{event.kaiPulse} · {event.appendAnchorId}</em>
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileExchangePanel({
  active,
  listAssetFeedback,
  onListAsset,
  onProvideLiquidity,
  onSelectAsset,
  onTrade,
  state,
  tenantSurface
}: {
  active: boolean;
  listAssetFeedback?: ActionFeedbackState;
  onListAsset: (file?: File) => void | Promise<void>;
  onProvideLiquidity: (assetId: string, amountCents: number) => void;
  onSelectAsset: (assetId: string) => void;
  onTrade: (assetId: string, side: ExchangeTradeSide, shares: number) => void;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  const selected = projectExchangeDesk(state).selected;

  return (
    <MobilePane active={active} action={<StatusPill tone="green">{selected?.symbol ?? "Live"}</StatusPill>} title="Exchange">
      <ExchangeTradingDesk
        compact
        listAssetFeedback={listAssetFeedback}
        onListAsset={onListAsset}
        onProvideLiquidity={onProvideLiquidity}
        onSelectAsset={onSelectAsset}
        onTrade={onTrade}
        state={state}
        tenantSurface={tenantSurface}
      />
    </MobilePane>
  );
}

function MobileStorePanel({
  active,
  addedProductId,
  products,
  blogPosts,
  collections,
  state,
  tenantSurface,
  onAddToCart,
  onCheckout,
  onProductOpen,
  onSeal
}: {
  active: boolean;
  addedProductId?: string | null;
  blogPosts: BlogPost[];
  collections: CommerceState["collections"];
  products: Product[];
  state: CommerceState;
  tenantSurface: boolean;
  onAddToCart: (productId: string) => void;
  onCheckout: () => void;
  onProductOpen: (product: Product) => void;
  onSeal: () => void;
}) {
  const firstProduct = products[0];
  const firstPost = blogPosts.find((post) => post.status === "published") ?? blogPosts[0];
  const visibleCollections = collections.filter((collection) => collection.published).slice(0, 5);
  const categoryLabels = visibleCollections.length
    ? visibleCollections.map((collection) => collection.name)
    : ["Featured", "Access", "Rewards", "Drops"];
  const blogHome = state.storefront.homepageMode === "blog";
  const visibleHost = state.hosting.customDomain.domain || state.hosting.subdomain;
  const heroBody = state.storefront.heroBody || state.storefront.subheadline || state.brand.tagline;

  return (
    <MobilePane active={active} action={<StatusPill tone="green">{blogHome ? "Stories" : "Live"}</StatusPill>} title={blogHome ? "Blog" : "Store"}>
      {blogHome ? (
        <MobileBlogHome posts={blogPosts} state={state} />
      ) : (
        <>
      <div className="mobile-shop-hero">
        <div>
          <span>{visibleHost}</span>
          <h3>{state.brand.name}</h3>
          <p>{heroBody}</p>
          <div className="mobile-shop-actions">
            <button onClick={onCheckout} type="button">
              {state.storefront.ctaLabel || "Shop now"}
            </button>
            {tenantSurface ? null : (
              <button onClick={onSeal} type="button">
                Seal object
              </button>
            )}
          </div>
        </div>
        {firstProduct ? (
          <button className="mobile-featured-product" onClick={() => onProductOpen(firstProduct)} type="button">
            <BrandMark imageUrl={state.brand.logoImageUrl} label={state.brand.logoText} />
            <strong>{firstProduct.name}</strong>
            <small>{firstProduct.priceLabel}</small>
          </button>
        ) : (
          <div className="mobile-featured-product">
            <BrandMark imageUrl={state.brand.logoImageUrl} label={state.brand.logoText} />
            <strong>Add products</strong>
            <small>Ready</small>
          </div>
        )}
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
            <article
              className="clickable-product-card"
              key={product.id}
              onClick={() => onProductOpen(product)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onProductOpen(product);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-mini-product-link">
                <ProductVisual brandImageUrl={state.brand.logoImageUrl} brandLabel={state.brand.logoText} product={product} />
                <div className="mobile-mini-product-copy">
                  <strong>{product.name}</strong>
                  <span>{product.subtitle}</span>
                  <b>{product.priceLabel}</b>
                </div>
              </div>
              {tenantSurface ? (
                <button
                  aria-label={`Add ${product.name} to cart`}
                  className={addedProductId === product.id ? "cart-add-button added" : "cart-add-button"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddToCart(product.id);
                  }}
                  type="button"
                >
                  <Icons.cart size={16} />
                </button>
              ) : null}
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
        </>
      )}
    </MobilePane>
  );
}

function MobileBlogHome({
  posts,
  state
}: {
  posts: BlogPost[];
  state: CommerceState;
}) {
  const visiblePosts = posts.filter((post) => post.status === "published");
  const featuredPost = visiblePosts.find((post) => post.featured) ?? visiblePosts[0];
  const roll = featuredPost
    ? visiblePosts.filter((post) => post.id !== featuredPost.id).slice(0, 3)
    : [];

  if (!featuredPost) {
    return (
      <div className="mobile-empty-state">
        <Icons.book size={24} />
        <strong>No stories yet</strong>
        <span>This store is getting its blog ready.</span>
      </div>
    );
  }

  return (
    <>
      <article className="mobile-blog-home-hero">
        <div className="mobile-blog-home-cover">
          {featuredPost.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" src={featuredPost.coverImageUrl} />
          ) : (
            <BrandMark imageUrl={state.brand.logoImageUrl} label={state.brand.logoText} />
          )}
        </div>
        <span>{featuredPost.tags.slice(0, 2).join(" · ") || state.brand.name}</span>
        <h3>{featuredPost.title}</h3>
        <p>{featuredPost.excerpt}</p>
        <a href={featuredPost.slug}>Read story</a>
      </article>
      <div className="mobile-blog-roll">
        {(roll.length ? roll : visiblePosts.slice(0, 3)).map((post) => (
          <a href={post.slug} key={post.id}>
            <strong>{post.title}</strong>
            <span>{post.excerpt}</span>
          </a>
        ))}
      </div>
    </>
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

function MobileIdentityActions({
  inputId,
  onExistingReceizId,
  onRestoreArtifact,
  showIdentityUpload
}: {
  inputId: string;
  onExistingReceizId: () => void | Promise<void>;
  onRestoreArtifact: (file: File) => void | Promise<void>;
  showIdentityUpload: boolean;
}) {
  return (
    <>
      <div className="mobile-action-grid mobile-identity-actions mobile-identity-actions-single">
        <OfficialReceizLoginButton className="mobile-official-receiz-login" onClick={onExistingReceizId} />
      </div>
      {showIdentityUpload ? (
        <ReceizRecoveryPills
          className="mobile-identity-pills"
          inputId={inputId}
          onRestoreArtifact={onRestoreArtifact}
        />
      ) : null}
    </>
  );
}

function MobileAssetsPanel({
  active,
  assets,
  customerReceizHandle,
  onDownloadIdentitySeal,
  onExistingReceizId,
  onRestoreArtifact,
  showIdentityEntry,
  showIdentityUpload,
  state,
  tenantSurface: _tenantSurface
}: {
  active: boolean;
  assets: ReceizedAsset[];
  customerReceizHandle: string;
  onDownloadIdentitySeal: () => void | Promise<void>;
  onExistingReceizId: () => void | Promise<void>;
  onRestoreArtifact: (file: File) => void | Promise<void>;
  showIdentityEntry: boolean;
  showIdentityUpload: boolean;
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
      {showIdentityEntry ? (
        <MobileIdentityActions
          inputId="mobile-assets-receiz-identity-artifact"
          onExistingReceizId={onExistingReceizId}
          onRestoreArtifact={onRestoreArtifact}
          showIdentityUpload={showIdentityUpload}
        />
      ) : null}
      {state.auth.receizId.connected ? (
        <>
          <ReceizAccountManagementPills
            className="mobile-identity-pills"
            onDownloadIdentitySeal={onDownloadIdentitySeal}
          />
          <ReceizRecoveryPills
            className="mobile-identity-pills"
            inputId="mobile-assets-receiz-identity-switch"
            onRestoreArtifact={onRestoreArtifact}
          />
        </>
      ) : null}
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
  checkoutFeedback,
  customer,
  customerReceizHandle,
  onDownloadIdentitySeal,
  onExistingReceizId,
  onCheckout,
  onQuantityChange,
  onRemoveFromCart,
  onRestoreArtifact,
  showIdentityEntry,
  showIdentityUpload,
  state,
  tenantSurface
}: {
  active: boolean;
  checkoutFeedback?: ActionFeedbackState;
  customer: CustomerAccount;
  customerReceizHandle: string;
  onDownloadIdentitySeal: () => void | Promise<void>;
  onExistingReceizId: () => void | Promise<void>;
  onCheckout: () => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onRestoreArtifact: (file: File) => void | Promise<void>;
  showIdentityEntry: boolean;
  showIdentityUpload: boolean;
  state: CommerceState;
  tenantSurface: boolean;
}) {
  const tenantHost = state.hosting.customDomain.domain || state.hosting.subdomain;
  const customerOrders = state.orders.filter((order) => order.customerId === customer.id || order.customerEmail === customer.email);
  const latestOrder = customerOrders[0];
  const shippingReady = Boolean(customer.shippingAddress);

  return (
    <MobilePane active={active} action={<StatusPill tone="green">{customer.tier}</StatusPill>} title="Account">
      <div className="mobile-account-card">
        <div className="avatar large-avatar">{customer.name.slice(0, 1)}</div>
        <div className="mobile-account-profile-copy">
          <div className="mobile-account-name-line">
            <h3>{customer.name}</h3>
            <StatusPill tone="gold">{customer.rewardsValueLabel}</StatusPill>
          </div>
          <p>{tenantSurface ? `Customer account for ${state.brand.name}` : customer.email}</p>
          <span><Icons.receiz size={15} /> {customerReceizHandle}</span>
          <div className="mobile-account-metrics">
            <span><strong>{customer.rewardsValueLabel}</strong>Rewards</span>
            <span><strong>{customer.beans}</strong>Beans</span>
            <span><strong>{customer.streak}</strong>Streak</span>
          </div>
        </div>
        {state.auth.receizId.connected ? (
          <div className="mobile-account-seal-tools">
            <ReceizAccountManagementPills
              className="mobile-identity-pills"
              onDownloadIdentitySeal={onDownloadIdentitySeal}
            />
            <ReceizRecoveryPills
              className="mobile-identity-pills"
              inputId="mobile-account-receiz-identity-switch"
              onRestoreArtifact={onRestoreArtifact}
            />
          </div>
        ) : null}
      </div>
      {showIdentityEntry ? (
        <MobileIdentityActions
          inputId="mobile-account-receiz-identity-artifact"
          onExistingReceizId={onExistingReceizId}
          onRestoreArtifact={onRestoreArtifact}
          showIdentityUpload={showIdentityUpload}
        />
      ) : null}
      {tenantSurface ? (
        <div className="mobile-account-scope">
          <div>
            <Icons.store size={17} />
            <span>Store scope</span>
            <strong>{tenantHost}</strong>
          </div>
          <div>
            <Icons.creditCard size={17} />
            <span>Payment rail</span>
            <strong>Receiz wallet or card</strong>
          </div>
          <div>
            <Icons.orders size={17} />
            <span>Orders</span>
            <strong>{customerOrders.length ? `${customerOrders.length} orders` : "Ready"}</strong>
          </div>
          <div>
            <Icons.package size={17} />
            <span>Shipping</span>
            <strong>{shippingReady ? "Saved" : "At checkout"}</strong>
          </div>
        </div>
      ) : null}
      {tenantSurface && latestOrder?.funding ? (
        <div className="mobile-checkout-summary">
          <div>
            <Icons.receiz size={18} />
            <span>Wallet applied</span>
            <strong>{latestOrder.funding.walletAppliedLabel}</strong>
          </div>
          <div>
            <Icons.creditCard size={18} />
            <span>Card delta</span>
            <strong>{latestOrder.funding.cardDeltaLabel}</strong>
          </div>
          <div>
            <Icons.seal size={18} />
            <span>Status</span>
            <strong>{latestOrder.sealed ? "Sealed" : latestOrder.status.replace(/_/g, " ")}</strong>
          </div>
        </div>
      ) : null}
      {tenantSurface ? (
        <CartSummaryPanel
          checkoutFeedback={checkoutFeedback}
          onCheckout={onCheckout}
          onQuantityChange={onQuantityChange}
          onRemove={onRemoveFromCart}
          summary={buildCartSummary(state)}
        />
      ) : null}
      {tenantSurface ? null : (
        <Button className="mobile-admin-button" variant="outline" onClick={() => window.location.assign("/admin")}>
          Admin Studio
        </Button>
      )}
      <div className="mobile-account-receiz-badge">
        <PoweredByReceizBadge />
      </div>
    </MobilePane>
  );
}
