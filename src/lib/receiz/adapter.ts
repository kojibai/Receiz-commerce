import {
  RECEIZ_DEFAULT_BASE_URL,
  RECEIZ_SDK_VERSION,
  createReceizClient,
  type ActionLedgerFeed,
  type CheckoutRequest,
  type CheckoutSessionResponse,
  type ConnectTransferRequest,
  type ConnectTransferResponse,
  type ConnectWalletResponse,
  type DocumentSealResponseMetadata,
  type DocumentVerifyResponse,
  type JsonObject,
  type PublicProofRecord,
  type ReceizAssetManifest,
  type ReceizAssetManifestProjection,
  type ReceizClient,
  type ReceizClientOptions,
  type ReceizDeviceIdentity,
  type ReceizIdContinueRequest,
  type ReceizIdentityAccountProjection,
  type ReceizIdentityLoginProof,
  type ReceizKeyFile,
  type ReceizProofMemory,
  type ReceizProofMemoryAdditionsQuery,
  type ReceizProofMemoryOptions,
  type ReceizProofRegister,
  type ReceizSportsCardManifest,
  type ReceizSportsCardManifestProjection,
  type ReceizWebhookEvent,
  type WalletLedgerFeed
} from "@receiz/sdk";
import type { GameResult, Product, ProofEvent, ReceizedAsset, Reward, VerifiedObject } from "@/types/domain";
import { makeId } from "@/lib/utils";
import { platform } from "@/lib/platform";

export type ReceizCommerceAdapter = {
  sdkVersion: string;
  client: ReceizClient;
  connectReceiz(): Promise<ReceizRailsStatus>;
  buildReceizIdAuthorizeUrl(input: {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    usernameHint?: string;
  }): string;
  createReceizId(input: {
    username: string;
    displayName: string;
    deviceName?: string;
    next?: string;
  }): Promise<{
    identity: ReceizDeviceIdentity;
    continueRequest: ReceizIdContinueRequest;
    projection: ReceizIdentityAccountProjection;
  }>;
  restoreIdentityArtifact(input: string | Uint8Array | ArrayBuffer | Blob): Promise<{
    keyFile: ReceizKeyFile;
    projection: ReceizIdentityAccountProjection;
  }>;
  signIdentityLoginProof(input: {
    keyFile: ReceizKeyFile;
    challengeText?: string;
    challengeB64Url?: string;
  }): Promise<ReceizIdentityLoginProof>;
  verifyIdentityLoginProof(input: {
    keyFile: ReceizKeyFile;
    challengeB64Url: string;
    signatureB64Url: string;
  }): Promise<boolean>;
  continueReceizId(identity: ReceizDeviceIdentity, next?: string): Promise<JsonObject>;
  createProofRegister(ownerId?: string): ReceizProofRegister;
  createProofMemory(options?: ReceizProofMemoryOptions): Promise<ReceizProofMemory>;
  proofMemoryAdditionsQuery(
    value: ReceizProofRegister | ReceizProofMemory,
    limit?: number
  ): ReceizProofMemoryAdditionsQuery;
  verifyArtifact(file: Blob): Promise<DocumentVerifyResponse>;
  sealArtifact(file: Blob, options?: { visualStamp?: boolean }): Promise<DocumentSealResponseMetadata>;
  observePublicProof(body: { url: string; externalCreatorId?: string; title?: string }): Promise<PublicProofRecord>;
  getPublicProofByUrl(url: string): Promise<PublicProofRecord>;
  getPublicProofById(id: string): Promise<PublicProofRecord>;
  checkout(body: CheckoutRequest): Promise<CheckoutSessionResponse>;
  checkoutSession(query: { checkoutSessionId?: string; sessionId?: string }): Promise<CheckoutSessionResponse>;
  connectWallet(): Promise<ConnectWalletResponse>;
  connectTransfer(body: ConnectTransferRequest, idempotencyKey?: string): Promise<ConnectTransferResponse>;
  connectRecord(body: JsonObject): Promise<JsonObject>;
  walletLedger(query?: { limit?: number; cursor?: string; since?: string }): Promise<WalletLedgerFeed>;
  actionLedger(query?: { limit?: number; cursor?: string; since?: string }): Promise<ActionLedgerFeed>;
  signWebhook(input: { secret: string; timestamp: string; body: string | Uint8Array | ArrayBuffer | JsonObject }): Promise<string>;
  verifyWebhookSignature(input: {
    secret: string;
    timestamp: string;
    body: string | Uint8Array | ArrayBuffer | JsonObject;
    signature: string;
  }): Promise<boolean>;
  assertWebhookEvent(body: JsonObject): ReceizWebhookEvent;
  projectAssetManifest(manifest: ReceizAssetManifest): ReceizAssetManifestProjection;
  projectSportsCardManifest(manifest: ReceizSportsCardManifest): ReceizSportsCardManifestProjection;
  verifyObject(object: Pick<VerifiedObject, "label" | "objectType">): Promise<VerifiedObject>;
  sealProduct(product: Product): Promise<ProofEvent>;
  sealOrder(orderInput: { id: string; totalLabel: string }): Promise<ProofEvent>;
  sealReward(reward: Reward): Promise<ProofEvent>;
  sealAsset(asset: ReceizedAsset): Promise<ProofEvent>;
  sealGameResult(result: GameResult): Promise<ProofEvent>;
  recordGameResult(result: GameResult): Promise<ProofEvent>;
  issueReward(reward: Reward): Promise<ProofEvent>;
  listAsset(assetId: string): Promise<ProofEvent>;
  sellAsset(assetId: string, terms: string): Promise<ProofEvent>;
  tradeAsset(assetId: string): Promise<ProofEvent>;
  shareAsset(assetId: string): Promise<ProofEvent>;
  getProofTrail(): Promise<ProofEvent[]>;
};

