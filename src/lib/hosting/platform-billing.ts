import type { BillingConfig, HostingConfig } from "@/types/domain";

export type PlatformBillingReceipt = {
  ok: boolean;
  mode?: string;
  paid?: boolean;
  amountUsd?: string;
  message?: string;
};

export function platformPaymentConfirmed(receipt: PlatformBillingReceipt) {
  return receipt.ok && receipt.paid === true;
}

function amountLabel(amountUsd: string | undefined) {
  const amount = Number(String(amountUsd ?? "0").replace(/[^0-9.]/g, ""));
  return `$${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;
}

function paymentMethodLabel(receipt: PlatformBillingReceipt) {
  if (receipt.paid && receipt.mode === "live") return "Receiz live billing";
  if (receipt.paid && receipt.mode === "proof_object_wallet_first") return "Proof object wallet-first billing";
  if (receipt.paid && receipt.mode === "no_charge") return "No-charge hosting";
  if (receipt.mode === "sandbox") return "Sandbox billing - payment not collected";
  return "Payment pending";
}

export function hostingBillingFromPlatformPayment(
  current: BillingConfig,
  plan: HostingConfig["plan"],
  receipt: PlatformBillingReceipt
): BillingConfig {
  const paid = platformPaymentConfirmed(receipt);
  const invoiceAmount = amountLabel(receipt.amountUsd);
  const invoiceStatus = paid ? "paid" as const : "open" as const;

  return {
    ...current,
    status: paid ? "active" : "trial",
    paymentMethodLabel: paymentMethodLabel(receipt),
    trialEndsAt: paid ? "Active subscription" : receipt.message ?? "Payment not collected",
    invoices: [
      {
        id: `inv-${plan}-${Date.now()}`,
        dateLabel: "Today",
        amountLabel: invoiceAmount,
        status: invoiceStatus
      },
      ...current.invoices.filter((invoice) => invoice.id !== `inv-${plan}`)
    ]
  };
}

export function hostingPlanUpdateFromPlatformPayment(
  current: HostingConfig,
  plan: HostingConfig["plan"],
  receipt: PlatformBillingReceipt
): { ok: true; hosting: HostingConfig; message: string } | { ok: false; hosting: HostingConfig; message: string } {
  if (plan !== "starter" && !platformPaymentConfirmed(receipt)) {
    return {
      ok: false,
      hosting: current,
      message: receipt.message
        ? `Payment not confirmed: ${receipt.message}`
        : "Paid hosting requires confirmed Receiz wallet or card settlement."
    };
  }

  return {
    ok: true,
    hosting: { ...current, plan },
    message: plan === "starter" ? "Free starter hosting active" : "Paid hosting confirmed"
  };
}
