"use client";

import { InlineActionFeedback } from "@/components/ActionFeedback";
import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { ActionFeedbackState } from "@/types/action-feedback";
import type { BillingConfig, HostingConfig } from "@/types/domain";
import { platform } from "@/lib/platform";

export function HostingBillingPanel({
  billing,
  hosting,
  onAddPayment,
  onSelectPlan,
  paymentFeedback,
  planFeedback
}: {
  billing: BillingConfig;
  hosting: HostingConfig;
  onAddPayment: (label: string) => void;
  onSelectPlan: (plan: HostingConfig["plan"]) => void;
  paymentFeedback?: ActionFeedbackState;
  planFeedback?: ActionFeedbackState;
}) {
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
          <Button onClick={() => onAddPayment("Receiz wallet + card fallback")} variant="outline">
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
      <div className="settings-list">
        {billing.invoices[0] ? (
          <div>
            <span>Latest invoice</span>
            <strong>{billing.invoices[0].amountLabel} · {billing.invoices[0].status}</strong>
          </div>
        ) : null}
        <div><span>Trial</span><strong>{billing.trialEndsAt}</strong></div>
        <div><span>{platform.freeSubdomainLabel}</span><strong>{hosting.subdomain}</strong></div>
        <div><span>{platform.customDomainLabel}</span><strong>{hosting.customDomain.domain}</strong></div>
        <div><span>Live URL</span><strong>{hosting.liveUrl}</strong></div>
        <div><span>Merchant Receiz account</span><strong>{hosting.merchantReceizId}</strong></div>
      </div>
    </Panel>
  );
}
