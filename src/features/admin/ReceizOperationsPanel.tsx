"use client";

import { Panel, SectionHeader, StatusPill } from "@/components/ui";
import { RECEIZ_V124_CONTRACT } from "@/lib/receiz/v124/contract";
import { RECEIZ_V124_DOCTRINE } from "@/lib/receiz/v124/doctrine";

export function ReceizOperationsPanel() {
  return (
    <Panel className="admin-panel">
      <SectionHeader title="Receiz v124 production runtime" action={<StatusPill tone="green">22 mapped</StatusPill>} />
      <p><strong>Operator UI is not proof or operational authority.</strong> Every mutation requires exact SDK custody and a healthy qualification for the named operation.</p>
      <div className="settings-list">
        <div><span>SDK / ruleset</span><strong>{RECEIZ_V124_CONTRACT.sdkVersion} / {RECEIZ_V124_CONTRACT.rulesetVersion}</strong></div>
        <div><span>v124 MCP parity</span><strong>{RECEIZ_V124_DOCTRINE.length}/22 · non-authoritative</strong></div>
        <div><span>Application matrix</span><strong>{RECEIZ_V124_CONTRACT.operationCount} operations</strong></div>
        <div><span>AI skills</span><strong>{RECEIZ_V124_CONTRACT.aiSkillCount} exact published skills</strong></div>
        <div><span>Package skew</span><strong>Release blocked on mismatch</strong></div>
        <div><span>Sessions and handles</span><strong>Trusted-host custody · never JSON authority</strong></div>
        <div><span>Private additions</span><strong>Exact result never enters model context</strong></div>
        <div><span>Denials</span><strong>Exact code · zero writes</strong></div>
        <div><span>Unknown outcomes</span><strong>Lookup before retry</strong></div>
        <div><span>Release gates</span><strong>Migration · scan · tests · lock</strong></div>
      </div>
      <details>
        <summary>Exact plan and confirmation inventory</summary>
        <ul>{RECEIZ_V124_DOCTRINE.map((entry) => <li key={entry.mcpTool}><code>{entry.mcpTool}</code> → {entry.sdkMethod}</li>)}</ul>
      </details>
    </Panel>
  );
}
