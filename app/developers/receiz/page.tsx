import { RECEIZ_MCP_TOOLS } from "@receiz/mcp-server";
import { RECEIZ_V122_CONTRACT } from "@/lib/receiz/v122/contract";
import { RECEIZ_V122_DOCTRINE, RECEIZ_V122_EXAMPLES } from "@/lib/receiz/v122/doctrine";

export const metadata = {
  title: "Receiz v122 source-first developer doctrine",
  description: "Executable integration doctrine for Receiz v122 SDK, MCP, and AI skills.",
};

const artifactTools = RECEIZ_MCP_TOOLS.filter((tool) => tool.name.startsWith("receiz_artifact_")).slice(0, 9);

export default function ReceizDeveloperDoctrinePage() {
  return (
    <main className="legal-page">
      <header className="legal-hero">
        <p className="eyebrow">Receiz v122 · executable doctrine</p>
        <h1>Representation must never outrank the source.</h1>
        <p>A sealed proof object and independently admitted continuity remain stronger than governments, institutions, corporations, databases, servers, SDKs, MCP, AI, receipts, caches, and interfaces—not by institutional claim, but because the source carries its own verifiable evidence.</p>
      </header>

      <section className="panel">
        <h2>Authority hierarchy</h2>
        <ol>
          <li>Exact native Record → Seal proof-object bytes.</li>
          <li>Independent verification and admitted append-only history.</li>
          <li>Typed SDK plans and atomic execution bound to exact heads.</li>
          <li>MCP, AI, server, database, receipt, cache, and UI representations—always non-authoritative.</li>
        </ol>
        <p><strong>SDK:</strong> {RECEIZ_V122_CONTRACT.sdkVersion}</p>
        <p><strong>Registry:</strong> <code>{RECEIZ_V122_CONTRACT.registryDigest}</code></p>
        <p><strong>Operation matrix:</strong> <code>{RECEIZ_V122_CONTRACT.operationMatrixDigest}</code></p>
      </section>

      <section className="panel">
        <h2>The 19 maintained v122 outcomes</h2>
        <p>Every row maps the SDK, MCP, and AI skill while preserving <code>mcpAuthority: false</code>.</p>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>Domain</th><th>MCP tool</th><th>SDK operation</th><th>Strongest source</th><th>Required evidence</th></tr></thead>
            <tbody>{RECEIZ_V122_DOCTRINE.map((entry) => (
              <tr key={entry.mcpTool}>
                <td>{entry.domain}</td><td><code>{entry.mcpTool}</code></td><td><code>{entry.sdkOperation}</code></td>
                <td>{entry.strongestSource}</td><td>{entry.requiredEvidence.join(" · ")}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Continuity already inherited</h2>
        <p>The nine artifact MCP tools remain below exact artifact verification. The inherited subject, Twin, world, memory, mandate, transaction, runtime, and bearer families retain command-only mutation, exact-head binding, zero-write failure, and append-only history.</p>
        <p><strong>Artifact tools represented:</strong> {artifactTools.map((tool) => tool.name).join(", ")}</p>
        <p><strong>Canonical language:</strong> plan is not commit; receipt is report-only; projection is not proof; model output is intent; unknown is unresolved; Settlement is not Reserve; USD is display-only; private plaintext stays at the edge.</p>
      </section>

      <section className="panel">
        <h2>Copy-safe examples</h2>
        <h3>SDK</h3><pre><code>{RECEIZ_V122_EXAMPLES.sdk}</code></pre>
        <h3>MCP</h3><pre><code>{RECEIZ_V122_EXAMPLES.mcp}</code></pre>
      </section>

      <section className="panel">
        <h2>Release evidence</h2>
        <p>Release is blocked unless exact package identities, registry and matrix digests, 40 AI skills, all 19 MCP operations, static authority scanning, negative law tests, migration verification, and the final release lock agree.</p>
      </section>
    </main>
  );
}
