import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type SkillSpec = {
  name: string;
  resources: string[];
  examples: string[];
};

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const skills: SkillSpec[] = [
  {
    name: "receiz-app-builder-skill",
    resources: ["workflow.md", "authority-boundaries.md", "generated-file-repair.md", "upgrade-rules.md"],
    examples: ["commerce.md", "marketplace.md", "persistent-world.md", "ai-operated.md", "profile-portfolio.md", "content-publishing.md", "proof-verifier.md", "minimal-proof-object.md"],
  },
  {
    name: "receiz-proof-skill",
    resources: [
      "receiz-laws.md",
      "proof-object-model.md",
      "verification-flow.md",
      "output-templates.md",
      "failure-modes.md",
      "mcp-tool-map.md",
      "sdk-reference.md",
    ],
    examples: ["verify-card.md", "verify-product.md", "verify-post.md", "verify-pack.md", "verify-vault.md"],
  },
  {
    name: "receiz-builder-skill",
    resources: [
      "sdk-quickstart.md",
      "app-patterns.md",
      "no-db-pattern.md",
      "proof-native-ui-patterns.md",
      "deployment-checklist.md",
      "generated-code-rules.md",
    ],
    examples: ["create-storefront.md", "create-marketplace.md", "create-proof-page.md", "create-pack-app.md", "create-profile-vault.md"],
  },
  {
    name: "receiz-mcp-agent-skill",
    resources: [
      "mcp-tool-map.md",
      "agent-operating-rules.md",
      "safe-tool-calling.md",
      "auth-boundaries.md",
      "action-confirmation-rules.md",
      "response-templates.md",
    ],
    examples: ["agent-verify-object.md", "agent-build-app.md", "agent-append-proof.md", "agent-inspect-vault.md"],
  },
  {
    name: "receiz-commerce-skill",
    resources: [
      "commerce-object-model.md",
      "product-proof-flow.md",
      "storefront-patterns.md",
      "order-and-receipt-boundaries.md",
      "seller-buyer-language.md",
      "conversion-copy-patterns.md",
    ],
    examples: ["create-product-page.md", "create-no-db-store.md", "verify-product-ownership.md", "explain-receiz-commerce.md"],
  },
  {
    name: "receiz-sports-card-skill",
    resources: [
      "sports-card-object-model.md",
      "card-memory-law.md",
      "live-event-append-flow.md",
      "rarity-and-event-language.md",
      "mlb-proof-language.md",
      "game-surface-patterns.md",
    ],
    examples: ["explain-player-card.md", "explain-live-event-card.md", "explain-pack-opening.md", "explain-card-market.md", "explain-geo-appeal.md"],
  },
  {
    name: "receiz-offline-verifier-skill",
    resources: [
      "offline-verification-law.md",
      "verifier-flow.md",
      "artifact-over-server.md",
      "airplane-mode-principle.md",
      "security-boundaries.md",
    ],
    examples: ["verify-offline-asset.md", "explain-offline-proof.md", "debug-verification-failure.md"],
  },
  {
    name: "receiz-distribution-skill",
    resources: [
      "qr-activation-flow.md",
      "pack-derby-model.md",
      "venue-playbook.md",
      "affiliate-boundaries.md",
      "staff-training-script.md",
      "conversion-language.md",
    ],
    examples: ["create-bar-flyer-copy.md", "create-venue-one-pager.md", "explain-pack-derby.md", "create-restaurant-activation.md"],
  },
  {
    name: "receiz-skill-bundle",
    resources: [
      "skill-routing.md",
      "combined-agent-behavior.md",
      "when-to-use-each-skill.md",
      "canonical-receiz-language.md",
    ],
    examples: [],
  },
];

const constitutionalSkills = [
  "receiz-architecture",
  "receiz-domain-builder",
  "receiz-constitutional-laws",
  "receiz-command-builder",
  "receiz-authority-security",
  "receiz-deterministic-replay",
  "receiz-offline-first",
  "receiz-causal-sync",
  "receiz-portable-artifacts",
  "receiz-migrations",
  "receiz-performance",
  "receiz-observability",
  "receiz-testing",
  "receiz-release",
  "receiz-build-production-system",
] as const;

const operationSkills = [
  "receiz-identity-profile",
  "receiz-portable-continuity",
  "receiz-bearer-ownership",
  "receiz-offline-command",
  "receiz-proof-media",
  "receiz-cross-app-state",
  "receiz-receipt-admission",
] as const;

