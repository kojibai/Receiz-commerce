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
    message: "Present a verified Receiz proof object or continue with Receiz ID proof before using account functions."
  },
  billing: {
    eventType: "BILLING_METHOD_ADDED",
    message: "Present a verified Receiz proof object or continue with Receiz ID proof before changing billing."
  },
  checkout: {
    eventType: "ORDER_VERIFIED",
    message: "Present a verified Receiz proof object or continue with Receiz ID proof before using checkout."
  },
  custom_domain: {
    eventType: "DOMAIN_CONNECTED",
    message: "Present a verified Receiz proof object or continue with Receiz ID proof before connecting a custom domain."
  },
  verify_domain: {
    eventType: "DOMAIN_CONNECTED",
    message: "Present a verified Receiz proof object or continue with Receiz ID proof before verifying a custom domain."
  },
  publish: {
    eventType: "SITE_PUBLISHED",
    message: "Present a verified Receiz proof object or continue with Receiz ID proof before publishing this store."
  },
  wallet: {
    eventType: "ORDER_VERIFIED",
    message: "Present a verified Receiz proof object or continue with Receiz ID proof before using Receiz wallet."
  }
};

function normalizedHandle(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function merchantLocalProofObjectFromState(value: unknown) {
  const state = isRecord(value) ? value : {};
  const auth = isRecord(state.auth) ? state.auth : {};
  const receizId = isRecord(auth.receizId) ? auth.receizId : {};

  return {
    connected: receizId.connected === true,
    localProofVerified: receizId.localProofVerified === true,
    handle: normalizedHandle(typeof receizId.handle === "string" ? receizId.handle : ""),
    displayName: normalizedHandle(typeof receizId.displayName === "string" ? receizId.displayName : "")
  };
}

export function merchantProofAuthorityRequirement(input: {
  action: MerchantAuthorityAction;
  delegatedPermission: boolean;
  handle?: string | null;
  localReceizIdConnected?: boolean;
  localProofVerified?: boolean;
}): MerchantAuthorityGate {
  const handle = normalizedHandle(input.handle);

  if (input.delegatedPermission) {
    return {
      ok: true,
      handle: handle || "receiz-connected",
      source: "delegated_permission"
    };
  }

  if (input.localReceizIdConnected && input.localProofVerified) {
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
