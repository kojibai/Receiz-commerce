"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
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
  onVerifyDomain
}: {
  hosting: HostingConfig;
  onSubdomain: (value: string) => void;
  onCustomDomain: (value: string) => void;
  onVerifyDomain: (value: string) => void;
}) {
  const [subdomainDraft, setSubdomainDraft] = useState(hosting.subdomain);
  const [customDomainDraft, setCustomDomainDraft] = useState(hosting.customDomain.domain);

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
              Claim
            </Button>
          </div>
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
              Connect
            </Button>
          </div>
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
            <ul>
              {hosting.customDomain.dnsInstructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ul>
            <Button onClick={() => onVerifyDomain(hosting.customDomain.domain)} variant="outline">
              Verify DNS
            </Button>
          </div>
        ) : null}
      </div>
      <Button onClick={() => onVerifyDomain(hosting.customDomain.domain)} variant="outline">
        Manage hosting
      </Button>
    </Panel>
  );
}
