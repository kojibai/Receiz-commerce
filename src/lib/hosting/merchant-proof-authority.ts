import type { ProofEventType } from "@/types/domain";
import type { ReceizKeyFileV1 } from "@receiz/sdk";

export type MerchantAuthorityAction =
  | "account"
  | "billing"
  | "checkout"
  | "custom_domain"
  | "publish"
  | "verify_domain"
  | "wallet";
export type MerchantAuthoritySource = "delegated_permission" | "proof_object";

export type MerchantAuthorityGate =
  | {
      ok: true;
      handle: string;
      source: MerchantAuthoritySource;
    }
  | {
      ok: false;
      eventType: ProofEventType;
      message: string;
      statusLabel: string;
    };

const ACTION_COPY: Record<
  MerchantAuthorityAction,
  {
    eventType: ProofEventType;
    message: string;
  }
> = {
  account: {
    eventType: "RECEIZ_ID_CONNECTED",
    message: "Create or restore a verified Receiz proof object in app before using account functions."
  },
  billing: {
    eventType: "BILLING_METHOD_ADDED",
    message: "Create or restore a verified Receiz proof object in app before changing billing."
  },
  checkout: {
    eventType: "ORDER_VERIFIED",
    message: "Create or restore a verified Receiz proof object in app before using checkout."
  },
  custom_domain: {
    eventType: "DOMAIN_CONNECTED",
    message: "Create or restore a verified Receiz proof object in app before connecting a custom domain."
  },
  verify_domain: {
    eventType: "DOMAIN_CONNECTED",
    message: "Create or restore a verified Receiz proof object in app before verifying a custom domain."
  },
  publish: {
    eventType: "SITE_PUBLISHED",
    message: "Create or restore a verified Receiz proof object in app before publishing this store."
  },
  wallet: {
    eventType: "ORDER_VERIFIED",
    message: "Create or restore a verified Receiz proof object in app before using Receiz wallet."
  }
};

function normalizedHandle(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function proofKeyFileFrom(value: Record<string, unknown>, receizId: Record<string, unknown>) {
  const keyFile = isRecord(value.keyFile)
    ? value.keyFile
    : isRecord(value.identityKeyFile)
      ? value.identityKeyFile
      : isRecord(receizId.keyFile)
        ? receizId.keyFile
        : null;

  return keyFile;
}

function isReceizKeyFile(value: unknown): value is ReceizKeyFileV1 {
  if (!isRecord(value) || !isRecord(value.owner) || !isRecord(value.crypto)) return false;
  const kdf = isRecord(value.crypto.kdf) ? value.crypto.kdf : {};
  const cipher = isRecord(value.crypto.cipher) ? value.crypto.cipher : {};

  return (
    value.schema === "receiz.key.v1" &&
    value.name === "Receiz Key" &&
    value.version === 1 &&
    typeof value.issuedAt === "string" &&
    typeof value.keyId === "string" &&
    (value.alg === "Ed25519" || value.alg === "P-256") &&
    typeof value.owner.uid === "string" &&
    typeof value.crypto.publicKeyRawB64u === "string" &&
    typeof value.crypto.privateKeyPkcs8CiphertextB64u === "string" &&
    kdf.name === "PBKDF2-SHA256" &&
    typeof kdf.iterations === "number" &&
    typeof kdf.saltB64u === "string" &&
    cipher.name === "AES-GCM-256" &&
    typeof cipher.ivB64u === "string" &&
    typeof cipher.aad === "string"
  );
}

export function merchantLocalProofObjectFromState(value: unknown) {
  const state = isRecord(value) ? value : {};
  const auth = isRecord(state.auth) ? state.auth : {};
  const receizId = isRecord(auth.receizId) ? auth.receizId : {};

  return {
    connected: receizId.connected === true,
    localProofVerified: receizId.localProofVerified === true,
    handle: normalizedHandle(typeof receizId.handle === "string" ? receizId.handle : ""),
    displayName: normalizedHandle(typeof receizId.displayName === "string" ? receizId.displayName : ""),
    keyFile: proofKeyFileFrom(state, receizId),
    passphrase:
      typeof state.passphrase === "string"
        ? state.passphrase
        : typeof receizId.passphrase === "string"
          ? receizId.passphrase
          : undefined
  };
}

export function merchantSignedPublishProofFromState(value: unknown) {
  const proof = merchantLocalProofObjectFromState(value);
  if (!isReceizKeyFile(proof.keyFile)) return null;

  const ownerUsername = normalizedHandle(proof.keyFile.owner?.username);
  const handle = ownerUsername ? (ownerUsername.includes(".") ? ownerUsername : `${ownerUsername}.receiz.id`) : proof.handle;
  if (!handle) return null;

  return {
    displayName: proof.displayName || normalizedHandle(proof.keyFile.owner?.displayName),
    handle,
    keyFile: proof.keyFile,
    passphrase: proof.passphrase
  };
}

export function merchantProofAuthorityRequirement(input: {
  action: MerchantAuthorityAction;
  delegatedPermission: boolean;
  handle?: string | null;
  localReceizIdConnected?: boolean;
  localProofVerified?: boolean;
  browserReceizIdConnected?: boolean;
  browserProofVerified?: boolean;
  browserProofKeyFile?: unknown;
}): MerchantAuthorityGate {
  const handle = normalizedHandle(input.handle);

  if (input.delegatedPermission) {
    return {
      ok: true,
      handle: handle || "receiz-connected",
      source: "delegated_permission"
    };
  }

  const persistedBrowserProofAvailable =
    input.browserReceizIdConnected === true &&
    input.browserProofVerified === true &&
    isRecord(input.browserProofKeyFile);

  if ((input.localReceizIdConnected && input.localProofVerified) || persistedBrowserProofAvailable) {
    return {
      ok: true,
      handle: handle || "identity-seal",
      source: "proof_object"
    };
  }

  const copy = ACTION_COPY[input.action];

  return {
    ok: false,
    eventType: copy.eventType,
    message: copy.message,
    statusLabel: "Receiz proof object required"
  };
}
