import type {
  BlogPost,
  BrandConfig,
  Campaign,
  CheckoutState,
  Collection,
  CommerceState,
  GameConfig,
  HostingConfig,
  NavigationItem,
  Order,
  Product,
  ProofEvent,
  QualifyingObjectType,
  ReceizedAsset,
  Reward,
  RewardRule,
  SitePage,
  StorefrontConfig
} from "../../types/domain";

export const STORE_STATE_SCHEMA = "receiz.app.store_state.v1";
export const STORE_STATE_CONNECT_SCHEMA = "receiz.app.store_state_connect.v1";
export const COMMERCE_EVENT_SCHEMA = "receiz.app.commerce_event.v1";

export type PublishedStoreState = {
  brand: BrandConfig;
  storefront: StorefrontConfig;
  hosting: HostingConfig;
  navigation: NavigationItem[];
  pages: SitePage[];
  blogPosts: BlogPost[];
  collections: Collection[];
  products: Product[];
  rewards: Reward[];
  rewardRules: RewardRule[];
  assets: ReceizedAsset[];
  qualifiers: QualifyingObjectType[];
  campaigns: Campaign[];
  game: GameConfig;
  checkout: CheckoutState;
};

export type StoreStateRecord = {
  schema: typeof STORE_STATE_SCHEMA;
  id: string;
  type: "store.state.published";
  reason: "publish" | "sync" | "restore";
  recordedAt: string;
  actorReceizId: string;
  tenantHost: string;
  tenantSlug: string;
  merchantReceizId: string;
  state: PublishedStoreState;
};

export type StoreStateConnectRecord = {
  schema: typeof STORE_STATE_CONNECT_SCHEMA;
  event: "store.state.published";
  platform: string;
  recordedAt: string;
  tenantHost: string;
  tenantSlug: string;
  merchantReceizId: string;
  data: {
    action: "store.published";
    storeStateRecord: StoreStateRecord;
    storeStateRecordId: string;
  };
};

export type CommerceEventType =
  | "checkout.created"
  | "checkout.requires_card"
  | "checkout.settled"
  | "checkout.failed"
  | "order.fulfilled";

export type CommerceEventData = {
  orderId?: string;
  checkoutSessionId?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  totalLabel?: string;
  itemCount?: number;
  paymentRail?: Order["paymentRail"];
  settlementStatus?: Order["settlementStatus"];
  funding?: Order["funding"];
  shipping?: Order["shipping"];
  receiptId?: string;
  proofBundle?: Record<string, unknown> | null;
};

export type CommerceEventRecord = {
  schema: typeof COMMERCE_EVENT_SCHEMA;
  id: string;
  type: CommerceEventType;
  createdAt: string;
  tenantHost: string;
  merchantReceizId: string;
  data: CommerceEventData;
};

export type StoreStateRecordInput = {
  actorReceizId: string;
  tenantHost?: string;
  reason?: StoreStateRecord["reason"];
  recordedAt?: string;
};

function stableSlug(value: string) {
  return value
    .split(".")[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function recordId(prefix: string, tenantHost: string, recordedAt: string) {
  const stamp = recordedAt.replace(/[^0-9a-z]/gi, "");
  return `${prefix}:${tenantHost}:${stamp}`;
}

const MAX_INLINE_DATA_URL_CHARS = 24_000;

function compactInlineMedia(value: unknown): unknown {
  if (typeof value === "string") {
    return value.startsWith("data:") && value.length > MAX_INLINE_DATA_URL_CHARS ? null : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => compactInlineMedia(item));
  }

  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, compactInlineMedia(item)])
  );
}

function compactPublishedState<T>(value: T): T {
  return compactInlineMedia(structuredClone(value)) as T;
}

function clonePublishedState(state: CommerceState): PublishedStoreState {
  return {
    brand: compactPublishedState(state.brand),
    storefront: compactPublishedState(state.storefront),
    hosting: compactPublishedState(state.hosting),
    navigation: compactPublishedState(state.navigation),
    pages: compactPublishedState(state.pages),
    blogPosts: compactPublishedState(state.blogPosts),
    collections: compactPublishedState(state.collections),
    products: compactPublishedState(state.products),
    rewards: compactPublishedState(state.rewards),
    rewardRules: compactPublishedState(state.rewardRules),
    assets: compactPublishedState(state.assets),
    qualifiers: compactPublishedState(state.qualifiers),
    campaigns: compactPublishedState(state.campaigns),
    game: compactPublishedState(state.game),
    checkout: compactPublishedState(state.checkout)
  };
}

function tenantHostFromState(state: CommerceState, inputHost?: string) {
  return (
    inputHost?.trim().toLowerCase() ||
    state.hosting.customDomain.domain.trim().toLowerCase() ||
    state.hosting.subdomain.trim().toLowerCase()
  );
}