const artifactSkills = [
  "receiz-portable-artifacts",
  "receiz-proof-skill",
  "receiz-offline-verifier-skill",
  "receiz-cross-app-state",
  "receiz-app-builder-skill",
  "receiz-migrations",
  "receiz-testing",
  "receiz-release",
] as const;

const artifactRegistryDigest = "cf02d0bce6ad1541cfe84e27bfb1036777b29616bf8a1e5aeafb899a945e359a";
const artifactLaws = Array.from({ length: 20 }, (_, index) => `ARTIFACT-${String(index + 1).padStart(3, "0")}`);
const artifactSdkOperations = [
  "assets.createProofObject", "artifacts.download", "artifacts.verifyAndOpen", "artifacts.admit",
  "artifacts.planRecovery", "artifacts.admitAndRecover", "artifacts.commitRecovery",
] as const;
const artifactEvidence = [
  "exact-artifact-byte-identity", "artifact-digest-match", "payload-digest-binding", "signature-v4",
  "owner-claim-binding", "independent-artifact-verification", "cross-platform-round-trip",
  "legacy-read-compatibility", "release-lock-pass", "zero-network-verification", "local-verifier-result",
  "unified-admission-verdicts", "explicit-permitted-actions", "verified-proof-history",
  "zero-network-read-only-coordinator", "atomic-recovery-commit", "operation-identity-parity",
  "multi-application-convergence",
] as const;
const artifactCompletionFields = [
  "sdk-version", "registry-digest", "artifact-law-version", "artifact-carrier", "signature-version",
  "artifact-digest", "payload-digest", "owner-and-claim-binding", "independent-verification-result",
  "cross-platform-round-trip-result", "legacy-compatibility-result", "release-lock-result",
  "network-calls-during-verification", "local-verifier-result",
  "admission-verdict", "permitted-actions", "proof-history-digest", "recovery-plan-digest",
  "operation-identity", "atomic-commit-result",
] as const;
const artifactCompletionLabels = [
  "SDK version:", "Registry digest:", "Artifact law version:", "Artifact carrier:", "Signature version:",
  "Artifact digest:", "Payload digest:", "Owner and claim binding:", "Independent verification result:",
  "Cross-platform round-trip result:", "Legacy compatibility result:", "Release-lock result:",
  "Network calls during verification: 0", "Local verifier result:",
  "Admission verdict:", "Permitted actions:", "Proof history digest:", "Recovery plan digest:",
  "Operation identity:", "Atomic commit result:",
] as const;
const artifactProhibitions = [
  "Never download an unsealed payload fallback.",
  "Never call an inner payload a Receiz artifact.",
  "Never relabel payload bytes as a Receiz artifact.",
  "Never repack, wrap, recompress, or modify native Record -> Seal bytes.",
  "Never treat shape validation as artifact verification.",
  "Never delete unknown cross-application namespaces.",
  "Never rewrite immutable ownership or provenance history.",
  "Never weaken a failing test to accept payload-only continuity.",
  "Never claim success from UI rendering alone.",
  "Never admit a card-only payload as a Receiz artifact.",
  "Never treat an explanation as proof authority.",
  "Never accept raw capability JSON as recovery authority.",
] as const;

const compatibilityOperationSections = [
  "## Exact SDK operation",
  "## Required authority",
  "## Required proof head",
  "## Idempotency",
  "## Offline behavior",
  "## Conflict behavior",
  "## Receipt verification",
  "## User confirmation",
  "## MCP parity",
  "## Emulator fixture",
] as const;

const currentOutcomeSections: Record<string, readonly string[]> = {
  "receiz-identity-profile": [
    "## Exact SDK operation", "## Required authority", "## Required admission", "## Deterministic behavior",
    "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
  ],
  "receiz-bearer-ownership": [
    "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
    "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
  ],
  "receiz-proof-media": [
    "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
    "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
  ],
  "receiz-portable-continuity": [
    "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
    "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
  ],
  "receiz-offline-command": [
    "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
    "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
  ],
  "receiz-cross-app-state": [
    "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
    "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
  ],
  "receiz-receipt-admission": [
    "## Exact SDK operation", "## Required authority", "## Required proof object", "## Deterministic behavior",
    "## Offline behavior", "## Conflict behavior", "## Result verification", "## User confirmation", "## MCP parity", "## Emulator fixture",
  ],
};

