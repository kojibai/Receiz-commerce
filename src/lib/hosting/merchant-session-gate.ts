import type { ProofEventType } from "@/types/domain";

export type MerchantServerAction =
  | "account"
  | "billing"
  | "checkout"
  | "custom_domain"
  | "publish"
  | "verify_domain"
  | "wallet";
export type MerchantServerSessionSource = "receiz_connect" | "identity_seal";

export type MerchantServerSessionGate =
  | {
      ok: true;
      handle: string;
      source: MerchantServerSessionSource;
    }
  | {
      ok: false;
      eventType: ProofEventType;
      message: string;
      statusLabel: string;
    };

const ACTION_COPY: Record<
  MerchantServerAction,
  {
    eventType: ProofEventType;
    message: string;
  }
> = {
  account: {
    eventType: "RECEIZ_ID_CONNECTED",
    message: "Sign in with Receiz ID before using account functions."
  },
  billing: {
    eventType: "BILLING_METHOD_ADDED",
    message: "Sign in with Receiz ID before changing billing."
  },
  checkout: {
    eventType: "ORDER_VERIFIED",
    message: "Sign in with Receiz ID before using checkout."
  },
  custom_domain: {
    eventType: "DOMAIN_CONNECTED",
    message: "Sign in with Receiz ID before connecting a custom domain."
  },
  verify_domain: {
    eventType: "DOMAIN_CONNECTED",
    message: "Sign in with Receiz ID before verifying a custom domain."
  },
  publish: {
    eventType: "SITE_PUBLISHED",
    message: "Sign in with Receiz ID before publishing this store."
  },
  wallet: {
    eventType: "ORDER_VERIFIED",
    message: "Sign in with Receiz ID before using Receiz wallet."
  }
};

function normalizedHandle(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function merchantLocalIdentitySessionFromState(value: unknown) {
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

export function merchantServerSessionRequirement(input: {
  action: MerchantServerAction;
  connected: boolean;
  handle?: string | null;
  localReceizIdConnected?: boolean;
  localProofVerified?: boolean;
}): MerchantServerSessionGate {
  const handle = normalizedHandle(input.handle);

  if (input.connected) {
    return {
      ok: true,
      handle: handle || "receiz-connected",
      source: "receiz_connect"
    };
  }

  if (input.localReceizIdConnected && input.localProofVerified) {
    return {
      ok: true,
      handle: handle || "identity-seal",
      source: "identity_seal"
    };
  }

  const copy = ACTION_COPY[input.action];

  return {
    ok: false,
    eventType: copy.eventType,
    message: copy.message,
    statusLabel: "Receiz ID sign-in required"
  };
}
