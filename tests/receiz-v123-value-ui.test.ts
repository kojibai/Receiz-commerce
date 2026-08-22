import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";

it("ships the complete edge-held v123 value ceremony in the account", () => {
  const source = readFileSync("src/features/account/ReceizValueRails.tsx", "utf8");
  assert.match(source, /Exact identity proof object/);
  assert.match(source, /Exact application challenge/);
  assert.match(source, /explicit consent/i);
  assert.match(source, /createReceizProofAuthoritySessionV123/);
  assert.match(source, /createReceizValueExecutionCoordinatorV123/);
  assert.match(source, /signReceizProofAuthorityChallengeAtEdgeV123/);
  assert.match(source, /Execute exact Phi/);
  assert.match(source, /Recover exact outcome/);
  assert.match(source, /Authority held in memory only/);
  assert.doesNotMatch(source, /localStorage\.setItem\([^)]*(?:accessToken|authority)/);
  assert.doesNotMatch(source, /accessToken/);
  assert.doesNotMatch(source, /JSON\.stringify\(authoritySummary/);
});
