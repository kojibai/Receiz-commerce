import { Icons } from "@/components/icons";
import { Panel, SectionHeader, StatusPill } from "@/components/ui";
import { platform } from "@/lib/platform";
import type { CommerceState } from "@/types/domain";

export function LaunchRailsPanel({ state }: { state: CommerceState }) {
  const rails = [
    {
      icon: <Icons.globe size={21} />,
      label: platform.freeSubdomainLabel,
      value: state.hosting.subdomain,
      detail: "Included for every store so a non-coder can launch immediately."
    },
    {
      icon: <Icons.lock size={21} />,
      label: platform.customDomainLabel,
      value: state.hosting.customDomain.domain,
      detail: "The monetized upgrade path for brands that want full domain ownership."
    },
    {
      icon: <Icons.receiz size={21} />,
      label: "Receiz primitives",
      value: platform.rails.join(" + "),
      detail: "Receiz proof objects carry identity, checkout, rewards, ledger, and asset truth."
    }
  ];

  return (
    <Panel className="admin-panel launch-rails-panel">
      <SectionHeader
        title={`${platform.name} launch rail`}
        action={<StatusPill tone="green">No code</StatusPill>}
      />
      <div className="launch-rails-hero">
        <span className="receiz-mark">
          <Icons.receiz size={24} />
        </span>
        <div>
          <strong>{platform.tagline}</strong>
          <p>
            Start with a hosted ecommerce site, customize the brand, restore or create
            Receiz ID, seal proof objects, accept Receiz checkout, and upgrade to a custom domain.
            {` ${platform.systemOfRecord} are the system of record.`}
          </p>
        </div>
      </div>
      <div className="launch-rail-grid">
        {rails.map((rail) => (
          <div className="launch-rail-card" key={rail.label}>
            <span>{rail.icon}</span>
            <div>
              <strong>{rail.label}</strong>
              <b>{rail.value}</b>
              <small>{rail.detail}</small>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
