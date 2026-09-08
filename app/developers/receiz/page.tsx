import { RECEIZ_V124_CONTRACT } from "@/lib/receiz/v124/contract";
import { RECEIZ_V124_DEVELOPER_SEQUENCE, RECEIZ_V124_DOCTRINE, RECEIZ_V124_EXAMPLES } from "@/lib/receiz/v124/doctrine";

export const metadata = {
  title: "Receiz v124 production-runtime developer doctrine",
  description: "Complete source-first SDK, MCP, and AI-skill doctrine for Receiz v126.0.0.",
};

export default function ReceizDeveloperDoctrinePage() {
  return (
    <main className="legal-page">
      <header className="legal-hero">
        <p className="eyebrow">Receiz v124 · Reality Becomes Infrastructure</p>
        <h1>The production runtime for verified civilization.</h1>
        <p>V124 turns independently verifiable source truth into durable, atomic, privacy-preserving operations that can cross applications and institutions without making any government, company, platform, database, SDK, MCP tool, agent, receipt, or interface the source of that truth.</p>
        <p><strong>Representation must never outrank the source.</strong> This is an institution-independent technical verification boundary—not immunity from applicable law, legitimate process, or human responsibility.</p>
      </header>

      <section className="panel">
        <h2>What v124 makes possible</h2>
        <p>Canonical Kai and proof challenges now feed short-lived server-custodied authority sessions. Those sessions can authorize qualification-gated, durably staged atomic operations across subjects, worlds, inventory, access, ownership, Settlement, and Reserve. Unknown outcomes are recoverable without replaying intent.</p>
        <p>Authenticated replay and checkpoints can travel as sealed proof objects. Private additions remain access-filtered in trusted-host custody. Recipient lookup produces a one-use encrypted locator instead of exposing destination identity or head coordinates. Exact Phi intent can bind to that locator before execution.</p>
        <p>V124.0.3 also makes sealed media directly playable from a proof-bearing URL. Fully inline <code>rma2</code> capsules verify without transport lookup; compact <code>rmc1</code> heads reconstruct committed segments before the enclosing artifact is verified. The 4,096-character limit applies only to the public coordinate, never to the sealed truth.</p>
      </section>

      <section className="panel">
        <h2>Exact release identity</h2>
        <p>The coordinated release contains 60 application operations, 221 MCP tools, and 43 AI skills.</p>
        <p><strong>Application:</strong> {RECEIZ_V124_CONTRACT.applicationVersion} · <strong>SDK/MCP/skills:</strong> {RECEIZ_V124_CONTRACT.sdkVersion} · <strong>Ruleset:</strong> {RECEIZ_V124_CONTRACT.rulesetVersion}</p>
        <p><strong>Registry:</strong> <code>{RECEIZ_V124_CONTRACT.registryDigest}</code></p>
        <p><strong>Operation matrix:</strong> <code>{RECEIZ_V124_CONTRACT.operationMatrixDigest}</code></p>
        <p><strong>Inventory:</strong> {RECEIZ_V124_CONTRACT.operationCount} app operations · {RECEIZ_V124_CONTRACT.mcpToolCount} MCP tools ({RECEIZ_V124_CONTRACT.v124McpToolCount} integrated v124 tools) · {RECEIZ_V124_CONTRACT.aiSkillCount} AI skills · {RECEIZ_V124_CONTRACT.aiManifestCount} manifests · {RECEIZ_V124_CONTRACT.openAiPromptCount} OpenAI prompts.</p>
        <p>Package release <code>126.0.0</code> and constitutional ruleset <code>126.0.0</code> are separate coordinates. Never derive one from the other.</p>
      </section>

      <section className="panel">
        <h2>Portable proof presentation</h2>
        <p><code>receiz_material_url_open</code> reconstructs and verifies URL-carried sealed material before returning playable image, audio, video, PDF, text, or binary payload bytes. The app applies that path at <code>/verify#material=…</code> and exposes the canonical Receiz proof link beside the local projection.</p>
        <p><code>receiz_sealed_kai_moment</code> derives a deterministic identity moment only from an already sealed creation pulse. Device time, browser time, process uptime, session state, and live <code>receiz_v124_kai_now</code> freshness cannot redefine an existing identity glyph.</p>
        <p>Both tools, composite transport, developer-owned presentation domains, object URLs, SDK results, MCP responses, and UI remain representations beneath the sealed proof object.</p>
      </section>

      <section className="panel">
        <h2>The non-negotiable sequence</h2>
        <ol>{RECEIZ_V124_DEVELOPER_SEQUENCE.map((step) => <li key={step}>{step}</li>)}</ol>
        <p>A failed decision writes zero. A staged handle, session projection, qualification report, recipient locator, database row, MCP reference, and terminal receipt are all subordinate representations.</p>
      </section>

      <section className="panel">
        <h2>All 22 v124 runtime tools</h2>
        <p>Every MCP row is explicitly non-authoritative. AI skills are listed only where the published manifest grants that exact tool.</p>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>MCP tool</th><th>Canonical SDK method</th><th>Published AI skill grants</th><th>Custody and outcome</th></tr></thead>
            <tbody>{RECEIZ_V124_DOCTRINE.map((entry) => (
              <tr key={entry.mcpTool}>
                <td><code>{entry.mcpTool}</code></td>
                <td><code>{entry.sdkMethod}</code></td>
                <td>{entry.aiSkills.join(" · ")}</td>
                <td>{entry.outcome}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Impossible-by-construction boundaries</h2>
        <ul>
          <li>JSON copies cannot mint session, plan, handle, private-addition, replay-candidate, or sealed-source custody.</li>
          <li>Mutation is blocked until the exact operation reports healthy and available.</li>
          <li>An unknown outcome can only be resolved by its original execution or semantic-idempotency coordinate.</li>
          <li>An exported replay candidate cannot restore until canonical Record → Seal creates a verified sealed source.</li>
          <li>Exact private additions never leave trusted-host custody or enter model context.</li>
          <li>Recipient identity and destination head stay server-side behind a one-use purpose-bound encrypted locator.</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Copy-safe integration</h2>
        <h3>SDK runtime</h3><pre><code>{RECEIZ_V124_EXAMPLES.sdk}</code></pre>
        <h3>MCP and AI skills</h3><pre><code>{RECEIZ_V124_EXAMPLES.mcp}</code></pre>
        <p>Read-only operational status is available at <code>/api/receiz/v124/runtime</code>. It intentionally strips exact scopes and dependency heads, and its report is never proof or operational authority.</p>
      </section>
    </main>
  );
}