const currentOutcomeEvidence: Record<string, readonly string[]> = {
  "receiz-identity-profile": ["same-account-uid-result"],
  "receiz-bearer-ownership": ["complete-artifact-verification", "native-record-seal"],
  "receiz-proof-media": ["complete-artifact-verification", "native-record-seal", "same-account-uid-result"],
  "receiz-portable-continuity": ["complete-artifact-verification", "native-record-seal", "same-account-uid-result"],
  "receiz-offline-command": ["queued-not-global-admission", "independent-artifact-verification"],
  "receiz-cross-app-state": ["complete-artifact-verification", "native-record-seal", "same-account-uid-result"],
  "receiz-receipt-admission": ["complete-artifact-verification", "independent-artifact-verification"],
};

const requiredSections = [
  "## When To Use This Skill",
  "## When Not To Use This Skill",
  "## Core Receiz Laws",
  "## Required Behavior",
  "## Forbidden Behavior",
  "## MCP Usage Rules",
  "## SDK Usage Rules",
  "## Output Format",
  "## Safety And Security Boundaries",
  "## Examples",
];

const placeholderPattern = /\b(TODO|TBD)\b|lorem ipsum|fake[_ -]?api|placeholder api|someapi|fooapi|barapi/i;
const secretPattern =
  /(sk-[a-zA-Z0-9]{20,}|xox[baprs]-[a-zA-Z0-9-]{20,}|ghp_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY)/;
const envAssignmentPattern = /\b[A-Z][A-Z0-9_]{2,}\s*=\s*["']?[^"'\s<>]+/;
const liveVerificationPattern = /(live verification|verified live|live-verified|live verified)/i;
const mcpReferencePattern = /(MCP|receiz_[a-z0-9_]+)/;

const failures: string[] = [];

function fail(message: string): void {
  failures.push(message);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function markdownFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...markdownFiles(path));
    if (stat.isFile() && entry.endsWith(".md")) out.push(path);
  }
  return out;
}

function assertPath(path: string): void {
  if (!existsSync(path)) fail(`Missing ${relative(process.cwd(), path)}`);
}

