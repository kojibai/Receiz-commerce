import { RECEIZ_V123_CONTRACT } from "@/lib/receiz/v123/contract";
import { RECEIZ_V123_DOCTRINE, RECEIZ_V123_EXAMPLES } from "@/lib/receiz/v123/doctrine";

export const metadata = {
  title: "Receiz v123 source-first developer doctrine",
  description: "Executable integration doctrine for Receiz v123 SDK, MCP, and AI skills.",
};

export default function ReceizDeveloperDoctrinePage() {
  return (
    <main className="legal-page">
      <header className="legal-hero">
        <p className="eyebrow">Receiz v123 · lawful action</p>
        <h1>Representation must never outrank the source.</h1>
        <p>A proof object carries verifiable evidence across institutional boundaries. Governments, platforms, companies, databases, MCP tools, AI systems, receipts, and interfaces may recognize or represent that evidence; none can become the source by describing it.</p>
        <p>This is institution-independent verification, not a claim of immunity from law or institutional process. The highest frame is simpler: truth remains attached to its evidence wherever that evidence travels.</p>
      </header>

      <section className="panel">
        <h2>The v123 authority boundary</h2>
        <ol>
          <li>Exact proof-object bytes and authenticated continuity.</li>
          <li>Explicit human consent and live, scoped proof authority held only at the edge.</li>
          <li>SDK-generated plans, exact persisted intents, and atomic outcomes.</li>
          <li>MCP, AI, server, database, receipt, cache, and UI representations—always non-authoritative.</li>
        </ol>
        <p><strong>SDK:</strong> {RECEIZ_V123_CONTRACT.sdkVersion}</p>
        <p><strong>Registry:</strong> <code>{RECEIZ_V123_CONTRACT.registryDigest}</code></p>
        <p><strong>Operation matrix:</strong> <code>{RECEIZ_V123_CONTRACT.operationMatrixDigest}</code></p>
      </section>

      <section className="panel">
        <h2>What shipped</h2>
        <p><strong>36 operations</strong> in the canonical application matrix, <strong>141 MCP tools</strong> in the complete server, and <strong>42 AI skills</strong> in the exact published skill tree.</p>
        <p>The eight v123 outcomes add canonical world planners, exact-head namespace resolution, proof-authority exchange, granted-scope introspection, exact Phi Settlement and Reserve execution, and lookup-before-retry outcome recovery.</p>
      </section>

      <section className="panel">
        <h2>The 8 mapped v123 outcomes</h2>
        <p>Every row preserves <code>mcpAuthority: false</code>. A named AI skill is shown only when its published manifest explicitly allows the corresponding v123 MCP tool.</p>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>Domain</th><th>MCP tool</th><th>SDK operation</th><th>AI skill</th><th>Required evidence</th></tr></thead>
            <tbody>{RECEIZ_V123_DOCTRINE.map((entry) => (
              <tr key={entry.mcpTool}>
                <td>{entry.domain}</td><td><code>{entry.mcpTool}</code></td><td><code>{entry.sdkOperation}</code></td>
                <td>{entry.aiSkill ?? "No tool-specific manifest grant"}</td><td>{entry.requiredEvidence.join(" · ")}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Implementation law</h2>
        <p>Private identity bytes stay local. Consent is explicit. Bearer authority is memory-only. Generated digests and identities belong to the SDK. Value moves in exact Phi, never USD. Intent is persisted before execution. An unknown outcome requires lookup before retry. Failed authority or exact-head checks produce zero writes.</p>
      </section>

      <section className="panel">
        <h2>Copy-safe examples</h2>
        <h3>SDK</h3><pre><code>{RECEIZ_V123_EXAMPLES.sdk}</code></pre>
        <h3>MCP</h3><pre><code>{RECEIZ_V123_EXAMPLES.mcp}</code></pre>
      </section>
    </main>
  );
}
