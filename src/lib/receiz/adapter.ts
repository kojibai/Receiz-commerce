import {
  RECEIZ_SDK_VERSION,
  createReceizClient,
  type ReceizClient,
  type ReceizClientOptions,
  type ReceizDeviceIdentity,
  type ReceizIdContinueRequest,
  type ReceizIdentityAccountProjection
} from "@receiz/sdk";
import type { GameResult, Product, ProofEvent, ReceizedAsset, Reward, VerifiedObject } from "@/types/domain";
import { makeId } from "@/lib/utils";

export type ReceizCommerceAdapter = {
  sdkVersion: string;
  client: ReceizClient;
  connectReceiz(): Promise<{ connected: true; sdkVersion: string }>;
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

export function createReceizCommerceAdapter(
  options: ReceizClientOptions = {}
): ReceizCommerceAdapter {
  const client = createReceizClient(options);
  const trail: ProofEvent[] = [];

  const push = (proofEvent: ProofEvent) => {
    trail.unshift(proofEvent);
    return proofEvent;
  };

  return {
    sdkVersion: RECEIZ_SDK_VERSION,
    client,
    async connectReceiz() {
      return { connected: true, sdkVersion: RECEIZ_SDK_VERSION };
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
        deviceName: input.deviceName ?? "Receiz Commerce Kit"
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
