import type { ProofEventType } from "@/types/domain";

export type MerchantServerAction = "custom_domain" | "verify_domain" | "publish";

export type MerchantServerSessionGate =
  | {
      ok: true;
      handle: string;
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
  }
};

function normalizedHandle(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
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
      handle: handle || "receiz-connected"
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
