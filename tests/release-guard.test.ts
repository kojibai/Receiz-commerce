import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

const guardScript = join(process.cwd(), "scripts", "next-runtime-guard.mjs");

function runGuard(markerFile: string) {
  return spawnSync(process.execPath, [guardScript, "assert-idle"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      RECEIZ_NEXT_RUNTIME_MARKER: markerFile
    }
  });
}

function tempMarkerPath() {
  return join(mkdtempSync(join(tmpdir(), "receiz-next-runtime-")), "runtime.json");
}

describe("Next runtime release guard", () => {
  it("blocks release builds when a guarded Next runtime is active", () => {
    const markerFile = tempMarkerPath();
    writeFileSync(
      markerFile,
      JSON.stringify({
        command: "next dev -p 3001",
        cwd: process.cwd(),
        mode: "dev",
        pid: process.pid,
        startedAt: "2026-07-01T00:00:00.000Z"
      })
    );

    const result = runGuard(markerFile);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Stop `pnpm dev` or `pnpm start` before running `pnpm build`/);
  });

  it("removes stale runtime markers before allowing release checks", () => {
    const markerFile = tempMarkerPath();
    writeFileSync(
      markerFile,
      JSON.stringify({
        command: "next dev -p 3001",
        cwd: process.cwd(),
        mode: "dev",
        pid: 999999999,
        startedAt: "2026-07-01T00:00:00.000Z"
      })
    );

    const result = runGuard(markerFile);

    assert.equal(result.status, 0);
    assert.equal(existsSync(markerFile), false);
  });

  it("routes local Next commands and release checks through guarded scripts", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    assert.equal(pkg.scripts.dev, "node scripts/next-runtime-guard.mjs dev");
    assert.equal(pkg.scripts.build, "node scripts/next-runtime-guard.mjs build");
    assert.equal(pkg.scripts.start, "node scripts/next-runtime-guard.mjs start");
    assert.equal(pkg.scripts["release:check"], "node scripts/release-check.mjs");
  });
});
