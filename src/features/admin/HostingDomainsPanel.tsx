"use client";

import { useEffect, useState } from "react";
import { InlineActionFeedback } from "@/components/ActionFeedback";
import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { ActionFeedbackState } from "@/types/action-feedback";
import type { DomainStatus, HostingConfig } from "@/types/domain";
import { platform } from "@/lib/platform";

function statusTone(status: DomainStatus["status"]) {
  if (status === "active" || status === "connected" || status === "ready") return "green";
  if (status === "pending" || status === "needs_dns" || status === "payment_required") return "gold";
  if (status === "error") return "pink";
  return "neutral";
}

export function HostingDomainsPanel({
  hosting,
  onSubdomain,
  onCustomDomain,
  onVerifyDomain,
  subdomainFeedback,
  customDomainFeedback,
  verifyDomainFeedback
}: {
  hosting: HostingConfig;
  onSubdomain: (value: string) => void | Promise<void>;
  onCustomDomain: (value: string) => void | Promise<void>;
  onVerifyDomain: (value: string) => void | Promise<void>;
  subdomainFeedback?: ActionFeedbackState;
  customDomainFeedback?: ActionFeedbackState;
  verifyDomainFeedback?: ActionFeedbackState;
}) {
  const [subdomainDraft, setSubdomainDraft] = useState(hosting.subdomain);
  const [customDomainDraft, setCustomDomainDraft] = useState(hosting.customDomain.domain);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setSubdomainDraft(hosting.subdomain);
  }, [hosting.subdomain]);

  useEffect(() => {
    setCustomDomainDraft(hosting.customDomain.domain);
  }, [hosting.customDomain.domain]);

  const claimSubdomain = () => {
    const value = subdomainDraft.trim();
    if (value) onSubdomain(value);
  };

  const connectCustomDomain = () => {
    const value = customDomainDraft.trim();
    if (value) onCustomDomain(value);
  };

  const verifyCustomDomain = async () => {
    const value = (hosting.customDomain.domain || customDomainDraft).trim();
    if (!value || verifying) return;

    setVerifying(true);
    try {
      await onVerifyDomain(value);
    } finally {
      setVerifying(false);
    }
  };

  const copyRecordValue = async (key: string, value: string) => {
    if (!navigator.clipboard) return;

    await navigator.clipboard.writeText(value);
    setCopiedRecord(key);
    window.setTimeout(() => setCopiedRecord((current) => (current === key ? null : current)), 1600);
  };

  const dnsRecords = hosting.customDomain.dnsRecords ?? [];

  return (
    <Panel className="admin-panel">
      <SectionHeader
        title="Hosting & domains"
        action={<StatusPill tone={statusTone(hosting.subdomainStatus.status)}>{platform.domain}</StatusPill>}
      />
      <div className="hosting-fields">
        <label>
          <span>{platform.freeSubdomainLabel}</span>
          <div className="domain-input-row">
            <input
              aria-label="Subdomain"
              value={subdomainDraft}
              onChange={(event) => setSubdomainDraft(event.target.value)}
            />
            <Button onClick={claimSubdomain} variant="outline">
              {subdomainFeedback?.status === "pending" ? "Claiming" : subdomainFeedback?.status === "success" ? "Claimed" : "Claim"}
            </Button>
          </div>
          <InlineActionFeedback feedback={subdomainFeedback} />
        </label>
        <div className="domain-live-row">
          <div>
            <strong>{hosting.subdomain}</strong>
            <span>{hosting.subdomainStatus.message ?? "Hosted subdomain"}</span>
          </div>
          <StatusPill tone={statusTone(hosting.subdomainStatus.status)}>{hosting.subdomainStatus.status}</StatusPill>
          <a aria-label="Open subdomain" className="icon-button" href={hosting.liveUrl} target="_blank" rel="noreferrer">
            <Icons.external size={16} />
          </a>
        </div>
        <label>
          <span>{platform.customDomainLabel}</span>
          <div className="domain-input-row">
            <input
              aria-label="Custom domain"
              value={customDomainDraft}
              onChange={(event) => setCustomDomainDraft(event.target.value)}
            />
            <Button onClick={connectCustomDomain} variant="outline">
              {customDomainFeedback?.status === "pending" ? "Connecting" : customDomainFeedback?.status === "success" ? "Connected" : "Connect"}
            </Button>
          </div>
          <InlineActionFeedback feedback={customDomainFeedback} />
        </label>
        <div className="domain-status-row">
          <span>SSL certificate</span>
          <StatusPill tone={hosting.customDomain.sslStatus === "valid" ? "green" : "gold"}>
            {hosting.customDomain.sslStatus}
          </StatusPill>
        </div>
        <div className="domain-live-row">
          <div>
            <strong>{hosting.customDomain.domain}</strong>
            <span>{hosting.customDomain.message ?? "Custom domain"}</span>
          </div>
          <StatusPill tone={statusTone(hosting.customDomain.status)}>{hosting.customDomain.status}</StatusPill>
          <a
            aria-label="Open custom domain"
            className="icon-button"
            href={hosting.customDomain.liveUrl ?? `https://${hosting.customDomain.domain}`}
            target="_blank"
            rel="noreferrer"
          >
            <Icons.external size={16} />
          </a>
        </div>
        {hosting.customDomain.dnsInstructions?.length ? (
          <div className="domain-proof-box">
            <strong>DNS records to add</strong>
            {dnsRecords.length ? (
              <div className="domain-dns-record-list">
                {dnsRecords.map((record) => {
                  const key = `${record.type}:${record.host}:${record.value}`;
                  return (
                    <div className="domain-dns-record" key={key}>
                      <span>{record.type}</span>
                      <div>
                        <strong>{record.host}</strong>
                        <code>{record.value}</code>
                      </div>
                      <button
                        aria-label={`Copy ${record.type} value ${record.value}`}
                        className="icon-button domain-copy-button"
                        onClick={() => void copyRecordValue(key, record.value)}
                        type="button"
                      >
                        <Icons.copy size={15} />
                        <small>{copiedRecord === key ? "Copied" : "Copy"}</small>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ul>
                {hosting.customDomain.dnsInstructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ul>
            )}
            {hosting.customDomain.lastCheckedAt ? (
              <small className="domain-last-checked">
                Last checked {hosting.customDomain.lastCheckedAt === "now" ? "now" : new Date(hosting.customDomain.lastCheckedAt).toLocaleTimeString()}
              </small>
            ) : null}
            <Button disabled={verifying || !hosting.customDomain.domain} onClick={verifyCustomDomain} variant="outline">
              {verifying ? "Checking DNS" : "Verify DNS"}
            </Button>
            <InlineActionFeedback feedback={verifyDomainFeedback} />
          </div>
        ) : null}
      </div>
      <div className="action-feedback-stack">
        <Button disabled={verifying || !hosting.customDomain.domain} onClick={verifyCustomDomain} variant="outline">
          Manage hosting
        </Button>
        <InlineActionFeedback feedback={verifyDomainFeedback} />
      </div>
    </Panel>
  );
}
