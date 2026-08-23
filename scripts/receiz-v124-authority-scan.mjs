import { readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { scanReceizV123Authority } from "./receiz-v123-authority-scan.mjs";

const finding = (code, path) => Object.freeze({ code, path, blocking: true, authority: "sealed-receiz-proof-object" });

export function scanReceizV124Authority(source, path) {
  const findings = [...scanReceizV123Authority(source, path)];
  const normalized = path.replaceAll("\\", "/");
  const coordinator = normalized.endsWith("src/lib/receiz/v124/production-runtime.ts");
  const adapter = normalized.endsWith("src/lib/receiz/adapter.ts");

  if (/JSON\.parse\([\s\S]{0,180}\bas\s+(?:ReceizAuthoritySessionV124|ReceizDurableExecutionHandleV124|ReceizOperationPlanV124)/.test(source)) {
    findings.push(finding("V124_JSON_AUTHORITY_RECONSTRUCTION_FORBIDDEN", path));
  }
  if (!coordinator && !adapter && /\.v124\.execution\.(?:stage|stagePrepared|execute|cancel)\s*\(/.test(source)) {
    findings.push(finding("V124_EXECUTION_OUTSIDE_CUSTODIED_RUNTIME_FORBIDDEN", path));
  }
  if (!coordinator && !adapter && /verifiedPrivateAdditionsV124\s*\(/.test(source)) {
    findings.push(finding("V124_PRIVATE_ADDITIONS_OUTSIDE_TRUSTED_HOST_FORBIDDEN", path));
  }
  if (!coordinator && !adapter && /(?:restoreVerifiedReplayProofObjectV124|publishSealedSourceV124)\s*\(/.test(source)) {
    findings.push(finding("V124_SEALED_SOURCE_CUSTODY_BYPASS_FORBIDDEN", path));
  }
  if (/status\s*===?\s*["']unknown["'][\s\S]{0,220}\.(?:stage|execute)\s*\(/i.test(source)) {
    findings.push(finding("V124_UNKNOWN_OUTCOME_RETRY_FORBIDDEN", path));
  }
  if (/privateAdditionsRef[\s\S]{0,160}\b(?:additions|exactBytesB64u|ciphertextB64u)\s*:/.test(source)) {
    findings.push(finding("V124_PRIVATE_RESULT_PROJECTION_FORBIDDEN", path));
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

export function scanReceizV124Repository(root = process.cwd()) {
  const findings = [];
  for (const directory of ["app", "src", "receiz"]) {
    for (const path of sourceFiles(root, directory)) findings.push(...scanReceizV124Authority(readFileSync(path, "utf8"), relative(root, path)));
  }
  return Object.freeze({
    schema: "receiz.v124.authority-scan.v1",
    ok: findings.length === 0,
    findings: Object.freeze(findings.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code))),
    authority: Object.freeze({ scannerIsProofAuthority: false, strongerTruth: "sealed-receiz-proof-object" }),
  });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = scanReceizV124Repository(resolve(process.cwd()));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 2;
}
