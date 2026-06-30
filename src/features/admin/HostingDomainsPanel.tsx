"use client";

import { useEffect, useState } from "react";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { HostingConfig } from "@/types/domain";
import { platform } from "@/lib/platform";

export function HostingDomainsPanel({
  hosting,
  onSubdomain,
  onCustomDomain
}: {
  hosting: HostingConfig;
  onSubdomain: (value: string) => void;
  onCustomDomain: (value: string) => void;
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
      <SectionHeader title="Hosting & domains" action={<StatusPill tone="green">{platform.domain}</StatusPill>} />
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
          <StatusPill tone="green">Valid</StatusPill>
        </div>
      </div>
      <Button variant="outline">Manage hosting</Button>
    </Panel>
  );
}
