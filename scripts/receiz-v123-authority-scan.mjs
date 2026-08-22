import { readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { scanReceizV122Authority } from "./receiz-v122-authority-scan.mjs";

const finding = (code, path) => Object.freeze({
  code,
  path,
  blocking: true,
  authority: "sealed-receiz-proof-object",
});

export function scanReceizV123Authority(source, path) {
  const findings = [...scanReceizV122Authority(source, path)];
  const normalizedPath = path.replaceAll("\\", "/");
  const edgeAuthorityModule = normalizedPath.endsWith("src/lib/receiz/v123/proof-authority.ts");

  if (/\b(?:localStorage|sessionStorage)\.setItem\([\s\S]{0,200}\b(?:accessToken|proofAuthority|bearer)/i.test(source)) {
    findings.push(finding("BEARER_AUTHORITY_PERSISTENCE_FORBIDDEN", path));
  }
  if (!edgeAuthorityModule && /\b(?:exchangeProofAuthority|createReceizProofAuthorityExchangeV123)\s*\(/.test(source)) {
    findings.push(finding("PROOF_AUTHORITY_EXCHANGE_OUTSIDE_EDGE_FORBIDDEN", path));
  }
  if (/\b(?:planCommand|planTransaction)[A-Za-z0-9_]*\s*\([\s\S]{0,240}\b(?:body|input|request)\.(?:commandDigest|transactionDigest|commandId|transactionId|authorityDigest)\b/.test(source)) {
    findings.push(finding("CALLER_GENERATED_SECURITY_FIELD_FORBIDDEN", path));
  }
  if (/status\s*===?\s*["']unknown["'][\s\S]{0,160}\b(?:execute|executeSettlement|executeReserve)\s*\(/i.test(source)) {
    findings.push(finding("UNKNOWN_VALUE_RETRY_BEFORE_LOOKUP_FORBIDDEN", path));
  }

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

export function scanReceizV123Repository(root = process.cwd()) {
  const findings = [];
  for (const directory of ["app", "src", "receiz"]) {
    for (const path of sourceFiles(root, directory)) {
      findings.push(...scanReceizV123Authority(readFileSync(path, "utf8"), relative(root, path)));
    }
  }
  return Object.freeze({
    schema: "receiz.v123.authority-scan.v1",
    ok: findings.length === 0,
    findings: Object.freeze(findings.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code))),
    authority: Object.freeze({ scannerIsProofAuthority: false, strongerTruth: "sealed-receiz-proof-object" }),
  });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = scanReceizV123Repository(resolve(process.cwd()));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 2;
}