export function buildStoreStateRecord(state: CommerceState, input: StoreStateRecordInput): StoreStateRecord {
  const recordedAt = input.recordedAt ?? new Date().toISOString();
  const tenantHost = tenantHostFromState(state, input.tenantHost);
  const tenantSlug = state.hosting.tenantSlug || stableSlug(tenantHost);
  const merchantReceizId = state.hosting.merchantReceizId || input.actorReceizId;

  return {
    schema: STORE_STATE_SCHEMA,
    id: recordId("store_state", tenantHost, recordedAt),
    type: "store.state.published",
    reason: input.reason ?? "publish",
    recordedAt,
    actorReceizId: input.actorReceizId,
    tenantHost,
    tenantSlug,
    merchantReceizId,
    state: clonePublishedState(state)
  };
}

export function buildStoreStateConnectRecord(
  record: StoreStateRecord,
  platform = "Receiz.app Commerce Cloud"
): StoreStateConnectRecord {
  return {
    schema: STORE_STATE_CONNECT_SCHEMA,
    event: "store.state.published",
    platform,
    recordedAt: record.recordedAt,
    tenantHost: record.tenantHost,
    tenantSlug: record.tenantSlug,
    merchantReceizId: record.merchantReceizId,
    data: {
      action: "store.published",
      storeStateRecord: record,
      storeStateRecordId: record.id
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isStoreStateRecord(value: unknown): value is StoreStateRecord {
  return isRecord(value) && value.schema === STORE_STATE_SCHEMA && isRecord(value.state);
}

export function isCommerceEventRecord(value: unknown): value is CommerceEventRecord {
  return isRecord(value) && value.schema === COMMERCE_EVENT_SCHEMA && isRecord(value.data);
}

export function storeStateRecordMatchesTenantHost(record: StoreStateRecord, tenantHost: string) {
  const normalized = tenantHost.trim().toLowerCase();
  return (
    record.tenantHost === normalized ||
    record.state.hosting.subdomain.toLowerCase() === normalized ||
    record.state.hosting.customDomain.domain.toLowerCase() === normalized
  );
}

export function storeStateProjectionSource(records: unknown[], tenantHost: string): "published" | "fallback" {
  return records
    .filter(isStoreStateRecord)
    .some((record) => storeStateRecordMatchesTenantHost(record, tenantHost))
    ? "published"
    : "fallback";
}

export function projectStoreStateFromRecords(
  baseState: CommerceState,
  records: unknown[],
  tenantHost: string
): CommerceState {
  const latest = records
    .filter(isStoreStateRecord)
    .filter((record) => storeStateRecordMatchesTenantHost(record, tenantHost))
    .sort((left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt))[0];

  if (!latest) return baseState;

  return {
    ...baseState,
    ...latest.state,
    cart: { lines: [] },
    orders: [],
    customers: [],
    listings: [],
    receiz: baseState.receiz,
    auth: baseState.auth,
    publish: {
      ...baseState.publish,
      checklist: baseState.publish.checklist
    },
    proofEvents: []
  };
}

function normalizeHost(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function commerceTenantAliases(state: CommerceState, tenantHost: string) {
  return new Set(
    [tenantHost, state.hosting.subdomain, state.hosting.customDomain.domain]
      .map((host) => normalizeHost(host))
      .filter(Boolean)
  );
}

function matchesCommerceTenant(event: CommerceEventRecord, aliases: Set<string>) {
  return aliases.has(normalizeHost(event.tenantHost));
}

export function projectCommerceEventsFromRecords(
  baseState: CommerceState,
  records: unknown[],
  tenantHost: string
): CommerceState {
  const aliases = commerceTenantAliases(baseState, tenantHost);

  return records
    .filter(isCommerceEventRecord)
    .filter((event) => matchesCommerceTenant(event, aliases))
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))
    .reduce((projected, event) => admitCommerceEvent(projected, event).state, baseState);
}

function paymentRailFromEvent(event: CommerceEventRecord): Order["paymentRail"] {
  if (event.data.paymentRail) return event.data.paymentRail;
  if (event.type === "checkout.requires_card") return "card_fallback";
  if (event.type === "checkout.settled") return "receiz_wallet";
  return "receiz_checkout";
}

function settlementStatusFromEvent(event: CommerceEventRecord): Order["settlementStatus"] {
  if (event.data.settlementStatus) return event.data.settlementStatus;
  if (event.type === "checkout.requires_card") return "card_required";
  if (event.type === "checkout.settled" || event.type === "order.fulfilled") return "settled";
  return "pending";
}

function orderStatusFromEvent(event: CommerceEventRecord): Order["status"] {
  if (event.type === "checkout.requires_card") return "card_required";
  if (event.type === "checkout.settled") return "settled";
  if (event.type === "order.fulfilled") return "fulfilled";
  return "pending";
}

function eventOrder(state: CommerceState, event: CommerceEventRecord): Order {
  const customerId = event.data.customerId || `customer:${event.data.customerEmail || event.id}`;
  const orderId = event.data.orderId || event.data.checkoutSessionId || event.id;

  return {
    id: orderId,
    customerId,
    customerEmail: event.data.customerEmail,
    totalLabel: event.data.totalLabel || "$0.00",
    status: orderStatusFromEvent(event),
    itemCount: event.data.itemCount ?? 1,
    sealed: event.type === "checkout.settled" || event.type === "order.fulfilled",
    createdAt: event.createdAt,
    merchantReceizId: event.merchantReceizId || state.hosting.merchantReceizId,
    tenantHost: event.tenantHost,
    checkoutSessionId: event.data.checkoutSessionId,
    paymentRail: paymentRailFromEvent(event),
    settlementStatus: settlementStatusFromEvent(event),
    funding: event.data.funding,
    shipping: event.data.shipping
  };
}

function upsertOrder(orders: Order[], order: Order) {
  if (!orders.some((item) => item.id === order.id)) return [order, ...orders];
  return orders.map((item) => (item.id === order.id ? { ...item, ...order } : item));
}

function upsertCustomer(state: CommerceState, order: Order, event: CommerceEventRecord) {
  const customerId = order.customerId;
  const existing = state.customers.find((customer) => customer.id === customerId);
  const customer = {
    ...(existing ?? {
      id: customerId,
      name: event.data.customerName || event.data.customerEmail || "Receiz customer",
      email: event.data.customerEmail || "",
      tier: "Customer",
      rewardsValueLabel: "$0",
      beans: 0,
      streak: "0x",
      orderIds: [],
      rewardIds: [],
      assetIds: []
    }),
    name: event.data.customerName || existing?.name || event.data.customerEmail || "Receiz customer",
    email: event.data.customerEmail || existing?.email || "",
    shippingAddress: event.data.shipping ?? existing?.shippingAddress,
    orderIds: Array.from(new Set([order.id, ...(existing?.orderIds ?? [])]))
  };

  if (!existing) return [customer, ...state.customers];
  return state.customers.map((item) => (item.id === customer.id ? customer : item));
}

function proofEventForCommerceEvent(event: CommerceEventRecord, order: Order): ProofEvent {
  const settled = order.settlementStatus === "settled";

  return {
    id: event.id,
    type: settled ? "ORDER_VERIFIED" : "OBJECT_VERIFIED",
    title: settled ? "ORDER_VERIFIED" : "CHECKOUT_RECORDED",
    detail: `${order.id} · ${order.paymentRail ?? "receiz_checkout"} · ${event.merchantReceizId}`,
    status: settled ? "verified" : "linked",
    timestampLabel: "now"
  };
}

export function admitCommerceEvent(
  state: CommerceState,
  event: CommerceEventRecord
): { admitted: boolean; state: CommerceState } {
  if (!isCommerceEventRecord(event)) return { admitted: false, state };
  if (state.proofEvents.some((proofEvent) => proofEvent.id === event.id)) {
    return { admitted: false, state };
  }

  const order = eventOrder(state, event);
  const proofEvent = proofEventForCommerceEvent(event, order);

  return {
    admitted: true,
    state: {
      ...state,
      orders: upsertOrder(state.orders, order),
      customers: upsertCustomer(state, order, event),
      proofEvents: [proofEvent, ...state.proofEvents]
    }
  };
}

export function commerceEventFromUnknown(value: unknown, fallbackHost: string): CommerceEventRecord | null {
  if (isCommerceEventRecord(value)) return value;
  if (!isRecord(value)) return null;

  const data = isRecord(value.data) ? value.data : value;
  const type = String(value.type ?? data.type ?? "checkout.settled");
  const eventType: CommerceEventType =
    type === "checkout.requires_card" || type === "checkout.failed" || type === "order.fulfilled" || type === "checkout.created"
      ? type
      : "checkout.settled";

  return {
    schema: COMMERCE_EVENT_SCHEMA,
    id: String(value.id ?? data.id ?? data.eventId ?? data.checkoutSessionId ?? data.orderId ?? crypto.randomUUID()),
    type: eventType,
    createdAt: String(value.createdAt ?? data.createdAt ?? new Date().toISOString()),
    tenantHost: String(data.tenantHost ?? value.tenantHost ?? fallbackHost),
    merchantReceizId: String(data.merchantReceizId ?? value.merchantReceizId ?? ""),
    data: {
      orderId: typeof data.orderId === "string" ? data.orderId : undefined,
      checkoutSessionId: typeof data.checkoutSessionId === "string" ? data.checkoutSessionId : undefined,
      customerId: typeof data.customerId === "string" ? data.customerId : undefined,
      customerEmail: typeof data.customerEmail === "string" ? data.customerEmail : undefined,
      customerName: typeof data.customerName === "string" ? data.customerName : undefined,
      totalLabel: typeof data.totalLabel === "string" ? data.totalLabel : undefined,
      itemCount: typeof data.itemCount === "number" ? data.itemCount : undefined,
      paymentRail: typeof data.paymentRail === "string" ? (data.paymentRail as Order["paymentRail"]) : undefined,
      settlementStatus:
        typeof data.settlementStatus === "string" ? (data.settlementStatus as Order["settlementStatus"]) : undefined,
      funding: isRecord(data.funding) ? (data.funding as Order["funding"]) : undefined,
      shipping: isRecord(data.shipping) ? (data.shipping as Order["shipping"]) : undefined,
      receiptId: typeof data.receiptId === "string" ? data.receiptId : undefined,
      proofBundle: isRecord(data.proofBundle) ? data.proofBundle : null
    }
  };
}
