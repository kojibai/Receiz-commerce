"use client";

import { Panel, SectionHeader, StatusPill } from "@/components/ui";
import { RECEIZ_V122_CONTRACT } from "@/lib/receiz/v122/contract";
import { RECEIZ_V122_DOCTRINE } from "@/lib/receiz/v122/doctrine";

export function ReceizOperationsPanel() {
  return (
    <Panel className="admin-panel">
      <SectionHeader title="Receiz v122 constitutional operations" action={<StatusPill tone="green">19 mapped</StatusPill>} />
      <p><strong>Operator UI is not proof authority.</strong> Every write waits until the exact plan, tool, input, effects, heads, and confirmation digest are visible.</p>
      <div className="settings-list">
        <div><span>SDK</span><strong>{RECEIZ_V122_CONTRACT.sdkVersion}</strong></div>
        <div><span>MCP parity</span><strong>{RECEIZ_V122_DOCTRINE.length}/19 · non-authoritative</strong></div>
        <div><span>Package skew</span><strong>Release blocked on mismatch</strong></div>
        <div><span>Plans and stages</span><strong>Report-only until atomic acceptance</strong></div>
        <div><span>Denials</span><strong>Exact code · zero writes</strong></div>
        <div><span>Unknown outcomes</span><strong>Lookup before retry</strong></div>
        <div><span>Release gates</span><strong>Migration · scan · tests · lock</strong></div>
      </div>
      <details>
        <summary>Exact plan and confirmation inventory</summary>
        <ul>{RECEIZ_V122_DOCTRINE.map((entry) => <li key={entry.mcpTool}><code>{entry.mcpTool}</code> → {entry.sdkOperation}</li>)}</ul>
      </details>
    </Panel>
  );
}
