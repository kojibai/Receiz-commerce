import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RECEIZ_SDK_VERSION = "113.0.0";
const RECEIZ_V113_REGISTRY_DIGEST = "4c4aa85f9785d205dcf7e4e5109837a83f8c3bf8e166130ae7e87353f299c637";
const RECEIZ_V113_OPERATION_MATRIX_DIGEST = "091ab9e6b3acb05283510a19754e53c637dbd96b47b499a524dc44c34f8e783b";

function canonicalize(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const optionValue = (args, option) => {
  const index = args.indexOf(option);
  return index === -1 ? undefined : args[index + 1];
};

function inspectOfficialUpgrade(root) {
  const cli = resolve(root, "node_modules", "@receiz", "sdk", "dist", "cli.js");
  if (!existsSync(cli)) throw new Error("receiz_cli_binary_missing");
  const result = spawnSync(process.execPath, [cli, "app", "upgrade", "--root", root, "--target", RECEIZ_SDK_VERSION, "--json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`receiz_v113_upgrade_inspection_failed:${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

const root = resolve(optionValue(process.argv.slice(2), "--root") ?? process.cwd());
const plan = inspectOfficialUpgrade(root);
const pkg = json(join(root, "package.json"));
const registry = json(join(root, "receiz.constitution.json"));
const app = json(join(root, "receiz.app.json"));
const attestation = json(join(root, "receiz.migration.v112-v113.json"));
const appRegistryDigest = createHash("sha256").update(canonicalize(registry)).digest("hex");
const packageNames = ["@receiz/sdk", "@receiz/mcp-server", "@receiz/ai-skills"];

const checks = [
  { id: "official-v113-upgrade-inspection", ok: plan.schema === "receiz.app.upgrade_plan.v1" && plan.targetVersion === RECEIZ_SDK_VERSION },
  { id: "integration-compliant", ok: plan.actions.length === 0 && plan.findings.every((finding) => finding.disposition === "satisfied") },
  { id: "packages-exact", ok: packageNames.every((name) => pkg.dependencies?.[name] === RECEIZ_SDK_VERSION) },
  { id: "registry-valid", ok: registry.schema === "receiz.constitution.registry.v1" && registry.version === RECEIZ_SDK_VERSION && registry.laws.length === 57 },
  { id: "registry-chains-canonical-v113", ok: registry.previousRegistryDigest === RECEIZ_V113_REGISTRY_DIGEST },
  { id: "protocol-limits-pinned", ok: registry.protocolLimits?.reconciliationAdditions === 64 && registry.protocolLimits?.remotePredecessorFetches === 256 },
  { id: "operation-matrix-complete", ok: app.operations?.length === 11 && attestation.operationMatrixDigest === RECEIZ_V113_OPERATION_MATRIX_DIGEST },
  { id: "app-registry-attested", ok: attestation.appRegistryDigest === appRegistryDigest },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false },
  { id: "named-coordination-domain", ok: attestation.globalMeansNamedCoordinationDomain === true },
  { id: "database-beneath-artifact", ok: attestation.databaseManufacturesArtifactTruth === false },
  { id: "connect-token-not-authority", ok: attestation.connectTokenIsArtifactAuthority === false },
  { id: "known-artifact-first-paint", ok: attestation.knownArtifactFirstPaintBeforeRemoteStartup === true },
  { id: "remote-resolution-reverified", ok: attestation.remoteArtifactBytesIndependentlyReverified === true },
  { id: "structural-divergence-only", ok: attestation.offlineDivergenceResolution === "structural-only" && attestation.autoMergeOrRebase === false && attestation.lastWriteWins === false },
  { id: "handoff-authority-verified", ok: attestation.everyHistoricalOwnershipHandoffIndependentlyVerified === true },
  { id: "immutable-staging", ok: attestation.stagedCandidateImmutableAndDigestBound === true },
  { id: "atomic-expected-head", ok: attestation.atomicExpectedHeadAcceptance === true },
  { id: "acceptance-effects-separated", ok: attestation.acceptedMeansEffectsDelivered === false },
  { id: "indeterminate-preserved", ok: attestation.indeterminateMeansFailed === false },
  { id: "local-verification-offline", ok: attestation.localArtifactVerificationNetworkCalls === 0 },
  { id: "stronger-truth-preserved", ok: attestation.strongerTruth === "sealed-receiz-proof-object" },
];

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v112-v113.migration-verification.v1",
  sdkVersion: RECEIZ_SDK_VERSION,
  mode: "audited-global-coordination-upgrade",
  canonicalRegistryDigest: RECEIZ_V113_REGISTRY_DIGEST,
  operationMatrixDigest: RECEIZ_V113_OPERATION_MATRIX_DIGEST,
  appRegistryDigest,
  actionsPending: plan.actions.length,
  historyRewritten: false,
  checks,
  authority: {
    globalMeansNamedCoordinationDomain: true,
    receiptIsProofAuthority: false,
    acceptanceIsUniversalConsensus: false,
    strongerTruth: "sealed-receiz-proof-object",
  },
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 2;
