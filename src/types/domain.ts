export type ProductType =
  | "physical"
  | "digital"
  | "access"
  | "benefit"
  | "experience"
  | "receized_asset";

export type RewardType =
  | "coupon"
  | "access_pass"
  | "benefit"
  | "membership"
  | "collectible"
  | "event_entry"
  | "digital_unlock"
  | "physical_claim"
  | "points_multiplier"
  | "receized_asset"
  | "custom";

export type Transferability =
  | "redeem_only"
  | "shareable"
  | "listable"
  | "sellable"
  | "tradable"
  | "locked";

export type ProofEventType =
  | "OBJECT_VERIFIED"
  | "REWARD_ISSUED"
  | "REWARD_CLAIMED"
  | "ASSET_RECEIZED"
  | "GAME_COMPLETED"
  | "ORDER_VERIFIED"
  | "SITE_PUBLISHED"
  | "DOMAIN_CONNECTED"
  | "RECEIZ_ID_CONNECTED"
  | "HOSTING_PLAN_UPDATED"
  | "BILLING_METHOD_ADDED"
  | "THEME_UPDATED";

export type BrandConfig = {
  name: string;
  logoText: string;
  logoImageUrl: string | null;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  neutralColor: string;
  backgroundColor: string;
  fontFamily: string;
  cornerRadius: "compact" | "balanced" | "soft";
  buttonStyle: "filled" | "outline" | "minimal";
};

export type HostingMode = "mock_hosted" | "hosted_platform" | "self_hosted";

export type DomainStatus = {
  domain: string;
  status: "active" | "pending" | "connected" | "ready";
  sslStatus: "valid" | "pending" | "mock";
};

export type HostingConfig = {
  mode: HostingMode;
  subdomain: string;
  customDomain: DomainStatus;
  plan: "starter" | "pro" | "scale";
  published: boolean;
  lastPublishedAt: string;
};

export type HostingPlan = {
  id: HostingConfig["plan"];
  name: string;
  priceLabel: string;
  description: string;
  included: string[];
  recommended?: boolean;
};

export type BillingConfig = {
  status: "trial" | "active" | "past_due";
  paymentMethodLabel: string;
  monthlyTotalLabel: string;
  trialEndsAt: string;
  invoices: Array<{
    id: string;
    dateLabel: string;
    amountLabel: string;
    status: "paid" | "open";
  }>;
  plans: HostingPlan[];
};

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  visible: boolean;
};

export type PageSection = {
  id: string;
  kind: "hero" | "products" | "rewards" | "assets" | "game" | "content";
  title: string;
  body: string;
};

export type SitePage = {
  id: string;
  title: string;
  slug: string;
  visibleInNav: boolean;
  published: boolean;
  sections: PageSection[];
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  productIds: string[];
  published: boolean;
};

export type Product = {
  id: string;
  name: string;
  subtitle: string;
  type: ProductType;
  priceLabel: string;
  status: "active" | "draft";
  inventoryLabel: string;
  rewardEligible: boolean;
  sealed: boolean;
  imageTone: "bag" | "can" | "mug" | "card" | "class" | "access";
};

export type CartLine = {
  productId: string;
  quantity: number;
};

export type Cart = {
  lines: CartLine[];
};

export type Order = {
  id: string;
  customerId: string;
  totalLabel: string;
  status: "mock_paid" | "pending" | "fulfilled";
  itemCount: number;
  sealed: boolean;
  createdAt: string;
};

export type CustomerAccount = {
  id: string;
  name: string;
  email: string;
  tier: string;
  rewardsValueLabel: string;
  beans: number;
  streak: string;
  orderIds: string[];
  rewardIds: string[];
  assetIds: string[];
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin";
};

export type ReceizIdState = {
  connected: boolean;
  handle: string;
  displayName: string;
  keyId: string;
  loginMode: "existing_receiz_id" | "new_receiz_id";
  oneClickLogin: boolean;
  existingIdsSupported: boolean;
  sdkHelpers: string[];
  statusLabel: string;
};

export type RewardRule = {
  id: string;
  label: string;
  trigger: string;
  rewardId: string;
  active: boolean;
};

export type Reward = {
  id: string;
  name: string;
  type: RewardType;
  description: string;
  requirement: string;
  progress: number;
  target: number;
  status: "active" | "draft" | "claimed";
  transferability: Transferability[];
  expiresAt: string;
};

export type ReceizedAsset = {
  id: string;
  name: string;
  type: "benefit" | "limited_drop" | "access" | "claim";
  ownerId: string;
  status: "owned" | "listed" | "sold" | "locked";
  priceLabel: string;
  proofSource: string;
};

export type AssetListing = {
  id: string;
  assetId: string;
  terms: string;
  status: "listed" | "sold" | "traded";
};

export type QualifyingObjectType = {
  id: string;
  label: string;
  enabled: boolean;
  criteria: string;
};

export type Campaign = {
  id: string;
  name: string;
  enabled: boolean;
  eligibleObjectIds: string[];
  scoreRule: string;
  rewardId: string;
};

export type GameConfig = {
  enabled: boolean;
  campaignId: string;
  dailyLimit: string;
  leaderboardEnabled: boolean;
};

export type GameResult = {
  campaignId: string;
  score: number;
  beans: number;
  completed: boolean;
};

export type VerifiedObject = {
  id: string;
  label: string;
  objectType: string;
  sealedAt: string;
};

export type ProofEvent = {
  id: string;
  type: ProofEventType;
  title: string;
  detail: string;
  status: "verified" | "success" | "linked" | "sealed";
  timestampLabel: string;
};

export type ReceizConnectionState = {
  connected: boolean;
  mode: "mock" | "live";
  statusLabel: string;
  proofsIssued: number;
};

export type CheckoutState = {
  mode: "mock" | "live" | "external";
  label: string;
};

export type AuthState = {
  admin: AdminUser;
  customer: CustomerAccount;
  receizId: ReceizIdState;
  signedInAs: "admin" | "customer";
};

export type PublishState = {
  checklist: Array<{
    id: string;
    label: string;
    complete: boolean;
    warning?: boolean;
  }>;
};

export type StorefrontConfig = {
  headline: string;
  subheadline: string;
  heroBody: string;
  ctaLabel: string;
};

export type CommerceState = {
  brand: BrandConfig;
  storefront: StorefrontConfig;
  hosting: HostingConfig;
  billing: BillingConfig;
  navigation: NavigationItem[];
  pages: SitePage[];
  collections: Collection[];
  products: Product[];
  cart: Cart;
  orders: Order[];
  customers: CustomerAccount[];
  rewards: Reward[];
  rewardRules: RewardRule[];
  assets: ReceizedAsset[];
  listings: AssetListing[];
  qualifiers: QualifyingObjectType[];
  campaigns: Campaign[];
  game: GameConfig;
  receiz: ReceizConnectionState;
  checkout: CheckoutState;
  auth: AuthState;
  publish: PublishState;
  proofEvents: ProofEvent[];
};
