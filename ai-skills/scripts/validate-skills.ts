import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, normalize, relative, resolve } from "node:path";

type SkillSpec = {
  name: string;
  resources: string[];
  examples: string[];
};

const root = resolve(process.cwd(), "ai-skills");

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
  if (manifest.schema !== "receiz.ai-skill-contract.v106" || manifest.name !== name) {
    fail(`${name}/manifest.json has invalid schema or name`);
  }
  const serialized = JSON.stringify(manifest);
  for (const required of [
    ">=106.0.0 <107.0.0",
    "bf851c209e807309672c0f466411baa5607ce6b3195fe4eb16755edfeb7f5a1a",
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

assertPath(join(root, "README.md"));
for (const skill of skills) assertSkill(skill);
for (const skill of constitutionalSkills) assertConstitutionalSkill(skill);

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

console.log(`ai-skills validation passed for ${skills.length + constitutionalSkills.length} skills.`);
