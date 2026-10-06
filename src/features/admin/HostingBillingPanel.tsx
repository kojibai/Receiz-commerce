"use client";

import { InlineActionFeedback } from "@/components/ActionFeedback";
import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { ActionFeedbackState } from "@/types/action-feedback";
import type { BillingConfig, HostingConfig } from "@/types/domain";
import { platform } from "@/lib/platform";
import { HOSTING_RENEWAL_WINDOW_MS } from "@/lib/hosting/renewal-period";

export function HostingBillingPanel({
  billing,
  hosting,
  merchantReceizAccount,
  onAddPayment,
  onSelectPlan,
  onRenew,
  onCheckPayment,
  paymentFeedback,
  planFeedback,
  statusFeedback
}: {
  billing: BillingConfig;
  hosting: HostingConfig;
  merchantReceizAccount?: string;
  onAddPayment: (label: string) => void;
  onSelectPlan: (plan: HostingConfig["plan"]) => void;
  onRenew: (plan: HostingConfig["plan"]) => void;
  onCheckPayment: () => void;
  paymentFeedback?: ActionFeedbackState;
  planFeedback?: ActionFeedbackState;
  statusFeedback?: ActionFeedbackState;
}) {
  const merchantAccount = merchantReceizAccount?.trim() || hosting.merchantReceizId;
  const pending = Boolean(hosting.pendingBillingRenewalToken);
  const busy = planFeedback?.status === "pending" && !pending;
  const paidThrough = billing.paidThrough ? Date.parse(billing.paidThrough) : NaN;
  const canRenew = Number.isFinite(paidThrough) && paidThrough - Date.now() <= HOSTING_RENEWAL_WINDOW_MS;
  const paidPlan = hosting.plan !== "starter" ? hosting.plan : billing.plan && billing.plan !== "starter" ? billing.plan : undefined;
  const offeredPeriod = hosting.pendingBillingPeriod;
  const shortDate = (value: string) => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "";

  return (
    <Panel className="admin-panel hosting-billing-panel">
      <SectionHeader
        title="Hosting billing"
        action={<StatusPill tone={billing.status === "active" ? "green" : "gold"}>{billing.status}</StatusPill>}
      />
      <div className="billing-summary">
        <span className="billing-icon">
          <Icons.creditCard size={22} />
        </span>
        <div>
          <strong>{billing.monthlyTotalLabel}</strong>
          <p>{billing.paymentMethodLabel}</p>
        </div>
        <div className="action-feedback-stack compact">
          <Button disabled={busy || pending} onClick={() => onAddPayment("Receiz wallet + card fallback")} variant="outline">
            {paymentFeedback?.status === "pending" ? "Connecting" : paymentFeedback?.status === "success" ? "Connected" : "Connect billing"}
          </Button>
          <InlineActionFeedback feedback={paymentFeedback} />
        </div>
      </div>
      <div className="plan-choice-list">
        {billing.plans.map((plan) => (
          <button
            className={hosting.plan === plan.id ? "plan-choice active" : "plan-choice"}
            key={plan.id}
            disabled={busy || pending || (hosting.plan === plan.id && billing.status === "active")}
            onClick={() => onSelectPlan(plan.id)}
            type="button"
          >
            <span>
              <strong>{plan.name}</strong>
              {plan.recommended ? <em>Recommended</em> : null}
            </span>
            <b>{plan.priceLabel}</b>
            <small>{plan.description}</small>
          </button>
        ))}
      </div>
      <InlineActionFeedback feedback={planFeedback} />
      {billing.renewalMode === "in_app" || pending ? (
        <div className="hosting-renewal-card">
          <div>
            <strong>{pending ? "Renewal payment pending" : "Monthly renewal in this app"}</strong>
            <p>{Number.isFinite(paidThrough) ? `Paid through ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(paidThrough))}.` : "Complete the original payment to activate your month."}</p>
            {pending && offeredPeriod ? <p>Service month: {shortDate(offeredPeriod.startsAt)} – {shortDate(offeredPeriod.paidThrough)}</p> : null}
            <small>{pending ? "Resume this payment or check its status before starting another." : "Pay for one calendar month at a time. Renewal opens 14 days before this month ends."}</small>
          </div>
          <div className="hosting-renewal-actions">
            {pending && hosting.pendingBillingPlan ? (
              <Button onClick={() => onSelectPlan(hosting.pendingBillingPlan!)}>Resume payment</Button>
            ) : paidPlan ? (
              <Button disabled={busy || !canRenew} onClick={() => onRenew(paidPlan)}>Renew for one month</Button>
            ) : null}
            <Button disabled={statusFeedback?.status === "pending"} onClick={onCheckPayment} variant="outline">
              {statusFeedback?.status === "pending" ? "Checking payment" : "Check hosting payment"}
            </Button>
          </div>
          <InlineActionFeedback feedback={statusFeedback} />
        </div>
      ) : null}
      <div className="settings-list">
        {billing.invoices[0] ? (
          <div>
            <span>Latest invoice</span>
            <strong>{billing.invoices[0].amountLabel} · {billing.invoices[0].status}</strong>
          </div>
        ) : null}
        <div><span>{billing.renewalMode === "in_app" ? "Renewal" : "Billing"}</span><strong>{billing.trialEndsAt}</strong></div>
        <div><span>{platform.freeSubdomainLabel}</span><strong>{hosting.subdomain}</strong></div>
        <div><span>{platform.customDomainLabel}</span><strong>{hosting.customDomain.domain}</strong></div>
        <div><span>Live URL</span><strong>{hosting.liveUrl}</strong></div>
        <div><span>Merchant Receiz account</span><strong>{merchantAccount}</strong></div>
      </div>
    </Panel>
  );
}
