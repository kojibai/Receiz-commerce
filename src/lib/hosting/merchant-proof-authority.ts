import type { ProofEventType } from "@/types/domain";

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
