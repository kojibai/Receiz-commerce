import { seedCommerceState } from "@/data/seed";
import type {
  CommerceState,
  HostingConfig,
  Order,
  Product,
  ProofEvent,
  Reward,
  SitePage,
  Collection,
  BlogPost,
  CustomerAccount,
  ReceizedAsset,
  StorefrontConfig
} from "@/types/domain";

export type StorageAdapter = {
  getState(): CommerceState;
  replaceState(input: CommerceState): CommerceState;
  getStorefrontConfig(): StorefrontConfig;
  updateStorefrontConfig(input: Partial<StorefrontConfig>): StorefrontConfig;
  listPages(): SitePage[];
  createPage(input: SitePage): SitePage;
  updatePage(id: string, input: Partial<SitePage>): SitePage | null;
  listBlogPosts(): BlogPost[];
  createBlogPost(input: BlogPost): BlogPost;
  updateBlogPost(id: string, input: Partial<BlogPost>): BlogPost | null;
  listCollections(): Collection[];
  createCollection(input: Collection): Collection;
  updateCollection(id: string, input: Partial<Collection>): Collection | null;
  listProducts(): Product[];
  createProduct(input: Product): Product;
  updateProduct(id: string, input: Partial<Product>): Product | null;
  listRewards(): Reward[];
  createReward(input: Reward): Reward;
  updateReward(id: string, input: Partial<Reward>): Reward | null;
  listAssets(): ReceizedAsset[];
  createAsset(input: ReceizedAsset): ReceizedAsset;
  updateAsset(id: string, input: Partial<ReceizedAsset>): ReceizedAsset | null;
  listOrders(): Order[];
  createOrder(input: Order): Order;
  listCustomers(): CustomerAccount[];
  getCustomer(id: string): CustomerAccount | null;
  updateCustomer(id: string, input: Partial<CustomerAccount>): CustomerAccount | null;
  listProofEvents(): ProofEvent[];
  appendProofEvent(input: ProofEvent): ProofEvent;
  getHostingConfig(): HostingConfig;
  updateHostingConfig(input: Partial<HostingConfig>): HostingConfig;
};

function cloneState(): CommerceState {
  return structuredClone(seedCommerceState);
}

let state = cloneState();

export const mockStorage: StorageAdapter = {
  getState() {
    return state;
  },
  replaceState(input) {
    state = structuredClone(input);
    return state;
  },
  getStorefrontConfig() {
    return state.storefront;
  },
  updateStorefrontConfig(input) {
    state = { ...state, storefront: { ...state.storefront, ...input } };
    return state.storefront;
  },
  listPages() {
    return state.pages;
  },
  createPage(input) {
    state = { ...state, pages: [...state.pages, input] };
    return input;
  },
  updatePage(id, input) {
    let updated: SitePage | null = null;
    state = {
      ...state,
      pages: state.pages.map((page) => {
        if (page.id !== id) return page;
        updated = { ...page, ...input };
        return updated;
      })
    };
    return updated;
  },
  listBlogPosts() {
    return state.blogPosts;
  },
  createBlogPost(input) {
    state = { ...state, blogPosts: [input, ...state.blogPosts] };
    return input;
  },
  updateBlogPost(id, input) {
    let updated: BlogPost | null = null;
    state = {
      ...state,
      blogPosts: state.blogPosts.map((post) => {
        if (post.id !== id) return post;
        updated = { ...post, ...input };
        return updated;
      })
    };
    return updated;
  },
  listCollections() {
    return state.collections;
  },
  createCollection(input) {
    state = { ...state, collections: [...state.collections, input] };
    return input;
  },
  updateCollection(id, input) {
    let updated: Collection | null = null;
    state = {
      ...state,
      collections: state.collections.map((collection) => {
        if (collection.id !== id) return collection;
        updated = { ...collection, ...input };
        return updated;
      })
    };
    return updated;
  },
  listProducts() {
    return state.products;
  },
  createProduct(input) {
    state = { ...state, products: [...state.products, input] };
    return input;
  },
  updateProduct(id, input) {
    let updated: Product | null = null;
    state = {
      ...state,
      products: state.products.map((product) => {
        if (product.id !== id) return product;
        updated = { ...product, ...input };
        return updated;
      })
    };
    return updated;
  },
  listRewards() {
    return state.rewards;
  },
  createReward(input) {
    state = { ...state, rewards: [...state.rewards, input] };
    return input;
  },
  updateReward(id, input) {
    let updated: Reward | null = null;
    state = {
      ...state,
      rewards: state.rewards.map((reward) => {
        if (reward.id !== id) return reward;
        updated = { ...reward, ...input };
        return updated;
      })
    };
    return updated;
  },
  listAssets() {
    return state.assets;
  },
  createAsset(input) {
    state = { ...state, assets: [...state.assets, input] };
    return input;
  },
  updateAsset(id, input) {
    let updated: ReceizedAsset | null = null;
    state = {
      ...state,
      assets: state.assets.map((asset) => {
        if (asset.id !== id) return asset;
        updated = { ...asset, ...input };
        return updated;
      })
    };
    return updated;
  },
  listOrders() {
    return state.orders;
  },
  createOrder(input) {
    state = { ...state, orders: [input, ...state.orders] };
    return input;
  },
  listCustomers() {
    return state.customers;
  },
  getCustomer(id) {
    return state.customers.find((customer) => customer.id === id) ?? null;
  },
  updateCustomer(id, input) {
    let updated: CustomerAccount | null = null;
    state = {
      ...state,
      customers: state.customers.map((customer) => {
        if (customer.id !== id) return customer;
        updated = { ...customer, ...input };
        return updated;
      })
    };
    return updated;
  },
  listProofEvents() {
    return state.proofEvents;
  },
  appendProofEvent(input) {
    state = { ...state, proofEvents: [input, ...state.proofEvents] };
    return input;
  },
  getHostingConfig() {
    return state.hosting;
  },
  updateHostingConfig(input) {
    state = { ...state, hosting: { ...state.hosting, ...input } };
    return state.hosting;
  }
};