export type ReceizRailKey =
  | "identity"
  | "identityArtifacts"
  | "connect"
  | "checkout"
  | "payments"
  | "verification"
  | "publicProof"
  | "wallet"
  | "webhooks"
  | "manifests"
  | "proofMemory";

export type ReceizRailsStatus = {
  connected: true;
  sdkVersion: string;
  baseUrl: string;
  mode: "mock" | "live";
  hasAccessToken: boolean;
  rails: Array<{
    key: ReceizRailKey;
    label: string;
    status: "configured" | "available" | "needs_env";
  }>;
};

function event(type: ProofEvent["type"], detail: string): ProofEvent {
  return {
    id: makeId("proof"),
    type,
    title: type,
    detail,
    status: type === "ASSET_RECEIZED" ? "sealed" : "verified",
    timestampLabel: "now"
  };
}

function receizClientOptionsFromEnv(): ReceizClientOptions {
  return {
    baseUrl: process.env.RECEIZ_BASE_URL || RECEIZ_DEFAULT_BASE_URL,
    accessToken: process.env.RECEIZ_ACCESS_TOKEN || process.env.RECEIZ_CONNECT_ACCESS_TOKEN || undefined
  };
}

export function createReceizCommerceAdapter(
  options: ReceizClientOptions = receizClientOptionsFromEnv()
): ReceizCommerceAdapter {
  const client = createReceizClient(options);
  const hasAccessToken = Boolean(options.accessToken);
  const hasWebhookSecret = Boolean(process.env.RECEIZ_WEBHOOK_SECRET);
  const trail: ProofEvent[] = [];

  const push = (proofEvent: ProofEvent) => {
    trail.unshift(proofEvent);
    return proofEvent;
  };

  return {
    sdkVersion: RECEIZ_SDK_VERSION,
    client,
    async connectReceiz() {
      const needsToken = (key: ReceizRailKey, label: string) => ({
        key,
        label,
        status: hasAccessToken ? ("configured" as const) : ("needs_env" as const)
      });

      return {
        connected: true,
        sdkVersion: RECEIZ_SDK_VERSION,
        baseUrl: client.baseUrl,
        mode: hasAccessToken ? "live" : "mock",
        hasAccessToken,
        rails: [
          { key: "identity", label: "Receiz ID creation and continuation", status: "available" },
          { key: "identityArtifacts", label: "Receiz Key, Identity Record, Identity Seal restore", status: "available" },
          { key: "manifests", label: "Manifest validation and display projections", status: "available" },
          { key: "proofMemory", label: "Admit-once proof memory and known-head sync", status: "available" },
          { key: "verification", label: "Artifact verification and seal calls", status: "available" },
          { key: "publicProof", label: "Public proof rendering and observation", status: "available" },
          needsToken("connect", "Delegated Receiz Connect actions"),
          needsToken("checkout", "Receiz checkout sessions"),
          needsToken("payments", "Embedded Receiz payments and note claim"),
          needsToken("wallet", "Wallet and action ledger additions"),
          {
            key: "webhooks",
            label: "Receiz webhook delivery signatures",
            status: hasWebhookSecret ? "configured" : "needs_env"
          }
        ]
      };
    },
    buildReceizIdAuthorizeUrl(input) {
      return client.identity.authorizeUrl({
        clientId: input.clientId,
        redirectUri: input.redirectUri,
        codeChallenge: input.codeChallenge,
        codeChallengeMethod: "S256",
        scope: ["openid", "profile", "email", "receiz.id"],
        usernameHint: input.usernameHint
      });
    },
    async createReceizId(input) {
      const identity = await client.identity.createReceizId({
        username: input.username,
        displayName: input.displayName,
        deviceName: input.deviceName ?? platform.productName
      });
      const continueRequest = await client.identity.buildReceizIdContinueRequest(identity, {
        next: input.next
      });
      const projection = await client.identity.projectAccount(identity.keyFile);

      return {
        identity,
        continueRequest,
        projection
      };
    },
    async restoreIdentityArtifact(input) {
      const keyFile = await client.identity.readArtifact(input);
      const projection = await client.identity.projectAccount(keyFile);

      return { keyFile, projection };
    },
    signIdentityLoginProof(input) {
      return client.identity.signLoginProof(input);
    },
    verifyIdentityLoginProof(input) {
      return client.identity.verifyLoginProof(input);
    },
    continueReceizId(identity, next) {
      return client.identity.continueReceizId(identity, { next });
    },
    createProofRegister(ownerId) {
      return client.proofMemory.createRegister({ ownerId });
    },
    createProofMemory(options) {
      return client.proofMemory.createMemory(options);
    },
    proofMemoryAdditionsQuery(value, limit) {
      return client.proofMemory.additionsQuery(value, limit);
    },
    verifyArtifact(file) {
      return client.verification.verifyArtifact(file);
    },
    sealArtifact(file, options) {
      return client.verification.sealArtifact(file, options);
    },
    observePublicProof(body) {
      return client.publicProof.observe(body);
    },
    getPublicProofByUrl(url) {
      return client.publicProof.byUrl(url);
    },
    getPublicProofById(id) {
      return client.publicProof.byId(id);
    },
    checkout(body) {
      return client.payments.embeddedCheckout(body);
    },
    checkoutSession(query) {
      return client.connect.checkoutSession(query);
    },
    connectWallet() {
      return client.connect.wallet();
    },
    connectTransfer(body, idempotencyKey) {
      return client.connect.transfer(body, { idempotencyKey });
    },
    connectRecord(body) {
      return client.connect.record(body);
    },
    walletLedger(query) {
      return client.wallet.publicLedger(query);
    },
    actionLedger(query) {
      return client.wallet.actionLedger(query);
    },
    signWebhook(input) {
      return client.webhooks.sign(input);
    },
    verifyWebhookSignature(input) {
      return client.webhooks.verifySignature(input);
    },
    assertWebhookEvent(body) {
      return client.webhooks.assertEvent(body);
    },
    projectAssetManifest(manifest) {
      return client.manifests.projectAsset(manifest);
    },
    projectSportsCardManifest(manifest) {
      return client.manifests.projectSportsCard(manifest);
    },
    async verifyObject(object) {
      const verified = {
        id: makeId("object"),
        label: object.label,
        objectType: object.objectType,
        sealedAt: new Date().toISOString()
      };
      push(event("OBJECT_VERIFIED", `${object.label} sealed`));
      return verified;
    },
    async sealProduct(product) {
      return push(event("OBJECT_VERIFIED", `${product.name} sealed`));
    },
    async sealOrder(orderInput) {
      return push(event("ORDER_VERIFIED", `Order #${orderInput.id} sealed`));
    },
    async sealReward(reward) {
      return push(event("REWARD_ISSUED", `${reward.name} sealed`));
    },
    async sealAsset(asset) {
      return push(event("ASSET_RECEIZED", `${asset.name} sealed`));
    },
    async sealGameResult(result) {
      return push(event("GAME_COMPLETED", `${result.beans} beans · ${result.score} score`));
    },
    async recordGameResult(result) {
      return push(event("GAME_COMPLETED", `${result.beans} beans · ${result.score} score`));
    },
    async issueReward(reward) {
      return push(event("REWARD_ISSUED", `${reward.name} issued`));
    },
    async listAsset(assetId) {
      return push(event("ASSET_RECEIZED", `${assetId} listed`));
    },
    async sellAsset(assetId, terms) {
      return push(event("ASSET_RECEIZED", `${assetId} listed for ${terms}`));
    },
    async tradeAsset(assetId) {
      return push(event("ASSET_RECEIZED", `${assetId} trade opened`));
    },
    async shareAsset(assetId) {
      return push(event("ASSET_RECEIZED", `${assetId} shared`));
    },
    async getProofTrail() {
      return trail;
    }
  };
}

export const receizCommerceAdapter = createReceizCommerceAdapter();