function assertMarkdownLinks(file: string, text: string): void {
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
  for (const match of text.matchAll(linkPattern)) {
    const target = match[1]?.trim();
    if (!target || target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#")) continue;
    const withoutAnchor = target.split("#")[0] ?? "";
    if (!withoutAnchor || withoutAnchor.startsWith("mailto:")) continue;
    const targetPath = normalize(resolve(file, "..", withoutAnchor));
    if (!targetPath.startsWith(root)) continue;
    if (!existsSync(targetPath)) fail(`${relative(process.cwd(), file)} links to missing ${target}`);
  }
}

function assertSkill(skill: SkillSpec): void {
  const skillDir = join(root, skill.name);
  const skillFile = join(skillDir, "SKILL.md");
  assertPath(skillFile);
  for (const resource of skill.resources) assertPath(join(skillDir, "resources", resource));
  for (const example of skill.examples) assertPath(join(skillDir, "examples", example));
  if (!existsSync(skillFile)) return;

  const text = read(skillFile);
  if (!text.startsWith("---\n")) fail(`${skill.name}/SKILL.md is missing YAML frontmatter`);
  if (!new RegExp(`name:\\s*${skill.name}\\n`).test(text)) fail(`${skill.name}/SKILL.md frontmatter name mismatch`);
  if (!/description:\s*Use when/.test(text)) fail(`${skill.name}/SKILL.md description must start with Use when`);
  if (!text.includes(`# ${skill.name}`)) fail(`${skill.name}/SKILL.md must include the skill name as the H1`);
  for (const section of requiredSections) {
    if (!text.includes(section)) fail(`${skill.name}/SKILL.md missing section ${section}`);
  }
  if (!text.includes("Never treat a database, server, marketplace, UI, model response, or cache as final authority.")) {
    fail(`${skill.name}/SKILL.md missing final-authority law`);
  }
  assertMarkdownLinks(skillFile, text);
}

function assertConstitutionalSkill(name: (typeof constitutionalSkills)[number]): void {
  const skillDir = join(root, name);
  const skillFile = join(skillDir, "SKILL.md");
  const manifestFile = join(skillDir, "manifest.json");
  assertPath(skillFile);
  assertPath(manifestFile);
  assertPath(join(skillDir, "agents", "openai.yaml"));
  if (!existsSync(skillFile) || !existsSync(manifestFile)) return;

  const text = read(skillFile);
  const manifest = JSON.parse(read(manifestFile)) as Record<string, unknown>;
  if (!new RegExp(`^---\\nname: ${name}\\ndescription: Use when `).test(text)) {
    fail(`${name}/SKILL.md has invalid discovery frontmatter`);
  }
  for (const section of ["## Constitutional workflow", "## Machine contract", "## Quick reference", "## Common mistakes", "## Completion refusal", "## Example"]) {
    if (!text.includes(section)) fail(`${name}/SKILL.md missing section ${section}`);
  }
  if (manifest.schema !== "receiz.ai-skill-contract.v111" || manifest.name !== name || manifest.version !== "111.0.0") {
    fail(`${name}/manifest.json has invalid schema or name`);
  }
  const serialized = JSON.stringify(manifest);
  for (const required of [
    ">=111.0.0 <112.0.0",
    "cf02d0bce6ad1541cfe84e27bfb1036777b29616bf8a1e5aeafb899a945e359a",
    "direct-state-write",
    "history-rewrite",
    "authority-bypass",
    "independent-verifier",
    "release-lock-pass",
    "inspect-plan-scaffold-test",
  ]) {
    if (!serialized.includes(required)) fail(`${name}/manifest.json missing ${required}`);
  }
  assertMarkdownLinks(skillFile, text);
}

function assertOperationSkill(name: (typeof operationSkills)[number]): void {
  const skillDir = join(root, name);
  const skillFile = join(skillDir, "SKILL.md");
  const manifestFile = join(skillDir, "manifest.json");
  assertPath(skillFile);
  assertPath(manifestFile);
  assertPath(join(skillDir, "agents", "openai.yaml"));
  if (!existsSync(skillFile) || !existsSync(manifestFile)) return;

  const text = read(skillFile);
  const manifest = JSON.parse(read(manifestFile)) as Record<string, unknown>;
  if (!new RegExp(`^---\\nname: ${name}\\ndescription: Use when `).test(text)) {
    fail(`${name}/SKILL.md has invalid discovery frontmatter`);
  }
  for (const section of currentOutcomeSections[name] ?? compatibilityOperationSections) {
    if (!text.includes(section)) fail(`${name}/SKILL.md missing section ${section}`);
  }
  if (!/```ts[\s\S]*createReceizClient[\s\S]*```/.test(text)) fail(`${name}/SKILL.md missing copy-paste TypeScript`);
  if (manifest.schema !== "receiz.ai-skill-contract.v111" || manifest.name !== name || manifest.version !== "111.0.0") {
    fail(`${name}/manifest.json has invalid schema, name, or version`);
  }
  const serialized = JSON.stringify(manifest);
  for (const required of [
    ">=111.0.0 <112.0.0",
    "111.0.0",
    "cf02d0bce6ad1541cfe84e27bfb1036777b29616bf8a1e5aeafb899a945e359a",
    "emulator-conformance",
    "release-lock-pass",
    "inspect-plan-simulate",
  ]) {
    if (!serialized.includes(required)) fail(`${name}/manifest.json missing ${required}`);
  }
  for (const field of ["sdkOperations", "allowedTools", "requiredScopes", "emulatorFixtures", "requiredEvidence"]) {
    const value = manifest[field];
    const readOnlyLocalScope = field === "requiredScopes" && name === "receiz-receipt-admission";
    if (!Array.isArray(value) || (!readOnlyLocalScope && value.length === 0)) fail(`${name}/manifest.json missing ${field}`);
  }
  const nativeEvidence = currentOutcomeEvidence[name];
  if (nativeEvidence) {
    for (const required of nativeEvidence) {
      if (!serialized.includes(required)) fail(`${name}/manifest.json missing ${required}`);
    }
    if (/identity\.getProfile|identity\.restoreAccount|identity\.appendAccountState|continuity\.reconcile|continuity\.commit|offline\.createCommandQueue|offline\.executeOrQueue|proofHead\.get|receipts\.verify|identityKeyId|expectedOwnershipHead|claimantKeyId|receiz_proof_head_get|receiz_receipt_verify|receiz_continuity_sync_plan|receiz_continuity_sync_execute|media\.publishIdentityImage/.test(text + serialized)) {
      fail(`${name} retains a retired obsolete-versioned prerequisite in the active v111 outcome`);
    }
    if (/## Required proof head|## Receipt verification/.test(text)) {
      fail(`${name}/SKILL.md retains a retired obsolete-versioned current-outcome section`);
    }
  } else if (!serialized.includes("receipt-verification")) {
    fail(`${name}/manifest.json missing receipt-verification compatibility evidence`);
  }
  assertMarkdownLinks(skillFile, text);
}

function assertArtifactSkill(name: (typeof artifactSkills)[number]): void {
  const skillDir = join(root, name);
  const skillFile = join(skillDir, "SKILL.md");
  const manifestFile = join(skillDir, "manifest.json");
  assertPath(skillFile);
  assertPath(manifestFile);
  if (!existsSync(skillFile) || !existsSync(manifestFile)) return;

  const text = read(skillFile);
  const manifest = JSON.parse(read(manifestFile)) as Record<string, unknown>;
  const requires = manifest.requires as Record<string, unknown> | undefined;
  if (!text.includes("A Receiz artifact is the exact byte sequence returned by native Record -> Seal. The inner payload is never an acceptable substitute.")) {
    fail(`${name}/SKILL.md missing binding artifact law`);
  }
  for (const operation of artifactSdkOperations) {
    if (!text.includes(`receiz.${operation}`)) fail(`${name}/SKILL.md missing receiz.${operation}`);
  }
  for (const label of artifactCompletionLabels) {
    if (!text.includes(label)) fail(`${name}/SKILL.md missing completion field ${label}`);
  }
  for (const prohibition of artifactProhibitions) {
    if (!text.includes(prohibition)) fail(`${name}/SKILL.md missing prohibition ${prohibition}`);
  }
  if (!/refuse to (?:call|say|report|claim).*production-ready|refuse production-ready completion/i.test(text)) {
    fail(`${name}/SKILL.md must refuse production-ready completion without evidence`);
  }

  if (manifest.schema !== "receiz.ai-skill-contract.v111" || manifest.name !== name || manifest.version !== "111.0.0") {
    fail(`${name}/manifest.json has invalid v111 schema, name, or version`);
  }
  if (requires?.ruleset !== "111.0.0" || requires.registryDigest !== artifactRegistryDigest) {
    fail(`${name}/manifest.json has artifact registry or ruleset skew`);
  }
  if (manifest.artifactLawVersion !== "111.0.0" || JSON.stringify(manifest.artifactLaws) !== JSON.stringify(artifactLaws)) {
    fail(`${name}/manifest.json has artifact law version or law-set skew`);
  }
  const sdkOperations = Array.isArray(manifest.sdkOperations) ? manifest.sdkOperations : [];
  const evidence = Array.isArray(manifest.requiredEvidence) ? manifest.requiredEvidence : [];
  const forbidden = Array.isArray(manifest.forbiddenOperations) ? manifest.forbiddenOperations : [];
  for (const operation of artifactSdkOperations) {
    if (!sdkOperations.includes(operation)) fail(`${name}/manifest.json missing ${operation}`);
  }
  for (const required of artifactEvidence) {
    if (!evidence.includes(required)) fail(`${name}/manifest.json missing ${required}`);
  }
  for (const required of ["payload-fallback", "payload-relabel-as-artifact", "artifact-repack", "shape-only-verification", "history-rewrite"]) {
    if (!forbidden.includes(required)) fail(`${name}/manifest.json missing ${required}`);
  }
  if (JSON.stringify(manifest.requiredCompletionFields) !== JSON.stringify(artifactCompletionFields)) {
    fail(`${name}/manifest.json requiredCompletionFields do not match shared artifact law`);
  }
  assertMarkdownLinks(skillFile, text);
}

assertPath(join(root, "README.md"));
for (const skill of skills) assertSkill(skill);
for (const skill of constitutionalSkills) assertConstitutionalSkill(skill);
for (const skill of operationSkills) assertOperationSkill(skill);
for (const skill of artifactSkills) assertArtifactSkill(skill);

for (const file of markdownFiles(root)) {
  const text = read(file);
  const rel = relative(process.cwd(), file);
  if (placeholderPattern.test(text)) fail(`${rel} contains placeholder or fake API wording`);
  if (secretPattern.test(text)) fail(`${rel} contains a secret token pattern`);
  if (envAssignmentPattern.test(text)) fail(`${rel} contains an environment assignment`);
  if (liveVerificationPattern.test(text) && !mcpReferencePattern.test(text)) {
    fail(`${rel} claims live verification without an MCP/tool reference`);
  }
  assertMarkdownLinks(file, text);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`ai-skills validation passed for ${skills.length + constitutionalSkills.length + operationSkills.length} skills.`);
