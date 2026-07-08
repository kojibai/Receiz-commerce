#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const git = spawnSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});

if (git.status !== 0) {
  console.error(git.stderr || "Unable to list tracked files for secret scan.");
  process.exit(git.status ?? 1);
}

const files = git.stdout.split("\0").filter(Boolean);
const skippedExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".mp4",
  ".mov"
]);

const tokenPatterns = [
  {
    id: "private_key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----/
  },
  {
    id: "github_token",
    pattern: /\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/
  },
  {
    id: "openai_or_secret_key",
    pattern: /\bsk-[A-Za-z0-9_-]{32,}\b/
  },
  {
    id: "slack_token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/
  }
];

const serverOnlyEnvPattern =
  /^[ \t]*(?!#)([A-Z0-9_]*(?:SECRET|TOKEN|PRIVATE_KEY|API_KEY|ACCESS_KEY)[A-Z0-9_]*)[ \t]*=[ \t]*["']?([^"'\s#][^#\r\n]*)["']?[ \t]*$/gm;

function extensionFor(file) {
  const index = file.lastIndexOf(".");
  return index === -1 ? "" : file.slice(index).toLowerCase();
}

function isPlaceholder(value) {
  const normalized = value.trim().toLowerCase();

  return (
    normalized === "" ||
    normalized === "changeme" ||
    normalized === "change-me" ||
    normalized === "example" ||
    normalized === "placeholder" ||
    normalized === "dummy" ||
    normalized === "test" ||
    normalized.startsWith("test-") ||
    normalized.startsWith("example-") ||
    normalized.startsWith("your_") ||
    normalized.startsWith("your-") ||
    normalized.includes("<") ||
    normalized.includes("...")
  );
}

function lineNumberFor(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

const findings = [];

for (const file of files) {
  if (skippedExtensions.has(extensionFor(file))) continue;

  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  if (content.includes("\0")) continue;

  for (const { id, pattern } of tokenPatterns) {
    const match = pattern.exec(content);
    if (!match) continue;
    findings.push({
      file,
      line: lineNumberFor(content, match.index),
      id
    });
  }

  for (const match of content.matchAll(serverOnlyEnvPattern)) {
    const key = match[1] ?? "";
    const value = match[2] ?? "";
    if (key.startsWith("NEXT_PUBLIC_") || isPlaceholder(value)) continue;

    findings.push({
      file,
      line: lineNumberFor(content, match.index ?? 0),
      id: `server_only_env_value:${key}`
    });
  }
}

if (findings.length > 0) {
  console.error("Potential committed secrets found:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.id}`);
  }
  process.exit(1);
}

console.log(`Secret scan passed (${files.length} tracked files scanned).`);
