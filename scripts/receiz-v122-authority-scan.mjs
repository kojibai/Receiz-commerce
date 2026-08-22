import { readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RULES = Object.freeze([
  {
    code: "PROJECTION_AS_AUTHORITY_FORBIDDEN",
    test: (source) => /(?:canonical)?state\.[A-Za-z0-9_$.[\]]+\s*=\s*[^;\n]*(?:projection|receipt|mcp|session|cache)/i.test(source),
  },
  {
    code: "USD_AS_MOVED_AUTHORITY_FORBIDDEN",
    test: (source) => /amountPhiMicro\s*=\s*[^;\n]*(?:amountUsd|usdCents|quotedUsd)/i.test(source)
      || /amountPhiMicro\s*:\s*(?:body|input|request)\.(?:amountUsd|usdCents|quotedUsd)/i.test(source),
  },
  {
    code: "UNKNOWN_OUTCOME_NORMALIZATION_FORBIDDEN",
    test: (source) => /status\s*===?\s*["']unknown["'][^\n;?]*\?\s*["'](?:failure|failed|zero-write)["']/i.test(source)
      || /case\s+["']unknown["'][\s\S]{0,120}status\s*:\s*["'](?:failure|failed|zero-write)["']/i.test(source),
  },
  {
    code: "AI_OUTPUT_DIRECT_EVENT_FORBIDDEN",
    test: (source) => /(?:events?|history)\.(?:push|append)\(\s*(?:modelOutput|aiOutput|modelResponse|aiResponse)\b/i.test(source),
  },
  {
    code: "NATIVE_ARTIFACT_REPACK_FORBIDDEN",
    test: (source) => /new\s+(?:Blob|File)\s*\(\s*\[[^\]]*(?:exactArtifactBytes|sealedArtifactBytes)/i.test(source),
  },
  {
    code: "PAYLOAD_FALLBACK_AUTHORITY_FORBIDDEN",
    test: (source) => /\b(?:artifactPayload|proofPayload)\b\s*=\s*[^;\n]*\?\?\s*(?:body|payload|projection|cache)/i.test(source),
  },
]);

function finding(code, path) {
  return Object.freeze({ code, path, blocking: true, authority: "sealed-receiz-proof-object" });
}

export function scanReceizV122Authority(source, path) {
  const findings = [];
  const normalizedPath = path.replaceAll("\\", "/");
  const clientBoundaryAllowed = normalizedPath.endsWith("src/lib/receiz/adapter.ts") || normalizedPath.startsWith("receiz/");
  if (!clientBoundaryAllowed && /\bcreateReceizClient\s*\(/.test(source)) findings.push(finding("SDK_CLIENT_BOUNDARY_FORBIDDEN", path));
  if (normalizedPath.startsWith("app/api/") && /\bprivatePayload\s*:/.test(source)) findings.push(finding("PRIVATE_WORLD_PLAINTEXT_TRANSPORT_FORBIDDEN", path));
  if (normalizedPath.startsWith("app/api/") && /\b(?:accessKit|edgeWrappingKey|encryptedPrivateKeyB64u)\s*:/.test(source)) findings.push(finding("PRIVATE_ACCESS_MATERIAL_TRANSPORT_FORBIDDEN", path));
  for (const rule of RULES) if (rule.test(source)) findings.push(finding(rule.code, path));
  return findings.sort((left, right) => left.code.localeCompare(right.code) || left.path.localeCompare(right.path));
}

function sourceFiles(root, directory) {
  const files = [];
  const walk = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || [".next", ".test-build", "node_modules"].includes(entry.name)) continue;
      const child = resolve(path, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name) && statSync(child).isFile()) files.push(child);
    }
  };
  walk(resolve(root, directory));
  return files;
}

export function scanReceizV122Repository(root = process.cwd()) {
  const findings = [];
  for (const directory of ["app", "src", "receiz"]) {
    for (const path of sourceFiles(root, directory)) {
      findings.push(...scanReceizV122Authority(readFileSync(path, "utf8"), relative(root, path)));
    }
  }
  return Object.freeze({
    schema: "receiz.v122.authority-scan.v1",
    ok: findings.length === 0,
    findings: Object.freeze(findings.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code))),
    authority: Object.freeze({ scannerIsProofAuthority: false, strongerTruth: "sealed-receiz-proof-object" }),
  });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = scanReceizV122Repository(resolve(process.cwd()));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 2;
}
